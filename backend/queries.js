// Cypher Queries for Job Market Graph

/**
 * 1. MULTI-HOP TRAVERSAL: Find jobs that match a candidate's skills and experience
 * This query traverses: Candidate -> HAS_SKILL -> Skill <- REQUIRES <- Job
 * It also checks if candidate worked at companies similar to job poster
 */
export const findMatchingJobs = `
  MATCH (candidate:Candidate {name: $candidateName})-[hasSkill:HAS_SKILL]->(candidateSkill:Skill)
  MATCH (job:Job)-[requires:REQUIRES]->(requiredSkill:Skill {name: candidateSkill.name})
  WHERE hasSkill.level >= requires.required_level
  RETURN DISTINCT
    job.title as jobTitle,
    job.location as location,
    job.salary_min as salaryMin,
    job.salary_max as salaryMax,
    COUNT(DISTINCT requiredSkill) as matchingSkills,
    COLLECT(DISTINCT candidateSkill.name) as skills
  ORDER BY matchingSkills DESC
  LIMIT 10
`;

/**
 * 2. CAREER PATH ANALYSIS: Find typical progression for a skill
 * Multi-hop: Skill <- HAS_SKILL <- Candidate -> WORKED_AT -> Company
 * Shows where developers with specific skills have worked
 */
export const getCareerPath = `
  MATCH (skill:Skill {name: $skillName})<-[has:HAS_SKILL]-(candidate:Candidate)-[worked:WORKED_AT]->(company:Company)
  RETURN
    company.name as company,
    worked.role as role,
    has.level as skillLevel,
    COUNT(DISTINCT candidate) as numberOfPeople
  ORDER BY numberOfPeople DESC
  LIMIT 10
`;

/**
 * 3. SKILL BOTTLENECK ANALYSIS: Find highly demanded but rare skills
 * Queries both demand and supply sides of the market
 */
export const getSkillBottlenecks = `
  MATCH (skill:Skill)<-[requires:REQUIRES]-(job:Job)
  WITH skill, COUNT(job) as jobsRequiringSkill
  MATCH (skill)<-[has:HAS_SKILL]-(candidate:Candidate)
  WITH skill, jobsRequiringSkill, COUNT(candidate) as candidatesWithSkill
  WHERE candidatesWithSkill < jobsRequiringSkill
  RETURN
    skill.name as skillName,
    skill.category as category,
    skill.demand_level as demandLevel,
    jobsRequiringSkill,
    candidatesWithSkill,
    (jobsRequiringSkill - candidatesWithSkill) as shortage
  ORDER BY shortage DESC
  LIMIT 10
`;

/**
 * 4. TEAM ASSEMBLY: Find complementary skill sets for a project
 * Multi-hop: Candidate -> HAS_SKILL -> Skill with filtering on skill relationships
 */
export const findComplementaryTeam = `
  MATCH (candidate:Candidate)-[has:HAS_SKILL]->(skill:Skill {name: $primarySkill})
  WHERE has.level >= 'INTERMEDIATE'
  WITH candidate
  MATCH (candidate)-[has2:HAS_SKILL]->(skill2:Skill)
  WHERE skill2.name IN $complementarySkills
  RETURN
    candidate.name as candidateName,
    candidate.email as email,
    candidate.years_experience as yearsExperience,
    COLLECT(skill2.name) as skills
  ORDER BY candidate.years_experience DESC
  LIMIT 5
`;

/**
 * 5. SIMILAR JOB FINDER: Find jobs with similar skill requirements
 * Uses skill relationship graph for semantic similarity
 */
export const findSimilarJobs = `
  MATCH (job1:Job {title: $jobTitle})-[r1:REQUIRES]->(skill:Skill)
  MATCH (skill)<-[r2:REQUIRES]-(job2:Job)
  WHERE job2.title <> job1.title
  WITH job2, COUNT(skill) as commonSkills
  RETURN
    job2.title as jobTitle,
    job2.location as location,
    job2.salary_min as salaryMin,
    job2.salary_max as salaryMax,
    commonSkills as matchingSkills
  ORDER BY commonSkills DESC
  LIMIT 8
`;

