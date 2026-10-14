import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { JobService } from '../../../core/services/job.service';
import { ApplicationService } from '../../../core/services/application.service';
import { StudentService } from '../../../core/services/student.service';
import { BookmarkService } from '../../../core/services/bookmark.service';
import { Job } from '../../../core/models/job.model';
import { IconComponent } from '../../../shared/icons/icon.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, BadgeComponent],
  template: `
    <div *ngIf="job()" class="space-y-8 animate-in fade-in duration-300">
      <!-- Back Link -->
      <a routerLink="/student/jobs" class="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
        <app-icon name="arrow-left" [size]="14"></app-icon>
        Back to Placement Drives
      </a>

      <!-- Header Card -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex flex-col sm:flex-row sm:items-center gap-5">
            <img
              [src]="job()!.companyLogo"
              [alt]="job()!.companyName"
              (error)="onLogoError($event, job()!.companyName)"
              class="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
            />
            <div>
              <div class="flex flex-wrap items-center gap-2 mb-2">
                <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{{ job()!.title }}</h1>
                <app-badge variant="primary">{{ job()!.employmentType }}</app-badge>
              </div>
              <p class="text-sm font-semibold text-slate-600 flex items-center gap-2">
                {{ job()!.companyName }}
                <span>•</span>
                <span class="flex items-center gap-1 text-slate-500">
                  <app-icon name="map-pin" [size]="14"></app-icon>
                  {{ job()!.location }}
                </span>
              </p>
            </div>
          </div>

          <!-- CTA Controls -->
          <div class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              (click)="bookmarkService.toggleBookmark('job', job()!.id, job()!.title)"
              class="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              [title]="bookmarkService.isBookmarked('job', job()!.id) ? 'Remove bookmark' : 'Bookmark job'"
            >
              <app-icon
                name="bookmark"
                [size]="20"
                [customClass]="bookmarkService.isBookmarked('job', job()!.id) ? 'fill-blue-600 text-blue-600' : ''"
              ></app-icon>
            </button>

            <!-- Apply CTA -->
            <button
              *ngIf="!applicationService.hasApplied(job()!.id, studentService.currentStudent().id)"
              type="button"
              (click)="apply()"
              [disabled]="studentService.currentStudent().cgpa < job()!.minimumCgpa"
              class="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
            >
              Apply for Role
            </button>

            <button
              *ngIf="applicationService.hasApplied(job()!.id, studentService.currentStudent().id)"
              type="button"
              disabled
              class="px-6 py-3 rounded-2xl bg-emerald-100 text-emerald-800 font-semibold text-sm flex items-center gap-2 cursor-default"
            >
              <app-icon name="check" [size]="16"></app-icon>
              Application Submitted
            </button>
          </div>
        </div>

        <!-- Metric highlights pill bar -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Package / CTC</span>
            <span class="text-base font-bold text-emerald-700 mt-0.5 block">{{ job()!.salary }}</span>
          </div>

          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Domain</span>
            <span class="text-base font-bold text-slate-800 mt-0.5 block">{{ job()!.domain }}</span>
          </div>

          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Min CGPA</span>
            <span class="text-base font-bold text-slate-800 mt-0.5 block">{{ job()!.minimumCgpa }}</span>
          </div>

          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Applicants</span>
            <span class="text-base font-bold text-slate-800 mt-0.5 block">{{ job()!.applicantsCount }} applied</span>
          </div>
        </div>
      </div>

      <!-- Main Description & Eligibility Details -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left: Full Details (2 Cols) -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 class="text-lg font-bold text-slate-900 mb-2">Role Overview</h3>
              <p class="text-sm text-slate-600 leading-relaxed">{{ job()!.description }}</p>
            </div>

            <div *ngIf="job()!.responsibilities">
              <h3 class="text-lg font-bold text-slate-900 mb-2">Key Responsibilities</h3>
              <ul class="space-y-2">
                <li *ngFor="let item of job()!.responsibilities" class="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0"></span>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>

            <div *ngIf="job()!.requirements">
              <h3 class="text-lg font-bold text-slate-900 mb-2">Required Qualifications</h3>
              <ul class="space-y-2">
                <li *ngFor="let item of job()!.requirements" class="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600">
                  <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0"></span>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 class="text-lg font-bold text-slate-900 mb-3">Target Tech Stack & Skills</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  *ngFor="let skill of job()!.requiredSkills"
                  class="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
                >
                  {{ skill }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Eligibility Card & Deadlines (1 Col) -->
        <div class="space-y-6">
          <!-- Eligibility Match Card -->
          <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 class="text-base font-bold text-slate-900">Your Eligibility Check</h3>
            
            <div
              class="p-4 rounded-2xl flex items-start gap-3"
              [ngClass]="studentService.currentStudent().cgpa >= job()!.minimumCgpa ? 'bg-emerald-50 text-emerald-950 border border-emerald-200' : 'bg-amber-50 text-amber-950 border border-amber-200'"
            >
              <app-icon
                [name]="studentService.currentStudent().cgpa >= job()!.minimumCgpa ? 'check-circle' : 'alert-circle'"
                [size]="20"
                [customClass]="studentService.currentStudent().cgpa >= job()!.minimumCgpa ? 'text-emerald-600' : 'text-amber-600'"
              ></app-icon>
              <div>
                <h4 class="text-xs font-bold">
                  {{ studentService.currentStudent().cgpa >= job()!.minimumCgpa ? 'You Meet All Criteria!' : 'CGPA Below Threshold' }}
                </h4>
                <p class="text-xs mt-0.5 opacity-90 leading-relaxed">
                  Your CGPA: <strong>{{ studentService.currentStudent().cgpa }}</strong>. Cutoff required: <strong>{{ job()!.minimumCgpa }}</strong>.
                </p>
              </div>
            </div>

            <div class="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div class="flex justify-between py-1">
                <span>Eligible Branches:</span>
                <span class="font-semibold text-slate-900">CSE, IT, AI&DS, ECE</span>
              </div>
              <div class="flex justify-between py-1">
                <span>Active Backlogs:</span>
                <span class="font-semibold text-slate-900">0 Permitted</span>
              </div>
              <div class="flex justify-between py-1">
                <span>Graduation Year:</span>
                <span class="font-semibold text-slate-900">2027 (Final Year)</span>
              </div>
            </div>
          </div>

          <!-- Company Details Card -->
          <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <h3 class="text-base font-bold text-slate-900">About {{ job()!.companyName }}</h3>
            <p class="text-xs text-slate-600 leading-relaxed">
              Global tier-1 recruiter participating in campus placement drives. Provides exceptional engineering culture and mentorship.
            </p>
            <a
              [routerLink]="['/student/companies']"
              class="text-xs font-bold text-blue-600 hover:underline inline-block pt-1"
            >
              View Company Profile →
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class JobDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  jobService = inject(JobService);
  applicationService = inject(ApplicationService);
  studentService = inject(StudentService);
  bookmarkService = inject(BookmarkService);

  job = signal<Job | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const found = this.jobService.getJobById(id);
      if (found) this.job.set(found);
    }
  }

  apply() {
    const j = this.job();
    if (j) {
      this.applicationService.applyToJob(j.id);
    }
  }

  onLogoError(event: Event, companyName?: string) {
    const target = event.target as HTMLImageElement;
    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName || 'Company')}&background=2563eb&color=fff&bold=true`;
  }
}
