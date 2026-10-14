export type InterviewQuestionCategory = 
  | 'Technical'
  | 'HR'
  | 'Behavioral'
  | 'Situational'
  | 'Project-based';

export interface InterviewQuestion {
  id: string;
  category: InterviewQuestionCategory;
  question: string;
  recommendedDurationSeconds: number;
  evaluationCriteria: string[];
  tips: string;
  sampleStrongPoints: string[];
}

export interface UserInterviewAnswer {
  questionId: string;
  questionText: string;
  category: InterviewQuestionCategory;
  userNotesOrAnswer: string;
  selfConfidenceScore: number; // 1 to 5
  feedbackNotes?: string;
  recordedAt: string;
}

export interface MockInterviewSession {
  id: string;
  studentId: string;
  companyName: string;
  jobRole: string;
  sessionTitle: string;
  totalQuestions: number;
  completedQuestions: number;
  answers: UserInterviewAnswer[];
  overallFeedback?: string;
  weakAreasIdentified: string[];
  strongAreasIdentified: string[];
  createdAt: string;
  completedAt?: string;
}
