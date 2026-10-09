import Trade from "../models/trades.js";
import PullJob from "../models/PullJob.js";
import { publishPullFinished, publishTradesUpdated } from "./pullEvents.js";

const BASE_URL = process.env.BSE_API_URL || "http://localhost:3000";
const BATCH_SIZE = 100;

async function fetchTradeBatch(cursor) {
    const url = new URL("/getTrades", BASE_URL);
    url.searchParams.set("cursor", cursor);
    url.searchParams.set("limit", BATCH_SIZE);

    const response = await fetch(url, {
        signal: AbortSignal.timeout(25000)
    });

    if (!response.ok) {
        throw new Error(`Base API returned ${response.status}`);
    }

    return response.json();
}

function validateTradeBatch(result, cursor) {
    if (
        !result ||
        !Array.isArray(result.trades) ||
        typeof result.hasMore !== "boolean"
    ) {
        throw new Error("Base API returned an invalid trade batch response");
    }

    if (result.hasMore && (!Number.isInteger(result.nextCursor) || result.nextCursor <= cursor)) {
        throw new Error("Base API returned an invalid next cursor");
    }

    if (result.trades.length === 0 && result.hasMore) {
        throw new Error("Base API returned an empty batch while more trades are available");
    }

    return result.trades;
}

async function saveTradeBatch(batch) {
    await Trade.bulkWrite(
        batch.map((trade) => ({
            updateOne: {
                filter: { tradeId: trade.tradeId },
                update: { $set: trade },
                upsert: true
            }
        })),
        { ordered: false }
    );
}

export async function executePull(jobId, { repairSavedPrefix = false } = {}) {
    try {
        const job = await PullJob.findById(jobId);

        if (!job) {
            throw new Error("Pull job not found");
        }

        let cursor = job.cursor;

        if (repairSavedPrefix && cursor > 0) {
            console.log(`Verifying saved trades before resuming from cursor ${cursor}`);
            let repairCursor = 0;

            while (repairCursor < cursor) {
                const result = await fetchTradeBatch(repairCursor);
                const batch = validateTradeBatch(result, repairCursor);

                if (batch.length === 0) {
                    throw new Error("Base API ended before the saved pull cursor");
                }

                await saveTradeBatch(batch);
                repairCursor += batch.length;
                publishTradesUpdated(jobId, batch, job);

                if (!result.hasMore && repairCursor < cursor) {
                    throw new Error("Base API ended before the saved pull cursor");
                }
            }
        }

        while (true) {
            console.log(`Fetching trades from cursor ${cursor}`);
            const result = await fetchTradeBatch(cursor);
            const batch = validateTradeBatch(result, cursor);

            if (batch.length > 0) {
                await saveTradeBatch(batch);

                cursor = result.nextCursor;
                const updatedJob = await PullJob.findByIdAndUpdate(jobId, {
                    cursor,
                    $inc: { totalPulled: batch.length }
                }, { new: true });
                publishTradesUpdated(jobId, batch, updatedJob);
            }

            console.log(`Received ${batch.length} trades`);

            if (!result.hasMore) {
                break;
            }
        }

        await PullJob.findByIdAndUpdate(jobId, {
            status: "COMPLETED",
            completedAt: new Date()
        });
        publishPullFinished(jobId, "COMPLETED");
        console.log("Trade pull completed");
    } catch (error) {
        console.error("Trade pull failed:", error.message);
        await PullJob.findByIdAndUpdate(jobId, {
            status: "FAILED",
            error: error.message
        });
        publishPullFinished(jobId, "FAILED");
    }
}