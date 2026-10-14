export interface ResumeAnalysisScore {
  overallScore: number; // 0 - 100
  atsReadinessScore: number; // 0 - 100
  skillsCompleteness: number; // 0 - 100
  projectEvidenceScore: number; // 0 - 100
  structureAndContactScore: number; // 0 - 100
  matchedKeywordsCount: number;
  missingKeywordsCount: number;
}

export interface ResumeGapItem {
  category: 'Required Skill' | 'Project Evidence' | 'Certification' | 'Relevant Keyword' | 'Format / ATS';
  severity: 'Critical' | 'Recommended' | 'Good to Have';
  title: string;
  description: string;
  actionableStep: string;
}

export interface ResumeAnalysisReport {
  studentId: string;
  fileName: string;
  targetCompany?: string;
  targetRole?: string;
  scores: ResumeAnalysisScore;
  foundKeywords: string[];
  missingKeywords: string[];
  gaps: ResumeGapItem[];
  positives: string[];
  analyzedAt: string;
}
