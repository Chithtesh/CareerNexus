import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/icons/icon.component';
import { BadgeComponent } from '../../shared/ui/badge.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Notification Center</h1>
          <p class="text-sm text-slate-500 mt-1">
            Real-time updates regarding your drive applications, interview rounds, and mentor chats.
          </p>
        </div>

        <button
          type="button"
          (click)="notificationService.markAllAsRead()"
          class="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          Mark All as Read
        </button>
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs custom-scrollbar">
        <button
          *ngFor="let tab of tabs"
          type="button"
          (click)="selectedTab = tab"
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
          [ngClass]="{
            'bg-blue-600 text-white shadow-xs': selectedTab === tab,
            'text-slate-600 hover:bg-slate-100': selectedTab !== tab
          }"
        >
          {{ tab }}
        </button>
      </div>

      <!-- Notifications List -->
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        <div
          *ngFor="let item of filteredNotifications()"
          class="p-5 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-4"
          [ngClass]="{ 'bg-blue-50/20': !item.isRead }"
        >
          <div class="flex items-start gap-3.5 min-w-0">
            <div
              class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              [ngClass]="{
                'bg-blue-50 text-blue-600': item.type === 'job',
                'bg-emerald-50 text-emerald-600': item.type === 'application',
                'bg-purple-50 text-purple-600': item.type === 'message',
                'bg-amber-50 text-amber-600': item.type === 'announcement'
              }"
            >
              <app-icon
                [name]="
                  item.type === 'job' ? 'briefcase' :
                  item.type === 'application' ? 'check-circle' :
                  item.type === 'message' ? 'message-square' : 'bell'
                "
                [size]="18"
              ></app-icon>
            </div>

            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-bold text-slate-900 truncate">{{ item.title }}</h4>
                <span *ngIf="!item.isRead" class="w-2 h-2 rounded-full bg-blue-600"></span>
              </div>
              <p class="text-xs text-slate-600 mt-1 leading-relaxed">{{ item.message }}</p>
              
              <div class="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                <span>{{ item.createdAt | date:'mediumDate' }}</span>
                <a *ngIf="item.link" [routerLink]="item.link" class="font-semibold text-blue-600 hover:underline">
                  View Details →
                </a>
              </div>
            </div>
          </div>

          <button
            *ngIf="!item.isRead"
            type="button"
            (click)="notificationService.markAsRead(item.id)"
            class="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 shrink-0"
          >
            Mark Read
          </button>
        </div>
      </div>
    </div>
  `
})
export class NotificationsComponent {
  notificationService = inject(NotificationService);

  readonly tabs = ['All', 'Applications', 'Jobs', 'Messages', 'Announcements'];
  selectedTab = 'All';

  filteredNotifications = computed(() => {
    let list = this.notificationService.notifications();
    const tab = this.selectedTab.toLowerCase();

    if (tab === 'all') return list;
    if (tab === 'applications') return list.filter(n => n.type === 'application');
    if (tab === 'jobs') return list.filter(n => n.type === 'job');
    if (tab === 'messages') return list.filter(n => n.type === 'message');
    if (tab === 'announcements') return list.filter(n => n.type === 'announcement');
    return list;
  });
}
