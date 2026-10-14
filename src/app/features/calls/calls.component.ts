import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallService } from '../../core/services/call.service';
import { AlumniService } from '../../core/services/alumni.service';
import { IconComponent } from '../../shared/icons/icon.component';
import { BadgeComponent } from '../../shared/ui/badge.component';

@Component({
  selector: 'app-calls',
  standalone: true,
  imports: [CommonModule, IconComponent, BadgeComponent],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">1-on-1 Voice & Video Sessions</h1>
          <p class="text-sm text-slate-500 mt-1">
            Conduct live mock interviews, resume feedback, and behavioral practice with alumni mentors.
          </p>
        </div>

        <button
          type="button"
          (click)="startTestCall()"
          class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <app-icon name="video" [size]="16"></app-icon>
          Test Video Call
        </button>
      </div>

      <!-- Quick Call With Mentors -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <h3 class="text-base font-bold text-slate-900">Available Mentors for Quick Call</h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            *ngFor="let mentor of alumniService.availableMentors().slice(0, 3)"
            class="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-200 hover:shadow-md transition-all flex items-center justify-between"
          >
            <div class="flex items-center gap-3 min-w-0">
              <img
                [src]="mentor.profilePhoto"
                class="w-11 h-11 rounded-full object-cover border border-slate-200"
              />
              <div class="min-w-0">
                <h4 class="text-xs font-bold text-slate-900 truncate">{{ mentor.fullName }}</h4>
                <p class="text-[11px] text-purple-700 truncate font-medium">{{ mentor.company }}</p>
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              <button
                type="button"
                (click)="startCallWith(mentor, 'audio')"
                class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Voice Call"
              >
                <app-icon name="phone" [size]="15"></app-icon>
              </button>
              <button
                type="button"
                (click)="startCallWith(mentor, 'video')"
                class="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors"
                title="Video Call"
              >
                <app-icon name="video" [size]="15"></app-icon>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Call Logs -->
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div class="p-5 border-b border-slate-100">
          <h3 class="text-base font-bold text-slate-900">Recent Session History</h3>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th class="py-3.5 px-6">Participant</th>
                <th class="py-3.5 px-6">Call Type</th>
                <th class="py-3.5 px-6">Duration</th>
                <th class="py-3.5 px-6">Date</th>
                <th class="py-3.5 px-6">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="py-4 px-6 font-semibold text-slate-900 flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" class="w-8 h-8 rounded-full object-cover" />
                  <span>Priya Nair (Senior SDE @ Google)</span>
                </td>
                <td class="py-4 px-6">
                  <span class="inline-flex items-center gap-1 font-medium text-slate-700">
                    <app-icon name="video" [size]="14" customClass="text-blue-600"></app-icon>
                    1-on-1 Video Mock
                  </span>
                </td>
                <td class="py-4 px-6 font-mono text-slate-600">32m 45s</td>
                <td class="py-4 px-6 text-slate-500">28 Sep 2026</td>
                <td class="py-4 px-6">
                  <app-badge variant="success" [dot]="true">Completed</app-badge>
                </td>
              </tr>
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="py-4 px-6 font-semibold text-slate-900 flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" class="w-8 h-8 rounded-full object-cover" />
                  <span>Karthik Raman (Azure @ Microsoft)</span>
                </td>
                <td class="py-4 px-6">
                  <span class="inline-flex items-center gap-1 font-medium text-slate-700">
                    <app-icon name="phone" [size]="14" customClass="text-purple-600"></app-icon>
                    Voice Mentoring
                  </span>
                </td>
                <td class="py-4 px-6 font-mono text-slate-600">18m 10s</td>
                <td class="py-4 px-6 text-slate-500">24 Sep 2026</td>
                <td class="py-4 px-6">
                  <app-badge variant="success" [dot]="true">Completed</app-badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class CallsComponent {
  callService = inject(CallService);
  alumniService = inject(AlumniService);

  startTestCall() {
    const mentor = this.alumniService.alumni()[0];
    this.callService.startCall({
      id: mentor.userId,
      name: mentor.fullName,
      avatar: mentor.profilePhoto,
      role: 'alumni'
    }, 'video');
  }

  startCallWith(mentor: any, type: 'audio' | 'video') {
    this.callService.startCall({
      id: mentor.userId,
      name: mentor.fullName,
      avatar: mentor.profilePhoto,
      role: 'alumni'
    }, type);
  }
}
