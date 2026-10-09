import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema({
    tradeId: {
        type: String,
        required: true,
        unique: true
    },
    client: {
        type: String,
        default: ""
    },
    symbol: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        required: true,
        index: true
    }
});

const Trade = mongoose.model("Trade", tradeSchema);

export default Trade;