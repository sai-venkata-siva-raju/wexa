import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { getDriver, closeDriver, runQuery } from "./db.js";
import * as Queries from "./queries.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Health check
app.get(
  "/api/health",
  asyncHandler(async (req, res) => {
    try {
      const driver = await getDriver();
      res.json({ status: "ok", message: "CognoDB connected" });
    } catch (error) {
      res
        .status(503)
        .json({ status: "error", message: "Database unavailable" });
    }
  })
);

// Get all candidates
app.get(
  "/api/candidates",
  asyncHandler(async (req, res) => {
    const results = await runQuery(`
    MATCH (c:Candidate)
    RETURN c.name as name, c.email as email, c.years_experience as yearsExperience
    ORDER BY c.name
  `);
    res.json(results);
  })
);

// Get candidate details with skills
app.get(
  "/api/candidates/:name",
  asyncHandler(async (req, res) => {
    const results = await runQuery(
      `
    MATCH (c:Candidate {name: $name})
    OPTIONAL MATCH (c)-[hasSkill:HAS_SKILL]->(skill:Skill)
    OPTIONAL MATCH (c)-[worked:WORKED_AT]->(company:Company)
    OPTIONAL MATCH (c)-[applied:APPLIED_FOR]->(job:Job)
    RETURN
      c.name as name,
      c.email as email,
      c.years_experience as yearsExperience,
      COLLECT(DISTINCT {skill: skill.name, level: hasSkill.level}) as skills,
      COLLECT(DISTINCT {company: company.name, role: worked.role, years: worked.years}) as workExperience,
      COLLECT(DISTINCT {job: job.title, status: applied.status}) as applications
  `,
      { name: req.params.name }
    );
    res.json(results[0] || {});
  })
);

// Get all jobs
app.get(
  "/api/jobs",
  asyncHandler(async (req, res) => {
    const results = await runQuery(`
    MATCH (j:Job)-[:POSTED_BY]->(c:Company)
    RETURN
      j.title as title,
      j.location as location,
      j.salary_min as salaryMin,
      j.salary_max as salaryMax,
      c.name as company
    ORDER BY j.title
  `);
    res.json(results);
  })
);

// Get job details with required skills
app.get(
  "/api/jobs/:title",
  asyncHandler(async (req, res) => {
    const results = await runQuery(
      `
    MATCH (j:Job {title: $title})
    OPTIONAL MATCH (j)-[:POSTED_BY]->(company:Company)
    OPTIONAL MATCH (j)-[req:REQUIRES]->(skill:Skill)
    OPTIONAL MATCH (c:Candidate)-[:APPLIED_FOR]->(j)
    RETURN
      j.title as title,
      j.location as location,
      j.salary_min as salaryMin,
      j.salary_max as salaryMax,
      j.description as description,
      company.name as company,
      COLLECT(DISTINCT {skill: skill.name, level: req.required_level}) as requiredSkills,
      COUNT(DISTINCT c) as applicationCount
  `,
      { title: req.params.title }
    );
    res.json(results[0] || {});
  })
);

// Get all skills
app.get(
  "/api/skills",
  asyncHandler(async (req, res) => {
    const results = await runQuery(`
    MATCH (s:Skill)
    OPTIONAL MATCH (s)<-[has:HAS_SKILL]-(c:Candidate)
    OPTIONAL MATCH (s)<-[req:REQUIRES]-(j:Job)
    RETURN
      s.name as name,
      s.category as category,
      s.demand_level as demandLevel,
      COUNT(DISTINCT c) as candidatesWithSkill,
      COUNT(DISTINCT j) as jobsRequiringSkill
    ORDER BY jobsRequiringSkill DESC
  `);
    res.json(results);
  })
);

// Find matching jobs for a candidate
app.get(
  "/api/recommendations/jobs/:candidateName",
  asyncHandler(async (req, res) => {
    const results = await runQuery(Queries.findMatchingJobs, {
      candidateName: req.params.candidateName,
    });
    res.json(results);
  })
);

// Find candidates for a job
app.get(
  "/api/recommendations/candidates/:jobTitle",
  asyncHandler(async (req, res) => {
    const results = await runQuery(Queries.getCandidatesForJob, {
      jobTitle: decodeURIComponent(req.params.jobTitle),
    });
    res.json(results);
  })
);

// Find similar jobs
app.get(
  "/api/similar-jobs/:jobTitle",
  asyncHandler(async (req, res) => {
    const results = await runQuery(Queries.findSimilarJobs, {
      jobTitle: decodeURIComponent(req.params.jobTitle),
    });
    res.json(results);
  })
);

// Get skill bottlenecks
app.get(
  "/api/analytics/skill-bottlenecks",
  asyncHandler(async (req, res) => {
    const results = await runQuery(Queries.getSkillBottlenecks);
    res.json(results);
  })
);

// Get career path for a skill
app.get(
  "/api/analytics/career-path/:skillName",
  asyncHandler(async (req, res) => {
    const results = await runQuery(Queries.getCareerPath, {
      skillName: decodeURIComponent(req.params.skillName),
    });
    res.json(results);
  })
);

// Get application statistics
app.get(
  "/api/analytics/application-stats",
  asyncHandler(async (req, res) => {
    const results = await runQuery(Queries.getApplicationStats);
    res.json(results);
  })
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  if (err.message.includes("Could not perform discovery")) {
    res.status(503).json({ error: "Database connection failed" });
  } else {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await getDriver();
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ API docs available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  await closeDriver();
  process.exit(0);
});

start();
