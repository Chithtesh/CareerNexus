import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResourceService } from '../../core/services/resource.service';
import { AuthService } from '../../core/services/auth.service';
import {
  ResourceFolder,
  ResourceFile,
  StorageType,
  ResourceType,
  RESOURCE_CATEGORIES,
  RESOURCE_TYPES
} from '../../core/models/resource.model';
import { IconComponent } from '../../shared/icons/icon.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

@Component({
  selector: 'app-resource-drive',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      <!-- Page Header with Dynamic Action Buttons -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="relative z-10">
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Placement Knowledge Vault
            </span>
            <span *ngIf="isAdmin()" class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
              <app-icon name="shield-check" [size]="12"></app-icon>
              Admin Mode
            </span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Placement Resource Drive</h1>
          <p class="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Curated placement library spanning 14 interview domains — verified external guides, roadmaps, and official university campus prep files.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5 relative z-10 self-start md:self-auto">
          <!-- Admin Actions -->
          <ng-container *ngIf="isAdmin()">
            <button
              type="button"
              (click)="showNewFolderModal.set(true)"
              class="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
            >
              <app-icon name="folder" [size]="15" customClass="text-amber-400"></app-icon>
              + New Folder
            </button>

            <button
              type="button"
              (click)="openAddModal()"
              class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
            >
              <app-icon name="plus" [size]="16"></app-icon>
              Add Resource
            </button>
          </ng-container>

          <!-- Student Bookmark Quick Filter -->
          <button
            type="button"
            (click)="onlyBookmarked.set(!onlyBookmarked())"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border"
            [ngClass]="onlyBookmarked() ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-bold' : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'"
          >
            <app-icon name="bookmark" [size]="14" [customClass]="onlyBookmarked() ? 'fill-slate-950 text-slate-950' : 'text-amber-400'"></app-icon>
            Saved Bookmarks ({{ resourceService.bookmarkedFiles().length }})
          </button>
        </div>
      </div>

      <!-- 14 CATEGORIES HORIZONTAL FILTER PILLS -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <app-icon name="layers" [size]="14" customClass="text-blue-600"></app-icon>
            Curated Categories ({{ categories.length }})
          </span>
          <button
            *ngIf="selectedCategory() !== 'all'"
            (click)="selectedCategory.set('all')"
            class="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            View All Categories
          </button>
        </div>

        <div class="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-200">
          <button
            type="button"
            (click)="onSelectCategory('all')"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0"
            [ngClass]="selectedCategory() === 'all' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'"
          >
            All Categories
          </button>

          <button
            *ngFor="let cat of categories"
            type="button"
            (click)="onSelectCategory(cat)"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0"
            [ngClass]="selectedCategory() === cat ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- ADVANCED MULTI-FILTER & SEARCH BAR -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <!-- Top Row: Search Input + View Mode + Reset -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <!-- Search input -->
          <div class="relative flex-1">
            <app-icon name="search" [size]="18" customClass="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search by title, subtopic, provider (e.g. LeetCode 150, System Design, Harvard Resume, SQL)..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <!-- View Mode & Reset Controls -->
          <div class="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              *ngIf="activeFilterCount() > 0"
              type="button"
              (click)="resetFilters()"
              class="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 flex items-center gap-1 transition-colors"
            >
              <app-icon name="x" [size]="14"></app-icon>
              Reset Filters ({{ activeFilterCount() }})
            </button>

            <!-- Grid / List Switcher -->
            <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                (click)="viewMode.set('grid')"
                class="p-1.5 rounded-lg transition-colors"
                [ngClass]="viewMode() === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'"
                title="Grid View"
              >
                <app-icon name="grid" [size]="16"></app-icon>
              </button>
              <button
                type="button"
                (click)="viewMode.set('list')"
                class="p-1.5 rounded-lg transition-colors"
                [ngClass]="viewMode() === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'"
                title="List View"
              >
                <app-icon name="list" [size]="16"></app-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Filter Dropdowns Row: Subtopic, Resource Type, Provider, Storage Type -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <!-- Subtopic Dropdown -->
          <div>
            <label class="block text-[11px] font-bold text-slate-500 mb-1">Subtopic</label>
            <select
              [ngModel]="selectedSubtopic()"
              (ngModelChange)="selectedSubtopic.set($event)"
              class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subtopics</option>
              <option *ngFor="let sub of availableSubtopics()" [value]="sub">{{ sub }}</option>
            </select>
          </div>

          <!-- Resource Type Dropdown -->
          <div>
            <label class="block text-[11px] font-bold text-slate-500 mb-1">Resource Type</label>
            <select
              [ngModel]="selectedResourceType()"
              (ngModelChange)="selectedResourceType.set($event)"
              class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option *ngFor="let t of resourceTypes" [value]="t">{{ t }}</option>
            </select>
          </div>

          <!-- Provider Dropdown -->
          <div>
            <label class="block text-[11px] font-bold text-slate-500 mb-1">Provider</label>
            <select
              [ngModel]="selectedProvider()"
              (ngModelChange)="selectedProvider.set($event)"
              class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Providers</option>
              <option *ngFor="let prov of availableProviders()" [value]="prov">{{ prov }}</option>
            </select>
          </div>

          <!-- Storage Type Dropdown -->
          <div>
            <label class="block text-[11px] font-bold text-slate-500 mb-1">Storage Origin</label>
            <select
              [ngModel]="selectedStorageType()"
              (ngModelChange)="selectedStorageType.set($event)"
              class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Origins</option>
              <option value="storage">Internal Files (Supabase)</option>
              <option value="external">Verified External Links</option>
            </select>
          </div>
        </div>

        <!-- Breadcrumb / Active Folder -->
        <div class="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <button
            type="button"
            (click)="selectFolder(null)"
            class="font-medium hover:text-blue-600 flex items-center gap-1"
            [ngClass]="!selectedFolderId() ? 'text-blue-600 font-bold' : ''"
          >
            <app-icon name="folder" [size]="14" customClass="text-amber-500"></app-icon>
            All Resources Root
          </button>

          <ng-container *ngIf="activeFolder()">
            <app-icon name="chevron-right" [size]="12"></app-icon>
            <span class="font-bold text-slate-900">{{ activeFolder()?.name }}</span>
          </ng-container>

          <span class="ml-auto text-slate-400 text-[11px]">
            Showing {{ displayedFiles().length }} resources
          </span>
        </div>
      </div>

      <!-- MAIN RESOURCES SECTION -->
      <div class="space-y-4">
        <!-- Results Summary Bar -->
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold uppercase tracking-wider text-slate-500">
            {{ activeFolder() ? activeFolder()?.name : (selectedCategory() === 'all' ? 'All Learning Materials' : selectedCategory()) }}
            <span class="text-blue-600 font-extrabold">({{ displayedFiles().length }})</span>
          </h2>

          <div *ngIf="selectedFolderId()" class="flex items-center gap-2">
            <button
              type="button"
              (click)="selectFolder(null)"
              class="text-xs font-semibold text-blue-600 hover:underline"
            >
              ← Back to All Vault
            </button>
          </div>
        </div>

        <!-- GRID VIEW -->
        <div
          *ngIf="viewMode() === 'grid' && displayedFiles().length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <div
            *ngFor="let file of displayedFiles()"
            class="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group relative overflow-hidden"
          >
            <!-- Card Header: Type Badge, Storage Badge, Bookmark & Admin Controls -->
            <div>
              <div class="flex items-start justify-between gap-2 mb-3">
                <!-- Icon with Storage Origin Color -->
                <div
                  class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  [ngClass]="file.storageType === 'external' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'"
                >
                  <app-icon
                    [name]="file.storageType === 'external' ? 'external-link' : 'file-text'"
                    [size]="20"
                  ></app-icon>
                </div>

                <!-- Badges & Action Buttons -->
                <div class="flex items-center gap-1">
                  <!-- Bookmark Button -->
                  <button
                    type="button"
                    (click)="resourceService.toggleBookmark(file.id)"
                    class="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg transition-colors"
                    [title]="file.isBookmarked ? 'Remove bookmark' : 'Bookmark this resource'"
                  >
                    <app-icon
                      name="bookmark"
                      [size]="16"
                      [customClass]="file.isBookmarked ? 'fill-amber-500 text-amber-500' : ''"
                    ></app-icon>
                  </button>

                  <!-- Admin Management Controls -->
                  <ng-container *ngIf="isAdmin()">
                    <button
                      type="button"
                      (click)="openEditModal(file)"
                      class="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                      title="Edit resource"
                    >
                      <app-icon name="edit-3" [size]="14"></app-icon>
                    </button>
                    <button
                      type="button"
                      (click)="deleteResource(file)"
                      class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Delete resource"
                    >
                      <app-icon name="trash-2" [size]="14"></app-icon>
                    </button>
                  </ng-container>
                </div>
              </div>

              <!-- Storage & Status Badges -->
              <div class="flex flex-wrap items-center gap-1.5 mb-2">
                <!-- Origin Badge -->
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1"
                  [ngClass]="file.storageType === 'external' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" [ngClass]="file.storageType === 'external' ? 'bg-emerald-500' : 'bg-blue-500'"></span>
                  {{ file.storageType === 'external' ? 'External Link' : 'Supabase Storage' }}
                </span>

                <!-- Type Badge -->
                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                  {{ file.resourceType }}
                </span>

                <!-- Admin Inactive Badge -->
                <span
                  *ngIf="isAdmin() && !file.isActive"
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                >
                  Inactive
                </span>
              </div>

              <!-- Title & Category Info -->
              <h3
                (click)="openDetailModal(file)"
                class="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 line-clamp-2 leading-snug cursor-pointer transition-colors mb-1"
                [title]="file.title"
              >
                {{ file.title }}
              </h3>

              <div class="text-[11px] font-medium text-slate-500 mb-2 flex items-center gap-1.5 truncate">
                <span class="text-blue-600 font-semibold truncate">{{ file.provider }}</span>
                <span>•</span>
                <span class="truncate">{{ file.subtopic || file.category }}</span>
              </div>

              <p class="text-[11px] text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                {{ file.description }}
              </p>
            </div>

            <!-- Card Footer: Metadata & Primary Action Buttons -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <div>
                <span class="text-[11px] font-semibold text-slate-600 block truncate max-w-[110px]">
                  {{ file.sizeFormatted }}
                </span>
                <span class="text-[10px] text-slate-400 block">
                  {{ file.downloadsCount }} accesses
                </span>
              </div>

              <div class="flex items-center gap-1.5">
                <!-- Info / Detail Modal Button -->
                <button
                  type="button"
                  (click)="openDetailModal(file)"
                  class="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  title="View full details"
                >
                  <app-icon name="eye" [size]="15"></app-icon>
                </button>

                <!-- Primary Action Button: Open vs Download -->
                <ng-container *ngIf="file.storageType === 'external'">
                  <button
                    type="button"
                    (click)="resourceService.openResource(file)"
                    class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 transition-colors shadow-xs"
                    title="Open external study resource"
                  >
                    <span>Open</span>
                    <app-icon name="external-link" [size]="13"></app-icon>
                  </button>
                </ng-container>

                <ng-container *ngIf="file.storageType === 'storage'">
                  <button
                    type="button"
                    (click)="resourceService.downloadFile(file)"
                    class="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 transition-colors shadow-xs"
                    title="Download file from Supabase storage"
                  >
                    <span>Download</span>
                    <app-icon name="download" [size]="13"></app-icon>
                  </button>
                </ng-container>
              </div>
            </div>
          </div>
        </div>

        <!-- LIST VIEW -->
        <div
          *ngIf="viewMode() === 'list' && displayedFiles().length > 0"
          class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th class="py-3.5 px-4">Title & Details</th>
                  <th class="py-3.5 px-4">Category / Subtopic</th>
                  <th class="py-3.5 px-4">Provider</th>
                  <th class="py-3.5 px-4">Origin / Type</th>
                  <th class="py-3.5 px-4">Size</th>
                  <th *ngIf="isAdmin()" class="py-3.5 px-4">Status</th>
                  <th class="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let file of displayedFiles()" class="hover:bg-blue-50/20 transition-colors">
                  <!-- Title & Details -->
                  <td class="py-3 px-4 font-semibold text-slate-900">
                    <div class="flex items-center gap-2.5">
                      <div
                        class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        [ngClass]="file.storageType === 'external' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'"
                      >
                        <app-icon
                          [name]="file.storageType === 'external' ? 'external-link' : 'file-text'"
                          [size]="16"
                        ></app-icon>
                      </div>
                      <div class="max-w-xs sm:max-w-sm truncate">
                        <span
                          (click)="openDetailModal(file)"
                          class="cursor-pointer hover:text-blue-600 block truncate"
                        >
                          {{ file.title }}
                        </span>
                        <span class="text-[10px] font-normal text-slate-400 block truncate">
                          {{ file.description }}
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- Category & Subtopic -->
                  <td class="py-3 px-4">
                    <span class="font-medium text-slate-800 block truncate max-w-[160px]">{{ file.category }}</span>
                    <span class="text-[10px] text-slate-500 block truncate max-w-[160px]">{{ file.subtopic }}</span>
                  </td>

                  <!-- Provider -->
                  <td class="py-3 px-4 text-slate-600 font-medium">
                    {{ file.provider }}
                  </td>

                  <!-- Origin / Type -->
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-1.5">
                      <span
                        class="px-2 py-0.5 rounded text-[10px] font-semibold"
                        [ngClass]="file.storageType === 'external' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'"
                      >
                        {{ file.storageType === 'external' ? 'External' : 'Storage' }}
                      </span>
                      <span class="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                        {{ file.resourceType }}
                      </span>
                    </div>
                  </td>

                  <!-- Size -->
                  <td class="py-3 px-4 text-slate-600">
                    {{ file.sizeFormatted }}
                  </td>

                  <!-- Admin Status Toggle -->
                  <td *ngIf="isAdmin()" class="py-3 px-4">
                    <button
                      type="button"
                      (click)="resourceService.toggleResourceActive(file.id, !file.isActive)"
                      class="px-2 py-0.5 rounded text-[10px] font-bold transition-colors"
                      [ngClass]="file.isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'"
                    >
                      {{ file.isActive ? 'Active' : 'Inactive' }}
                    </button>
                  </td>

                  <!-- Actions -->
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <!-- Bookmark -->
                      <button
                        type="button"
                        (click)="resourceService.toggleBookmark(file.id)"
                        class="p-1.5 text-slate-400 hover:text-amber-500 transition-colors"
                        title="Bookmark"
                      >
                        <app-icon
                          name="bookmark"
                          [size]="15"
                          [customClass]="file.isBookmarked ? 'fill-amber-500 text-amber-500' : ''"
                        ></app-icon>
                      </button>

                      <!-- Detail Modal -->
                      <button
                        type="button"
                        (click)="openDetailModal(file)"
                        class="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Details"
                      >
                        <app-icon name="eye" [size]="15"></app-icon>
                      </button>

                      <!-- Open or Download -->
                      <ng-container *ngIf="file.storageType === 'external'">
                        <button
                          type="button"
                          (click)="resourceService.openResource(file)"
                          class="p-1.5 text-emerald-600 hover:text-emerald-800 transition-colors"
                          title="Open external link"
                        >
                          <app-icon name="external-link" [size]="15"></app-icon>
                        </button>
                      </ng-container>

                      <ng-container *ngIf="file.storageType === 'storage'">
                        <button
                          type="button"
                          (click)="resourceService.downloadFile(file)"
                          class="p-1.5 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Download storage file"
                        >
                          <app-icon name="download" [size]="15"></app-icon>
                        </button>
                      </ng-container>

                      <!-- Admin Edit / Delete -->
                      <ng-container *ngIf="isAdmin()">
                        <button
                          type="button"
                          (click)="openEditModal(file)"
                          class="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <app-icon name="edit-3" [size]="15"></app-icon>
                        </button>
                        <button
                          type="button"
                          (click)="deleteResource(file)"
                          class="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <app-icon name="trash-2" [size]="15"></app-icon>
                        </button>
                      </ng-container>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <app-empty-state
          *ngIf="displayedFiles().length === 0"
          title="No Learning Resources Found"
          description="We couldn't find study materials matching your search terms or active filters. Try clearing your filters or explore other categories."
          actionLabel="Reset All Filters"
          (action)="resetFilters()"
        ></app-empty-state>
      </div>
    </div>

    <!-- RESOURCE DETAILS MODAL -->
    <div
      *ngIf="showDetailModal() && selectedDetailFile()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
        <!-- Modal Header -->
        <div class="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div
              class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              [ngClass]="selectedDetailFile()?.storageType === 'external' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'"
            >
              <app-icon
                [name]="selectedDetailFile()?.storageType === 'external' ? 'external-link' : 'file-text'"
                [size]="22"
              ></app-icon>
            </div>
            <div>
              <span
                class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                [ngClass]="selectedDetailFile()?.storageType === 'external' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'"
              >
                {{ selectedDetailFile()?.storageType === 'external' ? 'External Study Resource' : 'Internal Supabase File' }}
              </span>
              <h3 class="text-base font-extrabold text-slate-900 leading-snug mt-1">
                {{ selectedDetailFile()?.title }}
              </h3>
            </div>
          </div>

          <button (click)="showDetailModal.set(false)" class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <!-- Metadata Grid -->
        <div class="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <span class="text-slate-400 font-semibold block text-[10px] uppercase">Category</span>
            <span class="font-bold text-slate-800">{{ selectedDetailFile()?.category }}</span>
          </div>
          <div>
            <span class="text-slate-400 font-semibold block text-[10px] uppercase">Subtopic</span>
            <span class="font-bold text-slate-800">{{ selectedDetailFile()?.subtopic || 'General' }}</span>
          </div>
          <div>
            <span class="text-slate-400 font-semibold block text-[10px] uppercase">Provider / Source</span>
            <span class="font-bold text-blue-600">{{ selectedDetailFile()?.provider }}</span>
          </div>
          <div>
            <span class="text-slate-400 font-semibold block text-[10px] uppercase">Resource Type</span>
            <span class="font-bold text-slate-800">{{ selectedDetailFile()?.resourceType }}</span>
          </div>
          <div>
            <span class="text-slate-400 font-semibold block text-[10px] uppercase">Size / Format</span>
            <span class="font-medium text-slate-700">{{ selectedDetailFile()?.sizeFormatted }}</span>
          </div>
          <div>
            <span class="text-slate-400 font-semibold block text-[10px] uppercase">Total Accesses</span>
            <span class="font-medium text-slate-700">{{ selectedDetailFile()?.downloadsCount }} views</span>
          </div>
        </div>

        <!-- Description -->
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Description</h4>
          <p class="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
            {{ selectedDetailFile()?.description || 'No detailed description provided.' }}
          </p>
        </div>

        <!-- External Link Display -->
        <div *ngIf="selectedDetailFile()?.externalUrl" class="text-xs">
          <span class="text-slate-400 font-semibold block text-[10px] uppercase mb-1">Verified Destination URL</span>
          <a
            [href]="selectedDetailFile()?.externalUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 hover:underline break-all block p-2 bg-blue-50/50 rounded-lg border border-blue-100"
          >
            {{ selectedDetailFile()?.externalUrl }}
          </a>
        </div>

        <!-- Modal Actions -->
        <div class="pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
          <button
            type="button"
            (click)="selectedDetailFile() && resourceService.toggleBookmark(selectedDetailFile()!.id)"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors"
            [ngClass]="selectedDetailFile()?.isBookmarked ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'"
          >
            <app-icon
              name="bookmark"
              [size]="14"
              [customClass]="selectedDetailFile()?.isBookmarked ? 'fill-amber-500 text-amber-500' : ''"
            ></app-icon>
            {{ selectedDetailFile()?.isBookmarked ? 'Bookmarked' : 'Add to Bookmarks' }}
          </button>

          <div class="flex items-center gap-2">
            <button
              (click)="showDetailModal.set(false)"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Close
            </button>

            <ng-container *ngIf="selectedDetailFile()?.storageType === 'external'">
              <button
                (click)="selectedDetailFile() && resourceService.openResource(selectedDetailFile()!)"
                class="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs"
              >
                <span>Visit Resource</span>
                <app-icon name="external-link" [size]="14"></app-icon>
              </button>
            </ng-container>

            <ng-container *ngIf="selectedDetailFile()?.storageType === 'storage'">
              <button
                (click)="selectedDetailFile() && resourceService.downloadFile(selectedDetailFile()!)"
                class="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs"
              >
                <span>Download File</span>
                <app-icon name="download" [size]="14"></app-icon>
              </button>
            </ng-container>
          </div>
        </div>
      </div>
    </div>

    <!-- ADMIN: ADD RESOURCE MODAL -->
    <div
      *ngIf="showAddModal()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-base font-bold text-slate-900">Add New Placement Resource</h3>
            <p class="text-xs text-slate-500">Publish verified study materials to the placement repository.</p>
          </div>
          <button (click)="showAddModal.set(false)" class="p-1.5 text-slate-400 hover:text-slate-600">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <!-- Storage Type Switcher Tabs -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Resource Origin</label>
          <div class="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              (click)="addFormStorageType.set('external')"
              class="py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
              [ngClass]="addFormStorageType() === 'external' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            >
              <app-icon name="external-link" [size]="14"></app-icon>
              Verified External URL
            </button>
            <button
              type="button"
              (click)="addFormStorageType.set('storage')"
              class="py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
              [ngClass]="addFormStorageType() === 'storage' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            >
              <app-icon name="upload" [size]="14"></app-icon>
              Upload to Supabase Storage
            </button>
          </div>
        </div>

        <div class="space-y-3 text-xs">
          <!-- Title -->
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Resource Title *</label>
            <input
              type="text"
              [(ngModel)]="addTitle"
              placeholder="e.g. LeetCode 75 Curated Study Plan"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Category (14 Categories) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Domain Category *</label>
              <select
                [(ngModel)]="addCategory"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Subtopic</label>
              <input
                type="text"
                [(ngModel)]="addSubtopic"
                placeholder="e.g. Arrays, SQL 50, Microservices"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Resource Type</label>
              <select
                [(ngModel)]="addResourceType"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option *ngFor="let t of resourceTypes" [value]="t">{{ t }}</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Provider / Author</label>
              <input
                type="text"
                [(ngModel)]="addProvider"
                placeholder="e.g. LeetCode, Harvard MCS, NPTEL"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <!-- External URL Input (if External) -->
          <div *ngIf="addFormStorageType() === 'external'">
            <label class="block font-semibold text-slate-700 mb-1">Verified External URL *</label>
            <input
              type="url"
              [(ngModel)]="addExternalUrl"
              placeholder="https://leetcode.com/studyplan/..."
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <span class="text-[10px] text-slate-500 mt-0.5 block">
              Ensure URL starts with https://. Verified external links open in a new secure tab.
            </span>
          </div>

          <!-- File Picker (if Storage) -->
          <div *ngIf="addFormStorageType() === 'storage'">
            <label class="block font-semibold text-slate-700 mb-1">Choose File to Upload *</label>
            <input
              type="file"
              (change)="onFileSelected($event)"
              accept=".pdf,.doc,.docx,.zip,.pptx,.xlsx,.csv"
              class="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            <div class="mt-2 p-2.5 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-900 text-[11px] flex items-center gap-2">
              <app-icon name="shield-check" [size]="16" customClass="text-blue-600 shrink-0"></app-icon>
              <span>Files are securely stored in the Supabase <strong>resources</strong> bucket.</span>
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              [(ngModel)]="addDescription"
              placeholder="Summary of topics covered, target audience, difficulty level..."
              rows="3"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            ></textarea>
          </div>

          <!-- Active Toggle -->
          <div class="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="addIsActive"
              [(ngModel)]="addIsActive"
              class="rounded text-blue-600 focus:ring-blue-500"
            />
            <label for="addIsActive" class="text-xs font-semibold text-slate-700 cursor-pointer">
              Publish immediately (visible to all students)
            </label>
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button (click)="showAddModal.set(false)" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            (click)="saveNewResource()"
            [disabled]="isSaving()"
            class="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            <span *ngIf="isSaving()" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>{{ isSaving() ? 'Publishing...' : 'Publish Resource' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ADMIN: EDIT RESOURCE MODAL -->
    <div
      *ngIf="showEditModal() && editingFile()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-base font-bold text-slate-900">Edit Resource Details</h3>
            <p class="text-xs text-slate-500">Update metadata or modify active visibility.</p>
          </div>
          <button (click)="showEditModal.set(false)" class="p-1.5 text-slate-400 hover:text-slate-600">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Resource Title</label>
            <input
              type="text"
              [(ngModel)]="editTitle"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Domain Category</label>
              <select
                [(ngModel)]="editCategory"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Subtopic</label>
              <input
                type="text"
                [(ngModel)]="editSubtopic"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Resource Type</label>
              <select
                [(ngModel)]="editResourceType"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option *ngFor="let t of resourceTypes" [value]="t">{{ t }}</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Provider</label>
              <input
                type="text"
                [(ngModel)]="editProvider"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div *ngIf="editingFile()?.storageType === 'external'">
            <label class="block font-semibold text-slate-700 mb-1">External URL</label>
            <input
              type="url"
              [(ngModel)]="editExternalUrl"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div *ngIf="editingFile()?.storageType === 'storage'">
            <label class="block font-semibold text-slate-700 mb-1">Replace Storage File (Optional)</label>
            <input
              type="file"
              (change)="onReplaceFileSelected($event)"
              accept=".pdf,.doc,.docx,.zip,.pptx,.xlsx,.csv"
              class="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <span *ngIf="replaceFile" class="text-xs text-emerald-600 font-semibold block mt-1">
              New file selected: {{ replaceFile.name }}
            </span>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              [(ngModel)]="editDescription"
              rows="3"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            ></textarea>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editIsActive"
              [(ngModel)]="editIsActive"
              class="rounded text-blue-600 focus:ring-blue-500"
            />
            <label for="editIsActive" class="text-xs font-semibold text-slate-700 cursor-pointer">
              Active (Visible in student learning drive)
            </label>
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button (click)="showEditModal.set(false)" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            (click)="saveEdit()"
            [disabled]="isSaving()"
            class="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            <span *ngIf="isSaving()" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>{{ isSaving() ? 'Saving...' : 'Save Changes' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- CREATE FOLDER MODAL -->
    <div
      *ngIf="showNewFolderModal()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-base font-bold text-slate-900">Create Resource Folder</h3>
          <button (click)="showNewFolderModal.set(false)" class="p-1 text-slate-400 hover:text-slate-600">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Folder Name</label>
            <input
              type="text"
              [(ngModel)]="newFolderName"
              placeholder="e.g. Amazon Interview Prep Kits"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Domain Category</label>
            <select
              [(ngModel)]="newFolderCat"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
            >
              <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
            </select>
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button (click)="showNewFolderModal.set(false)" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button (click)="createFolder()" class="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
            Create Folder
          </button>
        </div>
      </div>
    </div>
  `
})
export class ResourceDriveComponent {
  resourceService = inject(ResourceService);
  authService = inject(AuthService);

  readonly categories = RESOURCE_CATEGORIES;
  readonly resourceTypes = RESOURCE_TYPES;

  // Filter & Search Signals
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');
  selectedSubtopic = signal<string>('all');
  selectedResourceType = signal<string>('all');
  selectedProvider = signal<string>('all');
  selectedStorageType = signal<string>('all'); // 'all' | 'storage' | 'external'
  onlyBookmarked = signal<boolean>(false);
  selectedFolderId = signal<string | null>(null);
  viewMode = signal<'grid' | 'list'>('grid');

  // Role detection
  isAdmin = computed(() => {
    return this.authService.isAdmin() || this.authService.currentUser()?.role === 'admin';
  });

  // Modal States
  showNewFolderModal = signal<boolean>(false);
  showAddModal = signal<boolean>(false);
  showEditModal = signal<boolean>(false);
  showDetailModal = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  // Detail Modal State
  selectedDetailFile = signal<ResourceFile | null>(null);

  // Add Resource Form State
  addFormStorageType = signal<StorageType>('external');
  addTitle = '';
  addCategory = RESOURCE_CATEGORIES[0];
  addSubtopic = '';
  addResourceType: ResourceType = 'Tutorial';
  addProvider = '';
  addExternalUrl = '';
  addDescription = '';
  addIsActive = true;
  selectedUploadFile: File | null = null;

  // Edit Resource Form State
  editingFile = signal<ResourceFile | null>(null);
  editTitle = '';
  editCategory = '';
  editSubtopic = '';
  editResourceType: ResourceType = 'Tutorial';
  editProvider = '';
  editExternalUrl = '';
  editDescription = '';
  editIsActive = true;
  replaceFile: File | null = null;

  // New Folder Form State
  newFolderName = '';
  newFolderCat = RESOURCE_CATEGORIES[0];

  // Dynamically computed subtopics based on current category
  availableSubtopics = computed(() => {
    const files = this.resourceService.files();
    const cat = this.selectedCategory();
    const set = new Set<string>();

    files.forEach(f => {
      if (f.subtopic && (cat === 'all' || f.category.toLowerCase() === cat.toLowerCase())) {
        set.add(f.subtopic);
      }
    });

    return Array.from(set).sort();
  });

  // Dynamically computed providers
  availableProviders = computed(() => {
    const files = this.resourceService.files();
    const set = new Set<string>();
    files.forEach(f => {
      if (f.provider) set.add(f.provider);
    });
    return Array.from(set).sort();
  });

  activeFolder = computed(() => {
    const id = this.selectedFolderId();
    const folders = this.resourceService.folders();
    return id ? folders.find((f: ResourceFolder) => f.id === id) || null : null;
  });

  // Count active filters
  activeFilterCount = computed(() => {
    let count = 0;
    if (this.searchQuery().trim()) count++;
    if (this.selectedCategory() !== 'all') count++;
    if (this.selectedSubtopic() !== 'all') count++;
    if (this.selectedResourceType() !== 'all') count++;
    if (this.selectedProvider() !== 'all') count++;
    if (this.selectedStorageType() !== 'all') count++;
    if (this.onlyBookmarked()) count++;
    if (this.selectedFolderId()) count++;
    return count;
  });

  // Multi-Filter Computed Pipeline
  displayedFiles = computed(() => {
    let list: ResourceFile[] = this.resourceService.files();
    const admin = this.isAdmin();
    const folderId = this.selectedFolderId();
    const cat = this.selectedCategory();
    const sub = this.selectedSubtopic();
    const rType = this.selectedResourceType();
    const prov = this.selectedProvider();
    const sType = this.selectedStorageType();
    const q = this.searchQuery().toLowerCase().trim();
    const bookmarkedOnly = this.onlyBookmarked();

    // 1. Student access control: students only see active items
    if (!admin) {
      list = list.filter(f => f.isActive !== false);
    }

    // 2. Folder filter
    if (folderId) {
      list = list.filter(f => f.folderId === folderId);
    }

    // 3. Category filter
    if (cat !== 'all') {
      list = list.filter(f => f.category.toLowerCase() === cat.toLowerCase());
    }

    // 4. Subtopic filter
    if (sub !== 'all') {
      list = list.filter(f => f.subtopic?.toLowerCase() === sub.toLowerCase());
    }

    // 5. Resource Type filter
    if (rType !== 'all') {
      list = list.filter(f => f.resourceType === rType);
    }

    // 6. Provider filter
    if (prov !== 'all') {
      list = list.filter(f => f.provider === prov);
    }

    // 7. Storage Origin filter
    if (sType !== 'all') {
      list = list.filter(f => f.storageType === sType);
    }

    // 8. Bookmarks filter
    if (bookmarkedOnly) {
      list = list.filter(f => f.isBookmarked);
    }

    // 9. Multi-field search
    if (q) {
      list = list.filter(f =>
        (f.title ? f.title.toLowerCase().includes(q) : false) ||
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        (f.subtopic && f.subtopic.toLowerCase().includes(q)) ||
        (f.provider && f.provider.toLowerCase().includes(q)) ||
        (f.description && f.description.toLowerCase().includes(q))
      );
    }

    return list;
  });

  onSelectCategory(cat: string) {
    this.selectedCategory.set(cat);
    this.selectedSubtopic.set('all'); // reset subtopic when category changes
  }

  selectFolder(folderId: string | null) {
    this.selectedFolderId.set(folderId);
    this.resourceService.setCurrentFolder(folderId);
  }

  resetFilters() {
    this.searchQuery.set('');
    this.selectedCategory.set('all');
    this.selectedSubtopic.set('all');
    this.selectedResourceType.set('all');
    this.selectedProvider.set('all');
    this.selectedStorageType.set('all');
    this.onlyBookmarked.set(false);
    this.selectedFolderId.set(null);
  }

  openDetailModal(file: ResourceFile) {
    this.selectedDetailFile.set(file);
    this.showDetailModal.set(true);
  }

  openAddModal() {
    this.addTitle = '';
    this.addCategory = this.selectedCategory() !== 'all' ? (this.selectedCategory() as any) : RESOURCE_CATEGORIES[0];
    this.addSubtopic = '';
    this.addResourceType = 'Tutorial';
    this.addProvider = '';
    this.addExternalUrl = '';
    this.addDescription = '';
    this.addIsActive = true;
    this.selectedUploadFile = null;
    this.addFormStorageType.set('external');
    this.showAddModal.set(true);
  }

  onFileSelected(event: any) {
    const file = event.target?.files?.[0];
    if (file) {
      this.selectedUploadFile = file;
      if (!this.addTitle) {
        this.addTitle = file.name.replace(/\.[^/.]+$/, '');
      }
    }
  }

  onReplaceFileSelected(event: any) {
    const file = event.target?.files?.[0];
    if (file) {
      this.replaceFile = file;
    }
  }

  async saveNewResource() {
    if (!this.addTitle.trim()) return;

    if (this.addFormStorageType() === 'external' && !this.addExternalUrl.trim()) {
      alert('Please enter a valid external resource URL.');
      return;
    }

    if (this.addFormStorageType() === 'storage' && !this.selectedUploadFile) {
      alert('Please select a file to upload to storage.');
      return;
    }

    this.isSaving.set(true);
    try {
      await this.resourceService.createResource({
        title: this.addTitle.trim(),
        category: this.addCategory,
        subtopic: this.addSubtopic.trim() || undefined,
        resourceType: this.addResourceType,
        provider: this.addProvider.trim() || undefined,
        storageType: this.addFormStorageType(),
        externalUrl: this.addFormStorageType() === 'external' ? this.addExternalUrl.trim() : undefined,
        description: this.addDescription.trim() || undefined,
        fileObj: this.selectedUploadFile || undefined,
        isActive: this.addIsActive,
        folderId: this.selectedFolderId() || undefined
      });

      this.showAddModal.set(false);
    } finally {
      this.isSaving.set(false);
    }
  }

  openEditModal(file: ResourceFile) {
    this.editingFile.set(file);
    this.editTitle = file.title || file.name;
    this.editCategory = file.category;
    this.editSubtopic = file.subtopic || '';
    this.editResourceType = file.resourceType || 'Tutorial';
    this.editProvider = file.provider || '';
    this.editExternalUrl = file.externalUrl || file.fileUrl || '';
    this.editDescription = file.description || '';
    this.editIsActive = file.isActive ?? true;
    this.replaceFile = null;
    this.showEditModal.set(true);
  }

  async saveEdit() {
    const f = this.editingFile();
    if (!f || !this.editTitle.trim()) return;

    this.isSaving.set(true);
    try {
      await this.resourceService.updateResource(
        f.id,
        {
          title: this.editTitle.trim(),
          name: this.editTitle.trim(),
          category: this.editCategory,
          subtopic: this.editSubtopic.trim(),
          resourceType: this.editResourceType,
          provider: this.editProvider.trim(),
          externalUrl: f.storageType === 'external' ? this.editExternalUrl.trim() : undefined,
          description: this.editDescription.trim(),
          isActive: this.editIsActive
        },
        this.replaceFile || undefined
      );

      this.showEditModal.set(false);
      this.editingFile.set(null);
    } finally {
      this.isSaving.set(false);
    }
  }

  deleteResource(file: ResourceFile) {
    if (confirm(`Are you sure you want to permanently delete "${file.title || file.name}"?`)) {
      this.resourceService.deleteResource(file.id);
    }
  }

  createFolder() {
    if (!this.newFolderName.trim()) return;
    this.resourceService.createFolder(this.newFolderName.trim(), this.newFolderCat);
    this.newFolderName = '';
    this.showNewFolderModal.set(false);
  }
}
