export type TaskCategory = 
  | 'Aptitude'
  | 'Coding'
  | 'Technical Interview'
  | 'HR Interview'
  | 'Core Subject'
  | 'System Design'
  | 'Assessment'
  | 'Resume Customization';

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface StudentTask {
  id: string;
  studentId: string;
  companyId: string;
  companyName: string;
  companyLogo?: string;
  jobId: string;
  jobTitle: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // ISO date string or formatted date
  estimatedMinutes?: number;
  score?: number; // Score obtained (e.g. 85 / 100)
  maxScore?: number; // e.g. 100
  completedAt?: string;
  submissionNotes?: string;
  resourceLinks?: { title: string; url: string }[];
  requiredSkillTarget?: string; // Skill this task helps bridge (e.g., 'Docker')
  createdAt: string;
  updatedAt: string;
}

export interface SkillGapAnalysis {
  studentSkillCount: number;
  totalRequiredSkills: number;
  matchingSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
  strongSkills: string[];
  skillsNeedingImprovement: string[];
  categorizedSkills: {
    programming: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
    softSkills: string[];
    coreSubjects: string[];
  };
}

export interface CompanyPlacementPerformance {
  companyId: string;
  companyName: string;
  companyLogo?: string;
  jobId: string;
  jobTitle: string;
  salary: string;
  applicationStatus: string;
  appliedDate: string;
  matchingSkills: string[];
  missingSkills: string[];
  skillMatchPercentage: number;
  tasksTotal: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksPending: number;
  taskCompletionRate: number;
  averageTaskScore: number;
  readinessLevel: 'High' | 'Moderate' | 'Needs Preparation';
}

export interface PlacementReadinessMetrics {
  overallScore: number; // 0 to 100
  profileScore: number; // e.g. 22 (out of 25)
  profileMaxScore: number; // 25
  skillScore: number; // e.g. 25 (out of 35)
  skillMaxScore: number; // 35
  taskScore: number; // e.g. 15 (out of 25)
  taskMaxScore: number; // 25
  driveScore: number; // e.g. 10 (out of 15)
  driveMaxScore: number; // 15
  assessmentBonusScore: number; // bonus points (max 5)

  // Backwards compatibility aliases
  profileStrengthWeight: number;
  skillMatchWeight: number;
  taskCompletionWeight: number;
  activeDrivesWeight: number;

  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number; // 0 - 100%
  averageScore: number; // 0 - 100
  tierReadiness: 'Tier-1 Ready' | 'Tier-2 Ready' | 'Needs Focused Preparation';
  whyChangedExplanation: string;
  strengths: string[];
  actionItems: string[];
}
