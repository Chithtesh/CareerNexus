import { Injectable, signal, computed, inject } from '@angular/core';
import { Application, ApplicationStatus } from '../models/application.model';
import { Job } from '../models/job.model';
import { ApplicationService } from './application.service';
import { JobService } from './job.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { AuditLogService } from './audit-log.service';

@Injectable({
  providedIn: 'root'
})
export class RecruiterService {
  private applicationService = inject(ApplicationService);
  private jobService = inject(JobService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private auditLog = inject(AuditLogService);

  // Recruiter's assigned company (Default demo company: 'Google')
  recruiterCompanyName = signal<string>('Google');

  // Jobs belonging to this recruiter's company
  recruiterJobs = computed(() => {
    const compName = this.recruiterCompanyName().toLowerCase().trim();
    return this.jobService.jobs().filter(j => j.companyName.toLowerCase().trim() === compName);
  });

  // Applications submitted to this recruiter's company
  recruiterApplications = computed(() => {
    const compName = this.recruiterCompanyName().toLowerCase().trim();
    return this.applicationService.applications().filter(
      a => a.companyName.toLowerCase().trim() === compName
    );
  });

  // Metrics
  totalApplicants = computed(() => this.recruiterApplications().length);
  shortlistedCount = computed(() => this.recruiterApplications().filter(a => a.status === 'Shortlisted').length);
  interviewCount = computed(() => this.recruiterApplications().filter(a => a.status === 'Technical Interview' || a.status === 'HR Interview' || a.status === 'Aptitude').length);
  selectedCount = computed(() => this.recruiterApplications().filter(a => a.status === 'Selected').length);

  async createRecruiterJob(jobData: {
    title: string;
    description: string;
    domain: string;
    location: string;
    salary: string;
    minimumCgpa: number;
    requiredSkills: string[];
    applicationDeadline: string;
    vacancies: number;
    employmentType: 'Full Time' | 'Full Time + 6M Internship' | 'Internship' | 'Contract';
  }): Promise<Job> {
    const company = this.jobService.jobs().find(j => j.companyName.toLowerCase().trim() === this.recruiterCompanyName().toLowerCase().trim());
    
    const newJob: Job = {
      id: `job-${Date.now()}`,
      companyId: company?.companyId || 'c-01',
      companyName: this.recruiterCompanyName(),
      companyLogo: company?.companyLogo || 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&auto=format&fit=crop&q=80',
      companyLocation: jobData.location,
      title: jobData.title,
      description: jobData.description,
      domain: jobData.domain,
      location: jobData.location,
      employmentType: jobData.employmentType,
      salary: jobData.salary,
      eligibility: `B.Tech / M.Tech / MCA with minimum CGPA of ${jobData.minimumCgpa}`,
      minimumCgpa: jobData.minimumCgpa,
      requiredSkills: jobData.requiredSkills,
      applicationDeadline: jobData.applicationDeadline,
      status: 'Active',
      vacancies: jobData.vacancies,
      applicantsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.jobService.addJob(newJob);
    
    await this.auditLog.logAction(
      'job_created',
      'job',
      newJob.id,
      { title: newJob.title, company: newJob.companyName, salary: newJob.salary }
    );

    this.toast.success('Job Drive Created! 🚀', `Opening for "${newJob.title}" is now active and visible to eligible students.`);
    return newJob;
  }

  async updateCandidateStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
    notes?: string,
    meetingLink?: string
  ): Promise<void> {
    const app = this.applicationService.applications().find(a => a.id === applicationId);
    if (!app) return;

    await this.applicationService.updateApplicationStatus(applicationId, newStatus, notes, meetingLink);

    await this.auditLog.logAction(
      `application_status_${newStatus.toLowerCase().replace(/\s+/g, '_')}`,
      'application',
      applicationId,
      {
        studentName: app.studentName,
        companyName: app.companyName,
        jobTitle: app.jobTitle,
        newStatus,
        notes
      }
    );

    this.toast.success('Candidate Updated', `${app.studentName} has been moved to "${newStatus}" stage.`);
  }
}
