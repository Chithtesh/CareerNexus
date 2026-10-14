import { Injectable, signal, computed, inject } from '@angular/core';
import { 
  CareerRecommendation, 
  PersonalizedRoadmap, 
  RoadmapPhase 
} from '../models/career.model';
import { 
  ResumeAnalysisReport, 
  ResumeAnalysisScore, 
  ResumeGapItem 
} from '../models/resume.model';
import { 
  MockInterviewSession, 
  InterviewQuestion, 
  InterviewQuestionCategory,
  UserInterviewAnswer 
} from '../models/mock-interview.model';
import { Student } from '../models/student.model';
import { Job } from '../models/job.model';
import { Application } from '../models/application.model';
import { ToastService } from './toast.service';

const QUESTION_BANK: { [category: string]: { question: string; tips: string; criteria: string[]; strongPoints: string[] }[] } = {
  Technical: [
    {
      question: 'Explain the difference between indexing using B-Trees vs Hash Tables in PostgreSQL and when you would use each.',
      tips: 'Mention range queries vs point lookups, memory overhead, and disk page alignment.',
      criteria: ['Understands B-Tree log(N) range search', 'Knows Hash O(1) equality only limitation', 'Mentions disk page I/O efficiency'],
      strongPoints: ['B-Trees support range operators (<, <=, BETWEEN)', 'Hash indexes require exact equality']
    },
    {
      question: 'How do you design an idempotent payment processing API to handle network retries without double charging?',
      tips: 'Explain idempotency keys, database unique constraints, atomic transactions, and distributed locks.',
      criteria: ['Idempotency key in request header', 'Database locking or redis cache layer', 'Handling race conditions'],
      strongPoints: ['Atomic check-and-insert with UUID idempotency token', 'Two-phase commit or saga pattern for third-party gateways']
    },
    {
      question: 'Explain how Node.js event loop handles microtasks (Promises) vs macrotasks (setTimeout, I/O callbacks).',
      tips: 'Discuss microtask queue drain after every phase of the event loop.',
      criteria: ['Distinguishes Promise.then queue from timers', 'Explains process.nextTick priority', 'Understands non-blocking I/O'],
      strongPoints: ['Microtasks run immediately after current synchronous script completes', 'Timer callbacks run in timer phase']
    }
  ],
  HR: [
    {
      question: 'Why do you want to join our engineering team over other tech companies, and where do you see yourself contributing most in your first 90 days?',
      tips: 'Show alignment with company culture, engineering values, and eagerness to ship reliable code.',
      criteria: ['Researched company mission and products', 'Realistic 30-60-90 day goal', 'Team collaboration mindset'],
      strongPoints: ['First 30 days: Onboarding, reading codebase, fixing first bug', '60-90 days: Owning independent feature sprints']
    },
    {
      question: 'Describe a situation where you had a tight deadline and had to prioritize features or negotiate scope with your team.',
      tips: 'Use the STAR method (Situation, Task, Action, Result) with quantified impact.',
      criteria: ['Clear structured narrative', 'Constructive communication', 'Positive outcome without burnout'],
      strongPoints: ['Categorized features using MoSCoW prioritization', 'Shipped MVP on time with zero regressions']
    }
  ],
  Behavioral: [
    {
      question: 'Tell me about a time you disagreed with a senior engineer or peer about an architectural decision. How did you resolve it?',
      tips: 'Focus on objective benchmarking, data-backed discussions, and disagree-and-commit maturity.',
      criteria: ['Maintained professional respect', 'Used benchmarks/prototyping rather than opinions', 'Aligned on shared project goal'],
      strongPoints: ['Created quick spike benchmarks comparing Redis vs Memcached latency', 'Reached consensus based on empirical results']
    }
  ],
  'Project-based': [
    {
      question: 'Walk me through the most technically challenging project on your profile. What was the bottleneck and how did you diagnose it?',
      tips: 'Highlight technical architecture, profiling tools used, and metrics achieved.',
      criteria: ['Clear architectural explanation', 'Diagnostic approach (metrics/logs)', 'Measured improvement (latency, memory)'],
      strongPoints: ['Identified N+1 database queries using APM profiler', 'Reduced response latency from 850ms to 45ms using Redis caching']
    }
  ]
};

@Injectable({
  providedIn: 'root'
})
export class CareerService {
  private toast = inject(ToastService);

  private readonly INTERVIEWS_CACHE_KEY = 'careernexus_mock_interviews_cache';

  interviewSessionsSignal = signal<MockInterviewSession[]>(this.loadInitialInterviews());
  interviewSessions = computed(() => this.interviewSessionsSignal());

