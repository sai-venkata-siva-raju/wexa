import React from "react";
import "./Navigation.css";

function Navigation({ currentView, onViewChange }) {
  const navItems = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "candidates", label: "👥 Candidates" },
    { id: "jobs", label: "💼 Jobs" },
    { id: "analytics", label: "📈 Analytics" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>🌐 Job Market Graph</h1>
        <p>Explore careers powered by CognoDB</p>
      </div>
      <ul className="nav-links">
        {navItems.map((item) => (
          <li key={item.id}>
            <button
              className={`nav-button ${currentView === item.id ? "active" : ""}`}
              onClick={() => onViewChange(item.id)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navigation;
