import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlumniService } from '../../../core/services/alumni.service';
import { StudentService } from '../../../core/services/student.service';
import { ChatService } from '../../../core/services/chat.service';
import { CallService } from '../../../core/services/call.service';
import { ContactVisibility, ContactMethod } from '../../../core/models/alumni.model';
import { IconComponent } from '../../../shared/icons/icon.component';
import { StatCardComponent } from '../../../shared/ui/stat-card.component';

@Component({
  selector: 'app-alumni-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    StatCardComponent
  ],
  template: `
    <div class="space-y-8 animate-in fade-in duration-300">
      <!-- Top Welcome Banner -->
      <div class="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-purple-500/15 relative overflow-hidden">
        <div class="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div class="flex items-center gap-2 mb-3">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-xs border border-white/20">
                <app-icon name="users" [size]="14"></app-icon>
                Alumni Mentorship Network
              </span>
              <span *ngIf="alumniService.currentAlumni().isVerified" class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30">
                ⭐ Verified Professional
              </span>
            </div>

            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {{ alumniService.currentAlumni().fullName }} 👋
            </h1>
            <p class="text-purple-100 text-sm sm:text-base mt-1.5 max-w-xl leading-relaxed">
              {{ alumniService.currentAlumni().designation }} at {{ alumniService.currentAlumni().company }}. You are actively helping campus juniors crack high-impact product roles.
            </p>
          </div>

          <!-- Controls: Mentoring Status & Contact Settings Trigger -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              (click)="showContactSettings.set(true)"
              class="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <app-icon name="settings" [size]="15"></app-icon>
              <span>Contact Options</span>
            </button>

            <div class="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-between gap-4">
              <div>
                <span class="text-xs font-semibold block text-white">Mentoring Status</span>
                <span class="text-[11px] text-purple-200">
                  {{ alumniService.currentAlumni().availableForMentoring ? 'Open for Guidance' : 'Temporarily Paused' }}
                </span>
              </div>
              <button
                type="button"
                (click)="toggleMentoring()"
                class="px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
                [ngClass]="alumniService.currentAlumni().availableForMentoring ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'"
              >
                {{ alumniService.currentAlumni().availableForMentoring ? 'Active ✓' : 'Paused' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Metrics from Real Service -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <app-stat-card
          title="Pending Requests"
          [value]="alumniService.incomingRequests().length"
          icon="clock"
          subtitle="Awaiting response"
          color="amber"
        ></app-stat-card>

        <app-stat-card
          title="Active Mentees"
          [value]="activeConnections().length"
          icon="users"
          subtitle="Connected students"
          color="purple"
        ></app-stat-card>

        <app-stat-card
          title="Active Messages"
          [value]="chatService.conversations().length"
          icon="message-square"
          subtitle="Ongoing conversations"
          color="blue"
        ></app-stat-card>

        <app-stat-card
          title="Mentor Rating"
          [value]="(alumniService.currentAlumni().rating || 5.0) + ' / 5.0'"
          icon="award"
          subtitle="Student feedback"
          color="emerald"
        ></app-stat-card>
      </div>

      <!-- INCOMING CONNECTION REQUESTS SECTION (Section 12) -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <app-icon name="user-plus" [size]="20" customClass="text-purple-600"></app-icon>
              Incoming Connection Requests
              <span class="px-2 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800">
                {{ alumniService.incomingRequests().length }}
              </span>
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Review and accept mentorship requests from students to enable 1-on-1 messaging and video sessions.
            </p>
          </div>
        </div>

        <!-- Requests List -->
        <div *ngIf="alumniService.incomingRequests().length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            *ngFor="let req of alumniService.incomingRequests()"
            class="p-5 rounded-2xl border border-slate-200 bg-white hover:border-purple-200 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <!-- Header: Student Avatar, Name, Program/Dept, Status Badge -->
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex items-center gap-3 min-w-0">
                  <img
                    [src]="req.requesterAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'"
                    [alt]="req.requesterName"
                    (error)="onImgError($event, req.requesterName || 'Student')"
                    class="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
                  />
                  <div class="min-w-0">
                    <h4 class="text-sm font-bold text-slate-900 leading-tight truncate">{{ req.requesterName || 'Student Candidate' }}</h4>
                    <span class="text-[11px] text-slate-600 font-medium block truncate mt-0.5">
                      {{ req.requesterProgram || 'B.Tech' }} • {{ req.requesterDepartment || 'Computer Science & Engineering' }}
                    </span>
                    <span class="text-[10px] text-slate-400 font-medium block mt-0.5">
                      Class of {{ req.requesterGraduationYear || 2027 }} • {{ req.createdAt | date:'mediumDate' }}
                    </span>
                  </div>
                </div>

                <div class="flex flex-col items-end gap-1 shrink-0">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                    {{ req.status }}
                  </span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100 truncate max-w-[140px]">
                    {{ req.mentorshipTopic }}
                  </span>
                </div>
              </div>

              <!-- Student Skills Chips -->
              <div *ngIf="req.requesterSkills && req.requesterSkills.length > 0" class="flex flex-wrap gap-1 mb-2.5">
                <span
                  *ngFor="let skill of req.requesterSkills.slice(0, 4)"
                  class="text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100/60"
                >
                  {{ skill }}
                </span>
                <span *ngIf="req.requesterSkills.length > 4" class="text-[10px] text-slate-400 px-1 py-0.5">
                  +{{ req.requesterSkills.length - 4 }}
                </span>
              </div>

              <!-- Short Message & Reason -->
              <div class="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <p><strong>Topic / Reason:</strong> {{ req.reason || req.mentorshipTopic }}</p>
                <p *ngIf="req.message" class="text-slate-600 italic">"{{ req.message }}"</p>
              </div>
            </div>

            <!-- Accept / Reject Actions -->
            <div class="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                (click)="alumniService.acceptConnection(req.id)"
                class="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <app-icon name="check-circle" [size]="14"></app-icon>
                <span>Accept</span>
              </button>
              <button
                type="button"
                (click)="alumniService.rejectConnection(req.id)"
                class="py-2 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                <span>Reject</span>
              </button>
            </div>
          </div>
        </div>

        <div
          *ngIf="alumniService.incomingRequests().length === 0"
          class="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center"
        >
          <app-icon name="check" [size]="28" customClass="text-emerald-500 mx-auto mb-2"></app-icon>
          <p class="text-xs font-semibold text-slate-700">All caught up!</p>
          <p class="text-[11px] text-slate-400 mt-0.5">No pending student mentorship requests at the moment.</p>
        </div>
      </div>

      <!-- ACTIVE MENTEES / CONNECTED STUDENTS SECTION -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
        <div>
          <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
            <app-icon name="users" [size]="20" customClass="text-purple-600"></app-icon>
            Active Mentees & Connections ({{ activeConnections().length }})
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Accepted student connections. You can exchange messages and host real-time 1-on-1 WebRTC audio/video sessions.
          </p>
        </div>

        <div *ngIf="activeConnections().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            *ngFor="let conn of activeConnections()"
            class="p-5 rounded-2xl border border-slate-200 bg-white hover:border-purple-200 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center gap-3 mb-3">
                <div class="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 font-bold text-base flex items-center justify-center shrink-0">
                  {{ (conn.requesterName || 'S').substring(0, 2).toUpperCase() }}
                </div>
                <div class="min-w-0">
                  <h4 class="text-sm font-bold text-slate-900 truncate">{{ conn.requesterName }}</h4>
                  <span class="text-[11px] text-slate-500 block truncate">{{ conn.mentorshipTopic }}</span>
                </div>
              </div>
              <p class="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3">
                {{ conn.reason }}
              </p>
            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                (click)="chatWithRequester(conn)"
                class="flex-1 py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-xs"
              >
                <app-icon name="message-square" [size]="14"></app-icon>
                Chat
              </button>
              <button
                type="button"
                (click)="callRequester(conn, 'audio')"
                class="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700"
                title="Voice Call"
              >
                <app-icon name="phone" [size]="15"></app-icon>
              </button>
              <button
                type="button"
                (click)="callRequester(conn, 'video')"
                class="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700"
                title="Video Session"
              >
                <app-icon name="video" [size]="15"></app-icon>
              </button>
            </div>
          </div>
        </div>

        <div
          *ngIf="activeConnections().length === 0"
          class="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center"
        >
          <p class="text-xs text-slate-500">No active student connections yet. Accept incoming requests above to start mentoring.</p>
        </div>
      </div>
    </div>

    <!-- CONTACT OPTIONS & VISIBILITY SETTINGS MODAL (Section 5 & 6) -->
    <div
      *ngIf="showContactSettings()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
        <div class="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-base font-bold text-slate-900">Professional Contact Settings</h3>
            <p class="text-xs text-slate-500 mt-0.5">Control how students view and reach out to you.</p>
          </div>
          <button (click)="showContactSettings.set(false)" class="p-1 text-slate-400 hover:text-slate-600">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <!-- Visibility Selector -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">Contact Visibility Policy</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                (click)="contactVisibility = 'connected_only'"
                class="py-2 px-3 rounded-xl border text-center font-semibold transition-all"
                [ngClass]="contactVisibility === 'connected_only' ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
              >
                Connected Only
              </button>
              <button
                type="button"
                (click)="contactVisibility = 'public'"
                class="py-2 px-3 rounded-xl border text-center font-semibold transition-all"
                [ngClass]="contactVisibility === 'public' ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
              >
                Public
              </button>
              <button
                type="button"
                (click)="contactVisibility = 'hidden'"
                class="py-2 px-3 rounded-xl border text-center font-semibold transition-all"
                [ngClass]="contactVisibility === 'hidden' ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
              >
                Hidden
              </button>
            </div>
            <span class="text-[10px] text-slate-500 mt-1 block">
              Default is <strong>Connected Only</strong> (contact channels are only shown after you accept a student's request).
            </span>
          </div>

          <!-- Contact Channels -->
          <div class="space-y-2.5">
            <label class="block font-bold text-slate-700">Configured Contact Methods</label>

            <!-- LinkedIn -->
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <app-icon name="linkedin" [size]="16"></app-icon>
              </div>
              <input
                type="text"
                [(ngModel)]="linkedinUrlInput"
                placeholder="https://linkedin.com/in/your-profile"
                class="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
              />
            </div>

            <!-- Website -->
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <app-icon name="globe" [size]="16"></app-icon>
              </div>
              <input
                type="text"
                [(ngModel)]="websiteUrlInput"
                placeholder="https://yourportfolio.dev or blog"
                class="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
              />
            </div>

            <!-- Email -->
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <app-icon name="mail" [size]="16"></app-icon>
              </div>
              <input
                type="email"
                [(ngModel)]="publicEmailInput"
                placeholder="Public engineering contact email"
                class="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
              />
            </div>
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button (click)="showContactSettings.set(false)" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            (click)="saveContactSettings()"
            class="px-5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
          >
            Save Contact Settings
          </button>
        </div>
      </div>
    </div>
  `
})
export class AlumniDashboardComponent {
  alumniService = inject(AlumniService);
  studentService = inject(StudentService);
  chatService = inject(ChatService);
  callService = inject(CallService);
  private router = inject(Router);

