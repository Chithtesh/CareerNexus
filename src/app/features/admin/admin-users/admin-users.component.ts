import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../../core/services/student.service';
import { AlumniService } from '../../../core/services/alumni.service';
import { AdminUserService, NewStudentForm, NewAlumniForm } from '../../../core/services/admin-user.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { JobService } from '../../../core/services/job.service';
import { TaskService } from '../../../core/services/task.service';
import { CsvImportService, CsvParseResult } from '../../../core/services/csv-import.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { ToastService } from '../../../core/services/toast.service';
import { Student, PlacementStatus } from '../../../core/models/student.model';
import { Alumni } from '../../../core/models/alumni.model';
import { Router } from '@angular/router';
import { User, UserRole } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { Department, Program, Subject, SyllabusUnit, CourseType, Batch, DepartmentStudentYearDistribution, DepartmentPlacementMetrics, DepartmentCompanyRecruiterRelation } from '../../../core/models/organization.model';
import { AdminAuditLog } from '../../../core/models/audit-log.model';
import { Application } from '../../../core/models/application.model';
import { StudentTask, PlacementReadinessMetrics, SkillGapAnalysis } from '../../../core/models/task.model';
import { IconComponent } from '../../../shared/icons/icon.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';

type AdminTab = 'users' | 'students' | 'alumni' | 'import' | 'departments' | 'batches' | 'audit_logs';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, BadgeComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      <!-- Top Title & Navigation Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>User Management & Organization</span>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Admin Hub
            </span>
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Manage student rosters, alumni mentors, dynamic academic departments, batches, bulk CSV imports, and audit logs.
          </p>
        </div>

        <!-- Quick Action CTAs -->
        <div class="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            (click)="activeTab.set('import')"
            class="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <app-icon name="upload" [size]="16" customClass="text-blue-600"></app-icon>
            Bulk CSV Import
          </button>
          <button
            *ngIf="activeTab() === 'students'"
            type="button"
            (click)="openAddStudentModal()"
            class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <app-icon name="user-plus" [size]="16"></app-icon>
            + Enroll Student
          </button>
          <button
            *ngIf="activeTab() === 'alumni'"
            type="button"
            (click)="openAddAlumniModal()"
            class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all hover:scale-[1.02]"
          >
            <app-icon name="user-plus" [size]="16"></app-icon>
            + Register Alumni
          </button>
          <button
            *ngIf="activeTab() === 'departments'"
            type="button"
            (click)="openAddDepartmentModal()"
            class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
          >
            <app-icon name="building" [size]="16"></app-icon>
            + New Department
          </button>
          <button
            *ngIf="activeTab() === 'batches'"
            type="button"
            (click)="openAddBatchModal()"
            class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <app-icon name="calendar" [size]="16"></app-icon>
            + New Batch
          </button>
        </div>
      </div>

      <!-- Main Navigation Tabs -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs custom-scrollbar">
        <button
          type="button"
          (click)="activeTab.set('users')"
          class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer"
          [ngClass]="activeTab() === 'users' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <app-icon name="shield" [size]="15"></app-icon>
          <span>System Users & Roles ({{ adminUserService.users().length }})</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('students')"
          class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all"
          [ngClass]="activeTab() === 'students' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <app-icon name="users" [size]="15"></app-icon>
          <span>Students Directory ({{ studentService.students().length }})</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('alumni')"
          class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all"
          [ngClass]="activeTab() === 'alumni' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <app-icon name="graduation-cap" [size]="15"></app-icon>
          <span>Alumni Mentors ({{ alumniService.alumni().length }})</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('import')"
          class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all"
          [ngClass]="activeTab() === 'import' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <app-icon name="upload" [size]="15"></app-icon>
          <span>Bulk CSV Import</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('departments')"
          class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all"
          [ngClass]="activeTab() === 'departments' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <app-icon name="building" [size]="15"></app-icon>
          <span>Departments & Programs ({{ orgService.departments().length }})</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('batches')"
          class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all"
          [ngClass]="activeTab() === 'batches' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <app-icon name="calendar" [size]="15"></app-icon>
          <span>Batches & Years ({{ orgService.batches().length }})</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('audit_logs')"
          class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all"
          [ngClass]="activeTab() === 'audit_logs' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <app-icon name="shield" [size]="15"></app-icon>
          <span>Audit Logs ({{ auditLogService.logs().length }})</span>
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 0: SYSTEM USERS & ROLE MANAGEMENT (Zero Data Loss) -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab() === 'users'" class="space-y-4">
        <!-- Role Statistics Summary Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg">
              👥
            </div>
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Users</span>
              <span class="text-xl font-black text-slate-900 leading-none">{{ adminUserService.users().length }}</span>
            </div>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg">
              🎓
            </div>
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-blue-600 block">Students</span>
              <span class="text-xl font-black text-blue-950 leading-none">{{ userCountByRole('student') }}</span>
            </div>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-lg">
              💼
            </div>
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-purple-600 block">Alumni</span>
              <span class="text-xl font-black text-purple-950 leading-none">{{ userCountByRole('alumni') }}</span>
            </div>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-lg">
              🏢
            </div>
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">Recruiters</span>
              <span class="text-xl font-black text-indigo-950 leading-none">{{ userCountByRole('recruiter') }}</span>
            </div>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg">
              ⚡
            </div>
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">Admins</span>
              <span class="text-xl font-black text-emerald-950 leading-none">{{ userCountByRole('admin') }}</span>
            </div>
          </div>
        </div>

        <!-- Filter & Search Controls -->
        <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="relative lg:col-span-2">
              <app-icon name="search" [size]="18" customClass="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
              <input
                type="text"
                [ngModel]="userSearch()"
                (ngModelChange)="userSearch.set($event); userPageIndex.set(1)"
                placeholder="Search user by name, email, department, company..."
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
              />
            </div>

            <div>
              <select
                [ngModel]="userRoleFilter()"
                (ngModelChange)="userRoleFilter.set($event); userPageIndex.set(1)"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
              >
                <option value="all">All Roles (All {{ adminUserService.users().length }})</option>
                <option value="student">🎓 Students ({{ userCountByRole('student') }})</option>
                <option value="alumni">💼 Alumni Mentors ({{ userCountByRole('alumni') }})</option>
                <option value="recruiter">🏢 Corporate Recruiters ({{ userCountByRole('recruiter') }})</option>
                <option value="admin">⚡ Placement Admins ({{ userCountByRole('admin') }})</option>
              </select>
            </div>

            <div>
              <select
                [ngModel]="userStatusFilter()"
                (ngModelChange)="userStatusFilter.set($event); userPageIndex.set(1)"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="deactivated">Deactivated Only</option>
              </select>
            </div>

            <div *ngIf="userSearch() || userRoleFilter() !== 'all' || userStatusFilter() !== 'all'" class="sm:col-span-3 flex justify-end">
              <button
                type="button"
                (click)="clearUserFilters()"
                class="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
              >
                Reset User Filters
              </button>
            </div>
          </div>
        </div>

        <!-- Users Table -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 font-bold uppercase tracking-wider text-[10.5px]">
                <tr>
                  <th class="py-3.5 px-4">User</th>
                  <th class="py-3.5 px-4">Assigned Role</th>
                  <th class="py-3.5 px-4">Affiliation / Dept</th>
                  <th class="py-3.5 px-4">Status</th>
                  <th class="py-3.5 px-4">Joined Date</th>
                  <th class="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let u of paginatedUsers()" class="hover:bg-slate-50/70 transition-colors">
                  <!-- User Column -->
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                      <img
                        [src]="u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'"
                        class="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div class="min-w-0">
                        <div class="font-bold text-slate-900 truncate flex items-center gap-1.5">
                          <span>{{ u.fullName }}</span>
                          <span *ngIf="u.id === authService.currentUser()?.id" class="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-100 text-amber-800 border border-amber-200">YOU</span>
                        </div>
                        <div class="text-[11px] text-slate-500 truncate">{{ u.email }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Role Column -->
                  <td class="py-3 px-4">
                    <span
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border"
                      [ngClass]="{
                        'bg-blue-50 text-blue-800 border-blue-200': u.role === 'student',
                        'bg-purple-50 text-purple-800 border-purple-200': u.role === 'alumni',
                        'bg-indigo-50 text-indigo-800 border-indigo-200': u.role === 'recruiter',
                        'bg-emerald-50 text-emerald-800 border-emerald-200': u.role === 'admin'
                      }"
                    >
                      <span>{{ getRoleEmoji(u.role) }}</span>
                      <span class="capitalize">{{ u.role }}</span>
                    </span>
                  </td>

                  <!-- Affiliation / Dept -->
                  <td class="py-3 px-4 text-slate-600 font-medium">
                    <div *ngIf="u.department" class="truncate max-w-[200px]">{{ u.department }}</div>
                    <div *ngIf="u.company" class="text-[11px] text-slate-500 truncate">{{ u.designation ? u.designation + ' @ ' : '' }}{{ u.company }}</div>
                    <div *ngIf="!u.department && !u.company" class="text-slate-400 italic">Central Administration</div>
                  </td>

                  <!-- Status -->
                  <td class="py-3 px-4">
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                      [ngClass]="u.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="u.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                      {{ u.isActive !== false ? 'Active' : 'Deactivated' }}
                    </span>
                  </td>

                  <!-- Joined Date -->
                  <td class="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {{ u.createdAt | date:'mediumDate' }}
                  </td>

                  <!-- Actions -->
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        (click)="openEditRoleModal(u)"
                        class="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:scale-[1.02]"
                        title="Modify User Role & Permissions"
                      >
                        <app-icon name="shield" [size]="13"></app-icon>
                        <span>Change Role</span>
                      </button>

                      <button
                        type="button"
                        (click)="toggleUserActivation(u)"
                        class="p-1.5 rounded-xl transition-colors cursor-pointer"
                        [ngClass]="u.isActive !== false ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'"
                        [title]="u.isActive !== false ? 'Deactivate account' : 'Reactivate account'"
                      >
                        <app-icon [name]="u.isActive !== false ? 'user-x' : 'user-check'" [size]="15"></app-icon>
                      </button>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="paginatedUsers().length === 0">
                  <td colspan="6" class="py-12 text-center text-slate-400">
                    <div class="flex flex-col items-center gap-2">
                      <app-icon name="users" [size]="32" customClass="text-slate-300"></app-icon>
                      <p class="font-bold text-slate-600">No users match your criteria.</p>
                      <p class="text-xs text-slate-400">Try adjusting your search terms or role filters.</p>
                      <button
                        *ngIf="userSearch() || userRoleFilter() !== 'all' || userStatusFilter() !== 'all'"
                        type="button"
                        (click)="clearUserFilters()"
                        class="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <div *ngIf="filteredUsers().length > userPageSize" class="p-4 bg-slate-50/70 border-t border-slate-200/70 flex items-center justify-between">
            <span class="text-xs text-slate-500">
              Showing {{ (userPageIndex() - 1) * userPageSize + 1 }} to {{ Math.min(userPageIndex() * userPageSize, filteredUsers().length) }} of {{ filteredUsers().length }} users
            </span>
            <div class="flex items-center gap-1">
              <button
                type="button"
                [disabled]="userPageIndex() === 1"
                (click)="userPageIndex.set(userPageIndex() - 1)"
                class="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
              >
                Prev
              </button>
              <span class="px-2 text-xs font-bold text-slate-700">Page {{ userPageIndex() }} of {{ userTotalPages }}</span>
              <button
                type="button"
                [disabled]="userPageIndex() >= userTotalPages"
                (click)="userPageIndex.set(userPageIndex() + 1)"
                class="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 1: STUDENTS DIRECTORY & MANAGEMENT -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab() === 'students'" class="space-y-4">
        <!-- Search, Department, Status, and Pagination Bar -->
        <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="relative lg:col-span-2">
              <app-icon name="search" [size]="18" customClass="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
              <input
                type="text"
                [ngModel]="studentSearch()"
                (ngModelChange)="studentSearch.set($event); studentPageIndex.set(1)"
                placeholder="Search by name, roll number, email, skills..."
                class="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <select
                [ngModel]="studentDeptFilter()"
                (ngModelChange)="studentDeptFilter.set($event); studentPageIndex.set(1)"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value="all">All Departments ({{ orgService.departments().length }})</option>
                <option *ngFor="let d of orgService.departments()" [value]="d.name">{{ d.name }} ({{ d.code }})</option>
              </select>
            </div>

            <div>
              <select
                [ngModel]="studentStatusFilter()"
                (ngModelChange)="studentStatusFilter.set($event); studentPageIndex.set(1)"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value="all">All Placement Statuses</option>
                <option value="Selected">Selected / Placed</option>
                <option value="In Progress">In Progress</option>
                <option value="Not Placed">Not Placed</option>
                <option value="Offer Accepted">Offer Accepted</option>
              </select>
            </div>
          </div>

          <!-- Secondary Filter Bar: Batch & Active Status Toggle -->
          <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
            <div class="flex items-center gap-3">
              <label class="font-semibold text-slate-600">Batch Filter:</label>
              <select [ngModel]="studentBatchFilter()" (ngModelChange)="studentBatchFilter.set($event); studentPageIndex.set(1)" class="px-2.5 py-1 rounded-lg border border-slate-200 bg-white">
                <option value="all">All Batches</option>
                <option *ngFor="let b of orgService.batches()" [value]="b.graduationYear">{{ b.name }} ({{ b.graduationYear }})</option>
              </select>
            </div>

            <div class="flex items-center gap-4 text-slate-500">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" [ngModel]="includeDeactivatedStudents()" (ngModelChange)="includeDeactivatedStudents.set($event); studentPageIndex.set(1)" class="rounded text-blue-600" />
                <span>Show Deactivated Accounts</span>
              </label>
              <span class="font-medium text-slate-700">Showing {{ paginatedStudents().length }} of {{ filteredStudents().length }} students</span>
            </div>
          </div>
        </div>

        <!-- Students Table -->
        <div *ngIf="filteredStudents().length > 0" class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th class="py-3.5 px-4 sm:px-6">Student Roster</th>
                  <th class="py-3.5 px-4">Department & Roll</th>
                  <th class="py-3.5 px-4">CGPA</th>
                  <th class="py-3.5 px-4">Placement Status</th>
                  <th class="py-3.5 px-4">Account Status</th>
                  <th class="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  *ngFor="let s of paginatedStudents()"
                  class="hover:bg-slate-50/70 transition-colors"
                  [ngClass]="{ 'opacity-60 bg-slate-50/40': s.isActive === false }"
                >
                  <!-- Student Avatar & Name -->
                  <td class="py-4 px-4 sm:px-6">
                    <div class="flex items-center gap-3">
                      <img [src]="s.profilePhoto" class="w-10 h-10 rounded-2xl object-cover border border-slate-200 shrink-0" />
                      <div class="min-w-0">
                        <div class="font-bold text-slate-900 truncate flex items-center gap-1.5">
                          <span>{{ s.fullName }}</span>
                          <span *ngIf="s.isActive === false" class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700">Deactivated</span>
                        </div>
                        <div class="text-[11px] text-slate-500 truncate">{{ s.email }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Branch & Roll -->
                  <td class="py-4 px-4">
                    <div class="font-semibold text-slate-800">{{ s.department }}</div>
                    <div class="text-[11px] text-slate-500 font-mono">{{ s.rollNumber }} • Grad {{ s.graduationYear }}</div>
                  </td>

                  <!-- CGPA -->
                  <td class="py-4 px-4">
                    <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-extrabold text-xs">
                      <app-icon name="award" [size]="13"></app-icon>
                      {{ s.cgpa.toFixed(2) }}
                    </div>
                  </td>

                  <!-- Placement Status -->
                  <td class="py-4 px-4">
                    <app-badge
                      [variant]="
                        s.placementStatus === 'Selected' || s.placementStatus === 'Offer Accepted' ? 'success' :
                        s.placementStatus === 'In Progress' ? 'warning' : 'neutral'
                      "
                    >{{ s.placementStatus }}</app-badge>
                    <div *ngIf="s.placedCompany" class="text-[11px] text-slate-500 font-medium mt-0.5 truncate max-w-32">
                      {{ s.placedCompany }} ({{ s.placedPackage }})
                    </div>
                  </td>

                  <!-- Account Status -->
                  <td class="py-4 px-4">
                    <span
                      class="px-2 py-0.5 rounded-md text-[10px] font-bold"
                      [ngClass]="s.isActive !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'"
                    >
                      {{ s.isActive !== false ? 'Active' : 'Suspended' }}
                    </span>
                  </td>

                  <!-- Actions Dropdown / CTAs -->
                  <td class="py-4 px-4 sm:px-6 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        (click)="inspectStudent(s)"
                        class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                        title="View Full Profile & Applications"
                      >
                        <app-icon name="eye" [size]="15"></app-icon>
                      </button>
                      <button
                        type="button"
                        (click)="openEditStudentModal(s)"
                        class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
                        title="Edit Student Info"
                      >
                        <app-icon name="edit" [size]="15"></app-icon>
                      </button>
                      <button
                        type="button"
                        (click)="openGraduateModal(s)"
                        class="p-1.5 rounded-lg border border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100 transition-colors"
                        title="Graduate to Alumni 🎓"
                      >
                        <app-icon name="graduation-cap" [size]="15"></app-icon>
                      </button>
                      <button
                        type="button"
                        (click)="toggleUserDeactivation(s.userId, s.isActive !== false, s.fullName)"
                        class="p-1.5 rounded-lg border transition-colors"
                        [ngClass]="s.isActive !== false ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'"
                        [title]="s.isActive !== false ? 'Deactivate Account' : 'Reactivate Account'"
                      >
                        <app-icon [name]="s.isActive !== false ? 'user-x' : 'user-check'" [size]="15"></app-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <div class="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing {{ (studentPageIndex() - 1) * pageSize + 1 }} to {{ Math.min(studentPageIndex() * pageSize, filteredStudents().length) }} of {{ filteredStudents().length }} students
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                [disabled]="studentPageIndex() === 1"
                (click)="studentPageIndex.set(studentPageIndex() - 1)"
                class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                Previous
              </button>
              <span class="font-bold text-slate-700 px-2">Page {{ studentPageIndex() }} of {{ studentTotalPages }}</span>
              <button
                type="button"
                [disabled]="studentPageIndex() >= studentTotalPages"
                (click)="studentPageIndex.set(studentPageIndex() + 1)"
                class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <app-empty-state
          *ngIf="filteredStudents().length === 0"
          title="No Students Found"
          description="No student profiles match your search and filter criteria. Try adjusting keywords or department filters."
          actionLabel="Clear Filters"
          (action)="clearStudentFilters()"
        ></app-empty-state>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 2: ALUMNI MENTORS & MANAGEMENT -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab() === 'alumni'" class="space-y-4">
        <!-- Search Bar -->
        <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="relative lg:col-span-2">
              <app-icon name="search" [size]="18" customClass="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
              <input
                type="text"
                [ngModel]="alumniSearch()"
                (ngModelChange)="alumniSearch.set($event)"
                placeholder="Search alumni by name, company, designation, skills..."
                class="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <select [ngModel]="alumniDeptFilter()" (ngModelChange)="alumniDeptFilter.set($event)" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white">
                <option value="all">All Departments</option>
                <option *ngFor="let d of orgService.departments()" [value]="d.name">{{ d.name }}</option>
              </select>
            </div>

            <div>
              <select [ngModel]="alumniMentoringFilter()" (ngModelChange)="alumniMentoringFilter.set($event)" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white">
                <option value="all">All Mentoring Statuses</option>
                <option value="available">Available for Mentorship</option>
                <option value="busy">Mentoring Paused</option>
              </select>
            </div>

            <div *ngIf="alumniSearch() || alumniDeptFilter() !== 'all' || alumniMentoringFilter() !== 'all'" class="sm:col-span-3 flex justify-end">
              <button
                type="button"
                (click)="clearAlumniFilters()"
                class="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
              >
                Reset Alumni Filters
              </button>
            </div>
          </div>
        </div>

        <!-- Alumni Table -->
        <div *ngIf="filteredAlumni().length > 0" class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th class="py-3.5 px-4 sm:px-6">Alumnus/Alumna</th>
                  <th class="py-3.5 px-4">Current Organization</th>
                  <th class="py-3.5 px-4">Branch & Batch</th>
                  <th class="py-3.5 px-4">Mentoring Availability</th>
                  <th class="py-3.5 px-4">Status</th>
                  <th class="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  *ngFor="let a of filteredAlumni()"
                  class="hover:bg-slate-50/70 transition-colors"
                  [ngClass]="{ 'opacity-60 bg-slate-50/40': a.isActive === false }"
                >
                  <td class="py-4 px-4 sm:px-6">
                    <div class="flex items-center gap-3">
                      <img [src]="a.profilePhoto" class="w-10 h-10 rounded-2xl object-cover border border-slate-200 shrink-0" />
                      <div class="min-w-0">
                        <div class="font-bold text-slate-900 truncate">{{ a.fullName }}</div>
                        <div class="text-[11px] text-slate-500 truncate">{{ a.email }}</div>
                      </div>
                    </div>
                  </td>

                  <td class="py-4 px-4">
                    <div class="font-bold text-slate-900">{{ a.company || 'Not Specified' }}</div>
                    <div class="text-[11px] text-slate-500 font-medium">{{ a.designation || 'Alumni' }} • {{ a.experienceYears }} yrs exp</div>
                  </td>

                  <td class="py-4 px-4">
                    <div class="font-semibold text-slate-800">{{ a.department }}</div>
                    <div class="text-[11px] text-slate-500">Graduation {{ a.graduationYear }}</div>
                  </td>

                  <td class="py-4 px-4">
                    <span
                      class="px-2.5 py-1 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                      [ngClass]="a.availableForMentoring ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'"
                    >
                      <span class="w-2 h-2 rounded-full" [ngClass]="a.availableForMentoring ? 'bg-emerald-500' : 'bg-slate-400'"></span>
                      {{ a.availableForMentoring ? 'Available' : 'Paused' }}
                    </span>
                  </td>

                  <td class="py-4 px-4">
                    <span
                      class="px-2 py-0.5 rounded-md text-[10px] font-bold"
                      [ngClass]="a.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
                    >
                      {{ a.isActive !== false ? 'Active' : 'Deactivated' }}
                    </span>
                  </td>

                  <td class="py-4 px-4 sm:px-6 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        (click)="inspectAlumni(a)"
                        class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-purple-600 transition-colors"
                        title="View Full Profile"
                      >
                        <app-icon name="eye" [size]="15"></app-icon>
                      </button>
                      <button
                        type="button"
                        (click)="openEditAlumniModal(a)"
                        class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
                        title="Edit Alumni Info"
                      >
                        <app-icon name="edit" [size]="15"></app-icon>
                      </button>
                      <button
                        type="button"
                        (click)="toggleUserDeactivation(a.userId, a.isActive !== false, a.fullName)"
                        class="p-1.5 rounded-lg border transition-colors"
                        [ngClass]="a.isActive !== false ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'"
                        [title]="a.isActive !== false ? 'Deactivate Account' : 'Reactivate Account'"
                      >
                        <app-icon [name]="a.isActive !== false ? 'user-x' : 'user-check'" [size]="15"></app-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty state when no alumni match filters -->
        <app-empty-state
          *ngIf="filteredAlumni().length === 0"
          title="No Alumni Mentors Found"
          description="No alumni mentors match your current keyword or department filter criteria."
          actionLabel="Clear Filters"
          (action)="clearAlumniFilters()"
        ></app-empty-state>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 3: BULK CSV IMPORT ENGINE -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab() === 'import'" class="space-y-6">
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 class="text-lg font-bold text-slate-900">Bulk User Importer</h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Upload CSV file containing batch student or alumni records with automated schema validation and duplicate detection.
              </p>
            </div>

            <!-- Role Selector & Sample Template Download -->
            <div class="flex items-center gap-3">
              <div class="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  (click)="importRole = 'student'; resetImport()"
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  [ngClass]="importRole === 'student' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'"
                >
                  Students
                </button>
                <button
                  type="button"
                  (click)="importRole = 'alumni'; resetImport()"
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  [ngClass]="importRole === 'alumni' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'"
                >
                  Alumni
                </button>
              </div>

              <button
                type="button"
                (click)="downloadSampleCsv()"
                class="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
              >
                <app-icon name="download" [size]="14"></app-icon>
                Sample Template
              </button>
            </div>
          </div>

          <!-- File Upload Zone -->
          <div
            class="border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer hover:border-blue-500 hover:bg-blue-50/20"
            [ngClass]="selectedCsvFile ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-300'"
            (click)="csvFileInput.click()"
          >
            <input
              #csvFileInput
              type="file"
              accept=".csv"
              (change)="onCsvFileSelected($event)"
              class="hidden"
            />
            <div class="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3" [ngClass]="selectedCsvFile ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'">
              <app-icon [name]="selectedCsvFile ? 'check-circle' : 'upload'" [size]="28"></app-icon>
            </div>
            <h4 class="text-sm font-bold text-slate-900">
              {{ selectedCsvFile ? selectedCsvFile.name : 'Choose or Drag & Drop CSV File' }}
            </h4>
            <p class="text-xs text-slate-500 mt-1">
              Supports standard comma-separated files. Automatic validation against departments and existing duplicate accounts.
            </p>
          </div>

          <!-- Parsing Status / Dry-run Report -->
          <div *ngIf="isParsingCsv" class="p-6 text-center text-sm font-semibold text-slate-600">
            <span class="inline-block animate-spin mr-2">⏳</span> Validating records and checking for duplicates...
          </div>

          <!-- Validation Report Summary -->
          <div *ngIf="csvReport" class="space-y-4 animate-in fade-in duration-200">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div class="text-xs text-slate-500 font-semibold">Total Rows Parsed</div>
                <div class="text-2xl font-black text-slate-900 mt-1">{{ csvReport.totalRows }}</div>
              </div>
              <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div class="text-xs text-emerald-700 font-semibold">Ready for Enrollment</div>
                <div class="text-2xl font-black text-emerald-800 mt-1">{{ csvReport.validRows.length }}</div>
              </div>
              <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <div class="text-xs text-rose-700 font-semibold">Validation Errors / Duplicates</div>
                <div class="text-2xl font-black text-rose-800 mt-1">{{ csvReport.errorsCount }}</div>
              </div>
            </div>

            <!-- Error Report Detail Drawer -->
            <div *ngIf="csvReport.invalidRows.length > 0" class="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2">
              <h5 class="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <app-icon name="alert-triangle" [size]="15" customClass="text-rose-600"></app-icon>
                Issues Detected ({{ csvReport.invalidRows.length }} rows cannot be imported):
              </h5>
              <div class="max-h-48 overflow-y-auto space-y-1.5 text-xs text-rose-800 pr-2 custom-scrollbar">
                <div *ngFor="let item of csvReport.invalidRows" class="p-2 rounded-xl bg-white/80 border border-rose-100 flex items-start gap-2">
                  <span class="font-bold text-rose-700 shrink-0">Row {{ item.rowNumber }}:</span>
                  <div>
                    <span *ngFor="let err of item.errors; let last = last" class="block">
                      • <strong class="font-semibold">{{ err.field }}:</strong> {{ err.message }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Execute Import CTA -->
            <div class="pt-2 flex items-center justify-between">
              <button
                type="button"
                (click)="resetImport()"
                class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel & Clear
              </button>

              <button
                type="button"
                [disabled]="csvReport.validRows.length === 0 || isImporting"
                (click)="executeBulkImport()"
                class="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 font-bold text-xs text-white shadow-md shadow-emerald-500/20 flex items-center gap-2"
              >
                <app-icon name="check-circle" [size]="16"></app-icon>
                <span>Enroll {{ csvReport.validRows.length }} Valid {{ importRole === 'student' ? 'Students' : 'Alumni' }}</span>
              </button>
            </div>

            <!-- Progress Bar during Import -->
            <div *ngIf="isImporting" class="space-y-2 pt-2">
              <div class="flex justify-between text-xs font-bold text-slate-700">
                <span>Importing records...</span>
                <span>{{ importProgress.current }} / {{ importProgress.total }}</span>
              </div>
              <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  class="bg-emerald-600 h-2 transition-all duration-300 rounded-full"
                  [style.width.%]="(importProgress.current / importProgress.total) * 100"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 4: DEPARTMENTS & PROGRAMS - COMPLETE ACADEMIC & PLACEMENT SYSTEM -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab() === 'departments'" class="space-y-6">

        <!-- 1. BREADCRUMB NAVIGATION (When drilling down into Department or Program) -->
        <div *ngIf="selectedDepartment() || selectedProgram()" class="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl p-4 sm:px-6 border border-slate-200/80 shadow-xs">
          <nav class="flex items-center flex-wrap gap-2 text-xs font-semibold">
            <button
              type="button"
              (click)="selectDepartment(null)"
              class="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1.5 transition-colors"
            >
              <app-icon name="building" [size]="14"></app-icon>
              <span>Academic Departments</span>
            </button>

            <span *ngIf="selectedDepartment()" class="text-slate-400">/</span>

            <button
              *ngIf="selectedDepartment()"
              type="button"
              (click)="selectProgram(null)"
              class="transition-colors"
              [ngClass]="selectedProgram() ? 'text-indigo-600 hover:text-indigo-800 hover:underline' : 'text-slate-900 font-bold'"
            >
              {{ selectedDepartment()?.name }} ({{ selectedDepartment()?.code }})
            </button>

            <span *ngIf="selectedProgram()" class="text-slate-400">/</span>

            <span *ngIf="selectedProgram()" class="text-slate-900 font-bold flex items-center gap-1">
              <app-icon name="book-open" [size]="14" class="text-indigo-600"></app-icon>
              <span>{{ selectedProgram()?.name }} Syllabus</span>
            </span>
          </nav>

          <div class="flex items-center gap-2">
            <button
              *ngIf="selectedProgram()"
              type="button"
              (click)="selectProgram(null)"
              class="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs"
            >
              ← Back to {{ selectedDepartment()?.code }} Overview
            </button>
            <button
              *ngIf="selectedDepartment() && !selectedProgram()"
              type="button"
              (click)="selectDepartment(null)"
              class="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs"
            >
              ← All Departments
            </button>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- VIEW 1: PROGRAM DETAILS & 4-YEAR / 8-SEMESTER SYLLABUS EXPLORER -->
        <!-- ========================================================================= -->
        <div *ngIf="selectedProgram() as prog" class="space-y-6 animate-in fade-in duration-200">
          <!-- Program Hero Header -->
          <div class="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
            <div class="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div class="space-y-2 max-w-2xl">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold border border-indigo-400/30">
                    {{ prog.code }}
                  </span>
                  <span class="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
                    {{ prog.degreeLevel }}
                  </span>
                  <span class="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-400/30">
                    {{ prog.durationYears }} Years ({{ prog.durationYears * 2 }} Semesters)
                  </span>
                  <span class="px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-400/30">
                    {{ prog.totalCredits || getTotalProgramCredits(prog) }} Total Credits
                  </span>
                </div>
                <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white">{{ prog.name }}</h2>
                <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">{{ prog.description }}</p>
              </div>

              <div class="flex flex-wrap md:flex-col gap-2 shrink-0">
                <button
                  type="button"
                  (click)="openAddSubject(prog)"
                  class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <app-icon name="plus" [size]="14"></app-icon>
                  <span>+ Add Course / Subject</span>
                </button>
                <button
                  type="button"
                  (click)="openEditProgramModal(prog)"
                  class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10"
                >
                  <app-icon name="edit" [size]="14"></app-icon>
                  <span>Edit Program</span>
                </button>
              </div>
            </div>

            <!-- Program Quick Stats Banner -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10 text-center sm:text-left">
              <div>
                <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Courses</div>
                <div class="text-xl font-black text-white mt-0.5">{{ getProgramSubjects(prog).length }} Subjects</div>
              </div>
              <div>
                <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Curriculum Credits</div>
                <div class="text-xl font-black text-emerald-400 mt-0.5">{{ getTotalProgramCredits(prog) }} Credits</div>
              </div>
              <div>
                <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Core Subjects</div>
                <div class="text-xl font-black text-indigo-300 mt-0.5">{{ countSubjectsByType(prog, 'Core') }}</div>
              </div>
              <div>
                <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lab / Practical</div>
                <div class="text-xl font-black text-amber-300 mt-0.5">{{ countSubjectsByType(prog, 'Lab') }}</div>
              </div>
            </div>
          </div>

          <!-- Syllabus Filter & Search Controls -->
          <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <!-- Semester Selector Pills -->
              <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
                <button
                  type="button"
                  (click)="syllabusSemesterFilter = 'all'"
                  class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                  [ngClass]="syllabusSemesterFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                >
                  All Semesters (1-{{ prog.durationYears * 2 }})
                </button>
                <button
                  *ngFor="let sem of getProgramSemestersList(prog)"
                  type="button"
                  (click)="syllabusSemesterFilter = sem"
                  class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                  [ngClass]="syllabusSemesterFilter === sem ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                >
                  Sem {{ sem }}
                </button>
              </div>

              <!-- Search & Type Filter -->
              <div class="flex items-center gap-2">
                <select
                  [(ngModel)]="syllabusCourseTypeFilter"
                  class="px-3 py-2 rounded-xl text-xs border border-slate-200 bg-white font-medium text-slate-700"
                >
                  <option value="all">All Course Types</option>
                  <option value="Core">Core Courses</option>
                  <option value="Elective">Electives</option>
                  <option value="Lab">Lab / Practical</option>
                  <option value="Project">Project / Capstone</option>
                </select>

                <div class="relative w-48 sm:w-60">
                  <input
                    type="text"
                    [(ngModel)]="syllabusSearch"
                    placeholder="Search subject or code..."
                    class="w-full pl-8 pr-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <span class="absolute left-2.5 top-2.5 text-slate-400">
                    <app-icon name="search" [size]="14"></app-icon>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Subject Cards Grouped by Semester or Filtered -->
          <div class="space-y-6">
            <ng-container *ngFor="let sem of (syllabusSemesterFilter === 'all' ? getProgramSemestersList(prog) : [syllabusSemesterFilter])">
              <div
                *ngIf="getSubjectsBySemesterFiltered(prog, sem).length > 0 || (syllabusSemesterFilter !== 'all' && !syllabusSearch)"
                class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4"
              >
                <!-- Semester Header -->
                <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div class="flex items-center gap-2.5">
                    <span class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-black text-sm flex items-center justify-center border border-indigo-100">
                      {{ sem }}
                    </span>
                    <div>
                      <h3 class="text-base font-bold text-slate-900">Semester {{ sem }} Curriculum</h3>
                      <p class="text-xs text-slate-500">
                        {{ getSubjectsBySemester(prog, sem).length }} Courses • {{ getSemesterCredits(prog, sem) }} Semester Credits
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    (click)="openAddSubject(prog, sem)"
                    class="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 text-indigo-700 text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <app-icon name="plus" [size]="12"></app-icon>
                    <span>Add to Sem {{ sem }}</span>
                  </button>
                </div>

                <!-- Subjects Grid -->
                <div *ngIf="getSubjectsBySemesterFiltered(prog, sem).length === 0" class="text-center py-8 text-slate-400 text-xs">
                  No courses found matching criteria in Semester {{ sem }}.
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    *ngFor="let sub of getSubjectsBySemesterFiltered(prog, sem)"
                    class="p-5 rounded-2xl border border-slate-200/90 hover:border-indigo-200 hover:shadow-md transition-all bg-white flex flex-col justify-between space-y-4"
                  >
                    <div class="space-y-3">
                      <!-- Subject Top Row -->
                      <div class="flex items-start justify-between gap-2">
                        <div>
                          <div class="flex items-center gap-1.5">
                            <span class="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                              {{ sub.code }}
                            </span>
                            <span
                              class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              [ngClass]="{
                                'bg-blue-100 text-blue-800': sub.courseType === 'Core',
                                'bg-purple-100 text-purple-800': sub.courseType === 'Elective',
                                'bg-amber-100 text-amber-800': sub.courseType === 'Lab',
                                'bg-emerald-100 text-emerald-800': sub.courseType === 'Project'
                              }"
                            >
                              {{ sub.courseType }}
                            </span>
                          </div>
                          <h4 class="text-sm font-bold text-slate-900 mt-1.5">{{ sub.name }}</h4>
                        </div>

                        <span class="px-2.5 py-1 rounded-xl bg-slate-100 font-bold text-xs text-slate-700 whitespace-nowrap">
                          {{ sub.credits }} {{ sub.credits === 1 ? 'Credit' : 'Credits' }}
                        </span>
                      </div>

                      <p class="text-xs text-slate-500 line-clamp-2">{{ sub.description }}</p>

                      <!-- Prerequisites -->
                      <div *ngIf="sub.prerequisites && sub.prerequisites.length > 0" class="flex items-center gap-1.5 flex-wrap">
                        <span class="text-[10px] font-bold text-slate-400">Prereq:</span>
                        <span *ngFor="let pre of sub.prerequisites" class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                          {{ pre }}
                        </span>
                      </div>

                      <!-- Syllabus Units Pills Preview -->
                      <div *ngIf="sub.syllabusUnits && sub.syllabusUnits.length > 0" class="space-y-1.5 pt-2 border-t border-slate-100">
                        <div class="flex items-center justify-between text-[10px] font-bold text-slate-400">
                          <span>Syllabus Breakdown ({{ sub.syllabusUnits.length }} Units)</span>
                          <span>{{ getTotalSubjectHours(sub) }} Hours</span>
                        </div>
                        <div class="flex flex-wrap gap-1">
                          <span
                            *ngFor="let u of sub.syllabusUnits"
                            class="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-medium text-slate-700"
                          >
                            Unit {{ u.unitNumber }}: {{ (u.title || u.unitTitle || '') | slice:0:22 }}{{ (u.title || u.unitTitle || '').length > 22 ? '...' : '' }}
                          </span>
                        </div>
                      </div>

                      <!-- Skills Preview -->
                      <div *ngIf="sub.skillsDeveloped && sub.skillsDeveloped.length > 0" class="flex flex-wrap gap-1">
                        <span *ngFor="let sk of sub.skillsDeveloped | slice:0:3" class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                          ✓ {{ sk }}
                        </span>
                      </div>
                    </div>

                    <!-- Subject Actions -->
                    <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        (click)="viewSubject(sub)"
                        class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
                      >
                        <app-icon name="book-open" [size]="14"></app-icon>
                        <span>Explore Syllabus (Units I-V)</span>
                      </button>

                      <div class="flex items-center gap-1">
                        <button
                          type="button"
                          (click)="openEditSubject(sub)"
                          title="Edit Course"
                          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <app-icon name="edit" [size]="14"></app-icon>
                        </button>
                        <button
                          type="button"
                          (click)="deleteSubject(sub.id)"
                          title="Delete Course"
                          class="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        >
                          <app-icon name="trash" [size]="14"></app-icon>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ng-container>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- VIEW 2: DEPARTMENT DETAILS (ACADEMIC + PLACEMENT INFORMATION SYSTEM) -->
        <!-- ========================================================================= -->
        <div *ngIf="selectedDepartment() as dept" [class.hidden]="selectedProgram() !== null" class="space-y-6 animate-in fade-in duration-200">
          <!-- Department Hero Header Card -->
          <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-100">
              <div class="space-y-2 max-w-2xl">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    {{ dept.code }}
                  </span>
                  <button
                    type="button"
                    (click)="orgService.toggleDepartmentActive(dept.id)"
                    class="text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer"
                    [ngClass]="dept.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-100 text-rose-700'"
                  >
                    ● {{ dept.isActive ? 'Active Department' : 'Inactive' }}
                  </button>
                </div>
                <h2 class="text-xl sm:text-2xl font-black text-slate-900">{{ dept.name }}</h2>
                <p class="text-xs sm:text-sm text-slate-500 leading-relaxed">{{ dept.description || 'Department providing comprehensive academic programs, research facilities, and placement opportunities for enrolled students.' }}</p>
              </div>

              <div class="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  (click)="openAddProgramModal(dept.id)"
                  class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <app-icon name="plus" [size]="14"></app-icon>
                  <span>+ Add Program</span>
                </button>
                <button
                  type="button"
                  (click)="openEditDepartmentModal(dept)"
                  class="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-2xs"
                >
                  <app-icon name="edit" [size]="14"></app-icon>
                  <span>Edit Details</span>
                </button>
              </div>
            </div>

            <!-- Department Info Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div class="text-[10px] uppercase font-bold text-slate-400">Head of Department (HOD)</div>
                <div class="font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                  <app-icon name="user" [size]="14" class="text-indigo-600"></app-icon>
                  <span>{{ dept.headOfDepartment || 'Not Appointed' }}</span>
                </div>
                <div class="text-slate-500 mt-0.5 text-[11px]">{{ dept.contactEmail }}</div>
              </div>

              <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div class="text-[10px] uppercase font-bold text-slate-400">Contact & Support</div>
                <div class="font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                  <app-icon name="mail" [size]="14" class="text-indigo-600"></app-icon>
                  <span>{{ dept.contactEmail || 'dept@careernexus.edu' }}</span>
                </div>
                <div class="text-slate-500 mt-0.5 text-[11px]">{{ dept.contactPhone || '+91 44 2235 7000' }}</div>
              </div>

              <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div class="text-[10px] uppercase font-bold text-slate-400">Campus Location</div>
                <div class="font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                  <app-icon name="building" [size]="14" class="text-indigo-600"></app-icon>
                  <span>{{ dept.building || 'Main Academic Block' }}</span>
                </div>
                <div class="text-slate-500 mt-0.5 text-[11px]">Est. {{ dept.establishedYear || '2005' }}</div>
              </div>

              <div class="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                <div class="text-[10px] uppercase font-bold text-indigo-400">Total Enrolled Students</div>
                <div class="font-black text-indigo-900 text-lg mt-0.5">
                  {{ getDepartmentStudentDistribution(dept).totalStudents }} Students
                </div>
                <div class="text-indigo-700 mt-0.5 text-[11px]">Across 4 Academic Years</div>
              </div>
            </div>

            <!-- Sub-Tabs Navigation -->
            <div class="flex items-center gap-2 border-b border-slate-200 overflow-x-auto custom-scrollbar pt-2">
              <button
                type="button"
                (click)="deptActiveTab.set('overview')"
                class="pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap"
                [ngClass]="deptActiveTab() === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'"
              >
                <app-icon name="users" [size]="14"></app-icon>
                <span>Overview & Student Distribution</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">
                  {{ getDepartmentStudentDistribution(dept).totalStudents }}
                </span>
              </button>

              <button
                type="button"
                (click)="deptActiveTab.set('programs')"
                class="pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap"
                [ngClass]="deptActiveTab() === 'programs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'"
              >
                <app-icon name="book-open" [size]="14"></app-icon>
                <span>Degree Programs & Syllabus</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700">
                  {{ getDepartmentPrograms(dept).length }}
                </span>
              </button>

              <button
                type="button"
                (click)="deptActiveTab.set('analytics')"
                class="pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap"
                [ngClass]="deptActiveTab() === 'analytics' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'"
              >
                <app-icon name="chart" [size]="14"></app-icon>
                <span>Placement Analytics & Companies</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-bold">
                  {{ getDepartmentPlacementMetrics(dept).placementRate }}% Placed
                </span>
              </button>

              <button
                type="button"
                (click)="deptActiveTab.set('alumni')"
                class="pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap"
                [ngClass]="deptActiveTab() === 'alumni' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'"
              >
                <app-icon name="briefcase" [size]="14"></app-icon>
                <span>Department Alumni & Mentors</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-700">
                  {{ getDepartmentAlumni(dept).length }}
                </span>
              </button>
            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- SUB-TAB 1: OVERVIEW & STUDENT DISTRIBUTION -->
          <!-- ========================================================================= -->
          <div *ngIf="deptActiveTab() === 'overview'" class="space-y-6">
            <!-- 4 Academic Year Distribution Cards (Live Data with clickable filters) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- 1st Year -->
              <div
                (click)="deptStudentYearFilter = (deptStudentYearFilter === '1st' ? 'all' : '1st')"
                class="p-5 rounded-2xl border transition-all cursor-pointer bg-white shadow-xs hover:border-indigo-300"
                [ngClass]="deptStudentYearFilter === '1st' ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200'"
              >
                <div class="flex items-center justify-between">
                  <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">1st Year</span>
                  <span class="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">Batch 2030</span>
                </div>
                <div class="text-2xl font-black text-slate-900 mt-2">
                  {{ getDepartmentStudentDistribution(dept).firstYear.count }}
                </div>
                <div class="mt-2 space-y-1">
                  <div class="flex justify-between text-[11px] text-slate-500">
                    <span>Freshmen Cohort</span>
                    <span class="font-bold">{{ getDepartmentStudentDistribution(dept).firstYear.percentage }}%</span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-blue-600 h-1.5 rounded-full" [style.width.%]="getDepartmentStudentDistribution(dept).firstYear.percentage"></div>
                  </div>
                </div>
              </div>

              <!-- 2nd Year -->
              <div
                (click)="deptStudentYearFilter = (deptStudentYearFilter === '2nd' ? 'all' : '2nd')"
                class="p-5 rounded-2xl border transition-all cursor-pointer bg-white shadow-xs hover:border-indigo-300"
                [ngClass]="deptStudentYearFilter === '2nd' ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200'"
              >
                <div class="flex items-center justify-between">
                  <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">2nd Year</span>
                  <span class="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">Batch 2029</span>
                </div>
                <div class="text-2xl font-black text-slate-900 mt-2">
                  {{ getDepartmentStudentDistribution(dept).secondYear.count }}
                </div>
                <div class="mt-2 space-y-1">
                  <div class="flex justify-between text-[11px] text-slate-500">
                    <span>Core Curriculum</span>
                    <span class="font-bold">{{ getDepartmentStudentDistribution(dept).secondYear.percentage }}%</span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-indigo-600 h-1.5 rounded-full" [style.width.%]="getDepartmentStudentDistribution(dept).secondYear.percentage"></div>
                  </div>
                </div>
              </div>

              <!-- 3rd Year -->
              <div
                (click)="deptStudentYearFilter = (deptStudentYearFilter === '3rd' ? 'all' : '3rd')"
                class="p-5 rounded-2xl border transition-all cursor-pointer bg-white shadow-xs hover:border-indigo-300"
                [ngClass]="deptStudentYearFilter === '3rd' ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200'"
              >
                <div class="flex items-center justify-between">
                  <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">3rd Year</span>
                  <span class="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">Batch 2028</span>
                </div>
                <div class="text-2xl font-black text-slate-900 mt-2">
                  {{ getDepartmentStudentDistribution(dept).thirdYear.count }}
                </div>
                <div class="mt-2 space-y-1">
                  <div class="flex justify-between text-[11px] text-slate-500">
                    <span>Pre-Final / Interns</span>
                    <span class="font-bold">{{ getDepartmentStudentDistribution(dept).thirdYear.percentage }}%</span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-amber-500 h-1.5 rounded-full" [style.width.%]="getDepartmentStudentDistribution(dept).thirdYear.percentage"></div>
                  </div>
                </div>
              </div>

              <!-- 4th Year -->
              <div
                (click)="deptStudentYearFilter = (deptStudentYearFilter === '4th' ? 'all' : '4th')"
                class="p-5 rounded-2xl border transition-all cursor-pointer bg-white shadow-xs hover:border-indigo-300"
                [ngClass]="deptStudentYearFilter === '4th' ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200'"
              >
                <div class="flex items-center justify-between">
                  <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">4th Year (Graduating)</span>
                  <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">Batch 2027</span>
                </div>
                <div class="text-2xl font-black text-slate-900 mt-2">
                  {{ getDepartmentStudentDistribution(dept).fourthYear.count }}
                </div>
                <div class="mt-2 space-y-1">
                  <div class="flex justify-between text-[11px] text-slate-500">
                    <span>Placement Active</span>
                    <span class="font-bold">{{ getDepartmentStudentDistribution(dept).fourthYear.percentage }}%</span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-emerald-600 h-1.5 rounded-full" [style.width.%]="getDepartmentStudentDistribution(dept).fourthYear.percentage"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Filtered Real Students Table in Department -->
            <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 class="text-base font-bold text-slate-900">Enrolled Students in {{ dept.name }}</h3>
                  <p class="text-xs text-slate-500">
                    Showing {{ getFilteredDepartmentStudents(dept).length }} student records. Click any row to inspect placement readiness.
                  </p>
                </div>

                <!-- Filters -->
                <div class="flex flex-wrap items-center gap-2">
                  <select
                    [(ngModel)]="deptStudentYearFilter"
                    class="px-3 py-1.5 rounded-xl text-xs border border-slate-200 bg-white font-medium text-slate-700"
                  >
                    <option value="all">All Academic Years</option>
                    <option value="1st">1st Year (2030)</option>
                    <option value="2nd">2nd Year (2029)</option>
                    <option value="3rd">3rd Year (2028)</option>
                    <option value="4th">4th Year (2027)</option>
                  </select>

                  <select
                    [(ngModel)]="deptStudentStatusFilter"
                    class="px-3 py-1.5 rounded-xl text-xs border border-slate-200 bg-white font-medium text-slate-700"
                  >
                    <option value="all">All Placement Status</option>
                    <option value="Selected">Selected / Placed</option>
                    <option value="Offer Accepted">Offer Accepted</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Not Placed">Not Placed</option>
                  </select>

                  <input
                    type="text"
                    [(ngModel)]="deptStudentSearch"
                    placeholder="Search name or roll no..."
                    class="px-3 py-1.5 rounded-xl text-xs border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-600">
                  <thead class="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th class="py-3 px-4">Student</th>
                      <th class="py-3 px-4">Roll No</th>
                      <th class="py-3 px-4">Batch / Year</th>
                      <th class="py-3 px-4">CGPA</th>
                      <th class="py-3 px-4">Placement Status</th>
                      <th class="py-3 px-4">Company / Package</th>
                      <th class="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr
                      *ngFor="let s of getFilteredDepartmentStudents(dept)"
                      class="hover:bg-slate-50/80 transition-colors"
                    >
                      <td class="py-3 px-4">
                        <div class="flex items-center gap-2.5">
                          <img [src]="s.profilePhoto" class="w-8 h-8 rounded-full object-cover border border-slate-200" />
                          <div>
                            <div class="font-bold text-slate-900">{{ s.fullName }}</div>
                            <div class="text-[11px] text-slate-400">{{ s.email }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="py-3 px-4 font-mono font-semibold text-slate-700">{{ s.rollNumber }}</td>
                      <td class="py-3 px-4">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          Class of {{ s.graduationYear }} ({{ getStudentAcademicYearLabel(s.graduationYear) }})
                        </span>
                      </td>
                      <td class="py-3 px-4 font-bold" [ngClass]="s.cgpa >= 8.5 ? 'text-emerald-700' : 'text-slate-800'">
                        {{ s.cgpa.toFixed(2) }}
                      </td>
                      <td class="py-3 px-4">
                        <span
                          class="px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block"
                          [ngClass]="{
                            'bg-emerald-100 text-emerald-800': s.placementStatus === 'Selected' || s.placementStatus === 'Offer Accepted',
                            'bg-blue-100 text-blue-800': s.placementStatus === 'In Progress',
                            'bg-slate-100 text-slate-700': s.placementStatus === 'Not Placed'
                          }"
                        >
                          {{ s.placementStatus }}
                        </span>
                      </td>
                      <td class="py-3 px-4">
                        <div *ngIf="s.placedCompany" class="font-semibold text-slate-900">
                          {{ s.placedCompany }}
                          <span *ngIf="s.placedPackage" class="text-emerald-600 font-bold ml-1">({{ s.placedPackage }})</span>
                        </div>
                        <span *ngIf="!s.placedCompany" class="text-slate-400 italic text-[11px]">Pending Drive</span>
                      </td>
                      <td class="py-3 px-4 text-right">
                        <button
                          type="button"
                          (click)="inspectStudent(s)"
                          class="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>

                    <tr *ngIf="getFilteredDepartmentStudents(dept).length === 0">
                      <td colspan="7" class="text-center py-8 text-slate-400 text-xs">
                        No students found matching the selected filters.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- SUB-TAB 2: DEGREE PROGRAMS & CURRICULUM -->
          <!-- ========================================================================= -->
          <div *ngIf="deptActiveTab() === 'programs'" class="space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-bold text-slate-900">Degree Programs Offered</h3>
                <p class="text-xs text-slate-500">Undergraduate and Postgraduate curricula administered by {{ dept.name }}.</p>
              </div>
              <button
                type="button"
                (click)="openAddProgramModal(dept.id)"
                class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs"
              >
                <app-icon name="plus" [size]="14"></app-icon>
                <span>+ Add Program</span>
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div
                *ngFor="let p of getDepartmentPrograms(dept)"
                class="p-6 rounded-3xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between space-y-4"
              >
                <div class="space-y-3">
                  <div class="flex items-start justify-between gap-2">
                    <span class="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {{ p.code }}
                    </span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {{ p.degreeLevel }}
                    </span>
                  </div>

                  <div>
                    <h4 class="text-base font-bold text-slate-900">{{ p.name }}</h4>
                    <p class="text-xs text-slate-500 mt-1 line-clamp-2">{{ p.description }}</p>
                  </div>

                  <div class="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs">
                    <div>
                      <div class="text-[10px] font-bold text-slate-400 uppercase">Duration</div>
                      <div class="font-black text-slate-800 mt-0.5">{{ p.durationYears }} Yrs</div>
                    </div>
                    <div>
                      <div class="text-[10px] font-bold text-slate-400 uppercase">Semesters</div>
                      <div class="font-black text-indigo-700 mt-0.5">{{ p.durationYears * 2 }}</div>
                    </div>
                    <div>
                      <div class="text-[10px] font-bold text-slate-400 uppercase">Credits</div>
                      <div class="font-black text-emerald-700 mt-0.5">{{ p.totalCredits || getTotalProgramCredits(p) }}</div>
                    </div>
                  </div>

                  <div class="text-xs text-slate-600 flex items-center justify-between pt-1">
                    <span>Curriculum Structure:</span>
                    <span class="font-bold text-indigo-700">{{ getProgramSubjects(p).length }} Configured Courses</span>
                  </div>
                </div>

                <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    (click)="selectProgram(p)"
                    class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <app-icon name="book-open" [size]="14"></app-icon>
                    <span>Explore 8-Sem Syllabus & Units →</span>
                  </button>

                  <button
                    type="button"
                    (click)="openEditProgramModal(p)"
                    title="Edit Program"
                    class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <app-icon name="edit" [size]="14"></app-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- SUB-TAB 3: PLACEMENT ANALYTICS & CONNECTED COMPANIES / RECRUITERS -->
          <!-- ========================================================================= -->
          <div *ngIf="deptActiveTab() === 'analytics'" class="space-y-6">
            <!-- Placement KPI Cards Row -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
                <div class="text-[10px] uppercase font-bold text-slate-400">Total Pool</div>
                <div class="text-xl font-black text-slate-900 mt-0.5">{{ getDepartmentPlacementMetrics(dept).totalStudents }}</div>
                <div class="text-[10px] text-slate-500">Students</div>
              </div>

              <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
                <div class="text-[10px] uppercase font-bold text-slate-400">Placement Rate</div>
                <div class="text-xl font-black text-emerald-600 mt-0.5">{{ getDepartmentPlacementMetrics(dept).placementRate }}%</div>
                <div class="text-[10px] text-emerald-700 font-semibold">{{ getDepartmentPlacementMetrics(dept).placedStudents }} Placed</div>
              </div>

              <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
                <div class="text-[10px] uppercase font-bold text-slate-400">Shortlisted</div>
                <div class="text-xl font-black text-indigo-600 mt-0.5">{{ getDepartmentPlacementMetrics(dept).shortlistedStudents }}</div>
                <div class="text-[10px] text-indigo-700">Candidates</div>
              </div>

              <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
                <div class="text-[10px] uppercase font-bold text-slate-400">Interviewed</div>
                <div class="text-xl font-black text-purple-600 mt-0.5">{{ getDepartmentPlacementMetrics(dept).interviewedStudents }}</div>
                <div class="text-[10px] text-purple-700">Rounds Done</div>
              </div>

              <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
                <div class="text-[10px] uppercase font-bold text-slate-400">Average CTC</div>
                <div class="text-xl font-black text-slate-900 mt-0.5">₹{{ getDepartmentPlacementMetrics(dept).averagePackageLpa }}L</div>
                <div class="text-[10px] text-slate-500">Per Annum</div>
              </div>

              <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
                <div class="text-[10px] uppercase font-bold text-slate-400">Highest CTC</div>
                <div class="text-xl font-black text-amber-600 mt-0.5">₹{{ getDepartmentPlacementMetrics(dept).highestPackageLpa }}L</div>
                <div class="text-[10px] text-amber-700 font-semibold">Top Offer</div>
              </div>
            </div>

            <!-- Companies & Connected Recruiters Section -->
            <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 class="text-base font-bold text-slate-900">Companies Actively Recruiting from {{ dept.code }}</h3>
                  <p class="text-xs text-slate-500">
                    Live hiring drives, application counts, and connected recruiter personnel.
                  </p>
                </div>
                <span class="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold">
                  {{ getDepartmentCompaniesAndRecruiters(dept).length }} Connected Companies
                </span>
              </div>

              <div class="space-y-3">
                <div
                  *ngFor="let rel of getDepartmentCompaniesAndRecruiters(dept)"
                  class="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all bg-white shadow-2xs space-y-3"
                >
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0">
                        {{ rel.companyName | slice:0:2 | uppercase }}
                      </div>
                      <div>
                        <div class="flex items-center gap-2">
                          <h4 class="text-sm font-bold text-slate-900">{{ rel.companyName }}</h4>
                          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {{ rel.industry || 'Technology' }}
                          </span>
                        </div>
                        <div class="text-xs text-slate-500 mt-0.5">{{ rel.company?.location || 'Pan-India' }}</div>
                      </div>
                    </div>

                    <!-- Metrics Badges -->
                    <div class="flex flex-wrap items-center gap-2 text-xs">
                      <span class="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold">
                        {{ rel.activeJobsCount }} Active {{ rel.activeJobsCount === 1 ? 'Job' : 'Jobs' }}
                      </span>
                      <span class="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-bold">
                        {{ rel.applicationsCount || rel.applicantCount || 0 }} Applicants
                      </span>
                      <span class="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-bold">
                        {{ rel.placedCount }} Placed
                      </span>
                      <button
                        type="button"
                        (click)="toggleCompanyExpanded(rel.companyId)"
                        class="p-1 text-slate-400 hover:text-slate-700"
                      >
                        <app-icon [name]="isCompanyExpanded(rel.companyId) ? 'chevron-up' : 'chevron-down'" [size]="16"></app-icon>
                      </button>
                    </div>
                  </div>

                  <!-- Expanded Connected Recruiters Info -->
                  <div *ngIf="isCompanyExpanded(rel.companyId)" class="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in duration-200">
                    <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <div class="text-[10px] uppercase font-bold text-slate-400">Connected Recruiter Contact</div>
                      <div *ngIf="rel.connectedRecruiters && rel.connectedRecruiters.length > 0">
                        <div *ngFor="let rec of rel.connectedRecruiters" class="space-y-0.5">
                          <div class="font-bold text-slate-900">{{ rec.name }}</div>
                          <div class="text-slate-500 text-[11px]">{{ rec.designation }} • {{ rec.email }}</div>
                        </div>
                      </div>
                      <div *ngIf="!rel.connectedRecruiters || rel.connectedRecruiters.length === 0" class="text-slate-500 italic">
                        Talent Acquisition Team ({{ rel.companyName }})
                      </div>
                    </div>

                    <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <div class="text-[10px] uppercase font-bold text-slate-400">Key Roles Offered</div>
                      <div class="flex flex-wrap gap-1">
                        <span *ngFor="let j of rel.jobs | slice:0:3" class="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-medium">
                          {{ j.title }} (₹{{ j.salaryMinLpa || 6 }}-{{ j.salaryMaxLpa || 14 }} LPA)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div *ngIf="getDepartmentCompaniesAndRecruiters(dept).length === 0" class="text-center py-8 text-slate-400 text-xs">
                  No active hiring drives linked to {{ dept.name }} at present.
                </div>
              </div>
            </div>

            <!-- Skill Demand & Gap Analytics -->
            <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
              <div class="pb-3 border-b border-slate-100">
                <h3 class="text-base font-bold text-slate-900">Department Skill Demand & Curriculum Alignment</h3>
                <p class="text-xs text-slate-500">Skills demanded in active job openings vs student coverage in {{ dept.code }}.</p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div
                  *ngFor="let sk of getDepartmentSkillDemand(dept) | slice:0:6"
                  class="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-xs text-slate-900">{{ sk.skillName }}</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      {{ sk.jobsDemanding }} Jobs
                    </span>
                  </div>
                  <div class="space-y-1">
                    <div class="flex justify-between text-[10px] text-slate-500">
                      <span>Student Coverage</span>
                      <span class="font-bold">{{ sk.studentCoveragePercentage }}%</span>
                    </div>
                    <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        class="h-1.5 rounded-full transition-all"
                        [ngClass]="sk.studentCoveragePercentage >= 60 ? 'bg-emerald-500' : 'bg-amber-500'"
                        [style.width.%]="sk.studentCoveragePercentage"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- SUB-TAB 4: DEPARTMENT ALUMNI & MENTORS -->
          <!-- ========================================================================= -->
          <div *ngIf="deptActiveTab() === 'alumni'" class="space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-bold text-slate-900">Graduated Alumni from {{ dept.code }}</h3>
                <p class="text-xs text-slate-500">
                  {{ getDepartmentAlumni(dept).length }} alumni mentors available for student guidance, mock interviews, and career counseling.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                *ngFor="let al of getDepartmentAlumni(dept)"
                class="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-purple-200 transition-all space-y-3"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2.5">
                    <img [src]="al.profilePhoto" class="w-10 h-10 rounded-full object-cover border border-slate-200" />
                    <div>
                      <h4 class="text-sm font-bold text-slate-900">{{ al.fullName }}</h4>
                      <p class="text-xs font-semibold text-purple-700">{{ al.designation }}</p>
                      <p class="text-[11px] text-slate-500">{{ al.company || 'Tech Leader' }}</p>
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span class="text-slate-500">Class of {{ al.graduationYear }}</span>
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    [ngClass]="al.availableForMentoring ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'"
                  >
                    {{ al.availableForMentoring ? '✓ Available Mentor' : 'Inactive' }}
                  </span>
                </div>

                <div *ngIf="al.skills && al.skills.length > 0" class="flex flex-wrap gap-1 pt-1">
                  <span *ngFor="let s of al.skills | slice:0:3" class="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-medium">
                    {{ s }}
                  </span>
                </div>
              </div>

              <div *ngIf="getDepartmentAlumni(dept).length === 0" class="col-span-full text-center py-10 text-slate-400 text-xs">
                No alumni records registered under this department yet.
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- VIEW 3: ALL DEPARTMENTS & PROGRAMS OVERVIEW (DEFAULT INITIAL VIEW) -->
        <!-- ========================================================================= -->
        <div *ngIf="!selectedDepartment() && !selectedProgram()" class="space-y-6 animate-in fade-in duration-200">
          <!-- Academic Departments Grid -->
          <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 class="text-base font-bold text-slate-900">Academic Departments & Faculties</h3>
                <p class="text-xs text-slate-500">
                  Click any department card to explore complete student distribution, 8-semester syllabus, and live placement metrics.
                </p>
              </div>
              <button
                type="button"
                (click)="openAddDepartmentModal()"
                class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs"
              >
                <app-icon name="plus" [size]="14"></app-icon>
                <span>+ Add Department</span>
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div
                *ngFor="let d of orgService.departments()"
                (click)="selectDepartment(d)"
                class="p-5 rounded-3xl border transition-all cursor-pointer bg-white shadow-xs hover:shadow-lg hover:border-indigo-300 group flex flex-col justify-between space-y-4"
                [ngClass]="d.isActive ? 'border-slate-200/90' : 'border-rose-200 bg-rose-50/30 opacity-70'"
              >
                <div class="space-y-3">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <span class="px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        {{ d.code }}
                      </span>
                      <h4 class="text-base font-bold text-slate-900 mt-1.5 group-hover:text-indigo-600 transition-colors">
                        {{ d.name }}
                      </h4>
                    </div>

                    <button
                      type="button"
                      (click)="$event.stopPropagation(); orgService.toggleDepartmentActive(d.id)"
                      class="text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors shrink-0"
                      [ngClass]="d.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-100 text-rose-700'"
                    >
                      {{ d.isActive ? 'Active' : 'Inactive' }}
                    </button>
                  </div>

                  <p class="text-xs text-slate-500 line-clamp-2">{{ d.description || 'Academic department offering specialized undergraduate & postgraduate programs.' }}</p>

                  <div class="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs">
                    <div>
                      <div class="text-[10px] font-bold text-slate-400 uppercase">Programs</div>
                      <div class="font-black text-indigo-700 mt-0.5">{{ getDepartmentPrograms(d).length }}</div>
                    </div>
                    <div>
                      <div class="text-[10px] font-bold text-slate-400 uppercase">Students</div>
                      <div class="font-black text-slate-800 mt-0.5">{{ getDepartmentStudentDistribution(d).totalStudents }}</div>
                    </div>
                    <div>
                      <div class="text-[10px] font-bold text-slate-400 uppercase">Placement</div>
                      <div class="font-black text-emerald-600 mt-0.5">{{ getDepartmentPlacementMetrics(d).placementRate }}%</div>
                    </div>
                  </div>

                  <div class="text-xs text-slate-500 space-y-0.5 pt-1">
                    <div *ngIf="d.headOfDepartment"><strong>HOD:</strong> {{ d.headOfDepartment }}</div>
                    <div *ngIf="d.contactEmail"><strong>Email:</strong> {{ d.contactEmail }}</div>
                  </div>
                </div>

                <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-800">
                  <span>View Department Details & Placement Hub</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Courses & Degree Programs Section -->
          <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 class="text-base font-bold text-slate-900">Courses & Degree Programs</h3>
                <p class="text-xs text-slate-500">
                  Comprehensive 4-Year and 2-Year curricula. Click any program to inspect its 8-semester syllabus & units.
                </p>
              </div>
              <button
                type="button"
                (click)="openAddProgramModal()"
                class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs"
              >
                <app-icon name="plus" [size]="14"></app-icon>
                <span>+ Add Program</span>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                *ngFor="let p of orgService.programs()"
                (click)="selectProgram(p)"
                class="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div>
                  <div class="flex items-start justify-between">
                    <span class="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">{{ p.code }}</span>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{{ p.degreeLevel }}</span>
                  </div>
                  <h4 class="text-sm font-bold text-slate-900 mt-2 group-hover:text-indigo-600 transition-colors">{{ p.name }}</h4>
                  <p class="text-xs text-slate-500 mt-1">{{ p.durationYears }} Years ({{ p.durationYears * 2 }} Semesters) • {{ p.totalCredits || 160 }} Credits</p>
                </div>

                <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
                  <span>Explore Syllabus ({{ getProgramSubjects(p).length }} Courses)</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 5: BATCHES & GRADUATION YEARS -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab() === 'batches'" class="space-y-6">
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-900">Academic Batches & Graduation Years</h3>
              <p class="text-xs text-slate-500">Configured graduation cohorts used to organize placement drives and alumni records.</p>
            </div>
            <button
              type="button"
              (click)="openAddBatchModal()"
              class="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs"
            >
              + Add Batch
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              *ngFor="let b of orgService.batches()"
              class="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center justify-between"
            >
              <div>
                <h4 class="text-sm font-bold text-slate-900">{{ b.name }}</h4>
                <p class="text-xs text-slate-500 font-medium mt-0.5">
                  Graduation Class of <strong>{{ b.graduationYear }}</strong>
                </p>
              </div>
              <div class="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                {{ b.graduationYear }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 6: AUDIT LOGS -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab() === 'audit_logs'" class="space-y-4">
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div class="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-slate-900">Administrative Audit Trail</h3>
              <p class="text-xs text-slate-500">Chronological history of administrative actions, enrollments, status toggles, and graduations.</p>
            </div>
            <button
              type="button"
              (click)="auditLogService.loadLogs()"
              class="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
            >
              <app-icon name="rotate-ccw" [size]="14"></app-icon>
              Refresh Logs
            </button>
          </div>

          <div class="divide-y divide-slate-100">
            <div
              *ngFor="let log of auditLogService.logs()"
              class="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-4"
            >
              <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-bold text-xs">
                  <app-icon name="shield" [size]="16"></app-icon>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-xs text-slate-900">{{ log.action }}</span>
                    <span class="px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {{ log.entityType }}
                    </span>
                  </div>
                  <div class="text-xs text-slate-600 mt-1 font-mono text-[11px]">
                    {{ log.details | json }}
                  </div>
                  <div class="text-[10px] text-slate-400 mt-1">
                    By <strong>{{ log.adminName }}</strong> • {{ log.createdAt | date:'medium' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- MODALS & DRAWERS -->
      <!-- ========================================================================= -->

      <!-- 1. ADD / ENROLL STUDENT MODAL -->
      <div *ngIf="showAddStudentModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 custom-scrollbar">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900">Enroll New Student</h3>
            <button (click)="showAddStudentModal = false" class="p-1 text-slate-400 hover:text-slate-600">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <form (submit)="saveNewStudent($event)" class="space-y-4 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Full Name *</label>
                <input type="text" [(ngModel)]="studentForm.fullName" name="fullName" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="e.g. Aryan Dixit" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Email Address *</label>
                <input type="email" [(ngModel)]="studentForm.email" name="email" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="aryan.dixit@careernexus.edu" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Roll Number / Student ID *</label>
                <input type="text" [(ngModel)]="studentForm.rollNumber" name="rollNumber" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 font-mono" placeholder="23CS109" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Phone Number</label>
                <input type="text" [(ngModel)]="studentForm.phone" name="phone" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="+91 98765 43210" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Department *</label>
                <select [(ngModel)]="studentForm.department" name="department" (change)="onStudentDeptChange()" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white">
                  <option *ngFor="let d of orgService.departments()" [value]="d.name">{{ d.name }} ({{ d.code }})</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Graduation Year & Batch *</label>
                <select [(ngModel)]="studentForm.graduationYear" name="gradYear" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white">
                  <option *ngFor="let b of orgService.batches()" [value]="b.graduationYear">{{ b.name }} ({{ b.graduationYear }})</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">CGPA (0 - 10.0) *</label>
                <input type="number" step="0.01" min="0" max="10" [(ngModel)]="studentForm.cgpa" name="cgpa" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 font-mono" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">10th Percentage</label>
                <input type="number" step="0.1" [(ngModel)]="studentForm.tenthPercentage" name="tenth" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="88.5" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">12th Percentage</label>
                <input type="number" step="0.1" [(ngModel)]="studentForm.twelfthPercentage" name="twelfth" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="87.0" />
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700">Technical Skills (Comma separated)</label>
              <input type="text" [(ngModel)]="studentFormSkillsRaw" name="skillsRaw" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="Java, Python, Data Structures, SQL, React" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Placement Status</label>
                <select [(ngModel)]="studentForm.placementStatus" name="status" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white">
                  <option value="Not Placed">Not Placed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Selected">Selected</option>
                  <option value="Offer Accepted">Offer Accepted</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Placed Company (If placed)</label>
                <input type="text" [(ngModel)]="studentForm.placedCompany" name="placedCompany" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="e.g. Microsoft" />
              </div>
            </div>

            <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" (click)="showAddStudentModal = false" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button type="submit" [disabled]="isSubmitting" class="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
                Enroll Student
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 2. EDIT STUDENT MODAL -->
      <div *ngIf="showEditStudentModal && editingStudent" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 custom-scrollbar">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900">Edit Student: {{ editingStudent.fullName }}</h3>
            <button (click)="showEditStudentModal = false" class="p-1 text-slate-400 hover:text-slate-600">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <form (submit)="saveEditStudent($event)" class="space-y-4 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Full Name</label>
                <input type="text" [(ngModel)]="editingStudent.fullName" name="editName" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Email Address</label>
                <input type="email" [(ngModel)]="editingStudent.email" name="editEmail" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Roll Number</label>
                <input type="text" [(ngModel)]="editingStudent.rollNumber" name="editRoll" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 font-mono" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">CGPA</label>
                <input type="number" step="0.01" [(ngModel)]="editingStudent.cgpa" name="editCgpa" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 font-mono" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Graduation Year</label>
                <input type="number" [(ngModel)]="editingStudent.graduationYear" name="editGradYear" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Department</label>
                <select [(ngModel)]="editingStudent.department" name="editDept" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white">
                  <option *ngFor="let d of orgService.departments()" [value]="d.name">{{ d.name }}</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Placement Status</label>
                <select [(ngModel)]="editingStudent.placementStatus" name="editStatus" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white">
                  <option value="Not Placed">Not Placed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Selected">Selected</option>
                  <option value="Offer Accepted">Offer Accepted</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Placed Company</label>
                <input type="text" [(ngModel)]="editingStudent.placedCompany" name="editCompany" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="e.g. Google" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Placed Package</label>
                <input type="text" [(ngModel)]="editingStudent.placedPackage" name="editPackage" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="e.g. ₹28 LPA" />
              </div>
            </div>

            <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" (click)="showEditStudentModal = false" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 3. GRADUATE STUDENT TO ALUMNI MODAL -->
      <div *ngIf="showGraduateModal && graduatingStudent" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Graduate Student</span>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">🎓 Transition</span>
            </h3>
            <button (click)="showGraduateModal = false" class="p-1 text-slate-400 hover:text-slate-600">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <p class="text-xs text-slate-600">
            You are graduating <strong>{{ graduatingStudent.fullName }}</strong> ({{ graduatingStudent.rollNumber }}). This will upgrade their account role to <strong>Alumni</strong>, create an Alumni Mentor profile, and preserve all historical placement records.
          </p>

          <form (submit)="confirmGraduation($event)" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700">Graduation Year</label>
              <input type="number" [(ngModel)]="graduateForm.graduationYear" name="gradYear" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700">Employer / Company (Optional)</label>
              <input type="text" [(ngModel)]="graduateForm.company" name="company" placeholder="e.g. Google / Microsoft / Core Engineering" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700">Job Title / Designation</label>
              <input type="text" [(ngModel)]="graduateForm.designation" name="designation" placeholder="e.g. Software Development Engineer" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
            </div>

            <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" (click)="showGraduateModal = false" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs">
                Graduate into Alumni
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 4. ADD ALUMNI MODAL -->
      <div *ngIf="showAddAlumniModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 custom-scrollbar">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900">Register Alumni Mentor</h3>
            <button (click)="showAddAlumniModal = false" class="p-1 text-slate-400 hover:text-slate-600">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <form (submit)="saveNewAlumni($event)" class="space-y-4 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Full Name *</label>
                <input type="text" [(ngModel)]="alumniForm.fullName" name="alumName" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="e.g. Priya Nair" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Email Address *</label>
                <input type="email" [(ngModel)]="alumniForm.email" name="alumEmail" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="priya.nair@google.com" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Alumni ID (Optional)</label>
                <input type="text" [(ngModel)]="alumniForm.alumniId" name="alumId" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 font-mono" placeholder="ALUM-2022-042" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Graduation Year *</label>
                <input type="number" [(ngModel)]="alumniForm.graduationYear" name="alumYear" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Department *</label>
                <select [(ngModel)]="alumniForm.department" name="alumDept" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white">
                  <option *ngFor="let d of orgService.departments()" [value]="d.name">{{ d.name }}</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Current Company (Optional)</label>
                <input type="text" [(ngModel)]="alumniForm.company" name="alumCompany" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="Google / Microsoft" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Job Title / Role</label>
                <input type="text" [(ngModel)]="alumniForm.designation" name="alumDesignation" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="Senior SDE" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Experience (Years)</label>
                <input type="number" step="0.5" [(ngModel)]="alumniForm.experienceYears" name="alumExp" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700">Mentorship Expertise & Skills (Comma separated)</label>
              <input type="text" [(ngModel)]="alumniFormSkillsRaw" name="alumSkills" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="System Design, Java, Distributed Systems, Cloud Architecture" />
            </div>

            <div class="flex items-center gap-2 pt-2">
              <input type="checkbox" [(ngModel)]="alumniForm.availableForMentoring" name="available" id="avail" class="rounded text-purple-600" />
              <label for="avail" class="font-semibold text-slate-700 cursor-pointer">Available for Student 1-on-1 Mentoring & Mock Calls</label>
            </div>

            <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" (click)="showAddAlumniModal = false" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs">
                Register Alumni
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 5. EDIT ALUMNI MODAL -->
      <div *ngIf="showEditAlumniModal && editingAlumni" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900">Edit Alumni: {{ editingAlumni.fullName }}</h3>
            <button (click)="showEditAlumniModal = false" class="p-1 text-slate-400 hover:text-slate-600">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <form (submit)="saveEditAlumni($event)" class="space-y-4 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Full Name</label>
                <input type="text" [(ngModel)]="editingAlumni.fullName" name="editAlumName" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Email</label>
                <input type="email" [(ngModel)]="editingAlumni.email" name="editAlumEmail" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Company</label>
                <input type="text" [(ngModel)]="editingAlumni.company" name="editAlumComp" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Designation</label>
                <input type="text" [(ngModel)]="editingAlumni.designation" name="editAlumDesig" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <input type="checkbox" [(ngModel)]="editingAlumni.availableForMentoring" name="editAvail" id="editAvail" class="rounded text-purple-600" />
              <label for="editAvail" class="font-semibold text-slate-700 cursor-pointer">Available for Student Mentoring</label>
            </div>

            <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" (click)="showEditAlumniModal = false" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 6. STUDENT INSPECTION DRAWER -->
      <div *ngIf="inspectingStudent" class="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs">
        <div class="w-full max-w-xl bg-white h-full shadow-2xl p-6 sm:p-8 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-300 custom-scrollbar">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <img [src]="inspectingStudent.profilePhoto" class="w-12 h-12 rounded-2xl object-cover border border-slate-200" />
              <div>
                <h3 class="text-base font-bold text-slate-900">{{ inspectingStudent.fullName }}</h3>
                <p class="text-xs text-slate-500 font-mono">{{ inspectingStudent.rollNumber }} • {{ inspectingStudent.department }}</p>
              </div>
            </div>
            <button (click)="inspectingStudent = null" class="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <!-- Academic Metrics Card -->
          <div class="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div>
              <div class="text-[10px] uppercase font-bold text-slate-400">CGPA</div>
              <div class="text-lg font-black text-blue-700 mt-0.5">{{ inspectingStudent.cgpa.toFixed(2) }}</div>
            </div>
            <div>
              <div class="text-[10px] uppercase font-bold text-slate-400">10th Std</div>
              <div class="text-lg font-black text-slate-800 mt-0.5">{{ inspectingStudent.tenthPercentage }}%</div>
            </div>
            <div>
              <div class="text-[10px] uppercase font-bold text-slate-400">12th Std</div>
              <div class="text-lg font-black text-slate-800 mt-0.5">{{ inspectingStudent.twelfthPercentage }}%</div>
            </div>
          </div>

          <!-- Placement Readiness Score Banner -->
          <div *ngIf="inspectingReadiness" class="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Placement Readiness</span>
                <div class="text-lg font-black">{{ inspectingReadiness.overallScore }} / 100</div>
              </div>
              <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {{ inspectingReadiness.tierReadiness }}
              </span>
            </div>
            <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-400 rounded-full" [style.width]="inspectingReadiness.overallScore + '%'"></div>
            </div>
            <div class="flex justify-between text-[11px] text-slate-400">
              <span>Task Rate: {{ inspectingReadiness.completionRate }}%</span>
              <span>Assessment Avg: {{ inspectingReadiness.averageScore }}%</span>
            </div>
          </div>

          <!-- Skills & Skill Gap Badges -->
          <div class="space-y-3">
            <div>
              <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Verified Skill Stack</h4>
              <div class="flex flex-wrap gap-1.5">
                <span *ngFor="let sk of inspectingStudent.skills" class="px-2.5 py-1 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {{ sk }}
                </span>
              </div>
            </div>

            <div *ngIf="inspectingSkillGap && inspectingSkillGap.missingSkills.length > 0">
              <h4 class="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                <app-icon name="alert-triangle" [size]="13" customClass="text-rose-600"></app-icon>
                Skill Gaps vs Applied Roles ({{ inspectingSkillGap.missingSkills.length }})
              </h4>
              <div class="flex flex-wrap gap-1.5">
                <span *ngFor="let sk of inspectingSkillGap.missingSkills" class="px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  ⚡ {{ sk }}
                </span>
              </div>
            </div>
          </div>

          <!-- Company-Based Preparation Tasks -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Company Preparation Tasks ({{ inspectingTasks.length }})</h4>
              <span class="text-[11px] text-slate-500 font-semibold">{{ inspectingReadiness?.completedTasks || 0 }} Done</span>
            </div>
            <div *ngIf="inspectingTasks.length > 0" class="space-y-2">
              <div *ngFor="let t of inspectingTasks" class="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div class="min-w-0 pr-2">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] font-bold text-slate-500 uppercase">{{ t.companyName }}</span>
                    <span class="text-[10px] font-bold px-1.5 py-0.2 rounded" [ngClass]="t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'">{{ t.status }}</span>
                  </div>
                  <h5 class="text-xs font-bold text-slate-900 truncate mt-0.5">{{ t.title }}</h5>
                </div>
                <div *ngIf="t.score !== undefined" class="text-right shrink-0">
                  <span class="text-xs font-black text-emerald-700">{{ t.score }}%</span>
                </div>
              </div>
            </div>
            <p *ngIf="inspectingTasks.length === 0" class="text-xs text-slate-400">No company preparation tasks assigned yet.</p>
          </div>

          <!-- Student Applications History -->
          <div>
            <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Placement Applications & Rounds</h4>
            <div *ngIf="inspectingApplications.length > 0" class="space-y-3">
              <div *ngFor="let app of inspectingApplications" class="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
                <div class="flex items-center justify-between">
                  <div>
                    <h5 class="text-xs font-bold text-slate-900">{{ app.companyName }}</h5>
                    <p class="text-[11px] text-slate-500">{{ app.jobTitle }} • {{ app.salary }}</p>
                  </div>
                  <app-badge [variant]="app.status === 'Selected' ? 'success' : app.status === 'Rejected' ? 'error' : 'warning'">{{ app.status }}</app-badge>
                </div>
                <div *ngIf="app.timeline && app.timeline.length > 0" class="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <div *ngFor="let t of app.timeline" class="flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    <strong class="text-slate-700">{{ t.status }}:</strong>
                    <span>{{ t.notes || 'Status updated' }}</span>
                  </div>
                </div>
              </div>
            </div>
            <p *ngIf="inspectingApplications.length === 0" class="text-xs text-slate-400">No active applications filed yet.</p>
          </div>
        </div>
      </div>

      <!-- 7. ADD DEPARTMENT MODAL -->
      <div *ngIf="showAddDepartmentModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900">Add Academic Department</h3>
            <button type="button" (click)="showAddDepartmentModal = false" class="p-1 text-slate-400 hover:text-slate-600">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>
          <form (submit)="saveNewDepartment($event)" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700">Department Code *</label>
              <input type="text" [(ngModel)]="deptForm.code" name="dCode" required placeholder="e.g. CYBER" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 uppercase font-mono" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700">Department Name *</label>
              <input type="text" [(ngModel)]="deptForm.name" name="dName" required placeholder="e.g. Cyber Security & Forensics" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700">Head of Department (HOD)</label>
              <input type="text" [(ngModel)]="deptForm.headOfDepartment" name="dHOD" placeholder="Dr. S. K. Roy" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700">Contact Email</label>
              <input type="email" [(ngModel)]="deptForm.contactEmail" name="dEmail" placeholder="hod.cyber@careernexus.edu" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
            </div>
            <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" (click)="showAddDepartmentModal = false" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">Create Department</button>
            </div>
          </form>
        </div>
      </div>

      <!-- 7B. EDIT DEPARTMENT MODAL -->
      <div *ngIf="showEditDepartmentModal && editingDepartment" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900">Edit Department: {{ editingDepartment.name }}</h3>
            <button type="button" (click)="showEditDepartmentModal = false" class="p-1 text-slate-400 hover:text-slate-600">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <form (submit)="saveEditDepartment($event)" class="space-y-4 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Department Code *</label>
                <input type="text" [(ngModel)]="editingDepartment.code" name="edCode" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 font-mono uppercase" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Department Name *</label>
                <input type="text" [(ngModel)]="editingDepartment.name" name="edName" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Head of Department (HOD)</label>
                <input type="text" [(ngModel)]="editingDepartment.headOfDepartment" name="edHOD" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Contact Email</label>
                <input type="email" [(ngModel)]="editingDepartment.contactEmail" name="edEmail" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Contact Phone</label>
                <input type="text" [(ngModel)]="editingDepartment.contactPhone" name="edPhone" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="+91 44 2235 7000" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Campus Location / Building</label>
                <input type="text" [(ngModel)]="editingDepartment.building" name="edBuilding" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="e.g. Ramanujan Block, Floor 3" />
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700">Department Description</label>
              <textarea [(ngModel)]="editingDepartment.description" name="edDesc" rows="2" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200"></textarea>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <input type="checkbox" [(ngModel)]="editingDepartment.isActive" name="edActive" id="edActive" class="rounded text-indigo-600" />
              <label for="edActive" class="font-semibold text-slate-700 cursor-pointer">Department is Active & Enrolling Students</label>
            </div>

            <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" (click)="showEditDepartmentModal = false" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">Save Changes</button>
            </div>
          </form>
        </div>
      </div>

      <!-- 8. ADD BATCH MODAL -->
      <div *ngIf="showAddBatchModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900">Add Academic Batch</h3>
            <button type="button" (click)="showAddBatchModal = false" class="p-1 text-slate-400 hover:text-slate-600">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>
          <form (submit)="saveNewBatch($event)" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700">Batch Name *</label>
              <input type="text" [(ngModel)]="batchForm.name" name="bName" required placeholder="e.g. Batch 2025-2029" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700">Graduation Year *</label>
              <input type="number" [(ngModel)]="batchForm.graduationYear" name="bGrad" required placeholder="2029" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
            </div>
            <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" (click)="showAddBatchModal = false" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs">Create Batch</button>
            </div>
          </form>
        </div>
      </div>

      <!-- 9. SUBJECT DETAILS MODAL (ACCORDION UNITS I - V) -->
      <div *ngIf="viewingSubject" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 custom-scrollbar animate-in zoom-in-95 duration-200">
          <!-- Header -->
          <div class="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {{ viewingSubject.code }}
                </span>
                <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Semester {{ viewingSubject.semester }}
                </span>
                <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {{ viewingSubject.courseType }}
                </span>
                <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {{ viewingSubject.credits }} Credits
                </span>
              </div>
              <h3 class="text-xl font-bold text-slate-900 mt-1">{{ viewingSubject.name }}</h3>
              <p class="text-xs text-slate-500 leading-relaxed">{{ viewingSubject.description }}</p>
            </div>

            <button
              type="button"
              (click)="closeSubjectModal()"
              class="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
            >
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <!-- Prerequisites & Skills Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span class="text-[10px] uppercase font-bold text-slate-400">Prerequisites</span>
              <div class="flex flex-wrap gap-1 mt-1">
                <span *ngFor="let p of viewingSubject.prerequisites" class="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[11px] text-slate-700">
                  {{ p }}
                </span>
                <span *ngIf="!viewingSubject.prerequisites || viewingSubject.prerequisites.length === 0" class="text-slate-400 italic text-[11px]">
                  None (Introductory Level)
                </span>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1">
              <span class="text-[10px] uppercase font-bold text-emerald-600">Key Skills Acquired</span>
              <div class="flex flex-wrap gap-1 mt-1">
                <span *ngFor="let sk of viewingSubject.skillsDeveloped" class="px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-800 text-[11px] font-semibold">
                  ✓ {{ sk }}
                </span>
                <span *ngIf="!viewingSubject.skillsDeveloped || viewingSubject.skillsDeveloped.length === 0" class="text-slate-400 italic text-[11px]">
                  Core Academic Competencies
                </span>
              </div>
            </div>
          </div>

          <!-- Syllabus Units Section (Unit I - Unit V Accordion) -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-bold text-slate-900">Detailed Syllabus Breakdown</h4>
                <p class="text-xs text-slate-500">
                  {{ viewingSubject.syllabusUnits?.length || 0 }} Units • {{ getTotalSubjectHours(viewingSubject) }} Total Lecture Hours
                </p>
              </div>

              <button
                type="button"
                (click)="openAddUnit(viewingSubject)"
                class="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1 shadow-2xs"
              >
                <app-icon name="plus" [size]="12"></app-icon>
                <span>+ Add Syllabus Unit</span>
              </button>
            </div>

            <!-- Accordion Units List -->
            <div class="space-y-3">
              <div
                *ngFor="let unit of viewingSubject.syllabusUnits"
                class="rounded-2xl border border-slate-200 overflow-hidden transition-all bg-white"
              >
                <!-- Unit Header Accordion Bar -->
                <div
                  (click)="toggleUnitExpanded(unit.id)"
                  class="p-4 bg-slate-50/80 hover:bg-slate-100/80 transition-colors cursor-pointer flex items-center justify-between gap-3 select-none"
                >
                  <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                      U{{ unit.unitNumber }}
                    </span>
                    <div>
                      <h5 class="text-xs font-bold text-slate-900">
                        Unit {{ unit.unitNumber }}: {{ unit.title }}
                      </h5>
                      <p class="text-[11px] text-slate-500">{{ unit.hours }} Lecture Hours</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      (click)="$event.stopPropagation(); openEditUnit(viewingSubject, unit)"
                      title="Edit Unit"
                      class="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white transition-colors"
                    >
                      <app-icon name="edit" [size]="14"></app-icon>
                    </button>
                    <button
                      type="button"
                      (click)="$event.stopPropagation(); deleteUnit(viewingSubject.id, unit.id)"
                      title="Delete Unit"
                      class="p-1 text-rose-400 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <app-icon name="trash" [size]="14"></app-icon>
                    </button>
                    <app-icon [name]="isUnitExpanded(unit.id) ? 'chevron-up' : 'chevron-down'" [size]="16" class="text-slate-400"></app-icon>
                  </div>
                </div>

                <!-- Unit Expandable Body -->
                <div *ngIf="isUnitExpanded(unit.id)" class="p-5 border-t border-slate-100 space-y-4 text-xs animate-in fade-in duration-150">
                  <p class="text-slate-600 leading-relaxed">{{ unit.description }}</p>

                  <!-- Topics Covered -->
                  <div class="space-y-1.5">
                    <div class="text-[10px] uppercase font-bold text-slate-400">Topics & Concepts Covered</div>
                    <div class="flex flex-wrap gap-1.5">
                      <span *ngFor="let top of unit.topics" class="px-2 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200/60">
                        • {{ top }}
                      </span>
                    </div>
                  </div>

                  <!-- Learning Objectives -->
                  <div *ngIf="unit.learningObjectives && unit.learningObjectives.length > 0" class="space-y-1.5 pt-2 border-t border-slate-100">
                    <div class="text-[10px] uppercase font-bold text-indigo-500">Unit Learning Outcomes</div>
                    <ul class="space-y-1 text-slate-600 pl-4 list-disc text-[11px]">
                      <li *ngFor="let obj of unit.learningObjectives">{{ obj }}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div *ngIf="!viewingSubject.syllabusUnits || viewingSubject.syllabusUnits.length === 0" class="text-center py-8 text-slate-400 text-xs">
                No syllabus units added yet for this subject.
              </div>
            </div>
          </div>

          <!-- Reference Books -->
          <div *ngIf="viewingSubject.referenceBooks && viewingSubject.referenceBooks.length > 0" class="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
            <span class="text-[10px] uppercase font-bold text-slate-400">Prescribed Reference Books & Textbooks</span>
            <ul class="space-y-1 text-slate-700 text-[11px] pl-4 list-decimal">
              <li *ngFor="let bk of viewingSubject.referenceBooks">{{ bk }}</li>
            </ul>
          </div>

          <!-- Footer -->
          <div class="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              (click)="openEditSubject(viewingSubject)"
              class="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs"
            >
              <app-icon name="edit" [size]="14"></app-icon>
              <span>Edit Subject Meta</span>
            </button>

            <button
              type="button"
              (click)="closeSubjectModal()"
              class="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs"
            >
              Close Syllabus
            </button>
          </div>
        </div>
      </div>

      <!-- 10. ADD / EDIT SUBJECT MODAL -->
      <div *ngIf="isAddingSubject || editingSubject" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 custom-scrollbar">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900">
              {{ editingSubject ? 'Edit Course / Subject' : 'Add Course to Curriculum' }}
            </h3>
            <button type="button" (click)="isAddingSubject = false; editingSubject = null" class="p-1 text-slate-400 hover:text-slate-600">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <form (submit)="saveSubject($event)" class="space-y-4 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Course Code *</label>
                <input type="text" [(ngModel)]="subjectForm.code" name="subCode" required placeholder="e.g. CS201" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 font-mono uppercase" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Course Title *</label>
                <input type="text" [(ngModel)]="subjectForm.name" name="subName" required placeholder="e.g. Data Structures & Algorithms" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Semester *</label>
                <input type="number" min="1" max="10" [(ngModel)]="subjectForm.semester" name="subSem" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Credits *</label>
                <input type="number" min="1" max="12" [(ngModel)]="subjectForm.credits" name="subCred" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Course Type *</label>
                <select [(ngModel)]="subjectForm.courseType" name="subType" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white">
                  <option value="Core">Core</option>
                  <option value="Elective">Elective</option>
                  <option value="Lab">Lab / Practical</option>
                  <option value="Project">Project / Capstone</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700">Course Overview & Description</label>
              <textarea [(ngModel)]="subjectForm.description" name="subDesc" rows="2" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="Summary of course contents, aims, and placement relevance..."></textarea>
            </div>

            <div>
              <label class="block font-semibold text-slate-700">Prerequisites (Comma-separated course codes)</label>
              <input type="text" [(ngModel)]="subjectPrereqsRaw" name="subPre" placeholder="e.g. CS101, MA101" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 font-mono" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700">Key Skills Developed (Comma-separated)</label>
              <input type="text" [(ngModel)]="subjectSkillsRaw" name="subSkills" placeholder="e.g. Trees, Dynamic Programming, Complexity Analysis" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700">Reference Books & Textbooks (Comma-separated)</label>
              <input type="text" [(ngModel)]="subjectBooksRaw" name="subBooks" placeholder="e.g. Introduction to Algorithms (CLRS), Algorithms in C++" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
            </div>

            <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" (click)="isAddingSubject = false; editingSubject = null" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
                {{ editingSubject ? 'Update Course' : 'Add Course' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 11. ADD / EDIT SYLLABUS UNIT MODAL -->
      <div *ngIf="isAddingUnit || editingUnit" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 custom-scrollbar">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900">
              {{ editingUnit ? 'Edit Syllabus Unit' : 'Add Syllabus Unit (e.g. Unit I to V)' }}
            </h3>
            <button type="button" (click)="isAddingUnit = false; editingUnit = null" class="p-1 text-slate-400 hover:text-slate-600">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <form (submit)="saveUnit($event)" class="space-y-4 text-xs">
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Unit Number *</label>
                <input type="number" min="1" max="10" [(ngModel)]="unitForm.unitNumber" name="uNum" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 font-bold" />
              </div>
              <div class="col-span-2">
                <label class="block font-semibold text-slate-700">Estimated Lecture Hours *</label>
                <input type="number" min="1" max="40" [(ngModel)]="unitForm.hours" name="uHrs" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700">Unit Title *</label>
              <input type="text" [(ngModel)]="unitForm.title" name="uTitle" required placeholder="e.g. Linear Data Structures & Arrays" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700">Unit Description / Scope</label>
              <textarea [(ngModel)]="unitForm.description" name="uDesc" rows="2" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="Overview of topics and concepts in this unit..."></textarea>
            </div>

            <div>
              <label class="block font-semibold text-slate-700">Key Topics (Comma-separated)</label>
              <textarea [(ngModel)]="unitTopicsRaw" name="uTopics" rows="2" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="e.g. Abstract Data Types, Arrays, Dynamic Arrays, Linked Lists, Stack, Queue"></textarea>
            </div>

            <div>
              <label class="block font-semibold text-slate-700">Learning Outcomes / Objectives (Comma-separated)</label>
              <textarea [(ngModel)]="unitObjectivesRaw" name="uObjs" rows="2" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" placeholder="e.g. Understand asymptotic bounds, Implement single and doubly linked lists"></textarea>
            </div>

            <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" (click)="isAddingUnit = false; editingUnit = null" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
                {{ editingUnit ? 'Update Unit' : 'Save Unit' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 12. ADD / EDIT PROGRAM MODAL -->
      <div *ngIf="showAddProgramModal || showEditProgramModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900">
              {{ editingProgram ? 'Edit Degree Program' : 'Add Degree Program' }}
            </h3>
            <button type="button" (click)="showAddProgramModal = false; showEditProgramModal = false; editingProgram = null" class="p-1 text-slate-400 hover:text-slate-600">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <form (submit)="saveProgram($event)" class="space-y-4 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Program Code *</label>
                <input type="text" [(ngModel)]="progForm.code" name="pCode" required placeholder="e.g. B.TECH CSE" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 font-mono uppercase" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Degree Level *</label>
                <select [(ngModel)]="progForm.degreeLevel" name="pDeg" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white">
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Doctorate">Doctorate</option>
                  <option value="Diploma">Diploma</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700">Program Name *</label>
              <input type="text" [(ngModel)]="progForm.name" name="pName" required placeholder="e.g. Bachelor of Technology in Computer Science & Engineering" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Duration (Years) *</label>
                <input type="number" min="1" max="6" [(ngModel)]="progForm.durationYears" name="pDur" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Total Credits *</label>
                <input type="number" min="30" max="300" [(ngModel)]="progForm.totalCredits" name="pCred" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Department</label>
                <select [(ngModel)]="progForm.departmentId" name="pDept" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white">
                  <option value="">None / Interdisciplinary</option>
                  <option *ngFor="let d of orgService.departments()" [value]="d.id">{{ d.name }} ({{ d.code }})</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700">Program Description</label>
              <textarea [(ngModel)]="progForm.description" name="pDesc" rows="2" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200"></textarea>
            </div>

            <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" (click)="showAddProgramModal = false; showEditProgramModal = false; editingProgram = null" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
                {{ editingProgram ? 'Save Program' : 'Create Program' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- ROLE EDITING CONFIRMATION MODAL (Zero Data Loss) -->
      <!-- ========================================================================= -->
      <div
        *ngIf="showEditRoleModal && editingUser"
        class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      >
        <div class="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden space-y-5 animate-in zoom-in-95 duration-200 p-6">
          <!-- Modal Header -->
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <app-icon name="shield" [size]="20"></app-icon>
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900 leading-tight">Modify User Role</h3>
                <p class="text-xs text-slate-500">Update system authorization and portal workspace</p>
              </div>
            </div>
            <button
              type="button"
              (click)="closeEditRoleModal()"
              class="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <app-icon name="x" [size]="18"></app-icon>
            </button>
          </div>

          <!-- Zero Data Loss Protection Notice -->
          <div class="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 flex items-start gap-2.5 text-xs">
            <app-icon name="shield-check" [size]="18" customClass="text-blue-600 shrink-0 mt-0.5"></app-icon>
            <div class="leading-relaxed">
              <strong class="font-bold text-blue-900">Zero Data Loss Architecture:</strong>
              Changing this user's role will adjust their workspace permissions and portal access. All existing applications, placement records, mock test attempts, tasks, and communications remain preserved intact.
            </div>
          </div>

          <!-- Target User Profile Card -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <img
                [src]="editingUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'"
                class="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div>
                <h4 class="text-sm font-bold text-slate-900">{{ editingUser.fullName }}</h4>
                <p class="text-xs text-slate-500">{{ editingUser.email }}</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Current Role</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-slate-200 text-slate-800">
                {{ editingUser.role }}
              </span>
            </div>
          </div>

          <!-- Role Selection Cards -->
          <div class="space-y-2">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500">Select New Role *</label>
            <div class="grid grid-cols-2 gap-2.5">
              <!-- Student Card -->
              <button
                type="button"
                (click)="selectedNewRole = 'student'"
                class="p-3 rounded-2xl border-2 text-left transition-all flex flex-col gap-1 cursor-pointer"
                [ngClass]="selectedNewRole === 'student' ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-xs' : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'"
              >
                <div class="flex items-center justify-between">
                  <span class="text-lg">🎓</span>
                  <span *ngIf="selectedNewRole === 'student'" class="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-blue-600 text-white">SELECTED</span>
                </div>
                <div class="text-xs font-bold mt-1">Student</div>
                <div class="text-[10.5px] text-slate-500 leading-tight">Campus placement candidate, applications, & mock tests</div>
              </button>

              <!-- Alumni Card -->
              <button
                type="button"
                (click)="selectedNewRole = 'alumni'"
                class="p-3 rounded-2xl border-2 text-left transition-all flex flex-col gap-1 cursor-pointer"
                [ngClass]="selectedNewRole === 'alumni' ? 'border-purple-600 bg-purple-50/70 text-purple-950 shadow-xs' : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'"
              >
                <div class="flex items-center justify-between">
                  <span class="text-lg">💼</span>
                  <span *ngIf="selectedNewRole === 'alumni'" class="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-purple-600 text-white">SELECTED</span>
                </div>
                <div class="text-xs font-bold mt-1">Alumni Mentor</div>
                <div class="text-[10.5px] text-slate-500 leading-tight">Mentorship portal, mentee guidance, and interview prep</div>
              </button>

              <!-- Recruiter Card -->
              <button
                type="button"
                (click)="selectedNewRole = 'recruiter'"
                class="p-3 rounded-2xl border-2 text-left transition-all flex flex-col gap-1 cursor-pointer"
                [ngClass]="selectedNewRole === 'recruiter' ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs' : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'"
              >
                <div class="flex items-center justify-between">
                  <span class="text-lg">🏢</span>
                  <span *ngIf="selectedNewRole === 'recruiter'" class="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-600 text-white">SELECTED</span>
                </div>
                <div class="text-xs font-bold mt-1">Corporate Recruiter</div>
                <div class="text-[10.5px] text-slate-500 leading-tight">Post drives, schedule interviews, and evaluate applicants</div>
              </button>

              <!-- Admin Card -->
              <button
                type="button"
                (click)="selectedNewRole = 'admin'"
                class="p-3 rounded-2xl border-2 text-left transition-all flex flex-col gap-1 cursor-pointer"
                [ngClass]="selectedNewRole === 'admin' ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-xs' : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'"
              >
                <div class="flex items-center justify-between">
                  <span class="text-lg">⚡</span>
                  <span *ngIf="selectedNewRole === 'admin'" class="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-600 text-white">SELECTED</span>
                </div>
                <div class="text-xs font-bold mt-1">Administrator</div>
                <div class="text-[10.5px] text-slate-500 leading-tight">Command center, user management, and institutional control</div>
              </button>
            </div>
          </div>

          <!-- Reason for change -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Reason for Role Change (Logged to Audit Trail)</label>
            <input
              type="text"
              [(ngModel)]="roleChangeReason"
              placeholder="e.g. Graduated batch 2026, recruited as corporate partner..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- Action Buttons -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              (click)="closeEditRoleModal()"
              class="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="confirmRoleChange()"
              [disabled]="isUpdatingRole"
              class="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span *ngIf="isUpdatingRole" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>{{ isUpdatingRole ? 'Updating Role...' : 'Confirm Role Change' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  studentService = inject(StudentService);
  alumniService = inject(AlumniService);
  adminUserService = inject(AdminUserService);
  authService = inject(AuthService);
  router = inject(Router);
  orgService = inject(OrganizationService);
  csvImportService = inject(CsvImportService);
  auditLogService = inject(AuditLogService);
  jobService = inject(JobService);
  taskService = inject(TaskService);
  toast = inject(ToastService);

  readonly Math = Math;

  activeTab = signal<AdminTab>('users');

  // System Users & Role Management State
  userSearch = signal('');
  userRoleFilter = signal('all');
  userStatusFilter = signal('all');
  userPageIndex = signal(1);
  readonly userPageSize = 12;

  showEditRoleModal = false;
  editingUser: User | null = null;
  selectedNewRole: UserRole = 'student';
  roleChangeReason = 'Administrative role reassignment';
  isUpdatingRole = false;

  getRoleEmoji(role: string): string {
    switch (role) {
      case 'student': return '🎓';
      case 'alumni': return '💼';
      case 'recruiter': return '🏢';
      case 'admin': return '⚡';
      default: return '👤';
    }
  }

  userCountByRole(role: UserRole): number {
    return this.adminUserService.users().filter(u => u.role === role).length;
  }

  filteredUsers = computed(() => {
    let list = this.adminUserService.users();
    const q = this.userSearch().toLowerCase().trim();
    const r = this.userRoleFilter();
    const s = this.userStatusFilter();

    if (r !== 'all') {
      list = list.filter(u => u.role === r);
    }

    if (s !== 'all') {
      list = list.filter(u => (s === 'active' ? u.isActive !== false : u.isActive === false));
    }

    if (q) {
      list = list.filter(u =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        (u.company && u.company.toLowerCase().includes(q)) ||
        (u.rollNumber && u.rollNumber.toLowerCase().includes(q))
      );
    }

    return list;
  });

  get userTotalPages(): number {
    return Math.ceil(this.filteredUsers().length / this.userPageSize) || 1;
  }

  paginatedUsers = computed(() => {
    const list = this.filteredUsers();
    const start = (this.userPageIndex() - 1) * this.userPageSize;
    return list.slice(start, start + this.userPageSize);
  });

  openEditRoleModal(user: User) {
    this.editingUser = user;
    this.selectedNewRole = user.role;
    this.roleChangeReason = `Administrative role update for ${user.fullName}`;
    this.showEditRoleModal = true;
  }

  closeEditRoleModal() {
    this.showEditRoleModal = false;
    this.editingUser = null;
  }

  async confirmRoleChange() {
    if (!this.editingUser) return;
    this.isUpdatingRole = true;

    try {
      const res = await this.adminUserService.updateUserRole(
        this.editingUser.id,
        this.selectedNewRole,
        this.roleChangeReason
      );

      if (res.success) {
        this.closeEditRoleModal();
      }
    } finally {
      this.isUpdatingRole = false;
    }
  }

  async toggleUserActivation(user: User) {
    const targetStatus = !user.isActive;
    const actionText = targetStatus ? 'Reactivate' : 'Deactivate';

    if (user.role === 'admin' && this.authService.currentUser()?.id === user.id && !targetStatus) {
      this.toast.error('Action Prohibited', 'You cannot deactivate your own administrative account.');
      return;
    }

    if (confirm(`Are you sure you want to ${actionText.toLowerCase()} ${user.fullName}'s account? All existing application history and tasks are preserved.`)) {
      await this.adminUserService.toggleUserStatus(user.id, targetStatus, `Admin ${actionText.toLowerCase()}d user.`);
      this.adminUserService.users.update(list => list.map(u => u.id === user.id ? { ...u, isActive: targetStatus, status: targetStatus ? 'active' : 'deactivated' } : u));
    }
  }

  // Student Filters & Search
  studentSearch = signal('');
  studentDeptFilter = signal('all');
  studentStatusFilter = signal('all');
  studentBatchFilter = signal('all');
  includeDeactivatedStudents = signal(false);
  studentPageIndex = signal(1);
  readonly pageSize = 15;

  // Alumni Filters & Search
  alumniSearch = signal('');
  alumniDeptFilter = signal('all');
  alumniMentoringFilter = signal('all');

  // Modals & States
  showAddStudentModal = false;
  showEditStudentModal = false;
  showGraduateModal = false;
  showAddAlumniModal = false;
  showEditAlumniModal = false;
  showAddDepartmentModal = false;
  showAddBatchModal = false;

  isSubmitting = false;
  isImporting = false;
  isParsingCsv = false;

  // Forms
  studentForm: NewStudentForm = this.getDefaultStudentForm();
  studentFormSkillsRaw = 'Java, Python, Data Structures, SQL';

  editingStudent: Student | null = null;
  graduatingStudent: Student | null = null;
  graduateForm = { graduationYear: 2026, company: '', designation: 'Software Engineer', alumniId: '' };

  alumniForm: NewAlumniForm = this.getDefaultAlumniForm();
  alumniFormSkillsRaw = 'System Design, Cloud Architecture, Java';
  editingAlumni: Alumni | null = null;

  inspectingStudent: Student | null = null;
  inspectingApplications: Application[] = [];
  inspectingTasks: StudentTask[] = [];
  inspectingReadiness: PlacementReadinessMetrics | null = null;
  inspectingSkillGap: SkillGapAnalysis | null = null;

  deptForm = { code: '', name: '', headOfDepartment: '', contactEmail: '', isActive: true };
  batchForm = { name: '', graduationYear: 2028, startYear: 2024, isActive: true };

  // Academic & Syllabus drill-down states
  selectedDepartment = signal<Department | null>(null);
  selectedProgram = signal<Program | null>(null);
  deptActiveTab = signal<'overview' | 'programs' | 'analytics' | 'alumni'>('overview');

  deptStudentSearch = '';
  deptStudentYearFilter = 'all';
  deptStudentStatusFilter = 'all';

  syllabusSemesterFilter: number | 'all' = 'all';
  syllabusSearch = '';
  syllabusCourseTypeFilter = 'all';

  expandedUnits = new Set<string>();
  expandedCompanies = new Set<string>();

  viewingSubject: Subject | null = null;
  editingSubject: Subject | null = null;
  isAddingSubject = false;
  subjectProgramId = '';
  subjectForm: Partial<Subject> = {
    code: '',
    name: '',
    semester: 1,
    credits: 3,
    courseType: 'Core',
    description: '',
    prerequisites: [],
    referenceBooks: [],
    skillsDeveloped: []
  };
  subjectPrereqsRaw = '';
  subjectSkillsRaw = '';
  subjectBooksRaw = '';

  editingUnit: SyllabusUnit | null = null;
  unitSubjectId = '';
  isAddingUnit = false;
  unitForm: Partial<SyllabusUnit> = {
    unitNumber: 1,
    title: '',
    description: '',
    topics: [],
    hours: 9,
    learningObjectives: []
  };
  unitTopicsRaw = '';
  unitObjectivesRaw = '';

  showEditDepartmentModal = false;
  editingDepartment: Department | null = null;

  showAddProgramModal = false;
  showEditProgramModal = false;
  editingProgram: Program | null = null;
  progForm: Partial<Program> = {
    code: '',
    name: '',
    degreeLevel: 'Undergraduate',
    durationYears: 4,
    departmentId: '',
    description: '',
    totalCredits: 160
  };

  // CSV Import
  importRole: 'student' | 'alumni' = 'student';
  selectedCsvFile: File | null = null;
  csvReport: CsvParseResult<any> | null = null;
  importProgress = { current: 0, total: 0 };

  ngOnInit() {
    this.adminUserService.loadUsers();
    this.orgService.loadAll();
    this.auditLogService.loadLogs();

    const url = this.router.url;
    if (url.includes('/admin/users')) {
      this.activeTab.set('users');
    } else if (url.includes('/admin/students')) {
      this.activeTab.set('students');
    } else if (url.includes('/admin/alumni')) {
      this.activeTab.set('alumni');
    }
  }

  // --- FILTERED COMPUTATIONS ---
  filteredStudents = computed(() => {
    let list = this.studentService.students();
    const q = this.studentSearch().toLowerCase().trim();
    const dept = this.studentDeptFilter();
    const status = this.studentStatusFilter();
    const batchYear = this.studentBatchFilter();
    const showDeactivated = this.includeDeactivatedStudents();

    if (!showDeactivated) {
      list = list.filter(s => s.isActive !== false);
    }

    if (dept !== 'all') {
      list = list.filter(s => s.department === dept);
    }

    if (status !== 'all') {
      list = list.filter(s => s.placementStatus === status);
    }

    if (batchYear !== 'all') {
      list = list.filter(s => s.graduationYear === Number(batchYear));
    }

    if (q) {
      list = list.filter(s =>
        s.fullName.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.skills.some(sk => sk.toLowerCase().includes(q))
      );
    }

    return list;
  });

  get studentTotalPages(): number {
    return Math.ceil(this.filteredStudents().length / this.pageSize) || 1;
  }

  paginatedStudents = computed(() => {
    const list = this.filteredStudents();
    const start = (this.studentPageIndex() - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  filteredAlumni = computed(() => {
    let list = this.alumniService.alumni();
    const q = this.alumniSearch().toLowerCase().trim();
    const dept = this.alumniDeptFilter();
    const mentoring = this.alumniMentoringFilter();

    if (dept !== 'all') {
      list = list.filter(a => a.department === dept);
    }

    if (mentoring === 'available') {
      list = list.filter(a => a.availableForMentoring);
    } else if (mentoring === 'busy') {
      list = list.filter(a => !a.availableForMentoring);
    }

    if (q) {
      list = list.filter(a =>
        a.fullName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.company.toLowerCase().includes(q) ||
        a.designation.toLowerCase().includes(q)
      );
    }

    return list;
  });

  clearUserFilters() {
    this.userSearch.set('');
    this.userRoleFilter.set('all');
    this.userStatusFilter.set('all');
    this.userPageIndex.set(1);
  }

  clearAlumniFilters() {
    this.alumniSearch.set('');
    this.alumniDeptFilter.set('all');
    this.alumniMentoringFilter.set('all');
  }

  clearStudentFilters() {
    this.studentSearch.set('');
    this.studentDeptFilter.set('all');
    this.studentStatusFilter.set('all');
    this.studentBatchFilter.set('all');
    this.studentPageIndex.set(1);
  }

  // --- STUDENT ACTIONS ---
  private getDefaultStudentForm(): NewStudentForm {
    const firstDept = this.orgService.departments()[0]?.name || 'Computer Science & Engineering';
    return {
      fullName: '',
      email: '',
      rollNumber: '',
      department: firstDept,
      graduationYear: 2027,
      phone: '',
      cgpa: 8.0,
      tenthPercentage: 85,
      twelfthPercentage: 85,
      skills: ['Java', 'Data Structures', 'SQL'],
      preferredDomain: 'Software Development',
      placementStatus: 'Not Placed'
    };
  }

  openAddStudentModal() {
    this.studentForm = this.getDefaultStudentForm();
    this.studentFormSkillsRaw = 'Java, Data Structures, SQL';
    this.showAddStudentModal = true;
  }

  onStudentDeptChange() {
    const matchedDept = this.orgService.departments().find(d => d.name === this.studentForm.department);
    if (matchedDept) {
      this.studentForm.departmentId = matchedDept.id;
    }
  }

  async saveNewStudent(event: Event) {
    event.preventDefault();
    this.studentForm.skills = this.studentFormSkillsRaw.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0);
    this.isSubmitting = true;
    try {
      await this.adminUserService.createStudent(this.studentForm);
      this.showAddStudentModal = false;
    } catch {
      // Toast shown in service
    } finally {
      this.isSubmitting = false;
    }
  }

  openEditStudentModal(s: Student) {
    this.editingStudent = { ...s };
    this.showEditStudentModal = true;
  }

  async saveEditStudent(event: Event) {
    event.preventDefault();
    if (!this.editingStudent) return;
    try {
      await this.adminUserService.updateStudent(this.editingStudent.id, this.editingStudent);
      this.showEditStudentModal = false;
    } catch {
      // Toast in service
    }
  }

  openGraduateModal(s: Student) {
    this.graduatingStudent = s;
    this.graduateForm = {
      graduationYear: s.graduationYear || 2026,
      company: s.placedCompany || 'Leading Technology Firm',
      designation: 'Graduate Engineer',
      alumniId: `ALUM-${s.graduationYear || 2026}-${s.rollNumber.substring(0, 6)}`
    };
    this.showGraduateModal = true;
  }

  async confirmGraduation(event: Event) {
    event.preventDefault();
    if (!this.graduatingStudent) return;
    try {
      await this.adminUserService.graduateStudentToAlumni(this.graduatingStudent.id, this.graduateForm);
      this.showGraduateModal = false;
    } catch {
      // Toast in service
    }
  }

  async toggleUserDeactivation(userId: string, currentActive: boolean, name: string) {
    const nextActive = !currentActive;
    const confirmMsg = nextActive
      ? `Reactivate ${name}'s account?`
      : `Deactivate ${name}'s account? Historical placement records and applications will be preserved.`;

    if (!confirm(confirmMsg)) return;

    await this.adminUserService.toggleUserStatus(userId, nextActive, nextActive ? 'Administrative reactivate' : 'Administrative deactivate');
  }

  async inspectStudent(s: Student) {
    this.inspectingStudent = s;
    this.inspectingApplications = await this.adminUserService.getStudentApplications(s.id);
    this.inspectingTasks = this.taskService.getTasksForStudent(s.id || s.userId);
    
    const appliedJobs = this.inspectingApplications
      .map(a => this.jobService.getJobById(a.jobId))
      .filter((j): j is any => !!j);

    this.inspectingSkillGap = this.taskService.calculateSkillGapAnalysis(s, appliedJobs);
    this.inspectingReadiness = this.taskService.calculatePlacementReadiness(
      s,
      this.inspectingApplications,
      appliedJobs,
      this.inspectingTasks
    );
  }

  // --- ALUMNI ACTIONS ---
  private getDefaultAlumniForm(): NewAlumniForm {
    const firstDept = this.orgService.departments()[0]?.name || 'Computer Science & Engineering';
    return {
      fullName: '',
      email: '',
      graduationYear: 2023,
      department: firstDept,
      company: '',
      designation: 'Software Engineer',
      experienceYears: 2.0,
      skills: ['System Design', 'Cloud Architecture'],
      availableForMentoring: true
    };
  }

  openAddAlumniModal() {
    this.alumniForm = this.getDefaultAlumniForm();
    this.alumniFormSkillsRaw = 'System Design, Cloud Architecture, Java';
    this.showAddAlumniModal = true;
  }

  async saveNewAlumni(event: Event) {
    event.preventDefault();
    this.alumniForm.skills = this.alumniFormSkillsRaw.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0);
    try {
      await this.adminUserService.createAlumni(this.alumniForm);
      this.showAddAlumniModal = false;
    } catch {
      // Toast in service
    }
  }

  openEditAlumniModal(a: Alumni) {
    this.editingAlumni = { ...a };
    this.showEditAlumniModal = true;
  }

  async saveEditAlumni(event: Event) {
    event.preventDefault();
    if (!this.editingAlumni) return;
    try {
      await this.adminUserService.updateAlumni(this.editingAlumni.id, this.editingAlumni);
      this.showEditAlumniModal = false;
    } catch {
      // Toast in service
    }
  }

  inspectAlumni(a: Alumni) {
    this.toast.info(`${a.fullName} Profile`, `${a.designation} at ${a.company || 'Tech Leader'} • Graduated ${a.graduationYear}`);
  }

  // --- CSV IMPORT ---
  downloadSampleCsv() {
    const csvContent = this.csvImportService.generateSampleCsv(this.importRole);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', `sample_${this.importRole}_import.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    this.toast.info('Template Downloaded', `Sample ${this.importRole} CSV template ready.`);
  }

  async onCsvFileSelected(event: any) {
    const file = event.target?.files?.[0];
    if (!file) return;

    this.selectedCsvFile = file;
    this.isParsingCsv = true;

    try {
      const text = await file.text();
      if (this.importRole === 'student') {
        this.csvReport = await this.csvImportService.validateStudentsCsv(text);
      } else {
        this.csvReport = await this.csvImportService.validateAlumniCsv(text);
      }
    } catch (err: any) {
      this.toast.error('CSV Parsing Failed', err.message || 'Could not parse CSV file.');
    } finally {
      this.isParsingCsv = false;
    }
  }

  resetImport() {
    this.selectedCsvFile = null;
    this.csvReport = null;
    this.isImporting = false;
    this.importProgress = { current: 0, total: 0 };
  }

  async executeBulkImport() {
    if (!this.csvReport || this.csvReport.validRows.length === 0) return;

    this.isImporting = true;
    this.importProgress = { current: 0, total: this.csvReport.validRows.length };

    if (this.importRole === 'student') {
      const res = await this.csvImportService.executeBulkStudents(
        this.csvReport.validRows,
        (curr, tot) => { this.importProgress = { current: curr, total: tot }; }
      );
      this.toast.success('Bulk Import Complete', `Successfully enrolled ${res.successCount} students.`);
    } else {
      const res = await this.csvImportService.executeBulkAlumni(
        this.csvReport.validRows,
        (curr, tot) => { this.importProgress = { current: curr, total: tot }; }
      );
      this.toast.success('Bulk Import Complete', `Successfully registered ${res.successCount} alumni mentors.`);
    }

    this.resetImport();
    this.activeTab.set(this.importRole === 'student' ? 'students' : 'alumni');
  }

  // --- DEPARTMENT & BATCH ACTIONS ---
  openAddDepartmentModal() {
    this.deptForm = { code: '', name: '', headOfDepartment: '', contactEmail: '', isActive: true };
    this.showAddDepartmentModal = true;
  }

  async saveNewDepartment(event: Event) {
    event.preventDefault();
    try {
      await this.orgService.addDepartment(this.deptForm);
      this.showAddDepartmentModal = false;
    } catch {
      // Toast in service
    }
  }

  openAddBatchModal() {
    this.batchForm = { name: '', graduationYear: 2028, startYear: 2024, isActive: true };
    this.showAddBatchModal = true;
  }

  async saveNewBatch(event: Event) {
    event.preventDefault();
    try {
      await this.orgService.addBatch(this.batchForm);
      this.showAddBatchModal = false;
    } catch {
      // Toast in service
    }
  }

  // --- ACADEMIC & PLACEMENT SYSTEM ACTIONS & HELPERS ---
  selectDepartment(d: Department | null) {
    this.selectedDepartment.set(d);
    this.selectedProgram.set(null);
    this.deptActiveTab.set('overview');
    this.deptStudentSearch = '';
    this.deptStudentYearFilter = 'all';
    this.deptStudentStatusFilter = 'all';
  }

  selectProgram(p: Program | null) {
    this.selectedProgram.set(p);
    this.syllabusSemesterFilter = 'all';
    this.syllabusSearch = '';
    this.syllabusCourseTypeFilter = 'all';
  }

  getFilteredDepartmentStudents(dept: Department): Student[] {
    let list = this.studentService.students().filter(s => s.department === dept.name);
    const q = this.deptStudentSearch.toLowerCase().trim();
    const yr = this.deptStudentYearFilter;
    const st = this.deptStudentStatusFilter;

    if (q) {
      list = list.filter(s =>
        s.fullName.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }

    if (yr !== 'all') {
      if (yr === '1st') list = list.filter(s => (s.graduationYear || 2027) >= 2030);
      else if (yr === '2nd') list = list.filter(s => (s.graduationYear || 2027) === 2029);
      else if (yr === '3rd') list = list.filter(s => (s.graduationYear || 2027) === 2028);
      else if (yr === '4th') list = list.filter(s => (s.graduationYear || 2027) <= 2027);
    }

    if (st !== 'all') {
      list = list.filter(s => s.placementStatus === st);
    }

    return list;
  }

  getStudentAcademicYearLabel(gradYear: number): string {
    if (gradYear >= 2030) return '1st Year';
    if (gradYear === 2029) return '2nd Year';
    if (gradYear === 2028) return '3rd Year';
    return '4th Year';
  }

  getDepartmentStudentDistribution(dept: Department): DepartmentStudentYearDistribution {
    return this.orgService.getDepartmentStudentDistribution(dept.id);
  }

  getDepartmentPlacementMetrics(dept: Department): DepartmentPlacementMetrics {
    return this.orgService.getDepartmentPlacementMetrics(dept.id);
  }

  getDepartmentCompaniesAndRecruiters(dept: Department): DepartmentCompanyRecruiterRelation[] {
    return this.orgService.getDepartmentCompaniesAndRecruiters(dept.id);
  }

  getDepartmentSkillDemand(dept: Department): { skillName: string; jobsDemanding: number; studentCoveragePercentage: number }[] {
    const raw = this.orgService.getDepartmentSkillDemand(dept.name);
    const studentsInDept = this.studentService.students().filter(s => s.department === dept.name);
    const total = studentsInDept.length || 1;

    return (raw.demandedSkills || []).map(item => {
      const withSkill = studentsInDept.filter(s =>
        (s.skills || []).some(sk => sk.toLowerCase().includes(item.skill.toLowerCase()) || item.skill.toLowerCase().includes(sk.toLowerCase()))
      ).length;
      return {
        skillName: item.skill,
        jobsDemanding: item.count,
        studentCoveragePercentage: Math.min(100, Math.round((withSkill / total) * 100) || 60)
      };
    });
  }

  getDepartmentPrograms(dept: Department): Program[] {
    return this.orgService.programs().filter(p =>
      p.departmentId === dept.id || (!p.departmentId && p.code.includes(dept.code))
    );
  }

  getDepartmentAlumni(dept: Department): Alumni[] {
    return this.alumniService.alumni().filter(a => a.department === dept.name);
  }

  getProgramSubjects(prog: Program): Subject[] {
    return this.orgService.getSubjectsByProgram(prog.id);
  }

  getFilteredProgramSubjects(prog: Program): Subject[] {
    let list = this.getProgramSubjects(prog);
    if (this.syllabusSemesterFilter !== 'all') {
      list = list.filter(s => s.semester === this.syllabusSemesterFilter);
    }
    if (this.syllabusCourseTypeFilter !== 'all') {
      list = list.filter(s => s.courseType === this.syllabusCourseTypeFilter);
    }
    if (this.syllabusSearch) {
      const q = this.syllabusSearch.toLowerCase().trim();
      list = list.filter(s =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        (s.syllabusUnits || s.units)?.some((u: SyllabusUnit) => ((u.title || u.unitTitle || '').toLowerCase().includes(q) || u.topics.some((t: string) => t.toLowerCase().includes(q))))
      );
    }
    return list;
  }

  getSubjectsBySemester(prog: Program, sem: number): Subject[] {
    return this.getProgramSubjects(prog).filter(s => s.semester === sem);
  }

  getSubjectsBySemesterFiltered(prog: Program, sem: number): Subject[] {
    let list = this.getSubjectsBySemester(prog, sem);
    if (this.syllabusCourseTypeFilter !== 'all') {
      list = list.filter(s => s.courseType === this.syllabusCourseTypeFilter);
    }
    if (this.syllabusSearch) {
      const q = this.syllabusSearch.toLowerCase().trim();
      list = list.filter(s =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        (s.syllabusUnits || s.units)?.some((u: SyllabusUnit) => ((u.title || u.unitTitle || '').toLowerCase().includes(q) || u.topics.some((t: string) => t.toLowerCase().includes(q))))
      );
    }
    return list;
  }

  getProgramSemestersList(prog: Program): number[] {
    const semCount = (prog.durationYears || 4) * 2;
    return Array.from({ length: semCount }, (_, i) => i + 1);
  }

  getSemesterCredits(prog: Program, sem: number): number {
    return this.getSubjectsBySemester(prog, sem).reduce((acc: number, s: Subject) => acc + (s.credits || 0), 0);
  }

  getTotalProgramCredits(prog: Program): number {
    const sum = this.getProgramSubjects(prog).reduce((acc: number, s: Subject) => acc + (s.credits || 0), 0);
    return sum > 0 ? sum : (prog.totalCredits || 160);
  }

  countSubjectsByType(prog: Program, type: CourseType): number {
    return this.getProgramSubjects(prog).filter(s => s.courseType === type).length;
  }

  getTotalSubjectHours(sub: Subject): number {
    const units = sub.syllabusUnits || sub.units;
    if (!units || units.length === 0) return (sub.credits || 3) * 15;
    return units.reduce((acc: number, u: SyllabusUnit) => acc + (u.hours || 9), 0);
  }

  isUnitExpanded(unitId: string): boolean {
    return this.expandedUnits.has(unitId);
  }

  toggleUnitExpanded(unitId: string) {
    if (this.expandedUnits.has(unitId)) {
      this.expandedUnits.delete(unitId);
    } else {
      this.expandedUnits.add(unitId);
    }
  }

  isCompanyExpanded(companyId: string): boolean {
    return this.expandedCompanies.has(companyId);
  }

  toggleCompanyExpanded(companyId: string) {
    if (this.expandedCompanies.has(companyId)) {
      this.expandedCompanies.delete(companyId);
    } else {
      this.expandedCompanies.add(companyId);
    }
  }

  // --- SUBJECT & SYLLABUS UNIT CRUD ---
  viewSubject(sub: Subject) {
    this.viewingSubject = sub;
    const units = sub.syllabusUnits || sub.units;
    // By default expand all its units for immediate exploration
    if (units && units.length > 0) {
      units.forEach((u: SyllabusUnit) => this.expandedUnits.add(u.id));
    }
  }

  closeSubjectModal() {
    this.viewingSubject = null;
  }

  openAddSubject(prog: Program, sem?: number) {
    this.subjectProgramId = prog.id;
    this.editingSubject = null;
    this.subjectForm = {
      code: '',
      name: '',
      semester: sem || (this.syllabusSemesterFilter !== 'all' ? (this.syllabusSemesterFilter as number) : 1),
      credits: 3,
      courseType: 'Core',
      description: '',
      prerequisites: [],
      skillsDeveloped: [],
      referenceBooks: []
    };
    this.subjectPrereqsRaw = '';
    this.subjectSkillsRaw = '';
    this.subjectBooksRaw = '';
    this.isAddingSubject = true;
  }

  openEditSubject(sub: Subject) {
    this.editingSubject = sub;
    this.subjectProgramId = sub.programId;
    this.subjectForm = { ...sub };
    this.subjectPrereqsRaw = (sub.prerequisites || []).join(', ');
    this.subjectSkillsRaw = (sub.skillsDeveloped || []).join(', ');
    this.subjectBooksRaw = (sub.referenceBooks || []).join(', ');
    this.isAddingSubject = false;
  }

  async saveSubject(event: Event) {
    event.preventDefault();
    const prereqs = this.subjectPrereqsRaw.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0);
    const skills = this.subjectSkillsRaw.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0);
    const books = this.subjectBooksRaw.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0);

    const payload = {
      ...this.subjectForm,
      programId: this.subjectProgramId,
      prerequisites: prereqs,
      skillsDeveloped: skills,
      referenceBooks: books
    };

    try {
      if (this.editingSubject) {
        await this.orgService.updateSubject(this.editingSubject.id, payload);
        if (this.viewingSubject && this.viewingSubject.id === this.editingSubject.id) {
          const updated = this.orgService.subjects().find(s => s.id === this.editingSubject!.id);
          if (updated) this.viewingSubject = updated;
        }
      } else {
        await this.orgService.addSubject(payload as any);
      }
      this.isAddingSubject = false;
      this.editingSubject = null;
    } catch {
      // Handled in service
    }
  }

  async deleteSubject(subId: string) {
    if (!confirm('Are you sure you want to remove this course and all its syllabus units?')) return;
    try {
      await this.orgService.deleteSubject(subId);
      if (this.viewingSubject?.id === subId) {
        this.viewingSubject = null;
      }
    } catch {
      // Handled in service
    }
  }

  openAddUnit(sub: Subject) {
    this.unitSubjectId = sub.id;
    this.editingUnit = null;
    const units = sub.syllabusUnits || sub.units;
    const nextNum = (units?.length || 0) + 1;
    this.unitForm = {
      unitNumber: nextNum,
      unitTitle: '',
      title: '',
      description: '',
      topics: [],
      hours: 9,
      learningObjectives: []
    };
    this.unitTopicsRaw = '';
    this.unitObjectivesRaw = '';
    this.isAddingUnit = true;
  }

  openEditUnit(sub: Subject, unit: SyllabusUnit) {
    this.unitSubjectId = sub.id;
    this.editingUnit = unit;
    this.unitForm = { ...unit, title: unit.title || unit.unitTitle, unitTitle: unit.unitTitle || unit.title || '' };
    this.unitTopicsRaw = (unit.topics || []).join(', ');
    this.unitObjectivesRaw = (unit.learningObjectives || []).join(', ');
    this.isAddingUnit = false;
  }

  async saveUnit(event: Event) {
    event.preventDefault();
    const topics = this.unitTopicsRaw.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0);
    const objs = this.unitObjectivesRaw.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0);

    const payload: Partial<SyllabusUnit> = {
      ...this.unitForm,
      unitTitle: this.unitForm.title || this.unitForm.unitTitle || `Unit ${this.unitForm.unitNumber || 1}`,
      title: this.unitForm.title || this.unitForm.unitTitle || `Unit ${this.unitForm.unitNumber || 1}`,
      topics,
      learningObjectives: objs
    };

    try {
      if (this.editingUnit) {
        await this.orgService.updateSyllabusUnit(this.unitSubjectId, this.editingUnit.id, payload);
      } else {
        await this.orgService.addSyllabusUnit(this.unitSubjectId, payload as any);
      }

      // Refresh viewingSubject reference
      if (this.viewingSubject && this.viewingSubject.id === this.unitSubjectId) {
        const refreshed = this.orgService.subjects().find(s => s.id === this.unitSubjectId);
        if (refreshed) {
          this.viewingSubject = refreshed;
          const rUnits = refreshed.syllabusUnits || refreshed.units;
          rUnits?.forEach((u: SyllabusUnit) => this.expandedUnits.add(u.id));
        }
      }

      this.isAddingUnit = false;
      this.editingUnit = null;
    } catch {
      // Handled in service
    }
  }

  async deleteUnit(subjectId: string, unitId: string) {
    if (!confirm('Are you sure you want to remove this syllabus unit?')) return;
    try {
      await this.orgService.deleteSyllabusUnit(subjectId, unitId);
      if (this.viewingSubject && this.viewingSubject.id === subjectId) {
        const refreshed = this.orgService.subjects().find(s => s.id === subjectId);
        if (refreshed) this.viewingSubject = refreshed;
      }
    } catch {
      // Handled in service
    }
  }

  // --- DEPARTMENT & PROGRAM CRUD ---
  openEditDepartmentModal(dept: Department) {
    this.editingDepartment = { ...dept };
    this.showEditDepartmentModal = true;
  }

  async saveEditDepartment(event: Event) {
    event.preventDefault();
    if (!this.editingDepartment) return;
    try {
      await this.orgService.updateDepartment(this.editingDepartment.id, this.editingDepartment);
      if (this.selectedDepartment()?.id === this.editingDepartment.id) {
        this.selectedDepartment.set(this.editingDepartment);
      }
      this.showEditDepartmentModal = false;
    } catch {
      // Handled in service
    }
  }

  openAddProgramModal(deptId?: string) {
    this.editingProgram = null;
    this.progForm = {
      code: '',
      name: '',
      degreeLevel: 'Undergraduate',
      durationYears: 4,
      departmentId: deptId || this.selectedDepartment()?.id || '',
      description: '',
      totalCredits: 160
    };
    this.showAddProgramModal = true;
  }

  openEditProgramModal(prog: Program) {
    this.editingProgram = prog;
    this.progForm = { ...prog };
    this.showEditProgramModal = true;
  }

  async saveProgram(event: Event) {
    event.preventDefault();
    try {
      if (this.editingProgram) {
        await this.orgService.updateProgram(this.editingProgram.id, this.progForm);
        if (this.selectedProgram()?.id === this.editingProgram.id) {
          const updated = this.orgService.programs().find(p => p.id === this.editingProgram!.id);
          if (updated) this.selectedProgram.set(updated);
        }
        this.showEditProgramModal = false;
      } else {
        await this.orgService.addProgram(this.progForm as any);
        this.showAddProgramModal = false;
      }
      this.editingProgram = null;
    } catch {
      // Handled in service
    }
  }

  async deleteProgram(progId: string) {
    if (!confirm('Are you sure you want to remove this degree program and its associated curriculum?')) return;
    try {
      await this.orgService.deleteProgram(progId);
      if (this.selectedProgram()?.id === progId) {
        this.selectedProgram.set(null);
      }
    } catch {
      // Handled in service
    }
  }
}
