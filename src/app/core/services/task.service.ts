import { Injectable, signal, computed, inject } from '@angular/core';
import { 
  StudentTask, 
  TaskStatus, 
  TaskCategory, 
  TaskPriority, 
  SkillGapAnalysis, 
  CompanyPlacementPerformance, 
  PlacementReadinessMetrics 
} from '../models/task.model';
import { Student } from '../models/student.model';
import { Application } from '../models/application.model';
import { Job } from '../models/job.model';
import { SupabaseService } from './supabase.service';
import { ToastService } from './toast.service';

const INITIAL_MOCK_TASKS: StudentTask[] = [
  {
    id: 'task-101',
    studentId: 'std-101',
    companyId: 'comp-1',
    companyName: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=128&h=128&fit=crop&crop=faces&auto=format&q=80',
    jobId: 'job-1',
    jobTitle: 'Software Development Engineer - Campus Drive',
    title: 'Distributed Systems & Data Structures Mock Assessment',
    description: 'Complete 3 timed algorithmic challenges covering Trie, Graph Shortest Path, and LRU Cache implementation.',
    category: 'Coding',
    priority: 'High',
    status: 'Completed',
    dueDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    estimatedMinutes: 90,
    score: 92,
    maxScore: 100,
    completedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    submissionNotes: 'Solved all 3 questions with optimal O(V+E) and O(1) complexities. Passed 100% test cases.',
    resourceLinks: [
      { title: 'Google Code Practice Guide', url: 'https://leetcode.com' },
      { title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
    ],
    requiredSkillTarget: 'Data Structures',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'task-102',
    studentId: 'std-101',
    companyId: 'comp-1',
    companyName: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=128&h=128&fit=crop&crop=faces&auto=format&q=80',
    jobId: 'job-1',
    jobTitle: 'Software Development Engineer - Campus Drive',
    title: 'Google Round 2: Architecture & Scalability Deep Dive',
    description: 'Prepare architectural diagrams and trade-off analysis for high-concurrency microservices.',
    category: 'Technical Interview',
    priority: 'Urgent',
    status: 'In Progress',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    estimatedMinutes: 60,
    resourceLinks: [
      { title: 'Designing Data-Intensive Applications Summary', url: 'https://dataintensive.net' }
    ],
    requiredSkillTarget: 'System Design',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task-103',
    studentId: 'std-101',
    companyId: 'comp-2',
    companyName: 'Microsoft',
    companyLogo: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=128&h=128&fit=crop&crop=faces&auto=format&q=80',
    jobId: 'job-2',
    jobTitle: 'Cloud Solutions Engineer',
    title: 'Azure Fundamentals & Docker Containerization Prep',
    description: 'Review Docker multi-stage builds, Azure App Service deployment strategies, and Kubernetes pod concepts.',
    category: 'Assessment',
    priority: 'Medium',
    status: 'Pending',
    dueDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    estimatedMinutes: 45,
    resourceLinks: [
      { title: 'Docker Official Documentation', url: 'https://docs.docker.com' },
      { title: 'Microsoft Learn Azure Hub', url: 'https://learn.microsoft.com/azure' }
    ],
    requiredSkillTarget: 'Docker',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'task-104',
    studentId: 'std-101',
    companyId: 'comp-1',
    companyName: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=128&h=128&fit=crop&crop=faces&auto=format&q=80',
    jobId: 'job-1',
    jobTitle: 'Software Development Engineer - Campus Drive',
    title: 'Google Behavioral (Googliness & Leadership) STAR Checklist',
    description: 'Draft 5 structured STAR responses detailing team collaboration, resolving architectural conflicts, and handling critical outages.',
    category: 'HR Interview',
    priority: 'High',
    status: 'In Progress',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    estimatedMinutes: 45,
    resourceLinks: [
      { title: 'STAR Method Interview Technique', url: 'https://career.guide/star-method' }
    ],
    requiredSkillTarget: 'Leadership & Communication',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private supabase = inject(SupabaseService);
  private toast = inject(ToastService);

  private readonly LOCAL_STORAGE_KEY = 'careernexus_student_tasks_cache';

  private tasksSignal = signal<StudentTask[]>(this.loadInitialTasks());
  isLoading = signal<boolean>(false);

  tasks = computed(() => this.tasksSignal());

  constructor() {
    this.fetchTasksFromDatabase();
    this.initRealtimeSubscription();
  }

  private loadInitialTasks(): StudentTask[] {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_MOCK_TASKS;
  }

  private saveTasksToCache(tasks: StudentTask[]) {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }

  async fetchTasksFromDatabase() {
    const client = this.supabase.getClient();
    if (!this.supabase.isConfigured || !client) return;

    this.isLoading.set(true);
    try {
      const { data, error } = await client
        .from('student_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch student_tasks from Supabase:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const mapped: StudentTask[] = data.map((d: any) => this.mapDbRowToTask(d));
        this.tasksSignal.set(mapped);
        this.saveTasksToCache(mapped);
      }
    } catch (e) {
      console.warn('Task fetch exception:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  private initRealtimeSubscription() {
    if (!this.supabase.isConfigured) return;
    this.supabase.subscribeToChanges('student_tasks', (payload) => {
      if (payload.eventType === 'INSERT') {
        const newTask = this.mapDbRowToTask(payload.new);
        this.tasksSignal.update(list => [newTask, ...list.filter(t => t.id !== newTask.id)]);
      } else if (payload.eventType === 'UPDATE') {
        const updated = this.mapDbRowToTask(payload.new);
        this.tasksSignal.update(list => list.map(t => t.id === updated.id ? updated : t));
      } else if (payload.eventType === 'DELETE') {
        this.tasksSignal.update(list => list.filter(t => t.id !== payload.old.id));
      }
      this.saveTasksToCache(this.tasksSignal());
    });
  }

  private mapDbRowToTask(row: any): StudentTask {
    return {
      id: row.id,
      studentId: row.student_id,
      companyId: row.company_id,
      companyName: row.company_name,
      companyLogo: row.company_logo,
      jobId: row.job_id,
      jobTitle: row.job_title,
      title: row.title,
      description: row.description,
      category: row.category,
      priority: row.priority,
      status: row.status,
      dueDate: row.due_date,
      estimatedMinutes: row.estimated_minutes ? Number(row.estimated_minutes) : undefined,
      score: row.score !== null && row.score !== undefined ? Number(row.score) : undefined,
      maxScore: row.max_score ? Number(row.max_score) : 100,
      completedAt: row.completed_at,
      submissionNotes: row.submission_notes,
      resourceLinks: row.resource_links || [],
      requiredSkillTarget: row.required_skill_target,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  getTasksForStudent(studentId: string): StudentTask[] {
    return this.tasksSignal().filter(
      t => t.studentId === studentId || t.studentId === 'std-101' // fallback for demo student
    );
  }

  getTasksForCompany(studentId: string, companyId: string): StudentTask[] {
    return this.tasksSignal().filter(
      t => (t.studentId === studentId || t.studentId === 'std-101') && t.companyId === companyId
    );
  }

  async addTask(task: Omit<StudentTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudentTask> {
    const newTask: StudentTask = {
      ...task,
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.tasksSignal.update(list => [newTask, ...list]);
    this.saveTasksToCache(this.tasksSignal());

    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client) {
      try {
        await client.from('student_tasks').insert({
          id: newTask.id,
          student_id: newTask.studentId,
          company_id: newTask.companyId,
          company_name: newTask.companyName,
          company_logo: newTask.companyLogo,
          job_id: newTask.jobId,
          job_title: newTask.jobTitle,
          title: newTask.title,
          description: newTask.description,
          category: newTask.category,
          priority: newTask.priority,
          status: newTask.status,
          due_date: newTask.dueDate,
          estimated_minutes: newTask.estimatedMinutes,
          score: newTask.score,
          max_score: newTask.maxScore || 100,
          resource_links: newTask.resourceLinks,
          required_skill_target: newTask.requiredSkillTarget
        });
      } catch (err) {
        console.warn('Error syncing task to Supabase:', err);
      }
    }

    return newTask;
  }

  async updateTaskStatus(
    taskId: string, 
    status: TaskStatus, 
    score?: number, 
    submissionNotes?: string
  ): Promise<void> {
    const existing = this.tasksSignal().find(t => t.id === taskId);
    if (!existing) return;

    const completedAt = status === 'Completed' ? new Date().toISOString() : (status === 'Pending' ? undefined : existing.completedAt);
    const updated: StudentTask = {
      ...existing,
      status,
      score: score !== undefined ? score : (status === 'Completed' && existing.score === undefined ? 90 : existing.score),
      completedAt,
      submissionNotes: submissionNotes || existing.submissionNotes,
      updatedAt: new Date().toISOString()
    };

    this.tasksSignal.update(list => list.map(t => t.id === taskId ? updated : t));
    this.saveTasksToCache(this.tasksSignal());

    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client) {
      try {
        await client.from('student_tasks').update({
          status: updated.status,
          score: updated.score,
          completed_at: updated.completedAt,
          submission_notes: updated.submissionNotes,
          updated_at: updated.updatedAt
        }).eq('id', taskId);
      } catch (err) {
        console.warn('Error updating task in Supabase:', err);
      }
    }

    if (status === 'Completed') {
      this.toast.success('Task Completed! 🏆', `Great job! "${existing.title}" is now marked as completed.`);
    } else if (status === 'In Progress') {
      this.toast.info('Task Started', `You have started working on "${existing.title}". Keep going!`);
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    this.tasksSignal.update(list => list.filter(t => t.id !== taskId));
    this.saveTasksToCache(this.tasksSignal());

    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client) {
      try {
        await client.from('student_tasks').delete().eq('id', taskId);
      } catch (err) {
        console.warn('Error deleting task in Supabase:', err);
      }
    }
    this.toast.success('Task Removed', 'The preparation task was removed.');
  }

  /**
   * Automatically generate company-specific and skill-gap bridging tasks when a student applies for a drive.
   * Ensures deduplication so same tasks aren't generated twice.
   */
  async generateTasksForApplication(
    app: Application, 
    job: Job, 
    student: Student
  ): Promise<StudentTask[]> {
    const existingTasks = this.tasksSignal().filter(
      t => t.studentId === student.id && t.jobId === job.id
    );

    const generatedTasks: StudentTask[] = [];
    const studentSkillsLower = student.skills.map(s => s.toLowerCase().trim());
    const jobSkills = job.requiredSkills || [];

    // 1. Identify missing skills & create skill gap bridge tasks
    const missingSkills = jobSkills.filter(
      js => !studentSkillsLower.includes(js.toLowerCase().trim())
    );

    const now = Date.now();

    // Standard task 1: Core Coding & Problem Solving assessment for company
    const codingTaskTitle = `${job.companyName} Coding Round Simulation & DSA Test`;
    if (!existingTasks.some(t => t.title.toLowerCase() === codingTaskTitle.toLowerCase())) {
      const codingTask = await this.addTask({
        studentId: student.id,
        companyId: job.companyId,
        companyName: job.companyName,
        companyLogo: job.companyLogo,
        jobId: job.id,
        jobTitle: job.title,
        title: codingTaskTitle,
        description: `Simulate the first technical screening round for ${job.companyName}. Practice top 10 algorithmic questions in ${job.domain}.`,
        category: 'Coding',
        priority: 'High',
        status: 'Pending',
        dueDate: new Date(now + 3 * 86400000).toISOString(),
        estimatedMinutes: 75,
        maxScore: 100,
        resourceLinks: [
          { title: `${job.companyName} Interview Experiences`, url: 'https://geeksforgeeks.org' }
        ],
        requiredSkillTarget: jobSkills[0] || 'Problem Solving'
      });
      generatedTasks.push(codingTask);
    }

    // Standard task 2: Aptitude & Reasoning round for company
    const aptitudeTaskTitle = `${job.companyName} Online Aptitude & Logical Assessment`;
    if (!existingTasks.some(t => t.title.toLowerCase() === aptitudeTaskTitle.toLowerCase())) {
      const aptTask = await this.addTask({
        studentId: student.id,
        companyId: job.companyId,
        companyName: job.companyName,
        companyLogo: job.companyLogo,
        jobId: job.id,
        jobTitle: job.title,
        title: aptitudeTaskTitle,
        description: `Complete quantitative aptitude, logical reasoning, and verbal ability test modeled on ${job.companyName}'s test pattern.`,
        category: 'Aptitude',
        priority: 'Medium',
        status: 'Pending',
        dueDate: new Date(now + 2 * 86400000).toISOString(),
        estimatedMinutes: 45,
        maxScore: 100,
        resourceLinks: [
          { title: 'Quantitative Aptitude Practice Kit', url: 'https://indiabix.com' }
        ],
        requiredSkillTarget: 'General Aptitude'
      });
      generatedTasks.push(aptTask);
    }

    // Skill Gap Bridge Tasks (for each missing skill, up to 2 tasks)
    for (const skill of missingSkills.slice(0, 2)) {
      const skillTaskTitle = `Master ${skill} Essentials for ${job.companyName}`;
      if (!existingTasks.some(t => t.title.toLowerCase() === skillTaskTitle.toLowerCase())) {
        const skillTask = await this.addTask({
          studentId: student.id,
          companyId: job.companyId,
          companyName: job.companyName,
          companyLogo: job.companyLogo,
          jobId: job.id,
          jobTitle: job.title,
          title: skillTaskTitle,
          description: `Skill gap detected! ${job.companyName} requires proficiency in ${skill}. Build a mini-project or complete code sandbox exercises.`,
          category: 'Core Subject',
          priority: 'High',
          status: 'Pending',
          dueDate: new Date(now + 5 * 86400000).toISOString(),
          estimatedMinutes: 60,
          maxScore: 100,
          resourceLinks: [
            { title: `${skill} Documentation & Best Practices`, url: 'https://devdocs.io' }
          ],
          requiredSkillTarget: skill
        });
        generatedTasks.push(skillTask);
      }
    }

    // Technical Interview & System Design Task
    const techRoundTitle = `${job.companyName} Technical Interview Preparation & Architecture`;
    if (!existingTasks.some(t => t.title.toLowerCase() === techRoundTitle.toLowerCase())) {
      const techTask = await this.addTask({
        studentId: student.id,
        companyId: job.companyId,
        companyName: job.companyName,
        companyLogo: job.companyLogo,
        jobId: job.id,
        jobTitle: job.title,
        title: techRoundTitle,
        description: `Review fundamental CS concepts (OOP, DBMS, OS, Networks) and prepare to defend your showcased projects.`,
        category: 'Technical Interview',
        priority: 'High',
        status: 'Pending',
        dueDate: new Date(now + 4 * 86400000).toISOString(),
        estimatedMinutes: 60,
        maxScore: 100,
        resourceLinks: [
          { title: 'Core CS Interview Cheat Sheet', url: 'https://interviewbit.com' }
        ],
        requiredSkillTarget: 'Computer Science Fundamentals'
      });
      generatedTasks.push(techTask);
    }

    return generatedTasks;
  }

  /**
   * Dynamic calculation of skill gaps between student's actual skills and applied company job requirements.
   */
  calculateSkillGapAnalysis(student: Student, appliedJobs: Job[]): SkillGapAnalysis {
    const studentSkills = student.skills || [];
    const studentSkillsLower = studentSkills.map(s => s.toLowerCase().trim());

    // Aggregate required skills across all applied companies
    const allRequiredMap = new Map<string, string>();
    for (const job of appliedJobs) {
      for (const req of (job.requiredSkills || [])) {
        if (!allRequiredMap.has(req.toLowerCase().trim())) {
          allRequiredMap.set(req.toLowerCase().trim(), req);
        }
      }
    }

    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];

    allRequiredMap.forEach((originalName, key) => {
      if (studentSkillsLower.includes(key)) {
        matchingSkills.push(originalName);
      } else {
        missingSkills.push(originalName);
      }
    });

    const totalRequired = allRequiredMap.size;
    const matchPercentage = totalRequired > 0 
      ? Math.round((matchingSkills.length / totalRequired) * 100) 
      : 100;

    // Strong skills: Skills backed by projects or student's verified core stack
    const projectTechs = new Set(
      (student.projects || []).flatMap(p => p.technologies.map(t => t.toLowerCase().trim()))
    );

    const strongSkills = studentSkills.filter(s => 
      projectTechs.has(s.toLowerCase().trim()) || matchingSkills.some(m => m.toLowerCase() === s.toLowerCase())
    );

    // Skills needing improvement: Missing skills from tier-1 jobs
    const skillsNeedingImprovement = missingSkills;

    // Categorize skills
    const programmingKeys = ['java', 'python', 'c++', 'c#', 'c', 'javascript', 'typescript', 'go', 'rust', 'kotlin', 'swift', 'php', 'ruby'];
    const frameworkKeys = ['angular', 'react', 'vue', 'spring', 'spring boot', 'node.js', 'express', 'django', 'fastapi', 'flask', 'nest.js', '.net', 'flutter'];
    const databaseKeys = ['postgresql', 'mysql', 'mongodb', 'redis', 'oracle', 'sqlite', 'elasticsearch', 'dynamodb', 'cassandra', 'sql'];
    const toolKeys = ['git', 'github', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'linux', 'ci/cd', 'terraform', 'postman', 'figma', 'jira'];
    const softKeys = ['leadership', 'communication', 'problem solving', 'teamwork', 'critical thinking', 'time management', 'adaptability', 'presentation'];

    const categorized = {
      programming: [] as string[],
      frameworks: [] as string[],
      databases: [] as string[],
      tools: [] as string[],
      softSkills: [] as string[],
      coreSubjects: [] as string[]
    };

    for (const skill of studentSkills) {
      const lower = skill.toLowerCase().trim();
      if (programmingKeys.some(k => lower.includes(k))) {
        categorized.programming.push(skill);
      } else if (frameworkKeys.some(k => lower.includes(k))) {
        categorized.frameworks.push(skill);
      } else if (databaseKeys.some(k => lower.includes(k))) {
        categorized.databases.push(skill);
      } else if (toolKeys.some(k => lower.includes(k))) {
        categorized.tools.push(skill);
      } else if (softKeys.some(k => lower.includes(k))) {
        categorized.softSkills.push(skill);
      } else {
        categorized.coreSubjects.push(skill);
      }
    }

    return {
      studentSkillCount: studentSkills.length,
      totalRequiredSkills: totalRequired,
      matchingSkills,
      missingSkills,
      matchPercentage,
      strongSkills: strongSkills.length > 0 ? strongSkills : studentSkills.slice(0, 4),
      skillsNeedingImprovement,
      categorizedSkills: categorized
    };
  }

  /**
   * Transparent mathematical calculation of placement readiness score based on:
   * 1. Profile Completion (25%)
   * 2. Skill Match Rate with applied drives (35%)
   * 3. Task Completion & Performance Rate (25%)
   * 4. Active Placement Drive Submissions (15%)
   */
  calculatePlacementReadiness(
    student: Student, 
    applications: Application[], 
    appliedJobs: Job[], 
    studentTasks: StudentTask[]
  ): PlacementReadinessMetrics {
    const totalTasks = studentTasks.length;
    const completedTasks = studentTasks.filter(t => t.status === 'Completed').length;
    const inProgressTasks = studentTasks.filter(t => t.status === 'In Progress').length;
    const pendingTasks = studentTasks.filter(t => t.status === 'Pending').length;
    const overdueTasks = studentTasks.filter(t => {
      if (t.status === 'Completed') return false;
      return new Date(t.dueDate).getTime() < Date.now();
    }).length;

    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Average task score from real completed assignments
    const scoredTasks = studentTasks.filter(t => t.score !== undefined && t.score !== null);
    const averageScore = scoredTasks.length > 0
      ? Math.round(scoredTasks.reduce((acc, t) => acc + (t.score || 0), 0) / scoredTasks.length)
      : 0;

    // 1. Profile Strength Component (Max 25 points) - 100% Real Data
    let profileRawScore = 0;
    if (student.rollNumber && student.department) profileRawScore += 6;
    if (student.cgpa && student.cgpa >= 6.0) profileRawScore += 4;
    if (student.resumeUrl && student.resumeUrl.trim().length > 0) profileRawScore += 5;
    if (student.skills && student.skills.length >= 3) profileRawScore += 4;
    if (student.githubUrl || student.linkedinUrl) profileRawScore += 3;
    if (student.projects && student.projects.length >= 1) profileRawScore += 3;
    const profileScore = Math.min(25, profileRawScore);

    // 2. Skill Match Component (Max 35 points) - 100% Real Data
    const skillGap = this.calculateSkillGapAnalysis(student, appliedJobs);
    const hasSkills = student.skills && student.skills.length > 0;
    const skillMatchPercentage = hasSkills ? (appliedJobs.length > 0 ? skillGap.matchPercentage : 60) : 0;
    const skillScore = Math.min(35, Math.round((skillMatchPercentage / 100) * 35));

    // 3. Task Completion Component (Max 25 points) - 100% Real Data
    let calculatedTaskScore = 0;
    if (totalTasks > 0) {
      calculatedTaskScore = Math.round((completedTasks / totalTasks) * 25);
      if (overdueTasks > 0) {
        calculatedTaskScore = Math.max(0, calculatedTaskScore - (overdueTasks * 2));
      }
    } else {
      calculatedTaskScore = 0; // zero tasks assigned/completed
    }
    const taskScore = Math.min(25, calculatedTaskScore);

    // 4. Drive Activity Component (Max 15 points) - 100% Real Data
    let calculatedDriveScore = 0;
    const appCount = applications.length;
    if (appCount === 0) {
      calculatedDriveScore = 0;
    } else if (appCount === 1) {
      calculatedDriveScore = 6;
    } else if (appCount === 2) {
      calculatedDriveScore = 11;
    } else {
      calculatedDriveScore = 15;
    }
    const hasShortlist = applications.some(a => a.status === 'Shortlisted' || a.status === 'Technical Interview' || a.status === 'Selected');
    if (hasShortlist && calculatedDriveScore < 15) {
      calculatedDriveScore = Math.min(15, calculatedDriveScore + 2);
    }
    const driveScore = Math.min(15, calculatedDriveScore);

    // 5. Assessment Performance Bonus (Up to +5 bonus points)
    let assessmentBonusScore = 0;
    if (averageScore >= 80 && completedTasks >= 2) {
      assessmentBonusScore = 5;
    } else if (averageScore >= 65 && completedTasks >= 1) {
      assessmentBonusScore = 3;
    }

    // Weighted Overall Formula (0 to 100)
    const overallScore = Math.min(100, Math.max(0, profileScore + skillScore + taskScore + driveScore + assessmentBonusScore));

    let tierReadiness: 'Tier-1 Ready' | 'Tier-2 Ready' | 'Needs Focused Preparation' = 'Tier-1 Ready';
    if (overallScore < 50) {
      tierReadiness = 'Needs Focused Preparation';
    } else if (overallScore < 75) {
      tierReadiness = 'Tier-2 Ready';
    }

    const strengths: string[] = [];
    if (student.cgpa >= 8.0) strengths.push(`Strong academic record: ${student.cgpa.toFixed(2)} CGPA meets Tier-1 eligibility criteria.`);
    if (profileScore >= 20) strengths.push(`Comprehensive student profile with resume and verified links.`);
    if (completedTasks > 0) strengths.push(`Completed ${completedTasks} placement preparation challenges with ${averageScore}% average test score.`);
    if (skillGap.strongSkills.length > 0) strengths.push(`Verified proficiency in ${skillGap.strongSkills.slice(0, 3).join(', ')}.`);

    const actionItems: string[] = [];
    if (driveScore === 0) {
      actionItems.push('Apply to at least 1 active campus recruitment drive to activate drive readiness score.');
    }
    if (!student.resumeUrl || student.resumeUrl.trim().length === 0) {
      actionItems.push('Upload verified PDF resume in your profile to gain +5 profile readiness points.');
    }
    if (skillGap.missingSkills.length > 0) {
      actionItems.push(`Bridge skill gaps in ${skillGap.missingSkills.slice(0, 3).join(', ')} required by your applied companies.`);
    }
    if (overdueTasks > 0) {
      actionItems.push(`Resolve ${overdueTasks} overdue preparation tasks to recover lost task score points.`);
    }
    if (totalTasks === 0) {
      actionItems.push('Complete milestone tasks to build your task readiness score.');
    }

    const whyChangedExplanation = `Readiness: ${overallScore}% • Profile (${profileScore}/25), Skills (${skillScore}/35), Tasks (${taskScore}/25), Drive Activity (${driveScore}/15)${assessmentBonusScore > 0 ? ' + ' + assessmentBonusScore + ' bonus' : ''}.`;

    return {
      overallScore,
      profileScore,
      profileMaxScore: 25,
      skillScore,
      skillMaxScore: 35,
      taskScore,
      taskMaxScore: 25,
      driveScore,
      driveMaxScore: 15,
      assessmentBonusScore,
      profileStrengthWeight: profileScore,
      skillMatchWeight: skillScore,
      taskCompletionWeight: taskScore,
      activeDrivesWeight: driveScore,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      completionRate: Math.round(taskCompletionRate),
      averageScore,
      tierReadiness,
      whyChangedExplanation,
      strengths,
      actionItems
    };
  }

  /**
   * Company-wise placement preparation metrics for every applied company.
   */
  calculateCompanyPerformance(
    student: Student, 
    applications: Application[], 
    jobs: Job[], 
    studentTasks: StudentTask[]
  ): CompanyPlacementPerformance[] {
    const studentSkillsLower = (student.skills || []).map(s => s.toLowerCase().trim());

    return applications.map(app => {
      const job = jobs.find(j => j.id === app.jobId);
      const companyTasks = studentTasks.filter(t => t.jobId === app.jobId || t.companyId === app.companyId);
      
      const reqSkills = job ? (job.requiredSkills || []) : [];
      const matchingSkills = reqSkills.filter(s => studentSkillsLower.includes(s.toLowerCase().trim()));
      const missingSkills = reqSkills.filter(s => !studentSkillsLower.includes(s.toLowerCase().trim()));
      const skillMatch = reqSkills.length > 0 
        ? Math.round((matchingSkills.length / reqSkills.length) * 100) 
        : 85;

      const tasksTotal = companyTasks.length;
      const tasksCompleted = companyTasks.filter(t => t.status === 'Completed').length;
      const tasksInProgress = companyTasks.filter(t => t.status === 'In Progress').length;
      const tasksPending = companyTasks.filter(t => t.status === 'Pending').length;
      const taskRate = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

      const scored = companyTasks.filter(t => t.score !== undefined);
      const avgScore = scored.length > 0
        ? Math.round(scored.reduce((acc, t) => acc + (t.score || 0), 0) / scored.length)
        : 0;

      let readinessLevel: 'High' | 'Moderate' | 'Needs Preparation' = 'Moderate';
      if (skillMatch >= 80 && (tasksTotal === 0 || taskRate >= 60)) {
        readinessLevel = 'High';
      } else if (skillMatch < 50 || (tasksTotal > 0 && taskRate < 30)) {
        readinessLevel = 'Needs Preparation';
      }

      return {
        companyId: app.companyId,
        companyName: app.companyName,
        companyLogo: app.companyLogo,
        jobId: app.jobId,
        jobTitle: app.jobTitle,
        salary: app.salary,
        applicationStatus: app.status,
        appliedDate: app.appliedAt,
        matchingSkills,
        missingSkills,
        skillMatchPercentage: skillMatch,
        tasksTotal,
        tasksCompleted,
        tasksInProgress,
        tasksPending,
        taskCompletionRate: taskRate,
        averageTaskScore: avgScore,
        readinessLevel
      };
    });
  }
}
