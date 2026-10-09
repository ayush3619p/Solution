import express from "express";

const app = express();
const PORT = 3000;

const TOTAL_TRADES = 5000;
const DEFAULT_LIMIT = 100;
const MAX_REQUEST_DELAY_MS = 20000;
const DELAY_MS = Number(process.env.MOCK_BSE_DELAY_MS ?? 18000);

if (!Number.isInteger(DELAY_MS) || DELAY_MS < 0 || DELAY_MS > MAX_REQUEST_DELAY_MS) {
    throw new Error(`MOCK_BSE_DELAY_MS must be an integer between 0 and ${MAX_REQUEST_DELAY_MS}.`);
}

const symbols = [
    "TCS",
    "INFY",
    "RELIANCE",
    "HDFCBANK",
    "ICICIBANK"
];

const trades = Array.from({ length:TOTAL_TRADES }, ( _, index ) => ({

    tradeId: `TRD-${index + 1}`,
    client: `CLIENT-${(index % 20) + 1}`,
    symbol: symbols[index % symbols.length],
    quantity: Math.floor(Math.random() * 500) + 1,
    price: Number( (100 + Math.random() * 3000).toFixed(2) ),
    timestamp: new Date( Date.now() - Math.floor(index / 100) * 1000 ).toISOString()

}))

app.get( "/getTrades", async(req, res)=>{

    const cursor = Number(req.query.cursor || 0);
    const limit = Number( req.query.limit || DEFAULT_LIMIT );

    // Basic validation
    if ( Number.isNaN(cursor) || Number.isNaN(limit) || cursor < 0 || limit <= 0 ) {
        return res.status(400).json({message: "Invalid cursor or limit"});
    }

    await new Promise(resolve => setTimeout(resolve, DELAY_MS) );

    const batch = trades.slice(
        cursor,
        cursor + limit
    );

    const nextCursor = cursor + batch.length < trades.length ? cursor + batch.length : null;

    res.json({
        trades: batch,
        nextCursor,
        hasMore: nextCursor !== null,
        totalAvailable: trades.length
    });

})

app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        totalTrades: trades.length
    });
});

app.listen( PORT, () =>{
    console.log(`Mock feed running at ${PORT}; batch delay is ${DELAY_MS} ms`);
} )