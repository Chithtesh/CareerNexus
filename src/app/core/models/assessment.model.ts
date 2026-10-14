export type AssessmentCategory = 
  | 'Aptitude'
  | 'Logical Reasoning'
  | 'Verbal Ability'
  | 'Coding'
  | 'Technical'
  | 'Communication';

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  topic?: string;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  starterCode: {
    java?: string;
    python?: string;
    javascript?: string;
    cpp?: string;
  };
  sampleTestCases: TestCase[];
  hiddenTestCases: TestCase[];
  constraints: string[];
  tags: string[];
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  category: AssessmentCategory;
  companyName?: string;
  companyLogo?: string;
  jobRole?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  questions?: AssessmentQuestion[];
  codingProblems?: CodingProblem[];
  isTimed: boolean;
  createdAt: string;
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  category: AssessmentCategory;
  studentId: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  completedAt: string;
  answers: { [questionId: string]: number }; // questionId -> chosenOption
  codingSubmissions?: {
    problemId: string;
    code: string;
    language: string;
    testCasesPassed: number;
    totalTestCases: number;
    outputLogs?: string;
  }[];
}
