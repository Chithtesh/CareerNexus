import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../../core/services/student.service';
import { Student } from '../../../core/models/student.model';
import { IconComponent } from '../../../shared/icons/icon.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';

@Component({
  selector: 'app-admin-students',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    BadgeComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Master Student Directory</h1>
          <p class="text-sm text-slate-500 mt-1">
            Database of 100+ registered final-year engineering students with verified academic records and resumes.
          </p>
        </div>

        <button
          type="button"
          (click)="exportStudentsToCsv()"
          class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-xs flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <app-icon name="download" [size]="16"></app-icon>
          Export CSV Roster
        </button>
      </div>

      <!-- Search & Multi-factor Filters -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- Search input -->
          <div class="relative lg:col-span-2">
            <app-icon name="search" [size]="18" customClass="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search by name, roll no (23CS101), skills, email..."
              class="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <!-- Branch Filter -->
          <div>
            <select
              [(ngModel)]="selectedDepartment"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              <option value="Computer Science & Engineering">CSE</option>
              <option value="Information Technology">IT</option>
              <option value="Artificial Intelligence & Data Science">AI & DS</option>
              <option value="Electronics & Communication">ECE</option>
              <option value="Electrical & Electronics">EEE</option>
              <option value="Mechanical Engineering">MECH</option>
            </select>
          </div>

          <!-- Placement Status Filter -->
          <div>
            <select
              [(ngModel)]="selectedStatus"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Placement Statuses</option>
              <option value="Selected">Selected / Placed</option>
              <option value="In Progress">In Progress</option>
              <option value="Not Placed">Not Placed</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Students Table -->
      <div *ngIf="filteredStudents().length > 0" class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th class="py-3.5 px-4 sm:px-6">Student Roster</th>
                <th class="py-3.5 px-4 sm:px-6">Branch & Roll</th>
                <th class="py-3.5 px-4 sm:px-6">CGPA</th>
                <th class="py-3.5 px-4 sm:px-6">Primary Domain & Skills</th>
                <th class="py-3.5 px-4 sm:px-6">Placement Status</th>
                <th class="py-3.5 px-4 sm:px-6 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let s of filteredStudents().slice(0, 30)" class="hover:bg-slate-50/50 transition-colors">
                <!-- Name & Avatar -->
                <td class="py-3.5 px-4 sm:px-6">
                  <div class="flex items-center gap-3">
                    <img [src]="s.profilePhoto" class="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0" />
                    <div>
                      <h4 class="text-xs font-bold text-slate-900">{{ s.fullName }}</h4>
                      <span class="text-[11px] text-slate-400 font-mono">{{ s.email }}</span>
                    </div>
                  </div>
                </td>

                <!-- Branch & Roll -->
                <td class="py-3.5 px-4 sm:px-6">
                  <span class="font-semibold text-slate-800">{{ s.rollNumber }}</span>
                  <p class="text-[11px] text-slate-500">{{ s.department }}</p>
                </td>

                <!-- CGPA -->
                <td class="py-3.5 px-4 sm:px-6">
                  <span
                    class="font-bold px-2 py-0.5 rounded-md text-xs"
                    [ngClass]="s.cgpa >= 8.5 ? 'bg-emerald-50 text-emerald-700' : s.cgpa >= 7.0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'"
                  >
                    {{ s.cgpa }}
                  </span>
                </td>

                <!-- Domain & Skills -->
                <td class="py-3.5 px-4 sm:px-6">
                  <span class="font-medium text-slate-800">{{ s.preferredDomain }}</span>
                  <div class="flex gap-1 mt-0.5">
                    <span *ngFor="let sk of s.skills.slice(0, 2)" class="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                      {{ sk }}
                    </span>
                  </div>
                </td>

                <!-- Placement Status -->
                <td class="py-3.5 px-4 sm:px-6">
                  <app-badge
                    [variant]="s.placementStatus === 'Selected' ? 'success' : s.placementStatus === 'In Progress' ? 'warning' : 'neutral'"
                    [dot]="true"
                  >
                    {{ s.placementStatus }}
                  </app-badge>
                  <span *ngIf="s.placedCompany" class="block text-[10px] font-semibold text-emerald-800 mt-0.5">
                    {{ s.placedCompany }} ({{ s.placedPackage }})
                  </span>
                </td>

                <!-- Action button -->
                <td class="py-3.5 px-4 sm:px-6 text-right">
                  <button
                    type="button"
                    (click)="selectedStudentForView.set(s)"
                    class="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                    title="View Full Profile"
                  >
                    <app-icon name="eye" [size]="16"></app-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="filteredStudents().length > 30" class="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
          Showing 30 of {{ filteredStudents().length }} students. Refine search criteria for targeted lists.
        </div>
      </div>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="filteredStudents().length === 0"
        title="No Students Match Filter"
        description="No student records match your active search query, department, or CGPA filter."
        actionLabel="Clear Filters"
        (action)="resetFilters()"
      ></app-empty-state>
    </div>

    <!-- Student Detail Modal Drawer -->
    <div
      *ngIf="selectedStudentForView()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
    >
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <img [src]="selectedStudentForView()?.profilePhoto" class="w-12 h-12 rounded-2xl object-cover border border-slate-200" />
            <div>
              <h3 class="text-base font-bold text-slate-900">{{ selectedStudentForView()?.fullName }}</h3>
              <p class="text-xs text-slate-500">{{ selectedStudentForView()?.department }} • Roll: {{ selectedStudentForView()?.rollNumber }}</p>
            </div>
          </div>
          <button (click)="selectedStudentForView.set(null)" class="p-1 text-slate-400 hover:text-slate-600">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <div class="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl text-center text-xs">
          <div>
            <span class="text-slate-400 text-[10px] uppercase font-semibold block">CGPA</span>
            <span class="text-sm font-bold text-slate-900">{{ selectedStudentForView()?.cgpa }}</span>
          </div>
          <div>
            <span class="text-slate-400 text-[10px] uppercase font-semibold block">10th Score</span>
            <span class="text-sm font-bold text-slate-900">{{ selectedStudentForView()?.tenthPercentage }}%</span>
          </div>
          <div>
            <span class="text-slate-400 text-[10px] uppercase font-semibold block">12th Score</span>
            <span class="text-sm font-bold text-slate-900">{{ selectedStudentForView()?.twelfthPercentage }}%</span>
          </div>
        </div>

        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Technical Skills</h4>
          <div class="flex flex-wrap gap-1.5">
            <span
              *ngFor="let skill of selectedStudentForView()?.skills"
              class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100"
            >
              {{ skill }}
            </span>
          </div>
        </div>

        <div *ngIf="selectedStudentForView()?.bio">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Bio Summary</h4>
          <p class="text-xs text-slate-600 leading-relaxed">{{ selectedStudentForView()?.bio }}</p>
        </div>

        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button (click)="selectedStudentForView.set(null)" class="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800">
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  `
})
export class AdminStudentsComponent {
  studentService = inject(StudentService);

  searchQuery = '';
  selectedDepartment = 'all';
  selectedStatus = 'all';

  selectedStudentForView = signal<Student | null>(null);

  filteredStudents = computed(() => {
    let list = this.studentService.students();
    const q = this.searchQuery.toLowerCase().trim();
    const dept = this.selectedDepartment;
    const status = this.selectedStatus;

    if (q) {
      list = list.filter(s =>
        s.fullName.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.skills.some(sk => sk.toLowerCase().includes(q))
      );
    }

    if (dept !== 'all') {
      list = list.filter(s => s.department.toLowerCase() === dept.toLowerCase());
    }

    if (status !== 'all') {
      list = list.filter(s => s.placementStatus.toLowerCase() === status.toLowerCase());
    }

    return list;
  });

  exportStudentsToCsv() {
    const list = this.filteredStudents();
    const headers = ['Roll Number', 'Full Name', 'Department', 'CGPA', '10th %', '12th %', 'Placement Status', 'Placed Company', 'Package', 'Email', 'Skills'];
    const rows = list.map(s => [
      s.rollNumber,
      `"${s.fullName}"`,
      `"${s.department}"`,
      s.cgpa,
      s.tenthPercentage,
      s.twelfthPercentage,
      s.placementStatus,
      s.placedCompany || 'N/A',
      s.placedPackage || 'N/A',
      s.email,
      `"${s.skills.join(', ')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CareerNexus_Student_Roster_2026_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedDepartment = 'all';
    this.selectedStatus = 'all';
  }
}
