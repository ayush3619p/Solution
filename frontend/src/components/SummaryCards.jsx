import { formatNumber } from "../utils/formatters.js";

export default function SummaryCards({
    trades,
    job,
    isConnected,
    isStartingSync,
    isClearingData,
    isLiveUpdatesConnected,
    onSync,
    onClearData
}) {
    const isRunning = job?.status === "RUNNING";
    const status = job?.status
        ? job.status.charAt(0) + job.status.slice(1).toLowerCase()
        : "Not started";
    const syncDetail = !job
        ? "Ready when you are"
        : job.status === "FAILED"
            ? job.error || "The sync could not be completed"
            : `${formatNumber(job.totalPulled || 0)} trades received`;

    return (
        <section className="summary" aria-label="Trade summary">
            <article className="stat-card">
                <p className="stat-label">Total trades</p>
                <p className="stat-value">{formatNumber(trades.length)}</p>
                <p className="stat-note">Most recent records</p>
            </article>

            <article className="stat-card">
                <p className="stat-label">Latest sync</p>
                <p className="stat-value stat-value--small">{status}</p>
                <p className="stat-note">{syncDetail}</p>
            </article>

            <article className="stat-card stat-card--action">
                <div>
                    <p className="stat-label">Data connection</p>
                    <p className="connection-value">
                        <span className={`connection-dot${isConnected ? "" : " is-offline"}`} />
                        <span>{isConnected === null ? "Checking…" : isConnected ? "Connected" : "Unavailable"}</span>
                    </p>
                    <p className="stat-note">
                        Live updates {isLiveUpdatesConnected ? "connected" : "reconnecting…"}
                    </p>
                </div>
                <div className="action-buttons">
                    <button
                        className="secondary-button"
                        type="button"
                        onClick={onClearData}
                        disabled={isRunning || isStartingSync || isClearingData}
                    >
                        {isClearingData ? "Clearing…" : "Clear all data"}
                    </button>
                    <button
                        className="primary-button"
                        type="button"
                        onClick={onSync}
                        disabled={isRunning || isStartingSync || isClearingData}
                    >
                        <span className="button-icon" aria-hidden="true">↻</span>
                        <span>{isRunning ? "Syncing…" : isStartingSync ? "Starting…" : "Sync trades"}</span>
                    </button>
                </div>
            </article>
        </section>
    );
}
