import { useMemo, useState } from "react";
import { formatDate, formatNumber, formatPrice } from "../utils/formatters.js";

const PAGE_SIZE = 25;

export default function TradesPanel({ trades, error }) {
    const [query, setQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const visibleTrades = useMemo(() => {
        const search = query.trim().toLowerCase();
        return trades.filter((trade) =>
            `${trade.tradeId} ${trade.symbol} ${trade.client || ""}`
                .toLowerCase()
                .includes(search)
        );
    }, [query, trades]);

    const pageCount = Math.ceil(visibleTrades.length / PAGE_SIZE);
    const page = Math.min(currentPage, Math.max(pageCount, 1));
    const pageStart = (page - 1) * PAGE_SIZE;
    const pageTrades = visibleTrades.slice(pageStart, pageStart + PAGE_SIZE);
    const resultsLabel = query.trim()
        ? `Showing ${visibleTrades.length === 0 ? 0 : pageStart + 1}–${Math.min(pageStart + PAGE_SIZE, visibleTrades.length)} of ${visibleTrades.length} matching records`
        : `Showing ${visibleTrades.length === 0 ? 0 : pageStart + 1}–${Math.min(pageStart + PAGE_SIZE, trades.length)} of ${trades.length} records`;

    function updateQuery(event) {
        setQuery(event.target.value);
        setCurrentPage(1);
    }

    return (
        <section className="trades-panel" aria-labelledby="trades-heading">
            <div className="panel-heading">
                <div>
                    <h2 id="trades-heading">Recent trades</h2>
                    <p className="panel-subtitle">Updates automatically with the latest records.</p>
                </div>
                <label className="search-box">
                    <span className="search-icon" aria-hidden="true">⌕</span>
                    <input
                        type="search"
                        placeholder="Search symbol or trade ID"
                        value={query}
                        onChange={updateQuery}
                    />
                </label>
            </div>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Trade ID</th>
                            <th scope="col">Symbol</th>
                            <th scope="col">Quantity</th>
                            <th scope="col">Price</th>
                            <th scope="col">Client</th>
                            <th scope="col">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {error ? (
                            <tr><td colSpan="6" className="empty-state">{error}</td></tr>
                        ) : pageTrades.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="empty-state">
                                    {trades.length === 0
                                        ? "No trades yet. Start a sync to pull market data."
                                        : "No trades match your search."}
                                </td>
                            </tr>
                        ) : pageTrades.map((trade) => (
                            <tr key={trade._id || trade.tradeId}>
                                <td>{trade.tradeId}</td>
                                <td><span className="symbol-pill">{trade.symbol}</span></td>
                                <td>{formatNumber(trade.quantity)}</td>
                                <td>{formatPrice(Number(trade.price))}</td>
                                <td>{trade.client || "—"}</td>
                                <td>{formatDate(trade.timestamp)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <footer className="panel-footer">
                <span>{error ? "Trade data unavailable" : resultsLabel}</span>
                <nav className="pagination" aria-label="Trade pages">
                    {pageCount > 1 && (
                        <>
                            <button
                                className="pagination-button"
                                type="button"
                                aria-label="Previous page"
                                disabled={page === 1}
                                onClick={() => setCurrentPage(page - 1)}
                            >
                                Previous
                            </button>
                            <span aria-live="polite">Page {page} of {pageCount}</span>
                            <button
                                className="pagination-button"
                                type="button"
                                aria-label="Next page"
                                disabled={page >= pageCount}
                                onClick={() => setCurrentPage(page + 1)}
                            >
                                Next
                            </button>
                        </>
                    )}
                </nav>
            </footer>
        </section>
    );
}
