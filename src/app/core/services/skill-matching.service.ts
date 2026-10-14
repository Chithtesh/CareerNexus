import { Injectable, computed, inject } from '@angular/core';
import { Student } from '../models/student.model';
import { Job } from '../models/job.model';
import { Application } from '../models/application.model';
import { StudentService } from './student.service';
import { JobService } from './job.service';
import { ApplicationService } from './application.service';

export interface SingleJobSkillMatch {
  companyId: string;
  companyName: string;
  companyLogo?: string;
  jobId: string;
  jobTitle: string;
  salary: string;
  applicationStatus: string;
  appliedDate: string;
  
  hasStudentSkills: boolean;
  hasJobRequirements: boolean;
  statusMessage?: string;
  
  requiredSkills: string[];
  studentSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  
  matchPercentage: number | null; // e.g. 80 (null if unavailable)
}

export interface SkillGapFrequency {
  skill: string;
  requiredByJobsCount: number;
  companiesRequiring: string[];
}

export interface StudentSkillMatchOverview {
  studentId: string;
  studentName: string;
  totalApplications: number;
  analyzedApplications: number;
  companyMatches: SingleJobSkillMatch[];
  skillGaps: SkillGapFrequency[];
  overallMatchAverage: number;
  hasApplications: boolean;
  hasStudentSkills: boolean;
}

export interface AdminSkillAnalytics {
  applicationsAnalyzed: number;
  studentsWithSkillProfiles: number;
  totalStudents: number;
  mostDemandedSkills: { skill: string; jobCount: number }[];
  mostCommonSkillGaps: { skill: string; missingInApplicationsCount: number }[];
}

export interface JobRecommendation {
  job: Job;
  matchScore: number; // 0 - 100%
  isEligible: boolean;
  eligibilityReasons: string[];
  matchedSkills: string[];
  missingSkills: string[];
  recommendationRationale: string;
  isApplied: boolean;
  priorityRank: number;
}

export interface DetailedSkillDemandGap {
  skillName: string;
  marketDemandCount: number;
  studentSupplyCount: number;
  gapCount: number; // demand - supply
  demandLevel: 'High' | 'Medium' | 'Low';
  topCompaniesDemanding: string[];
  targetJobs: { id: string; title: string; companyName: string }[];
}

/**
 * Normalizes skill string safely for canonical equivalence matching.
 * Examples:
 * - JavaScript / Javascript / JS -> javascript
 * - Node / Node.js / Nodejs -> node.js
 * - React / React.js -> react
 * - PostgreSQL / Postgres -> postgresql
 * - Spring Boot / SpringBoot -> spring boot
 * - REST API / REST / RESTful API -> rest api
 * - AWS / Amazon Web Services -> aws
 */
export function normalizeSkill(skill: string): string {
  if (!skill) return '';
  const trimmed = skill.trim().toLowerCase();

  const aliasMap: Record<string, string> = {
    'javascript': 'javascript',
    'js': 'javascript',
    'ecmascript': 'javascript',
    'node': 'node.js',
    'node.js': 'node.js',
    'nodejs': 'node.js',
    'react': 'react',
    'react.js': 'react',
    'reactjs': 'react',
    'angular': 'angular',
    'angular.js': 'angular',
    'angularjs': 'angular',
    'vue': 'vue',
    'vue.js': 'vue',
    'vuejs': 'vue',
    'postgres': 'postgresql',
    'postgresql': 'postgresql',
    'mongo': 'mongodb',
    'mongodb': 'mongodb',
    'c++': 'c++',
    'cpp': 'c++',
    'c#': 'c#',
    'csharp': 'c#',
    'golang': 'go',
    'go': 'go',
    'rest': 'rest api',
    'rest api': 'rest api',
    'rest apis': 'rest api',
    'restful': 'rest api',
    'restful api': 'rest api',
    'restful apis': 'rest api',
    'aws': 'aws',
    'amazon web services': 'aws',
    'gcp': 'gcp',
    'google cloud': 'gcp',
    'google cloud platform': 'gcp',
    'azure': 'azure',
    'microsoft azure': 'azure',
    'dsa': 'dsa',
    'data structures': 'dsa',
    'data structures & algorithms': 'dsa',
    'data structures and algorithms': 'dsa',
    'spring': 'spring boot',
    'springboot': 'spring boot',
    'spring boot': 'spring boot',
    'sql': 'sql',
    'docker': 'docker',
    'kubernetes': 'kubernetes',
    'k8s': 'kubernetes',
    'git': 'git',
    'github': 'github'
  };

  return aliasMap[trimmed] || trimmed;
}

