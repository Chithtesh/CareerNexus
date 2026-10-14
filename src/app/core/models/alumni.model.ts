export type ContactVisibility = 'public' | 'connected_only' | 'hidden';

export type ContactMethodType =
  | 'linkedin'
  | 'email'
  | 'whatsapp'
  | 'telegram'
  | 'website'
  | 'other';

export interface ContactMethod {
  type: ContactMethodType;
  label: string;
  url: string;
  isVisible: boolean;
}

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface AlumniConnection {
  id: string;
  requesterId: string;
  requesterName?: string;
  requesterAvatar?: string;
  requesterDepartment?: string;
  requesterProgram?: string;
  requesterGraduationYear?: number;
  requesterSkills?: string[];
  receiverId: string;
  receiverName?: string;
  receiverAvatar?: string;
  requestType: string;
  connectionType?: string;
  mentorshipTopic: string;
  reason: string;
  message: string;
  status: ConnectionStatus;
  createdAt: string;
  acceptedAt?: string;
  updatedAt: string;
}

export interface Alumni {
  id: string;
  userId: string;
  alumniId?: string;
  fullName: string;
  email: string;
  profilePhoto: string;
  phone?: string;
  graduationYear: number;
  department: string;
  departmentId?: string;
  batchId?: string;
  company: string;
  companyId?: string;
  companyLogo?: string;
  designation: string;
  experienceYears: number;
  skills: string[];
  preferredDomains: string[];
  bio: string;
  linkedinUrl: string;
  githubUrl?: string;
  portfolioUrl?: string;
  websiteUrl?: string;
  industry?: string;
  location?: string;
  mentorshipTopics?: string[];
  isVerified?: boolean;
  verifiedAt?: string;
  contactVisibility?: ContactVisibility;
  contactMethods?: ContactMethod[];
  contactPreference?: string;
  availableForMentoring: boolean;
  menteesCount?: number;
  rating?: number;
  isActive?: boolean;
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
