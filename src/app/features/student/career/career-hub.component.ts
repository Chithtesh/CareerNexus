import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CareerService } from '../../../core/services/career.service';
import { StudentService } from '../../../core/services/student.service';
import { JobService } from '../../../core/services/job.service';
import { ApplicationService } from '../../../core/services/application.service';
import { InterviewQuestion } from '../../../core/models/mock-interview.model';
import { IconComponent } from '../../../shared/icons/icon.component';

type CareerTab = 'roadmap' | 'recommendations' | 'resume' | 'mock_interview';

@Component({
  selector: 'app-career-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300 pb-12">
      <!-- Top Title & Navigation -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Career Acceleration & Placement Hub</span>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              AI & Rules Grounded
            </span>
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Personalized learning roadmaps, career matching recommendations, ATS resume analyzer, and company-specific mock interviews.
          </p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs custom-scrollbar">
        <button
          type="button"
          (click)="activeTab.set('roadmap')"
          class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all"
          [ngClass]="activeTab() === 'roadmap' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <app-icon name="map" [size]="15"></app-icon>
          <span>Learning Roadmap</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('recommendations')"
          class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all"
          [ngClass]="activeTab() === 'recommendations' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <app-icon name="sparkles" [size]="15"></app-icon>
          <span>Career Recommendations</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('resume')"
          class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all"
          [ngClass]="activeTab() === 'resume' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <app-icon name="file-text" [size]="15"></app-icon>
          <span>ATS Resume Analyzer</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('mock_interview')"
          class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all"
          [ngClass]="activeTab() === 'mock_interview' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <app-icon name="video" [size]="15"></app-icon>
          <span>Mock Interview Prep</span>
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 1: PERSONALIZED LEARNING ROADMAP -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab() === 'roadmap'" class="space-y-6">
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-indigo-600">Tailored Curriculum</span>
              <h3 class="text-lg font-bold text-slate-900 mt-0.5">Your Milestone Placement Roadmap</h3>
              <p class="text-xs text-slate-500 mt-0.5">Synthesized from your verified skill gaps, applied drives, and target roles.</p>
            </div>
            <div class="text-right self-start sm:self-auto">
              <span class="text-[10px] uppercase font-bold text-slate-400">Target Role</span>
              <div class="text-xs font-bold text-slate-800">{{ roadmap().targetRole }}</div>
            </div>
          </div>

          <!-- Phased Roadmap Timeline -->
          <div class="space-y-6">
            <div
              *ngFor="let phase of roadmap().phases"
              class="p-5 rounded-2xl border transition-all space-y-4"
              [ngClass]="phase.status === 'Completed' ? 'bg-emerald-50/40 border-emerald-200' : phase.status === 'In Progress' ? 'bg-indigo-50/40 border-indigo-200' : 'bg-slate-50/50 border-slate-200'"
            >
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-[11px] font-bold uppercase tracking-wider text-indigo-700">{{ phase.focusArea }}</span>
                  <h4 class="text-sm font-bold text-slate-900 mt-0.5">{{ phase.title }}</h4>
                </div>
                <span
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold"
                  [ngClass]="phase.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : phase.status === 'In Progress' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'"
                >
                  {{ phase.status }}
                </span>
              </div>

              <!-- Milestones inside phase -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div *ngFor="let m of phase.milestones" class="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div class="flex items-start justify-between gap-2">
                    <h5 class="text-xs font-bold text-slate-900 leading-snug">{{ m.title }}</h5>
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">{{ m.estimatedHours }}h</span>
                  </div>
                  <p class="text-[11px] text-slate-500 leading-relaxed">{{ m.description }}</p>
                  <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span class="text-indigo-600 font-semibold">Target: {{ m.skillTarget }}</span>
                    <a *ngIf="m.resourceLinks && m.resourceLinks.length > 0" [href]="m.resourceLinks[0].url" target="_blank" class="text-blue-600 hover:underline font-semibold flex items-center gap-1">
                      Resource <app-icon name="external-link" [size]="11"></app-icon>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 2: CAREER RECOMMENDATIONS ENGINE -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab() === 'recommendations'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            *ngFor="let rec of recommendations()"
            class="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div class="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span class="text-xs font-bold text-slate-500 uppercase">{{ rec.companyName }}</span>
                  <h3 class="text-base font-bold text-slate-900 mt-0.5">{{ rec.roleTitle }}</h3>
                </div>
                <div class="text-right shrink-0">
                  <span class="px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
                    {{ rec.skillMatchPercentage }}% Match
                  </span>
                </div>
              </div>

              <div class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block mb-3">
                Compensation: {{ rec.averageSalary }}
              </div>

              <!-- Matching Skills -->
              <div class="space-y-1.5 text-xs mb-3">
                <span class="text-[11px] font-bold uppercase text-slate-400 block">Matching Competencies ({{ rec.matchedSkills.length }}):</span>
                <div class="flex flex-wrap gap-1">
                  <span *ngFor="let sk of rec.matchedSkills" class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-[11px]">
                    ✓ {{ sk }}
                  </span>
                </div>
              </div>

              <!-- Missing Skills / Gaps -->
              <div *ngIf="rec.missingSkills.length > 0" class="space-y-1.5 text-xs">
                <span class="text-[11px] font-bold uppercase text-rose-500 block">Recommended Focus Areas:</span>
                <div class="flex flex-wrap gap-1">
                  <span *ngFor="let sk of rec.missingSkills" class="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200 text-[11px]">
                    ⚡ {{ sk }}
                  </span>
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span class="font-bold text-slate-700">{{ rec.eligibilityStatus }}</span>
              <a [routerLink]="['/student/jobs']" class="text-blue-600 font-bold hover:underline">
                View Open Drives →
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 3: ATS RESUME ANALYZER -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab() === 'resume'" class="space-y-6">
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-emerald-600">ATS Parsing Engine</span>
              <h3 class="text-lg font-bold text-slate-900 mt-0.5">Automated Resume & Profile Analysis</h3>
              <p class="text-xs text-slate-500">Evaluated against verified criteria of target company: <strong>{{ resumeReport().targetCompany }}</strong></p>
            </div>

            <!-- Big Score Badge -->
            <div class="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900 text-white self-start sm:self-auto">
              <div class="text-2xl font-black text-emerald-400">{{ resumeReport().scores.overallScore }}%</div>
              <div class="text-left">
                <div class="text-[10px] uppercase font-bold text-slate-400">ATS Match Score</div>
                <div class="text-xs font-semibold text-slate-200">Tier-1 Screening Ready</div>
              </div>
            </div>
          </div>

          <!-- 4 Breakdown Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div class="text-xs text-slate-500 font-semibold">ATS Formatting</div>
              <div class="text-xl font-black text-slate-900 mt-1">{{ resumeReport().scores.atsReadinessScore }}%</div>
            </div>
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div class="text-xs text-slate-500 font-semibold">Skills Completeness</div>
              <div class="text-xl font-black text-slate-900 mt-1">{{ resumeReport().scores.skillsCompleteness }}%</div>
            </div>
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div class="text-xs text-slate-500 font-semibold">Project Evidence</div>
              <div class="text-xl font-black text-slate-900 mt-1">{{ resumeReport().scores.projectEvidenceScore }}%</div>
            </div>
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div class="text-xs text-slate-500 font-semibold">Contact & Links</div>
              <div class="text-xl font-black text-slate-900 mt-1">{{ resumeReport().scores.structureAndContactScore }}%</div>
            </div>
          </div>

          <!-- Gaps & Recommendations -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Actionable Improvement Recommendations</h4>
            <div class="space-y-3">
              <div *ngFor="let gap of resumeReport().gaps" class="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <app-icon name="alert-circle" [size]="14" customClass="text-rose-600"></app-icon>
                    {{ gap.title }}
                  </span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-rose-700 border border-rose-300">{{ gap.severity }}</span>
                </div>
                <p class="text-xs text-rose-800">{{ gap.description }}</p>
                <div class="text-xs font-semibold text-rose-900 pt-1">
                  💡 <strong>Action:</strong> {{ gap.actionableStep }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 4: MOCK INTERVIEW PREPARATION -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab() === 'mock_interview'" class="space-y-6">
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-purple-600">Interactive Simulation</span>
              <h3 class="text-lg font-bold text-slate-900 mt-0.5">Google / Tier-1 Mock Interview Practice</h3>
              <p class="text-xs text-slate-500">Rehearse structured responses for Technical, System Design, HR, and Leadership rounds.</p>
            </div>
          </div>

          <!-- Questions Practice Cards -->
          <div class="space-y-6">
            <div
              *ngFor="let q of mockSessionQuestions(); let idx = index"
              class="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4"
            >
              <div>
                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    {{ q.category }} Round
                  </span>
                  <span class="text-[11px] text-slate-400">Rec. time: {{ q.recommendedDurationSeconds }}s</span>
                </div>
                <h4 class="text-sm font-bold text-slate-900 leading-relaxed">
                  <span class="text-purple-600 font-extrabold mr-1">Q{{ idx + 1 }}.</span> {{ q.question }}
                </h4>
              </div>

              <!-- Structured evaluation tips banner -->
              <div class="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 space-y-1">
                <span class="font-bold text-slate-800 block">💡 Recruiter Tip:</span>
                <p>{{ q.tips }}</p>
                <div class="pt-1 flex flex-wrap gap-1 text-[11px]">
                  <span *ngFor="let p of q.sampleStrongPoints" class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                    ✓ {{ p }}
                  </span>
                </div>
              </div>

              <!-- Answer Draft Box -->
              <div class="space-y-2 text-xs">
                <label class="block font-semibold text-slate-700">Your Response Draft & STAR Key Points:</label>
                <textarea
                  [(ngModel)]="mockUserAnswers[q.id]"
                  rows="3"
                  placeholder="Draft your key situation, task, action, and quantified outcome points here..."
                  class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                ></textarea>

                <div class="flex items-center justify-between pt-1">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-slate-600 text-[11px]">Self Confidence:</span>
                    <select [(ngModel)]="mockUserConfidence[q.id]" class="px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white">
                      <option [value]="5">5 - Excellent & Ready</option>
                      <option [value]="4">4 - Confident</option>
                      <option [value]="3">3 - Needs Polish</option>
                      <option [value]="2">2 - Weak Area</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    (click)="recordAnswer(q)"
                    class="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    Save Response & Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CareerHubComponent {
  careerService = inject(CareerService);
  studentService = inject(StudentService);
  jobService = inject(JobService);
  applicationService = inject(ApplicationService);

  activeTab = signal<CareerTab>('roadmap');

  student = this.studentService.currentStudent;

  roadmap = computed(() => {
    return this.careerService.getPersonalizedRoadmap(
      this.student(),
      this.applicationService.studentApplications(),
      this.jobService.jobs()
    );
  });

  recommendations = computed(() => {
    return this.careerService.getCareerRecommendations(
      this.student(),
      this.jobService.jobs()
    );
  });

  resumeReport = computed(() => {
    return this.careerService.analyzeResume(this.student());
  });

  mockSessionQuestions = computed(() => {
    const session = this.careerService.generateMockInterview(this.student());
    return [
      {
        id: 'q-t1',
        category: 'Technical' as const,
        question: 'Explain the difference between indexing using B-Trees vs Hash Tables in PostgreSQL and when you would use each.',
        recommendedDurationSeconds: 180,
        evaluationCriteria: ['Understands B-Tree range scans', 'Hash index O(1) equality limits'],
        tips: 'Mention range queries vs point lookups and disk page I/O alignment.',
        sampleStrongPoints: ['B-Trees support range comparisons (<, <=, BETWEEN)', 'Hash indexes require exact equality']
      },
      {
        id: 'q-t2',
        category: 'Technical' as const,
        question: 'How do you design an idempotent payment processing API to handle network retries without double charging?',
        recommendedDurationSeconds: 180,
        evaluationCriteria: ['Idempotency keys', 'Atomic locking'],
        tips: 'Explain idempotency keys, database unique constraints, atomic transactions, and distributed locks.',
        sampleStrongPoints: ['Atomic check-and-insert with UUID idempotency token', 'Two-phase commit or saga pattern']
      },
      {
        id: 'q-hr1',
        category: 'HR' as const,
        question: 'Why do you want to join our engineering team over other tech companies, and where do you see yourself contributing most in your first 90 days?',
        recommendedDurationSeconds: 120,
        evaluationCriteria: ['Culture fit', 'Goal clarity'],
        tips: 'Show alignment with engineering culture and eagerness to ship reliable code.',
        sampleStrongPoints: ['First 30 days: Onboarding & reading codebase', '60-90 days: Owning independent feature sprints']
      },
      {
        id: 'q-p1',
        category: 'Project-based' as const,
        question: 'Walk me through the most technically challenging project on your profile. What was the bottleneck and how did you diagnose it?',
        recommendedDurationSeconds: 180,
        evaluationCriteria: ['Architecture clarity', 'Profiling metrics'],
        tips: 'Highlight technical architecture, profiling tools used, and measured metrics achieved.',
        sampleStrongPoints: ['Identified N+1 database queries using profiler', 'Reduced latency from 850ms to 45ms using Redis caching']
      }
    ];
  });

  mockUserAnswers: { [id: string]: string } = {};
  mockUserConfidence: { [id: string]: number } = {
    'q-t1': 5,
    'q-t2': 4,
    'q-hr1': 4,
    'q-p1': 5
  };

  async recordAnswer(q: any) {
    const text = this.mockUserAnswers[q.id] || 'Key concepts covered and practiced.';
    const conf = Number(this.mockUserConfidence[q.id] || 4);
    await this.careerService.recordInterviewAnswer('mock-1', q, text, conf);
  }
}
