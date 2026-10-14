import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../../core/services/student.service';
import { ApplicationService } from '../../../core/services/application.service';
import { JobService } from '../../../core/services/job.service';
import { TaskService } from '../../../core/services/task.service';
import { SkillMatchingService, SingleJobSkillMatch } from '../../../core/services/skill-matching.service';
import { StudentTask, TaskCategory, TaskPriority, TaskStatus } from '../../../core/models/task.model';
import { IconComponent } from '../../../shared/icons/icon.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, BadgeComponent],
  template: `
    <div class="space-y-8 animate-in fade-in duration-300 pb-12">
      <!-- ========================================================================= -->
      <!-- SECTION 1: HERO & BASIC STUDENT INFORMATION -->
      <!-- ========================================================================= -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="flex flex-col sm:flex-row sm:items-center gap-5">
            <div class="relative">
              <img
                [src]="student().profilePhoto"
                [alt]="student().fullName"
                (error)="onImgError($event, student().fullName)"
                class="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-slate-100 shadow-md ring-4 ring-blue-50 shrink-0"
              />
              <span class="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white" title="Active Student"></span>
            </div>

            <div>
              <div class="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{{ student().fullName }}</h1>
                <app-badge variant="primary" [dot]="true">Class of {{ student().graduationYear }}</app-badge>
                <app-badge [variant]="student().placementStatus === 'Selected' ? 'success' : 'warning'">
                  {{ student().placementStatus }}
                </app-badge>
                <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <app-icon name="check-circle" [size]="12"></app-icon>
                  Verified ATS Resume
                </span>
              </div>

              <p class="text-sm font-medium text-slate-600">
                {{ student().course || 'B.Tech' }} in {{ student().department }} • Roll: <strong class="text-slate-900 font-semibold">{{ student().rollNumber }}</strong>
                <span *ngIf="student().batch"> • Batch: {{ student().batch }}</span>
              </p>

              <!-- Academic Metrics & Contacts -->
              <div class="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                <span class="flex items-center gap-1.5">
                  <app-icon name="award" [size]="14" customClass="text-blue-600"></app-icon>
                  CGPA: <strong class="text-slate-900 text-sm">{{ student().cgpa.toFixed(2) }} / 10.0</strong>
                </span>
                <span class="flex items-center gap-1.5">
                  <span class="font-semibold text-slate-700">10th:</span> {{ student().tenthPercentage }}%
                </span>
                <span class="flex items-center gap-1.5">
                  <span class="font-semibold text-slate-700">12th:</span> {{ student().twelfthPercentage }}%
                </span>
                <span class="flex items-center gap-1.5 text-slate-600">
                  <app-icon name="mail" [size]="13"></app-icon>
                  {{ student().email }}
                </span>
                <span *ngIf="student().phone" class="flex items-center gap-1.5 text-slate-600">
                  <app-icon name="phone" [size]="13"></app-icon>
                  {{ student().phone }}
                </span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap lg:flex-col gap-2.5 shrink-0">
            <button
              type="button"
              (click)="openEditModal()"
              class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <app-icon name="edit-3" [size]="16"></app-icon>
              Edit Profile
            </button>
            <label class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <span *ngIf="isUploadingResume()" class="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
              <app-icon *ngIf="!isUploadingResume()" name="upload" [size]="16"></app-icon>
              <span>{{ isUploadingResume() ? 'Uploading...' : 'Upload Resume' }}</span>
              <input type="file" (change)="handleResumeUpload($event)" accept=".pdf" class="hidden" [disabled]="isUploadingResume()" />
            </label>
            <button
              type="button"
              (click)="downloadResume()"
              class="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <app-icon name="download" [size]="14"></app-icon>
              Download PDF
            </button>
          </div>
        </div>

        <!-- Bio snippet -->
        <p *ngIf="student().bio" class="mt-6 pt-5 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
          {{ student().bio }}
        </p>

        <!-- Social & Portfolio Links Bar -->
        <div class="mt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
          <a *ngIf="student().githubUrl" [href]="student().githubUrl" target="_blank" class="flex items-center gap-1.5 hover:text-slate-900 hover:underline">
            <app-icon name="github" [size]="15"></app-icon>
            GitHub: <span class="text-blue-600 font-semibold">{{ student().githubUrl }}</span>
          </a>
          <a *ngIf="student().linkedinUrl" [href]="student().linkedinUrl" target="_blank" class="flex items-center gap-1.5 text-blue-600 hover:underline">
            <app-icon name="linkedin" [size]="15"></app-icon>
            LinkedIn Profile
          </a>
          <a *ngIf="student().portfolioUrl" [href]="student().portfolioUrl" target="_blank" class="flex items-center gap-1.5 text-indigo-600 hover:underline">
            <app-icon name="globe" [size]="15"></app-icon>
            Live Portfolio
          </a>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- SECTION 2: PLACEMENT READINESS SCORECARD (MATHEMATICAL MODEL) -->
      <!-- ========================================================================= -->
      <div class="bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div class="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div class="relative z-10 space-y-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1.5">
                  <app-icon name="sparkles" [size]="13"></app-icon>
                  Placement Intelligence Engine
                </span>
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  [ngClass]="readiness().tierReadiness === 'Tier-1 Ready' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'"
                >
                  {{ readiness().tierReadiness }}
                </span>
              </div>
              <h2 class="text-2xl font-black tracking-tight mt-2 text-white">Student Placement Readiness Analysis</h2>
              <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Dynamic score mathematically synthesized from your verified profile strength, applied company skill match rate, task challenges completion, and active recruitment drives.
              </p>
            </div>

            <!-- Big Circular Score Gauge -->
            <div class="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 self-start md:self-auto">
              <div class="relative w-16 h-16 flex items-center justify-center rounded-2xl bg-indigo-600/60 border border-indigo-400/40 font-black text-2xl text-white shadow-inner">
                {{ readiness().overallScore }}
              </div>
              <div>
                <div class="text-[10px] uppercase font-bold tracking-wider text-indigo-200">Readiness Score</div>
                <div class="text-sm font-extrabold text-white">{{ readiness().overallScore }} / 100</div>
                <div class="text-[11px] text-emerald-300 font-semibold">{{ readiness().completionRate }}% Tasks Cleared</div>
              </div>
            </div>
          </div>

          <!-- 4 Score Weights Breakdown Bars -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <!-- 1. Profile Strength (25%) -->
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300 font-medium">Profile Completeness (25%)</span>
                <span class="font-bold text-white">{{ student().profileCompletion }}%</span>
              </div>
              <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div class="h-full bg-blue-500 rounded-full transition-all duration-500" [style.width]="student().profileCompletion + '%'"></div>
              </div>
              <div class="text-[11px] text-slate-400">Contributes {{ readiness().profileStrengthWeight }}/25 pts</div>
            </div>

            <!-- 2. Skill Match Rate (35%) -->
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300 font-medium">Skill Match vs Drives (35%)</span>
                <span class="font-bold text-white">{{ skillGap().matchPercentage }}%</span>
              </div>
              <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" [style.width]="skillGap().matchPercentage + '%'"></div>
              </div>
              <div class="text-[11px] text-slate-400">Contributes {{ readiness().skillMatchWeight }}/35 pts</div>
            </div>

            <!-- 3. Task Completion Rate (25%) -->
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300 font-medium">Task Mastery (25%)</span>
                <span class="font-bold text-white">{{ readiness().completionRate }}%</span>
              </div>
              <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div class="h-full bg-amber-400 rounded-full transition-all duration-500" [style.width]="readiness().completionRate + '%'"></div>
              </div>
              <div class="text-[11px] text-slate-400">Contributes {{ readiness().taskCompletionWeight }}/25 pts</div>
            </div>

            <!-- 4. Active Recruitment Pipeline (15%) -->
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300 font-medium">Active Drives Pipeline (15%)</span>
                <span class="font-bold text-white">{{ studentApplications().length }} Applied</span>
              </div>
              <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div class="h-full bg-purple-500 rounded-full transition-all duration-500" [style.width]="(studentApplications().length * 33) + '%'"></div>
              </div>
              <div class="text-[11px] text-slate-400">Contributes {{ readiness().activeDrivesWeight }}/15 pts</div>
            </div>
          </div>

          <!-- Strengths & Action Items Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div class="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <app-icon name="check-circle" [size]="14"></app-icon>
                Key Verified Strengths
              </h4>
              <ul class="space-y-1.5 text-xs text-emerald-100">
                <li *ngFor="let s of readiness().strengths" class="flex items-start gap-1.5">
                  <span class="text-emerald-400 shrink-0">✓</span>
                  <span>{{ s }}</span>
                </li>
              </ul>
            </div>

            <div class="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <app-icon name="alert-circle" [size]="14"></app-icon>
                Recommended Focus Areas
              </h4>
              <ul class="space-y-1.5 text-xs text-amber-100">
                <li *ngFor="let a of readiness().actionItems" class="flex items-start gap-1.5">
                  <span class="text-amber-400 shrink-0">⚡</span>
                  <span>{{ a }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- SECTION 3: SKILLS ANALYSIS & CATEGORIZATION -->
      <!-- ========================================================================= -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Comprehensive Skills Stack & Domain Analysis</h3>
            <p class="text-xs text-slate-500">Categorized breakdown of technical competencies, tools, and verified expertise</p>
          </div>
          <span class="text-xs font-semibold px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
            Target Domain: <strong>{{ student().preferredDomain }}</strong>
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <!-- Programming Languages -->
          <div class="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <app-icon name="code" [size]="14" customClass="text-blue-600"></app-icon>
              Programming Languages
            </h4>
            <div class="flex flex-wrap gap-1.5">
              <span *ngFor="let s of skillGap().categorizedSkills.programming" class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800">
                {{ s }}
              </span>
              <span *ngIf="skillGap().categorizedSkills.programming.length === 0" class="text-xs text-slate-400 italic">None logged</span>
            </div>
          </div>

          <!-- Frameworks & Libraries -->
          <div class="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <app-icon name="layers" [size]="14" customClass="text-indigo-600"></app-icon>
              Frameworks & Libraries
            </h4>
            <div class="flex flex-wrap gap-1.5">
              <span *ngFor="let s of skillGap().categorizedSkills.frameworks" class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800">
                {{ s }}
              </span>
              <span *ngIf="skillGap().categorizedSkills.frameworks.length === 0" class="text-xs text-slate-400 italic">None logged</span>
            </div>
          </div>

          <!-- Databases & Storage -->
          <div class="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <app-icon name="database" [size]="14" customClass="text-emerald-600"></app-icon>
              Databases & Storage
            </h4>
            <div class="flex flex-wrap gap-1.5">
              <span *ngFor="let s of skillGap().categorizedSkills.databases" class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800">
                {{ s }}
              </span>
              <span *ngIf="skillGap().categorizedSkills.databases.length === 0" class="text-xs text-slate-400 italic">None logged</span>
            </div>
          </div>

          <!-- Cloud & DevOps Tools -->
          <div class="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <app-icon name="tool" [size]="14" customClass="text-amber-600"></app-icon>
              Tools & Cloud Platforms
            </h4>
            <div class="flex flex-wrap gap-1.5">
              <span *ngFor="let s of skillGap().categorizedSkills.tools" class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800">
                {{ s }}
              </span>
              <span *ngIf="skillGap().categorizedSkills.tools.length === 0" class="text-xs text-slate-400 italic">None logged</span>
            </div>
          </div>

          <!-- Soft Skills & Leadership -->
          <div class="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <app-icon name="users" [size]="14" customClass="text-purple-600"></app-icon>
              Soft Skills & Leadership
            </h4>
            <div class="flex flex-wrap gap-1.5">
              <span *ngFor="let s of skillGap().categorizedSkills.softSkills" class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800">
                {{ s }}
              </span>
              <span *ngIf="skillGap().categorizedSkills.softSkills.length === 0" class="text-xs text-slate-400 italic">None logged</span>
            </div>
          </div>

          <!-- Core CS Subjects -->
          <div class="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <app-icon name="book" [size]="14" customClass="text-rose-600"></app-icon>
              Core Engineering Concepts
            </h4>
            <div class="flex flex-wrap gap-1.5">
              <span *ngFor="let s of skillGap().categorizedSkills.coreSubjects" class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800">
                {{ s }}
              </span>
              <span *ngIf="skillGap().categorizedSkills.coreSubjects.length === 0" class="text-xs text-slate-400 italic">Data Structures, Algorithms, OOP, OS</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- SECTION 4: COMPANY SKILL MATCH (COMPANY ↔ STUDENT SKILL MATCHING) -->
      <!-- ========================================================================= -->
      <div id="company-skill-match" class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                Phase 1 Core Engine
              </span>
              <h3 class="text-xl font-black text-slate-900 tracking-tight">COMPANY SKILL MATCH</h3>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              Dynamic comparison between your verified skills and the specific requirements of companies and jobs you have applied to.
            </p>
          </div>

          <div *ngIf="companySkillMatchOverview().hasApplications" class="flex items-center gap-2 self-start sm:self-auto text-xs bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
            <span class="text-slate-500 font-medium">Average Match:</span>
            <strong class="text-blue-700 font-extrabold text-sm">{{ companySkillMatchOverview().overallMatchAverage }}%</strong>
          </div>
        </div>

        <!-- Empty State 1: No student skills -->
        <div *ngIf="!companySkillMatchOverview().hasStudentSkills" class="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <div class="flex items-center gap-2 font-bold mb-1">
            <app-icon name="alert-circle" [size]="16" customClass="text-amber-600"></app-icon>
            Skill analysis unavailable — student skills have not been added.
          </div>
          <p class="text-amber-800 text-[11px]">Please add your technical competencies in the profile section above to generate real-time skill matching scores.</p>
        </div>

        <!-- Empty State 2: No applications yet -->
        <div *ngIf="companySkillMatchOverview().hasStudentSkills && !companySkillMatchOverview().hasApplications" class="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
          <app-icon name="briefcase" [size]="28" customClass="text-slate-400 mx-auto"></app-icon>
          <h4 class="text-xs font-bold text-slate-700">No company applications yet.</h4>
          <p class="text-slate-500 text-[11px] max-w-md mx-auto">
            Apply to active campus placement drives from the Jobs portal to automatically trigger company-wise skill matching and gap analysis.
          </p>
        </div>

        <!-- Company-Wise Matching Cards Grid -->
        <div *ngIf="companySkillMatchOverview().hasApplications" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            *ngFor="let m of companySkillMatchOverview().companyMatches"
            class="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
          >
            <div>
              <!-- Top: Company & Role -->
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex items-center gap-3">
                  <img
                    *ngIf="m.companyLogo"
                    [src]="m.companyLogo"
                    [alt]="m.companyName"
                    (error)="onLogoError($event, m.companyName)"
                    class="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                  />
                  <div>
                    <h4 class="text-sm font-extrabold text-slate-900">{{ m.companyName }}</h4>
                    <p class="text-xs font-semibold text-slate-600">{{ m.jobTitle }}</p>
                  </div>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {{ m.applicationStatus }}
                </span>
              </div>

              <!-- Skill Match Rate Bar or Status Message -->
              <div *ngIf="m.matchPercentage !== null" class="space-y-1.5 mb-4 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-700">Skill Match:</span>
                  <span
                    class="font-black text-sm"
                    [ngClass]="m.matchPercentage >= 75 ? 'text-emerald-700' : m.matchPercentage >= 50 ? 'text-blue-700' : 'text-amber-700'"
                  >
                    {{ m.matchPercentage }}%
                  </span>
                </div>
                <!-- Progress bar -->
                <div class="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    [ngClass]="m.matchPercentage >= 75 ? 'bg-emerald-500' : m.matchPercentage >= 50 ? 'bg-blue-600' : 'bg-amber-500'"
                    [style.width]="m.matchPercentage + '%'"
                  ></div>
                </div>
                <div class="text-[10px] text-slate-400 text-right font-medium">
                  {{ m.matchedSkills.length }} of {{ m.requiredSkills.length }} required skills satisfied
                </div>
              </div>

              <div *ngIf="m.matchPercentage === null" class="p-3 rounded-xl bg-slate-100 text-slate-600 text-[11px] italic mb-3">
                {{ m.statusMessage }}
              </div>

              <!-- Matched Skills (✓) -->
              <div class="space-y-1.5 mb-3">
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <app-icon name="check-circle" [size]="12" customClass="text-emerald-600"></app-icon>
                  Matched Skills ({{ m.matchedSkills.length }}):
                </span>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    *ngFor="let sk of m.matchedSkills"
                    class="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1"
                  >
                    <span>✓</span> {{ sk }}
                  </span>
                  <span *ngIf="m.matchedSkills.length === 0" class="text-[11px] text-slate-400 italic">No direct matches yet</span>
                </div>
              </div>

              <!-- Missing Skills (⚠) -->
              <div class="space-y-1.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
                  <app-icon name="alert-triangle" [size]="12" customClass="text-rose-600"></app-icon>
                  Missing:
                </span>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    *ngFor="let sk of m.missingSkills"
                    class="px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center gap-1"
                  >
                    <span>⚠</span> {{ sk }}
                  </span>
                  <span *ngIf="m.missingSkills.length === 0" class="text-[11px] text-emerald-700 font-bold">✓ 100% Requirements Met!</span>
                </div>
              </div>
            </div>

            <!-- Card Footer: View Analysis Button -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span class="text-[10px] text-slate-400">Salary: <strong class="text-slate-700">{{ m.salary }}</strong></span>
              <button
                type="button"
                (click)="openSkillAnalysisModal(m)"
                class="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors flex items-center gap-1"
              >
                <span>[View Analysis]</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Current Skill Gaps Aggregation Section -->
        <div *ngIf="companySkillMatchOverview().skillGaps.length > 0" class="mt-6 pt-6 border-t border-slate-100 space-y-4">
          <div>
            <h4 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <app-icon name="trending-up" [size]="15" customClass="text-rose-600"></app-icon>
              <span>Current Skill Gaps (Aggregated Across Applied Jobs)</span>
            </h4>
            <p class="text-xs text-slate-500">
              High-priority missing skills ranked dynamically by how many of your applied companies demand them:
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              *ngFor="let gap of companySkillMatchOverview().skillGaps"
              class="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-1"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-rose-900">⚡ {{ gap.skill }}</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
                  {{ gap.requiredByJobsCount }} {{ gap.requiredByJobsCount === 1 ? 'job' : 'jobs' }}
                </span>
              </div>
              <p class="text-[10px] text-rose-700 font-medium leading-relaxed">
                Required by {{ gap.requiredByJobsCount }} applied {{ gap.requiredByJobsCount === 1 ? 'drive' : 'drives' }}:
                <span class="font-bold">{{ gap.companiesRequiring.join(', ') }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- SECTION 5: SHORTLISTED & ACTIVE INTERVIEW COMPANIES -->
      <!-- ========================================================================= -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-bold text-slate-900">Shortlisted Companies & Active Pipeline</h3>
              <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {{ studentApplications().length }} Active
              </span>
            </div>
            <p class="text-xs text-slate-500">Real-time status tracking for companies reviewing or interviewing your candidature</p>
          </div>
        </div>

        <div *ngIf="studentApplications().length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            *ngFor="let app of studentApplications()"
            class="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all space-y-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <img
                  [src]="app.companyLogo"
                  [alt]="app.companyName"
                  (error)="onLogoError($event, app.companyName)"
                  class="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <h4 class="text-sm font-bold text-slate-900">{{ app.companyName }}</h4>
                  <p class="text-xs text-slate-500 font-medium">{{ app.jobTitle }}</p>
                </div>
              </div>
              <app-badge [variant]="app.status === 'Selected' ? 'success' : app.status === 'Technical Interview' ? 'primary' : 'warning'">
                {{ app.status }}
              </app-badge>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs py-2 px-3 rounded-xl bg-white border border-slate-100">
              <div>
                <span class="text-slate-400">Offered CTC:</span>
                <div class="font-bold text-slate-800">{{ app.salary }}</div>
              </div>
              <div>
                <span class="text-slate-400">Applied On:</span>
                <div class="font-semibold text-slate-700">{{ app.appliedAt | date:'mediumDate' }}</div>
              </div>
            </div>

            <div *ngIf="app.timeline && app.timeline.length > 0" class="text-xs text-slate-600 space-y-1">
              <div class="font-semibold text-slate-700 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-blue-600"></span>
                Latest Update: {{ app.timeline[app.timeline.length - 1].notes || app.notes }}
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="studentApplications().length === 0" class="p-8 rounded-2xl bg-slate-50 text-center text-slate-500 text-xs">
          No applications filed yet. Visit the Jobs section to apply for active drives.
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- SECTION 6: COMPANY-BASED STUDENT TASKS -->
      <!-- ========================================================================= -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-bold text-slate-900">Company-Based Preparation Tasks</h3>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                {{ studentTasks().length }} Assigned
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Specific assessment, coding challenge, and interview preparation tasks aligned to each hiring partner.
            </p>
          </div>

          <!-- Quick Actions & Filter -->
          <div class="flex items-center gap-2">
            <div class="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                (click)="taskFilter.set('all')"
                class="px-3 py-1 rounded-lg transition-all"
                [ngClass]="taskFilter() === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'"
              >
                All ({{ studentTasks().length }})
              </button>
              <button
                type="button"
                (click)="taskFilter.set('pending')"
                class="px-3 py-1 rounded-lg transition-all"
                [ngClass]="taskFilter() === 'pending' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'"
              >
                Pending ({{ pendingTaskCount() }})
              </button>
              <button
                type="button"
                (click)="taskFilter.set('completed')"
                class="px-3 py-1 rounded-lg transition-all"
                [ngClass]="taskFilter() === 'completed' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'"
              >
                Completed ({{ completedTaskCount() }})
              </button>
            </div>

            <button
              type="button"
              (click)="showAddTaskModal.set(true)"
              class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <app-icon name="plus" [size]="14"></app-icon>
              + New Task
            </button>
          </div>
        </div>

        <!-- Task Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            *ngFor="let t of filteredTasks()"
            class="p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4"
            [ngClass]="t.status === 'Completed' ? 'bg-emerald-50/30 border-emerald-200' : t.status === 'In Progress' ? 'bg-blue-50/30 border-blue-200' : 'bg-white border-slate-200 hover:border-slate-300'"
          >
            <div>
              <div class="flex items-start justify-between gap-3 mb-2">
                <div class="flex items-center gap-2.5">
                  <img
                    *ngIf="t.companyLogo"
                    [src]="t.companyLogo"
                    (error)="onLogoError($event, t.companyName)"
                    class="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{{ t.companyName }}</span>
                    <h4 class="text-sm font-bold text-slate-900 leading-snug">{{ t.title }}</h4>
                  </div>
                </div>

                <!-- Status Badge -->
                <span
                  class="px-2.5 py-0.5 rounded-md text-[10px] font-bold shrink-0"
                  [ngClass]="t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : t.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'"
                >
                  {{ t.status }}
                </span>
              </div>

              <p class="text-xs text-slate-600 leading-relaxed mb-3">{{ t.description }}</p>

              <!-- Category & Target Skill Badges -->
              <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                  {{ t.category }}
                </span>
                <span
                  class="px-2 py-0.5 rounded font-bold"
                  [ngClass]="t.priority === 'Urgent' || t.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'"
                >
                  {{ t.priority }} Priority
                </span>
                <span *ngIf="t.requiredSkillTarget" class="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/50">
                  Target: {{ t.requiredSkillTarget }}
                </span>
              </div>

              <!-- Score Banner if Completed -->
              <div *ngIf="t.status === 'Completed' && t.score !== undefined" class="mt-3 p-2.5 rounded-xl bg-white border border-emerald-200 flex items-center justify-between text-xs">
                <span class="text-emerald-800 font-medium">Assessment Score:</span>
                <span class="font-extrabold text-emerald-700 text-sm">{{ t.score }} / {{ t.maxScore || 100 }}</span>
              </div>
            </div>

            <!-- Card Bottom Bar: Due date & Actions -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span class="text-slate-400">Due: <strong class="text-slate-700 font-medium">{{ t.dueDate | date:'mediumDate' }}</strong></span>

              <div class="flex items-center gap-2">
                <button
                  *ngIf="t.status === 'Pending'"
                  type="button"
                  (click)="taskService.updateTaskStatus(t.id, 'In Progress')"
                  class="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-colors"
                >
                  Start Task
                </button>
                <button
                  *ngIf="t.status === 'In Progress'"
                  type="button"
                  (click)="openCompleteTaskModal(t)"
                  class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-colors"
                >
                  Mark Completed
                </button>
                <button
                  *ngIf="t.status === 'Completed'"
                  type="button"
                  (click)="openCompleteTaskModal(t)"
                  class="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                  title="Update Score & Feedback"
                >
                  <app-icon name="edit" [size]="14"></app-icon>
                </button>
                <button
                  type="button"
                  (click)="taskService.deleteTask(t.id)"
                  class="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Remove Task"
                >
                  <app-icon name="trash-2" [size]="14"></app-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="filteredTasks().length === 0" class="p-8 rounded-2xl bg-slate-50 text-center text-slate-500 text-xs">
          No tasks found matching this filter.
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- SECTION 7: DYNAMIC TASK COMPLETION ANALYSIS -->
      <!-- ========================================================================= -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <h3 class="text-lg font-bold text-slate-900">Task Completion & Assessment Analytics</h3>
          <p class="text-xs text-slate-500">Live quantitative progress metrics on student technical challenges and mock interviews</p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <div class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Tasks</div>
            <div class="text-2xl font-black text-slate-900 mt-1">{{ readiness().totalTasks }}</div>
          </div>
          <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <div class="text-xs text-emerald-700 font-semibold uppercase tracking-wider">Completed</div>
            <div class="text-2xl font-black text-emerald-800 mt-1">{{ readiness().completedTasks }}</div>
          </div>
          <div class="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
            <div class="text-xs text-blue-700 font-semibold uppercase tracking-wider">In Progress</div>
            <div class="text-2xl font-black text-blue-800 mt-1">{{ readiness().inProgressTasks }}</div>
          </div>
          <div class="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-center">
            <div class="text-xs text-purple-700 font-semibold uppercase tracking-wider">Avg Assessment Score</div>
            <div class="text-2xl font-black text-purple-800 mt-1">{{ readiness().averageScore }}%</div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- SECTION 8: COMPANY-WISE PERFORMANCE BREAKDOWN -->
      <!-- ========================================================================= -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <h3 class="text-lg font-bold text-slate-900">Company-Wise Placement Performance Breakdown</h3>
          <p class="text-xs text-slate-500">Detailed matrix of skill alignment, task execution, and readiness rating for each target company</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px] tracking-wider bg-slate-50/50">
                <th class="py-3 px-4">Target Company</th>
                <th class="py-3 px-4">Role & CTC</th>
                <th class="py-3 px-4">Application Stage</th>
                <th class="py-3 px-4">Skill Match %</th>
                <th class="py-3 px-4">Tasks Progress</th>
                <th class="py-3 px-4">Readiness Rating</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let cp of companyPerformances()" class="hover:bg-slate-50/70 transition-colors">
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-2.5">
                    <img
                      *ngIf="cp.companyLogo"
                      [src]="cp.companyLogo"
                      (error)="onLogoError($event, cp.companyName)"
                      class="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <span class="font-bold text-slate-900">{{ cp.companyName }}</span>
                  </div>
                </td>
                <td class="py-3.5 px-4">
                  <div class="font-medium text-slate-800">{{ cp.jobTitle }}</div>
                  <div class="text-[11px] text-slate-400 font-semibold">{{ cp.salary }}</div>
                </td>
                <td class="py-3.5 px-4">
                  <span class="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                    {{ cp.applicationStatus }}
                  </span>
                </td>
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-2">
                    <div class="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full bg-emerald-500 rounded-full" [style.width]="cp.skillMatchPercentage + '%'"></div>
                    </div>
                    <span class="font-bold text-slate-800">{{ cp.skillMatchPercentage }}%</span>
                  </div>
                </td>
                <td class="py-3.5 px-4">
                  <span class="font-semibold text-slate-700">{{ cp.tasksCompleted }}/{{ cp.tasksTotal }} Cleared</span>
                  <span class="text-[11px] text-slate-400 block" *ngIf="cp.averageTaskScore > 0">Avg: {{ cp.averageTaskScore }}%</span>
                </td>
                <td class="py-3.5 px-4">
                  <span
                    class="px-2.5 py-1 rounded-full text-[10px] font-extrabold"
                    [ngClass]="cp.readinessLevel === 'High' ? 'bg-emerald-100 text-emerald-800' : cp.readinessLevel === 'Moderate' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'"
                  >
                    {{ cp.readinessLevel }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="companyPerformances().length === 0">
                <td colspan="6" class="py-6 text-center text-slate-400 italic">No applied companies to analyze.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- SECTION 9: TECHNICAL PROJECTS SHOWCASE -->
      <!-- ========================================================================= -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Technical Projects Portfolio</h3>
            <p class="text-xs text-slate-500">Hands-on software systems and real-world architectures built</p>
          </div>
          <button
            type="button"
            (click)="showAddProjectModal.set(true)"
            class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <app-icon name="plus" [size]="14"></app-icon>
            Add Project
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            *ngFor="let proj of student().projects"
            class="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div class="flex items-start justify-between gap-2 mb-2">
                <h4 class="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{{ proj.title }}</h4>
                <button
                  type="button"
                  (click)="studentService.removeProject(proj.id)"
                  class="text-slate-400 hover:text-rose-600 p-1 rounded-md"
                  title="Remove Project"
                >
                  <app-icon name="trash-2" [size]="14"></app-icon>
                </button>
              </div>

              <p class="text-xs text-slate-600 leading-relaxed mb-4">{{ proj.description }}</p>

              <div class="flex flex-wrap gap-1.5 mb-4">
                <span
                  *ngFor="let tech of proj.technologies"
                  class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700"
                >
                  {{ tech }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-3 pt-3 border-t border-slate-200/60 text-xs">
              <a
                *ngIf="proj.githubUrl"
                [href]="proj.githubUrl"
                target="_blank"
                class="font-semibold text-slate-700 hover:text-blue-600 flex items-center gap-1"
              >
                <app-icon name="github" [size]="12"></app-icon>
                Code
              </a>
              <a
                *ngIf="proj.liveUrl"
                [href]="proj.liveUrl"
                target="_blank"
                class="font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <app-icon name="external-link" [size]="12"></app-icon>
                Live Preview
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- SECTION 10: CERTIFICATIONS & CREDENTIALS -->
      <!-- ========================================================================= -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Industry Certifications & Verified Credentials</h3>
            <p class="text-xs text-slate-500">Official technical certifications vetted by industry partners</p>
          </div>
          <button
            type="button"
            (click)="showAddCertModal.set(true)"
            class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <app-icon name="plus" [size]="14"></app-icon>
            Add Certificate
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            *ngFor="let cert of student().certifications"
            class="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center gap-3"
          >
            <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <app-icon name="award" [size]="20"></app-icon>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-xs font-bold text-slate-900 truncate">{{ cert.title }}</h4>
              <p class="text-[11px] text-slate-500">{{ cert.issuer }} • Issued {{ cert.issueDate }}</p>
            </div>
            <a
              *ngIf="cert.credentialUrl"
              [href]="cert.credentialUrl"
              target="_blank"
              class="p-2 text-slate-400 hover:text-blue-600"
              title="Verify credential"
            >
              <app-icon name="external-link" [size]="16"></app-icon>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODALS & DIALOGS -->
    <!-- ========================================================================= -->

    <!-- Edit Profile Modal -->
    <div *ngIf="showEditModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-lg font-bold text-slate-900">Edit Career Profile</h3>
          <button (click)="showEditModal.set(false)" class="p-1 text-slate-400 hover:text-slate-600">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700">Full Name</label>
            <input [(ngModel)]="editName" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label class="block font-semibold text-slate-700">Bio Summary</label>
            <textarea [(ngModel)]="editBio" rows="3" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700">CGPA</label>
              <input type="number" step="0.01" [(ngModel)]="editCgpa" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700">Phone</label>
              <input [(ngModel)]="editPhone" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>
          <div>
            <label class="block font-semibold text-slate-700">GitHub Profile URL</label>
            <input [(ngModel)]="editGithub" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label class="block font-semibold text-slate-700">LinkedIn URL</label>
            <input [(ngModel)]="editLinkedin" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label class="block font-semibold text-slate-700">Portfolio URL</label>
            <input [(ngModel)]="editPortfolio" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button (click)="showEditModal.set(false)" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button (click)="saveEditProfile()" class="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
            Save Changes
          </button>
        </div>
      </div>
    </div>

    <!-- Complete / Update Task Modal -->
    <div *ngIf="selectedTaskForUpdate" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-base font-bold text-slate-900">Task Submission & Score</h3>
          <button (click)="selectedTaskForUpdate = null" class="p-1 text-slate-400 hover:text-slate-600">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <span class="text-slate-400 uppercase font-bold text-[10px]">Task</span>
            <div class="font-bold text-slate-900 text-sm mt-0.5">{{ selectedTaskForUpdate.title }}</div>
          </div>
          <div>
            <label class="block font-semibold text-slate-700">Status</label>
            <select [(ngModel)]="updateTaskStatusValue" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white">
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-700">Assessment Score (0 - 100)</label>
            <input type="number" min="0" max="100" [(ngModel)]="updateTaskScore" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 font-bold" />
          </div>
          <div>
            <label class="block font-semibold text-slate-700">Submission Notes & Solution URL</label>
            <textarea [(ngModel)]="updateTaskNotes" rows="3" placeholder="Paste GitHub link, test result notes, or approach summary..." class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200"></textarea>
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button (click)="selectedTaskForUpdate = null" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button (click)="submitTaskUpdate()" class="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">Save Submission</button>
        </div>
      </div>
    </div>

    <!-- Add Custom Task Modal -->
    <div *ngIf="showAddTaskModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-base font-bold text-slate-900">Add Company Preparation Task</h3>
          <button (click)="showAddTaskModal.set(false)" class="p-1 text-slate-400 hover:text-slate-600">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700">Associated Company *</label>
            <select [(ngModel)]="newTaskCompanyId" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white">
              <option *ngFor="let app of studentApplications()" [value]="app.companyId">{{ app.companyName }} ({{ app.jobTitle }})</option>
              <option value="comp-1">Google</option>
              <option value="comp-2">Microsoft</option>
              <option value="comp-3">Amazon</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-700">Task Title *</label>
            <input [(ngModel)]="newTaskTitle" placeholder="e.g. Dynamic Programming & Tree Traversal Simulation" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
          </div>
          <div>
            <label class="block font-semibold text-slate-700">Description</label>
            <textarea [(ngModel)]="newTaskDesc" placeholder="Task requirements, practice links, or problem statements..." rows="2" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700">Category</label>
              <select [(ngModel)]="newTaskCategory" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white">
                <option value="Coding">Coding</option>
                <option value="Aptitude">Aptitude</option>
                <option value="Technical Interview">Technical Interview</option>
                <option value="HR Interview">HR Interview</option>
                <option value="Core Subject">Core Subject</option>
                <option value="System Design">System Design</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700">Priority</label>
              <select [(ngModel)]="newTaskPriority" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white">
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block font-semibold text-slate-700">Target Skill to Bridge</label>
            <input [(ngModel)]="newTaskTargetSkill" placeholder="e.g. Docker / Redis / System Architecture" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button (click)="showAddTaskModal.set(false)" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button (click)="saveNewTask()" class="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs">Create Task</button>
        </div>
      </div>
    </div>

    <!-- Add Project Modal -->
    <div *ngIf="showAddProjectModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-lg font-bold text-slate-900">Add New Project</h3>
          <button (click)="showAddProjectModal.set(false)" class="p-1 text-slate-400 hover:text-slate-600">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700">Project Title</label>
            <input [(ngModel)]="newProjTitle" placeholder="e.g. Distributed Cache Engine" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
          </div>
          <div>
            <label class="block font-semibold text-slate-700">Description</label>
            <textarea [(ngModel)]="newProjDesc" placeholder="Brief summary of architecture, scale, and problem solved..." rows="3" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200"></textarea>
          </div>
          <div>
            <label class="block font-semibold text-slate-700">Technologies (Comma separated)</label>
            <input [(ngModel)]="newProjTech" placeholder="e.g. Go, Redis, Docker, gRPC" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700">GitHub URL</label>
              <input [(ngModel)]="newProjGithub" placeholder="https://github.com/..." class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700">Live Demo URL</label>
              <input [(ngModel)]="newProjLive" placeholder="https://..." class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
            </div>
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button (click)="showAddProjectModal.set(false)" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button (click)="saveNewProject()" class="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs">Add Project</button>
        </div>
      </div>
    </div>

    <!-- Add Certification Modal -->
    <div *ngIf="showAddCertModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-base font-bold text-slate-900">Add Industry Certification</h3>
          <button (click)="showAddCertModal.set(false)" class="p-1 text-slate-400 hover:text-slate-600">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700">Certificate Name</label>
            <input [(ngModel)]="newCertTitle" placeholder="e.g. AWS Certified Solutions Architect" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
          </div>
          <div>
            <label class="block font-semibold text-slate-700">Issuing Authority</label>
            <input [(ngModel)]="newCertIssuer" placeholder="e.g. Amazon Web Services" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
          </div>
          <div>
            <label class="block font-semibold text-slate-700">Issue Date / Year</label>
            <input [(ngModel)]="newCertDate" placeholder="e.g. 2026" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button (click)="showAddCertModal.set(false)" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button (click)="saveNewCertification()" class="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs">Save Credential</button>
        </div>
      </div>
    </div>

    <!-- Modal: Company Skill Match Deep Dive Analysis -->
    <div *ngIf="selectedAnalysisMatch()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <!-- Modal Header -->
        <div class="flex items-start justify-between pb-4 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <img
              *ngIf="selectedAnalysisMatch()?.companyLogo"
              [src]="selectedAnalysisMatch()?.companyLogo"
              (error)="onLogoError($event, selectedAnalysisMatch()?.companyName || 'Company')"
              class="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
            />
            <div>
              <div class="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Company Skill Match Analysis</div>
              <h3 class="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {{ selectedAnalysisMatch()?.companyName }} — {{ selectedAnalysisMatch()?.jobTitle }}
              </h3>
              <p class="text-xs text-slate-500 font-semibold">{{ selectedAnalysisMatch()?.salary }}</p>
            </div>
          </div>
          <button
            type="button"
            (click)="closeSkillAnalysisModal()"
            class="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <!-- Match Score Bar -->
        <div *ngIf="selectedAnalysisMatch()?.matchPercentage !== null" class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-700">Calculated Skill Match</span>
            <span
              class="text-base font-black"
              [ngClass]="(selectedAnalysisMatch()?.matchPercentage || 0) >= 75 ? 'text-emerald-700' : 'text-blue-700'"
            >
              {{ selectedAnalysisMatch()?.matchPercentage }}% Match
            </span>
          </div>
          <div class="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              [ngClass]="(selectedAnalysisMatch()?.matchPercentage || 0) >= 75 ? 'bg-emerald-500' : 'bg-blue-600'"
              [style.width]="selectedAnalysisMatch()?.matchPercentage + '%'"
            ></div>
          </div>
          <div class="text-[11px] text-slate-500 flex items-center justify-between">
            <span>{{ selectedAnalysisMatch()?.matchedSkills?.length }} Matched Skills</span>
            <span>{{ selectedAnalysisMatch()?.missingSkills?.length }} Missing Requirements</span>
          </div>
        </div>

        <div *ngIf="selectedAnalysisMatch()?.matchPercentage === null" class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
          {{ selectedAnalysisMatch()?.statusMessage }}
        </div>

        <!-- Matched vs Missing Skill Breakdown Grid -->
        <div class="space-y-4">
          <!-- Matched Section -->
          <div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <h4 class="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <app-icon name="check-circle" [size]="14" customClass="text-emerald-600"></app-icon>
              Satisfied Requirements ({{ selectedAnalysisMatch()?.matchedSkills?.length || 0 }})
            </h4>
            <div class="flex flex-wrap gap-1.5">
              <span
                *ngFor="let sk of selectedAnalysisMatch()?.matchedSkills"
                class="px-2.5 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold shadow-xs"
              >
                ✓ {{ sk }}
              </span>
              <span *ngIf="selectedAnalysisMatch()?.matchedSkills?.length === 0" class="text-xs text-slate-500 italic">No direct matches.</span>
            </div>
          </div>

          <!-- Missing Section -->
          <div class="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
            <h4 class="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
              <app-icon name="alert-triangle" [size]="14" customClass="text-rose-600"></app-icon>
              Missing Requirements ({{ selectedAnalysisMatch()?.missingSkills?.length || 0 }})
            </h4>
            <div class="flex flex-wrap gap-1.5">
              <span
                *ngFor="let sk of selectedAnalysisMatch()?.missingSkills"
                class="px-2.5 py-1 rounded-xl bg-white border border-rose-300 text-rose-800 text-xs font-bold shadow-xs"
              >
                ⚠ {{ sk }}
              </span>
              <span *ngIf="selectedAnalysisMatch()?.missingSkills?.length === 0" class="text-xs text-emerald-700 font-bold">🎉 Full skill criteria satisfied!</span>
            </div>
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="pt-4 flex items-center justify-between border-t border-slate-100">
          <span class="text-xs text-slate-400">Application Stage: <strong class="text-slate-700">{{ selectedAnalysisMatch()?.applicationStatus }}</strong></span>
          <button
            type="button"
            (click)="closeSkillAnalysisModal()"
            class="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  `
})
export class StudentProfileComponent {
  studentService = inject(StudentService);
  applicationService = inject(ApplicationService);
  jobService = inject(JobService);
  taskService = inject(TaskService);
  skillMatchingService = inject(SkillMatchingService);