  private loadInitialInterviews(): MockInterviewSession[] {
    try {
      const stored = localStorage.getItem(this.INTERVIEWS_CACHE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      {
        id: 'mock-1',
        studentId: 'std-101',
        companyName: 'Google',
        jobRole: 'Software Development Engineer',
        sessionTitle: 'Google SDE Full-Stack & System Design Simulation',
        totalQuestions: 4,
        completedQuestions: 4,
        answers: [
          {
            questionId: 'q-tech-1',
            questionText: 'Explain the difference between indexing using B-Trees vs Hash Tables in PostgreSQL.',
            category: 'Technical',
            userNotesOrAnswer: 'B-Trees allow range queries in O(log N) and are used by default. Hash indexes only support O(1) equality lookups.',
            selfConfidenceScore: 5,
            feedbackNotes: 'Excellent concise answer. Addressed range scanning correctly.',
            recordedAt: '2026-09-24T10:00:00Z'
          },
          {
            questionId: 'q-hr-1',
            questionText: 'Why do you want to join our engineering team over other tech companies?',
            category: 'HR',
            userNotesOrAnswer: 'Passionate about planet-scale distributed systems and open-source infrastructure.',
            selfConfidenceScore: 4,
            feedbackNotes: 'Good passion shown. Mention specific products you are excited about.',
            recordedAt: '2026-09-24T10:15:00Z'
          }
        ],
        weakAreasIdentified: ['High-concurrency distributed locking', 'Multi-region failover replication'],
        strongAreasIdentified: ['SQL Indexing', 'Algorithmic complexity', 'Clear communication'],
        createdAt: '2026-09-24T09:30:00Z',
        completedAt: '2026-09-24T10:20:00Z'
      }
    ];
  }

  private saveInterviewsToCache(list: MockInterviewSession[]) {
    try {
      localStorage.setItem(this.INTERVIEWS_CACHE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  /**
   * Transparent Career Recommendation Engine based on student skills and available jobs.
   */
  getCareerRecommendations(student: Student, jobs: Job[]): CareerRecommendation[] {
    const studentSkillsLower = (student.skills || []).map(s => s.toLowerCase().trim());

    return jobs.map(job => {
      const required = job.requiredSkills || [];
      const matched = required.filter(r => studentSkillsLower.includes(r.toLowerCase().trim()));
      const missing = required.filter(r => !studentSkillsLower.includes(r.toLowerCase().trim()));
      const matchPct = required.length > 0 ? Math.round((matched.length / required.length) * 100) : 80;

      const isCgpaEligible = student.cgpa >= job.minimumCgpa;
      const eligibilityStatus: 'Eligible' | 'Criteria Review Needed' = isCgpaEligible ? 'Eligible' : 'Criteria Review Needed';

      const recommendedTasks: string[] = [];
      if (missing.length > 0) {
        recommendedTasks.push(`Complete ${missing[0]} mastery challenge`);
      }
      recommendedTasks.push(`${job.companyName} Mock Assessment`);
      recommendedTasks.push(`Targeted Project in ${job.domain}`);

      let hiringTrends = 'High hiring surge this placement season across top engineering institutes.';
      if (job.salary.includes('30') || job.salary.includes('40')) {
        hiringTrends = 'Tier-1 Super Dream package with premium hiring volume.';
      }

      return {
        id: `rec-${job.id}`,
        roleTitle: job.title,
        domain: job.domain,
        companyName: job.companyName,
        companyLogo: job.companyLogo,
        averageSalary: job.salary,
        skillMatchPercentage: matchPct,
        matchedSkills: matched,
        missingSkills: missing,
        eligibilityStatus,
        recommendedTasks,
        hiringTrends
      };
    }).sort((a, b) => b.skillMatchPercentage - a.skillMatchPercentage);
  }

  /**
   * Builds a personalized multi-phase learning roadmap.
   */
  getPersonalizedRoadmap(student: Student, applications: Application[], jobs: Job[]): PersonalizedRoadmap {
    const studentSkills = student.skills || [];
    const studentSkillsLower = studentSkills.map(s => s.toLowerCase().trim());

    // Extract all required skills from applied or recommended jobs
    const targetSkills = new Set<string>();
    jobs.forEach(j => (j.requiredSkills || []).forEach(s => targetSkills.add(s)));
    const missing = Array.from(targetSkills).filter(s => !studentSkillsLower.includes(s.toLowerCase().trim()));

    const phase1: RoadmapPhase = {
      phaseNumber: 1,
      title: 'Phase 1: Algorithmic Problem Solving & Data Structures',
      focusArea: 'Core CS Foundations',
      status: 'Completed',
      milestones: [
        {
          id: 'm1-1',
          title: 'Master Trie, Graph BFS/DFS & Dynamic Programming',
          description: 'Solve 30 top-interview algorithmic problems with optimal time complexity.',
          skillTarget: 'Data Structures',
          estimatedHours: 20,
          status: 'Completed',
          resourceLinks: [{ title: 'DSA Practice Guide', url: 'https://leetcode.com' }]
        },
        {
          id: 'm1-2',
          title: 'Database Schema Design & Query Indexing Optimization',
          description: 'Practice multi-table JOINs, B-Tree indexes, and transaction isolation.',
          skillTarget: 'SQL & PostgreSQL',
          estimatedHours: 15,
          status: 'Completed',
          resourceLinks: [{ title: 'Use The Index, Luke!', url: 'https://use-the-index-luke.com' }]
        }
      ]
    };

    const phase2: RoadmapPhase = {
      phaseNumber: 2,
      title: 'Phase 2: High-Performance Backend & Microservices',
      focusArea: 'Backend & Cloud Architecture',
      status: 'In Progress',
      milestones: [
        {
          id: 'm2-1',
          title: `Bridge Skill Gap: ${missing[0] || 'Spring Boot & Redis'}`,
          description: `Build a real-world microservice utilizing caching, rate-limiting, and async message queues.`,
          skillTarget: missing[0] || 'Spring Boot',
          estimatedHours: 25,
          status: 'In Progress',
          resourceLinks: [{ title: 'Architecture Best Practices', url: 'https://spring.io/guides' }]
        },
        {
          id: 'm2-2',
          title: `Containerization with Docker & Cloud Deployment`,
          description: 'Create multi-stage Dockerfiles and deploy sample services on Cloud Run / Azure.',
          skillTarget: 'Docker',
          estimatedHours: 12,
          status: 'Upcoming',
          resourceLinks: [{ title: 'Docker Official Docs', url: 'https://docs.docker.com' }]
        }
      ]
    };

    const phase3: RoadmapPhase = {
      phaseNumber: 3,
      title: 'Phase 3: System Design & Scalability Deep-Dive',
      focusArea: 'Distributed Systems',
      status: 'Upcoming',
      milestones: [
        {
          id: 'm3-1',
          title: 'High-Level Architecture for Tier-1 Drives',
          description: 'Design distributed caching, CDN integration, and database sharding strategies.',
          skillTarget: 'System Design',
          estimatedHours: 30,
          status: 'Upcoming',
          resourceLinks: [{ title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }]
        }
      ]
    };

    const phase4: RoadmapPhase = {
      phaseNumber: 4,
      title: 'Phase 4: Behavioral Alignment & Mock Interview Clearing',
      focusArea: 'Interview Preparation',
      status: 'Upcoming',
      milestones: [
        {
          id: 'm4-1',
          title: 'STAR Method Behavioral Responses & Leadership Checklist',
          description: 'Formulate and rehearse 6 core leadership stories for Googliness & HR rounds.',
          skillTarget: 'Communication & Leadership',
          estimatedHours: 10,
          status: 'Upcoming',
          resourceLinks: [{ title: 'STAR Framework Kit', url: 'https://indiabix.com' }]
        }
      ]
    };

    return {
      studentId: student.id,
      targetRole: student.preferredDomain || 'Software Development Engineer',
      currentReadiness: 88,
      phases: [phase1, phase2, phase3, phase4],
      generatedAt: '2026-09-01T00:00:00Z',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Resume Analyzer comparing actual student data and resume against hiring standards.
   */
  analyzeResume(student: Student, targetJob?: Job): ResumeAnalysisReport {
    const studentSkills = student.skills || [];
    const studentSkillsLower = studentSkills.map(s => s.toLowerCase().trim());
    const targetSkills = targetJob ? targetJob.requiredSkills : ['Java', 'Python', 'SQL', 'Data Structures', 'Docker', 'System Design'];

    const foundKeywords = studentSkills;
    const missingKeywords = targetSkills.filter(t => !studentSkillsLower.includes(t.toLowerCase().trim()));

    const hasProjects = (student.projects || []).length > 0;
    const hasCerts = (student.certifications || []).length > 0;
    const hasGithub = !!student.githubUrl;
    const hasLinkedin = !!student.linkedinUrl;

    let atsReadiness = 90;
    let skillsComp = Math.round((foundKeywords.length / (foundKeywords.length + missingKeywords.length || 1)) * 100);
    let projectEvidence = hasProjects ? 95 : 50;
    let structureContact = hasGithub && hasLinkedin ? 100 : 75;

    const overall = Math.round(
      (atsReadiness * 0.3) +
      (skillsComp * 0.3) +
      (projectEvidence * 0.25) +
      (structureContact * 0.15)
    );

    const scores: ResumeAnalysisScore = {
      overallScore: Math.min(100, overall),
      atsReadinessScore: atsReadiness,
      skillsCompleteness: skillsComp,
      projectEvidenceScore: projectEvidence,
      structureAndContactScore: structureContact,
      matchedKeywordsCount: foundKeywords.length,
      missingKeywordsCount: missingKeywords.length
    };

    const gaps: ResumeGapItem[] = [];
    if (missingKeywords.length > 0) {
      gaps.push({
        category: 'Required Skill',
        severity: 'Critical',
        title: `Missing Target Skill: ${missingKeywords[0]}`,
        description: `Your target company explicitly lists ${missingKeywords[0]} in the mandatory requirements.`,
        actionableStep: `Build a mini-project or complete code sandbox assessment in ${missingKeywords[0]} and add it to your profile skills.`
      });
    }

    if (!hasCerts) {
      gaps.push({
        category: 'Certification',
        severity: 'Recommended',
        title: 'Add Industry-Recognized Cloud / Developer Credential',
        description: 'Certifications from AWS, Google Cloud, or Microsoft increase recruiter resume-scoring weight.',
        actionableStep: 'Upload your verified certificate link in the Licenses & Certifications section.'
      });
    }

    if (!hasGithub) {
      gaps.push({
        category: 'Project Evidence',
        severity: 'Recommended',
        title: 'Attach Verified GitHub Profile URL',
        description: 'Recruiters inspect public repositories for clean git commit hygiene and readable code structure.',
        actionableStep: 'Add your active GitHub profile URL in your basic information tab.'
      });
    }

    const positives: string[] = [
      'Clean ATS-compliant layout with standard headings (Education, Skills, Projects, Experience).',
      `Verified CGPA of ${student.cgpa} clearly highlighted in academic summary.`,
      `Includes ${student.projects?.length || 2} verified technical projects with live architecture details.`
    ];

    return {
      studentId: student.id,
      fileName: student.resumeFileName || 'Rahul_Sharma_Resume.pdf',
      targetCompany: targetJob?.companyName || 'Google / Tier-1 Tech',
      targetRole: targetJob?.title || 'Software Development Engineer',
      scores,
      foundKeywords,
      missingKeywords,
      gaps,
      positives,
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Generates mock interview questions based on company, role, and student skills.
   */
  generateMockInterview(student: Student, companyName = 'Google', jobRole = 'Software Development Engineer'): MockInterviewSession {
    const questions: InterviewQuestion[] = [];
    let idCounter = 1;

    Object.keys(QUESTION_BANK).forEach(cat => {
      const bank = QUESTION_BANK[cat];
      bank.forEach(item => {
        questions.push({
          id: `q-${idCounter++}`,
          category: cat as InterviewQuestionCategory,
          question: item.question,
          recommendedDurationSeconds: 180,
          evaluationCriteria: item.criteria,
          tips: item.tips,
          sampleStrongPoints: item.strongPoints
        });
      });
    });

    const session: MockInterviewSession = {
      id: `mock-${Date.now()}`,
      studentId: student.id,
      companyName,
      jobRole,
      sessionTitle: `${companyName} ${jobRole} Technical & Behavioral Mock Simulation`,
      totalQuestions: questions.length,
      completedQuestions: 0,
      answers: [],
      weakAreasIdentified: [],
      strongAreasIdentified: ['Algorithmic fundamentals', 'Clean explanation'],
      createdAt: new Date().toISOString()
    };

    return session;
  }

  async recordInterviewAnswer(
    sessionId: string,
    question: InterviewQuestion,
    userAnswer: string,
    confidenceScore: number
  ): Promise<void> {
    const existing = this.interviewSessionsSignal().find(s => s.id === sessionId);
    if (!existing) return;

    const answerRecord: UserInterviewAnswer = {
      questionId: question.id,
      questionText: question.question,
      category: question.category,
      userNotesOrAnswer: userAnswer,
      selfConfidenceScore: confidenceScore,
      feedbackNotes: confidenceScore >= 4 ? 'Solid confident delivery.' : 'Review recommended strong points and retry.',
      recordedAt: new Date().toISOString()
    };

    const updatedSession: MockInterviewSession = {
      ...existing,
      completedQuestions: existing.completedQuestions + 1,
      answers: [...existing.answers.filter(a => a.questionId !== question.id), answerRecord],
      completedAt: new Date().toISOString()
    };

    this.interviewSessionsSignal.update(list => list.map(s => s.id === sessionId ? updatedSession : s));
    this.saveInterviewsToCache(this.interviewSessionsSignal());
    this.toast.success('Answer Recorded', 'Your mock response has been saved with structured feedback tips.');
  }
}
