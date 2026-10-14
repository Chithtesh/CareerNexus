export type DriveStatus = 
  | 'Draft' 
  | 'Published' 
  | 'Applications Open' 
  | 'Applications Closed' 
  | 'Screening' 
  | 'In Progress' 
  | 'Technical' 
  | 'HR' 
  | 'Offers Released' 
  | 'Completed' 
  | 'Cancelled';

export type DriveRoundType = 
  | 'Screening' 
  | 'Aptitude Test' 
  | 'Coding Assessment' 
  | 'Technical Interview' 
  | 'Group Discussion' 
  | 'HR Interview' 
  | 'Managerial Interview' 
  | 'Final Round';

export type RoundResultStatus = 
  | 'Pending' 
  | 'Shortlisted' 
  | 'Cleared' 
  | 'Rejected' 
  | 'Waitlisted' 
  | 'Absent';

export type SlotStatus = 
  | 'Available' 
  | 'Scheduled' 
  | 'In Progress' 
  | 'Completed' 
  | 'Cancelled' 
  | 'Rescheduled';

export type OfferStatus = 
  | 'Offered' 
  | 'Accepted' 
  | 'Declined' 
  | 'Expired' 
  | 'Revoked';

export interface PlacementDrive {
  id: string;
  companyId: string;
  jobId?: string;
  companyName: string;
  companyLogo?: string;
  title: string;
  roleDesignation: string;
  description: string;
  eligibleDepartments: string[];
  minimumCgpa: number;
  maxBacklogs: number;
  requiredSkills: string[];
  applicationDeadline: string;
  driveDate: string;
  mode: 'Online' | 'On-Campus' | 'Hybrid';
  venue: string;
  salaryCtc: string;
  status: DriveStatus;
  currentRoundNumber: number;
  totalRounds: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  rounds?: DriveRound[];
  applicantCount?: number;
}

export interface DriveRound {
  id: string;
  driveId: string;
  roundOrder: number;
  roundName: string;
  roundType: DriveRoundType;
  scheduledAt: string;
  durationMinutes: number;
  description?: string;
  venueOrLink?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  createdAt: string;
  updatedAt: string;
  results?: DriveRoundResult[];
}

export interface DriveRoundResult {
  id: string;
  roundId: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentDepartment: string;
  score?: number;
  maxScore: number;
  status: RoundResultStatus;
  feedback?: string;
  interviewerNotes?: string;
  evaluatedAt: string;
  createdAt: string;
}

export interface InterviewSlot {
  id: string;
  driveId: string;
  roundId?: string;
  studentId?: string;
  studentName?: string;
  studentRoll?: string;
  interviewerName: string;
  interviewerEmail?: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  meetingLink?: string;
  venue: string;
  status: SlotStatus;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriveOffer {
  id: string;
  driveId: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  companyName: string;
  roleDesignation: string;
  ctcPackage: string;
  baseSalary?: string;
  joiningDate?: string;
  offerLetterUrl?: string;
  status: OfferStatus;
  acceptanceDeadline?: string;
  studentResponseAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
