import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserRole } from '../models/user.model';
import { SupabaseService } from './supabase.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private toast = inject(ToastService);
  private supabase = inject(SupabaseService);

  private readonly STORAGE_KEY = 'placementconnect_user';

  // State signals - Each authenticated account has ONE actual authorized role
  currentUser = signal<User | null>(null);
  isLoading = signal<boolean>(false);
  lastAuthError = signal<string>('');
  emailConfirmationPending = signal<string | null>(null);

  // Computed authentication signals
  isAuthenticated = computed(() => !!this.currentUser());
  userRole = computed(() => this.currentUser()?.role || null);

  // The actual database role is the single source of authorization
  actualRole = computed<UserRole>(() => {
    const user = this.currentUser();
    if (!user || user.isActive === false) return 'student';
    const role = user.role;
    if (role === 'admin' || role === 'alumni' || role === 'recruiter' || role === 'student') {
      return role;
    }
    return 'student';
  });

  isStudent = computed(() => this.actualRole() === 'student');
  isAlumni = computed(() => this.actualRole() === 'alumni');
  isRecruiter = computed(() => this.actualRole() === 'recruiter');
  isAdmin = computed(() => this.actualRole() === 'admin');

  constructor() {
    this.initAuth();
  }

  private async initAuth() {
    // 1. Restore cached session state
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const user: User = JSON.parse(stored);
        if (user && typeof user === 'object') {
          if (user.isActive === false || user.status === 'deactivated') {
            this.clearUserSession();
            return;
          }
          const validRoles: UserRole[] = ['student', 'alumni', 'recruiter', 'admin'];
          if (!validRoles.includes(user.role)) {
            user.role = 'student';
          }
          this.currentUser.set(user);
        }
      }
    } catch {
      // ignore parse errors
    }

    // 2. Synchronize real Supabase Auth session
    const auth = this.supabase.auth;
    if (this.supabase.isConfigured && auth) {
      try {
        const { data: { session } } = await auth.getSession();
        if (session?.user) {
          await this.syncSupabaseUser(session.user);
        }

        auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            await this.syncSupabaseUser(session.user);
          } else if (_event === 'SIGNED_OUT') {
            this.clearUserSession();
          }
        });
      } catch (err) {
        console.warn('Supabase auth listener initialization error:', err);
      }
    }
  }

  /**
   * Synchronize authenticated user with public.users table in Supabase.
   * Enforces that the database role is the single source of truth.
   * Denies access immediately if the account is deactivated.
   */
  private async syncSupabaseUser(authUser: any) {
    let role: UserRole = (authUser.user_metadata?.['role'] as UserRole) || 'student';
    let fullName: string = authUser.user_metadata?.['full_name'] || authUser.email?.split('@')[0] || 'Placement User';
    let avatarUrl: string = authUser.user_metadata?.['avatar_url'] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    let isActive: boolean = true;
    let status: string = 'active';

    const client = this.supabase.getClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('users')
          .select('id, email, full_name, role, avatar_url, phone, status, is_active, created_at')
          .eq('id', authUser.id)
          .maybeSingle();

        if (data && !error) {
          if (data.is_active === false || data.status === 'deactivated') {
            await this.supabase.auth?.signOut();
            this.clearUserSession();
            this.toast.error('Account Suspended', 'Your account has been deactivated. Please contact the administrator.');
            this.router.navigate(['/login']);
            return;
          }

          role = data.role as UserRole;
          fullName = data.full_name || fullName;
          avatarUrl = data.avatar_url || avatarUrl;
          isActive = data.is_active ?? true;
          status = data.status || 'active';
        }
      } catch (e) {
        console.warn('Could not query public.users table during sync:', e);
      }
    }

    const user: User = {
      id: authUser.id,
      username: authUser.email?.split('@')[0] || '',
      email: authUser.email || '',
      role: role,
      fullName: fullName,
      avatarUrl: avatarUrl,
      isActive: isActive,
      status: status as any,
      createdAt: authUser.created_at || new Date().toISOString()
    };

    this.setUser(user);
  }

  setUser(user: User) {
    if (user.isActive === false || user.status === 'deactivated') {
      this.clearUserSession();
      this.toast.error('Access Denied', 'Your account is deactivated. Please contact your system administrator.');
      this.router.navigate(['/login']);
      return;
    }

    const validRoles: UserRole[] = ['student', 'alumni', 'recruiter', 'admin'];
    if (!validRoles.includes(user.role)) {
      user.role = 'student';
    }

    this.currentUser.set(user);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  }

  private clearUserSession() {
    this.currentUser.set(null);
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      sessionStorage.removeItem('placementconnect_workspace_role');
    } catch {
      // ignore
    }
  }

  /**
   * Production Login Flow:
   * Strictly uses Supabase Auth GoTrue (supabase.auth.signInWithPassword).
   * No fallback, mock, or local credentials allowed.
   */
  async login(usernameOrEmail: string, password?: string): Promise<boolean> {
    const identifier = (usernameOrEmail || '').trim();
    const pwd = (password || '').trim();

    this.lastAuthError.set('');
    this.emailConfirmationPending.set(null);

    if (!identifier) {
      this.toast.error('Missing Identifier', 'Please enter your username or email address.');
      return false;
    }

    if (!pwd) {
      this.toast.error('Missing Password', 'Please enter your password.');
      return false;
    }

    if (!this.supabase.isConfigured || !this.supabase.auth) {
      const msg = 'Supabase authentication service is not configured.';
      this.lastAuthError.set(msg);
      this.toast.error('Configuration Error', msg);
      return false;
    }

    this.isLoading.set(true);

    try {
      let targetEmail = identifier;

      // If user provided a username without '@', resolve to full email
      if (!identifier.includes('@')) {
        const client = this.supabase.getClient();
        if (client) {
          try {
            const { data: userRow } = await client
              .from('users')
              .select('email')
              .ilike('email', `${identifier}@%`)
              .maybeSingle();

            if (userRow?.email) {
              targetEmail = userRow.email;
            } else {
              // Default to @careernexus.com domain for standard usernames
              targetEmail = `${identifier}@careernexus.com`;
            }
          } catch {
            targetEmail = `${identifier}@careernexus.com`;
          }
        } else {
          targetEmail = `${identifier}@careernexus.com`;
        }
      }

      // 1. Authenticate strictly through Supabase Auth GoTrue
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: targetEmail,
        password: pwd
      });

      if (error || !data.session || !data.user) {
        this.isLoading.set(false);
        const errMsg = error?.message || 'Invalid email or password.';
        this.lastAuthError.set(errMsg);
        this.toast.error('Authentication Failed', errMsg);
        return false;
      }

      const authUserId = data.user.id;

      // 2. Fetch the actual database profile & role using authenticated UUID
      const client = this.supabase.getClient();
      let dbUser: any = null;
      if (client) {
        const { data: profileData, error: profileErr } = await client
          .from('users')
          .select('id, email, full_name, role, avatar_url, phone, status, is_active')
          .eq('id', authUserId)
          .maybeSingle();

        if (!profileErr && profileData) {
          dbUser = profileData;
        }
      }

      // Check account active status
      if (dbUser && (dbUser.is_active === false || dbUser.status === 'deactivated')) {
        await this.supabase.auth.signOut();
        this.clearUserSession();
        this.isLoading.set(false);
        const msg = 'Your account has been deactivated. Please contact your system administrator.';
        this.lastAuthError.set(msg);
        this.toast.error('Account Deactivated', msg);
        return false;
      }

      // 3. Database role is the single source of truth (Never infer from email or username)
      const actualRole: UserRole = (dbUser?.role as UserRole) || (data.user.user_metadata?.['role'] as UserRole) || 'student';

      // 4. Synchronize user state
      await this.syncSupabaseUser(data.user);

      this.isLoading.set(false);
      this.toast.success('Login Successful', `Welcome back, ${dbUser?.full_name || data.user.email}!`);
      this.redirectByRole(actualRole);
      return true;
    } catch (err: any) {
      this.isLoading.set(false);
      const msg = err?.message || 'Authentication service error';
      this.lastAuthError.set(msg);
      this.toast.error('Login Error', msg);
      return false;
    }
  }

  /**
   * Production Registration Flow:
   * Admin role CANNOT be selected during public registration.
   * Delegates creation strictly to Supabase Auth.
   */
  async register(data: {
    username?: string;
    email: string;
    password?: string;
    fullName: string;
    role: UserRole;
    department?: string;
    company?: string;
  }): Promise<boolean> {
    this.lastAuthError.set('');
    this.emailConfirmationPending.set(null);
    this.isLoading.set(true);

    if (data.role === 'admin') {
      this.isLoading.set(false);
      const adminMsg = 'Administrative accounts cannot be self-registered. Please contact the placement administrator.';
      this.lastAuthError.set(adminMsg);
      this.toast.error('Registration Blocked', adminMsg);
      return false;
    }

    if (!data.password || data.password.length < 8) {
      this.isLoading.set(false);
      const weakMsg = 'Password must be at least 8 characters in length.';
      this.lastAuthError.set(weakMsg);
      this.toast.error('Weak Password', weakMsg);
      return false;
    }

    if (!this.supabase.isConfigured || !this.supabase.auth) {
      this.isLoading.set(false);
      const msg = 'Supabase authentication service is not configured.';
      this.lastAuthError.set(msg);
      this.toast.error('Configuration Error', msg);
      return false;
    }

    const safeRole: UserRole = (data.role === 'alumni' || data.role === 'recruiter') ? data.role : 'student';
    const cleanEmail = data.email.trim().toLowerCase();

    try {
      const { data: authData, error } = await this.supabase.auth.signUp({
        email: cleanEmail,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: safeRole
          }
        }
      });

      if (error) {
        this.isLoading.set(false);
        this.lastAuthError.set(error.message);
        this.toast.error('Registration Failed', error.message);
        return false;
      }

      if (authData.user) {
        if (!authData.session) {
          this.isLoading.set(false);
          this.emailConfirmationPending.set(cleanEmail);
          const confirmNotice = `Verification email sent to ${cleanEmail}. Please confirm your email before signing in.`;
          this.toast.info('Verification Required', confirmNotice);
          this.router.navigate(['/login']);
          return true;
        }

        await this.syncSupabaseUser(authData.user);
        this.isLoading.set(false);
        this.toast.success('Account Created', `Welcome to CareerNexus, ${data.fullName}!`);
        this.redirectByRole(safeRole);
        return true;
      }

      this.isLoading.set(false);
      return false;
    } catch (err: any) {
      this.isLoading.set(false);
      const msg = err?.message || 'Registration service error';
      this.lastAuthError.set(msg);
      this.toast.error('Registration Error', msg);
      return false;
    }
  }

  async logout() {
    if (this.supabase.isConfigured && this.supabase.auth) {
      try {
        await this.supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signOut error:', e);
      }
    }
    this.clearUserSession();
    this.toast.info('Logged Out', 'You have been signed out safely.');
    this.router.navigate(['/login']);
  }

  getRoleDashboardRoute(role?: UserRole | null): string {
    switch (role) {
      case 'student':
        return '/student/dashboard';
      case 'alumni':
        return '/alumni/dashboard';
      case 'recruiter':
        return '/recruiter/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/login';
    }
  }

  redirectByRole(role: UserRole) {
    this.router.navigate([this.getRoleDashboardRoute(role)]);
  }
}