  student = this.studentService.currentStudent;
  studentApplications = this.applicationService.studentApplications;

  // Phase 1: Company Skill Match Overview (Dynamic calculation from DB)
  companySkillMatchOverview = computed(() => {
    return this.skillMatchingService.getStudentCompanySkillMatches(this.student(), this.studentApplications());
  });

  selectedAnalysisMatch = signal<SingleJobSkillMatch | null>(null);

  openSkillAnalysisModal(match: SingleJobSkillMatch) {
    this.selectedAnalysisMatch.set(match);
  }

  closeSkillAnalysisModal() {
    this.selectedAnalysisMatch.set(null);
  }

  studentTasks = computed(() => {
    const s = this.student();
    return this.taskService.getTasksForStudent(s.id || s.userId);
  });

  taskFilter = signal<'all' | 'pending' | 'completed'>('all');

  filteredTasks = computed(() => {
    const tasks = this.studentTasks();
    const filter = this.taskFilter();
    if (filter === 'pending') {
      return tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress');
    }
    if (filter === 'completed') {
      return tasks.filter(t => t.status === 'Completed');
    }
    return tasks;
  });

  pendingTaskCount = computed(() => this.studentTasks().filter(t => t.status === 'Pending' || t.status === 'In Progress').length);
  completedTaskCount = computed(() => this.studentTasks().filter(t => t.status === 'Completed').length);

