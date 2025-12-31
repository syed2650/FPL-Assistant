export default function Sidebar() {
    return (
        <aside className="app-sidebar">
            <a href="#" className="app-logo">
                <span style={{ fontSize: '1.5rem' }}>⚡</span> FPL Assistant
            </a>

            <nav className="nav-links">
                <a className="nav-item active">
                    <span>🎯</span> Dashboard
                </a>
                <a className="nav-item">
                    <span>👕</span> My Team
                </a>
                <a className="nav-item">
                    <span>🔄</span> Transfers
                </a>
                <a className="nav-item">
                    <span>📊</span> Statistics
                </a>
                <div style={{ flex: 1 }}></div>
                <a className="nav-item">
                    <span>⚙️</span> Settings
                </a>
            </nav>
        </aside>
    );
}
