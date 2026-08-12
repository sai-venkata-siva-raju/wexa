import { getDriver, closeDriver } from "../backend/db.js";
import dotenv from "dotenv";

dotenv.config();

async function loadData() {
  const driver = await getDriver();
  const session = driver.session();

  try {
    console.log("🗑️  Clearing existing data...");
    await session.run("MATCH (n) DETACH DELETE n");

    console.log("📊 Creating Industries...");
    const industries = [
      "Technology",
      "Finance",
      "Healthcare",
      "E-commerce",
      "Education",
      "Manufacturing",
    ];

    for (const industry of industries) {
      await session.run("CREATE (:Industry {name: $name})", { name: industry });
    }

    console.log("🛠️  Creating Skills...");
    const skills = [
      {
        name: "JavaScript",
        category: "Programming Language",
        demand_level: "HIGH",
      },
      {
        name: "Python",
        category: "Programming Language",
        demand_level: "HIGH",
      },
      { name: "React", category: "Framework", demand_level: "HIGH" },
      { name: "Node.js", category: "Runtime", demand_level: "HIGH" },
      { name: "SQL", category: "Database", demand_level: "HIGH" },
      { name: "GraphQL", category: "Query Language", demand_level: "MEDIUM" },
      {
        name: "TypeScript",
        category: "Programming Language",
        demand_level: "HIGH",
      },
      { name: "Docker", category: "DevOps", demand_level: "HIGH" },
      { name: "AWS", category: "Cloud", demand_level: "HIGH" },
      { name: "Kubernetes", category: "DevOps", demand_level: "MEDIUM" },
      { name: "Machine Learning", category: "AI/ML", demand_level: "HIGH" },
      { name: "Data Analysis", category: "Data", demand_level: "MEDIUM" },
      {
        name: "Product Management",
        category: "Business",
        demand_level: "MEDIUM",
      },
      {
        name: "Project Management",
        category: "Business",
        demand_level: "MEDIUM",
      },
      { name: "Leadership", category: "Soft Skills", demand_level: "MEDIUM" },
    ];

    for (const skill of skills) {
      await session.run(
        "CREATE (:Skill {name: $name, category: $category, demand_level: $demand_level})",
        skill
      );
    }

    console.log("🏢 Creating Companies...");
    const companies = [
      { name: "TechCorp", industry: "Technology", size: 1000 },
      { name: "FinanceHub", industry: "Finance", size: 500 },
      { name: "HealthTech", industry: "Healthcare", size: 200 },
      { name: "ShopMax", industry: "E-commerce", size: 750 },
      { name: "CloudFirst", industry: "Technology", size: 300 },
      { name: "DataDriven", industry: "Technology", size: 150 },
    ];

    for (const company of companies) {
      await session.run(
        "MATCH (i:Industry {name: $industry}) CREATE (c:Company {name: $name, size: $size})-[:IN_INDUSTRY]->(i)",
        company
      );
    }

    console.log("👔 Creating Job Postings...");
    const jobs = [
      {
        title: "Senior Full Stack Engineer",
        company: "TechCorp",
        salary_min: 120000,
        salary_max: 160000,
        location: "San Francisco, CA",
        description:
          "Looking for experienced full stack engineer to lead projects",
      },
      {
        title: "React Developer",
        company: "CloudFirst",
        salary_min: 90000,
        salary_max: 130000,
        location: "Remote",
        description: "Build beautiful UIs with React and TypeScript",
      },
      {
        title: "Backend Engineer",
        company: "ShopMax",
        salary_min: 95000,
        salary_max: 135000,
        location: "Seattle, WA",
        description:
          "Design scalable backend systems using Node.js and databases",
      },
      {
        title: "DevOps Engineer",
        company: "TechCorp",
        salary_min: 110000,
        salary_max: 150000,
        location: "Remote",
        description: "Manage infrastructure, Docker, Kubernetes, and AWS",
      },
      {
        title: "Data Scientist",
        company: "DataDriven",
        salary_min: 100000,
        salary_max: 140000,
        location: "New York, NY",
        description: "Apply ML and data analysis to business problems",
      },
      {
        title: "Full Stack Engineer",
        company: "HealthTech",
        salary_min: 85000,
        salary_max: 120000,
        location: "Boston, MA",
        description: "Build healthcare software with modern stack",
      },
      {
        title: "Tech Lead",
        company: "FinanceHub",
        salary_min: 130000,
        salary_max: 180000,
        location: "New York, NY",
        description: "Lead engineering team and mentor developers",
      },
      {
        title: "Frontend Engineer",
        company: "ShopMax",
        salary_min: 80000,
        salary_max: 120000,
        location: "Remote",
        description: "Create responsive web applications with React",
      },
    ];

    for (const job of jobs) {
      await session.run(
        `MATCH (c:Company {name: $company})
         CREATE (j:Job {title: $title, salary_min: $salary_min, salary_max: $salary_max, location: $location, description: $description})-[:POSTED_BY]->(c)`,
        job
      );
    }

    console.log("🔗 Adding skill requirements to jobs...");
    const jobSkillRequirements = [
      {
        jobTitle: "Senior Full Stack Engineer",
        skills: ["JavaScript", "React", "Node.js", "SQL", "TypeScript"],
        levels: ["EXPERT", "EXPERT", "EXPERT", "ADVANCED", "ADVANCED"],
      },
      {
        jobTitle: "React Developer",
        skills: ["React", "JavaScript", "TypeScript"],
        levels: ["ADVANCED", "ADVANCED", "INTERMEDIATE"],
      },
      {
        jobTitle: "Backend Engineer",
        skills: ["Node.js", "SQL", "Python", "Docker"],
        levels: ["ADVANCED", "ADVANCED", "INTERMEDIATE", "INTERMEDIATE"],
      },
      {
        jobTitle: "DevOps Engineer",
        skills: ["Docker", "Kubernetes", "AWS", "Python"],
        levels: ["EXPERT", "ADVANCED", "EXPERT", "INTERMEDIATE"],
      },
      {
        jobTitle: "Data Scientist",
        skills: ["Python", "Machine Learning", "Data Analysis", "SQL"],
        levels: ["ADVANCED", "EXPERT", "EXPERT", "INTERMEDIATE"],
      },
      {
        jobTitle: "Full Stack Engineer",
        skills: ["React", "Node.js", "SQL", "TypeScript", "Docker"],
        levels: [
          "INTERMEDIATE",
          "INTERMEDIATE",
          "INTERMEDIATE",
          "INTERMEDIATE",
          "INTERMEDIATE",
        ],
      },
      {
        jobTitle: "Tech Lead",
        skills: ["JavaScript", "Python", "Leadership", "Project Management"],
        levels: ["EXPERT", "ADVANCED", "ADVANCED", "ADVANCED"],
      },
      {
        jobTitle: "Frontend Engineer",
        skills: ["React", "JavaScript", "TypeScript"],
        levels: ["ADVANCED", "ADVANCED", "INTERMEDIATE"],
      },
    ];

    for (const req of jobSkillRequirements) {
      for (let i = 0; i < req.skills.length; i++) {
        await session.run(
          `MATCH (j:Job {title: $jobTitle}), (s:Skill {name: $skillName})
           CREATE (j)-[:REQUIRES {required_level: $level}]->(s)`,
          {
            jobTitle: req.jobTitle,
            skillName: req.skills[i],
            level: req.levels[i],
          }
        );
      }
    }

    console.log("👨‍💼 Creating Candidates...");
    const candidates = [
      {
        name: "Alice Johnson",
        email: "alice@example.com",
        years_experience: 8,
      },
      { name: "Bob Smith", email: "bob@example.com", years_experience: 5 },
      {
        name: "Carol Williams",
        email: "carol@example.com",
        years_experience: 3,
      },
      { name: "David Brown", email: "david@example.com", years_experience: 10 },
      { name: "Emma Davis", email: "emma@example.com", years_experience: 6 },
      { name: "Frank Miller", email: "frank@example.com", years_experience: 4 },
      { name: "Grace Lee", email: "grace@example.com", years_experience: 7 },
      { name: "Henry Wilson", email: "henry@example.com", years_experience: 2 },
    ];

    for (const candidate of candidates) {
      await session.run(
        "CREATE (:Candidate {name: $name, email: $email, years_experience: $years_experience})",
        candidate
      );
    }

    console.log("🎓 Adding skills to candidates...");
    const candidateSkills = [
      {
        name: "Alice Johnson",
        skills: ["JavaScript", "React", "Node.js", "TypeScript", "SQL"],
        levels: ["EXPERT", "EXPERT", "ADVANCED", "ADVANCED", "INTERMEDIATE"],
      },
      {
        name: "Bob Smith",
        skills: ["Python", "Machine Learning", "Data Analysis"],
        levels: ["ADVANCED", "ADVANCED", "ADVANCED"],
      },
      {
        name: "Carol Williams",
        skills: ["React", "JavaScript", "TypeScript"],
        levels: ["INTERMEDIATE", "INTERMEDIATE", "BEGINNER"],
      },
      {
        name: "David Brown",
        skills: ["Docker", "Kubernetes", "AWS", "Python", "Leadership"],
        levels: ["EXPERT", "EXPERT", "EXPERT", "ADVANCED", "ADVANCED"],
      },
      {
        name: "Emma Davis",
        skills: ["JavaScript", "React", "Node.js"],
        levels: ["ADVANCED", "ADVANCED", "INTERMEDIATE"],
      },
      {
        name: "Frank Miller",
        skills: ["SQL", "Python", "Docker"],
        levels: ["INTERMEDIATE", "INTERMEDIATE", "BEGINNER"],
      },
      {
        name: "Grace Lee",
        skills: ["GraphQL", "Node.js", "TypeScript", "React"],
        levels: ["ADVANCED", "ADVANCED", "ADVANCED", "INTERMEDIATE"],
      },
      {
        name: "Henry Wilson",
        skills: ["JavaScript", "React"],
        levels: ["BEGINNER", "BEGINNER"],
      },
    ];

    for (const candSkill of candidateSkills) {
      for (let i = 0; i < candSkill.skills.length; i++) {
        await session.run(
          `MATCH (c:Candidate {name: $name}), (s:Skill {name: $skillName})
           CREATE (c)-[:HAS_SKILL {level: $level, years: $years}]->(s)`,
          {
            name: candSkill.name,
            skillName: candSkill.skills[i],
            level: candSkill.levels[i],
            years: Math.floor(Math.random() * 5) + 1,
          }
        );
      }
    }

    console.log("🏢 Adding work experience to candidates...");
    const workExperience = [
      {
        candidate: "Alice Johnson",
        company: "TechCorp",
        role: "Senior Engineer",
        years: 3,
      },
      {
        candidate: "Alice Johnson",
        company: "CloudFirst",
        role: "Engineer",
        years: 3,
      },
      {
        candidate: "Bob Smith",
        company: "DataDriven",
        role: "Data Scientist",
        years: 4,
      },
      {
        candidate: "David Brown",
        company: "TechCorp",
        role: "DevOps Lead",
        years: 5,
      },
      {
        candidate: "Emma Davis",
        company: "ShopMax",
        role: "Frontend Engineer",
        years: 2,
      },
      {
        candidate: "Grace Lee",
        company: "CloudFirst",
        role: "Backend Engineer",
        years: 3,
      },
    ];

    for (const exp of workExperience) {
      await session.run(
        `MATCH (c:Candidate {name: $candidate}), (co:Company {name: $company})
         CREATE (c)-[:WORKED_AT {role: $role, years: $years}]->(co)`,
        exp
      );
    }

    console.log("💼 Creating job applications...");
    const applications = [
      {
        candidate: "Alice Johnson",
        job: "Senior Full Stack Engineer",
        status: "ACCEPTED",
      },
      { candidate: "Bob Smith", job: "Data Scientist", status: "INTERVIEW" },
      {
        candidate: "Carol Williams",
        job: "React Developer",
        status: "APPLIED",
      },
      {
        candidate: "Emma Davis",
        job: "Frontend Engineer",
        status: "INTERVIEW",
      },
      { candidate: "Grace Lee", job: "Backend Engineer", status: "APPLIED" },
      { candidate: "Frank Miller", job: "DevOps Engineer", status: "REJECTED" },
    ];

    for (const app of applications) {
      await session.run(
        `MATCH (c:Candidate {name: $candidate}), (j:Job {title: $job})
         CREATE (c)-[:APPLIED_FOR {status: $status, date: date()}]->(j)`,
        app
      );
    }

    console.log("🔗 Creating skill relationships...");
    const skillRelationships = [
      { skill1: "JavaScript", skill2: "TypeScript", strength: "STRONG" },
      { skill1: "React", skill2: "JavaScript", strength: "STRONG" },
      { skill1: "Node.js", skill2: "JavaScript", strength: "STRONG" },
      { skill1: "Docker", skill2: "Kubernetes", strength: "STRONG" },
      { skill1: "Kubernetes", skill2: "AWS", strength: "STRONG" },
      { skill1: "Python", skill2: "Machine Learning", strength: "STRONG" },
      { skill1: "SQL", skill2: "Data Analysis", strength: "MEDIUM" },
      { skill1: "GraphQL", skill2: "React", strength: "MEDIUM" },
    ];

    for (const rel of skillRelationships) {
      await session.run(
        `MATCH (s1:Skill {name: $skill1}), (s2:Skill {name: $skill2})
         CREATE (s1)-[:RELATED_TO {strength: $strength}]->(s2)`,
        rel
      );
    }

    console.log("✅ Data loaded successfully!");
  } catch (error) {
    console.error("❌ Error loading data:", error);
  } finally {
    await session.close();
    await closeDriver();
  }
}

loadData();