  // Skill Gap Analysis computed
  skillGap = computed(() => {
    const appliedJobs = this.studentApplications()
      .map(a => this.jobService.getJobById(a.jobId))
      .filter((j): j is any => !!j);
    return this.taskService.calculateSkillGapAnalysis(this.student(), appliedJobs);
  });

  // Placement Readiness metrics computed
  readiness = computed(() => {
    const appliedJobs = this.studentApplications()
      .map(a => this.jobService.getJobById(a.jobId))
      .filter((j): j is any => !!j);
    return this.taskService.calculatePlacementReadiness(
      this.student(),
      this.studentApplications(),
      appliedJobs,
      this.studentTasks()
    );
  });

  // Company-wise performance breakdown computed
  companyPerformances = computed(() => {
    return this.taskService.calculateCompanyPerformance(
      this.student(),
      this.studentApplications(),
      this.jobService.jobs(),
      this.studentTasks()
    );
  });

  // Modal Signals
  showEditModal = signal(false);
  showAddProjectModal = signal(false);
  showAddCertModal = signal(false);
  showAddTaskModal = signal(false);
  isUploadingResume = signal(false);

  // Edit fields
  editName = '';
  editBio = '';
  editCgpa = 0;
  editPhone = '';
  editGithub = '';
  editLinkedin = '';
  editPortfolio = '';

