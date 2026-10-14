import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecruiterService } from '../../../core/services/recruiter.service';
import { StudentService } from '../../../core/services/student.service';
import { JobService } from '../../../core/services/job.service';
import { SkillMatchingService, SingleJobSkillMatch } from '../../../core/services/skill-matching.service';
import { Application, ApplicationStatus } from '../../../core/models/application.model';
import { IconComponent } from '../../../shared/icons/icon.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';

@Component({
  selector: 'app-recruiter-applicants',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, BadgeComponent],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300 pb-12">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Candidate Recruitment Pipeline</h1>
          <p class="text-sm text-slate-500 mt-1">Review student applications, analyze candidate skill matches, shortlist profiles, and extend offers.</p>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search candidate name, roll, or email..."
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
            />
          </div>
          <div>
            <select
              [ngModel]="statusFilter()"
              (ngModelChange)="statusFilter.set($event)"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
            >
              <option value="all">All Pipeline Stages ({{ recruiterService.recruiterApplications().length }})</option>
              <option value="Applied">Applied</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Technical Interview">Technical Interview</option>
              <option value="HR Interview">HR Interview</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div>
            <select
              [ngModel]="deptFilter()"
              (ngModelChange)="deptFilter.set($event)"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
            >
              <option value="all">All Departments</option>
              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics & Communication">Electronics & Communication</option>
            </select>
          </div>
        </div>

        <div *ngIf="searchQuery() || statusFilter() !== 'all' || deptFilter() !== 'all'" class="flex justify-end pt-1">
          <button
            type="button"
            (click)="resetFilters()"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
          >
            Reset Candidate Filters
          </button>
        </div>
      </div>

      <!-- Applicants List -->
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px] tracking-wider bg-slate-50/50">
                <th class="py-3 px-4 sm:px-6">Candidate Details</th>
                <th class="py-3 px-4">Applied Role</th>
                <th class="py-3 px-4">Skill Match %</th>
                <th class="py-3 px-4">Academic Score</th>
                <th class="py-3 px-4">Current Pipeline Stage</th>
                <th class="py-3 px-4 sm:px-6 text-right">Recruitment Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let app of filteredApplications()" class="hover:bg-slate-50/70 transition-colors">
                <td class="py-4 px-4 sm:px-6">
                  <div class="flex items-center gap-3">
                    <img
                      [src]="app.studentAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'"
                      class="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h4 class="font-bold text-slate-900 text-sm">{{ app.studentName }}</h4>
                      <p class="text-[11px] text-slate-500 font-mono">{{ app.studentRoll }} • {{ app.studentDepartment }}</p>
                    </div>
                  </div>
                </td>

                <td class="py-4 px-4">
                  <span class="font-bold text-slate-800">{{ app.jobTitle }}</span>
                  <span class="text-[11px] text-slate-400 block font-semibold">{{ app.salary }}</span>
                </td>

                <!-- Skill Match % Column -->
                <td class="py-4 px-4">
                  @let match = getApplicantSkillMatch(app);
                  <div *ngIf="match.matchPercentage !== null" class="space-y-1">
                    <div class="flex items-center gap-1.5 font-black text-xs" [ngClass]="match.matchPercentage >= 75 ? 'text-emerald-700' : match.matchPercentage >= 50 ? 'text-blue-700' : 'text-amber-700'">
                      <span>{{ match.matchPercentage }}%</span>
                      <span class="text-[10px] text-slate-400 font-normal">({{ match.matchedSkills.length }}/{{ match.requiredSkills.length }})</span>
                    </div>
                    <div class="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full"
                        [ngClass]="match.matchPercentage >= 75 ? 'bg-emerald-500' : match.matchPercentage >= 50 ? 'bg-blue-600' : 'bg-amber-500'"
                        [style.width]="match.matchPercentage + '%'"
                      ></div>
                    </div>
                  </div>
                  <span *ngIf="match.matchPercentage === null" class="text-[10px] text-slate-400 italic">No skill reqs</span>
                </td>

                <td class="py-4 px-4">
                  <span class="font-extrabold text-blue-700 text-sm">{{ app.studentCgpa.toFixed(2) }}</span>
                  <span class="text-[11px] text-slate-400 font-semibold block">CGPA / 10.0</span>
                </td>

                <td class="py-4 px-4">
                  <app-badge [variant]="app.status === 'Selected' ? 'success' : app.status === 'Rejected' ? 'error' : app.status === 'Technical Interview' ? 'primary' : 'warning'">
                    {{ app.status }}
                  </app-badge>
                </td>

                <td class="py-4 px-4 sm:px-6 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      (click)="openUpdateStatusModal(app)"
                      class="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors"
                    >
                      Update Stage
                    </button>
                    <button
                      type="button"
                      (click)="inspectCandidate(app)"
                      class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Inspect Candidate"
                    >
                      <app-icon name="eye" [size]="15"></app-icon>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="filteredApplications().length === 0">
                <td colspan="6" class="py-12 text-center text-slate-500">
                  <p class="font-bold text-slate-600">No candidates match the specified filters.</p>
                  <p class="text-xs text-slate-400 mt-1">Try adjusting keywords, stage, or department filters.</p>
                  <button
                    *ngIf="searchQuery() || statusFilter() !== 'all' || deptFilter() !== 'all'"
                    type="button"
                    (click)="resetFilters()"
                    class="mt-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    Clear Filters
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Update Stage Modal -->
      <div *ngIf="selectedAppForStage" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900">Update Candidate Stage</h3>
            <button (click)="selectedAppForStage = null" class="p-1 text-slate-400 hover:text-slate-600">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <span class="text-slate-400 uppercase font-bold text-[10px]">Candidate</span>
              <div class="font-bold text-slate-900 text-sm mt-0.5">{{ selectedAppForStage.studentName }} ({{ selectedAppForStage.jobTitle }})</div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700">Next Stage</label>
              <select [(ngModel)]="newStageStatus" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white text-sm font-semibold">
                <option value="Applied">Applied (Initial Review)</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Aptitude">Aptitude Assessment Round</option>
                <option value="Technical Interview">Technical Interview</option>
                <option value="HR Interview">HR & Leadership Interview</option>
                <option value="Selected">Selected (Extend Offer)</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700">Recruitment Notes & Feedback</label>
              <textarea [(ngModel)]="stageNotes" rows="2" placeholder="e.g. Cleared Round 1 DSA assessment with high score. Scheduling system design interview." class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200"></textarea>
            </div>

            <div>
              <label class="block font-semibold text-slate-700">Meeting / Video Link (Optional)</label>
              <input type="text" [(ngModel)]="stageLink" placeholder="https://meet.google.com/..." class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
            </div>
          </div>

          <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" (click)="selectedAppForStage = null" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
            <button type="button" (click)="confirmStageUpdate()" class="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs">Save Stage</button>
          </div>
        </div>
      </div>

      <!-- Candidate Inspection Drawer -->
      <div *ngIf="inspectingApp" class="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs">
        <div class="w-full max-w-lg bg-white h-full shadow-2xl p-6 sm:p-8 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-300 custom-scrollbar">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <img [src]="inspectingApp.studentAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'" class="w-12 h-12 rounded-2xl object-cover border border-slate-200" />
              <div>
                <h3 class="text-base font-bold text-slate-900">{{ inspectingApp.studentName }}</h3>
                <p class="text-xs text-slate-500 font-mono">{{ inspectingApp.studentRoll }} • {{ inspectingApp.studentDepartment }}</p>
              </div>
            </div>
            <button (click)="inspectingApp = null" class="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div>
              <div class="text-[10px] uppercase font-bold text-slate-400">CGPA</div>
              <div class="text-lg font-black text-blue-700 mt-0.5">{{ inspectingApp.studentCgpa.toFixed(2) }}</div>
            </div>
            <div>
              <div class="text-[10px] uppercase font-bold text-slate-400">Current Status</div>
              <div class="text-xs font-bold text-slate-800 mt-1.5">{{ inspectingApp.status }}</div>
            </div>
          </div>

          <!-- Skill Matching & Gap Evaluation for Recruiter -->
          @let match = getApplicantSkillMatch(inspectingApp);
          <div class="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <app-icon name="award" [size]="14" customClass="text-blue-600"></app-icon>
                Skill Match Evaluation
              </span>
              <span
                *ngIf="match.matchPercentage !== null"
                class="text-sm font-black"
                [ngClass]="match.matchPercentage >= 75 ? 'text-emerald-700' : match.matchPercentage >= 50 ? 'text-blue-700' : 'text-amber-700'"
              >
                {{ match.matchPercentage }}% Match
              </span>
            </div>

            <div *ngIf="match.matchPercentage !== null" class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                [ngClass]="match.matchPercentage >= 75 ? 'bg-emerald-500' : match.matchPercentage >= 50 ? 'bg-blue-600' : 'bg-amber-500'"
                [style.width]="match.matchPercentage + '%'"
              ></div>
            </div>

            <!-- Job Required Skills -->
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Job Required Skills ({{ match.requiredSkills.length }}):</span>
              <div class="flex flex-wrap gap-1">
                <span *ngFor="let s of match.requiredSkills" class="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-800">
                  {{ s }}
                </span>
                <span *ngIf="match.requiredSkills.length === 0" class="text-xs text-slate-400 italic">No specific skill requirements defined.</span>
              </div>
            </div>

            <!-- Student Skills -->
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Student Profile Skills ({{ match.studentSkills.length }}):</span>
              <div class="flex flex-wrap gap-1">
                <span *ngFor="let s of match.studentSkills" class="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-800">
                  {{ s }}
                </span>
                <span *ngIf="match.studentSkills.length === 0" class="text-xs text-amber-700 italic">No skills listed on profile.</span>
              </div>
            </div>

            <!-- Matched Skills (✓) -->
            <div *ngIf="match.matchedSkills.length > 0">
              <span class="text-[10px] uppercase font-bold text-emerald-800 block mb-1.5">Matched Skills:</span>
              <div class="flex flex-wrap gap-1">
                <span *ngFor="let s of match.matchedSkills" class="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
                  ✓ {{ s }}
                </span>
              </div>
            </div>

            <!-- Missing Skills (⚠) -->
            <div *ngIf="match.missingSkills.length > 0">
              <span class="text-[10px] uppercase font-bold text-rose-800 block mb-1.5">Missing Requirements:</span>
              <div class="flex flex-wrap gap-1">
                <span *ngFor="let s of match.missingSkills" class="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-800">
                  ⚠ {{ s }}
                </span>
              </div>
            </div>
          </div>

          <!-- Application Timeline History -->
          <div>
            <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Recruitment Timeline History</h4>
            <div class="space-y-2.5">
              <div *ngFor="let t of inspectingApp.timeline" class="p-3 rounded-xl border border-slate-200 bg-white text-xs space-y-1">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-blue-700">{{ t.status }}</span>
                  <span class="text-[10px] text-slate-400">{{ t.date }}</span>
                </div>
                <p class="text-slate-600 text-[11px]">{{ t.notes }}</p>
                <a *ngIf="t.locationOrLink" [href]="t.locationOrLink" target="_blank" class="text-blue-600 hover:underline text-[11px] font-semibold block">
                  Link: {{ t.locationOrLink }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RecruiterApplicantsComponent {
  recruiterService = inject(RecruiterService);
  studentService = inject(StudentService);
  jobService = inject(JobService);
  skillMatchingService = inject(SkillMatchingService);

  searchQuery = signal('');
  statusFilter = signal('all');
  deptFilter = signal('all');

  selectedAppForStage: Application | null = null;
  newStageStatus: ApplicationStatus = 'Shortlisted';
  stageNotes = '';
  stageLink = '';

  inspectingApp: Application | null = null;

  getApplicantSkillMatch(app: Application): SingleJobSkillMatch {
    const student = this.studentService.students().find(
      s => s.id === app.studentId || s.userId === app.studentId
    ) || this.studentService.currentStudent();

    const job = this.jobService.jobs().find(j => j.id === app.jobId) || {
      id: app.jobId,
      companyId: app.companyId,
      companyName: app.companyName,
      companyLogo: app.companyLogo,
      companyLocation: 'Bengaluru',
      title: app.jobTitle,
      description: '',
      domain: 'Software Development',
      location: 'Bengaluru',
      employmentType: 'Full Time',
      salary: app.salary,
      eligibility: 'B.Tech',
      minimumCgpa: 7.0,
      requiredSkills: ['Java', 'SQL', 'Git', 'REST API', 'Spring Boot'],
      applicationDeadline: new Date().toISOString(),
      status: 'Active',
      vacancies: 5,
      applicantsCount: 1,
      createdAt: app.appliedAt,
      updatedAt: app.updatedAt
    };

    return this.skillMatchingService.calculateJobSkillMatch(student, job, app);
  }

  filteredApplications = computed(() => {
    let list = this.recruiterService.recruiterApplications();
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const dept = this.deptFilter();

    if (status !== 'all') {
      list = list.filter(a => a.status === status);
    }
    if (dept !== 'all') {
      list = list.filter(a => a.studentDepartment === dept);
    }
    if (q) {
      list = list.filter(
        a =>
          a.studentName.toLowerCase().includes(q) ||
          a.studentRoll.toLowerCase().includes(q) ||
          a.studentEmail.toLowerCase().includes(q) ||
          a.jobTitle.toLowerCase().includes(q)
      );
    }
    return list;
  });

  openUpdateStatusModal(app: Application) {
    this.selectedAppForStage = app;
    this.newStageStatus = app.status;
    this.stageNotes = '';
    this.stageLink = '';
  }

  async confirmStageUpdate() {
    if (!this.selectedAppForStage) return;
    await this.recruiterService.updateCandidateStatus(
      this.selectedAppForStage.id,
      this.newStageStatus,
      this.stageNotes,
      this.stageLink
    );
    this.selectedAppForStage = null;
  }

  inspectCandidate(app: Application) {
    this.inspectingApp = app;
  }

  resetFilters() {
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.deptFilter.set('all');
  }
}
