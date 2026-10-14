import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CompanyService } from '../../../core/services/company.service';
import { IconComponent } from '../../../shared/icons/icon.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IconComponent,
    BadgeComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Recruiting Partners & Companies</h1>
          <p class="text-sm text-slate-500 mt-1">
            20+ premier Tier-1 product organizations, unicorns, and global technology innovators hiring from our campus.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
            {{ companyService.companies().length }} Verified Partners
          </span>
        </div>
      </div>

      <!-- Search & Tier Filter Bar -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Search input -->
          <div class="relative flex-1">
            <app-icon name="search" [size]="18" customClass="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search companies by name, domain, industry (e.g. Google, Microsoft, FinTech)..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <!-- Tier Filter -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <button
              *ngFor="let tier of tiers"
              type="button"
              (click)="selectedTier = tier"
              class="px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
              [ngClass]="{
                'bg-blue-600 text-white shadow-xs': selectedTier === tier,
                'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900': selectedTier !== tier
              }"
            >
              {{ tier }}
            </button>
          </div>
        </div>
      </div>

      <!-- Companies Grid -->
      <div *ngIf="filteredCompanies().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          *ngFor="let comp of filteredCompanies()"
          class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-blue-200 transition-all duration-200 flex flex-col justify-between group"
        >
          <div>
            <!-- Header: Logo, Name, Tier -->
            <div class="flex items-start justify-between gap-3 mb-4">
              <div class="flex items-center gap-3">
                <img
                  [src]="comp.logo"
                  [alt]="comp.name"
                  (error)="onLogoError($event, comp.name)"
                  class="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                />
                <div>
                  <h3 class="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {{ comp.name }}
                  </h3>
                  <span class="text-xs text-slate-500 font-medium">{{ comp.industry }}</span>
                </div>
              </div>
            </div>

            <div class="mb-4">
              <app-badge
                [variant]="
                  comp.tier.includes('Super Dream') ? 'purple' :
                  comp.tier.includes('Dream') ? 'primary' : 'neutral'
                "
              >
                {{ comp.tier }}
              </app-badge>
            </div>

            <!-- Description -->
            <p class="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
              {{ comp.description }}
            </p>

            <!-- Location & Stats -->
            <div class="space-y-1.5 text-xs text-slate-500 py-3 border-y border-slate-100 mb-4">
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-1">
                  <app-icon name="map-pin" [size]="12"></app-icon>
                  Offices:
                </span>
                <span class="font-medium text-slate-700">{{ comp.location }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Avg Package:</span>
                <span class="font-bold text-emerald-700">{{ comp.averagePackage || '₹24 LPA' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Students Placed:</span>
                <span class="font-semibold text-slate-800">{{ comp.placedStudentsCount || 10 }}+</span>
              </div>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="flex items-center gap-2 pt-2">
            <a
              routerLink="/student/jobs"
              class="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-semibold text-xs text-center transition-colors"
            >
              View Drives ({{ comp.activeJobsCount || 2 }})
            </a>
            <a
              [href]="comp.website"
              target="_blank"
              class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Official Career Portal"
            >
              <app-icon name="external-link" [size]="16"></app-icon>
            </a>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="filteredCompanies().length === 0"
        title="No Companies Found"
        description="No recruiting partners match your current search query or tier filter."
        actionLabel="Reset Filters"
        (action)="resetFilters()"
      ></app-empty-state>
    </div>
  `
})
export class CompanyListComponent {
  companyService = inject(CompanyService);

  searchQuery = '';
  selectedTier = 'All';

  readonly tiers = ['All', 'Super Dream (Tier 1)', 'Dream (Tier 2)', 'Core / Standard'];

  filteredCompanies = computed(() => {
    let list = this.companyService.companies();
    const q = this.searchQuery.toLowerCase().trim();
    const tier = this.selectedTier;

    if (q) {
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)
      );
    }

    if (tier !== 'All') {
      list = list.filter(c => c.tier.toLowerCase() === tier.toLowerCase());
    }

    return list;
  });

  resetFilters() {
    this.searchQuery = '';
    this.selectedTier = 'All';
  }

  onLogoError(event: Event, companyName?: string) {
    const target = event.target as HTMLImageElement;
    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName || 'Company')}&background=475569&color=fff&bold=true`;
  }
}
