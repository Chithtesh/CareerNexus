export type PlacementEventType = 
  | 'Application Deadline'
  | 'Assessment'
  | 'Interview'
  | 'Placement Drive'
  | 'Task Deadline'
  | 'Training Session'
  | 'Mentorship Call';

export interface PlacementEvent {
  id: string;
  title: string;
  description: string;
  eventType: PlacementEventType;
  companyName?: string;
  companyLogo?: string;
  startDate: string; // ISO date string
  endDate?: string;
  locationOrUrl?: string;
  isMandatory?: boolean;
  targetDepartment?: string;
  targetBatch?: string;
  forRole?: 'student' | 'alumni' | 'recruiter' | 'admin' | 'all';
}
