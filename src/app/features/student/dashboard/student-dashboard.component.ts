import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { StudentService } from '../../../core/services/student.service';
import { JobService } from '../../../core/services/job.service';
import { ApplicationService } from '../../../core/services/application.service';
import { TaskService } from '../../../core/services/task.service';
import { SkillMatchingService } from '../../../core/services/skill-matching.service';
import { AlumniService } from '../../../core/services/alumni.service';
import { ResourceService } from '../../../core/services/resource.service';
import { ChatService } from '../../../core/services/chat.service';
import { StudentTask } from '../../../core/models/task.model';
import { IconComponent } from '../../../shared/icons/icon.component';
import { StatCardComponent } from '../../../shared/ui/stat-card.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { StatusTimelineComponent } from '../../../shared/ui/status-timeline.component';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconComponent,
    StatCardComponent,
    BadgeComponent,
    StatusTimelineComponent
  ],
  template: `
    <div class="space-y-8 animate-in fade-in duration-300 pb-12">
      <!-- Top Greeting Banner -->
      <div class="bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/15 relative overflow-hidden">
        <div class="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-xs border border-white/20 mb-3">
              <app-icon name="sparkles" [size]="14"></app-icon>
              Campus Placement Season 2026–27
            </span>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good morning, {{ studentService.currentStudent().fullName }} 👋
            </h1>
            <p class="text-blue-100 text-sm sm:text-base mt-1.5 max-w-xl leading-relaxed">
              You have <strong class="text-white font-bold">{{ activeTasks().length }} active preparation tasks</strong> and {{ applicationService.studentApplications().length }} recruitment drives in progress.
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <a
              routerLink="/student/jobs"
              class="px-5 py-2.5 rounded-xl bg-white text-blue-700 font-semibold text-xs sm:text-sm hover:bg-blue-50 shadow-md shadow-black/10 transition-all duration-200 hover:scale-[1.02]"
            >
              Explore Drives
            </a>
            <a
              routerLink="/student/profile"
              class="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm border border-white/30 backdrop-blur-xs transition-all duration-200"
            >
              Placement Analysis
            </a>
          </div>
        </div>
      </div>

      <!-- 4 Key Metrics Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <app-stat-card
          title="Applications"
          [value]="applicationService.studentApplications().length"
          icon="briefcase"
          subtitle="Total drives submitted"
          color="blue"
        ></app-stat-card>

        <app-stat-card
          title="Shortlisted / Rounds"
          [value]="shortlistedCount()"
          icon="check-circle"
          [subtitle]="interviewsCount() + ' active interview calls'"
          color="purple"
        ></app-stat-card>

        <app-stat-card
          title="Prep Tasks Cleared"
          [value]="completedTasksCount() + ' / ' + allTasks().length"
          icon="award"
          [subtitle]="readiness().tierReadiness"
          color="emerald"
        ></app-stat-card>

        <app-stat-card
          title="Readiness Score"
          [value]="readiness().overallScore + ' / 100'"
          icon="sparkles"
          [subtitle]="readiness().averageScore + '% task assessment avg'"
          color="amber"
        ></app-stat-card>
      </div>

      <!-- Shortlisted Companies Spotlight & Live Application Tracker -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Placement Readiness & Profile Strength Card -->
        <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-slate-900 tracking-tight">Placement Readiness Gauge</h3>
              <span class="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                {{ readiness().overallScore }}/100
              </span>
            </div>

            <!-- Dynamic Readiness Progress bar -->
            <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                class="h-full bg-linear-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                [style.width]="readiness().overallScore + '%'"
              ></div>
            </div>

            <!-- Component-Level Breakdown Grid -->
            <div class="grid grid-cols-2 gap-2 my-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px]">
              <div>
                <span class="text-slate-500 block">Profile:</span>
                <span class="font-bold text-slate-800">{{ readiness().profileScore }}/25</span>
              </div>
              <div>
                <span class="text-slate-500 block">Skills:</span>
                <span class="font-bold text-slate-800">{{ readiness().skillScore }}/35</span>
              </div>
              <div>
                <span class="text-slate-500 block">Tasks:</span>
                <span class="font-bold text-slate-800">{{ readiness().taskScore }}/25</span>
              </div>
              <div>
                <span class="text-slate-500 block">Drive Activity:</span>
                <span class="font-bold text-slate-800">{{ readiness().driveScore }}/15</span>
              </div>
            </div>

            <p class="text-xs text-slate-600 leading-relaxed">
              {{ readiness().whyChangedExplanation }}
            </p>

            <!-- Action Recommendation -->
            <div *ngIf="readiness().actionItems.length > 0" class="mt-3 p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 text-[11px] text-blue-900 flex items-start gap-1.5">
              <app-icon name="info" [size]="14" customClass="text-blue-600 shrink-0 mt-0.5"></app-icon>
              <span><strong>Next Step:</strong> {{ readiness().actionItems[0] }}</span>
            </div>

            <!-- Skill Gap Notice -->
            <div *ngIf="skillGap().missingSkills.length > 0" class="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200">
              <span class="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                <app-icon name="alert-circle" [size]="13" customClass="text-amber-600"></app-icon>
                Skill Gap Alert ({{ skillGap().missingSkills.length }} missing)
              </span>
              <p class="text-[11px] text-amber-800 mt-1">
                Target drives require: <strong class="font-semibold">{{ skillGap().missingSkills.slice(0, 2).join(', ') }}</strong>
              </p>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-700">Roll: {{ studentService.currentStudent().rollNumber }}</span>
            <a routerLink="/student/profile" class="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View Full Analysis
              <app-icon name="chevron-right" [size]="14"></app-icon>
            </a>
          </div>
        </div>

        <!-- Live Active Application & Interview Timeline Tracker -->
        <div class="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-blue-600">Active Interview Pipeline</span>
                <h3 class="text-base font-bold text-slate-900 mt-0.5">
                  {{ activeApplication()?.companyName || 'Google' }} — {{ activeApplication()?.jobTitle || 'Software Development Engineer' }}
                </h3>
              </div>
              <app-badge variant="success" [dot]="true">
                {{ activeApplication()?.status || 'Technical Interview' }}
              </app-badge>
            </div>

            <!-- Stepper Timeline -->
            <div class="my-4">
              <app-status-timeline
                [currentStatus]="activeApplication()?.status || 'Technical Interview'"
                [timeline]="activeApplication()?.timeline || []"
              ></app-status-timeline>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span class="text-slate-500">Package: <strong class="text-slate-800 font-semibold">{{ activeApplication()?.salary || '₹36 - ₹45 LPA' }}</strong></span>
            <a routerLink="/student/applications" class="font-semibold text-blue-600 hover:underline">
              View All Applications →
            </a>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- COMPANY SKILL MATCHES DASHBOARD WIDGET -->
      <!-- ========================================================================= -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-bold text-slate-900 tracking-tight">Company Skill Matches</h3>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {{ companySkillMatches().companyMatches.length }} Applied Drives
              </span>
            </div>
            <p class="text-xs text-slate-500">
              Live percentage calculation comparing your profile skills against specific job requirements.
            </p>
          </div>
          <a routerLink="/student/profile" fragment="company-skill-match" class="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto">
            <span>View Full Breakdown</span>
            <app-icon name="chevron-right" [size]="14"></app-icon>
          </a>
        </div>

        <!-- If no applications -->
        <div *ngIf="!companySkillMatches().hasApplications" class="p-6 rounded-2xl bg-slate-50 text-center text-slate-500 text-xs">
          No company applications yet. Explore active drives to analyze your skill match.
        </div>

        <!-- Cards List -->
        <div *ngIf="companySkillMatches().hasApplications" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            *ngFor="let m of companySkillMatches().companyMatches"
            class="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div class="flex items-start justify-between gap-2 mb-2">
                <div class="flex items-center gap-2.5">
                  <img
                    *ngIf="m.companyLogo"
                    [src]="m.companyLogo"
                    [alt]="m.companyName"
                    (error)="onLogoError($event, m.companyName)"
                    class="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <h4 class="text-xs font-extrabold text-slate-900">{{ m.companyName }}</h4>
                    <p class="text-[11px] font-medium text-slate-600">{{ m.jobTitle }}</p>
                  </div>
                </div>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {{ m.applicationStatus }}
                </span>
              </div>

              <!-- Match % & Progress Bar -->
              <div *ngIf="m.matchPercentage !== null" class="space-y-1 my-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-700">Skill Match:</span>
                  <span
                    class="font-black text-xs"
                    [ngClass]="m.matchPercentage >= 75 ? 'text-emerald-700' : m.matchPercentage >= 50 ? 'text-blue-700' : 'text-amber-700'"
                  >
                    {{ m.matchPercentage }}% Match
                  </span>
                </div>
                <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    [ngClass]="m.matchPercentage >= 75 ? 'bg-emerald-500' : m.matchPercentage >= 50 ? 'bg-blue-600' : 'bg-amber-500'"
                    [style.width]="m.matchPercentage + '%'"
                  ></div>
                </div>
              </div>

              <div *ngIf="m.matchPercentage === null" class="text-[11px] text-slate-500 italic py-1">
                {{ m.statusMessage }}
              </div>

              <!-- Badges Summary -->
              <div class="space-y-1 text-[11px] pt-1">
                <div class="flex flex-wrap gap-1">
                  <span *ngFor="let sk of m.matchedSkills.slice(0, 3)" class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                    ✓ {{ sk }}
                  </span>
                </div>
                <div *ngIf="m.missingSkills.length > 0" class="flex flex-wrap gap-1 pt-0.5">
                  <span *ngFor="let sk of m.missingSkills.slice(0, 2)" class="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 text-[10px] font-semibold border border-rose-200">
                    ⚠ {{ sk }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Card Bottom Button -->
            <div class="pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <span class="text-[10px] text-slate-400">{{ m.matchedSkills.length }}/{{ m.requiredSkills.length }} matched</span>
              <a
                routerLink="/student/profile"
                fragment="company-skill-match"
                class="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
              >
                <span>[View Analysis]</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Missing Skills Aggregation Highlight -->
        <div *ngIf="companySkillMatches().skillGaps.length > 0" class="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
          <div class="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
            <app-icon name="alert-triangle" [size]="14" customClass="text-amber-600"></app-icon>
            <span>Current Skill Gaps Across Applied Jobs:</span>
          </div>
          <div class="flex flex-wrap gap-2 text-xs">
            <span
              *ngFor="let g of companySkillMatches().skillGaps.slice(0, 3)"
              class="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-amber-900 font-semibold shadow-2xs"
            >
              <strong>{{ g.skill }}</strong> — Required by {{ g.requiredByJobsCount }} applied {{ g.requiredByJobsCount === 1 ? 'job' : 'jobs' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Company-Based Preparation Tasks Widget & Quick Actions -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-bold text-slate-900">Priority Company Preparation Tasks</h3>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {{ activeTasks().length }} Pending
              </span>
            </div>
            <p class="text-xs text-slate-500">Timed challenges, mock tests, and interview checklists for your applied drives</p>
          </div>
          <a routerLink="/student/profile" class="text-xs font-semibold text-blue-600 hover:underline self-start sm:self-auto">
            Manage All Tasks →
          </a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            *ngFor="let t of activeTasks().slice(0, 3)"
            class="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div class="flex items-center justify-between gap-2 mb-1.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">{{ t.companyName }}</span>
                <span
                  class="text-[10px] font-bold px-2 py-0.5 rounded"
                  [ngClass]="t.priority === 'Urgent' || t.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'"
                >
                  {{ t.priority }}
                </span>
              </div>
              <h4 class="text-xs font-bold text-slate-900 line-clamp-1">{{ t.title }}</h4>
              <p class="text-[11px] text-slate-500 line-clamp-2 mt-1">{{ t.description }}</p>
            </div>

            <div class="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span class="text-[11px] text-slate-400">Due {{ t.dueDate | date:'mediumDate' }}</span>
              <button
                type="button"
                (click)="taskService.updateTaskStatus(t.id, 'Completed', 95)"
                class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors"
              >
                Mark Done
              </button>
            </div>
          </div>

          <div *ngIf="activeTasks().length === 0" class="col-span-full p-6 rounded-2xl bg-emerald-50 text-center text-emerald-800 text-xs font-semibold">
            🎉 All assigned company tasks are complete! Great work preparing for your placement rounds.
          </div>
        </div>
      </div>

      <!-- Upcoming Opportunities & Recommended Resources -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Upcoming Jobs Column (2 Cols) -->
        <div class="lg:col-span-2 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-bold text-slate-900 tracking-tight">Recommended Drives</h3>
              <span class="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                {{ jobService.activeJobs().length }} Active
              </span>
            </div>
            <a routerLink="/student/jobs" class="text-xs font-semibold text-blue-600 hover:underline">
              Browse All Jobs
            </a>
          </div>

          <!-- Job Cards List -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              *ngFor="let job of matchingJobs()"
              class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div class="flex items-center gap-3">
                    <img
                      [src]="job.companyLogo"
                      [alt]="job.companyName"
                      (error)="onLogoError($event, job.companyName)"
                      class="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h4 class="text-sm font-bold text-slate-900 line-clamp-1">{{ job.title }}</h4>
                      <p class="text-xs text-slate-500 font-medium">{{ job.companyName }} • {{ job.location }}</p>
                    </div>
                  </div>
                </div>

                <div class="flex flex-wrap gap-1.5 my-3">
                  <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    {{ job.salary }}
                  </span>
                  <span class="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {{ job.domain }}
                  </span>
                </div>
              </div>

              <div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span class="text-[11px] text-slate-400">Min CGPA: {{ job.minimumCgpa }}</span>
                <a
                  [routerLink]="['/student/jobs', job.id]"
                  class="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-semibold text-xs transition-colors"
                >
                  View Role
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Recommended Preparation Resources Column (1 Col) -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-slate-900 tracking-tight">Preparation Hub</h3>
            <a routerLink="/student/resources" class="text-xs font-semibold text-blue-600 hover:underline">
              Open Drive
            </a>
          </div>

          <div class="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div
              *ngFor="let file of resourceService.files().slice(0, 3)"
              (click)="resourceService.downloadFile(file)"
              class="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <app-icon name="file" [size]="18"></app-icon>
                </div>
                <div class="min-w-0">
                  <h5 class="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-700">{{ file.name }}</h5>
                  <p class="text-[11px] text-slate-400">{{ file.category }} • {{ file.sizeFormatted }}</p>
                </div>
              </div>
              <div class="text-slate-400 group-hover:text-blue-600 p-1">
                <app-icon name="download" [size]="16"></app-icon>
              </div>
            </div>
          </div>

          <!-- My Mentors / Approved Mentors Widget (Isolated Student Mentorship Chat Entry) -->
          <div class="bg-linear-to-br from-purple-50 to-indigo-50/40 rounded-3xl p-5 border border-purple-100 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                  <app-icon name="users" [size]="14" customClass="text-purple-600"></app-icon>
                  My Mentors / Approved Mentors
                </h4>
                <p class="text-[10px] text-purple-700/80 mt-0.5">1-on-1 isolated mentorship chats</p>
              </div>
              <a routerLink="/student/alumni" class="text-[11px] font-semibold text-purple-700 hover:underline">
                Explore All
              </a>
            </div>

            <!-- Approved Mentors List (Chat Enabled) -->
            <div *ngIf="alumniService.myApprovedMentors().length > 0" class="space-y-2">
              <div
                *ngFor="let mentor of alumniService.myApprovedMentors().slice(0, 3)"
                class="p-2.5 rounded-2xl bg-white border border-purple-100/80 shadow-2xs flex items-center justify-between gap-3 hover:border-purple-200 transition-all"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <img
                    [src]="mentor.profilePhoto"
                    [alt]="mentor.fullName"
                    (error)="onImgError($event, mentor.fullName)"
                    class="w-10 h-10 rounded-full object-cover border border-purple-100 shadow-2xs shrink-0"
                  />
                  <div class="min-w-0">
                    <h5 class="text-xs font-bold text-slate-900 truncate">{{ mentor.fullName }}</h5>
                    <p class="text-[11px] text-purple-700 truncate font-medium">
                      {{ mentor.designation }}{{ mentor.company ? ' • ' + mentor.company : '' }}
                    </p>
                    <span *ngIf="mentor.mentorshipTopic" class="text-[10px] text-slate-400 block truncate">
                      {{ mentor.mentorshipTopic }}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  (click)="onMessageMentor(mentor)"
                  class="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 shrink-0 transition-colors"
                  title="Open isolated chat with this mentor"
                >
                  <app-icon name="message-square" [size]="12"></app-icon>
                  Chat
                </button>
              </div>
            </div>

            <!-- Empty State when 0 Approved Mentors -->
            <div *ngIf="alumniService.myApprovedMentors().length === 0" class="p-4 rounded-2xl bg-white/70 border border-purple-100/80 text-center space-y-2">
              <p class="text-[11px] text-slate-600">
                You have no approved mentors yet. Chat is unlocked only after an alumni accepts your mentorship request.
              </p>
              <div *ngIf="pendingMentorshipRequestsCount() > 0" class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                <app-icon name="clock" [size]="11"></app-icon>
                {{ pendingMentorshipRequestsCount() }} request(s) pending approval
              </div>
              <div class="pt-1">
                <a
                  routerLink="/student/alumni"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-2xs transition-colors"
                >
                  <app-icon name="user-plus" [size]="13"></app-icon>
                  Browse Alumni Mentors
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentDashboardComponent {
  studentService = inject(StudentService);
  jobService = inject(JobService);
  applicationService = inject(ApplicationService);
  taskService = inject(TaskService);
  skillMatchingService = inject(SkillMatchingService);
  alumniService = inject(AlumniService);
  resourceService = inject(ResourceService);
  chatService = inject(ChatService);
  router = inject(Router);

  student = this.studentService.currentStudent;

  // Phase 1: Company Skill Matches for dashboard
  companySkillMatches = computed(() => {
    return this.skillMatchingService.getStudentCompanySkillMatches(
      this.student(),
      this.applicationService.studentApplications()
    );
  });

  allTasks = computed(() => {
    const s = this.student();
    return this.taskService.getTasksForStudent(s.id || s.userId);
  });

  activeTasks = computed(() => {
    return this.allTasks().filter(t => t.status === 'Pending' || t.status === 'In Progress');
  });

  completedTasksCount = computed(() => {
    return this.allTasks().filter(t => t.status === 'Completed').length;
  });

  shortlistedCount = computed(() => {
    return this.applicationService.studentApplications().filter(
      a => a.status === 'Shortlisted' || a.status === 'Technical Interview' || a.status === 'HR Interview' || a.status === 'Aptitude' || a.status === 'Selected'
    ).length;
  });

  interviewsCount = computed(() => {
    return this.applicationService.studentApplications().filter(
      a => a.status === 'Technical Interview' || a.status === 'HR Interview'
    ).length;
  });

  matchingJobs = computed(() => {
    const s = this.student();
    const studentSkills = (s.skills || []).map(sk => sk.toLowerCase());
    const active = this.jobService.activeJobs();
    const matched = active.filter(j =>
      (j.requiredSkills || []).some(rs => studentSkills.includes(rs.toLowerCase())) ||
      s.cgpa >= j.minimumCgpa
    );
    return matched.length > 0 ? matched.slice(0, 4) : active.slice(0, 4);
  });

  activeApplication = computed(() => {
    const apps = this.applicationService.studentApplications();
    return apps.length > 0 ? apps[0] : null;
  });

  skillGap = computed(() => {
    const appliedJobs = this.applicationService.studentApplications()
      .map(a => this.jobService.getJobById(a.jobId))
      .filter((j): j is any => !!j);
    return this.taskService.calculateSkillGapAnalysis(this.student(), appliedJobs);
  });

  readiness = computed(() => {
    const appliedJobs = this.applicationService.studentApplications()
      .map(a => this.jobService.getJobById(a.jobId))
      .filter((j): j is any => !!j);
    return this.taskService.calculatePlacementReadiness(
      this.student(),
      this.applicationService.studentApplications(),
      appliedJobs,
      this.allTasks()
    );
  });

  pendingMentorshipRequestsCount = computed(() => {
    return this.alumniService.outgoingRequests().filter(
      r => (r.connectionType === 'mentorship' || r.requestType === 'mentorship') && r.status === 'pending'
    ).length;
  });

  async onMessageMentor(mentor: any) {
    if (!mentor) return;
    await this.chatService.startConversationWith({
      id: mentor.userId,
      name: mentor.fullName,
      avatar: mentor.profilePhoto,
      role: 'alumni',
      headline: `${mentor.designation}${mentor.company ? ' @ ' + mentor.company : ''}`
    });
    this.router.navigate(['/student/messages']);
  }

  onImgError(event: Event, name?: string) {
    const target = event.target as HTMLImageElement;
    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Alumni')}&background=7c3aed&color=fff&bold=true`;
  }

  onLogoError(event: Event, companyName?: string) {
    const target = event.target as HTMLImageElement;
    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName || 'Company')}&background=3b82f6&color=fff&bold=true`;
  }
}
