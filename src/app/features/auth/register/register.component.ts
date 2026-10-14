import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserRole } from '../../../core/models/user.model';
import { IconComponent } from '../../../shared/icons/icon.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none">
      <!-- Background Ambient Glows -->
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div class="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden relative z-10 min-h-[660px]">
        <!-- Left Column: Enterprise Brand Showcase (5 cols) -->
        <div class="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div class="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <!-- Brand Header -->
          <div class="relative z-10 space-y-6">
            <div class="flex items-center gap-3.5">
              <div class="w-14 h-14 rounded-2xl bg-white/10 p-1 backdrop-blur-md border border-white/20 shadow-sm flex items-center justify-center shrink-0">
                <img
                  src="assets/images/logo.png"
                  alt="CareerNexus Logo"
                  class="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>
              <div>
                <span class="text-xl sm:text-2xl font-black tracking-tight text-white block">Career<span class="text-blue-400">Nexus</span></span>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Connect • Prepare • Placed</span>
              </div>
            </div>

            <div class="space-y-2 pt-4">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Official Onboarding Portal
              </span>
              <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white leading-snug">
                Join your university's placement network.
              </h1>
              <p class="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Connect directly with hiring drives, access verified prep roadmaps, and receive career mentorship.
              </p>
            </div>
          </div>

          <!-- Role Benefits -->
          <div class="relative z-10 space-y-3.5 my-8">
            <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start gap-3">
              <div class="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                <app-icon name="award" [size]="16"></app-icon>
              </div>
              <div>
                <h4 class="text-xs font-bold text-white">For Students</h4>
                <p class="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Automated skill matching, job applications, aptitude mock tests, and timeline tracking.</p>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start gap-3">
              <div class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                <app-icon name="users" [size]="16"></app-icon>
              </div>
              <div>
                <h4 class="text-xs font-bold text-white">For Alumni Mentors</h4>
                <p class="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Conduct mock interviews, share interview experiences, and guide junior candidates.</p>
              </div>
            </div>
          </div>

          <!-- Footer highlight -->
          <div class="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>CareerNexus Ecosystem</span>
            <span class="text-blue-400 font-semibold flex items-center gap-1">
              <app-icon name="shield-check" [size]="14"></app-icon>
              Institutional Verification
            </span>
          </div>
        </div>

        <!-- Right Column: Registration Form (7 cols) -->
        <div class="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-slate-50/50">
          <div>
            <div class="mb-5">
              <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Create your account</h2>
              <p class="text-xs sm:text-sm text-slate-500 mt-1">Get started with CareerNexus in less than two minutes.</p>
            </div>

            <!-- Supabase / Registration Error Alert -->
            <div *ngIf="authService.lastAuthError()" class="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 shadow-xs">
              <app-icon name="alert-triangle" [size]="18" class="text-rose-600 shrink-0 mt-0.5"></app-icon>
              <div class="space-y-1 flex-1">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-rose-950">Registration Notice</span>
                  <button type="button" (click)="authService.lastAuthError.set('')" class="text-rose-400 hover:text-rose-700 text-xs font-bold">✕</button>
                </div>
                <p class="text-rose-700 leading-relaxed font-mono text-[11px] break-words">{{ authService.lastAuthError() }}</p>
              </div>
            </div>

            <!-- Step 1: Select Role (Strictly Student, Alumni, Recruiter - No Admin) -->
            <div class="mb-5">
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Registering As</label>
              <div class="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  (click)="selectedRole = 'student'"
                  class="p-3 rounded-2xl border-2 text-left transition-all flex flex-col items-center sm:items-start gap-1 cursor-pointer"
                  [ngClass]="selectedRole === 'student' ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'"
                >
                  <span class="text-xl">🎓</span>
                  <div>
                    <div class="text-xs font-bold">Student</div>
                    <div class="text-[10px] text-slate-500 hidden sm:block">Campus drives</div>
                  </div>
                </button>

                <button
                  type="button"
                  (click)="selectedRole = 'alumni'"
                  class="p-3 rounded-2xl border-2 text-left transition-all flex flex-col items-center sm:items-start gap-1 cursor-pointer"
                  [ngClass]="selectedRole === 'alumni' ? 'border-purple-600 bg-purple-50/70 text-purple-950 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'"
                >
                  <span class="text-xl">💼</span>
                  <div>
                    <div class="text-xs font-bold">Alumni</div>
                    <div class="text-[10px] text-slate-500 hidden sm:block">Mentorship</div>
                  </div>
                </button>

                <button
                  type="button"
                  (click)="selectedRole = 'recruiter'"
                  class="p-3 rounded-2xl border-2 text-left transition-all flex flex-col items-center sm:items-start gap-1 cursor-pointer"
                  [ngClass]="selectedRole === 'recruiter' ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'"
                >
                  <span class="text-xl">🏢</span>
                  <div>
                    <div class="text-xs font-bold">Recruiter</div>
                    <div class="text-[10px] text-slate-500 hidden sm:block">Post & Hire</div>
                  </div>
                </button>
              </div>
            </div>

            <!-- Form -->
            <form (submit)="onSubmit($event)" class="space-y-4">
              <!-- Full Name & Username -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    [(ngModel)]="fullName"
                    name="fullName"
                    required
                    placeholder="e.g. Rahul Sharma"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs font-medium"
                  />
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    [(ngModel)]="username"
                    name="username"
                    required
                    placeholder="e.g. rahul_sharma"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs font-medium"
                  />
                </div>
              </div>

              <!-- Email -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Institutional Email Address</label>
                <input
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  placeholder="name@university.edu or name@company.com"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs font-medium"
                />
              </div>

              <!-- Role Specific Field -->
              <div *ngIf="selectedRole === 'student'">
                <label class="block text-xs font-bold text-slate-700 mb-1">Department / Branch</label>
                <select
                  [(ngModel)]="department"
                  name="department"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs font-medium"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Electrical & Electronics">Electrical & Electronics</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                </select>
              </div>

              <div *ngIf="selectedRole === 'alumni'">
                <label class="block text-xs font-bold text-slate-700 mb-1">Current Company & Designation</label>
                <input
                  type="text"
                  [(ngModel)]="company"
                  name="company"
                  placeholder="e.g. Senior Software Engineer @ Microsoft"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-2xs font-medium"
                />
              </div>

              <div *ngIf="selectedRole === 'recruiter'">
                <label class="block text-xs font-bold text-slate-700 mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  [(ngModel)]="company"
                  name="company"
                  required
                  placeholder="e.g. Google India Pvt Ltd"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-2xs font-medium"
                />
              </div>

              <!-- Password & Confirm Password -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <div class="relative">
                    <input
                      [type]="showPassword ? 'text' : 'password'"
                      [(ngModel)]="password"
                      name="password"
                      required
                      placeholder="Min 8 characters"
                      class="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs font-medium"
                    />
                    <button
                      type="button"
                      (click)="showPassword = !showPassword"
                      [title]="showPassword ? 'Hide password' : 'Show password'"
                      class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      <app-icon [name]="showPassword ? 'eye-off' : 'eye'" [size]="16"></app-icon>
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
                  <div class="relative">
                    <input
                      [type]="showConfirmPassword ? 'text' : 'password'"
                      [(ngModel)]="confirmPassword"
                      name="confirmPassword"
                      required
                      placeholder="Repeat password"
                      class="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs font-medium"
                    />
                    <button
                      type="button"
                      (click)="showConfirmPassword = !showConfirmPassword"
                      [title]="showConfirmPassword ? 'Hide password' : 'Show password'"
                      class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      <app-icon [name]="showConfirmPassword ? 'eye-off' : 'eye'" [size]="16"></app-icon>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Password mismatch notice -->
              <p *ngIf="password && confirmPassword && password !== confirmPassword" class="text-xs text-rose-600 font-semibold flex items-center gap-1">
                <app-icon name="alert-triangle" [size]="14"></app-icon>
                Passwords do not match
              </p>

              <button
                type="submit"
                [disabled]="authService.isLoading()"
                class="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 shadow-md shadow-blue-500/20 transition-all duration-200 hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span *ngIf="authService.isLoading()" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{{ authService.isLoading() ? 'Creating account...' : 'Complete Registration' }}</span>
              </button>
            </form>
          </div>

          <div class="mt-8 pt-5 border-t border-slate-200/80 text-center text-xs text-slate-500">
            Already have an account?
            <a routerLink="/login" class="text-blue-600 font-bold hover:underline ml-1">Sign in</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  authService = inject(AuthService);
  toast = inject(ToastService);

  fullName = '';
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  department = 'Computer Science & Engineering';
  company = '';
  selectedRole: UserRole = 'student';

  showPassword = false;
  showConfirmPassword = false;

  onSubmit(event: Event) {
    event.preventDefault();

    const name = (this.fullName || '').trim();
    const uname = (this.username || '').trim();
    const mail = (this.email || '').trim();
    const pwd = this.password || '';
    const confirmPwd = this.confirmPassword || '';

    if (!name) {
      this.toast.error('Validation Error', 'Please enter your full name.');
      return;
    }

    if (!uname) {
      this.toast.error('Validation Error', 'Please choose a username.');
      return;
    }

    if (!mail) {
      this.toast.error('Validation Error', 'Please provide an email address.');
      return;
    }

    if (!pwd || pwd.length < 8) {
      this.toast.error('Weak Password', 'Password must be at least 8 characters in length.');
      return;
    }

    if (pwd !== confirmPwd) {
      this.toast.error('Validation Error', 'Passwords do not match. Please verify your passwords.');
      return;
    }

    // Role cannot be admin
    if (this.selectedRole === 'admin') {
      this.toast.error('Forbidden', 'Cannot register as administrator.');
      return;
    }

    this.authService.register({
      fullName: name,
      username: uname,
      email: mail,
      password: pwd,
      role: this.selectedRole,
      department: this.selectedRole === 'student' ? this.department : undefined,
      company: this.selectedRole !== 'student' ? this.company : undefined
    });
  }
}
