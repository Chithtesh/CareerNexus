import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RecruiterService } from '../../../core/services/recruiter.service';
import { JobService } from '../../../core/services/job.service';
import { IconComponent } from '../../../shared/icons/icon.component';
import { StatCardComponent } from '../../../shared/ui/stat-card.component';

@Component({
  selector: 'app-recruiter-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, StatCardComponent],
  template: `
    <div class="space-y-8 animate-in fade-in duration-300 pb-12">
      <!-- Top Recruiter Welcome Hero -->
      <div class="bg-linear-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/15 relative overflow-hidden">
        <div class="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-xs border border-white/20 mb-3">
              <app-icon name="building" [size]="14"></app-icon>
              {{ recruiterService.recruiterCompanyName() }} Talent Acquisition Portal
            </span>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Recruiter & Hiring Workspace
            </h1>
            <p class="text-blue-100 text-sm sm:text-base mt-1.5 max-w-xl leading-relaxed">
              Track student candidate pipelines, schedule technical interview rounds, manage job descriptions, and roll out verified placement offers.
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <a
              routerLink="/recruiter/jobs"
              class="px-5 py-2.5 rounded-xl bg-white text-blue-700 font-semibold text-xs sm:text-sm hover:bg-blue-50 shadow-md transition-all hover:scale-[1.02]"
            >
              + Post New Drive
            </a>
            <a
              routerLink="/recruiter/applicants"
              class="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm border border-white/30 backdrop-blur-xs transition-all"
            >
              Review Pipeline ({{ recruiterService.totalApplicants() }})
            </a>
          </div>
        </div>
      </div>

      <!-- 4 Key Hiring Metrics Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <app-stat-card
          title="Total Applicants"
          [value]="recruiterService.totalApplicants()"
          icon="users"
          subtitle="Applied to your open roles"
          color="blue"
        ></app-stat-card>

        <app-stat-card
          title="Shortlisted Candidates"
          [value]="recruiterService.shortlistedCount()"
          icon="check-circle"
          subtitle="Resume screening cleared"
          color="purple"
        ></app-stat-card>

        <app-stat-card
          title="Interviews / Tests"
          [value]="recruiterService.interviewCount()"
          icon="video"
          subtitle="Active assessment & interview stages"
          color="amber"
        ></app-stat-card>

        <app-stat-card
          title="Offers Extended"
          [value]="recruiterService.selectedCount()"
          icon="award"
          subtitle="Final selections confirmed"
          color="emerald"
        ></app-stat-card>
      </div>

      <!-- Active Job Postings & Pipeline Overview -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Active Drives List (2 cols) -->
        <div class="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-slate-900">Active Job Postings & Drives</h3>
              <p class="text-xs text-slate-500">Live roles published for campus recruitment</p>
            </div>
            <a routerLink="/recruiter/jobs" class="text-xs font-semibold text-blue-600 hover:underline">
              Manage Drives →
            </a>
          </div>

          <div class="space-y-4">
            <div
              *ngFor="let job of recruiterService.recruiterJobs()"
              class="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div class="space-y-1.5">
                <div class="flex items-center gap-2">
                  <h4 class="text-sm font-bold text-slate-900">{{ job.title }}</h4>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">{{ job.status }}</span>
                </div>
                <p class="text-xs text-slate-500 font-medium">{{ job.location }} • Min CGPA: {{ job.minimumCgpa }} • Package: <strong class="text-slate-800">{{ job.salary }}</strong></p>
                <div class="flex flex-wrap gap-1 mt-2">
                  <span *ngFor="let sk of job.requiredSkills.slice(0, 4)" class="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] font-semibold text-slate-700">
                    {{ sk }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <a
                  routerLink="/recruiter/applicants"
                  class="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <app-icon name="users" [size]="14"></app-icon>
                  Applicants
                </a>
              </div>
            </div>

            <div *ngIf="recruiterService.recruiterJobs().length === 0" class="p-8 rounded-2xl bg-slate-50 text-center text-slate-500 text-xs">
              No active job postings found. Click "+ Post New Drive" to create your first campus opening.
            </div>
          </div>
        </div>

        <!-- Hiring Pipeline Funnel (1 col) -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Pipeline Funnel</h3>
            <p class="text-xs text-slate-500">Live candidate status distribution</p>
          </div>

          <div class="space-y-3">
            <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-600 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                1. Applied
              </span>
              <span class="text-sm font-bold text-slate-900">{{ recruiterService.totalApplicants() }}</span>
            </div>

            <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-600 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                2. Shortlisted
              </span>
              <span class="text-sm font-bold text-slate-900">{{ recruiterService.shortlistedCount() }}</span>
            </div>

            <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-600 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                3. Technical & HR Interview
              </span>
              <span class="text-sm font-bold text-slate-900">{{ recruiterService.interviewCount() }}</span>
            </div>

            <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-600 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                4. Selected (Offer)
              </span>
              <span class="text-sm font-bold text-slate-900">{{ recruiterService.selectedCount() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RecruiterDashboardComponent {
  recruiterService = inject(RecruiterService);
}