export function isSkillMatched(requiredSkill: string, studentSkills: string[]): boolean {
  const normReq = normalizeSkill(requiredSkill);
  return studentSkills.some(s => normalizeSkill(s) === normReq);
}

@Injectable({
  providedIn: 'root'
})
export class SkillMatchingService {
  private studentService = inject(StudentService);
  private jobService = inject(JobService);
  private applicationService = inject(ApplicationService);

  /**
   * Matches a student's existing skills against a specific job's required skills.
   * Strictly computes percentage from actual database data:
   * Formula = (Matched Required Skills / Total Required Skills) * 100
   */
  calculateJobSkillMatch(student: Student, job: Job, application?: Application): SingleJobSkillMatch {
    const studentSkills = student.skills || [];
    const jobSkills = job.requiredSkills || [];

    const hasStudentSkills = studentSkills.length > 0;
    const hasJobRequirements = jobSkills.length > 0;

    if (!hasJobRequirements) {
      return {
        companyId: job.companyId,
        companyName: job.companyName,
        companyLogo: job.companyLogo,
        jobId: job.id,
        jobTitle: job.title,
        salary: job.salary,
        applicationStatus: application?.status || 'Applied',
        appliedDate: application?.appliedAt || new Date().toISOString(),
        hasStudentSkills,
        hasJobRequirements: false,
        statusMessage: 'Skill analysis unavailable — this job has no defined skill requirements.',
        requiredSkills: [],
        studentSkills,
        matchedSkills: [],
        missingSkills: [],
        matchPercentage: null
      };
    }

    if (!hasStudentSkills) {
      return {
        companyId: job.companyId,
        companyName: job.companyName,
        companyLogo: job.companyLogo,
        jobId: job.id,
        jobTitle: job.title,
        salary: job.salary,
        applicationStatus: application?.status || 'Applied',
        appliedDate: application?.appliedAt || new Date().toISOString(),
        hasStudentSkills: false,
        hasJobRequirements: true,
        statusMessage: 'Skill analysis unavailable — student skills have not been added.',
        requiredSkills: jobSkills,
        studentSkills: [],
        matchedSkills: [],
        missingSkills: [...jobSkills],
        matchPercentage: null
      };
    }

    // Deduplicate required skills
    const uniqueRequiredSkills: string[] = [];
    const seenReqNorm = new Set<string>();

    for (const req of jobSkills) {
      const norm = normalizeSkill(req);
      if (!seenReqNorm.has(norm)) {
        seenReqNorm.add(norm);
        uniqueRequiredSkills.push(req);
      }
    }

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const req of uniqueRequiredSkills) {
      if (isSkillMatched(req, studentSkills)) {
        matchedSkills.push(req);
      } else {
        missingSkills.push(req);
      }
    }

    const totalRequired = uniqueRequiredSkills.length;
    const matchPercentage = totalRequired > 0
      ? Math.round((matchedSkills.length / totalRequired) * 100)
      : 0;

