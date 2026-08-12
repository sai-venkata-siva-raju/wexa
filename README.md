# Job Market Graph

Job Market Graph is a full-stack web application that explores how a graph database can model a hiring market more naturally than a relational schema. It uses **CognoDB** as the data layer, an **Express** backend for API access, and a **React** frontend for browsing candidates, jobs, skills, and analytics.

The project is designed to answer questions like:

- Which jobs best match a candidate’s skills and experience?
- Which candidates are strongest for a given role?
- Which skills are in high demand but short supply?
- What career paths tend to follow from a particular skill?

The app is built to make those relationship-heavy queries feel fast and intuitive.

## Overview

The application is split into two main parts:

- **Backend**: Node.js + Express API that talks to CognoDB and returns JSON
- **Frontend**: React UI that displays the dashboard, search views, and market analytics

The user experience centers on four tabs:

- **Dashboard**: overall market summary and top in-demand skills
- **Candidates**: browse candidates, inspect their profiles, and see matching jobs
- **Jobs**: browse open positions, inspect job details, and see matching candidates
- **Analytics**: examine skill bottlenecks and career progression paths

## Why Graphs Fit This Problem

Hiring data is full of relationships:

- candidates have skills
- skills are required by jobs
- candidates worked at companies
- companies belong to industries
- skills are related to other skills
- applications connect candidates and jobs

In a relational database, answering multi-step questions often means many joins across several tables. In a graph database, those relationships are first-class, so traversal-based questions are much more natural.

Examples:

- candidate -> skill -> job
- skill -> candidate -> company
- skill -> related skill -> candidate
- company -> industry -> company

That makes the data model a strong fit for recommendation, matching, and market analysis.

## Tech Stack

- **Frontend**: React 18, Axios, React Scripts
- **Backend**: Node.js, Express, CORS, dotenv
- **Database**: CognoDB graph database via Neo4j driver
- **Tooling**: npm scripts, nodemon for development

## Data Model

The graph contains these node types:

- `Candidate`
- `Skill`
- `Job`
- `Company`
- `Industry`

And these relationship types:

- `Candidate -[HAS_SKILL]-> Skill`
- `Candidate -[APPLIED_FOR]-> Job`
- `Candidate -[WORKED_AT]-> Company`
- `Job -[REQUIRES]-> Skill`
- `Job -[POSTED_BY]-> Company`
- `Company -[IN_INDUSTRY]-> Industry`
- `Skill -[RELATED_TO]-> Skill`

### Example properties

- `Candidate`: `name`, `email`, `years_experience`
- `Skill`: `name`, `category`, `demand_level`
- `Job`: `title`, `salary_min`, `salary_max`, `location`, `description`
- `Company`: `name`, `size`
- `Industry`: `name`

## Key Features

- Browse candidates and jobs from live graph data
- View candidate skills, work history, and matched roles
- View job requirements, similar roles, and top candidates
- Inspect skill demand vs supply to find bottlenecks
- Explore common career paths for people with a given skill
- See a market dashboard with headline metrics

## Project Structure

```text
wexa/
├── backend/
│   ├── db.js
│   ├── queries.js
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── App.css
│   └── package.json
├── scripts/
│   └── loadData.js
├── package.json
└── README.md
```

## Environment Variables

Create a `.env` file in the project root:

```bash
COGNODB_URI=bolt+s://db-xxxxxxxx.databases.cognodb.com
COGNODB_USERNAME=cognodb
COGNODB_PASSWORD=your_password_here
PORT=3001
NODE_ENV=development
REACT_APP_API_URL=http://localhost:3001
```

Notes:

- `PORT` controls the backend server port.
- The frontend uses `REACT_APP_API_URL` to decide where to send API requests.
- If `REACT_APP_API_URL` is not set, the app falls back to `http://localhost:3001`.

## Setup

### Prerequisites

- Node.js 16+ or newer
- npm
- A CognoDB account and database instance

### 1. Create a CognoDB instance

1. Sign up for CognoDB.
2. Create a database instance.
3. Copy the connection details from the console.
4. Keep the username and password handy for your `.env` file.

### 2. Install dependencies

```bash
npm run install-all
```

This installs dependencies for both the backend and frontend.

### 3. Load seed data

```bash
npm run load-data
```

This script clears any existing graph data and recreates the demo dataset.

### 4. Start the backend

```bash
npm start
```

By default, the API listens on port `3001`.

### 5. Start the frontend

In a second terminal:

```bash
cd frontend
npm start
```

The React app runs on port `3000` and talks to the backend API.

## Seed Data

The `scripts/loadData.js` script creates a demo graph with:

- 8 candidates
- 15 skills
- 6 companies
- 6 industries
- 8 job postings
- candidate skill relationships
- job skill requirements
- work history records
- application records
- skill relationship links

The script is intentionally reset-friendly: it deletes existing nodes first, then rebuilds the graph so you can reload the demo data anytime.

## Backend Architecture

The backend is located in `backend/` and is responsible for:

- connecting to CognoDB
- running Cypher queries
- normalizing query results
- exposing JSON endpoints to the frontend

### `backend/db.js`

