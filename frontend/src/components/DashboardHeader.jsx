export default function DashboardHeader() {
    return (
        <>
            <header className="topbar">
                <a className="brand" href="/" aria-label="Trade Desk home">
                    <span className="brand-mark" aria-hidden="true">T</span>
                    <span>Trade Desk</span>
                </a>
                <span className="environment">
                    <span className="live-dot" />
                    Local workspace
                </span>
            </header>

            <section className="intro">
                <p className="eyebrow">MARKET DATA</p>
                <h1>Trade overview</h1>
                <p className="subtitle">Sync market trades and review the latest activity.</p>
            </section>
        </>
    );
}
