import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icons/icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="flex flex-col items-center justify-center p-8 sm:p-14 text-center rounded-3xl border border-dashed border-slate-300/80 bg-white/60 backdrop-blur-xs shadow-xs">
      <div class="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200/80 text-slate-400 flex items-center justify-center mb-4 shadow-xs">
        <app-icon [name]="icon" [size]="30" customClass="text-slate-500"></app-icon>
      </div>
      <h3 class="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{{ title }}</h3>
      <p class="text-xs sm:text-sm text-slate-500 max-w-md mt-1.5 mb-6 leading-relaxed">{{ description }}</p>
      
      <button
        *ngIf="actionLabel"
        type="button"
        (click)="action.emit()"
        class="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
      >
        <app-icon *ngIf="actionIcon" [name]="actionIcon" [size]="16"></app-icon>
        {{ actionLabel }}
      </button>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() icon: string = 'search';
  @Input({ required: true }) title!: string;
  @Input({ required: true }) description!: string;
  @Input() actionLabel?: string;
  @Input() actionIcon?: string;
  @Output() action = new EventEmitter<void>();
}
