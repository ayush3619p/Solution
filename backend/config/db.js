import mongoose from "mongoose";
import dns from "node:dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

export default async function connectDB() {
    const uri = process.env.DB_URL || process.env.DB_URI;

    if (!uri) {
        throw new Error("Set DB_URL or DB_URI in the environment before starting the server.");
    }

    await mongoose.connect(uri);
    console.log("MongoDB connected");
}