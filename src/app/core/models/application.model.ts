export type ApplicationStatus = 
  | 'Applied'
  | 'Shortlisted'
  | 'Aptitude'
  | 'Technical Interview'
  | 'HR Interview'
  | 'Selected'
  | 'Rejected';

export interface ApplicationTimelineEvent {
  status: ApplicationStatus;
  date: string;
  notes?: string;
  locationOrLink?: string;
}

export interface Application {
  id: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentDepartment: string;
  studentCgpa: number;
  studentEmail: string;
  studentAvatar?: string;
  studentResumeUrl?: string;
  jobId: string;
  jobTitle: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  salary: string;
  status: ApplicationStatus;
  notes: string;
  timeline: ApplicationTimelineEvent[];
  appliedAt: string;
  updatedAt: string;
}
