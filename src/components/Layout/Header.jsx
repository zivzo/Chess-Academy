export default function Header({ page, onNavigate, NAV }) {
  return (
    <header className="header">
      <div className="header-logo">Chess<span>Academy</span></div>
      <nav className="header-nav">
        {NAV.map(n => (
          <button
            key={n.id}
            className={`nav-btn ${page === n.id ? "active" : ""}`}
            onClick={() => onNavigate(n.id)}
          >
            {n.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
