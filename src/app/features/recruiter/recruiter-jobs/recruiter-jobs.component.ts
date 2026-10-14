import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecruiterService } from '../../../core/services/recruiter.service';
import { JobService } from '../../../core/services/job.service';
import { IconComponent } from '../../../shared/icons/icon.component';

@Component({
  selector: 'app-recruiter-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300 pb-12">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Manage Job Openings & Placement Drives</h1>
          <p class="text-sm text-slate-500 mt-1">Create and configure job descriptions, mandatory skill criteria, CGPA cutoffs, and compensation packages.</p>
        </div>
        <button
          type="button"
          (click)="showCreateModal.set(true)"
          class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <app-icon name="plus" [size]="16"></app-icon>
          + Post New Job Opening
        </button>
      </div>

      <!-- Job List -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          *ngFor="let job of recruiterService.recruiterJobs()"
          class="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
        >
          <div>
            <div class="flex items-start justify-between gap-3 mb-2">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-blue-600">{{ job.domain }}</span>
                <h3 class="text-base font-bold text-slate-900 mt-0.5">{{ job.title }}</h3>
              </div>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">{{ job.status }}</span>
            </div>

            <p class="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-3">{{ job.description }}</p>

            <div class="grid grid-cols-2 gap-2 text-xs py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100 mb-3">
              <div>
                <span class="text-slate-400">Compensation:</span>
                <div class="font-bold text-slate-900">{{ job.salary }}</div>
              </div>
              <div>
                <span class="text-slate-400">Cutoff CGPA:</span>
                <div class="font-bold text-slate-900">{{ job.minimumCgpa }} / 10.0</div>
              </div>
            </div>

            <div>
              <span class="text-[11px] font-bold uppercase text-slate-400 block mb-1.5">Required Skills:</span>
              <div class="flex flex-wrap gap-1.5">
                <span *ngFor="let sk of job.requiredSkills" class="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/50">
                  {{ sk }}
                </span>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Deadline: <strong class="text-slate-700">{{ job.applicationDeadline | date:'mediumDate' }}</strong></span>
            <span class="font-semibold text-slate-600">{{ job.vacancies }} Vacancies</span>
          </div>
        </div>
      </div>

      <!-- Create Job Modal -->
      <div *ngIf="showCreateModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 custom-scrollbar">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900">Post New Campus Drive Opening</h3>
            <button (click)="showCreateModal.set(false)" class="p-1 text-slate-400 hover:text-slate-600">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <form (submit)="saveJob($event)" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700">Job Title *</label>
              <input type="text" [(ngModel)]="jobForm.title" name="jTitle" required placeholder="e.g. Associate Software Engineer - Cloud" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700">Job Description & Responsibilities *</label>
              <textarea [(ngModel)]="jobForm.description" name="jDesc" required rows="3" placeholder="Outline candidate responsibilities, team structure, and project scope..." class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 text-sm"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Technical Domain</label>
                <select [(ngModel)]="jobForm.domain" name="jDomain" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 bg-white">
                  <option value="Software Development">Software Development</option>
                  <option value="Cloud Computing">Cloud Computing</option>
                  <option value="AI / Machine Learning">AI / Machine Learning</option>
                  <option value="Data Science">Data Science</option>
                  <option value="FinTech">FinTech</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Location</label>
                <input type="text" [(ngModel)]="jobForm.location" name="jLoc" placeholder="Bengaluru / Hyderabad" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block font-semibold text-slate-700">Compensation (CTC) *</label>
                <input type="text" [(ngModel)]="jobForm.salary" name="jSal" required placeholder="e.g. ₹28 - ₹34 LPA" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 font-bold" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Min CGPA Cutoff</label>
                <input type="number" step="0.1" [(ngModel)]="jobForm.minimumCgpa" name="jCgpa" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 font-bold" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700">Vacancies</label>
                <input type="number" [(ngModel)]="jobForm.vacancies" name="jVac" required class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
              </div>
            </div>
            <div>
              <label class="block font-semibold text-slate-700">Required Skills & Technologies (Comma separated) *</label>
              <input type="text" [(ngModel)]="jobSkillsRaw" name="jSkills" required placeholder="Java, Data Structures, Spring Boot, PostgreSQL, Docker" class="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200" />
            </div>

            <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" (click)="showCreateModal.set(false)" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs">Publish Drive</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class RecruiterJobsComponent {
  recruiterService = inject(RecruiterService);

  showCreateModal = signal(false);

  jobForm = {
    title: '',
    description: '',
    domain: 'Software Development',
    location: 'Bengaluru / Hyderabad',
    salary: '₹30 - ₹38 LPA',
    minimumCgpa: 8.0,
    vacancies: 5,
    employmentType: 'Full Time' as const,
    applicationDeadline: new Date(Date.now() + 14 * 86400000).toISOString()
  };

  jobSkillsRaw = 'Java, Data Structures, SQL, Docker, Microservices';

  async saveJob(e: Event) {
    e.preventDefault();
    const skills = this.jobSkillsRaw.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
    await this.recruiterService.createRecruiterJob({
      ...this.jobForm,
      requiredSkills: skills.length > 0 ? skills : ['Java', 'SQL', 'Data Structures']
    });
    this.showCreateModal.set(false);
  }
}
