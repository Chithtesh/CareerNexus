import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlumniService } from '../../../core/services/alumni.service';
import { ChatService } from '../../../core/services/chat.service';
import { CallService } from '../../../core/services/call.service';
import { BookmarkService } from '../../../core/services/bookmark.service';
import { AuthService } from '../../../core/services/auth.service';
import { Alumni, ConnectionStatus, ContactMethod } from '../../../core/models/alumni.model';
import { IconComponent } from '../../../shared/icons/icon.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';

@Component({
  selector: 'app-alumni-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      <!-- Page Header with Real Dynamic Counters from Supabase -->
      <div class="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-400/20 text-purple-200 border border-purple-300/30">
                Verified Professional Network
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Realtime Signaling
              </span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Alumni Mentorship & Professional Network
            </h1>
            <p class="text-sm text-purple-200 mt-1 max-w-2xl leading-relaxed">
              Connect with verified alumni and industry software leaders for 1-on-1 mentorship, system design reviews, and mock technical interviews.
            </p>
          </div>

          <!-- Dynamic Real Counters Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center shrink-0">
            <div>
              <span class="text-lg sm:text-2xl font-black block text-white">
                {{ alumniService.totalProfessionalsCount() }}
              </span>
              <span class="text-[10px] text-purple-200 uppercase tracking-wider font-semibold">Professionals</span>
            </div>
            <div class="border-l border-white/10 pl-3">
              <span class="text-lg sm:text-2xl font-black block text-amber-300">
                {{ alumniService.verifiedProfessionalsCount() }}
              </span>
              <span class="text-[10px] text-purple-200 uppercase tracking-wider font-semibold">Verified</span>
            </div>
            <div class="border-l border-white/10 pl-3">
              <span class="text-lg sm:text-2xl font-black block text-emerald-400">
                {{ alumniService.availableMentorsCount() }}
              </span>
              <span class="text-[10px] text-purple-200 uppercase tracking-wider font-semibold">Available</span>
            </div>
            <div class="border-l border-white/10 pl-3">
              <span class="text-lg sm:text-2xl font-black block text-blue-300">
                {{ alumniService.myAcceptedConnectionsCount() }}
              </span>
              <span class="text-[10px] text-purple-200 uppercase tracking-wider font-semibold">Connected</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Advanced Multi-Filter & Real-Time Search -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <!-- Search Input & Reset Button -->
        <div class="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div class="relative flex-1 w-full">
            <app-icon name="search" [size]="18" customClass="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search by name, company (Google, Uber), skills (Go, Redis), location, topic..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          <div class="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              *ngIf="hasActiveFilters()"
              type="button"
              (click)="resetFilters()"
              class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 flex items-center gap-1 transition-colors"
            >
              <app-icon name="x" [size]="14"></app-icon>
              Reset Filters
            </button>
            <span class="text-xs text-slate-400 font-medium">
              Showing {{ filteredAlumni().length }} professionals
            </span>
          </div>
        </div>

        <!-- Filter Dropdowns Row -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100 text-xs">
          <!-- Department -->
          <div>
            <label class="block text-[11px] font-bold text-slate-500 mb-1">Department</label>
            <select
              [(ngModel)]="selectedDepartment"
              class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Departments</option>
              <option *ngFor="let dept of departments" [value]="dept">{{ dept }}</option>
            </select>
          </div>

          <!-- Company -->
          <div>
            <label class="block text-[11px] font-bold text-slate-500 mb-1">Company</label>
            <select
              [(ngModel)]="selectedCompany"
              class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Companies</option>
              <option *ngFor="let comp of availableCompanies()" [value]="comp">{{ comp }}</option>
            </select>
          </div>

          <!-- Industry -->
          <div>
            <label class="block text-[11px] font-bold text-slate-500 mb-1">Industry</label>
            <select
              [(ngModel)]="selectedIndustry"
              class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Industries</option>
              <option *ngFor="let ind of availableIndustries()" [value]="ind">{{ ind }}</option>
            </select>
          </div>

          <!-- Location -->
          <div>
            <label class="block text-[11px] font-bold text-slate-500 mb-1">Location</label>
            <select
              [(ngModel)]="selectedLocation"
              class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Locations</option>
              <option *ngFor="let loc of availableLocations()" [value]="loc">{{ loc }}</option>
            </select>
          </div>

          <!-- Mentorship Topic -->
          <div>
            <label class="block text-[11px] font-bold text-slate-500 mb-1">Mentorship Topic</label>
            <select
              [(ngModel)]="selectedTopic"
              class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Topics</option>
              <option *ngFor="let topic of availableTopics()" [value]="topic">{{ topic }}</option>
            </select>
          </div>

          <!-- Checkbox Toggles -->
          <div class="flex flex-col justify-end gap-1.5">
            <label class="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                [(ngModel)]="onlyMentoring"
                class="rounded text-purple-600 focus:ring-purple-500"
              />
              <span>Open Mentors Only</span>
            </label>
            <label class="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                [(ngModel)]="onlyVerified"
                class="rounded text-amber-500 focus:ring-amber-500"
              />
              <span>⭐ Verified Only</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Professional Directory Grid -->
      <div *ngIf="filteredAlumni().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          *ngFor="let mentor of filteredAlumni()"
          class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-purple-200 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
        >
          <div>
            <!-- Header: Photo, Verified Badge, Name, Company, Bookmark -->
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="relative shrink-0">
                  <img
                    [src]="mentor.profilePhoto"
                    [alt]="mentor.fullName"
                    (error)="onImgError($event, mentor.fullName)"
                    class="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs ring-2 ring-purple-50"
                  />
                  <span
                    *ngIf="mentor.availableForMentoring"
                    class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"
                    title="Available for mentoring"
                  ></span>
                </div>

                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <h3 class="text-base font-bold text-slate-900 truncate group-hover:text-purple-700 transition-colors">
                      {{ mentor.fullName }}
                    </h3>
                    <span
                      *ngIf="mentor.isVerified"
                      class="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-0.5"
                      title="Verified Identity and Professional Background"
                    >
                      ⭐ Verified
                    </span>
                  </div>

                  <p class="text-xs font-semibold text-purple-700 truncate mt-0.5">{{ mentor.designation }}</p>
                  <span class="text-[11px] text-slate-500 font-medium block truncate">
                    {{ mentor.company }} • Class of {{ mentor.graduationYear }}
                  </span>
                </div>
              </div>

              <!-- Bookmark Action -->
              <button
                type="button"
                (click)="bookmarkService.toggleBookmark('alumni', mentor.id, mentor.fullName)"
                class="p-2 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors shrink-0"
                [title]="bookmarkService.isBookmarked('alumni', mentor.id) ? 'Remove bookmark' : 'Bookmark mentor'"
              >
                <app-icon
                  name="bookmark"
                  [size]="18"
                  [customClass]="bookmarkService.isBookmarked('alumni', mentor.id) ? 'fill-purple-600 text-purple-600' : ''"
                ></app-icon>
              </button>
            </div>

            <!-- Department, Industry, Location meta -->
            <div class="flex items-center gap-2 text-[11px] text-slate-500 mb-3 flex-wrap">
              <span class="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100 font-medium">
                {{ mentor.department }}
              </span>
              <span *ngIf="mentor.location" class="flex items-center gap-0.5">
                <app-icon name="map-pin" [size]="12"></app-icon>
                {{ mentor.location }}
              </span>
            </div>

            <!-- Bio -->
            <p class="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-3">
              {{ mentor.bio }}
            </p>

            <!-- Skills Chips -->
            <div class="flex flex-wrap gap-1 mb-3">
              <span
                *ngFor="let skill of mentor.skills.slice(0, 4)"
                class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100"
              >
                {{ skill }}
              </span>
              <span *ngIf="mentor.skills.length > 4" class="text-[10px] text-slate-400 px-1 py-0.5">
                +{{ mentor.skills.length - 4 }}
              </span>
            </div>

            <!-- Mentorship Topics (if available) -->
            <div *ngIf="mentor.mentorshipTopics && mentor.mentorshipTopics.length > 0" class="mb-4">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Mentorship Expertise:
              </span>
              <div class="flex flex-wrap gap-1">
                <span
                  *ngFor="let topic of mentor.mentorshipTopics.slice(0, 2)"
                  class="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                >
                  {{ topic }}
                </span>
              </div>
            </div>

            <!-- External Contact Methods (Allowed by visibility rules) -->
            <div class="pt-2 border-t border-slate-100 flex items-center gap-2 mb-3">
              <span class="text-[10px] text-slate-400 font-medium">Contact:</span>

              <!-- Display allowed contact buttons -->
              <ng-container *ngFor="let method of getVisibleContactMethods(mentor)">
                <a
                  [href]="method.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1 text-[11px] font-medium border border-slate-200"
                  [title]="method.label"
                >
                  <app-icon
                    [name]="method.type === 'linkedin' ? 'linkedin' : (method.type === 'website' ? 'globe' : 'mail')"
                    [size]="13"
                  ></app-icon>
                  <span>{{ method.label }}</span>
                </a>
              </ng-container>

              <span
                *ngIf="getVisibleContactMethods(mentor).length === 0"
                class="text-[10px] text-slate-400 italic"
              >
                {{ getConnectionStatus(mentor) === 'accepted' ? 'Direct chat enabled' : 'Connect to reveal contact' }}
              </span>
            </div>
          </div>

          <!-- Bottom Action Buttons: View Profile, Connection & Calls -->
          <div class="pt-3 border-t border-slate-100 space-y-2">
            <div class="flex items-center gap-2">
              <!-- View Profile CTA -->
              <button
                type="button"
                (click)="openProfileModal(mentor)"
                class="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
              >
                View Profile
              </button>

              <!-- Connection State Button -->
              <ng-container [ngSwitch]="getConnectionStatus(mentor)">
                <!-- Not connected: Send request -->
                <button
                  *ngSwitchCase="'none'"
                  type="button"
                  (click)="openRequestModal(mentor)"
                  class="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-[1.01]"
                >
                  <app-icon name="user-plus" [size]="14"></app-icon>
                  <span>Request Connection</span>
                </button>

                <!-- Request Pending -->
                <button
                  *ngSwitchCase="'pending'"
                  disabled
                  type="button"
                  class="flex-1 py-2 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-xs flex items-center justify-center gap-1.5 opacity-90 cursor-not-allowed"
                >
                  <app-icon name="clock" [size]="14"></app-icon>
                  <span>Request Sent (Pending)</span>
                </button>

                <!-- Request Accepted: Unlocks Chat, Audio, Video Calling -->
                <div *ngSwitchCase="'accepted'" class="flex-1 flex items-center gap-1.5">
                  <button
                    type="button"
                    (click)="messageMentor(mentor)"
                    class="flex-1 py-2 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors"
                    title="Send direct message"
                  >
                    <app-icon name="message-square" [size]="13"></app-icon>
                    <span>Message</span>
                  </button>

                  <button
                    type="button"
                    (click)="callMentor(mentor, 'audio')"
                    class="p-2 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 transition-colors"
                    title="Start 1-on-1 Voice Call"
                  >
                    <app-icon name="phone" [size]="15"></app-icon>
                  </button>

                  <button
                    type="button"
                    (click)="callMentor(mentor, 'video')"
                    class="p-2 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 transition-colors"
                    title="Start 1-on-1 Video Session"
                  >
                    <app-icon name="video" [size]="15"></app-icon>
                  </button>
                </div>

                <!-- Request Rejected -->
                <button
                  *ngSwitchCase="'rejected'"
                  disabled
                  type="button"
                  class="flex-1 py-2 px-3 rounded-xl bg-slate-100 text-slate-500 font-semibold text-xs cursor-not-allowed"
                >
                  Declined
                </button>
              </ng-container>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="filteredAlumni().length === 0"
        title="No Professionals Found"
        description="We couldn't find any professionals matching your search query and filters. Try adjusting your search or clearing your active filters."
        actionLabel="Reset Filters"
        (action)="resetFilters()"
      ></app-empty-state>
    </div>

    <!-- CONNECTION REQUEST MODAL -->
    <div
      *ngIf="showRequestModal() && targetMentor()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
        <div class="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-base font-bold text-slate-900">Request Mentorship Connection</h3>
            <p class="text-xs text-slate-500 mt-0.5">
              To: <strong>{{ targetMentor()?.fullName }}</strong> ({{ targetMentor()?.designation }} @ {{ targetMentor()?.company }})
            </p>
          </div>
          <button (click)="showRequestModal.set(false)" class="p-1 text-slate-400 hover:text-slate-600">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Primary Mentorship Topic *</label>
            <select
              [(ngModel)]="requestTopic"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="System Design (HLD & LLD)">System Design (HLD & LLD)</option>
              <option value="DSA & Algorithmic Problem Solving">DSA & Algorithmic Problem Solving</option>
              <option value="Backend Architecture & Distributed Systems">Backend Architecture & Distributed Systems</option>
              <option value="Resume & Portfolio Review">Resume & Portfolio Review</option>
              <option value="Company-Specific Technical Interview Prep">Company-Specific Technical Interview Prep</option>
              <option value="Career Guidance & Industry Transition">Career Guidance & Industry Transition</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Reason for Connecting *</label>
            <textarea
              [(ngModel)]="requestReason"
              rows="3"
              placeholder="Explain why you are reaching out and what guidance you are seeking..."
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-500"
            ></textarea>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Personal Message (Optional)</label>
            <textarea
              [(ngModel)]="requestMessage"
              rows="2"
              placeholder="Introduce your background, graduation year, and any specific questions..."
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            ></textarea>
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button (click)="showRequestModal.set(false)" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            (click)="submitConnectionRequest()"
            [disabled]="isSubmitting() || !requestReason.trim()"
            class="px-5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            <span *ngIf="isSubmitting()" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>{{ isSubmitting() ? 'Sending...' : 'Send Request' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- VIEW FULL PROFILE MODAL -->
    <div
      *ngIf="showProfileModal() && selectedMentor()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div class="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="flex items-start justify-between pb-4 border-b border-slate-100">
          <div class="flex items-center gap-4">
            <img
              [src]="selectedMentor()?.profilePhoto"
              [alt]="selectedMentor()?.fullName"
              (error)="onImgError($event, selectedMentor()?.fullName || '')"
              class="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-md"
            />
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-xl font-bold text-slate-900">{{ selectedMentor()?.fullName }}</h3>
                <span *ngIf="selectedMentor()?.isVerified" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  ⭐ Verified Professional
                </span>
              </div>
              <p class="text-sm font-semibold text-purple-700">{{ selectedMentor()?.designation }}</p>
              <p class="text-xs text-slate-500 font-medium">{{ selectedMentor()?.company }} • {{ selectedMentor()?.location }}</p>
            </div>
          </div>

          <button (click)="showProfileModal.set(false)" class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <!-- Professional Metadata Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <span class="text-slate-400 font-semibold block text-[10px] uppercase">Industry</span>
            <span class="font-bold text-slate-800">{{ selectedMentor()?.industry || 'Technology' }}</span>
          </div>
          <div>
            <span class="text-slate-400 font-semibold block text-[10px] uppercase">Graduation Year</span>
            <span class="font-bold text-slate-800">Class of {{ selectedMentor()?.graduationYear }}</span>
          </div>
          <div>
            <span class="text-slate-400 font-semibold block text-[10px] uppercase">Department</span>
            <span class="font-bold text-slate-800 truncate block">{{ selectedMentor()?.department }}</span>
          </div>
          <div>
            <span class="text-slate-400 font-semibold block text-[10px] uppercase">Experience</span>
            <span class="font-bold text-slate-800">{{ selectedMentor()?.experienceYears }} Years</span>
          </div>
          <div>
            <span class="text-slate-400 font-semibold block text-[10px] uppercase">Mentees Guided</span>
            <span class="font-bold text-purple-700">{{ selectedMentor()?.menteesCount || 20 }}+ Students</span>
          </div>
          <div>
            <span class="text-slate-400 font-semibold block text-[10px] uppercase">Rating</span>
            <span class="font-bold text-amber-600">{{ selectedMentor()?.rating || 5.0 }} / 5.0 ⭐</span>
          </div>
        </div>

        <!-- Bio -->
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Professional Background</h4>
          <p class="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            {{ selectedMentor()?.bio }}
          </p>
        </div>

        <!-- Skills & Mentorship Topics -->
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Technical Expertise & Skills</h4>
          <div class="flex flex-wrap gap-1.5 mb-3">
            <span
              *ngFor="let skill of selectedMentor()?.skills"
              class="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100"
            >
              {{ skill }}
            </span>
          </div>

          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Mentorship Topics</h4>
          <div class="flex flex-wrap gap-1.5">
            <span
              *ngFor="let topic of selectedMentor()?.mentorshipTopics"
              class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700"
            >
              {{ topic }}
            </span>
          </div>
        </div>

        <!-- External Contact Links (Visibility-Aware) -->
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Public & Verified Contact Methods</h4>
          <div class="flex flex-wrap gap-2">
            <ng-container *ngFor="let method of getVisibleContactMethods(selectedMentor()!)">
              <a
                [href]="method.url"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 transition-colors flex items-center gap-1.5 text-xs font-semibold border border-slate-200"
              >
                <app-icon
                  [name]="method.type === 'linkedin' ? 'linkedin' : (method.type === 'website' ? 'globe' : 'mail')"
                  [size]="15"
                ></app-icon>
                <span>{{ method.label }}</span>
                <app-icon name="external-link" [size]="12"></app-icon>
              </a>
            </ng-container>

            <span
              *ngIf="getVisibleContactMethods(selectedMentor()!).length === 0"
              class="text-xs text-slate-400 italic p-2 bg-slate-50 rounded-lg border border-slate-100 block w-full"
            >
              Contact details are configured for connected members only. Send a connection request to connect directly.
            </span>
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="pt-4 flex items-center justify-between gap-3 border-t border-slate-100">
          <button (click)="showProfileModal.set(false)" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
            Close
          </button>

          <div class="flex items-center gap-2">
            <!-- If connected: Message and Calls -->
            <ng-container *ngIf="getConnectionStatus(selectedMentor()!) === 'accepted'">
              <button
                (click)="messageMentor(selectedMentor()!)"
                class="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 shadow-xs"
              >
                <app-icon name="message-square" [size]="14"></app-icon>
                <span>Chat</span>
              </button>
              <button
                (click)="callMentor(selectedMentor()!, 'audio')"
                class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                title="Voice Call"
              >
                <app-icon name="phone" [size]="15"></app-icon>
              </button>
              <button
                (click)="callMentor(selectedMentor()!, 'video')"
                class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                title="Video Call"
              >
                <app-icon name="video" [size]="15"></app-icon>
              </button>
            </ng-container>

            <!-- If not connected -->
            <ng-container *ngIf="getConnectionStatus(selectedMentor()!) === 'none'">
              <button
                (click)="showProfileModal.set(false); openRequestModal(selectedMentor()!)"
                class="px-5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 shadow-xs"
              >
                <app-icon name="user-plus" [size]="14"></app-icon>
                <span>Request Connection</span>
              </button>
            </ng-container>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AlumniListComponent {
  alumniService = inject(AlumniService);
  chatService = inject(ChatService);
  callService = inject(CallService);
  bookmarkService = inject(BookmarkService);
  authService = inject(AuthService);
  private router = inject(Router);

  // Search & Filter State
  searchQuery = '';
  selectedDepartment = 'all';
  selectedCompany = 'all';
  selectedIndustry = 'all';
  selectedLocation = 'all';
  selectedTopic = 'all';
  onlyMentoring = false;
  onlyVerified = false;

  readonly departments = [
    'Computer Science & Engineering',
    'Information Technology',
    'Artificial Intelligence & Data Science',
    'Electronics & Communication'
  ];

  // Modal Signals
  showRequestModal = signal<boolean>(false);
  showProfileModal = signal<boolean>(false);
  targetMentor = signal<Alumni | null>(null);
  selectedMentor = signal<Alumni | null>(null);
  isSubmitting = signal<boolean>(false);

  // Request Form
  requestTopic = 'System Design (HLD & LLD)';
  requestReason = '';
  requestMessage = '';

  // Dynamic filter options based on real alumni records
  availableCompanies = computed(() => {
    const list = this.alumniService.alumni();
    const set = new Set<string>();
    list.forEach(a => {
      if (a.company) set.add(a.company);
    });
    return Array.from(set).sort();
  });

  availableIndustries = computed(() => {
    const list = this.alumniService.alumni();
    const set = new Set<string>();
    list.forEach(a => {
      if (a.industry) set.add(a.industry);
    });
    return Array.from(set).sort();
  });

  availableLocations = computed(() => {
    const list = this.alumniService.alumni();
    const set = new Set<string>();
    list.forEach(a => {
      if (a.location) set.add(a.location);
    });
    return Array.from(set).sort();
  });

  availableTopics = computed(() => {
    const list = this.alumniService.alumni();
    const set = new Set<string>();
    list.forEach(a => {
      a.mentorshipTopics?.forEach(t => set.add(t));
    });
    return Array.from(set).sort();
  });

  // Multi-Filter Pipeline using AND logic
  filteredAlumni = computed(() => {
    let list = this.alumniService.alumni();
    const q = this.searchQuery.toLowerCase().trim();
    const dept = this.selectedDepartment;
    const comp = this.selectedCompany;
    const ind = this.selectedIndustry;
    const loc = this.selectedLocation;
    const top = this.selectedTopic;
    const mentoring = this.onlyMentoring;
    const verified = this.onlyVerified;

    // Search query across name, company, designation, skills, location, industry, topics
    if (q) {
      list = list.filter(a =>
        a.fullName.toLowerCase().includes(q) ||
        a.company.toLowerCase().includes(q) ||
        a.designation.toLowerCase().includes(q) ||
        (a.industry && a.industry.toLowerCase().includes(q)) ||
        (a.location && a.location.toLowerCase().includes(q)) ||
        a.skills.some(s => s.toLowerCase().includes(q)) ||
        (a.mentorshipTopics && a.mentorshipTopics.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (dept !== 'all') {
      list = list.filter(a => a.department.toLowerCase() === dept.toLowerCase());
    }

    if (comp !== 'all') {
      list = list.filter(a => a.company === comp);
    }

    if (ind !== 'all') {
      list = list.filter(a => a.industry === ind);
    }

    if (loc !== 'all') {
      list = list.filter(a => a.location === loc);
    }

    if (top !== 'all') {
      list = list.filter(a => a.mentorshipTopics && a.mentorshipTopics.includes(top));
    }

    if (mentoring) {
      list = list.filter(a => a.availableForMentoring);
    }

    if (verified) {
      list = list.filter(a => a.isVerified);
    }

    return list;
  });

  hasActiveFilters(): boolean {
    return !!(
      this.searchQuery.trim() ||
      this.selectedDepartment !== 'all' ||
      this.selectedCompany !== 'all' ||
      this.selectedIndustry !== 'all' ||
      this.selectedLocation !== 'all' ||
      this.selectedTopic !== 'all' ||
      this.onlyMentoring ||
      this.onlyVerified
    );
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedDepartment = 'all';
    this.selectedCompany = 'all';
    this.selectedIndustry = 'all';
    this.selectedLocation = 'all';
    this.selectedTopic = 'all';
    this.onlyMentoring = false;
    this.onlyVerified = false;
  }

  getConnectionStatus(mentor: Alumni): ConnectionStatus | 'none' {
    return this.alumniService.getConnectionStatus(mentor.userId);
  }

  getVisibleContactMethods(mentor: Alumni): ContactMethod[] {
    const visibility = mentor.contactVisibility || 'connected_only';
    const isConnected = this.getConnectionStatus(mentor) === 'accepted';

    if (visibility === 'hidden') return [];

    // Filter only enabled methods that have valid URL/email
    const configuredMethods = (mentor.contactMethods || []).filter(m => m.isVisible && m.url?.trim());

    if (visibility === 'public') {
      return configuredMethods;
    }

    // 'connected_only'
    if (isConnected) {
      return configuredMethods;
    }

    // If not connected, only allow public LinkedIn if configured
    return configuredMethods.filter(m => m.type === 'linkedin');
  }

  openRequestModal(mentor: Alumni) {
    this.targetMentor.set(mentor);
    this.requestReason = '';
    this.requestMessage = '';
    this.showRequestModal.set(true);
  }

  openProfileModal(mentor: Alumni) {
    this.selectedMentor.set(mentor);
    this.showProfileModal.set(true);
  }

  async submitConnectionRequest() {
    const mentor = this.targetMentor();
    if (!mentor || !this.requestReason.trim()) return;

    this.isSubmitting.set(true);
    try {
      const success = await this.alumniService.sendConnectionRequest({
        receiverId: mentor.userId,
        mentorshipTopic: this.requestTopic,
        reason: this.requestReason.trim(),
        message: this.requestMessage.trim() || undefined
      });

      if (success) {
        this.showRequestModal.set(false);
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  messageMentor(mentor: Alumni) {
    this.chatService.startConversationWith({
      id: mentor.userId,
      name: mentor.fullName,
      avatar: mentor.profilePhoto,
      role: 'alumni',
      headline: `${mentor.designation} @ ${mentor.company}`
    });
    this.router.navigate(['/student/messages']);
  }

  callMentor(mentor: Alumni, type: 'audio' | 'video') {
    this.callService.startCall({
      id: mentor.userId,
      name: mentor.fullName,
      avatar: mentor.profilePhoto,
      role: 'alumni'
    }, type);
  }

  onImgError(event: Event, name: string) {
    const target = event.target as HTMLImageElement;
    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&bold=true`;
  }
}
