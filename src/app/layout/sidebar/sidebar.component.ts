import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/icons/icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <aside class="w-64 h-screen bg-white border-r border-slate-200/80 flex flex-col shrink-0 select-none">
      <!-- Logo & Brand Header -->
      <div class="h-18 px-5 flex items-center justify-between border-b border-slate-100">
        <a routerLink="/" class="flex items-center gap-3 w-fit max-w-[180px] group transition-all" title="CareerNexus Home">
          <div class="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
            <img
              src="assets/images/logo.png"
              alt="CareerNexus Logo"
              class="w-full h-full object-contain filter drop-shadow-xs transition-transform duration-200 group-hover:scale-105"
            />
          </div>
          <div class="min-w-0">
            <span class="text-base font-extrabold tracking-tight text-slate-900 block leading-tight">Career<span class="text-blue-600">Nexus</span></span>
            <span class="text-[9.5px] font-semibold text-slate-400 tracking-wider uppercase block truncate">Connect • Prepare • Placed</span>
          </div>
        </a>

        <button
          *ngIf="isMobile"
          type="button"
          (click)="closeSidebar.emit()"
          class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg lg:hidden"
        >
          <app-icon name="x" [size]="20"></app-icon>
        </button>
      </div>

      <!-- Navigation Links -->
      <div class="flex-1 overflow-y-auto px-4 py-5 space-y-6 custom-scrollbar">
        <!-- STUDENT NAVIGATION -->
        <ng-container *ngIf="authService.actualRole() === 'student'">
          <div>
            <span class="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Overview</span>
            <div class="mt-2 space-y-1">
              <a
                routerLink="/student/dashboard"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                [routerLinkActiveOptions]="{ exact: true }"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="layout-dashboard" [size]="18"></app-icon>
                <span>Dashboard</span>
              </a>
              <a
                routerLink="/student/profile"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="user" [size]="18"></app-icon>
                <span>Placement Analysis</span>
              </a>
            </div>
          </div>

          <div>
            <span class="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Prep & Intelligence</span>
            <div class="mt-2 space-y-1">
              <a
                routerLink="/student/career"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="sparkles" [size]="18"></app-icon>
                <span>Career Hub & Roadmap</span>
              </a>
              <a
                routerLink="/student/assessments"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="code" [size]="18"></app-icon>
                <span>Mock Assessments</span>
              </a>
              <a
                routerLink="/student/calendar"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="calendar" [size]="18"></app-icon>
                <span>Drive Calendar</span>
              </a>
            </div>
          </div>

          <div>
            <span class="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Drives & Network</span>
            <div class="mt-2 space-y-1">
              <a
                routerLink="/student/jobs"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="briefcase" [size]="18"></app-icon>
                <span>Job Openings</span>
              </a>
              <a
                routerLink="/student/applications"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="check-circle" [size]="18"></app-icon>
                <span>My Applications</span>
              </a>
              <a
                routerLink="/student/companies"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="building" [size]="18"></app-icon>
                <span>Companies</span>
              </a>
              <a
                routerLink="/student/alumni"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="users" [size]="18"></app-icon>
                <span>Alumni Mentors</span>
              </a>
              <a
                routerLink="/student/resources"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="folder" [size]="18"></app-icon>
                <span>Resource Drive</span>
              </a>
              <a
                routerLink="/student/messages"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <app-icon name="message-square" [size]="18"></app-icon>
                  <span>Mentorship Chat</span>
                </div>
                <span
                  *ngIf="chatService.totalUnreadCount() > 0"
                  class="px-2 py-0.5 text-[11px] font-bold bg-blue-600 text-white rounded-full"
                >
                  {{ chatService.totalUnreadCount() }}
                </span>
              </a>
              <a
                routerLink="/student/notifications"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <app-icon name="bell" [size]="18"></app-icon>
                  <span>Notifications</span>
                </div>
                <span
                  *ngIf="notificationService.unreadCount() > 0"
                  class="px-2 py-0.5 text-[11px] font-bold bg-blue-600 text-white rounded-full"
                >
                  {{ notificationService.unreadCount() }}
                </span>
              </a>
            </div>
          </div>
        </ng-container>

        <!-- RECRUITER NAVIGATION -->
        <ng-container *ngIf="authService.actualRole() === 'recruiter'">
          <div>
            <span class="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Recruiter Central</span>
            <div class="mt-2 space-y-1">
              <a
                routerLink="/recruiter/dashboard"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                [routerLinkActiveOptions]="{ exact: true }"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="layout-dashboard" [size]="18"></app-icon>
                <span>Hiring Dashboard</span>
              </a>
              <a
                routerLink="/recruiter/jobs"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="briefcase" [size]="18"></app-icon>
                <span>Manage Drives & Jobs</span>
              </a>
              <a
                routerLink="/recruiter/applicants"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="users" [size]="18"></app-icon>
                <span>Candidate Pipeline</span>
              </a>
              <a
                routerLink="/recruiter/calendar"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="calendar" [size]="18"></app-icon>
                <span>Interview Calendar</span>
              </a>
              <a
                routerLink="/recruiter/messages"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <app-icon name="message-square" [size]="18"></app-icon>
                  <span>Candidate Chat</span>
                </div>
                <span
                  *ngIf="chatService.totalUnreadCount() > 0"
                  class="px-2 py-0.5 text-[11px] font-bold bg-blue-600 text-white rounded-full"
                >
                  {{ chatService.totalUnreadCount() }}
                </span>
              </a>
              <a
                routerLink="/recruiter/notifications"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <app-icon name="bell" [size]="18"></app-icon>
                  <span>Notifications</span>
                </div>
                <span
                  *ngIf="notificationService.unreadCount() > 0"
                  class="px-2 py-0.5 text-[11px] font-bold bg-blue-600 text-white rounded-full"
                >
                  {{ notificationService.unreadCount() }}
                </span>
              </a>
            </div>
          </div>
        </ng-container>

        <!-- ALUMNI NAVIGATION -->
        <ng-container *ngIf="authService.actualRole() === 'alumni'">
          <div>
            <span class="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Alumni Portal</span>
            <div class="mt-2 space-y-1">
              <a
                routerLink="/alumni/dashboard"
                routerLinkActive="bg-purple-50 text-purple-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="layout-dashboard" [size]="18"></app-icon>
                <span>Dashboard</span>
              </a>
              <a
                routerLink="/alumni/profile"
                routerLinkActive="bg-purple-50 text-purple-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="user" [size]="18"></app-icon>
                <span>Mentor Profile</span>
              </a>
              <a
                routerLink="/alumni/students"
                routerLinkActive="bg-purple-50 text-purple-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="users" [size]="18"></app-icon>
                <span>Student Mentees</span>
              </a>
              <a
                routerLink="/alumni/resources"
                routerLinkActive="bg-purple-50 text-purple-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="folder" [size]="18"></app-icon>
                <span>Shared Resources</span>
              </a>
              <a
                routerLink="/alumni/messages"
                routerLinkActive="bg-purple-50 text-purple-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <app-icon name="message-square" [size]="18"></app-icon>
                  <span>Mentorship Chat</span>
                </div>
                <span
                  *ngIf="chatService.totalUnreadCount() > 0"
                  class="px-2 py-0.5 text-[11px] font-bold bg-purple-600 text-white rounded-full"
                >
                  {{ chatService.totalUnreadCount() }}
                </span>
              </a>
              <a
                routerLink="/alumni/notifications"
                routerLinkActive="bg-purple-50 text-purple-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <app-icon name="bell" [size]="18"></app-icon>
                  <span>Notifications</span>
                </div>
                <span
                  *ngIf="notificationService.unreadCount() > 0"
                  class="px-2 py-0.5 text-[11px] font-bold bg-purple-600 text-white rounded-full"
                >
                  {{ notificationService.unreadCount() }}
                </span>
              </a>
            </div>
          </div>
        </ng-container>

        <!-- ADMIN NAVIGATION -->
        <ng-container *ngIf="authService.actualRole() === 'admin'">
          <div>
            <span class="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Admin Central</span>
            <div class="mt-2 space-y-1">
              <a
                routerLink="/admin/command-center"
                routerLinkActive="bg-emerald-50 text-emerald-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="grid" [size]="18"></app-icon>
                <span>Command Center</span>
              </a>
              <a
                routerLink="/admin/analytics"
                routerLinkActive="bg-emerald-50 text-emerald-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="bar-chart-2" [size]="18"></app-icon>
                <span>Placement Analytics</span>
              </a>
              <a
                routerLink="/admin/dashboard"
                routerLinkActive="bg-emerald-50 text-emerald-700 font-semibold"
                [routerLinkActiveOptions]="{ exact: true }"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="layout-dashboard" [size]="18"></app-icon>
                <span>Operations Overview</span>
              </a>
              <a
                routerLink="/admin/calendar"
                routerLinkActive="bg-emerald-50 text-emerald-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="calendar" [size]="18"></app-icon>
                <span>Placement Calendar</span>
              </a>
              <a
                routerLink="/admin/users"
                routerLinkActive="bg-emerald-50 text-emerald-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="users" [size]="18"></app-icon>
                <span>User Management</span>
              </a>
              <a
                routerLink="/admin/applications"
                routerLinkActive="bg-emerald-50 text-emerald-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="check-circle" [size]="18"></app-icon>
                <span>Pipeline Tracker</span>
              </a>
              <a
                routerLink="/admin/jobs"
                routerLinkActive="bg-emerald-50 text-emerald-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="briefcase" [size]="18"></app-icon>
                <span>Job Drives</span>
              </a>
              <a
                routerLink="/admin/companies"
                routerLinkActive="bg-emerald-50 text-emerald-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="building" [size]="18"></app-icon>
                <span>Companies</span>
              </a>
              <a
                routerLink="/admin/resources"
                routerLinkActive="bg-emerald-50 text-emerald-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <app-icon name="folder" [size]="18"></app-icon>
                <span>Resource Drive</span>
              </a>
              <a
                routerLink="/admin/messages"
                routerLinkActive="bg-emerald-50 text-emerald-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <app-icon name="message-square" [size]="18"></app-icon>
                  <span>Placement Chat</span>
                </div>
                <span
                  *ngIf="chatService.totalUnreadCount() > 0"
                  class="px-2 py-0.5 text-[11px] font-bold bg-emerald-600 text-white rounded-full"
                >
                  {{ chatService.totalUnreadCount() }}
                </span>
              </a>
              <a
                routerLink="/admin/notifications"
                routerLinkActive="bg-emerald-50 text-emerald-700 font-semibold"
                (click)="onNavClick()"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <app-icon name="bell" [size]="18"></app-icon>
                  <span>Notifications</span>
                </div>
                <span
                  *ngIf="notificationService.unreadCount() > 0"
                  class="px-2 py-0.5 text-[11px] font-bold bg-emerald-600 text-white rounded-full"
                >
                  {{ notificationService.unreadCount() }}
                </span>
              </a>
            </div>
          </div>
        </ng-container>
      </div>

      <!-- User footer profile bar -->
      <div class="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div class="flex items-center gap-3 min-w-0">
          <img
            [src]="authService.currentUser()?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'"
            class="w-9 h-9 rounded-full object-cover border border-slate-200"
          />
          <div class="min-w-0">
            <h5 class="text-xs font-semibold text-slate-800 truncate">{{ authService.currentUser()?.fullName }}</h5>
            <span
              class="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              [ngClass]="{
                'bg-blue-100 text-blue-700': authService.actualRole() === 'student',
                'bg-purple-100 text-purple-700': authService.actualRole() === 'alumni',
                'bg-indigo-100 text-indigo-700': authService.actualRole() === 'recruiter',
                'bg-emerald-100 text-emerald-700': authService.actualRole() === 'admin'
              }"
            >
              {{ authService.actualRole() }}
            </span>
          </div>
        </div>

        <button
          type="button"
          (click)="authService.logout()"
          title="Sign out"
          class="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
        >
          <app-icon name="log-out" [size]="18"></app-icon>
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  authService = inject(AuthService);
  chatService = inject(ChatService);
  notificationService = inject(NotificationService);

  @Input() isMobile = false;
  @Output() closeSidebar = new EventEmitter<void>();

  onNavClick() {
    if (this.isMobile) {
      this.closeSidebar.emit();
    }
  }
}
