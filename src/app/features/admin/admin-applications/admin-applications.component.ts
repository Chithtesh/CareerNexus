import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApplicationService } from '../../../core/services/application.service';
import { Application, ApplicationStatus } from '../../../core/models/application.model';
import { IconComponent } from '../../../shared/icons/icon.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';

@Component({
  selector: 'app-admin-applications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    BadgeComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Applicant Pipeline Command</h1>
          <p class="text-sm text-slate-500 mt-1">
            Review candidate applications and advance recruitment stages (Aptitude, Technical, HR, Selection).
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
            {{ filteredApplications().length }} Total Candidates Tracked
          </span>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Search input -->
          <div class="relative flex-1">
            <app-icon name="search" [size]="18" customClass="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search candidate name, roll number (23CS101), company (Google), or role..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <!-- Status Filter -->
          <div class="w-full sm:w-56">
            <select
              [ngModel]="selectedStatus()"
              (ngModelChange)="selectedStatus.set($event)"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Stages</option>
              <option value="Applied">Applied</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Aptitude">Aptitude Cleared</option>
              <option value="Technical Interview">Technical Interview</option>
              <option value="HR Interview">HR Interview</option>
              <option value="Selected">Selected / Placed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <button
            *ngIf="searchQuery() || selectedStatus() !== 'all'"
            type="button"
            (click)="resetFilters()"
            class="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shrink-0"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <!-- Applications Table -->
      <div *ngIf="filteredApplications().length > 0" class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th class="py-3.5 px-4 sm:px-6">Candidate</th>
                <th class="py-3.5 px-4 sm:px-6">Company & Role</th>
                <th class="py-3.5 px-4 sm:px-6">Academic Score</th>
                <th class="py-3.5 px-4 sm:px-6">Current Stage</th>
                <th class="py-3.5 px-4 sm:px-6 text-right">Advance Stage</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let app of filteredApplications()" class="hover:bg-slate-50/50 transition-colors">
                <!-- Candidate details -->
                <td class="py-4 px-4 sm:px-6">
                  <div class="flex items-center gap-3">
                    <img
                      [src]="app.studentAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'"
                      class="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h4 class="text-xs font-bold text-slate-900">{{ app.studentName }}</h4>
                      <p class="text-[11px] text-slate-500">{{ app.studentRoll }} • {{ app.studentDepartment }}</p>
                    </div>
                  </div>
                </td>

                <!-- Company & Role -->
                <td class="py-4 px-4 sm:px-6">
                  <div class="flex items-center gap-2">
                    <img [src]="app.companyLogo" class="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0" />
                    <div>
                      <h5 class="text-xs font-bold text-slate-800">{{ app.jobTitle }}</h5>
                      <span class="text-[11px] text-slate-500 font-medium">{{ app.companyName }} ({{ app.salary }})</span>
                    </div>
                  </div>
                </td>

                <!-- CGPA -->
                <td class="py-4 px-4 sm:px-6">
                  <span class="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {{ app.studentCgpa }} CGPA
                  </span>
                </td>

                <!-- Current Status -->
                <td class="py-4 px-4 sm:px-6">
                  <app-badge
                    [variant]="
                      app.status === 'Selected' ? 'success' :
                      app.status === 'Rejected' ? 'error' :
                      app.status === 'Applied' ? 'neutral' : 'primary'
                    "
                    [dot]="true"
                  >
                    {{ app.status }}
                  </app-badge>
                  <span class="block text-[10px] text-slate-400 mt-1 truncate max-w-xs">{{ app.notes }}</span>
                </td>

                <!-- Advance Action -->
                <td class="py-4 px-4 sm:px-6 text-right">
                  <button
                    type="button"
                    (click)="openAdvanceModal(app)"
                    class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    Update Round
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="filteredApplications().length === 0"
        title="No Candidate Applications Found"
        description="No applications match your current query or stage filter."
        actionLabel="Reset Search"
        (action)="resetFilters()"
      ></app-empty-state>
    </div>

    <!-- Advance Stage Modal -->
    <div
      *ngIf="selectedAppForAdvance()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
    >
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-base font-bold text-slate-900">Advance Candidate Stage</h3>
            <p class="text-xs text-slate-500">{{ selectedAppForAdvance()?.studentName }} — {{ selectedAppForAdvance()?.companyName }}</p>
          </div>
          <button (click)="selectedAppForAdvance.set(null)" class="p-1 text-slate-400 hover:text-slate-600">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700">New Recruitment Stage</label>
            <select
              [(ngModel)]="nextStage"
              class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm bg-white font-medium"
            >
              <option value="Shortlisted">Shortlisted</option>
              <option value="Aptitude">Aptitude Round Cleared</option>
              <option value="Technical Interview">Technical Interview</option>
              <option value="HR Interview">HR Interview</option>
              <option value="Selected">Selected / Final Offer Released 🎉</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700">Officer Remarks / Round Instructions</label>
            <textarea
              [(ngModel)]="stageNotes"
              rows="3"
              placeholder="e.g. Cleared Technical Round 1 with 100% score on Graph Algorithms. Round 2 scheduled via Meet."
              class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm"
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700">Interview Meet / Room Link (Optional)</label>
            <input
              type="text"
              [(ngModel)]="stageLink"
              placeholder="https://meet.google.com/..."
              class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm"
            />
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button (click)="selectedAppForAdvance.set(null)" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button (click)="confirmAdvance()" class="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
            Confirm & Notify Student
          </button>
        </div>
      </div>
    </div>
  `
})
export class AdminApplicationsComponent {
  applicationService = inject(ApplicationService);

  searchQuery = signal('');
  selectedStatus = signal('all');

  selectedAppForAdvance = signal<Application | null>(null);
  nextStage: ApplicationStatus = 'Technical Interview';
  stageNotes = '';
  stageLink = '';

  filteredApplications = computed(() => {
    let list = this.applicationService.applications();
    const q = this.searchQuery().toLowerCase().trim();
    const st = this.selectedStatus();

    if (q) {
      list = list.filter(a =>
        a.studentName.toLowerCase().includes(q) ||
        a.studentRoll.toLowerCase().includes(q) ||
        a.companyName.toLowerCase().includes(q) ||
        a.jobTitle.toLowerCase().includes(q)
      );
    }

    if (st !== 'all') {
      list = list.filter(a => a.status.toLowerCase() === st.toLowerCase());
    }

    return list;
  });

  openAdvanceModal(app: Application) {
    this.selectedAppForAdvance.set(app);
    this.nextStage = app.status;
    this.stageNotes = '';
    this.stageLink = '';
  }

  confirmAdvance() {
    const app = this.selectedAppForAdvance();
    if (app) {
      this.applicationService.updateApplicationStatus(app.id, this.nextStage, this.stageNotes, this.stageLink);
      this.selectedAppForAdvance.set(null);
    }
  }

  resetFilters() {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
  }
}
