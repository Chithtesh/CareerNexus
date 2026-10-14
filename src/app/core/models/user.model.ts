export type UserRole = 'student' | 'alumni' | 'admin' | 'recruiter';
export type UserAccountStatus = 'active' | 'deactivated' | 'pending_activation';

export interface User {
  id: string;
  username?: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  department?: string;
  company?: string;
  designation?: string;
  rollNumber?: string;
  status?: UserAccountStatus;
  isActive?: boolean;
  invitedAt?: string;
  activatedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthSession {
  user: User;
  token: string;
}