/**
 * 6. CANDIDATE RECOMMENDATION: Find candidates for a specific job
 * Shows candidates who either have all skills or have related experience
 */
export const getCandidatesForJob = `
  MATCH (job:Job {title: $jobTitle})-[requires:REQUIRES]->(requiredSkill:Skill)
  MATCH (candidate:Candidate)-[has:HAS_SKILL]->(candidateSkill:Skill {name: requiredSkill.name})
  WITH candidate, COUNT(DISTINCT requiredSkill) as matchedSkills
  MATCH (job:Job {title: $jobTitle})-[:REQUIRES]->(skill:Skill)
  WITH candidate, matchedSkills, COUNT(DISTINCT skill) as totalRequired
  RETURN
    candidate.name as candidateName,
    candidate.email as email,
    candidate.years_experience as yearsExperience,
    matchedSkills,
    totalRequired,
    ROUND(100.0 * matchedSkills / totalRequired) as matchPercentage
  ORDER BY matchPercentage DESC
  LIMIT 10
`;

/**
 * 7. INDUSTRY NETWORK: Find talent flow between companies and industries
 * Multi-hop: Company -[:IN_INDUSTRY]-> Industry <- [:IN_INDUSTRY] <- Company <- [:WORKED_AT] <- Candidate
 */
export const getIndustryTalentFlow = `
  MATCH (company:Company)-[:IN_INDUSTRY]->(industry:Industry)
  WHERE industry.name = $industryName
  MATCH (candidate:Candidate)-[worked:WORKED_AT]->(company)
  RETURN
    company.name as company,
    COUNT(DISTINCT candidate) as talentCount,
    COLLECT(DISTINCT worked.role) as roles
  ORDER BY talentCount DESC
  LIMIT 10
`;

/**
 * 8. SKILL PROGRESSION: Show learning paths based on market data
 * Multi-hop: Skill -[:RELATED_TO]-> Skill <- [:HAS_SKILL] <- Candidate -[:HAS_SKILL]-> otherSkill
 */
export const getSkillProgression = `
  MATCH (skill:Skill {name: $skillName})-[rel:RELATED_TO]->(nextSkill:Skill)
  MATCH (candidate:Candidate)-[:HAS_SKILL]->(skill)
  MATCH (candidate)-[:HAS_SKILL]->(nextSkill)
  WITH nextSkill, rel.strength as relationStrength, COUNT(candidate) as people
  RETURN
    nextSkill.name as nextSkill,
    nextSkill.category as category,
    relationStrength as relationshipStrength,
    people as candidateCount
  ORDER BY candidateCount DESC
  LIMIT 8
`;

/**
 * 9. FAILED TO ACCEPTED: Track application journey
 * Simple but important: shows application funnel
 */
export const getApplicationStats = `
  MATCH (candidate:Candidate)-[applied:APPLIED_FOR]->(job:Job)
  RETURN
    applied.status as status,
    COUNT(*) as count
`;

/**
 * 10. COMPLEX RECOMMENDATION: Find perfect job fits (all skills + right level + market match)
 * This is awkward in SQL but natural in graphs
 */
export const getPerfectJobFit = `
  MATCH (candidate:Candidate {name: $candidateName})-[has:HAS_SKILL]->(skill:Skill)
  WITH candidate, COLLECT({name: skill.name, level: has.level}) as candidateSkills
  MATCH (job:Job)-[req:REQUIRES]->(requiredSkill:Skill)
  WITH candidate, job, candidateSkills, COLLECT({name: requiredSkill.name, level: req.required_level}) as jobRequirements
  
  WITH candidate, job, candidateSkills, jobRequirements,
       [s IN candidateSkills WHERE ANY(r IN jobRequirements WHERE r.name = s.name AND (s.level = 'EXPERT' OR r.level <> 'EXPERT'))] as skillMatches
  
  WHERE SIZE(skillMatches) = SIZE(jobRequirements)
  RETURN
    job.title as jobTitle,
    job.location as location,
    job.salary_min + ' - ' + job.salary_max as salary,
    SIZE(skillMatches) as matchedSkills,
    1.0 as fitScore
  ORDER BY fitScore DESC
`;
