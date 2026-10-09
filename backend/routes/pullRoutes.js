import express from "express";
import PullJob from "../models/PullJob.js";

import { executePull } from "../services/pullServices.js";
import { withPullJobLock } from "../services/pullJobLock.js";

const router = express.Router();

// POST /api/pull

router.post("/", async (req, res) => {

    try {
        const result = await withPullJobLock(async () => {
            const runningJob = await PullJob.findOne({ status: "RUNNING" });
            if (runningJob) {
                return { runningJob };
            }

            const job = await PullJob.create({
                status: "RUNNING",
                cursor: 0,
                totalPulled: 0
            });

            return { job };
        });

        if (result.runningJob) {
            return res.status(409).json({
                message: "A pull is already running",
                jobId: result.runningJob._id
            });
        }

        void executePull(result.job._id).catch((error) => {
            console.error("Pull worker stopped unexpectedly:", error);
        });

        return res.status(202).json({
            message: "Trade pull started",
            jobId: result.job._id
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message:
                "Failed to start pull"
        });
    }
});


// --------------------------------------------------
// Get latest pull status
// --------------------------------------------------

router.get("/status", async (req, res) => {

    try {

        const job =
            await PullJob
                .findOne()
                .sort({
                    startedAt: -1
                });


        res.json(job);

    } catch (error) {

        res.status(500).json({
            message:
                "Failed to get pull status"
        });
    }
});


export default router;