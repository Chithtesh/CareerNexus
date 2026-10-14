import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyService } from '../../../core/services/company.service';
import { Company } from '../../../core/models/company.model';
import { IconComponent } from '../../../shared/icons/icon.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';

@Component({
  selector: 'app-admin-companies',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, BadgeComponent],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Recruiter Partnerships</h1>
          <p class="text-sm text-slate-500 mt-1">
            Manage recruiting organizations, tier rankings, and campus MOU records.
          </p>
        </div>

        <button
          type="button"
          (click)="showAddCompanyModal.set(true)"
          class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 self-start sm:self-auto transition-all hover:scale-[1.02]"
        >
          <app-icon name="plus" [size]="16"></app-icon>
          + Add Recruiter Partner
        </button>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <app-icon name="search" [size]="18" customClass="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search by company name, industry domain, location, or website..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div class="w-full sm:w-56">
            <select
              [ngModel]="tierFilter()"
              (ngModelChange)="tierFilter.set($event)"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tiers ({{ companyService.companies().length }})</option>
              <option value="Super Dream">Super Dream (Tier 1)</option>
              <option value="Dream">Dream (Tier 2)</option>
              <option value="Core">Core / Standard</option>
            </select>
          </div>

          <button
            *ngIf="searchQuery() || tierFilter() !== 'all'"
            type="button"
            (click)="resetFilters()"
            class="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shrink-0"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <!-- Companies Table -->
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th class="py-3.5 px-6">Company</th>
                <th class="py-3.5 px-6">Tier Category</th>
                <th class="py-3.5 px-6">Industry Domain</th>
                <th class="py-3.5 px-6">Locations</th>
                <th class="py-3.5 px-6">Avg Package</th>
                <th class="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let comp of filteredCompanies()" class="hover:bg-slate-50/50 transition-colors">
                <td class="py-4 px-6">
                  <div class="flex items-center gap-3">
                    <img [src]="comp.logo" class="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                    <div>
                      <h4 class="text-xs font-bold text-slate-900">{{ comp.name }}</h4>
                      <a [href]="comp.website" target="_blank" class="text-[11px] text-blue-600 hover:underline flex items-center gap-1">
                        {{ comp.website }}
                        <app-icon name="external-link" [size]="10"></app-icon>
                      </a>
                    </div>
                  </div>
                </td>

                <td class="py-4 px-6">
                  <app-badge
                    [variant]="
                      comp.tier.includes('Super Dream') ? 'purple' :
                      comp.tier.includes('Dream') ? 'primary' : 'neutral'
                    "
                  >
                    {{ comp.tier }}
                  </app-badge>
                </td>

                <td class="py-4 px-6 text-slate-700 font-medium">{{ comp.industry }}</td>
                <td class="py-4 px-6 text-slate-500">{{ comp.location }}</td>
                <td class="py-4 px-6 font-bold text-emerald-700">{{ comp.averagePackage || '₹24 LPA' }}</td>

                <td class="py-4 px-6 text-right">
                  <button
                    type="button"
                    (click)="companyService.deleteCompany(comp.id)"
                    class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remove company"
                  >
                    <app-icon name="trash-2" [size]="16"></app-icon>
                  </button>
                </td>
              </tr>

              <tr *ngIf="filteredCompanies().length === 0">
                <td colspan="6" class="py-12 text-center text-slate-500">
                  <p class="text-sm font-semibold text-slate-700">No partner companies match your criteria</p>
                  <p class="text-xs text-slate-400 mt-1">Try refining your keyword query or tier category filter.</p>
                  <button
                    *ngIf="searchQuery() || tierFilter() !== 'all'"
                    type="button"
                    (click)="resetFilters()"
                    class="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100"
                  >
                    Clear Filters
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add Recruiter Partner Modal -->
    <div
      *ngIf="showAddCompanyModal()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
    >
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-lg font-bold text-slate-900">Add Recruiting Partner</h3>
          <button (click)="showAddCompanyModal.set(false)" class="p-1 text-slate-400 hover:text-slate-600">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700">Company Name</label>
            <input [(ngModel)]="newName" placeholder="e.g. Oracle / Snowflake" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700">Tier</label>
              <select [(ngModel)]="newTier" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm bg-white">
                <option value="Super Dream (Tier 1)">Super Dream (Tier 1)</option>
                <option value="Dream (Tier 2)">Dream (Tier 2)</option>
                <option value="Core / Standard">Core / Standard</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700">Average Package</label>
              <input [(ngModel)]="newAvgPackage" placeholder="e.g. ₹28 LPA" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700">Industry / Domain</label>
            <input [(ngModel)]="newIndustry" placeholder="e.g. Enterprise Cloud & Databases" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700">Headquarters / Office Locations</label>
            <input [(ngModel)]="newLocation" placeholder="e.g. Bengaluru, Hyderabad" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700">Career Portal Website</label>
            <input [(ngModel)]="newWebsite" placeholder="https://careers..." class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button (click)="showAddCompanyModal.set(false)" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button (click)="saveCompany()" class="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
            Save Partner
          </button>
        </div>
      </div>
    </div>
  `
})
export class AdminCompaniesComponent {
  companyService = inject(CompanyService);

  searchQuery = signal('');
  tierFilter = signal('all');
  showAddCompanyModal = signal(false);

  filteredCompanies = computed(() => {
    let list = this.companyService.companies();
    const q = this.searchQuery().toLowerCase().trim();
    const t = this.tierFilter();

    if (t !== 'all') {
      list = list.filter(c => c.tier.toLowerCase().includes(t.toLowerCase()));
    }

    if (q) {
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        (c.website && c.website.toLowerCase().includes(q))
      );
    }

    return list;
  });

  resetFilters() {
    this.searchQuery.set('');
    this.tierFilter.set('all');
  }

  newName = '';
  newTier: 'Super Dream (Tier 1)' | 'Dream (Tier 2)' | 'Core / Standard' = 'Super Dream (Tier 1)';
  newAvgPackage = '₹28 LPA';
  newIndustry = 'Technology & Cloud';
  newLocation = 'Bengaluru';
  newWebsite = 'https://careers.google.com';

  saveCompany() {
    if (!this.newName.trim()) return;
    this.companyService.addCompany({
      name: this.newName,
      tier: this.newTier,
      industry: this.newIndustry,
      location: this.newLocation,
      website: this.newWebsite,
      averagePackage: this.newAvgPackage,
      logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&auto=format&fit=crop&q=80',
      description: 'Premier technology partner recruiting graduating engineering talent.'
    });

    this.newName = '';
    this.showAddCompanyModal.set(false);
  }
}
