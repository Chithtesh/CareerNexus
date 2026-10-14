export type PlacementStatus = 'Not Placed' | 'In Progress' | 'Selected' | 'Offer Accepted';

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialUrl?: string;
}

export interface Student {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  profilePhoto: string;
  phone: string;
  department: string; // e.g. 'Computer Science & Engineering'
  departmentId?: string;
  programId?: string;
  batchId?: string;
  course?: string; // e.g. 'B.Tech', 'M.Tech', 'MCA'
  batch?: string; // e.g. '2023-2027'
  graduationYear: number;
  rollNumber: string;
  cgpa: number;
  tenthPercentage: number;
  twelfthPercentage: number;
  skills: string[];
  preferredDomain: string;
  bio: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
  resumeUrl: string;
  resumeFileName?: string;
  placementStatus: PlacementStatus;
  placedCompany?: string;
  placedPackage?: string;
  profileCompletion: number;
  isActive?: boolean;
  projects: Project[];
  certifications: Certification[];
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
