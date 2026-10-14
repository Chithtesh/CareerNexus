import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../icons/icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <div
        *ngFor="let toast of toastService.toasts()"
        class="pointer-events-auto p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 flex items-start gap-3"
        [ngClass]="{
          'bg-emerald-50/95 border-emerald-200 text-emerald-950': toast.type === 'success',
          'bg-rose-50/95 border-rose-200 text-rose-950': toast.type === 'error',
          'bg-blue-50/95 border-blue-200 text-blue-950': toast.type === 'info',
          'bg-amber-50/95 border-amber-200 text-amber-950': toast.type === 'warning'
        }"
      >
        <!-- Icon -->
        <div class="mt-0.5 shrink-0">
          <app-icon
            *ngIf="toast.type === 'success'"
            name="check-circle"
            [size]="20"
            customClass="text-emerald-600"
          ></app-icon>
          <app-icon
            *ngIf="toast.type === 'error'"
            name="alert-circle"
            [size]="20"
            customClass="text-rose-600"
          ></app-icon>
          <app-icon
            *ngIf="toast.type === 'info'"
            name="sparkles"
            [size]="20"
            customClass="text-blue-600"
          ></app-icon>
          <app-icon
            *ngIf="toast.type === 'warning'"
            name="alert-circle"
            [size]="20"
            customClass="text-amber-600"
          ></app-icon>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-semibold tracking-tight">{{ toast.title }}</h4>
          <p class="text-xs mt-0.5 opacity-90 leading-relaxed">{{ toast.message }}</p>
        </div>

        <!-- Dismiss button -->
        <button
          type="button"
          (click)="toastService.remove(toast.id)"
          class="shrink-0 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
        >
          <app-icon name="x" [size]="14"></app-icon>
        </button>
      </div>
    </div>
  `
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