  // Project fields
  newProjTitle = '';
  newProjDesc = '';
  newProjTech = '';
  newProjGithub = '';
  newProjLive = '';

  // Cert fields
  newCertTitle = '';
  newCertIssuer = '';
  newCertDate = '';

  // New Task fields
  newTaskCompanyId = 'comp-1';
  newTaskTitle = '';
  newTaskDesc = '';
  newTaskCategory: TaskCategory = 'Coding';
  newTaskPriority: TaskPriority = 'High';
  newTaskTargetSkill = '';

  // Task Update Modal State
  selectedTaskForUpdate: StudentTask | null = null;
  updateTaskStatusValue: TaskStatus = 'Completed';
  updateTaskScore = 95;
  updateTaskNotes = '';

  openEditModal() {
    const s = this.student();
    this.editName = s.fullName;
    this.editBio = s.bio;
    this.editCgpa = s.cgpa;
    this.editPhone = s.phone;
    this.editGithub = s.githubUrl;
    this.editLinkedin = s.linkedinUrl;
    this.editPortfolio = s.portfolioUrl;
    this.showEditModal.set(true);
  }

  async saveEditProfile() {
    await this.studentService.updateCurrentStudentProfile({
      fullName: this.editName,
      bio: this.editBio,
      cgpa: this.editCgpa,
      phone: this.editPhone,
      githubUrl: this.editGithub,
      linkedinUrl: this.editLinkedin,
      portfolioUrl: this.editPortfolio
    });
    this.showEditModal.set(false);
  }

