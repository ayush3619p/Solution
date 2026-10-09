import { useCallback, useEffect, useRef, useState } from "react";
import DashboardHeader from "./components/DashboardHeader.jsx";
import SummaryCards from "./components/SummaryCards.jsx";
import TradesPanel from "./components/TradesPanel.jsx";

async function fetchJson(url, options) {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "The request could not be completed.");
    }

    return result;
}

export default function App() {
    const [trades, setTrades] = useState([]);
    const [job, setJob] = useState(null);
    const [isConnected, setIsConnected] = useState(null);
    const [isLiveUpdatesConnected, setIsLiveUpdatesConnected] = useState(false);
    const [isStartingSync, setIsStartingSync] = useState(false);
    const [isClearingData, setIsClearingData] = useState(false);
    const [dashboardError, setDashboardError] = useState("");
    const [notice, setNotice] = useState("");
    const refreshRequestId = useRef(0);
    const tradeRevision = useRef(0);

    const refreshDashboard = useCallback(async (preserveLiveTrades = false) => {
        const requestId = ++refreshRequestId.current;
        const revision = tradeRevision.current;
        try {
            const [nextTrades, nextJob] = await Promise.all([
                fetchJson("/api/trades"),
                fetchJson("/api/pull/status")
            ]);
            if (requestId !== refreshRequestId.current) {
                return;
            }
            if (revision === tradeRevision.current) {
                setTrades((currentTrades) => {
                    if (!preserveLiveTrades) {
                        return nextTrades;
                    }

                    const tradesById = new Map(
                        currentTrades.map((trade) => [trade.tradeId, trade])
                    );
                    for (const trade of nextTrades) {
                        if (!tradesById.has(trade.tradeId)) {
                            tradesById.set(trade.tradeId, trade);
                        }
                    }
                    return [...tradesById.values()];
                });
            }
            setJob(nextJob);
            setIsConnected(true);
            setDashboardError("");
        } catch (error) {
            if (requestId !== refreshRequestId.current) {
                return;
            }
            setIsConnected(false);
            setDashboardError(error.message);
        }
    }, []);

    const applyTradeBatch = useCallback((event) => {
        const update = JSON.parse(event.data);
        tradeRevision.current += 1;
        setTrades((currentTrades) => {
            const updatedIds = new Set(update.trades.map((trade) => trade.tradeId));
            return [
                ...update.trades,
                ...currentTrades.filter((trade) => !updatedIds.has(trade.tradeId))
            ];
        });
        setJob((currentJob) => currentJob && String(currentJob._id) === update.jobId
            ? { ...currentJob, cursor: update.cursor, totalPulled: update.totalPulled }
            : currentJob);
        void refreshDashboard(true);
    }, [refreshDashboard]);

    useEffect(() => {
        void refreshDashboard();
        const events = new EventSource("/api/events");
        events.onopen = () => setIsLiveUpdatesConnected(true);
        events.onerror = () => setIsLiveUpdatesConnected(false);
        events.addEventListener("trades-updated", applyTradeBatch);
        events.addEventListener("pull-finished", () => { void refreshDashboard(); });
        return () => {
            events.close();
            setIsLiveUpdatesConnected(false);
        };
    }, [applyTradeBatch, refreshDashboard]);

    async function startSync() {
        setIsStartingSync(true);
        setNotice("");

        try {
            const result = await fetchJson("/api/pull", { method: "POST" });
            setNotice(result.message || "Trade sync started. This may take a few minutes.");
            await refreshDashboard();
        } catch (error) {
            setNotice(error.message);
        } finally {
            setIsStartingSync(false);
        }
    }

    async function clearData() {
        const confirmed = window.confirm(
            "Delete all stored trades and pull-job history? This cannot be undone."
        );
        if (!confirmed) {
            return;
        }

        setIsClearingData(true);
        setNotice("");

        try {
            const result = await fetchJson("/api/data", { method: "DELETE" });
            setNotice(result.message);
            await refreshDashboard();
        } catch (error) {
            setNotice(error.message);
        } finally {
            setIsClearingData(false);
        }
    }

    const message = dashboardError || notice || (job?.status === "FAILED" ? job.error : "");

    return (
        <main className="page">
            <DashboardHeader />
            <SummaryCards
                trades={trades}
                job={job}
                isConnected={isConnected}
                isStartingSync={isStartingSync}
                isClearingData={isClearingData}
                isLiveUpdatesConnected={isLiveUpdatesConnected}
                onSync={startSync}
                onClearData={clearData}
            />
            {message && <div className="message" role="status">{message}</div>}
            <TradesPanel trades={trades} error={dashboardError} />
            <p className="page-footer">
                Trade Desk <span aria-hidden="true">·</span> Simple market data dashboard
            </p>
        </main>
    );
}
