import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'purple' | 'cyan' | 'indigo' | 'teal';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide transition-colors select-none"
      [ngClass]="{
        'bg-blue-50 text-blue-700 border border-blue-200/80': variant === 'primary',
        'bg-emerald-50 text-emerald-700 border border-emerald-200/80': variant === 'success',
        'bg-amber-50 text-amber-800 border border-amber-200/80': variant === 'warning',
        'bg-rose-50 text-rose-700 border border-rose-200/80': variant === 'error',
        'bg-slate-100 text-slate-700 border border-slate-200': variant === 'neutral',
        'bg-purple-50 text-purple-700 border border-purple-200/80': variant === 'purple',
        'bg-cyan-50 text-cyan-800 border border-cyan-200/80': variant === 'cyan',
        'bg-indigo-50 text-indigo-700 border border-indigo-200/80': variant === 'indigo',
        'bg-teal-50 text-teal-800 border border-teal-200/80': variant === 'teal'
      }"
    >
      <span *ngIf="dot" class="w-1.5 h-1.5 rounded-full shrink-0" [ngClass]="{
        'bg-blue-600': variant === 'primary',
        'bg-emerald-600': variant === 'success',
        'bg-amber-600': variant === 'warning',
        'bg-rose-600': variant === 'error',
        'bg-slate-500': variant === 'neutral',
        'bg-purple-600': variant === 'purple',
        'bg-cyan-600': variant === 'cyan',
        'bg-indigo-600': variant === 'indigo',
        'bg-teal-600': variant === 'teal'
      }"></span>
      <ng-content></ng-content>
    </span>
  `
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'primary';
  @Input() dot: boolean = false;
}