  openCompleteTaskModal(task: StudentTask) {
    this.selectedTaskForUpdate = task;
    this.updateTaskStatusValue = 'Completed';
    this.updateTaskScore = task.score !== undefined ? task.score : 90;
    this.updateTaskNotes = task.submissionNotes || '';
  }

  async submitTaskUpdate() {
    if (!this.selectedTaskForUpdate) return;
    await this.taskService.updateTaskStatus(
      this.selectedTaskForUpdate.id,
      this.updateTaskStatusValue,
      this.updateTaskScore,
      this.updateTaskNotes
    );
    this.selectedTaskForUpdate = null;
  }

  async saveNewTask() {
    if (!this.newTaskTitle) return;
    const company = this.jobService.jobs().find(j => j.companyId === this.newTaskCompanyId);
    await this.taskService.addTask({
      studentId: this.student().id || this.student().userId,
      companyId: this.newTaskCompanyId,
      companyName: company?.companyName || 'Google',
      companyLogo: company?.companyLogo,
      jobId: company?.id || 'job-1',
      jobTitle: company?.title || 'Software Development Engineer',
      title: this.newTaskTitle,
      description: this.newTaskDesc || 'Preparation challenge for upcoming campus drive.',
      category: this.newTaskCategory,
      priority: this.newTaskPriority,
      status: 'Pending',
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      estimatedMinutes: 60,
      maxScore: 100,
      requiredSkillTarget: this.newTaskTargetSkill
    });

    this.newTaskTitle = '';
    this.newTaskDesc = '';
    this.newTaskTargetSkill = '';
    this.showAddTaskModal.set(false);
  }

