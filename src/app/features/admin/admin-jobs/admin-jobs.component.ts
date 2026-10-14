import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobService } from '../../../core/services/job.service';
import { CompanyService } from '../../../core/services/company.service';
import { PlacementDriveService } from '../../../core/services/placement-drive.service';
import { StudentService } from '../../../core/services/student.service';
import { Job } from '../../../core/models/job.model';
import { 
  PlacementDrive, 
  DriveRound, 
  InterviewSlot, 
  DriveOffer, 
  DriveStatus 
} from '../../../core/models/placement-drive.model';
import { IconComponent } from '../../../shared/icons/icon.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';

@Component({
  selector: 'app-admin-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, BadgeComponent],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Placement Drives & Opportunities</h1>
          <p class="text-sm text-slate-500 mt-1">
            End-to-end recruitment lifecycle: manage campus placement drives, multi-round evaluations, interview slots, and verified openings.
          </p>
        </div>

        <div class="flex items-center gap-2 self-start sm:self-auto">
          <button
            *ngIf="activeSubTab() === 'drives'"
            type="button"
            (click)="showCreateDriveModal.set(true)"
            class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <app-icon name="plus" [size]="16"></app-icon>
            + Create Campus Drive
          </button>

          <button
            *ngIf="activeSubTab() === 'postings'"
            type="button"
            (click)="showAddJobModal.set(true)"
            class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <app-icon name="plus" [size]="16"></app-icon>
            + Post Direct Opening
          </button>
        </div>
      </div>

      <!-- Navigation Tabs (Drives Lifecycle vs Direct Postings) -->
      <div class="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <button
          type="button"
          (click)="activeSubTab.set('drives')"
          class="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all"
          [ngClass]="activeSubTab() === 'drives' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <app-icon name="briefcase" [size]="16"></app-icon>
          <span>Campus Placement Drives (Lifecycle)</span>
          <span class="px-2 py-0.5 rounded-full text-xs" [ngClass]="activeSubTab() === 'drives' ? 'bg-blue-500/30 text-white' : 'bg-slate-200 text-slate-700'">
            {{ driveService.drives().length }}
          </span>
        </button>

        <button
          type="button"
          (click)="activeSubTab.set('postings')"
          class="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all"
          [ngClass]="activeSubTab() === 'postings' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <app-icon name="file-text" [size]="16"></app-icon>
          <span>Direct Job Postings</span>
          <span class="px-2 py-0.5 rounded-full text-xs" [ngClass]="activeSubTab() === 'postings' ? 'bg-indigo-500/30 text-white' : 'bg-slate-200 text-slate-700'">
            {{ jobService.jobs().length }}
          </span>
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 1: CAMPUS PLACEMENT DRIVES LIFECYCLE -->
      <!-- ========================================================================= -->
      <div *ngIf="activeSubTab() === 'drives'" class="space-y-6">
        <!-- Quick Metrics Overview -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Campus Drives</span>
            <span class="text-2xl font-black text-slate-900 mt-1 block">{{ driveService.drives().length }}</span>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span class="text-[11px] font-bold uppercase tracking-wider text-blue-600 block">In Progress / Active</span>
            <span class="text-2xl font-black text-blue-700 mt-1 block">
              {{ countDrivesByStatus('In Progress') + countDrivesByStatus('Applications Open') }}
            </span>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span class="text-[11px] font-bold uppercase tracking-wider text-purple-600 block">Scheduled Slots</span>
            <span class="text-2xl font-black text-purple-700 mt-1 block">{{ driveService.slots().length }}</span>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">Offers Released</span>
            <span class="text-2xl font-black text-emerald-700 mt-1 block">{{ driveService.offers().length }}</span>
          </div>
        </div>

        <!-- Search & Filter Controls -->
        <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <app-icon name="search" [size]="18" customClass="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
              <input
                type="text"
                [ngModel]="driveSearchQuery()"
                (ngModelChange)="driveSearchQuery.set($event)"
                placeholder="Search drives by company, role title, skills, or venue..."
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div class="w-full sm:w-56">
              <select
                [ngModel]="driveStatusFilter()"
                (ngModelChange)="driveStatusFilter.set($event)"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Drive Stages</option>
                <option value="Applications Open">Applications Open</option>
                <option value="Screening">Candidate Screening</option>
                <option value="In Progress">Evaluation In Progress</option>
                <option value="Completed">Drive Completed</option>
              </select>
            </div>

            <button
              *ngIf="driveSearchQuery() || driveStatusFilter() !== 'all'"
              type="button"
              (click)="resetDriveFilters()"
              class="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shrink-0"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <!-- Placement Drives List -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            *ngFor="let drive of filteredDrives()"
            class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-blue-200 transition-all flex flex-col justify-between"
          >
            <div>
              <!-- Header: Company & Stage Badge -->
              <div class="flex items-start justify-between gap-3 mb-4">
                <div class="flex items-center gap-3 min-w-0">
                  <img [src]="drive.companyLogo" class="w-12 h-12 rounded-2xl object-cover border border-slate-100 shadow-xs shrink-0" />
                  <div class="min-w-0">
                    <h3 class="text-base font-bold text-slate-900 line-clamp-1">{{ drive.title }}</h3>
                    <p class="text-xs font-semibold text-slate-500">{{ drive.companyName }} • {{ drive.roleDesignation }}</p>
                  </div>
                </div>

                <app-badge [variant]="getDriveStatusBadgeVariant(drive.status)" [dot]="true">
                  {{ drive.status }}
                </app-badge>
              </div>

              <!-- Package & Mode Badges -->
              <div class="flex flex-wrap gap-2 mb-3">
                <span class="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  {{ drive.salaryCtc }}
                </span>
                <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {{ drive.mode }}
                </span>
                <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                  Min CGPA: {{ drive.minimumCgpa }}
                </span>
              </div>

              <!-- Round Progression Indicator -->
              <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 mb-4">
                <div class="flex items-center justify-between text-xs font-bold">
                  <span class="text-slate-700">Round Progress</span>
                  <span class="text-blue-600">Round {{ drive.currentRoundNumber }} of {{ drive.totalRounds }}</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    [style.width.%]="(drive.currentRoundNumber / drive.totalRounds) * 100"
                  ></div>
                </div>
                <p class="text-[11px] text-slate-500 line-clamp-1">
                  Venue: {{ drive.venue }}
                </p>
              </div>

              <!-- Required Skills -->
              <div class="flex flex-wrap gap-1.5 mb-4">
                <span
                  *ngFor="let skill of drive.requiredSkills.slice(0, 3)"
                  class="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/50"
                >
                  {{ skill }}
                </span>
                <span *ngIf="drive.requiredSkills.length > 3" class="text-[11px] text-slate-400 px-1 py-0.5">
                  +{{ drive.requiredSkills.length - 3 }} more
                </span>
              </div>
            </div>

            <!-- Footer Action -->
            <div class="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <span class="text-xs text-slate-500 font-medium">
                {{ drive.applicantCount || 0 }} Applicants
              </span>
              <button
                type="button"
                (click)="openDriveDrillDown(drive)"
                class="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <app-icon name="layers" [size]="14"></app-icon>
                <span>Manage Rounds & Slots</span>
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="filteredDrives().length === 0" class="text-center py-12 bg-white rounded-3xl border border-slate-200">
          <p class="text-slate-500 text-sm">No campus placement drives match your search criteria.</p>
          <button
            *ngIf="driveSearchQuery() || driveStatusFilter() !== 'all'"
            type="button"
            (click)="resetDriveFilters()"
            class="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 2: DIRECT JOB POSTINGS -->
      <!-- ========================================================================= -->
      <div *ngIf="activeSubTab() === 'postings'" class="space-y-6">
        <!-- Search & Filters -->
        <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <app-icon name="search" [size]="18" customClass="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
              <input
                type="text"
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                placeholder="Search openings by role, company, or domain..."
                class="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div class="w-full sm:w-48">
              <select
                [ngModel]="selectedStatus()"
                (ngModelChange)="selectedStatus.set($event)"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active Openings</option>
                <option value="Closed">Closed Openings</option>
              </select>
            </div>

            <button
              *ngIf="searchQuery() || selectedStatus() !== 'all'"
              type="button"
              (click)="resetJobFilters()"
              class="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shrink-0"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <!-- Drives Table -->
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th class="py-3.5 px-6">Opening Details</th>
                  <th class="py-3.5 px-6">Domain & Package</th>
                  <th class="py-3.5 px-6">Min CGPA</th>
                  <th class="py-3.5 px-6">Applicants</th>
                  <th class="py-3.5 px-6">Status</th>
                  <th class="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let job of filteredJobs()" class="hover:bg-slate-50/50 transition-colors">
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-3">
                      <img [src]="job.companyLogo" class="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                      <div>
                        <h4 class="text-xs font-bold text-slate-900">{{ job.title }}</h4>
                        <p class="text-[11px] text-slate-500">{{ job.companyName }} • {{ job.location }}</p>
                      </div>
                    </div>
                  </td>

                  <td class="py-4 px-6">
                    <span class="font-bold text-emerald-700 block">{{ job.salary }}</span>
                    <span class="text-[11px] text-slate-500">{{ job.domain }}</span>
                  </td>

                  <td class="py-4 px-6 font-semibold text-slate-800">{{ job.minimumCgpa }}</td>

                  <td class="py-4 px-6">
                    <span class="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {{ job.applicantsCount }} Candidates
                    </span>
                  </td>

                  <td class="py-4 px-6">
                    <app-badge [variant]="job.status === 'Active' ? 'success' : 'neutral'" [dot]="true">
                      {{ job.status }}
                    </app-badge>
                  </td>

                  <td class="py-4 px-6 text-right">
                    <button
                      *ngIf="job.status === 'Active'"
                      type="button"
                      (click)="jobService.closeJob(job.id)"
                      class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-[11px] transition-colors"
                    >
                      Close Drive
                    </button>
                    <span *ngIf="job.status !== 'Active'" class="text-[11px] text-slate-400">Closed</span>
                  </td>
                </tr>

                <tr *ngIf="filteredJobs().length === 0">
                  <td colspan="6" class="py-12 text-center text-slate-500">
                    <p class="text-sm font-semibold text-slate-700">No job openings match your search criteria</p>
                    <p class="text-xs text-slate-400 mt-1">Try modifying your search keywords or opening status filter.</p>
                    <button
                      *ngIf="searchQuery() || selectedStatus() !== 'all'"
                      type="button"
                      (click)="resetJobFilters()"
                      class="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL: CREATE NEW CAMPUS PLACEMENT DRIVE -->
    <!-- ========================================================================= -->
    <div
      *ngIf="showCreateDriveModal()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
    >
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-lg font-bold text-slate-900">Create Campus Placement Drive</h3>
          <button (click)="showCreateDriveModal.set(false)" class="p-1 text-slate-400 hover:text-slate-600">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700">Drive Title</label>
            <input [(ngModel)]="newDriveTitle" placeholder="e.g. Google Campus Placement Drive 2026" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700">Company</label>
              <select [(ngModel)]="newDriveCompanyId" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm bg-white">
                <option *ngFor="let c of companyService.companies()" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700">Role Designation</label>
              <input [(ngModel)]="newDriveRole" placeholder="e.g. SDE 1" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700">CTC Package</label>
              <input [(ngModel)]="newDriveSalary" placeholder="e.g. ₹28 - ₹36 LPA" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700">Min CGPA</label>
              <input type="number" step="0.1" [(ngModel)]="newDriveMinCgpa" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700">Mode</label>
              <select [(ngModel)]="newDriveMode" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm bg-white">
                <option value="Online">Online / Virtual</option>
                <option value="On-Campus">On-Campus In-Person</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700">Total Rounds</label>
              <input type="number" [(ngModel)]="newDriveTotalRounds" min="1" max="6" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700">Venue / Platform Link</label>
            <input [(ngModel)]="newDriveVenue" placeholder="e.g. Campus Tech Auditorium / Google Meet" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
          </div>

          <div>
            <label class="block font-semibold text-slate-700">Required Skills (Comma separated)</label>
            <input [(ngModel)]="newDriveSkills" placeholder="e.g. Java, Data Structures, Algorithms, SQL" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
          </div>

          <div>
            <label class="block font-semibold text-slate-700">Description</label>
            <textarea [(ngModel)]="newDriveDescription" rows="2" placeholder="Drive objectives, eligibility overview, and workflow..." class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm"></textarea>
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button (click)="showCreateDriveModal.set(false)" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button (click)="saveNewDrive()" class="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
            Create Drive
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL: DRIVE MANAGEMENT & MULTI-ROUND DRILL DOWN -->
    <!-- ========================================================================= -->
    <div
      *ngIf="selectedDrive()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
    >
      <div class="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <!-- Modal Header -->
        <div class="flex items-start justify-between pb-4 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <img [src]="selectedDrive()!.companyLogo" class="w-12 h-12 rounded-2xl object-cover border border-slate-200" />
            <div>
              <h3 class="text-lg font-bold text-slate-900">{{ selectedDrive()!.title }}</h3>
              <p class="text-xs text-slate-500 font-semibold">{{ selectedDrive()!.companyName }} • {{ selectedDrive()!.salaryCtc }} • {{ selectedDrive()!.mode }}</p>
            </div>
          </div>
          <button (click)="selectedDrive.set(null)" class="p-1 text-slate-400 hover:text-slate-600">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <!-- Drive Overview Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span class="text-slate-400 block font-semibold">Min CGPA</span>
            <span class="text-sm font-bold text-slate-800">{{ selectedDrive()!.minimumCgpa }}</span>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span class="text-slate-400 block font-semibold">Max Backlogs</span>
            <span class="text-sm font-bold text-slate-800">{{ selectedDrive()!.maxBacklogs }}</span>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span class="text-slate-400 block font-semibold">Current Round</span>
            <span class="text-sm font-bold text-blue-700">Round {{ selectedDrive()!.currentRoundNumber }} of {{ selectedDrive()!.totalRounds }}</span>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span class="text-slate-400 block font-semibold">Drive Status</span>
            <span class="text-sm font-bold text-emerald-700">{{ selectedDrive()!.status }}</span>
          </div>
        </div>

        <!-- Section 1: Evaluation Rounds -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <app-icon name="layers" [size]="16" customClass="text-blue-600"></app-icon>
              <span>Configured Evaluation Rounds</span>
            </h4>
            <button
              type="button"
              (click)="showAddRoundModal.set(true)"
              class="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs flex items-center gap-1"
            >
              + Add Round
            </button>
          </div>

          <div class="space-y-2">
            <div
              *ngFor="let rnd of driveService.getRoundsForDrive(selectedDrive()!.id)"
              class="p-3.5 rounded-2xl border border-slate-200/80 bg-white flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <span class="font-bold text-slate-900 block">{{ rnd.roundName }}</span>
                <span class="text-slate-500 text-[11px]">{{ rnd.roundType }} • {{ rnd.durationMinutes }} mins • {{ rnd.venueOrLink }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="px-2 py-0.5 rounded-md font-bold text-[10px]"
                  [ngClass]="rnd.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : rnd.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'"
                >
                  {{ rnd.status }}
                </span>
                <button
                  *ngIf="rnd.status !== 'Completed'"
                  type="button"
                  (click)="markRoundCompleted(rnd)"
                  class="px-2 py-1 rounded bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-semibold text-[10px]"
                >
                  Mark Done
                </button>
              </div>
            </div>
            <p *ngIf="driveService.getRoundsForDrive(selectedDrive()!.id).length === 0" class="text-xs text-slate-400 italic">
              No specific rounds registered for this drive yet.
            </p>
          </div>
        </div>

        <!-- Section 2: Interview Slots -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <app-icon name="calendar" [size]="16" customClass="text-purple-600"></app-icon>
              <span>Interview Slots Scheduled</span>
            </h4>
            <button
              type="button"
              (click)="showScheduleSlotModal.set(true)"
              class="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-xs flex items-center gap-1"
            >
              + Schedule Slot
            </button>
          </div>

          <div class="space-y-2">
            <div
              *ngFor="let slot of driveService.getSlotsForDrive(selectedDrive()!.id)"
              class="p-3.5 rounded-2xl border border-slate-200/80 bg-white flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <span class="font-bold text-slate-900 block">{{ slot.studentName }} ({{ slot.studentRoll }})</span>
                <span class="text-slate-500 text-[11px]">{{ slot.slotDate }} • {{ slot.startTime }} - {{ slot.endTime }} • {{ slot.interviewerName }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded-md font-bold text-[10px] bg-purple-100 text-purple-800">
                  {{ slot.status }}
                </span>
                <a *ngIf="slot.meetingLink" [href]="slot.meetingLink" target="_blank" class="text-blue-600 hover:underline font-bold text-[11px]">
                  Join
                </a>
              </div>
            </div>
            <p *ngIf="driveService.getSlotsForDrive(selectedDrive()!.id).length === 0" class="text-xs text-slate-400 italic">
              No interview slots scheduled for this drive yet.
            </p>
          </div>
        </div>

        <!-- Section 3: Released Placement Offers -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <app-icon name="award" [size]="16" customClass="text-emerald-600"></app-icon>
              <span>Released Placement Offers</span>
            </h4>
            <button
              type="button"
              (click)="showReleaseOfferModal.set(true)"
              class="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs flex items-center gap-1"
            >
              + Release Offer
            </button>
          </div>

          <div class="space-y-2">
            <div
              *ngFor="let off of driveService.getOffersForDrive(selectedDrive()!.id)"
              class="p-3.5 rounded-2xl border border-slate-200/80 bg-white flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <span class="font-bold text-slate-900 block">{{ off.studentName }}</span>
                <span class="text-emerald-700 font-bold text-[11px]">{{ off.ctcPackage }} • {{ off.roleDesignation }}</span>
              </div>
              <span class="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800">
                {{ off.status }}
              </span>
            </div>
            <p *ngIf="driveService.getOffersForDrive(selectedDrive()!.id).length === 0" class="text-xs text-slate-400 italic">
              No placement offers released for this drive yet.
            </p>
          </div>
        </div>

        <div class="pt-4 flex justify-end border-t border-slate-100">
          <button (click)="selectedDrive.set(null)" class="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs">
            Close Panel
          </button>
        </div>
      </div>
    </div>

    <!-- SUB-MODAL: ADD ROUND -->
    <div *ngIf="showAddRoundModal()" class="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-3 text-xs">
        <h4 class="font-bold text-slate-900 text-sm">Add Evaluation Round</h4>
        <div>
          <label class="block font-semibold text-slate-700">Round Name</label>
          <input [(ngModel)]="newRoundName" placeholder="e.g. Round 3: System Design & Tech Interview" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
        </div>
        <div>
          <label class="block font-semibold text-slate-700">Round Type</label>
          <select [(ngModel)]="newRoundType" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white">
            <option value="Coding Assessment">Coding Assessment</option>
            <option value="Technical Interview">Technical Interview</option>
            <option value="HR Interview">HR Interview</option>
            <option value="Group Discussion">Group Discussion</option>
          </select>
        </div>
        <div>
          <label class="block font-semibold text-slate-700">Duration (Minutes)</label>
          <input type="number" [(ngModel)]="newRoundDuration" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
        </div>
        <div>
          <label class="block font-semibold text-slate-700">Venue / Meeting URL</label>
          <input [(ngModel)]="newRoundVenue" placeholder="https://meet.google.com/..." class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
        </div>
        <div class="pt-3 flex justify-end gap-2 border-t border-slate-100">
          <button (click)="showAddRoundModal.set(false)" class="px-3 py-1.5 rounded-xl text-slate-600">Cancel</button>
          <button (click)="confirmAddRound()" class="px-4 py-1.5 rounded-xl bg-blue-600 text-white font-semibold">Save Round</button>
        </div>
      </div>
    </div>

    <!-- SUB-MODAL: SCHEDULE INTERVIEW SLOT -->
    <div *ngIf="showScheduleSlotModal()" class="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-3 text-xs">
        <h4 class="font-bold text-slate-900 text-sm">Schedule Candidate Interview Slot</h4>
        <div>
          <label class="block font-semibold text-slate-700">Select Student</label>
          <select [(ngModel)]="newSlotStudentId" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white">
            <option *ngFor="let s of studentService.students()" [value]="s.id">{{ s.fullName }} ({{ s.rollNumber }})</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-semibold text-slate-700">Slot Date</label>
            <input type="date" [(ngModel)]="newSlotDate" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
          </div>
          <div>
            <label class="block font-semibold text-slate-700">Start Time</label>
            <input type="text" [(ngModel)]="newSlotStartTime" placeholder="10:30 AM" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
          </div>
        </div>
        <div>
          <label class="block font-semibold text-slate-700">Interviewer Name</label>
          <input [(ngModel)]="newSlotInterviewer" placeholder="e.g. Lead Engineer, Hiring Team" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
        </div>
        <div>
          <label class="block font-semibold text-slate-700">Meeting Link</label>
          <input [(ngModel)]="newSlotLink" placeholder="https://meet.google.com/..." class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
        </div>
        <div class="pt-3 flex justify-end gap-2 border-t border-slate-100">
          <button (click)="showScheduleSlotModal.set(false)" class="px-3 py-1.5 rounded-xl text-slate-600">Cancel</button>
          <button (click)="confirmScheduleSlot()" class="px-4 py-1.5 rounded-xl bg-purple-600 text-white font-semibold">Confirm Slot</button>
        </div>
      </div>
    </div>

    <!-- SUB-MODAL: RELEASE OFFER -->
    <div *ngIf="showReleaseOfferModal()" class="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-3 text-xs">
        <h4 class="font-bold text-slate-900 text-sm">Release Placement Offer</h4>
        <div>
          <label class="block font-semibold text-slate-700">Select Selected Candidate</label>
          <select [(ngModel)]="newOfferStudentId" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white">
            <option *ngFor="let s of studentService.students()" [value]="s.id">{{ s.fullName }} ({{ s.rollNumber }})</option>
          </select>
        </div>
        <div>
          <label class="block font-semibold text-slate-700">Salary / CTC Package</label>
          <input [(ngModel)]="newOfferCtc" placeholder="e.g. ₹32 LPA" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
        </div>
        <div>
          <label class="block font-semibold text-slate-700">Designation</label>
          <input [(ngModel)]="newOfferDesignation" placeholder="e.g. Software Development Engineer I" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
        </div>
        <div class="pt-3 flex justify-end gap-2 border-t border-slate-100">
          <button (click)="showReleaseOfferModal.set(false)" class="px-3 py-1.5 rounded-xl text-slate-600">Cancel</button>
          <button (click)="confirmReleaseOffer()" class="px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold">Issue Offer</button>
        </div>
      </div>
    </div>

    <!-- POST DIRECT OPENING MODAL -->
    <div
      *ngIf="showAddJobModal()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
    >
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-lg font-bold text-slate-900">Post Direct Job Opening</h3>
          <button (click)="showAddJobModal.set(false)" class="p-1 text-slate-400 hover:text-slate-600">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700">Role Title</label>
              <input [(ngModel)]="newTitle" placeholder="e.g. SDE 1 - Core Backend" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700">Company</label>
              <select [(ngModel)]="newCompanyId" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm bg-white">
                <option *ngFor="let c of companyService.companies()" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700">Salary / CTC Package</label>
              <input [(ngModel)]="newSalary" placeholder="e.g. ₹24 - ₹30 LPA" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700">Domain Category</label>
              <select [(ngModel)]="newDomain" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm bg-white">
                <option value="Software Development">Software Development</option>
                <option value="Cloud Computing">Cloud Computing</option>
                <option value="AI / Machine Learning">AI / Machine Learning</option>
                <option value="Full Stack">Full Stack</option>
                <option value="FinTech">FinTech</option>
                <option value="Cybersecurity">Cybersecurity</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700">Minimum CGPA</label>
              <input type="number" step="0.1" [(ngModel)]="newMinCgpa" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700">Location</label>
              <input [(ngModel)]="newLocation" placeholder="Bengaluru / Hyderabad" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700">Required Skills (Comma separated)</label>
            <input [(ngModel)]="newSkills" placeholder="e.g. Java, Spring Boot, MySQL, Docker" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700">Role Description</label>
            <textarea [(ngModel)]="newDescription" rows="3" placeholder="Job responsibilities and opening overview..." class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm"></textarea>
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button (click)="showAddJobModal.set(false)" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button (click)="saveNewJob()" class="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
            Publish Job Opening
          </button>
        </div>
      </div>
    </div>
  `
})
export class AdminJobsComponent {
  jobService = inject(JobService);
  companyService = inject(CompanyService);
  driveService = inject(PlacementDriveService);
  studentService = inject(StudentService);

  activeSubTab = signal<'drives' | 'postings'>('drives');

  // Drives filter & state
  driveSearchQuery = signal('');
  driveStatusFilter = signal('all');
  selectedDrive = signal<PlacementDrive | null>(null);

  showCreateDriveModal = signal(false);
  showAddRoundModal = signal(false);
  showScheduleSlotModal = signal(false);
  showReleaseOfferModal = signal(false);

  // New Drive form state
  newDriveTitle = '';
  newDriveCompanyId = 'c-01';
  newDriveRole = 'Software Development Engineer I';
  newDriveSalary = '₹28 - ₹38 LPA';
  newDriveMinCgpa = 7.5;
  newDriveMode: 'Online' | 'On-Campus' | 'Hybrid' = 'Hybrid';
  newDriveTotalRounds = 4;
  newDriveVenue = 'Campus Innovation Hub / Google Meet Assessment';
  newDriveSkills = 'Java, Algorithms, System Design, SQL';
  newDriveDescription = 'Annual flagship recruitment drive for prospective computer science and technology cohorts.';

  // Sub-modal state
  newRoundName = 'Round 3: System Design';
  newRoundType: DriveRound['roundType'] = 'Technical Interview';
  newRoundDuration = 45;
  newRoundVenue = 'https://meet.google.com/nexus-rnd';

  newSlotStudentId = 'std-101';
  newSlotDate = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
  newSlotStartTime = '11:00 AM';
  newSlotInterviewer = 'Campus Technical Interviewer';
  newSlotLink = 'https://meet.google.com/nexus-interview';

  newOfferStudentId = 'std-101';
  newOfferCtc = '₹32 LPA';
  newOfferDesignation = 'Associate Software Engineer';

  // Direct Job Postings state
  searchQuery = signal('');
  selectedStatus = signal('all');
  showAddJobModal = signal(false);

  newTitle = '';
  newCompanyId = 'c-01';
  newSalary = '₹24 - ₹30 LPA';
  newDomain = 'Software Development';
  newMinCgpa = 7.0;
  newLocation = 'Bengaluru';
  newSkills = 'Java, Data Structures, Algorithms, SQL';
  newDescription = 'Exciting opportunity for high-caliber engineers to build planet-scale applications.';

  filteredDrives = computed(() => {
    let list = this.driveService.drives();
    const q = this.driveSearchQuery().toLowerCase().trim();
    const st = this.driveStatusFilter();

    if (st !== 'all') {
      list = list.filter(d => d.status.toLowerCase() === st.toLowerCase());
    }

    if (q) {
      list = list.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.companyName.toLowerCase().includes(q) ||
        d.roleDesignation.toLowerCase().includes(q) ||
        d.requiredSkills.some(s => s.toLowerCase().includes(q)) ||
        d.venue.toLowerCase().includes(q)
      );
    }

    return list;
  });

  filteredJobs = computed(() => {
    let list = this.jobService.jobs();
    const q = this.searchQuery().toLowerCase().trim();
    const st = this.selectedStatus();

    if (q) {
      list = list.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.companyName.toLowerCase().includes(q) ||
        j.domain.toLowerCase().includes(q)
      );
    }

    if (st !== 'all') {
      list = list.filter(j => j.status.toLowerCase() === st.toLowerCase());
    }

    return list;
  });

  resetDriveFilters() {
    this.driveSearchQuery.set('');
    this.driveStatusFilter.set('all');
  }

  resetJobFilters() {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
  }

  countDrivesByStatus(status: DriveStatus): number {
    return this.driveService.drives().filter(d => d.status === status).length;
  }

  getDriveStatusBadgeVariant(status: DriveStatus): 'success' | 'warning' | 'primary' | 'neutral' {
    switch (status) {
      case 'Applications Open': return 'primary';
      case 'In Progress': return 'warning';
      case 'Completed': return 'success';
      default: return 'neutral';
    }
  }

  openDriveDrillDown(drive: PlacementDrive) {
    this.selectedDrive.set(drive);
  }

  async saveNewDrive() {
    if (!this.newDriveTitle.trim()) return;
    const comp = this.companyService.getCompanyById(this.newDriveCompanyId) || this.companyService.companies()[0];
    const skills = this.newDriveSkills.split(',').map(s => s.trim()).filter(Boolean);

    await this.driveService.createDrive({
      companyId: comp.id,
      companyName: comp.name,
      companyLogo: comp.logo,
      title: this.newDriveTitle,
      roleDesignation: this.newDriveRole,
      description: this.newDriveDescription,
      eligibleDepartments: ['Computer Science & Engineering', 'Information Technology'],
      minimumCgpa: this.newDriveMinCgpa,
      maxBacklogs: 0,
      requiredSkills: skills.length > 0 ? skills : ['Java', 'SQL'],
      applicationDeadline: new Date(Date.now() + 10 * 86400000).toISOString(),
      driveDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      mode: this.newDriveMode,
      venue: this.newDriveVenue,
      salaryCtc: this.newDriveSalary,
      status: 'Applications Open',
      currentRoundNumber: 1,
      totalRounds: this.newDriveTotalRounds
    });

    this.newDriveTitle = '';
    this.showCreateDriveModal.set(false);
  }

  async confirmAddRound() {
    const drive = this.selectedDrive();
    if (!drive) return;
    const currentRounds = this.driveService.getRoundsForDrive(drive.id);

    await this.driveService.addRound({
      driveId: drive.id,
      roundOrder: currentRounds.length + 1,
      roundName: this.newRoundName,
      roundType: this.newRoundType,
      scheduledAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      durationMinutes: this.newRoundDuration,
      description: 'Progressive evaluation round',
      venueOrLink: this.newRoundVenue,
      status: 'Pending'
    });

    this.showAddRoundModal.set(false);
  }

  async markRoundCompleted(rnd: DriveRound) {
    await this.driveService.updateRoundStatus(rnd.id, 'Completed');
  }

  async confirmScheduleSlot() {
    const drive = this.selectedDrive();
    if (!drive) return;
    const student = this.studentService.students().find(s => s.id === this.newSlotStudentId) || this.studentService.students()[0];
    const rounds = this.driveService.getRoundsForDrive(drive.id);
    const activeRound = rounds[0];

    await this.driveService.scheduleSlot({
      driveId: drive.id,
      roundId: activeRound ? activeRound.id : 'rnd-1',
      studentId: student.id,
      studentName: student.fullName,
      studentRoll: student.rollNumber,
      interviewerName: this.newSlotInterviewer,
      interviewerEmail: 'interviewer@campusrecruitment.org',
      slotDate: this.newSlotDate,
      startTime: this.newSlotStartTime,
      endTime: '45 mins',
      meetingLink: this.newSlotLink,
      venue: drive.venue,
      status: 'Scheduled',
      feedback: ''
    });

    this.showScheduleSlotModal.set(false);
  }

  async confirmReleaseOffer() {
    const drive = this.selectedDrive();
    if (!drive) return;
    const student = this.studentService.students().find(s => s.id === this.newOfferStudentId) || this.studentService.students()[0];

    await this.driveService.releaseOffer({
      driveId: drive.id,
      studentId: student.id,
      studentName: student.fullName,
      studentEmail: student.email,
      companyName: drive.companyName,
      roleDesignation: this.newOfferDesignation,
      ctcPackage: this.newOfferCtc,
      status: 'Offered'
    });

    this.showReleaseOfferModal.set(false);
  }

  saveNewJob() {
    if (!this.newTitle.trim()) return;
    const comp = this.companyService.getCompanyById(this.newCompanyId) || this.companyService.companies()[0];
    const skills = this.newSkills.split(',').map(s => s.trim()).filter(Boolean);

    this.jobService.addJob({
      companyId: comp.id,
      companyName: comp.name,
      companyLogo: comp.logo,
      companyLocation: comp.location,
      title: this.newTitle,
      description: this.newDescription,
      domain: this.newDomain,
      location: this.newLocation,
      employmentType: 'Full Time',
      salary: this.newSalary,
      eligibility: `B.Tech all branches with min ${this.newMinCgpa} CGPA`,
      minimumCgpa: this.newMinCgpa,
      requiredSkills: skills.length > 0 ? skills : ['Java', 'SQL'],
      applicationDeadline: new Date(Date.now() + 14 * 86400000).toISOString(),
      status: 'Active',
      vacancies: 6
    });

    this.newTitle = '';
    this.showAddJobModal.set(false);
  }
}
