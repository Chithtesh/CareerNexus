import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { JobService } from '../../../core/services/job.service';
import { ApplicationService } from '../../../core/services/application.service';
import { StudentService } from '../../../core/services/student.service';
import { BookmarkService } from '../../../core/services/bookmark.service';
import { SkillMatchingService } from '../../../core/services/skill-matching.service';
import { IconComponent } from '../../../shared/icons/icon.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IconComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Placement Drives & Openings</h1>
          <p class="text-sm text-slate-500 mt-1">
            Explore active recruitment drives verified by the university placement department.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
            {{ filteredJobs().length }} Opportunities Available
          </span>
        </div>
      </div>

      <!-- Search & Filters Bar -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div class="flex flex-col md:flex-row gap-3">
          <!-- Search input -->
          <div class="relative flex-1">
            <app-icon name="search" [size]="18" customClass="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search by job title, company name, skills (e.g. Google, C++, Azure)..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <!-- Location Filter -->
          <div class="w-full md:w-48">
            <select
              [ngModel]="selectedLocation()"
              (ngModelChange)="selectedLocation.set($event)"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Locations</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Noida">Noida</option>
              <option value="Remote">Remote</option>
              <option value="Pan India">Pan India</option>
            </select>
          </div>

          <!-- Eligible Only Toggle -->
          <label class="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors select-none">
            <input
              type="checkbox"
              [ngModel]="onlyEligible()"
              (ngModelChange)="onlyEligible.set($event)"
              class="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Eligible for me (CGPA ≥ {{ studentService.currentStudent().cgpa }})</span>
          </label>

          <!-- AI Recommended Only Toggle -->
          <label class="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-700 cursor-pointer hover:bg-purple-100 transition-colors select-none">
            <input
              type="checkbox"
              [ngModel]="onlyRecommended()"
              (ngModelChange)="onlyRecommended.set($event)"
              class="rounded text-purple-600 focus:ring-purple-500"
            />
            <span>✨ AI Recommended (Match ≥ 60%)</span>
          </label>
        </div>

        <!-- Domain category pills -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            *ngFor="let domain of domains"
            type="button"
            (click)="selectedDomain.set(domain)"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
            [ngClass]="{
              'bg-blue-600 text-white shadow-xs': selectedDomain() === domain,
              'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900': selectedDomain() !== domain
            }"
          >
            {{ domain }}
          </button>
        </div>
      </div>

      <!-- Job Cards Grid -->
      <div *ngIf="filteredJobs().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          *ngFor="let job of filteredJobs()"
          class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-blue-200 transition-all duration-200 flex flex-col justify-between group"
        >
          <div>
            <!-- Card Header: Company Logo & Bookmark -->
            <div class="flex items-start justify-between gap-3 mb-4">
              <div class="flex items-center gap-3 min-w-0">
                <img
                  [src]="job.companyLogo"
                  [alt]="job.companyName"
                  (error)="onLogoError($event, job.companyName)"
                  class="w-12 h-12 rounded-2xl object-cover border border-slate-100 shadow-xs shrink-0"
                />
                <div class="min-w-0">
                  <h3 class="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {{ job.title }}
                  </h3>
                  <p class="text-xs font-semibold text-slate-500">{{ job.companyName }}</p>
                </div>
              </div>

              <button
                type="button"
                (click)="bookmarkService.toggleBookmark('job', job.id, job.title)"
                class="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                [title]="bookmarkService.isBookmarked('job', job.id) ? 'Remove bookmark' : 'Bookmark job'"
              >
                <app-icon
                  name="bookmark"
                  [size]="18"
                  [customClass]="bookmarkService.isBookmarked('job', job.id) ? 'fill-blue-600 text-blue-600' : ''"
                ></app-icon>
              </button>
            </div>

            <!-- Salary & Domain Badges -->
            <div class="flex flex-wrap gap-2 mb-4">
              <span class="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                {{ job.salary }}
              </span>
              <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {{ job.domain }}
              </span>
              <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                <app-icon name="map-pin" [size]="12"></app-icon>
                {{ job.location }}
              </span>
            </div>

            <!-- Skills chips -->
            <div class="flex flex-wrap gap-1.5 mb-3">
              <span
                *ngFor="let skill of job.requiredSkills.slice(0, 3)"
                class="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/50"
              >
                {{ skill }}
              </span>
              <span *ngIf="job.requiredSkills.length > 3" class="text-[11px] text-slate-400 px-1 py-0.5">
                +{{ job.requiredSkills.length - 3 }} more
              </span>
            </div>

            <!-- AI Recommendation Insight Box -->
            @let rec = recommendationsMap().get(job.id);
            <div *ngIf="rec" class="mb-4 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold flex items-center gap-1.5" [ngClass]="rec.matchScore >= 75 ? 'text-emerald-700' : rec.matchScore >= 50 ? 'text-blue-700' : 'text-slate-600'">
                  <span class="w-2 h-2 rounded-full" [ngClass]="rec.matchScore >= 75 ? 'bg-emerald-500' : rec.matchScore >= 50 ? 'bg-blue-500' : 'bg-slate-400'"></span>
                  Skill Match: {{ rec.matchScore }}%
                </span>
                <span *ngIf="rec.matchScore >= 70 && rec.isEligible" class="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-100 text-purple-800">
                  TOP RECOMMENDATION
                </span>
              </div>
              <p class="text-[11px] text-slate-600 leading-snug line-clamp-2">
                {{ rec.recommendationRationale }}
              </p>
            </div>
          </div>

          <!-- Bottom Actions & Eligibility Status -->
          <div class="pt-4 border-t border-slate-100 space-y-3">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-500">Min CGPA: <strong>{{ job.minimumCgpa }}</strong></span>
              
              <!-- Eligibility status badge -->
              <span
                *ngIf="studentService.currentStudent().cgpa >= job.minimumCgpa"
                class="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]"
              >
                <app-icon name="check-circle" [size]="12"></app-icon>
                Eligible
              </span>
              <span
                *ngIf="studentService.currentStudent().cgpa < job.minimumCgpa"
                class="text-amber-600 font-semibold text-[11px]"
              >
                CGPA Criteria Unmet
              </span>
            </div>

            <div class="flex items-center gap-2">
              <a
                [routerLink]="['/student/jobs', job.id]"
                class="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs text-center transition-colors"
              >
                View Details
              </a>

              <!-- Apply or Applied button -->
              <button
                *ngIf="!applicationService.hasApplied(job.id, studentService.currentStudent().id)"
                type="button"
                (click)="apply(job.id)"
                [disabled]="studentService.currentStudent().cgpa < job.minimumCgpa"
                class="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-xs text-center shadow-xs transition-colors"
              >
                Apply Now
              </button>

              <button
                *ngIf="applicationService.hasApplied(job.id, studentService.currentStudent().id)"
                type="button"
                disabled
                class="flex-1 py-2 px-3 rounded-xl bg-emerald-100 text-emerald-800 font-semibold text-xs text-center cursor-default flex items-center justify-center gap-1"
              >
                <app-icon name="check" [size]="14"></app-icon>
                Applied
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state when search filters yield no results -->
      <app-empty-state
        *ngIf="filteredJobs().length === 0"
        title="No Placement Drives Found"
        description="We couldn't find any job openings matching your current search criteria and filters. Try adjusting your search query or domain category."
        actionLabel="Reset All Filters"
        (action)="resetFilters()"
      ></app-empty-state>
    </div>
  `
})
export class JobListComponent {
  jobService = inject(JobService);
  applicationService = inject(ApplicationService);
  studentService = inject(StudentService);
  bookmarkService = inject(BookmarkService);
  skillMatchingService = inject(SkillMatchingService);

  searchQuery = signal('');
  selectedDomain = signal('All');
  selectedLocation = signal('all');
  onlyEligible = signal(false);
  onlyRecommended = signal(false);

  readonly domains = [
    'All',
    'Software Development',
    'Cloud Computing',
    'AI / Machine Learning',
    'Full Stack',
    'Frontend Development',
    'Backend Development',
    'FinTech',
    'Cybersecurity'
  ];

  recommendationsMap = computed(() => {
    const student = this.studentService.currentStudent();
    const recs = this.skillMatchingService.getJobRecommendations(student);
    const map = new Map<string, typeof recs[0]>();
    for (const r of recs) {
      map.set(r.job.id, r);
    }
    return map;
  });

  filteredJobs = computed(() => {
    let list = this.jobService.jobs();
    const q = this.searchQuery().toLowerCase().trim();
    const dom = this.selectedDomain();
    const loc = this.selectedLocation();
    const eligible = this.onlyEligible();
    const recommendedOnly = this.onlyRecommended();
    const studentCgpa = this.studentService.currentStudent().cgpa;
    const recMap = this.recommendationsMap();

    if (q) {
      list = list.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.companyName.toLowerCase().includes(q) ||
        j.requiredSkills.some(s => s.toLowerCase().includes(q)) ||
        j.domain.toLowerCase().includes(q)
      );
    }

    if (dom !== 'All') {
      list = list.filter(j => j.domain.toLowerCase() === dom.toLowerCase());
    }

    if (loc !== 'all') {
      list = list.filter(j => j.location.toLowerCase().includes(loc.toLowerCase()));
    }

    if (eligible) {
      list = list.filter(j => studentCgpa >= j.minimumCgpa);
    }

    if (recommendedOnly) {
      list = list.filter(j => {
        const rec = recMap.get(j.id);
        return rec && rec.matchScore >= 60 && rec.isEligible;
      });
    }

    // Sort by recommendation rank so top matched opportunities lead
    return list.slice().sort((a, b) => {
      const recA = recMap.get(a.id)?.priorityRank || 0;
      const recB = recMap.get(b.id)?.priorityRank || 0;
      return recB - recA;
    });
  });

  apply(jobId: string) {
    this.applicationService.applyToJob(jobId);
  }

  resetFilters() {
    this.searchQuery.set('');
    this.selectedDomain.set('All');
    this.selectedLocation.set('all');
    this.onlyEligible.set(false);
    this.onlyRecommended.set(false);
  }

  onLogoError(event: Event, companyName?: string) {
    const target = event.target as HTMLImageElement;
    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName || 'Company')}&background=2563eb&color=fff&bold=true`;
  }
}
