import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationStatus, ApplicationTimelineEvent } from '../../core/models/application.model';
import { IconComponent } from '../icons/icon.component';

@Component({
  selector: 'app-status-timeline',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="space-y-4">
      <!-- Stepper progress line -->
      <div class="relative flex items-center justify-between">
        <!-- Connecting Background line -->
        <div class="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 w-full z-0 rounded-full"></div>
        
        <!-- Active colored progress line -->
        <div
          class="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-500 z-0 rounded-full"
          [style.width]="progressPercentage + '%'"
        ></div>

        <!-- Steps -->
        <div
          *ngFor="let step of steps; let i = index"
          class="relative z-10 flex flex-col items-center group cursor-default"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all duration-300"
            [ngClass]="{
              'bg-blue-600 border-blue-600 text-white shadow-sm': isCompleted(step),
              'bg-blue-50 border-blue-600 text-blue-600 ring-4 ring-blue-100 animate-pulse-subtle': isCurrent(step) && currentStatus !== 'Rejected',
              'bg-rose-600 border-rose-600 text-white ring-4 ring-rose-100': isCurrent(step) && currentStatus === 'Rejected',
              'bg-white border-slate-300 text-slate-400': isUpcoming(step)
            }"
          >
            <app-icon *ngIf="isCompleted(step)" name="check" [size]="14"></app-icon>
            <app-icon *ngIf="isCurrent(step) && currentStatus === 'Rejected'" name="x" [size]="14"></app-icon>
            <span *ngIf="!isCompleted(step) && !(isCurrent(step) && currentStatus === 'Rejected')">{{ i + 1 }}</span>
          </div>

          <span
            class="mt-2 text-[11px] font-medium text-center whitespace-nowrap hidden sm:block"
            [ngClass]="{
              'text-blue-700 font-semibold': isCurrent(step),
              'text-slate-800': isCompleted(step),
              'text-slate-400': isUpcoming(step),
              'text-rose-600 font-semibold': isCurrent(step) && currentStatus === 'Rejected'
            }"
          >
            {{ step }}
          </span>
        </div>
      </div>

      <!-- Timeline details history list -->
      <div *ngIf="timeline && timeline.length > 0" class="mt-6 border-t border-slate-100 pt-4 space-y-3">
        <h5 class="text-xs font-semibold uppercase tracking-wider text-slate-500">Activity & Stage History</h5>
        <div *ngFor="let item of timeline" class="flex items-start gap-3 text-xs">
          <div class="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></div>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-slate-800">{{ item.status }}</span>
              <span class="text-slate-400 text-[11px]">{{ item.date }}</span>
            </div>
            <p *ngIf="item.notes" class="text-slate-600 mt-0.5">{{ item.notes }}</p>
            <a
              *ngIf="item.locationOrLink"
              [href]="item.locationOrLink"
              target="_blank"
              class="inline-flex items-center gap-1 text-blue-600 font-medium hover:underline mt-1"
            >
              <app-icon name="video" [size]="12"></app-icon>
              Join Interview Room
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StatusTimelineComponent {
  @Input({ required: true }) currentStatus!: ApplicationStatus;
  @Input() timeline: ApplicationTimelineEvent[] = [];

  readonly standardSteps: ApplicationStatus[] = [
    'Applied',
    'Shortlisted',
    'Aptitude',
    'Technical Interview',
    'HR Interview',
    'Selected'
  ];

  get steps(): ApplicationStatus[] {
    if (this.currentStatus === 'Rejected') {
      return ['Applied', 'Shortlisted', 'Rejected'];
    }
    return this.standardSteps;
  }

  get currentIndex(): number {
    return this.steps.indexOf(this.currentStatus);
  }

  get progressPercentage(): number {
    if (this.steps.length <= 1) return 0;
    const idx = Math.max(0, this.currentIndex);
    return (idx / (this.steps.length - 1)) * 100;
  }

  isCompleted(step: ApplicationStatus): boolean {
    const stepIdx = this.steps.indexOf(step);
    return stepIdx < this.currentIndex;
  }

  isCurrent(step: ApplicationStatus): boolean {
    return step === this.currentStatus;
  }

  isUpcoming(step: ApplicationStatus): boolean {
    const stepIdx = this.steps.indexOf(step);
    return stepIdx > this.currentIndex;
  }
}
