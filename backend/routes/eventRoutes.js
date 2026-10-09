import express from "express";
import { streamPullEvents } from "../services/pullEvents.js";

const router = express.Router();

router.get("/", streamPullEvents);

export default router;
