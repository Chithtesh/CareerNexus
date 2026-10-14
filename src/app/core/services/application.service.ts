import { Injectable, signal, computed, inject } from '@angular/core';
import { Application, ApplicationStatus, ApplicationTimelineEvent } from '../models/application.model';
import { MOCK_APPLICATIONS } from '../data/mock-data';
import { StudentService } from './student.service';
import { JobService } from './job.service';
import { TaskService } from './task.service';
import { SupabaseService } from './supabase.service';
import { ToastService } from './toast.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private studentService = inject(StudentService);
  private jobService = inject(JobService);
  private taskService = inject(TaskService);
  private supabase = inject(SupabaseService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);

  private readonly LOCAL_STORAGE_KEY = 'placementconnect_applications_cache';

  private applicationsSignal = signal<Application[]>(this.loadInitialApplications());
  isLoading = signal<boolean>(false);

  applications = computed(() => this.applicationsSignal());

  // Current logged in student's applications
  studentApplications = computed(() => {
    const student = this.studentService.currentStudent();
    if (!student) return [];
    return this.applicationsSignal().filter(
      app => app.studentId === student.id || app.studentId === student.userId || app.studentRoll === student.rollNumber || app.studentEmail === student.email
    );
  });

  constructor() {
    this.fetchApplicationsFromDatabase();
    this.initRealtimeSubscription();
  }

  private loadInitialApplications(): Application[] {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return MOCK_APPLICATIONS;
  }

  private saveApplicationsToCache(apps: Application[]) {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(apps));
    } catch {
      // ignore
    }
  }

  async fetchApplicationsFromDatabase() {
    const client = this.supabase.getClient();
    if (!this.supabase.isConfigured || !client) return;

    this.isLoading.set(true);
    try {
      const { data, error } = await client
        .from('applications')
        .select('*')
        .order('applied_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch applications from Supabase:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const mapped: Application[] = data.map((d: any) => this.mapDbRowToApplication(d));
        this.applicationsSignal.set(mapped);
        this.saveApplicationsToCache(mapped);
      }
    } catch (e) {
      console.warn('Applications fetch exception:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  private initRealtimeSubscription() {
    if (!this.supabase.isConfigured) return;
    this.supabase.subscribeToChanges('applications', (payload) => {
      if (payload.eventType === 'INSERT') {
        const newApp = this.mapDbRowToApplication(payload.new);
        this.applicationsSignal.update(list => [newApp, ...list.filter(a => a.id !== newApp.id)]);
      } else if (payload.eventType === 'UPDATE') {
        const updated = this.mapDbRowToApplication(payload.new);
        this.applicationsSignal.update(list => list.map(a => a.id === updated.id ? updated : a));
      } else if (payload.eventType === 'DELETE') {
        this.applicationsSignal.update(list => list.filter(a => a.id !== payload.old.id));
      }
      this.saveApplicationsToCache(this.applicationsSignal());
    });
  }

  private mapDbRowToApplication(row: any): Application {
    return {
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      studentRoll: row.student_roll,
      studentDepartment: row.student_department,
      studentCgpa: Number(row.student_cgpa),
      studentEmail: row.student_email,
      studentAvatar: row.student_avatar,
      studentResumeUrl: row.student_resume_url,
      jobId: row.job_id,
      jobTitle: row.job_title,
      companyId: row.company_id,
      companyName: row.company_name,
      companyLogo: row.company_logo,
      salary: row.salary,
      status: row.status,
      notes: row.notes || '',
      timeline: row.timeline || [],
      appliedAt: row.applied_at,
      updatedAt: row.updated_at
    };
  }

  hasApplied(jobId: string, studentId: string): boolean {
    const student = this.studentService.currentStudent();
    return this.applicationsSignal().some(
      app => app.jobId === jobId && (app.studentId === studentId || app.studentId === student?.userId || app.studentRoll === student?.rollNumber)
    );
  }

  async applyToJob(jobId: string): Promise<boolean> {
    const student = this.studentService.currentStudent();
    const job = this.jobService.getJobById(jobId);

    if (!job) {
      this.toast.error('Application Error', 'Job opening not found.');
      return false;
    }

    if (this.hasApplied(jobId, student.id)) {
      this.toast.warning('Already Applied', `You have already submitted an application for ${job.title} at ${job.companyName}.`);
      return false;
    }

    // Check CGPA Eligibility
    if (student.cgpa < job.minimumCgpa) {
      this.toast.error(
        'Eligibility Criteria Unmet',
        `This role requires a minimum CGPA of ${job.minimumCgpa}. Your current recorded CGPA is ${student.cgpa}.`
      );
      return false;
    }

    const initialTimeline: ApplicationTimelineEvent[] = [
      {
        status: 'Applied',
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        notes: 'Application submitted with verified resume and academic profile.'
      }
    ];

    const newApp: Application = {
      id: `app-${Date.now()}`,
      studentId: student.id || student.userId,
      studentName: student.fullName,
      studentRoll: student.rollNumber,
      studentDepartment: student.department,
      studentCgpa: student.cgpa,
      studentEmail: student.email,
      studentAvatar: student.profilePhoto,
      studentResumeUrl: student.resumeUrl,
      jobId: job.id,
      jobTitle: job.title,
      companyId: job.companyId,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      salary: job.salary,
      status: 'Applied',
      notes: 'Application submitted successfully. Under initial profile screening.',
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: initialTimeline
    };

    // Update in memory and local storage
    this.applicationsSignal.update(list => [newApp, ...list]);
    this.saveApplicationsToCache(this.applicationsSignal());
    await this.jobService.markAsApplied(job.id);
    await this.studentService.updateCurrentStudentProfile({ placementStatus: 'In Progress' });

    // Automatically generate company-specific & skill-gap preparation tasks
    try {
      await this.taskService.generateTasksForApplication(newApp, job, student);
    } catch (taskErr) {
      console.warn('Error auto-generating tasks for application:', taskErr);
    }

    // Sync to Supabase PostgreSQL
    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client) {
      try {
        const { data, error } = await client
          .from('applications')
          .insert({
            student_id: student.id,
            job_id: job.id,
            student_name: student.fullName,
            student_roll: student.rollNumber,
            student_department: student.department,
            student_cgpa: student.cgpa,
            student_email: student.email,
            student_avatar: student.profilePhoto,
            student_resume_url: student.resumeUrl,
            job_title: job.title,
            company_id: job.companyId,
            company_name: job.companyName,
            company_logo: job.companyLogo,
            salary: job.salary,
            status: 'Applied',
            notes: newApp.notes,
            timeline: initialTimeline
          })
          .select()
          .single();

        if (!error && data) {
          const mapped = this.mapDbRowToApplication(data);
          this.applicationsSignal.update(list => list.map(a => a.id === newApp.id ? mapped : a));
          this.saveApplicationsToCache(this.applicationsSignal());
        }
      } catch (err) {
        console.warn('Supabase application submission DB error:', err);
      }
    }

    this.toast.success(
      'Application Submitted! 🎉',
      `You have successfully applied to ${job.title} at ${job.companyName}. Best of luck!`
    );

    return true;
  }

  async updateApplicationStatus(applicationId: string, newStatus: ApplicationStatus, notes?: string, link?: string) {
    const app = this.applicationsSignal().find(a => a.id === applicationId);
    if (!app) return;

    const timelineEvent: ApplicationTimelineEvent = {
      status: newStatus,
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      notes: notes || `Application moved to ${newStatus} stage.`,
      locationOrLink: link
    };

    const updatedApp: Application = {
      ...app,
      status: newStatus,
      notes: notes || app.notes,
      timeline: [...app.timeline, timelineEvent],
      updatedAt: new Date().toISOString()
    };

    this.applicationsSignal.update(list =>
      list.map(a => a.id === applicationId ? updatedApp : a)
    );
    this.saveApplicationsToCache(this.applicationsSignal());

    // If selected, update student status
    if (newStatus === 'Selected') {
      const student = this.studentService.getStudentById(app.studentId);
      if (student) {
        await this.studentService.updateCurrentStudentProfile({
          placementStatus: 'Selected',
          placedCompany: app.companyName,
          placedPackage: app.salary
        });
      }
    }

    // Sync to Supabase
    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client) {
      try {
        await client
          .from('applications')
          .update({
            status: newStatus,
            notes: updatedApp.notes,
            timeline: updatedApp.timeline,
            updated_at: new Date().toISOString()
          })
          .eq('id', applicationId);
      } catch (err) {
        console.warn('Update application DB error:', err);
      }
    }

    this.toast.success('Status Updated', `Application moved to "${newStatus}" stage.`);
  }
}
