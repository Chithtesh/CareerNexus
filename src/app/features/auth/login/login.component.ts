import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/icons/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none">
      <!-- Background Ambient Glows -->
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div class="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden relative z-10 min-h-[600px]">
        <!-- Left Column: Enterprise Brand Showcase (5 cols) -->
        <div class="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
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
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                Enterprise Placement Network
              </span>
              <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white leading-snug">
                Accelerate campus hiring with intelligence.
              </h1>
              <p class="text-slate-300 text-xs sm:text-sm leading-relaxed">
                A unified career management system connecting students, recruiters, alumni mentors, and placement officers.
              </p>
            </div>
          </div>

          <!-- Feature Highlights -->
          <div class="relative z-10 space-y-3.5 my-8">
            <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start gap-3">
              <div class="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                <app-icon name="sparkles" [size]="16"></app-icon>
              </div>
              <div>
                <h4 class="text-xs font-bold text-white">Skill Match & Gap Analysis</h4>
                <p class="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Instant mathematical matching between student profile and job requirements.</p>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start gap-3">
              <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <app-icon name="grid" [size]="16"></app-icon>
              </div>
              <div>
                <h4 class="text-xs font-bold text-white">Placement Command Center</h4>
                <p class="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Executive real-time recruitment funnel and department placement analytics.</p>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start gap-3">
              <div class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                <app-icon name="users" [size]="16"></app-icon>
              </div>
              <div>
                <h4 class="text-xs font-bold text-white">Alumni Mentorship Network</h4>
                <p class="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Direct 1-on-1 mentorship sessions with graduates at leading tech firms.</p>
              </div>
            </div>
          </div>

          <!-- Footer highlight -->
          <div class="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>Institutional Portal</span>
            <span class="text-emerald-400 font-semibold flex items-center gap-1">
              <app-icon name="shield-check" [size]="14"></app-icon>
              ISO 27001 Secure
            </span>
          </div>
        </div>

        <!-- Right Column: Authentication Form (7 cols) -->
        <div class="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-slate-50/50">
          <div>
            <div class="mb-6">
              <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Sign in to your account</h2>
              <p class="text-xs sm:text-sm text-slate-500 mt-1.5">Enter your institutional credentials to securely access your designated workspace.</p>
            </div>

            <!-- Real Supabase / Authentication Error Alert -->
            <div *ngIf="authService.lastAuthError()" class="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 shadow-xs">
              <app-icon name="alert-triangle" [size]="18" class="text-rose-600 shrink-0 mt-0.5"></app-icon>
              <div class="space-y-1 flex-1">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-rose-950">Authentication Notice</span>
                  <button type="button" (click)="authService.lastAuthError.set('')" class="text-rose-400 hover:text-rose-700 text-xs font-bold">✕</button>
                </div>
                <p class="text-rose-700 leading-relaxed font-mono text-[11px] break-words">{{ authService.lastAuthError() }}</p>
              </div>
            </div>

            <!-- Email Confirmation Pending Alert -->
            <div *ngIf="authService.emailConfirmationPending()" class="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
              <app-icon name="mail" [size]="18" class="text-amber-600 shrink-0 mt-0.5"></app-icon>
              <div class="space-y-1 flex-1">
                <span class="font-bold block text-amber-950">Email Verification Required</span>
                <p class="text-amber-800 leading-relaxed">
                  A verification email was sent to <span class="font-bold underline">{{ authService.emailConfirmationPending() }}</span>. Please check your inbox and verify your email before signing in.
                </p>
              </div>
            </div>

            <!-- Production Login Form -->
            <form (submit)="onSubmit($event)" class="space-y-5">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">Username or Institutional Email</label>
                <div class="relative">
                  <input
                    type="text"
                    [(ngModel)]="identifier"
                    name="identifier"
                    required
                    placeholder="Enter your username or email address"
                    autocomplete="username"
                    class="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs font-medium"
                  />
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-bold text-slate-700">Password</label>
                  <a href="javascript:void(0)" (click)="onForgotPassword()" class="text-xs text-blue-600 font-semibold hover:underline">Forgot password?</a>
                </div>
                <div class="relative">
                  <input
                    [type]="showPassword ? 'text' : 'password'"
                    [(ngModel)]="password"
                    name="password"
                    required
                    placeholder="Enter your password"
                    autocomplete="current-password"
                    class="w-full pl-4 pr-11 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs font-medium"
                  />
                  <button
                    type="button"
                    (click)="showPassword = !showPassword"
                    [title]="showPassword ? 'Hide password' : 'Show password'"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    <app-icon [name]="showPassword ? 'eye-off' : 'eye'" [size]="18"></app-icon>
                  </button>
                </div>
              </div>

              <div class="flex items-center justify-between text-xs pt-1">
                <label class="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    [(ngModel)]="rememberMe"
                    name="rememberMe"
                    class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span class="font-medium">Remember me on this terminal</span>
                </label>
              </div>

              <button
                type="submit"
                [disabled]="authService.isLoading()"
                class="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 shadow-md shadow-blue-500/20 transition-all duration-200 hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span *ngIf="authService.isLoading()" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{{ authService.isLoading() ? 'Signing In...' : 'Sign In with Supabase' }}</span>
              </button>
            </form>
          </div>

          <div class="mt-8 pt-5 border-t border-slate-200/80 text-center text-xs text-slate-500">
            Don't have an account?
            <a routerLink="/register" class="text-blue-600 font-bold hover:underline ml-1">Create an account</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  authService = inject(AuthService);
  toast = inject(ToastService);

  // Standard credentials
  identifier = '';
  password = '';
  showPassword = false;
  rememberMe = true;

  onSubmit(event: Event) {
    event.preventDefault();
    const cleanId = (this.identifier || '').trim();
    const cleanPwd = (this.password || '').trim();

    if (!cleanId) {
      this.toast.error('Missing Identifier', 'Please enter your username or email address.');
      return;
    }

    if (!cleanPwd) {
      this.toast.error('Missing Password', 'Please enter your password.');
      return;
    }

    this.authService.login(cleanId, cleanPwd);
  }

  onForgotPassword() {
    this.toast.info(
      'Password Reset',
      'Please contact your university placement cell or system administrator to reset institutional credentials.'
    );
  }
}

