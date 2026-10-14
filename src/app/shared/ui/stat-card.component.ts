import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icons/icon.component';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300/80 transition-all duration-200 relative overflow-hidden group">
      <!-- Glow accent on hover -->
      <div
        class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 blur-xl transition-all duration-300 group-hover:scale-150 pointer-events-none"
        [ngClass]="{
          'bg-blue-600': color === 'blue',
          'bg-emerald-600': color === 'emerald',
          'bg-purple-600': color === 'purple',
          'bg-amber-600': color === 'amber',
          'bg-cyan-600': color === 'cyan',
          'bg-indigo-600': color === 'indigo',
          'bg-rose-600': color === 'rose'
        }"
      ></div>

      <div class="flex items-center justify-between">
        <span class="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 select-none">{{ title }}</span>
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-xs"
          [ngClass]="{
            'bg-blue-50 text-blue-600 border border-blue-100': color === 'blue',
            'bg-emerald-50 text-emerald-600 border border-emerald-100': color === 'emerald',
            'bg-purple-50 text-purple-600 border border-purple-100': color === 'purple',
            'bg-amber-50 text-amber-600 border border-amber-100': color === 'amber',
            'bg-cyan-50 text-cyan-600 border border-cyan-100': color === 'cyan',
            'bg-indigo-50 text-indigo-600 border border-indigo-100': color === 'indigo',
            'bg-rose-50 text-rose-600 border border-rose-100': color === 'rose'
          }"
        >
          <app-icon [name]="icon" [size]="19"></app-icon>
        </div>
      </div>

      <div class="mt-3 flex items-baseline gap-2">
        <h3 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{{ value }}</h3>
        <span *ngIf="trend" class="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
          <app-icon name="trending-up" [size]="12"></app-icon>
          {{ trend }}
        </span>
      </div>

      <p *ngIf="subtitle" class="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{{ subtitle }}</p>
    </div>
  `
})
export class StatCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) value!: string | number;
  @Input({ required: true }) icon!: string;
  @Input() subtitle?: string;
  @Input() trend?: string;
  @Input() color: 'blue' | 'emerald' | 'purple' | 'amber' | 'cyan' | 'indigo' | 'rose' = 'blue';
}
