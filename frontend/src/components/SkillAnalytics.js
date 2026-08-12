import React, { useState, useEffect } from "react";
import axios from "axios";
import "./SkillAnalytics.css";
import { normalizeNeo4jValue, toNumber } from "../utils/neo4j";

function SkillAnalytics({ apiUrl }) {
  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [careerPath, setCareerPath] = useState([]);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [skillsRes, bottlenecksRes] = await Promise.all([
          axios.get(`${apiUrl}/api/skills`),
          axios.get(`${apiUrl}/api/analytics/skill-bottlenecks`),
        ]);
        setSkills(normalizeNeo4jValue(skillsRes.data));
        setBottlenecks(normalizeNeo4jValue(bottlenecksRes.data));
      } catch (err) {
        setError("Failed to load analytics");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiUrl]);

  const handleSelectSkill = async (skill) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${apiUrl}/api/analytics/career-path/${encodeURIComponent(skill.name)}`
      );
      setCareerPath(normalizeNeo4jValue(res.data));
      setSelectedSkill(skill);
    } catch (err) {
      setError("Failed to load career path");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analytics-container">
      <h2>📈 Market Analytics</h2>

      <div className="analytics-grid">
        <div className="analytics-section">
          <h3>📊 Skill Bottlenecks</h3>
          <p className="section-description">
            Skills with high demand but limited talent supply
          </p>
          {error && <div className="error">{error}</div>}
          {bottlenecks.length === 0 ? (
            <div className="empty">No bottleneck data</div>
          ) : (
            <div className="bottleneck-list">
              {bottlenecks.slice(0, 8).map((skill, idx) => (
                <div
                  key={idx}
                  className="bottleneck-item"
                  onClick={() => handleSelectSkill(skill)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="bottleneck-header">
                    <div className="skill-name">{skill.skillName}</div>
                    <div className="shortage-badge">
                      {toNumber(skill.shortage)} short
                    </div>
                  </div>
                  <div className="bottleneck-stats">
                    <span className="stat">
                      📍 {toNumber(skill.jobsRequiringSkill)} jobs
                    </span>
                    <span className="stat">
                      👥 {toNumber(skill.candidatesWithSkill)} candidates
                    </span>
                  </div>
                  <div className="demand-bar">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${Math.min(
                          100,
                          (toNumber(skill.candidatesWithSkill) /
                            Math.max(1, toNumber(skill.jobsRequiringSkill))) *
                            100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="analytics-section">
          <h3>🎓 All Skills</h3>
          <p className="section-description">Browse all skills in the market</p>
          {loading && <div className="loading">Loading...</div>}
          <ul className="skills-list">
            {skills.map((skill, idx) => (
              <li key={idx}>
                <button
                  className={`skill-row ${selectedSkill?.name === skill.name ? "active" : ""}`}
                  onClick={() => handleSelectSkill(skill)}
                >
                  <div className="skill-info">
                    <div className="skill-title">{skill.name}</div>
                    <div className="skill-category">{skill.category}</div>
                  </div>
                  <div className="skill-counts">
                    <span className="count-item">
                      Jobs: {toNumber(skill.jobsRequiringSkill)}
                    </span>
                    <span className="count-item">
                      People: {toNumber(skill.candidatesWithSkill)}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {selectedSkill && (
        <div className="career-path-section">
          <h3>💼 Career Path: {selectedSkill.name}</h3>
          {loading && <div className="loading">Loading career data...</div>}
          {careerPath.length === 0 ? (
            <div className="empty">No career history for this skill</div>
          ) : (
            <div className="path-grid">
              {careerPath.map((item, idx) => (
                <div key={idx} className="path-card">
                  <div className="path-company">{item.company}</div>
                  <div className="path-role">{item.role}</div>
                  <div className="path-count">
                    👥 {toNumber(item.numberOfPeople)} people
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SkillAnalytics;
