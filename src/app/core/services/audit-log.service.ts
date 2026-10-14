import { Injectable, signal, computed, inject } from '@angular/core';
import { AdminAuditLog, AuditAction } from '../models/audit-log.model';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log-01',
    adminId: 'u-admin-01',
    adminName: 'Dr. Anand Verma',
    adminEmail: 'placement.officer@careernexus.edu',
    action: 'CREATE_STUDENT',
    entityType: 'student',
    entityId: 's-01',
    details: { student_name: 'Rahul Sharma', roll_number: '23CS101', department: 'Computer Science & Engineering' },
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'log-02',
    adminId: 'u-admin-01',
    adminName: 'Dr. Anand Verma',
    adminEmail: 'placement.officer@careernexus.edu',
    action: 'CREATE_ALUMNI',
    entityType: 'alumni',
    entityId: 'a-01',
    details: { alumni_name: 'Priya Nair', company: 'Google', designation: 'Senior Software Engineer' },
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'log-03',
    adminId: 'u-admin-01',
    adminName: 'Dr. Anand Verma',
    adminEmail: 'placement.officer@careernexus.edu',
    action: 'CREATE_DEPARTMENT',
    entityType: 'department',
    entityId: 'dept-01',
    details: { code: 'AI&DS', name: 'Artificial Intelligence & Data Science' },
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'log-04',
    adminId: 'u-admin-01',
    adminName: 'Dr. Anand Verma',
    adminEmail: 'placement.officer@careernexus.edu',
    action: 'CREATE_BATCH',
    entityType: 'batch',
    entityId: 'batch-01',
    details: { name: 'Batch 2024-2028', graduation_year: 2028 },
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);

  private logsSignal = signal<AdminAuditLog[]>(INITIAL_AUDIT_LOGS);
  private isLoadingSignal = signal<boolean>(false);

  logs = computed(() => this.logsSignal());
  isLoading = computed(() => this.isLoadingSignal());

  constructor() {
    this.loadLogs();
  }

  async loadLogs() {
    if (!this.supabase.client) return;
    this.isLoadingSignal.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data && data.length > 0) {
        const mapped: AdminAuditLog[] = data.map((d: any) => ({
          id: d.id,
          adminId: d.admin_id,
          adminName: d.admin_name || 'Placement Administrator',
          adminEmail: d.admin_email || '',
          action: d.action,
          entityType: d.entity_type,
          entityId: d.entity_id,
          details: d.details || {},
          createdAt: d.created_at
        }));
        this.logsSignal.set(mapped);
      }
    } catch (e) {
      console.warn('Error loading audit logs:', e);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async logAction(
    action: AuditAction | string,
    entityType: 'student' | 'alumni' | 'user' | 'department' | 'program' | 'subject' | 'batch' | 'settings' | 'job' | 'application' | string,
    entityId: string,
    details?: Record<string, any>
  ) {
    const admin = this.authService.currentUser();
    const newLog: AdminAuditLog = {
      id: `log-${Date.now()}`,
      adminId: admin?.id || 'u-admin-01',
      adminName: admin?.fullName || 'Placement Administrator',
      adminEmail: admin?.email || 'admin@careernexus.edu',
      action,
      entityType,
      entityId,
      details: details || {},
      createdAt: new Date().toISOString()
    };

    // Prepend to local signal immediately
    this.logsSignal.update(list => [newLog, ...list]);

    if (this.supabase.client) {
      try {
        await this.supabase.client
          .from('admin_audit_logs')
          .insert({
            admin_id: admin?.id || null,
            admin_name: admin?.fullName || 'Placement Administrator',
            admin_email: admin?.email || '',
            action,
            entity_type: entityType,
            entity_id: entityId,
            details: details || {}
          });
      } catch (err) {
        console.warn('Could not save audit log to DB:', err);
      }
    }
  }
}
