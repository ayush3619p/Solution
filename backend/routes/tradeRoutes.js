import express from "express";
import Trade from "../models/trades.js";

const router = express.Router();


// GET /api/trades

router.get("/", async (req, res) => {

    try {

        const trades = await Trade
            .find()
            .sort({
                timestamp: -1
            });

        res.json(trades);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message:"Failed to fetch trades"
        });
    }
});


export default router;