import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Search.css";
import { normalizeNeo4jValue, toNumber } from "../utils/neo4j";

function CandidateSearch({ apiUrl }) {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateDetails, setCandidateDetails] = useState(null);
  const [matchingJobs, setMatchingJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${apiUrl}/api/candidates`);
        setCandidates(normalizeNeo4jValue(res.data));
      } catch (err) {
        setError("Failed to load candidates");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [apiUrl]);

  const handleSelectCandidate = async (candidate) => {
    try {
      setLoading(true);
      const [detailsRes, jobsRes] = await Promise.all([
        axios.get(
          `${apiUrl}/api/candidates/${encodeURIComponent(candidate.name)}`
        ),
        axios.get(
          `${apiUrl}/api/recommendations/jobs/${encodeURIComponent(candidate.name)}`
        ),
      ]);
      setCandidateDetails(normalizeNeo4jValue(detailsRes.data));
      setMatchingJobs(normalizeNeo4jValue(jobsRes.data));
      setSelectedCandidate(candidate);
    } catch (err) {
      setError("Failed to load candidate details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <h2>👥 Candidate Search</h2>

      <div className="search-grid">
        <div className="search-panel">
          <h3>Candidates</h3>
          {loading && <div className="loading">Loading...</div>}
          {error && <div className="error">{error}</div>}
          <ul className="search-list">
            {candidates.map((candidate, idx) => (
              <li key={idx}>
                <button
                  className={`search-item ${selectedCandidate?.name === candidate.name ? "active" : ""}`}
                  onClick={() => handleSelectCandidate(candidate)}
                >
                  <div className="item-name">{candidate.name}</div>
                  <div className="item-meta">
                    {toNumber(candidate.yearsExperience)} years
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="details-panel">
          {selectedCandidate && candidateDetails ? (
            <div className="details-content">
              <h3>{candidateDetails.name}</h3>
              <p className="email">✉️ {candidateDetails.email}</p>
              <p className="experience">
                📅 {toNumber(candidateDetails.yearsExperience)} years experience
              </p>

              {candidateDetails.skills &&
                candidateDetails.skills.length > 0 && (
                  <div className="section">
                    <h4>Skills</h4>
                    <div className="skills-grid">
                      {candidateDetails.skills.map((skill, idx) => (
                        <div key={idx} className="skill-badge">
                          <span className="skill-label">{skill.skill}</span>
                          <span className="skill-level">{skill.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {candidateDetails.workExperience &&
                candidateDetails.workExperience.length > 0 && (
                  <div className="section">
                    <h4>Work Experience</h4>
                    {candidateDetails.workExperience.map((work, idx) => (
                      <div key={idx} className="work-item">
                        <div className="work-company">{work.company}</div>
                        <div className="work-role">{work.role}</div>
                        <div className="work-years">
                          {toNumber(work.years)} years
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              <div className="section">
                <h4>Recommended Positions ({matchingJobs.length})</h4>
                {matchingJobs.length === 0 ? (
                  <p className="empty">No matching jobs found</p>
                ) : (
                  <ul className="jobs-list">
                    {matchingJobs.slice(0, 5).map((job, idx) => (
                      <li key={idx} className="job-item">
                        <div className="job-title">{job.jobTitle}</div>
                        <div className="job-meta">
                          <span>{job.location}</span>
                          <span>
                            ${toNumber(job.salaryMin).toLocaleString()} - $
                            {toNumber(job.salaryMax).toLocaleString()}
                          </span>
                        </div>
                        <div className="job-match">
                          {job.matchingSkills} skills match
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              Select a candidate to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CandidateSearch;
