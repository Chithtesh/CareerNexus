export type AuditAction =
  | 'CREATE_STUDENT'
  | 'UPDATE_STUDENT'
  | 'GRADUATE_STUDENT'
  | 'CREATE_ALUMNI'
  | 'UPDATE_ALUMNI'
  | 'DEACTIVATE_USER'
  | 'REACTIVATE_USER'
  | 'BULK_IMPORT_STUDENTS'
  | 'BULK_IMPORT_ALUMNI'
  | 'CREATE_DEPARTMENT'
  | 'UPDATE_DEPARTMENT'
  | 'CREATE_PROGRAM'
  | 'UPDATE_PROGRAM'
  | 'CREATE_BATCH'
  | 'UPDATE_BATCH'
  | 'SETTINGS_UPDATE';

export interface AdminAuditLog {
  id: string;
  adminId?: string;
  adminName: string;
  adminEmail?: string;
  action: AuditAction | string;
  entityType: 'student' | 'alumni' | 'user' | 'department' | 'program' | 'subject' | 'batch' | 'settings' | 'job' | 'application' | string;
  entityId: string;
  details?: Record<string, any>;
  createdAt: string;
}
