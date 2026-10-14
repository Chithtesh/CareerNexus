import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssessmentService } from '../../../core/services/assessment.service';
import { StudentService } from '../../../core/services/student.service';
import { Assessment, CodingProblem, AssessmentQuestion, AssessmentAttempt } from '../../../core/models/assessment.model';
import { IconComponent } from '../../../shared/icons/icon.component';

@Component({
  selector: 'app-assessment-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300 pb-12">
      <!-- Top Title Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Mock Assessments & Coding Sandbox</span>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Preparation Engine
            </span>
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Practice timed aptitude tests, core technical evaluations, and hands-on algorithmic coding challenges designed for campus placements.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="activeView.set('browse')"
            class="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            [ngClass]="activeView() === 'browse' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'"
          >
            Available Tests
          </button>
          <button
            type="button"
            (click)="activeView.set('history')"
            class="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            [ngClass]="activeView() === 'history' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'"
          >
            Attempt History ({{ studentAttempts().length }})
          </button>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- VIEW 1: BROWSE ASSESSMENTS -->
      <!-- ========================================================================= -->
      <div *ngIf="activeView() === 'browse' && !activeQuiz && !activeCodingProblem" class="space-y-6">
        <!-- Category Filter Pills -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            type="button"
            (click)="selectedCategory.set('all')"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
            [ngClass]="selectedCategory() === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'"
          >
            All Categories
          </button>
          <button
            type="button"
            (click)="selectedCategory.set('Aptitude')"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
            [ngClass]="selectedCategory() === 'Aptitude' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'"
          >
            Aptitude & Math
          </button>
          <button
            type="button"
            (click)="selectedCategory.set('Coding')"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
            [ngClass]="selectedCategory() === 'Coding' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'"
          >
            Algorithmic Coding
          </button>
          <button
            type="button"
            (click)="selectedCategory.set('Technical')"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
            [ngClass]="selectedCategory() === 'Technical' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'"
          >
            Core CS & System Design
          </button>
        </div>

        <!-- Assessment Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            *ngFor="let a of filteredAssessments()"
            class="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div class="flex items-start justify-between gap-3 mb-2">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                  {{ a.category }}
                </span>
                <span class="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <app-icon name="clock" [size]="13"></app-icon>
                  {{ a.durationMinutes }} mins
                </span>
              </div>

              <h3 class="text-base font-bold text-slate-900 leading-snug">{{ a.title }}</h3>
              <p class="text-xs text-slate-600 leading-relaxed mt-1.5">{{ a.description }}</p>

              <div class="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span>Total Marks: <strong class="text-slate-900">{{ a.totalMarks }}</strong></span>
                <span>Passing: <strong class="text-slate-900">{{ a.passingMarks }}</strong></span>
                <span *ngIf="a.questions">{{ a.questions.length }} Questions</span>
                <span *ngIf="a.codingProblems">{{ a.codingProblems.length }} Coding Challenges</span>
              </div>
            </div>

            <div class="pt-2">
              <button
                *ngIf="a.questions && a.questions.length > 0"
                type="button"
                (click)="startQuiz(a)"
                class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <app-icon name="play" [size]="14"></app-icon>
                Start Assessment Quiz
              </button>

              <button
                *ngIf="a.codingProblems && a.codingProblems.length > 0"
                type="button"
                (click)="startCoding(a.codingProblems[0], a)"
                class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <app-icon name="code" [size]="14"></app-icon>
                Open Coding Playground
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- VIEW 2: INTERACTIVE QUIZ ENGINE -->
      <!-- ========================================================================= -->
      <div *ngIf="activeQuiz" class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-blue-600">{{ activeQuiz.category }} Benchmark</span>
            <h2 class="text-xl font-bold text-slate-900 mt-0.5">{{ activeQuiz.title }}</h2>
          </div>

          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5">
              <app-icon name="clock" [size]="14" customClass="text-amber-600"></app-icon>
              Timer: {{ formatTimer(quizTimeSeconds) }}
            </span>
            <button
              type="button"
              (click)="cancelQuiz()"
              class="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              Exit
            </button>
          </div>
        </div>

        <!-- Questions List -->
        <div class="space-y-6">
          <div
            *ngFor="let q of activeQuiz.questions; let idx = index"
            class="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3"
          >
            <div class="flex items-start justify-between gap-3">
              <h4 class="text-sm font-bold text-slate-900 leading-relaxed">
                <span class="text-blue-600 font-extrabold mr-1">Q{{ idx + 1 }}.</span> {{ q.question }}
              </h4>
              <span *ngIf="q.topic" class="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shrink-0">
                {{ q.topic }}
              </span>
            </div>

            <!-- Options Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <label
                *ngFor="let opt of q.options; let optIdx = index"
                class="p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer text-xs"
                [ngClass]="quizAnswers[q.id] === optIdx ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-100/70 text-slate-700'"
              >
                <input
                  type="radio"
                  [name]="'question_' + q.id"
                  [value]="optIdx"
                  [(ngModel)]="quizAnswers[q.id]"
                  class="text-blue-600"
                />
                <span>{{ opt }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            (click)="cancelQuiz()"
            class="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel Assessment
          </button>
          <button
            type="button"
            (click)="submitQuiz()"
            class="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all"
          >
            Submit & Record Score
          </button>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- VIEW 3: INTERACTIVE CODING SANDBOX -->
      <!-- ========================================================================= -->
      <div *ngIf="activeCodingProblem" class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-indigo-600">Algorithmic Challenge</span>
              <span
                class="px-2 py-0.5 rounded text-[10px] font-bold"
                [ngClass]="activeCodingProblem.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
              >
                {{ activeCodingProblem.difficulty }}
              </span>
            </div>
            <h2 class="text-xl font-bold text-slate-900 mt-0.5">{{ activeCodingProblem.title }}</h2>
          </div>

          <button
            type="button"
            (click)="activeCodingProblem = null"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 self-start sm:self-auto"
          >
            Close Sandbox
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Problem Description & Test Cases -->
          <div class="space-y-4 text-xs">
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 leading-relaxed text-slate-700">
              {{ activeCodingProblem.description }}
            </div>

            <div>
              <h4 class="font-bold text-slate-800 uppercase text-[11px] mb-2">Sample Test Cases:</h4>
              <div class="space-y-2">
                <div *ngFor="let tc of activeCodingProblem.sampleTestCases; let idx = index" class="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px]">
                  <div><span class="text-slate-400">Input:</span> {{ tc.input }}</div>
                  <div><span class="text-emerald-400">Expected:</span> {{ tc.expectedOutput }}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 class="font-bold text-slate-800 uppercase text-[11px] mb-1">Constraints:</h4>
              <ul class="list-disc pl-4 space-y-1 text-slate-600">
                <li *ngFor="let c of activeCodingProblem.constraints">{{ c }}</li>
              </ul>
            </div>
          </div>

          <!-- Code Editor & Execution Console -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-700">Language: JavaScript / Node.js</span>
              <button
                type="button"
                (click)="runCode()"
                [disabled]="isRunningCode"
                class="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span *ngIf="isRunningCode" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{{ isRunningCode ? 'Compiling...' : 'Run Test Cases' }}</span>
              </button>
            </div>

            <textarea
              [(ngModel)]="codingSubmissionCode"
              rows="12"
              class="w-full p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>

            <!-- Execution Logs Output -->
            <div *ngIf="codeExecutionLog" class="p-3.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs border border-slate-800">
              <div class="text-[10px] uppercase font-bold text-slate-400 mb-1">Execution Output:</div>
              <pre class="whitespace-pre-wrap">{{ codeExecutionLog }}</pre>
            </div>

            <div class="pt-2 flex justify-end">
              <button
                type="button"
                (click)="submitCodeSolution()"
                class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                Submit Solution
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- VIEW 4: ATTEMPT HISTORY -->
      <!-- ========================================================================= -->
      <div *ngIf="activeView() === 'history'" class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <h3 class="text-lg font-bold text-slate-900">Your Assessment Attempt History</h3>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px] tracking-wider bg-slate-50/50">
                <th class="py-3 px-4">Assessment Title</th>
                <th class="py-3 px-4">Category</th>
                <th class="py-3 px-4">Score Obtained</th>
                <th class="py-3 px-4">Result</th>
                <th class="py-3 px-4">Attempt Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let att of studentAttempts()" class="hover:bg-slate-50/70 transition-colors">
                <td class="py-3.5 px-4 font-bold text-slate-900">{{ att.assessmentTitle }}</td>
                <td class="py-3.5 px-4"><span class="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">{{ att.category }}</span></td>
                <td class="py-3.5 px-4 font-extrabold text-blue-700">{{ att.score }} / {{ att.maxScore }} ({{ att.percentage }}%)</td>
                <td class="py-3.5 px-4">
                  <span class="px-2.5 py-0.5 rounded-full font-extrabold text-[10px]" [ngClass]="att.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'">
                    {{ att.passed ? 'PASSED' : 'RETAKE' }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-slate-500">{{ att.completedAt | date:'medium' }}</td>
              </tr>
              <tr *ngIf="studentAttempts().length === 0">
                <td colspan="5" class="py-8 text-center text-slate-400 italic">No assessment attempts recorded yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AssessmentHubComponent {
  assessmentService = inject(AssessmentService);
  studentService = inject(StudentService);

  activeView = signal<'browse' | 'history'>('browse');
  selectedCategory = signal<string>('all');

  activeQuiz: Assessment | null = null;
  quizAnswers: { [questionId: string]: number } = {};
  quizTimeSeconds = 0;
  quizTimerInterval: any = null;

  activeCodingProblem: CodingProblem | null = null;
  activeCodingAssessment: Assessment | null = null;
  codingSubmissionCode = '';
  isRunningCode = false;
  codeExecutionLog = '';

  studentAttempts = computed(() => {
    const s = this.studentService.currentStudent();
    return this.assessmentService.getStudentAttempts(s.id || s.userId);
  });

  filteredAssessments = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'all') return this.assessmentService.assessments();
    return this.assessmentService.assessments().filter(a => a.category === cat);
  });

  startQuiz(assessment: Assessment) {
    this.activeQuiz = assessment;
    this.quizAnswers = {};
    this.quizTimeSeconds = assessment.durationMinutes * 60;
    if (this.quizTimerInterval) clearInterval(this.quizTimerInterval);
    this.quizTimerInterval = setInterval(() => {
      if (this.quizTimeSeconds > 0) this.quizTimeSeconds--;
    }, 1000);
  }

  cancelQuiz() {
    if (this.quizTimerInterval) clearInterval(this.quizTimerInterval);
    this.activeQuiz = null;
  }

  async submitQuiz() {
    if (!this.activeQuiz) return;
    if (this.quizTimerInterval) clearInterval(this.quizTimerInterval);
    const s = this.studentService.currentStudent();
    await this.assessmentService.submitQuizAttempt(
      this.activeQuiz.id,
      s.id || s.userId,
      this.quizAnswers,
      (this.activeQuiz.durationMinutes * 60) - this.quizTimeSeconds
    );
    this.activeQuiz = null;
    this.activeView.set('history');
  }

  startCoding(problem: CodingProblem, assessment: Assessment) {
    this.activeCodingProblem = problem;
    this.activeCodingAssessment = assessment;
    this.codingSubmissionCode = problem.starterCode.javascript || '';
    this.codeExecutionLog = '';
  }

  async runCode() {
    if (!this.activeCodingProblem) return;
    this.isRunningCode = true;
    try {
      const result = await this.assessmentService.runCodingTests(
        this.activeCodingProblem.id,
        this.codingSubmissionCode,
        'javascript'
      );
      this.codeExecutionLog = result.logs;
    } finally {
      this.isRunningCode = false;
    }
  }

  async submitCodeSolution() {
    if (!this.activeCodingProblem || !this.activeCodingAssessment) return;
    const s = this.studentService.currentStudent();
    await this.assessmentService.submitCodingAssessment(
      this.activeCodingAssessment.id,
      s.id || s.userId,
      [{ problemId: this.activeCodingProblem.id, code: this.codingSubmissionCode, language: 'javascript' }],
      1200
    );
    this.activeCodingProblem = null;
    this.activeCodingAssessment = null;
    this.activeView.set('history');
  }

  formatTimer(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
