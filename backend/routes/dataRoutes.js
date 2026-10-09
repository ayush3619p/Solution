import express from "express";
import PullJob from "../models/PullJob.js";
import Trade from "../models/trades.js";
import { withPullJobLock } from "../services/pullJobLock.js";

const router = express.Router();

router.delete("/", async (req, res) => {
    try {
        const result = await withPullJobLock(async () => {
            const runningJob = await PullJob.findOne({ status: "RUNNING" });

            if (runningJob) {
                return { runningJob };
            }

            const [trades, jobs] = await Promise.all([
                Trade.deleteMany({}),
                PullJob.deleteMany({})
            ]);

            return { deletedTrades: trades.deletedCount, deletedJobs: jobs.deletedCount };
        });

        if (result.runningJob) {
            return res.status(409).json({
                message: "Cannot clear data while a trade sync is running.",
                jobId: result.runningJob._id
            });
        }

        return res.json({
            message: "All trades and pull-job history have been deleted.",
            deletedTrades: result.deletedTrades,
            deletedJobs: result.deletedJobs
        });
    } catch (error) {
        console.error("Failed to clear trade data:", error);
        return res.status(500).json({ message: "Failed to clear trade data." });
    }
});

export default router;