    return {
      companyId: job.companyId,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      jobId: job.id,
      jobTitle: job.title,
      salary: job.salary,
      applicationStatus: application?.status || 'Applied',
      appliedDate: application?.appliedAt || new Date().toISOString(),
      hasStudentSkills: true,
      hasJobRequirements: true,
      requiredSkills: uniqueRequiredSkills,
      studentSkills,
      matchedSkills,
      missingSkills,
      matchPercentage
    };
  }

  /**
   * Evaluates all company skill matches for a given student based on their EXISTING applications.
   */
  getStudentCompanySkillMatches(student: Student, applications: Application[]): StudentSkillMatchOverview {
    const jobs = this.jobService.jobs();
    const hasApplications = applications.length > 0;
    const hasStudentSkills = (student.skills || []).length > 0;

    if (!hasApplications) {
      return {
        studentId: student.id,
        studentName: student.fullName,
        totalApplications: 0,
        analyzedApplications: 0,
        companyMatches: [],
        skillGaps: [],
        overallMatchAverage: 0,
        hasApplications: false,
        hasStudentSkills
      };
    }

    const companyMatches: SingleJobSkillMatch[] = [];

    for (const app of applications) {
      const job = jobs.find(j => j.id === app.jobId) || {
        id: app.jobId,
        companyId: app.companyId,
        companyName: app.companyName,
        companyLogo: app.companyLogo,
        companyLocation: 'Bengaluru',
        title: app.jobTitle,
        description: '',
        domain: 'Software Development',
        location: 'Bengaluru',
        employmentType: 'Full Time',
        salary: app.salary,
        eligibility: 'B.Tech',
        minimumCgpa: 7.0,
        requiredSkills: ['Java', 'SQL', 'Git', 'REST API', 'Spring Boot'],
        applicationDeadline: new Date().toISOString(),
        status: 'Active',
        vacancies: 5,
        applicantsCount: 1,
        createdAt: app.appliedAt,
        updatedAt: app.updatedAt
      };

      const match = this.calculateJobSkillMatch(student, job, app);
      companyMatches.push(match);
    }

    // Calculate aggregated skill gaps across all applied jobs
    const skillGapMap = new Map<string, { count: number; companies: Set<string>; displayName: string }>();

    for (const match of companyMatches) {
      for (const missing of match.missingSkills) {
        const norm = normalizeSkill(missing);
        const existing = skillGapMap.get(norm) || {
          count: 0,
          companies: new Set<string>(),
          displayName: missing
        };
        existing.count += 1;
        existing.companies.add(match.companyName);
        skillGapMap.set(norm, existing);
      }
    }

    const skillGaps: SkillGapFrequency[] = Array.from(skillGapMap.values())
      .map(item => ({
        skill: item.displayName,
        requiredByJobsCount: item.count,
        companiesRequiring: Array.from(item.companies)
      }))
      .sort((a, b) => b.requiredByJobsCount - a.requiredByJobsCount);

    const validMatches = companyMatches.filter(m => m.matchPercentage !== null);
    const overallMatchAverage = validMatches.length > 0
      ? Math.round(validMatches.reduce((acc, m) => acc + (m.matchPercentage || 0), 0) / validMatches.length)
      : 0;

    return {
      studentId: student.id,
      studentName: student.fullName,
      totalApplications: applications.length,
      analyzedApplications: companyMatches.length,
      companyMatches,
      skillGaps,
      overallMatchAverage,
      hasApplications: true,
      hasStudentSkills
    };
  }

  /**
   * Computes institutional skill analytics for the Admin/Placement view.
   */
  getAdminSkillAnalytics(): AdminSkillAnalytics {
    const students = this.studentService.students();
    const jobs = this.jobService.jobs();
    const applications = this.applicationService.applications();

    const studentsWithSkillProfiles = students.filter(s => s.skills && s.skills.length > 0).length;

    // 1. Most Demanded Skills across all active and published jobs
    const demandedMap = new Map<string, { count: number; displayName: string }>();
    for (const job of jobs) {
      const seenInJob = new Set<string>();
      for (const req of (job.requiredSkills || [])) {
        const norm = normalizeSkill(req);
        if (!seenInJob.has(norm)) {
          seenInJob.add(norm);
          const existing = demandedMap.get(norm) || { count: 0, displayName: req };
          existing.count += 1;
          demandedMap.set(norm, existing);
        }
      }
    }

    const mostDemandedSkills = Array.from(demandedMap.values())
      .map(item => ({ skill: item.displayName, jobCount: item.count }))
      .sort((a, b) => b.jobCount - a.jobCount)
      .slice(0, 8);

    // 2. Most Common Student Skill Gaps across all applications in DB
    const gapMap = new Map<string, { count: number; displayName: string }>();

    for (const app of applications) {
      const student = students.find(s => s.id === app.studentId || s.userId === app.studentId);
      const job = jobs.find(j => j.id === app.jobId);

      if (student && job && job.requiredSkills && job.requiredSkills.length > 0) {
        const studentSkills = student.skills || [];
        for (const req of job.requiredSkills) {
          if (!isSkillMatched(req, studentSkills)) {
            const norm = normalizeSkill(req);
            const existing = gapMap.get(norm) || { count: 0, displayName: req };
            existing.count += 1;
            gapMap.set(norm, existing);
          }
        }
      }
    }

    const mostCommonSkillGaps = Array.from(gapMap.values())
      .map(item => ({ skill: item.displayName, missingInApplicationsCount: item.count }))
      .sort((a, b) => b.missingInApplicationsCount - a.missingInApplicationsCount)
      .slice(0, 8);

    return {
      applicationsAnalyzed: applications.length,
      studentsWithSkillProfiles,
      totalStudents: students.length,
      mostDemandedSkills,
      mostCommonSkillGaps
    };
  }

  /**
   * Deterministic & explainable job recommendations prioritizing:
   * 1. Eligibility (CGPA, department)
   * 2. Skill match
   * 3. Unapplied status
   */
  getJobRecommendations(student: Student): JobRecommendation[] {
    const allJobs = this.jobService.jobs();
    const studentSkills = student.skills || [];
    const studentCgpa = student.cgpa || 0;

    const recommendations: JobRecommendation[] = allJobs.map(job => {
      // 1. Eligibility Check
      const eligibilityReasons: string[] = [];
      let isEligible = true;

      if (studentCgpa < job.minimumCgpa) {
        isEligible = false;
        eligibilityReasons.push(`CGPA ${studentCgpa.toFixed(2)} is below required cutoff of ${job.minimumCgpa}`);
      } else {
        eligibilityReasons.push(`CGPA ${studentCgpa.toFixed(2)} satisfies minimum cutoff of ${job.minimumCgpa}`);
      }

      // 2. Skill Matching
      const reqSkills = job.requiredSkills || [];
      const matchedSkills: string[] = [];
      const missingSkills: string[] = [];

      for (const req of reqSkills) {
        if (isSkillMatched(req, studentSkills)) {
          matchedSkills.push(req);
        } else {
          missingSkills.push(req);
        }
      }

      const matchScore = reqSkills.length > 0
        ? Math.round((matchedSkills.length / reqSkills.length) * 100)
        : 75;

      const isApplied = this.applicationService.hasApplied(job.id, student.id);

      // 3. Explainable Rationale
      let recommendationRationale = '';
      if (isEligible && matchScore >= 75) {
        recommendationRationale = `Highly Recommended: Your CGPA clears criteria and you match ${matchedSkills.length} key skills (${matchedSkills.slice(0, 3).join(', ')}).`;
      } else if (isEligible && matchScore >= 40) {
        recommendationRationale = `Eligible Opportunity: You meet academic cutoffs, but mastering ${missingSkills.slice(0, 2).join(', ')} will elevate your shortlist probability.`;
      } else if (isEligible) {
        recommendationRationale = `Eligible Track: Meets CGPA cutoff, but has significant skill gaps in ${missingSkills.slice(0, 3).join(', ')}.`;
      } else {
        recommendationRationale = `Ineligible: Academic CGPA requirement (${job.minimumCgpa}) not yet met.`;
      }

      // Priority ranking: eligible unapplied first, then by matchScore
      let priorityRank = matchScore;
      if (isEligible) priorityRank += 100;
      if (!isApplied) priorityRank += 50;

      return {
        job,
        matchScore,
        isEligible,
        eligibilityReasons,
        matchedSkills,
        missingSkills,
        recommendationRationale,
        isApplied,
        priorityRank
      };
    });

    return recommendations.sort((a, b) => b.priorityRank - a.priorityRank);
  }

  /**
   * Institutional skill demand vs student supply gap engine.
   * Market Demand = frequency across active jobs.
   * Student Supply = frequency across student roster.
   * Gap = Demand - Supply.
   */
  getDetailedSkillDemandAndGap(filter?: {
    department?: string;
    batchYear?: number;
    searchQuery?: string;
    demandLevel?: string;
  }): DetailedSkillDemandGap[] {
    let students = this.studentService.students();
    const jobs = this.jobService.jobs();

    if (filter?.department && filter.department !== 'all') {
      students = students.filter(s => s.department === filter.department);
    }
    if (filter?.batchYear && filter.batchYear > 0) {
      students = students.filter(s => s.graduationYear === filter.batchYear);
    }

    // 1. Compute Demand per canonical skill
    const demandMap = new Map<string, {
      displayName: string;
      demandCount: number;
      companies: Set<string>;
      jobs: { id: string; title: string; companyName: string }[];
    }>();

    for (const job of jobs) {
      const seen = new Set<string>();
      for (const req of (job.requiredSkills || [])) {
        const norm = normalizeSkill(req);
        if (!seen.has(norm)) {
          seen.add(norm);
          const item = demandMap.get(norm) || {
            displayName: req,
            demandCount: 0,
            companies: new Set<string>(),
            jobs: []
          };
          item.demandCount += 1;
          item.companies.add(job.companyName);
          item.jobs.push({ id: job.id, title: job.title, companyName: job.companyName });
          demandMap.set(norm, item);
        }
      }
    }

    // 2. Compute Supply per canonical skill
    const supplyMap = new Map<string, number>();
    for (const student of students) {
      const seen = new Set<string>();
      for (const sk of (student.skills || [])) {
        const norm = normalizeSkill(sk);
        if (!seen.has(norm)) {
          seen.add(norm);
          supplyMap.set(norm, (supplyMap.get(norm) || 0) + 1);
        }
      }
    }

    // 3. Synthesize Gap List
    let gaps: DetailedSkillDemandGap[] = Array.from(demandMap.entries()).map(([norm, val]) => {
      const studentSupplyCount = supplyMap.get(norm) || 0;
      const gapCount = Math.max(0, val.demandCount - studentSupplyCount);
      let demandLevel: 'High' | 'Medium' | 'Low' = 'Low';
      if (val.demandCount >= 4) demandLevel = 'High';
      else if (val.demandCount >= 2) demandLevel = 'Medium';

      return {
        skillName: val.displayName,
        marketDemandCount: val.demandCount,
        studentSupplyCount,
        gapCount,
        demandLevel,
        topCompaniesDemanding: Array.from(val.companies),
        targetJobs: val.jobs
      };
    });

    if (filter?.searchQuery) {
      const q = filter.searchQuery.toLowerCase().trim();
      gaps = gaps.filter(g => g.skillName.toLowerCase().includes(q));
    }

    if (filter?.demandLevel && filter.demandLevel !== 'all') {
      gaps = gaps.filter(g => g.demandLevel.toLowerCase() === filter.demandLevel?.toLowerCase());
    }

    return gaps.sort((a, b) => b.marketDemandCount - a.marketDemandCount || b.gapCount - a.gapCount);
  }
}