Handles:

- driver creation
- connectivity checks
- running queries
- converting Neo4j integer objects into plain JSON values

This normalization is important because Neo4j often returns numbers as integer objects rather than JavaScript numbers.

### `backend/queries.js`

Contains reusable Cypher queries for:

- matching jobs to a candidate
- finding career paths
- identifying skill bottlenecks
- finding similar jobs
- finding matching candidates
- computing application statistics
- computing skill progression

### `backend/server.js`

Defines the HTTP API and includes:

- `/api/health`
- `/api/candidates`
- `/api/candidates/:name`
- `/api/jobs`
- `/api/jobs/:title`
- `/api/skills`
- `/api/recommendations/jobs/:candidateName`
- `/api/recommendations/candidates/:jobTitle`
- `/api/similar-jobs/:jobTitle`
- `/api/analytics/skill-bottlenecks`
- `/api/analytics/career-path/:skillName`
- `/api/analytics/application-stats`

## Frontend Architecture

The frontend lives in `frontend/src/` and is organized by view:

- `Dashboard.js`
- `CandidateSearch.js`
- `JobSearch.js`
- `SkillAnalytics.js`
- `Navigation.js`

### UI flow

- The navigation bar switches between the four main views.
- Each view fetches data from the backend using Axios.
- The selected candidate or job opens a detail panel on the right.
- Analytics screens summarize supply, demand, and career movement.

### Data handling note

The app now normalizes Neo4j integer objects into plain numbers before rendering, which avoids React runtime errors when values come back as `{ low, high }`.

## API Reference

### Candidates

- `GET /api/candidates`
  - Returns a list of candidates with `name`, `email`, and `yearsExperience`
- `GET /api/candidates/:name`
  - Returns candidate details, skills, work history, and applications
- `GET /api/recommendations/jobs/:candidateName`
  - Returns recommended jobs for a candidate

### Jobs

- `GET /api/jobs`
  - Returns all jobs with title, location, salary range, and company
- `GET /api/jobs/:title`
  - Returns detailed job data, required skills, and application count
- `GET /api/recommendations/candidates/:jobTitle`
  - Returns candidate matches for a job
- `GET /api/similar-jobs/:jobTitle`
  - Returns similar positions based on shared skill requirements

### Skills and Analytics

- `GET /api/skills`
  - Returns all skills with candidate counts and job counts
- `GET /api/analytics/skill-bottlenecks`
  - Returns skills with high demand and limited supply
- `GET /api/analytics/career-path/:skillName`
  - Returns companies and roles associated with a skill
- `GET /api/analytics/application-stats`
  - Returns application pipeline counts by status

### Health

- `GET /api/health`
  - Returns backend connectivity status

## Queries At A Glance

### Matching jobs for a candidate

Finds jobs that require skills the candidate already has, and orders them by match strength.

### Matching candidates for a job

Finds candidates who match the required skills for a job and calculates a match percentage.

### Skill bottlenecks

Compares how many jobs require a skill versus how many candidates have it.

### Career paths

Shows companies and roles where people with a given skill have worked.

### Similar jobs

Finds jobs that share skill requirements with another job.

## Running the Project

### Development

```bash
npm run load-data
npm start
cd frontend && npm start
```

### Production frontend build

```bash
cd frontend
npm run build
```

## Troubleshooting

### “Could not connect to database”

- Check that your CognoDB instance is running
- Confirm `COGNODB_URI`, `COGNODB_USERNAME`, and `COGNODB_PASSWORD`
- Make sure the backend is using the correct `.env` file

### “Objects are not valid as a React child”

- This usually means a Neo4j integer object was rendered directly
- Restart both backend and frontend if you changed API normalization
- Hard refresh the browser after rebuilding the frontend

### Frontend cannot reach API

- Verify `REACT_APP_API_URL`
- Make sure the backend is running on port `3001`
- Check CORS and browser console errors

## Deployment Notes

Netlify is a great fit for the React frontend, but the Express backend should be hosted separately.

Suggested setup:

- **Backend**: Render, Railway, Heroku, Fly.io, or similar Node.js host
- **Frontend**: Netlify
- **Database**: CognoDB cloud instance

### Deploy the frontend to Netlify

1. Push the repository to GitHub.
2. In Netlify, choose **Add new site** and connect your GitHub repo.
3. Use the provided `netlify.toml` configuration.
4. Set the build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `build`
5. Add this environment variable in Netlify site settings:
   - `REACT_APP_API_URL=https://your-backend-domain.com`
6. Deploy the site.

### Deploy the backend separately

The backend is an Express server and should run on a separate Node.js host.

1. Deploy the `backend/server.js` app to a Node.js platform such as Render or Railway.
2. Set the same CognoDB environment variables there:
   - `COGNODB_URI`
   - `COGNODB_USERNAME`
   - `COGNODB_PASSWORD`
3. Make sure the backend URL you deploy is the one used in `REACT_APP_API_URL` on Netlify.

### Optional SPA routing note

The included Netlify redirect rule sends all client-side routes to `index.html`, which keeps React navigation working if you add routing later.

## License

MIT
