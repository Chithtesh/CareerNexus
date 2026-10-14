import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarService } from '../../core/services/calendar.service';
import { AuthService } from '../../core/services/auth.service';
import { PlacementEvent, PlacementEventType } from '../../core/models/calendar.model';
import { IconComponent } from '../../shared/icons/icon.component';

@Component({
  selector: 'app-placement-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300 pb-12">
      <!-- Top Title -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Placement & Drive Calendar</span>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Live Schedule
            </span>
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Track upcoming campus drive deadlines, online assessments, technical interview rounds, and prep sessions.
          </p>
        </div>

        <button
          *ngIf="authService.isAdmin() || authService.isRecruiter()"
          type="button"
          (click)="showAddModal.set(true)"
          class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <app-icon name="plus" [size]="16"></app-icon>
          + Schedule Event
        </button>
      </div>

      <!-- Filters & Type Selector -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <button
          type="button"
          (click)="selectedType.set('all')"
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
          [ngClass]="selectedType() === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'"
        >
          All Events ({{ calendarService.events().length }})
        </button>
        <button
          type="button"
          (click)="selectedType.set('Application Deadline')"
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
          [ngClass]="selectedType() === 'Application Deadline' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'"
        >
          Deadlines
        </button>
        <button
          type="button"
          (click)="selectedType.set('Assessment')"
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
          [ngClass]="selectedType() === 'Assessment' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'"
        >
          Assessments
        </button>
        <button
          type="button"
          (click)="selectedType.set('Interview')"
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
          [ngClass]="selectedType() === 'Interview' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'"
        >
          Interviews
        </button>
        <button
          type="button"
          (click)="selectedType.set('Placement Drive')"
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
          [ngClass]="selectedType() === 'Placement Drive' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'"
        >
          Drives
        </button>
      </div>

      <!-- Events List / Timeline -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          *ngFor="let evt of filteredEvents()"
          class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
        >
          <div>
            <div class="flex items-start justify-between gap-2 mb-2">
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase"
                [ngClass]="{
                  'bg-rose-100 text-rose-800': evt.eventType === 'Application Deadline',
                  'bg-indigo-100 text-indigo-800': evt.eventType === 'Assessment',
                  'bg-emerald-100 text-emerald-800': evt.eventType === 'Interview',
                  'bg-amber-100 text-amber-800': evt.eventType === 'Placement Drive',
                  'bg-blue-100 text-blue-800': evt.eventType === 'Training Session'
                }"
              >
                {{ evt.eventType }}
              </span>
              <span *ngIf="evt.isMandatory" class="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                Mandatory
              </span>
            </div>

            <div class="flex items-center gap-2 mb-1.5" *ngIf="evt.companyName">
              <img *ngIf="evt.companyLogo" [src]="evt.companyLogo" class="w-6 h-6 rounded-md object-cover border border-slate-200" />
              <span class="text-xs font-bold text-slate-600">{{ evt.companyName }}</span>
            </div>

            <h3 class="text-sm font-bold text-slate-900 leading-snug">{{ evt.title }}</h3>
            <p class="text-xs text-slate-500 leading-relaxed mt-1">{{ evt.description }}</p>
          </div>

          <div class="pt-3 border-t border-slate-100 space-y-1 text-xs">
            <div class="flex items-center gap-2 text-slate-700 font-semibold">
              <app-icon name="calendar" [size]="14" customClass="text-blue-600"></app-icon>
              <span>{{ evt.startDate | date:'fullDate' }}</span>
            </div>
            <div *ngIf="evt.locationOrUrl" class="text-[11px] text-slate-500 flex items-center gap-1.5">
              <app-icon name="map-pin" [size]="13"></app-icon>
              <span class="truncate">{{ evt.locationOrUrl }}</span>
            </div>
          </div>
        </div>

        <div *ngIf="filteredEvents().length === 0" class="col-span-full p-8 rounded-3xl bg-slate-50 text-center text-slate-400 text-xs">
          No calendar events match the specified filter.
        </div>
      </div>

      <!-- Add Event Modal -->
      <div *ngIf="showAddModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900">Schedule Placement Event</h3>
            <button (click)="showAddModal.set(false)" class="p-1 text-slate-400 hover:text-slate-600">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <form (submit)="saveEvent($event)" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700">Event Title *</label>
              <input type="text" [(ngModel)]="eventForm.title" name="eTitle" required placeholder="e.g. Amazon Round 1 Online Test" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700">Event Type</label>
              <select [(ngModel)]="eventForm.eventType" name="eType" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white">
                <option value="Application Deadline">Application Deadline</option>
                <option value="Assessment">Assessment</option>
                <option value="Interview">Interview</option>
                <option value="Placement Drive">Placement Drive</option>
                <option value="Training Session">Training Session</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700">Company Name (Optional)</label>
              <input type="text" [(ngModel)]="eventForm.companyName" name="eComp" placeholder="e.g. Amazon / Google" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700">Description</label>
              <textarea [(ngModel)]="eventForm.description" name="eDesc" rows="2" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200"></textarea>
            </div>
            <div>
              <label class="block font-semibold text-slate-700">Date & Time</label>
              <input type="date" [(ngModel)]="eventDateRaw" name="eDate" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
            </div>

            <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" (click)="showAddModal.set(false)" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs">Schedule</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class PlacementCalendarComponent {
  calendarService = inject(CalendarService);
  authService = inject(AuthService);

  selectedType = signal<string>('all');
  showAddModal = signal(false);

  eventForm = {
    title: '',
    description: '',
    eventType: 'Assessment' as PlacementEventType,
    companyName: '',
    locationOrUrl: 'Online / CareerNexus',
    isMandatory: true,
    forRole: 'student' as const
  };
  eventDateRaw = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

  filteredEvents = computed(() => {
    const t = this.selectedType();
    if (t === 'all') return this.calendarService.events();
    return this.calendarService.events().filter(e => e.eventType === t);
  });

  async saveEvent(e: Event) {
    e.preventDefault();
    await this.calendarService.addEvent({
      ...this.eventForm,
      startDate: new Date(this.eventDateRaw).toISOString()
    });
    this.showAddModal.set(false);
  }
}