  showContactSettings = signal<boolean>(false);
  contactVisibility: ContactVisibility = 'connected_only';
  linkedinUrlInput = '';
  websiteUrlInput = '';
  publicEmailInput = '';

  constructor() {
    const current = this.alumniService.currentAlumni();
    this.contactVisibility = current.contactVisibility || 'connected_only';
    this.linkedinUrlInput = current.linkedinUrl || '';
    this.websiteUrlInput = current.websiteUrl || '';
    this.publicEmailInput = current.email || '';
  }

  activeConnections = computed(() => {
    const current = this.alumniService.currentAlumni();
    return this.alumniService.connections().filter(
      c => c.receiverId === current.userId && c.status === 'accepted'
    );
  });

  toggleMentoring() {
    const current = this.alumniService.currentAlumni().availableForMentoring;
    this.alumniService.toggleMentoringAvailability(!current);
  }

  chatWithRequester(conn: any) {
    this.chatService.startConversationWith({
      id: conn.requesterId,
      name: conn.requesterName || 'Student',
      avatar: conn.requesterAvatar,
      role: 'student',
      headline: `${conn.requesterDepartment || 'Candidate'} (Mentee)`
    });
    this.router.navigate(['/alumni/messages']);
  }

  callRequester(conn: any, type: 'audio' | 'video') {
    this.callService.startCall({
      id: conn.requesterId,
      name: conn.requesterName || 'Student',
      avatar: conn.requesterAvatar,
      role: 'student'
    }, type);
  }

  saveContactSettings() {
    const methods: ContactMethod[] = [];
    if (this.linkedinUrlInput.trim()) {
      methods.push({ type: 'linkedin', label: 'LinkedIn', url: this.linkedinUrlInput.trim(), isVisible: true });
    }
    if (this.websiteUrlInput.trim()) {
      methods.push({ type: 'website', label: 'Website', url: this.websiteUrlInput.trim(), isVisible: true });
    }
    if (this.publicEmailInput.trim()) {
      methods.push({ type: 'email', label: 'Email', url: `mailto:${this.publicEmailInput.trim()}`, isVisible: true });
    }

    this.alumniService.updateContactSettings(this.contactVisibility, methods);
    this.showContactSettings.set(false);
  }

  onImgError(event: Event, name: string) {
    const target = event.target as HTMLImageElement;
    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&bold=true`;
  }
}
