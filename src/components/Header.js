export default function Header({ onSearch }) {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            onSearch(e.target.value);
        }
    };

    return (
        <header className="app-header">
            <div className="header-search">
                <span className="header-search-icon">🔍</span>
                <input
                    type="number"
                    placeholder="Search Team ID..."
                    onKeyDown={handleKeyDown}
                />
            </div>

            <div className="user-profile">
                <div className="user-avatar">
                    U
                </div>
            </div>
        </header>
    );
}
