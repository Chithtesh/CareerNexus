import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/icons/icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <header class="h-18 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      <!-- Left: Mobile Menu Toggle & Title -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          (click)="toggleSidebar.emit()"
          class="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl lg:hidden transition-colors"
          aria-label="Toggle navigation menu"
        >
          <app-icon name="menu" [size]="20"></app-icon>
        </button>

        <!-- Mobile & Tablet Logo Lockup (130-160px wide) -->
        <a routerLink="/" class="flex items-center gap-2.5 lg:hidden group" title="CareerNexus Home">
          <div class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
            <img
              src="assets/images/logo.png"
              alt="CareerNexus Logo"
              class="w-full h-full object-contain filter drop-shadow-xs transition-transform duration-200 group-hover:scale-105"
            />
          </div>
          <div>
            <span class="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none block">Career<span class="text-blue-600">Nexus</span></span>
            <span class="text-[8.5px] font-semibold text-slate-400 tracking-wider uppercase block leading-none mt-0.5 sm:hidden">Portal</span>
          </div>
        </a>

        <!-- Tablet Workspace Badge (visible on sm to lg) -->
        <div class="hidden sm:flex lg:hidden items-center gap-1.5 text-xs font-semibold">
          <app-icon name="chevron-right" [size]="12" customClass="text-slate-300"></app-icon>
          <span class="text-slate-800 capitalize bg-slate-100/80 px-2.5 py-0.5 rounded-full border border-slate-200/60 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full" [ngClass]="{
              'bg-blue-600': authService.actualRole() === 'student',
              'bg-purple-600': authService.actualRole() === 'alumni',
              'bg-indigo-600': authService.actualRole() === 'recruiter',
              'bg-emerald-600': authService.actualRole() === 'admin'
            }"></span>
            {{ authService.actualRole() }}
          </span>
        </div>

        <!-- Desktop Breadcrumb Lockup -->
        <div class="hidden lg:flex items-center gap-2.5 text-xs font-semibold">
          <a routerLink="/" class="flex items-center gap-2 text-slate-800 hover:text-blue-600 transition-colors group" title="CareerNexus Portal">
            <div class="w-7 h-7 flex items-center justify-center shrink-0">
              <img
                src="assets/images/logo.png"
                alt="CareerNexus Logo"
                class="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110"
              />
            </div>
            <span class="text-sm font-extrabold tracking-tight text-slate-900">Career<span class="text-blue-600">Nexus</span></span>
          </a>
          <app-icon name="chevron-right" [size]="12" customClass="text-slate-300"></app-icon>

          <!-- Authorized Workspace Badge (Read-Only) -->
          <span class="text-slate-800 capitalize bg-slate-100/80 px-2.5 py-0.5 rounded-full border border-slate-200/60 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full" [ngClass]="{
              'bg-blue-600': authService.actualRole() === 'student',
              'bg-purple-600': authService.actualRole() === 'alumni',
              'bg-indigo-600': authService.actualRole() === 'recruiter',
              'bg-emerald-600': authService.actualRole() === 'admin'
            }"></span>
            {{ authService.actualRole() }} Workspace
          </span>
        </div>
      </div>

      <!-- Center / Right: Authorized Role Badge (Read-Only) + Notifications + Profile -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Read-Only Authorized Role Badge -->
        <div class="flex items-center gap-1.5 px-3 py-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs">
          <span>{{ getRoleEmoji(authService.actualRole()) }}</span>
          <span class="capitalize">{{ authService.actualRole() }} Portal</span>
        </div>

        <!-- Notification Bell & Dropdown -->
        <div class="relative">
          <button
            type="button"
            (click)="toggleNotifications()"
            class="relative p-2.5 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            title="Notifications"
          >
            <app-icon name="bell" [size]="19"></app-icon>
            <span
              *ngIf="notificationService.unreadCount() > 0"
              class="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9.5px] font-extrabold flex items-center justify-center ring-2 ring-white animate-pulse-subtle"
            >
              {{ notificationService.unreadCount() }}
            </span>
          </button>

          <!-- Notifications Dropdown Flyout -->
          <div
            *ngIf="showNotifications()"
            class="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 glass-dropdown animate-in fade-in zoom-in-95 duration-150"
          >
            <div class="p-4 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-bold text-slate-900">Notifications</h4>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {{ notificationService.unreadCount() }} unread
                </span>
              </div>
              <button
                type="button"
                (click)="notificationService.markAllAsRead()"
                class="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Mark all read
              </button>
            </div>

            <div class="max-h-80 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
              <div
                *ngFor="let item of notificationService.notifications()"
                (click)="onNotificationClick(item)"
                class="p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer flex gap-3 items-start"
                [ngClass]="{ 'bg-blue-50/30': !item.isRead }"
              >
                <div class="mt-1 shrink-0">
                  <span
                    class="w-2 h-2 rounded-full inline-block"
                    [ngClass]="item.isRead ? 'bg-slate-300' : 'bg-blue-600'"
                  ></span>
                </div>
                <div class="flex-1 min-w-0">
                  <h5 class="text-xs font-bold text-slate-900">{{ item.title }}</h5>
                  <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">{{ item.message }}</p>
                  <span class="text-[10px] text-slate-400 mt-1 block font-mono">Just now</span>
                </div>
              </div>

              <div *ngIf="notificationService.notifications().length === 0" class="p-8 text-center text-xs text-slate-400">
                No notifications right now.
              </div>
            </div>
          </div>
        </div>

        <!-- User Profile Avatar & Dropdown -->
        <div class="relative pl-1 border-l border-slate-200">
          <button
            type="button"
            (click)="toggleProfileMenu()"
            class="flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-100 transition-colors"
          >
            <img
              [src]="authService.currentUser()?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'"
              class="w-9 h-9 rounded-full object-cover border border-slate-200 ring-2 ring-blue-100 shadow-2xs"
            />
            <app-icon name="chevron-down" [size]="14" customClass="text-slate-400 hidden sm:block"></app-icon>
          </button>

          <!-- User Menu Flyout -->
          <div
            *ngIf="showProfileMenu()"
            class="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 glass-dropdown animate-in fade-in zoom-in-95 duration-150 p-2 space-y-1 text-xs"
          >
            <div class="px-3 py-2 border-b border-slate-100 mb-1">
              <p class="font-bold text-slate-900 truncate">{{ authService.currentUser()?.fullName }}</p>
              <p class="text-slate-500 text-[11px] truncate">{{ authService.currentUser()?.email }}</p>
            </div>

            <a
              *ngIf="authService.isStudent()"
              routerLink="/student/profile"
              (click)="showProfileMenu.set(false)"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-medium transition-colors"
            >
              <app-icon name="user" [size]="15" customClass="text-slate-500"></app-icon>
              <span>Placement Profile</span>
            </a>

            <a
              *ngIf="authService.isAdmin()"
              routerLink="/admin/command-center"
              (click)="showProfileMenu.set(false)"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-medium transition-colors"
            >
              <app-icon name="grid" [size]="15" customClass="text-slate-500"></app-icon>
              <span>Command Center</span>
            </a>

            <button
              type="button"
              (click)="authService.logout(); showProfileMenu.set(false)"
              class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition-colors text-left"
            >
              <app-icon name="log-out" [size]="15" customClass="text-rose-500"></app-icon>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  router = inject(Router);

  @Output() toggleSidebar = new EventEmitter<void>();

  showNotifications = signal(false);
  showProfileMenu = signal(false);

  toggleNotifications() {
    this.showNotifications.update(v => !v);
    if (this.showNotifications()) {
      this.showProfileMenu.set(false);
    }
  }

  toggleProfileMenu() {
    this.showProfileMenu.update(v => !v);
    if (this.showProfileMenu()) {
      this.showNotifications.set(false);
    }
  }

  onNotificationClick(item: any) {
    this.notificationService.markAsRead(item.id);
    this.showNotifications.set(false);
    if (item.link) {
      this.router.navigateByUrl(item.link);
    }
  }

  getRoleEmoji(role: string): string {
    switch (role) {
      case 'student': return '🎓';
      case 'alumni': return '💼';
      case 'recruiter': return '🏢';
      case 'admin': return '⚡';
      default: return '👤';
    }
  }
}