  async saveNewProject() {
    if (!this.newProjTitle) return;
    const techs = this.newProjTech.split(',').map(t => t.trim()).filter(Boolean);
    await this.studentService.addProject({
      title: this.newProjTitle,
      description: this.newProjDesc,
      technologies: techs.length > 0 ? techs : ['TypeScript', 'Node.js'],
      githubUrl: this.newProjGithub,
      liveUrl: this.newProjLive
    });
    this.newProjTitle = '';
    this.newProjDesc = '';
    this.newProjTech = '';
    this.showAddProjectModal.set(false);
  }

  async saveNewCertification() {
    if (!this.newCertTitle) return;
    await this.studentService.addCertification({
      title: this.newCertTitle,
      issuer: this.newCertIssuer || 'Industry Provider',
      issueDate: this.newCertDate || '2026'
    });
    this.newCertTitle = '';
    this.newCertIssuer = '';
    this.newCertDate = '';
    this.showAddCertModal.set(false);
  }

  async handleResumeUpload(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.isUploadingResume.set(true);
      try {
        await this.studentService.uploadResumeFile(file);
      } finally {
        this.isUploadingResume.set(false);
      }
    }
  }

  downloadResume() {
    const s = this.student();
    if (s.resumeUrl && s.resumeUrl.startsWith('http')) {
      window.open(s.resumeUrl, '_blank');
      return;
    }

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      s.resumeUrl ||
        'data:text/plain;charset=utf-8,' +
          encodeURIComponent(
            `CareerNexus Verified ATS Resume\nName: ${s.fullName}\nRoll: ${s.rollNumber}\nDepartment: ${s.department}\nCGPA: ${s.cgpa}\nSkills: ${s.skills.join(', ')}`
          )
    );
    element.setAttribute('download', s.resumeFileName || `${s.rollNumber}_Resume.pdf`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  onImgError(event: Event, name: string) {
    const target = event.target as HTMLImageElement;
    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Student')}&background=2563eb&color=fff&bold=true`;
  }

  onLogoError(event: Event, companyName: string) {
    const target = event.target as HTMLImageElement;
    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName || 'Company')}&background=475569&color=fff&bold=true`;
  }
}
