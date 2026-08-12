import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Dashboard.css";
import { normalizeNeo4jValue, toNumber } from "../utils/neo4j";

function Dashboard({ apiUrl }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [candidatesRes, jobsRes, skillsRes, appStatsRes] =
          await Promise.all([
            axios.get(`${apiUrl}/api/candidates`),
            axios.get(`${apiUrl}/api/jobs`),
            axios.get(`${apiUrl}/api/skills`),
            axios.get(`${apiUrl}/api/analytics/application-stats`),
          ]);

        const topSkills = normalizeNeo4jValue(skillsRes.data)
          .sort(
            (a, b) =>
              toNumber(b.jobsRequiringSkill) - toNumber(a.jobsRequiringSkill)
          )
          .slice(0, 5);

        setStats({
          candidateCount: candidatesRes.data.length,
          jobCount: jobsRes.data.length,
          skillCount: skillsRes.data.length,
          topSkills: topSkills,
          applicationStats: normalizeNeo4jValue(appStatsRes.data),
        });
        setError(null);
      } catch (err) {
        setError("Failed to load dashboard statistics");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [apiUrl]);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!stats) {
    return <div className="empty">No data available</div>;
  }

  const appByStatus = stats.applicationStats.reduce((acc, item) => {
    acc[item.status] = toNumber(item.count);
    return acc;
  }, {});

  return (
    <div className="dashboard">
      <h2>Job Market Overview</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.candidateCount}</div>
          <div className="stat-label">👥 Candidates</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.jobCount}</div>
          <div className="stat-label">💼 Open Positions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.skillCount}</div>
          <div className="stat-label">🎓 Skills in Market</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Top In-Demand Skills</h3>
          <ul className="skill-list">
            {stats.topSkills.map((skill, idx) => (
              <li key={idx} className="skill-item">
                <span className="skill-name">{skill.name}</span>
                <span className="skill-count">
                  {toNumber(skill.jobsRequiringSkill)} jobs
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3>Application Pipeline</h3>
          <div className="application-stats">
            {Object.entries(appByStatus).map(([status, count]) => (
              <div key={status} className="stat-row">
                <span className="status-label">{status}</span>
                <span className="status-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="info-section">
        <h3>💡 About This Graph Database</h3>
        <p>
          This application demonstrates the power of graph databases for complex
          relationships in job markets. Navigate through candidates and jobs to
          discover career paths, skill progressions, and market insights that
          would be difficult to model in traditional relational databases.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
