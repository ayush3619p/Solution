import mongoose from "mongoose";

const pullJobSchema = new mongoose.Schema(
    {
        status: {
            type: String,

            enum: [
                "RUNNING",
                "COMPLETED",
                "FAILED"
            ],

            default: "RUNNING"
        },

        cursor: {
            type: Number,
            default: 0
        },

        totalPulled: {
            type: Number,
            default: 0
        },

        startedAt: {
            type: Date,
            default: Date.now
        },

        completedAt: {
            type: Date
        },

        error: {
            type: String
        }
    }
);

const PullJob = mongoose.model("PullJob", pullJobSchema);

export default PullJob;