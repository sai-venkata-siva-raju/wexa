import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import Navigation from "./components/Navigation";
import CandidateSearch from "./components/CandidateSearch";
import JobSearch from "./components/JobSearch";
import SkillAnalytics from "./components/SkillAnalytics";
import Dashboard from "./components/Dashboard";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

function App() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check database connection
    axios
      .get(`${API_URL}/api/health`)
      .then(() => setIsConnected(true))
      .catch(() => {
        setIsConnected(false);
        setError(
          "Could not connect to database. Please ensure CognoDB is running."
        );
      });
  }, []);

  const handleViewChange = (view) => {
    setCurrentView(view);
    setError(null);
  };

  return (
    <div className="app">
      <Navigation currentView={currentView} onViewChange={handleViewChange} />

      <div className="container">
        {!isConnected && (
          <div className="error-banner">
            ⚠️ Database connection failed. Please check your CognoDB instance.
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        {currentView === "dashboard" && <Dashboard apiUrl={API_URL} />}
        {currentView === "candidates" && <CandidateSearch apiUrl={API_URL} />}
        {currentView === "jobs" && <JobSearch apiUrl={API_URL} />}
        {currentView === "analytics" && <SkillAnalytics apiUrl={API_URL} />}
      </div>

      <footer className="footer">
        <p>Job Market Graph - Powered by CognoDB</p>
      </footer>
    </div>
  );
}

export default App;
