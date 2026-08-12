import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Search.css";
import { normalizeNeo4jValue, toNumber } from "../utils/neo4j";

function JobSearch({ apiUrl }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${apiUrl}/api/jobs`);
        setJobs(normalizeNeo4jValue(res.data));
      } catch (err) {
        setError("Failed to load jobs");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [apiUrl]);

  const handleSelectJob = async (job) => {
    try {
      setLoading(true);
      const [detailsRes, candidatesRes, similarRes] = await Promise.all([
        axios.get(`${apiUrl}/api/jobs/${encodeURIComponent(job.title)}`),
        axios.get(
          `${apiUrl}/api/recommendations/candidates/${encodeURIComponent(job.title)}`
        ),
        axios.get(
          `${apiUrl}/api/similar-jobs/${encodeURIComponent(job.title)}`
        ),
      ]);
      setJobDetails(normalizeNeo4jValue(detailsRes.data));
      setCandidates(normalizeNeo4jValue(candidatesRes.data));
      setSimilarJobs(normalizeNeo4jValue(similarRes.data));
      setSelectedJob(job);
    } catch (err) {
      setError("Failed to load job details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <h2>💼 Job Search</h2>

      <div className="search-grid">
        <div className="search-panel">
          <h3>Open Positions</h3>
          {loading && <div className="loading">Loading...</div>}
          {error && <div className="error">{error}</div>}
          <ul className="search-list">
            {jobs.map((job, idx) => (
              <li key={idx}>
                <button
                  className={`search-item ${selectedJob?.title === job.title ? "active" : ""}`}
                  onClick={() => handleSelectJob(job)}
                >
                  <div className="item-name">{job.title}</div>
                  <div className="item-meta">{job.company}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="details-panel">
          {selectedJob && jobDetails ? (
            <div className="details-content">
              <h3>{jobDetails.title}</h3>
              <p className="email">🏢 {jobDetails.company}</p>
              <p className="experience">📍 {jobDetails.location}</p>
              <p className="experience">
                💰 ${toNumber(jobDetails.salaryMin).toLocaleString()} - $
                {toNumber(jobDetails.salaryMax).toLocaleString()}
              </p>

              {jobDetails.description && (
                <div className="section">
                  <h4>Description</h4>
                  <p style={{ color: "#666", lineHeight: "1.6" }}>
                    {jobDetails.description}
                  </p>
                </div>
              )}

              {jobDetails.requiredSkills &&
                jobDetails.requiredSkills.length > 0 && (
                  <div className="section">
                    <h4>Required Skills</h4>
                    <div className="skills-grid">
                      {jobDetails.requiredSkills.map((skill, idx) => (
                        <div key={idx} className="skill-badge">
                          <span className="skill-label">{skill.skill}</span>
                          <span className="skill-level">{skill.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="section">
                <h4>Top Candidates ({candidates.length})</h4>
                {candidates.length === 0 ? (
                  <p className="empty">No matching candidates</p>
                ) : (
                  <ul className="jobs-list">
                    {candidates.slice(0, 5).map((candidate, idx) => (
                      <li key={idx} className="job-item">
                        <div className="job-title">
                          {candidate.candidateName}
                        </div>
                        <div className="job-meta">
                          <span>{toNumber(candidate.yearsExperience)} years exp</span>
                          <span>{toNumber(candidate.matchPercentage)}% match</span>
                        </div>
                        <div className="job-match">
                          {toNumber(candidate.matchedSkills)}/{toNumber(candidate.totalRequired)}{" "}
                          skills
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {similarJobs.length > 0 && (
                <div className="section">
                  <h4>Similar Positions</h4>
                  <ul className="jobs-list">
                    {similarJobs.slice(0, 3).map((job, idx) => (
                      <li key={idx} className="job-item">
                        <div className="job-title">{job.jobTitle}</div>
                        <div className="job-meta">
                          <span>{job.location}</span>
                        </div>
                        <div className="job-match">
                          {job.matchingSkills} skills in common
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              Select a job to view details and matching candidates
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobSearch;
