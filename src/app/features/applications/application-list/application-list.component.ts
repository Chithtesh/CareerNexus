import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApplicationService } from '../../../core/services/application.service';
import { ApplicationStatus } from '../../../core/models/application.model';
import { IconComponent } from '../../../shared/icons/icon.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { StatusTimelineComponent } from '../../../shared/ui/status-timeline.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconComponent,
    BadgeComponent,
    StatusTimelineComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Placement Applications</h1>
          <p class="text-sm text-slate-500 mt-1">
            Track interview rounds, screening outcomes, and selection progress in real-time.
          </p>
        </div>

        <a
          routerLink="/student/jobs"
          class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <app-icon name="plus" [size]="16"></app-icon>
          Explore More Drives
        </a>
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs custom-scrollbar">
        <button
          *ngFor="let tab of filterTabs"
          type="button"
          (click)="selectedStatusFilter.set(tab)"
          class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
          [ngClass]="{
            'bg-blue-600 text-white shadow-xs': selectedStatusFilter() === tab,
            'text-slate-600 hover:bg-slate-100': selectedStatusFilter() !== tab
          }"
        >
          {{ tab }}
        </button>
      </div>

      <!-- Application Cards Stream -->
      <div *ngIf="filteredApplications().length > 0" class="space-y-6">
        <div
          *ngFor="let app of filteredApplications()"
          class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-6"
        >
          <!-- Top Row: Role, Company, Package, Status -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <img
                [src]="app.companyLogo"
                [alt]="app.companyName"
                class="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
              />
              <div>
                <h3 class="text-base sm:text-lg font-bold text-slate-900">{{ app.jobTitle }}</h3>
                <p class="text-xs sm:text-sm text-slate-500 font-medium">
                  {{ app.companyName }} • CTC: <strong class="text-emerald-700 font-bold">{{ app.salary }}</strong>
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 self-start sm:self-auto">
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
              <span class="text-xs text-slate-400">Applied {{ app.appliedAt | date:'mediumDate' }}</span>
            </div>
          </div>

          <!-- Multi-step Visual Pipeline -->
          <div class="p-4 sm:p-6 rounded-2xl bg-slate-50/70 border border-slate-100">
            <app-status-timeline
              [currentStatus]="app.status"
              [timeline]="app.timeline"
            ></app-status-timeline>
          </div>

          <!-- Recruiter Remarks & Next Steps -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div class="text-slate-600">
              <span class="font-semibold text-slate-800">Latest Update: </span>
              {{ app.notes }}
            </div>

            <a
              [routerLink]="['/student/jobs', app.jobId]"
              class="font-semibold text-blue-600 hover:underline shrink-0"
            >
              View Job Description →
            </a>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="filteredApplications().length === 0"
        title="No Applications Found"
        description="You have not submitted any placement applications matching this status filter yet. Check the job board for exciting career opportunities."
        actionLabel="Browse Placement Drives"
        actionIcon="briefcase"
        (action)="goToJobs()"
      ></app-empty-state>
    </div>
  `
})
export class ApplicationListComponent {
  applicationService = inject(ApplicationService);
  private router = inject(Router);

  readonly filterTabs = ['All', 'In Progress', 'Technical Interview', 'Shortlisted', 'Applied', 'Selected', 'Rejected'];
  selectedStatusFilter = signal<string>('All');

  filteredApplications = computed(() => {
    const list = this.applicationService.studentApplications();
    const filter = this.selectedStatusFilter();

    if (filter === 'All') return list;
    if (filter === 'In Progress') {
      return list.filter(a => a.status !== 'Selected' && a.status !== 'Rejected' && a.status !== 'Applied');
    }
    return list.filter(a => a.status.toLowerCase() === filter.toLowerCase());
  });

  goToJobs() {
    this.router.navigate(['/student/jobs']);
  }
}
