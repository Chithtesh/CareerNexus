import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StudentService } from '../../../core/services/student.service';
import { CompanyService } from '../../../core/services/company.service';
import { JobService } from '../../../core/services/job.service';
import { ApplicationService } from '../../../core/services/application.service';
import { SkillMatchingService } from '../../../core/services/skill-matching.service';
import { CommandCenterService } from '../../../core/services/command-center.service';
import { IconComponent } from '../../../shared/icons/icon.component';
import { StatCardComponent } from '../../../shared/ui/stat-card.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconComponent,
    StatCardComponent
  ],
  template: `
    <div class="space-y-8 animate-in fade-in duration-300">
      <!-- Top Admin Banner -->
      <div class="bg-linear-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-950/20 relative overflow-hidden">
        <div class="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Placement Season 2026–2027 Live
            </span>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Placement Analytics & Officer Command
            </h1>
            <p class="text-slate-300 text-sm sm:text-base mt-1.5 max-w-xl leading-relaxed">
              Monitoring {{ studentService.students().length }} registered graduating engineers, {{ companyService.companies().length }} partner companies, and {{ jobService.jobs().length }} active placement drives across departments.
            </p>
          </div>

          <div class="flex flex-wrap gap-2.5">
            <a
              routerLink="/admin/command-center"
              class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center gap-2 transition-all"
            >
              <app-icon name="grid" [size]="16"></app-icon>
              <span>Command Center</span>
            </a>
            <a
              routerLink="/admin/applications"
              class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-all"
            >
              Applicant Pipeline
            </a>
            <a
              routerLink="/admin/jobs"
              class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all"
            >
              + Post New Drive
            </a>
          </div>
        </div>
      </div>

      <!-- 4 Core High-Level Stat Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <app-stat-card
          title="Total Students"
          [value]="studentService.stats().total"
          icon="users"
          [subtitle]="studentService.stats().selected + ' Students Placed'"
          color="blue"
        ></app-stat-card>

        <app-stat-card
          title="Placement Rate"
          [value]="placementRate() + '%'"
          icon="award"
          subtitle="Placed / Offers Received"
          trend="+12% YoY"
          color="emerald"
        ></app-stat-card>

        <app-stat-card
          title="Average CTC"
          [value]="averageCtc()"
          icon="trending-up"
          subtitle="Campus Highest: ₹45 LPA"
          color="purple"
        ></app-stat-card>

        <app-stat-card
          title="Recruiting Companies"
          [value]="companyService.companies().length"
          icon="building"
          [subtitle]="companyService.companies().length + ' Active Partners'"
          color="cyan"
        ></app-stat-card>
      </div>

      <!-- Interactive Placement Analytics Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Chart 1: Applications Stage Pipeline Funnel (100% Dynamic) -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-slate-900">Application Pipeline Funnel</h3>
              <p class="text-xs text-slate-500">Student advancement across recruitment rounds</p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">Live Funnel</span>
          </div>

          <!-- Dynamic Visual Bar Chart -->
          <div class="space-y-3 pt-2">
            <div *ngFor="let stage of funnel().slice(2)" class="space-y-1">
              <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>{{ stage.name }}</span>
                <span class="text-blue-600 font-bold">{{ stage.count }} ({{ stage.percentageOfTotal }}%)</span>
              </div>
              <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-linear-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500" [style.width]="stage.percentageOfTotal + '%'"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chart 2: Department-wise Placement Distribution (100% Dynamic) -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-slate-900">Department Placement Performance</h3>
              <p class="text-xs text-slate-500">Placement conversion rate across engineering branches</p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">Live Dept Insights</span>
          </div>

          <div class="space-y-3.5 pt-2">
            <div *ngFor="let dept of deptStats().slice(0, 5)" class="space-y-1">
              <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span class="truncate max-w-[200px]">{{ dept.department }}</span>
                <span class="text-slate-900 font-bold">{{ dept.placedCount }}/{{ dept.totalStudents }} ({{ dept.placementRate }}%)</span>
              </div>
              <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-linear-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500" [style.width]="dept.placementRate + '%'"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Hiring Partners & Quick Actions Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Top Recruiters (2 Cols) -->
        <div class="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-slate-900">Top Campus Hiring Partners</h3>
            <a routerLink="/admin/companies" class="text-xs font-semibold text-blue-600 hover:underline">
              View All Partners →
            </a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              *ngFor="let comp of companyService.companies().slice(0, 4)"
              class="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
            >
              <div class="flex items-center gap-3 min-w-0">
                <img [src]="comp.logo" [alt]="comp.name" class="w-11 h-11 rounded-xl object-cover border border-slate-200" />
                <div class="min-w-0">
                  <h4 class="text-xs font-bold text-slate-900 truncate">{{ comp.name }}</h4>
                  <span class="text-[11px] text-slate-500 font-medium">{{ comp.averagePackage }}</span>
                </div>
              </div>
              <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                {{ comp.placedStudentsCount || 8 }} Selected
              </span>
            </div>
          </div>
        </div>

        <!-- Quick Admin Management Shortlinks (1 Col) -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <h3 class="text-base font-bold text-slate-900">Officer Operations</h3>
          <div class="space-y-2">
            <a
              routerLink="/admin/students"
              class="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-blue-700 transition-colors"
            >
              <span>Manage 100+ Students & Verify Resumes</span>
              <app-icon name="chevron-right" [size]="14"></app-icon>
            </a>

            <a
              routerLink="/admin/analytics"
              class="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-blue-700 transition-colors"
            >
              <span>Deep-Dive Placement & Skill Analytics</span>
              <app-icon name="chevron-right" [size]="14"></app-icon>
            </a>

            <a
              routerLink="/admin/jobs"
              class="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-blue-700 transition-colors"
            >
              <span>Schedule Company Placement Drive</span>
              <app-icon name="chevron-right" [size]="14"></app-icon>
            </a>
          </div>
        </div>
      </div>

      <!-- Phase 1: Institutional Skill Demand & Gap Analytics Bar -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Institutional Skill Analysis
              </span>
              <h3 class="text-base font-bold text-slate-900">Most Demanded Skills & Common Campus Skill Gaps</h3>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Derived dynamically from {{ skillAnalytics().applicationsAnalyzed }} applications across {{ studentService.students().length }} enrolled candidates.
            </p>
          </div>
          <a routerLink="/admin/analytics" class="text-xs font-bold text-blue-600 hover:underline">
            View Analytics Dashboard →
          </a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Most Demanded Skills -->
          <div class="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-900 block">
              🔥 Most Demanded Skills (Hiring Partners)
            </span>
            <div class="flex flex-wrap gap-1.5">
              <span
                *ngFor="let sk of skillAnalytics().mostDemandedSkills.slice(0, 5)"
                class="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-xs font-bold shadow-2xs"
              >
                {{ sk.skill }} <span class="text-[10px] text-emerald-600 font-normal">({{ sk.jobCount }} drives)</span>
              </span>
            </div>
          </div>

          <!-- Common Skill Gaps -->
          <div class="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2">
            <span class="text-xs font-bold uppercase tracking-wider text-rose-900 block">
              ⚡ Most Common Student Skill Gaps
            </span>
            <div class="flex flex-wrap gap-1.5">
              <span
                *ngFor="let sk of skillAnalytics().mostCommonSkillGaps.slice(0, 5)"
                class="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-800 text-xs font-bold shadow-2xs"
              >
                {{ sk.skill }} <span class="text-[10px] text-rose-600 font-normal">({{ sk.missingInApplicationsCount }} gaps)</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent {
  studentService = inject(StudentService);
  companyService = inject(CompanyService);
  jobService = inject(JobService);
  applicationService = inject(ApplicationService);
  skillMatchingService = inject(SkillMatchingService);
  commandService = inject(CommandCenterService);

  skillAnalytics = computed(() => this.skillMatchingService.getAdminSkillAnalytics());
  funnel = this.commandService.placementFunnel;
  deptStats = this.commandService.departmentAnalytics;

  placementRate = computed(() => {
    const list = this.studentService.students();
    if (list.length === 0) return 0;
    const placed = list.filter(s => s.placementStatus === 'Selected' || s.placementStatus === 'Offer Accepted').length;
    return Math.round((placed / list.length) * 100);
  });

  averageCtc = computed(() => {
    const jobs = this.jobService.jobs();
    const comps = this.companyService.companies();
    const values: number[] = [];

    jobs.forEach(j => {
      const match = j.salary?.match(/(\d+(\.\d+)?)/g);
      if (match) {
        match.forEach(m => {
          const val = parseFloat(m);
          if (val > 0 && val < 200) values.push(val);
        });
      }
    });

    if (values.length === 0) {
      comps.forEach(c => {
        const match = c.averagePackage?.match(/(\d+(\.\d+)?)/g);
        if (match) {
          match.forEach(m => {
            const val = parseFloat(m);
            if (val > 0 && val < 200) values.push(val);
          });
        }
      });
    }

    if (values.length === 0) return '₹0.0 LPA';
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    return `₹${avg.toFixed(1)} LPA`;
  });
}
