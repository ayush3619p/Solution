import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import connectDB from "./config/db.js";
import tradeRoutes from "./routes/tradeRoutes.js";
import pullRoutes from "./routes/pullRoutes.js";
import dataRoutes from "./routes/dataRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import PullJob from "./models/PullJob.js";
import { executePull } from "./services/pullServices.js";

const app = express();
const frontendPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "frontend",
    "dist"
);

app.use(express.json());
app.use(express.static(frontendPath));

app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

app.use("/api", (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: "MongoDB is not connected." });
    }

    next();
});

app.use("/api/trades", tradeRoutes);
app.use("/api/pull", pullRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/events", eventRoutes);

app.get("/health", (req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res.status(connected ? 200 : 503).json({
        status: connected ? "OK" : "UNAVAILABLE",
        database: connected ? "connected" : "disconnected"
    });
});

const port = Number(process.env.PORT) || 5500;

async function startServer() {
    await connectDB();

    const interruptedJobs = await PullJob.find({ status: "RUNNING" }).sort({ startedAt: 1 });
    for (const job of interruptedJobs) {
        console.log(`Recovering interrupted trade pull ${job._id} through cursor ${job.cursor}`);
        void executePull(job._id, { repairSavedPrefix: true }).catch((error) => {
            console.error(`Failed to resume trade pull ${job._id}:`, error);
        });
    }

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

startServer().catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exitCode = 1;
});