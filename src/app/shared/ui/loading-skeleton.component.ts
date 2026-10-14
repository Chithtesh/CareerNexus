import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <!-- Card Skeleton -->
      <div *ngIf="type === 'card'" class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl shimmer-effect"></div>
          <div class="space-y-2 flex-1">
            <div class="h-4 shimmer-effect rounded-lg w-1/3"></div>
            <div class="h-3 shimmer-effect rounded-lg w-1/4"></div>
          </div>
        </div>
        <div class="h-3 shimmer-effect rounded-lg w-full"></div>
        <div class="h-3 shimmer-effect rounded-lg w-4/5"></div>
        <div class="flex gap-2 pt-2">
          <div class="h-6 w-16 shimmer-effect rounded-full"></div>
          <div class="h-6 w-20 shimmer-effect rounded-full"></div>
        </div>
      </div>

      <!-- Table Skeleton -->
      <div *ngIf="type === 'table'" class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
        <div class="p-4 bg-slate-50/80 flex gap-4">
          <div class="h-4 shimmer-effect rounded-lg w-1/4"></div>
          <div class="h-4 shimmer-effect rounded-lg w-1/4"></div>
          <div class="h-4 shimmer-effect rounded-lg w-1/4"></div>
          <div class="h-4 shimmer-effect rounded-lg w-1/4"></div>
        </div>
        <div *ngFor="let row of [1, 2, 3, 4, 5]" class="p-4 flex gap-4">
          <div class="h-4 shimmer-effect rounded-lg w-1/4"></div>
          <div class="h-4 shimmer-effect rounded-lg w-1/4"></div>
          <div class="h-4 shimmer-effect rounded-lg w-1/4"></div>
          <div class="h-4 shimmer-effect rounded-lg w-1/4"></div>
        </div>
      </div>

      <!-- Stats Skeleton -->
      <div *ngIf="type === 'stats'" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div *ngFor="let s of [1, 2, 3, 4]" class="bg-white rounded-2xl p-5 border border-slate-200/80 space-y-3">
          <div class="flex justify-between items-center">
            <div class="h-3 shimmer-effect rounded-lg w-20"></div>
            <div class="w-9 h-9 rounded-xl shimmer-effect"></div>
          </div>
          <div class="h-8 shimmer-effect rounded-xl w-24"></div>
          <div class="h-3 shimmer-effect rounded-lg w-32"></div>
        </div>
      </div>
    </div>
  `
})
export class LoadingSkeletonComponent {
  @Input() type: 'card' | 'table' | 'stats' = 'card';
}
