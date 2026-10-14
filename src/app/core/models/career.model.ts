export interface CareerRecommendation {
  id: string;
  roleTitle: string;
  domain: string;
  companyName: string;
  companyLogo?: string;
  averageSalary: string;
  skillMatchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  eligibilityStatus: 'Eligible' | 'Criteria Review Needed';
  recommendedTasks: string[];
  hiringTrends: string;
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  description: string;
  skillTarget: string;
  estimatedHours: number;
  status: 'Completed' | 'In Progress' | 'Upcoming';
  resourceLinks: { title: string; url: string }[];
  associatedTaskId?: string;
}

export interface RoadmapPhase {
  phaseNumber: number;
  title: string;
  focusArea: string;
  status: 'Completed' | 'In Progress' | 'Upcoming';
  milestones: RoadmapMilestone[];
}

export interface PersonalizedRoadmap {
  studentId: string;
  targetRole: string;
  currentReadiness: number;
  phases: RoadmapPhase[];
  generatedAt: string;
  lastUpdated: string;
}
