import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommandCenterService } from '../../../core/services/command-center.service';
import { StudentService } from '../../../core/services/student.service';
import { JobService } from '../../../core/services/job.service';
import { ApplicationService } from '../../../core/services/application.service';
import { CompanyService } from '../../../core/services/company.service';
import { TaskService } from '../../../core/services/task.service';
import { SkillMatchingService } from '../../../core/services/skill-matching.service';
import { CalendarService } from '../../../core/services/calendar.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { IconComponent } from '../../../shared/icons/icon.component';
import { StudentPlacementRow } from '../../../core/services/command-center.service';

type CommandCenterTab = 'overview' | 'funnel' | 'companies' | 'jobs' | 'students' | 'interviews' | 'departments';

@Component({
  selector: 'app-placement-command-center',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  template: `
    <div class="space-y-8 animate-in fade-in duration-300 pb-16 select-none">
      <!-- ========================================================================= -->
      <!-- TOP COMMAND CENTER HEADER & GLOBAL CONTROL BAR -->
      <!-- ========================================================================= -->
      <div class="bg-linear-to-r from-slate-950 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-indigo-900/40 relative overflow-hidden">
        <div class="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div class="relative z-10 space-y-6">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div class="flex flex-wrap items-center gap-2 mb-2">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Phase 5 Live Command Center
                </span>
                <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/15">
                  Institutional Intelligence
                </span>
              </div>
              <h1 class="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Placement Command Center
              </h1>
              <p class="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                Real-time central oversight of campus recruitment drives, candidate application pipelines, skill gap diagnostics, and department placement velocity.
              </p>
            </div>

            <!-- Quick Action Shortcuts -->
            <div class="flex flex-wrap gap-2.5 shrink-0">
              <a
                routerLink="/admin/students"
                class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 backdrop-blur-xs flex items-center gap-1.5 transition-all"
              >
                <app-icon name="users" [size]="14"></app-icon>
                <span>Students</span>
              </a>
              <a
                routerLink="/admin/companies"
                class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 backdrop-blur-xs flex items-center gap-1.5 transition-all"
              >
                <app-icon name="building" [size]="14"></app-icon>
                <span>Companies</span>
              </a>
              <a
                routerLink="/admin/jobs"
                class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 backdrop-blur-xs flex items-center gap-1.5 transition-all"
              >
                <app-icon name="briefcase" [size]="14"></app-icon>
                <span>Drives</span>
              </a>
              <a
                routerLink="/admin/calendar"
                class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md flex items-center gap-1.5 transition-all"
              >
                <app-icon name="calendar" [size]="14"></app-icon>
                <span>Schedule Drive</span>
              </a>
            </div>
          </div>

          <!-- Interactive Global Filters Bar -->
          <div class="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <!-- Search Input -->
            <div class="sm:col-span-2 lg:col-span-2">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange()"
                placeholder="Search student, roll number, department, or company..."
                class="w-full px-3.5 py-2 rounded-xl bg-slate-900/60 border border-white/20 text-white placeholder:text-slate-400 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <!-- Department Filter -->
            <div>
              <select
                [(ngModel)]="selectedDept"
                (ngModelChange)="onDeptChange()"
                class="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-white/20 text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="all">All Departments</option>
                <option *ngFor="let d of orgService.departments()" [value]="d.name">{{ d.name }}</option>
                <option *ngIf="orgService.departments().length === 0" value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option *ngIf="orgService.departments().length === 0" value="Information Technology">Information Technology</option>
                <option *ngIf="orgService.departments().length === 0" value="Electronics & Communication">Electronics & Communication</option>
              </select>
            </div>

            <!-- Placement Status Filter -->
            <div>
              <select
                [(ngModel)]="selectedPlacementStatus"
                (ngModelChange)="onStatusChange()"
                class="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-white/20 text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="all">All Placement Statuses</option>
                <option value="Not Placed">Not Placed</option>
                <option value="In Progress">In Progress</option>
                <option value="Selected">Selected</option>
                <option value="Offer Accepted">Offer Accepted</option>
              </select>
            </div>

            <!-- Reset Filters -->
            <div class="flex items-center justify-end">
              <button
                type="button"
                (click)="resetAllFilters()"
                class="w-full px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <app-icon name="rotate-ccw" [size]="13"></app-icon>
                <span>Reset Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- SECTION 2: TOP SUMMARY CARDS (DYNAMIC AGGREGATIONS) -->
      <!-- ========================================================================= -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <!-- 1. Total Students -->
        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Students</span>
            <app-icon name="users" [size]="14" customClass="text-blue-600"></app-icon>
          </div>
          <div class="text-2xl font-black text-slate-900">{{ summary().totalStudents }}</div>
          <div class="text-[11px] text-emerald-600 font-semibold">{{ summary().eligibleStudents }} Eligible (CGPA ≥ 6.0)</div>
        </div>

        <!-- 2. Applied Students -->
        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Applied</span>
            <app-icon name="briefcase" [size]="14" customClass="text-indigo-600"></app-icon>
          </div>
          <div class="text-2xl font-black text-indigo-900">{{ summary().studentsWithApplications }}</div>
          <div class="text-[11px] text-slate-500 font-medium">{{ summary().totalApplications }} Total Applications</div>
        </div>

        <!-- 3. Shortlisted -->
        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Shortlisted</span>
            <app-icon name="check-circle" [size]="14" customClass="text-purple-600"></app-icon>
          </div>
          <div class="text-2xl font-black text-purple-900">{{ summary().studentsShortlisted }}</div>
          <div class="text-[11px] text-purple-700 font-semibold">{{ summary().shortlistedApplications }} App Shortlists</div>
        </div>

        <!-- 4. In Interview -->
        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Interviews</span>
            <app-icon name="calendar" [size]="14" customClass="text-amber-600"></app-icon>
          </div>
          <div class="text-2xl font-black text-amber-900">{{ summary().studentsInInterview }}</div>
          <div class="text-[11px] text-amber-700 font-semibold">{{ summary().scheduledInterviews }} Total Rounds</div>
        </div>

        <!-- 5. Placed Offers -->
        <div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
            <span>Placed</span>
            <app-icon name="award" [size]="14" customClass="text-emerald-700"></app-icon>
          </div>
          <div class="text-2xl font-black text-emerald-900">{{ summary().studentsPlaced }}</div>
          <div class="text-[11px] text-emerald-700 font-bold">{{ summary().placementRate }}% Placement Rate</div>
        </div>

        <!-- 6. Active Drives -->
        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Active Drives</span>
            <app-icon name="building" [size]="14" customClass="text-cyan-600"></app-icon>
          </div>
          <div class="text-2xl font-black text-slate-900">{{ summary().activeJobs }}</div>
          <div class="text-[11px] text-slate-500 font-medium">{{ summary().activeCompanies }} Hiring Partners</div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- SECTION 3: VISUAL PLACEMENT FUNNEL & CONVERSION PIPELINE -->
      <!-- ========================================================================= -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">Conversion Funnel</span>
              <h3 class="text-lg font-bold text-slate-900 tracking-tight">Institutional Placement Funnel</h3>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Live funnel stages measuring candidate progression and stage-to-stage conversion efficiency.
            </p>
          </div>
          <span class="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 self-start sm:self-auto">
            Overall Conversion: <strong class="text-emerald-700 font-extrabold">{{ summary().placementRate }}%</strong>
          </span>
        </div>

        <!-- Funnel Steps Visualizer -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          <div
            *ngFor="let stage of funnel(); let idx = index"
            class="p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 relative group"
            [ngClass]="idx === funnel().length - 1 ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50/50 border-slate-200/80 hover:bg-white hover:shadow-xs'"
          >
            <div>
              <div class="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span>Stage {{ idx + 1 }}</span>
                <span *ngIf="idx > 0" class="text-blue-600">{{ stage.conversionFromPrevious }}% conv</span>
              </div>
              <h4 class="text-xs font-extrabold text-slate-800 leading-tight">{{ stage.name }}</h4>
              <div class="text-xl font-black text-slate-900 mt-2">{{ stage.count }}</div>
            </div>

            <div class="space-y-1 pt-2 border-t border-slate-200/60">
              <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  [ngClass]="idx === funnel().length - 1 ? 'bg-emerald-500' : 'bg-indigo-600'"
                  [style.width]="stage.percentageOfTotal + '%'"
                ></div>
              </div>
              <div class="text-[10px] text-slate-400 text-right">{{ stage.percentageOfTotal }}% of Total</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- SECTION 4: REQUIRES ATTENTION & ACTIONABLE ALERTS -->
      <!-- ========================================================================= -->
      <div *ngIf="alerts().length > 0" class="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200/80 shadow-xs space-y-5">
        <div class="flex items-center justify-between pb-2 border-b border-rose-100">
          <div class="flex items-center gap-2.5">
            <span class="p-1.5 rounded-xl bg-rose-100 text-rose-700">
              <app-icon name="alert-triangle" [size]="18"></app-icon>
            </span>
            <div>
              <h3 class="text-base font-bold text-slate-900">Requires Attention (Real-Time Diagnostic Flags)</h3>
              <p class="text-xs text-slate-500">Immediate action items detected dynamically from live application and student records.</p>
            </div>
          </div>
          <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            {{ alerts().length }} Action Flags
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            *ngFor="let alert of alerts()"
            class="p-4 rounded-2xl border transition-all space-y-2 flex flex-col justify-between"
            [ngClass]="alert.severity === 'high' ? 'bg-rose-50/50 border-rose-200' : 'bg-amber-50/50 border-amber-200'"
          >
            <div>
              <div class="flex items-center justify-between">
                <span
                  class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                  [ngClass]="alert.severity === 'high' ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'"
                >
                  {{ alert.count }} Detected
                </span>
                <span class="text-xs font-black" [ngClass]="alert.severity === 'high' ? 'text-rose-700' : 'text-amber-700'">
                  {{ alert.severity | uppercase }}
                </span>
              </div>
              <h4 class="text-xs font-bold text-slate-900 mt-2">{{ alert.title }}</h4>
              <p class="text-[11px] text-slate-600 mt-1 leading-relaxed">{{ alert.description }}</p>

              <!-- Sample list -->
              <div class="mt-2.5 space-y-1">
                <div *ngFor="let item of alert.items" class="text-[10px] font-medium text-slate-700 flex items-center justify-between py-1 border-t border-slate-200/50">
                  <span class="font-bold truncate max-w-[120px]">{{ item.label }}</span>
                  <span class="text-slate-500 truncate max-w-[100px]">{{ item.subtext }}</span>
                </div>
              </div>
            </div>

            <div class="pt-2">
              <a
                *ngIf="alert.items[0]?.link"
                [routerLink]="alert.items[0].link"
                class="text-xs font-bold hover:underline flex items-center gap-1"
                [ngClass]="alert.severity === 'high' ? 'text-rose-700' : 'text-amber-700'"
              >
                <span>Take Action</span>
                <app-icon name="chevron-right" [size]="12"></app-icon>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- SECTION 5: COMPANY PLACEMENT OVERVIEW & JOB-WISE ANALYTICS -->
      <!-- ========================================================================= -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Company Placement Overview -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-900">Company Placement Overview</h3>
              <p class="text-xs text-slate-500">Corporate participation, job volumes, and selection rates</p>
            </div>
            <a routerLink="/admin/companies" class="text-xs font-bold text-blue-600 hover:underline">
              Manage Partners →
            </a>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px] tracking-wider bg-slate-50/50">
                  <th class="py-2.5 px-3">Company</th>
                  <th class="py-2.5 px-2 text-center">Open Jobs</th>
                  <th class="py-2.5 px-2 text-center">Apps</th>
                  <th class="py-2.5 px-2 text-center">Shortlisted</th>
                  <th class="py-2.5 px-2 text-center">Placed</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let comp of companyOverview().slice(0, 6)" class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-3">
                    <div class="flex items-center gap-2">
                      <img
                        *ngIf="comp.companyLogo"
                        [src]="comp.companyLogo"
                        [alt]="comp.companyName"
                        (error)="onLogoError($event, comp.companyName)"
                        class="w-6 h-6 rounded-md object-cover border border-slate-200 shrink-0"
                      />
                      <span class="font-bold text-slate-900 truncate max-w-[140px]">{{ comp.companyName }}</span>
                    </div>
                  </td>
                  <td class="py-3 px-2 text-center font-semibold text-slate-700">{{ comp.openJobs }}</td>
                  <td class="py-3 px-2 text-center font-bold text-blue-700">{{ comp.totalApplications }}</td>
                  <td class="py-3 px-2 text-center font-semibold text-purple-700">{{ comp.shortlisted }}</td>
                  <td class="py-3 px-2 text-center font-black text-emerald-700">{{ comp.placed }}</td>
                </tr>
                <tr *ngIf="companyOverview().length === 0">
                  <td colspan="5" class="py-6 text-center text-slate-400 italic">No companies registered yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Job-Wise Analytics with Phase 1 Skill Matching -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-900">Active Job Drives & Skill Match Rates</h3>
              <p class="text-xs text-slate-500">Live applicant metrics and Phase 1 candidate skill match averages</p>
            </div>
            <a routerLink="/admin/jobs" class="text-xs font-bold text-blue-600 hover:underline">
              View All Drives →
            </a>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px] tracking-wider bg-slate-50/50">
                  <th class="py-2.5 px-3">Drive Role & Partner</th>
                  <th class="py-2.5 px-2 text-center">Applicants</th>
                  <th class="py-2.5 px-2 text-center">Avg Skill Match</th>
                  <th class="py-2.5 px-2 text-center">Selected</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let job of jobAnalytics().slice(0, 6)" class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-3">
                    <div class="font-bold text-slate-900 truncate max-w-[160px]">{{ job.jobTitle }}</div>
                    <div class="text-[11px] text-slate-400 font-medium">{{ job.companyName }}</div>
                  </td>
                  <td class="py-3 px-2 text-center font-bold text-blue-700">{{ job.totalApplications }}</td>
                  <td class="py-3 px-2 text-center">
                    <div class="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                      {{ job.skillMatchAverage }}%
                    </div>
                  </td>
                  <td class="py-3 px-2 text-center font-black text-emerald-700">{{ job.selected }}</td>
                </tr>
                <tr *ngIf="jobAnalytics().length === 0">
                  <td colspan="4" class="py-6 text-center text-slate-400 italic">No active drives posted.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- SECTION 6: SEARCHABLE & FILTERABLE STUDENT PLACEMENT STATUS TABLE -->
      <!-- ========================================================================= -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-bold text-slate-900 tracking-tight">Student Placement Status Directory</h3>
              <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {{ studentRows().length }} Filtered Candidates
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Comprehensive roster tracking individual student applications, preparation challenges, skill match rates, and placement outcomes.
            </p>
          </div>
          <a routerLink="/admin/students" class="text-xs font-bold text-blue-600 hover:underline self-start sm:self-auto">
            Manage Full Roster →
          </a>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px] tracking-wider bg-slate-50/50">
                <th class="py-3 px-4">Student Details</th>
                <th class="py-3 px-3">Department & Batch</th>
                <th class="py-3 px-2 text-center">CGPA</th>
                <th class="py-3 px-2 text-center">Applications</th>
                <th class="py-3 px-2 text-center">Shortlisted</th>
                <th class="py-3 px-2 text-center">Tasks Completed</th>
                <th class="py-3 px-2 text-center">Avg Skill Match</th>
                <th class="py-3 px-3 text-center">Placement Status</th>
                <th class="py-3 px-3 text-right">Flags</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let s of studentRows()" class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-2.5">
                    <img
                      [src]="s.studentAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'"
                      [alt]="s.studentName"
                      (error)="onAvatarError($event, s.studentName)"
                      class="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h4 class="font-bold text-slate-900 text-xs">{{ s.studentName }}</h4>
                      <span class="text-[11px] text-slate-400 font-mono">{{ s.studentRoll }}</span>
                    </div>
                  </div>
                </td>

                <td class="py-3.5 px-3">
                  <div class="font-semibold text-slate-800 truncate max-w-[150px]">{{ s.department }}</div>
                  <div class="text-[11px] text-slate-400">Class of {{ s.graduationYear }}</div>
                </td>

                <td class="py-3.5 px-2 text-center font-extrabold text-blue-700">{{ s.cgpa.toFixed(2) }}</td>

                <td class="py-3.5 px-2 text-center font-bold text-slate-800">{{ s.applicationsCount }}</td>

                <td class="py-3.5 px-2 text-center font-bold text-purple-700">{{ s.shortlistedCount }}</td>

                <td class="py-3.5 px-2 text-center">
                  <span class="font-semibold text-slate-700">{{ s.tasksCompleted }}/{{ s.tasksTotal || 4 }}</span>
                </td>

                <td class="py-3.5 px-2 text-center">
                  <span
                    class="px-2 py-0.5 rounded-md font-bold text-[10px]"
                    [ngClass]="s.skillMatchAverage >= 75 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-blue-50 text-blue-800 border border-blue-200'"
                  >
                    {{ s.skillMatchAverage }}%
                  </span>
                </td>

                <td class="py-3.5 px-3 text-center">
                  <span
                    class="px-2.5 py-1 rounded-full text-[10px] font-extrabold"
                    [ngClass]="s.placementStatus === 'Selected' || s.placementStatus === 'Offer Accepted' ? 'bg-emerald-100 text-emerald-800' : s.placementStatus === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'"
                  >
                    {{ s.placementStatus }}
                  </span>
                  <span *ngIf="s.placedCompany" class="text-[10px] text-slate-400 block mt-0.5">@ {{ s.placedCompany }}</span>
                </td>

                <td class="py-3.5 px-3 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <span
                      class="px-2 py-0.5 rounded-md text-[10px] font-bold border"
                      [ngClass]="{
                        'bg-rose-50 text-rose-700 border-rose-200': s.riskLevel === 'HIGH',
                        'bg-amber-50 text-amber-700 border-amber-200': s.riskLevel === 'MEDIUM',
                        'bg-blue-50 text-blue-700 border-blue-200': s.riskLevel === 'LOW',
                        'bg-emerald-50 text-emerald-700 border-emerald-200': s.riskLevel === 'NONE'
                      }"
                      [title]="s.attentionReasons.join('; ')"
                    >
                      {{ s.riskLevel === 'NONE' ? '✓ On Track' : (s.riskLevel + ' RISK') }}
                    </span>

                    <button
                      *ngIf="s.requiresAttention"
                      type="button"
                      (click)="triggerIntervention(s)"
                      class="px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[10px] transition-colors cursor-pointer"
                      title="Dispatch real remedial task & priority notification"
                    >
                      ⚡ Intervene
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="studentRows().length === 0">
                <td colspan="9" class="py-8 text-center text-slate-400 italic">No candidates match the specified filters.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- SECTION 7: TASK COMPLETION, SKILL GAP, AND DEPARTMENT-WISE ANALYTICS -->
      <!-- ========================================================================= -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- 1. Task Completion Analytics -->
        <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 class="text-base font-bold text-slate-900">Task Completion Health</h3>
          <p class="text-xs text-slate-500">Student execution of company preparation tasks</p>

          <div class="space-y-3">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-slate-700">Overall Completion Rate</span>
              <span class="font-black text-emerald-700 text-sm">{{ taskCompletionPct() }}%</span>
            </div>
            <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" [style.width]="taskCompletionPct() + '%'"></div>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-2 text-center text-xs">
              <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-slate-400 font-semibold block text-[10px]">Completed</span>
                <strong class="text-emerald-700 text-base font-black">{{ completedTasks() }}</strong>
              </div>
              <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span class="text-slate-400 font-semibold block text-[10px]">Pending</span>
                <strong class="text-amber-700 text-base font-black">{{ pendingTasks() }}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Skill Gap Intelligence (Phase 1 Integration) -->
        <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 class="text-base font-bold text-slate-900">Skill Gap Diagnostics</h3>
          <p class="text-xs text-slate-500">Phase 1 real-data demand vs student deficits</p>

          <div class="space-y-3">
            <div>
              <span class="text-[10px] font-bold uppercase text-emerald-800 tracking-wider block mb-1">Most Demanded Skills:</span>
              <div class="flex flex-wrap gap-1">
                <span *ngFor="let sk of skillAnalytics().mostDemandedSkills.slice(0, 4)" class="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                  {{ sk.skill }} ({{ sk.jobCount }})
                </span>
              </div>
            </div>

            <div class="pt-2 border-t border-slate-100">
              <span class="text-[10px] font-bold uppercase text-rose-800 tracking-wider block mb-1">Common Student Skill Gaps:</span>
              <div class="flex flex-wrap gap-1">
                <span *ngFor="let sk of skillAnalytics().mostCommonSkillGaps.slice(0, 4)" class="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold">
                  {{ sk.skill }} ({{ sk.missingInApplicationsCount }})
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Department Placement Breakdown -->
        <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 class="text-base font-bold text-slate-900">Department Placement Rates</h3>
          <p class="text-xs text-slate-500">Selection velocity by engineering discipline</p>

          <div class="space-y-2.5">
            <div *ngFor="let dept of departmentAnalytics().slice(0, 3)" class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-800 truncate max-w-[140px]">{{ dept.department }}</span>
                <span class="font-extrabold text-blue-700">{{ dept.placedCount }}/{{ dept.totalStudents }} ({{ dept.placementRate }}%)</span>
              </div>
              <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-blue-600 rounded-full" [style.width]="dept.placementRate + '%'"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- At-Risk Remedial Intervention Modal -->
      <div *ngIf="selectedStudentForIntervention" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" [ngClass]="selectedStudentForIntervention.riskLevel === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'">
                {{ selectedStudentForIntervention.riskLevel }} RISK INTERVENTION
              </span>
              <h3 class="text-base sm:text-lg font-bold text-slate-900 mt-1">
                Dispatch Remedial Action
              </h3>
            </div>
            <button (click)="selectedStudentForIntervention = null" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <!-- Student Profile Summary -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-900">{{ selectedStudentForIntervention.studentName }}</span>
              <span class="font-mono text-slate-500">{{ selectedStudentForIntervention.studentRoll }}</span>
            </div>
            <p class="text-[11px] text-slate-500">
              {{ selectedStudentForIntervention.department }} • Class of {{ selectedStudentForIntervention.graduationYear }} • CGPA: {{ selectedStudentForIntervention.cgpa.toFixed(2) }}
            </p>
            <div class="pt-2 border-t border-slate-200/60">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Risk Factors Detected:</span>
              <ul class="list-disc list-inside text-[11px] text-rose-700 font-medium space-y-0.5 mt-1">
                <li *ngFor="let reason of selectedStudentForIntervention.attentionReasons">{{ reason }}</li>
              </ul>
            </div>
          </div>

          <!-- Select Intervention Strategy -->
          <div class="space-y-2 text-xs">
            <label class="block font-bold text-slate-800">Select Targeted Remedial Action</label>
            <div class="space-y-2">
              <label 
                *ngFor="let action of selectedStudentForIntervention.recommendedInterventions"
                class="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                [ngClass]="selectedInterventionType === action ? 'border-indigo-600 bg-indigo-50/50' : ''"
              >
                <input 
                  type="radio" 
                  name="interventionOption" 
                  [value]="action" 
                  [(ngModel)]="selectedInterventionType" 
                  class="text-indigo-600"
                />
                <span class="font-semibold text-slate-800">{{ action }}</span>
              </label>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button 
              type="button" 
              (click)="selectedStudentForIntervention = null" 
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button 
              type="button" 
              (click)="confirmInterventionDispatch()" 
              [disabled]="isDispatchingIntervention"
              class="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <app-icon name="send" [size]="14"></app-icon>
              <span>{{ isDispatchingIntervention ? 'Dispatching...' : 'Dispatch Intervention' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PlacementCommandCenterComponent {
  commandService = inject(CommandCenterService);
  studentService = inject(StudentService);
  jobService = inject(JobService);
  applicationService = inject(ApplicationService);
  companyService = inject(CompanyService);
  taskService = inject(TaskService);
  skillMatchingService = inject(SkillMatchingService);
  calendarService = inject(CalendarService);
  orgService = inject(OrganizationService);

  searchQuery = '';
  selectedDept = 'all';
  selectedPlacementStatus = 'all';

  selectedStudentForIntervention: any = null;
  selectedInterventionType = '';
  isDispatchingIntervention = false;

  summary = this.commandService.summaryMetrics;
  funnel = this.commandService.placementFunnel;
  companyOverview = this.commandService.companyPlacementOverview;
  jobAnalytics = this.commandService.jobWiseAnalytics;
  studentRows = this.commandService.studentPlacementRows;
  alerts = this.commandService.attentionAlerts;
  departmentAnalytics = this.commandService.departmentAnalytics;

  skillAnalytics = computed(() => this.skillMatchingService.getAdminSkillAnalytics());

  totalTasks = computed(() => this.taskService.tasks().length);
  completedTasks = computed(() => this.taskService.tasks().filter(t => t.status === 'Completed').length);
  pendingTasks = computed(() => this.taskService.tasks().filter(t => t.status === 'Pending' || t.status === 'In Progress').length);
  taskCompletionPct = computed(() => {
    const total = this.totalTasks();
    return total > 0 ? Math.round((this.completedTasks() / total) * 100) : 80;
  });

  onSearchChange() {
    this.commandService.setFilter({ searchQuery: this.searchQuery });
  }

  onDeptChange() {
    this.commandService.setFilter({ department: this.selectedDept });
  }

  onStatusChange() {
    this.commandService.setFilter({ placementStatus: this.selectedPlacementStatus });
  }

  resetAllFilters() {
    this.searchQuery = '';
    this.selectedDept = 'all';
    this.selectedPlacementStatus = 'all';
    this.commandService.resetFilters();
  }

  triggerIntervention(student: any) {
    this.selectedStudentForIntervention = student;
    this.selectedInterventionType = (student.recommendedInterventions && student.recommendedInterventions[0]) || 'Upload Verified ATS Resume';
  }

  async confirmInterventionDispatch() {
    if (!this.selectedStudentForIntervention) return;
    this.isDispatchingIntervention = true;
    try {
      await this.commandService.assignIntervention(
        this.selectedStudentForIntervention.studentId,
        this.selectedInterventionType
      );
      this.selectedStudentForIntervention = null;
    } finally {
      this.isDispatchingIntervention = false;
    }
  }

  onAvatarError(event: Event, name?: string) {
    const target = event.target as HTMLImageElement;
    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Student')}&background=2563eb&color=fff&bold=true`;
  }

  onLogoError(event: Event, companyName?: string) {
    const target = event.target as HTMLImageElement;
    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName || 'Company')}&background=475569&color=fff&bold=true`;
  }
}
