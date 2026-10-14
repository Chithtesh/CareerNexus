import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { authGuard } from './core/guards/auth.guard';
import { AuthService } from './core/services/auth.service';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },

  // Top-Level Dynamic Role-Based Root Redirect
  {
    path: '',
    pathMatch: 'full',
    redirectTo: () => {
      const auth = inject(AuthService);
      if (!auth.isAuthenticated()) {
        return 'login';
      }
      const role = auth.actualRole();
      if (role === 'admin') return 'admin/dashboard';
      if (role === 'alumni') return 'alumni/dashboard';
      if (role === 'recruiter') return 'recruiter/dashboard';
      return 'student/dashboard';
    }
  },

  // Authenticated Application Shell
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [

      // STUDENT PORTAL
      {
        path: 'student',
        canActivate: [authGuard],
        data: { roles: ['student'] },
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'dashboard'
          },
          {
            path: 'dashboard',
            loadComponent: () => import('./features/student/dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent)
          },
          {
            path: 'profile',
            loadComponent: () => import('./features/student/profile/student-profile.component').then(m => m.StudentProfileComponent)
          },
          {
            path: 'jobs',
            loadComponent: () => import('./features/jobs/job-list/job-list.component').then(m => m.JobListComponent)
          },
          {
            path: 'jobs/:id',
            loadComponent: () => import('./features/jobs/job-detail/job-detail.component').then(m => m.JobDetailComponent)
          },
          {
            path: 'applications',
            loadComponent: () => import('./features/applications/application-list/application-list.component').then(m => m.ApplicationListComponent)
          },
          {
            path: 'career',
            loadComponent: () => import('./features/student/career/career-hub.component').then(m => m.CareerHubComponent)
          },
          {
            path: 'assessments',
            loadComponent: () => import('./features/student/assessments/assessment-hub.component').then(m => m.AssessmentHubComponent)
          },
          {
            path: 'calendar',
            loadComponent: () => import('./features/calendar/placement-calendar.component').then(m => m.PlacementCalendarComponent)
          },
          {
            path: 'companies',
            loadComponent: () => import('./features/companies/company-list/company-list.component').then(m => m.CompanyListComponent)
          },
          {
            path: 'alumni',
            loadComponent: () => import('./features/alumni/alumni-list/alumni-list.component').then(m => m.AlumniListComponent)
          },
          {
            path: 'resources',
            loadComponent: () => import('./features/resources/resource-drive.component').then(m => m.ResourceDriveComponent)
          },
          {
            path: 'messages',
            loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent)
          },
          {
            path: 'calls',
            loadComponent: () => import('./features/calls/calls.component').then(m => m.CallsComponent)
          },
          {
            path: 'notifications',
            loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent)
          }
        ]
      },

      // RECRUITER PORTAL
      {
        path: 'recruiter',
        canActivate: [authGuard],
        data: { roles: ['recruiter'] },
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'dashboard'
          },
          {
            path: 'dashboard',
            loadComponent: () => import('./features/recruiter/recruiter-dashboard/recruiter-dashboard.component').then(m => m.RecruiterDashboardComponent)
          },
          {
            path: 'jobs',
            loadComponent: () => import('./features/recruiter/recruiter-jobs/recruiter-jobs.component').then(m => m.RecruiterJobsComponent)
          },
          {
            path: 'applicants',
            loadComponent: () => import('./features/recruiter/recruiter-applicants/recruiter-applicants.component').then(m => m.RecruiterApplicantsComponent)
          },
          {
            path: 'calendar',
            loadComponent: () => import('./features/calendar/placement-calendar.component').then(m => m.PlacementCalendarComponent)
          },
          {
            path: 'messages',
            loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent)
          },
          {
            path: 'notifications',
            loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent)
          }
        ]
      },

      // ALUMNI PORTAL
      {
        path: 'alumni',
        canActivate: [authGuard],
        data: { roles: ['alumni'] },
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'dashboard'
          },
          {
            path: 'dashboard',
            loadComponent: () => import('./features/alumni-portal/alumni-dashboard/alumni-dashboard.component').then(m => m.AlumniDashboardComponent)
          },
          {
            path: 'profile',
            loadComponent: () => import('./features/alumni-portal/alumni-dashboard/alumni-dashboard.component').then(m => m.AlumniDashboardComponent)
          },
          {
            path: 'students',
            loadComponent: () => import('./features/admin/admin-users/admin-users.component').then(m => m.AdminUsersComponent)
          },
          {
            path: 'resources',
            loadComponent: () => import('./features/resources/resource-drive.component').then(m => m.ResourceDriveComponent)
          },
          {
            path: 'messages',
            loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent)
          },
          {
            path: 'calls',
            loadComponent: () => import('./features/calls/calls.component').then(m => m.CallsComponent)
          },
          {
            path: 'notifications',
            loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent)
          }
        ]
      },

      // ADMIN PORTAL
      {
        path: 'admin',
        canActivate: [authGuard],
        data: { roles: ['admin'] },
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'dashboard'
          },
          {
            path: 'dashboard',
            loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
          },
          {
            path: 'command-center',
            loadComponent: () => import('./features/admin/placement-command-center/placement-command-center.component').then(m => m.PlacementCommandCenterComponent)
          },
          {
            path: 'analytics',
            loadComponent: () => import('./features/admin/admin-analytics/admin-analytics.component').then(m => m.AdminAnalyticsComponent)
          },
          {
            path: 'calendar',
            loadComponent: () => import('./features/calendar/placement-calendar.component').then(m => m.PlacementCalendarComponent)
          },
          {
            path: 'users',
            loadComponent: () => import('./features/admin/admin-users/admin-users.component').then(m => m.AdminUsersComponent)
          },
          {
            path: 'students',
            loadComponent: () => import('./features/admin/admin-users/admin-users.component').then(m => m.AdminUsersComponent)
          },
          {
            path: 'alumni',
            loadComponent: () => import('./features/admin/admin-users/admin-users.component').then(m => m.AdminUsersComponent)
          },
          {
            path: 'applications',
            loadComponent: () => import('./features/admin/admin-applications/admin-applications.component').then(m => m.AdminApplicationsComponent)
          },
          {
            path: 'jobs',
            loadComponent: () => import('./features/admin/admin-jobs/admin-jobs.component').then(m => m.AdminJobsComponent)
          },
          {
            path: 'companies',
            loadComponent: () => import('./features/admin/admin-companies/admin-companies.component').then(m => m.AdminCompaniesComponent)
          },
          {
            path: 'resources',
            loadComponent: () => import('./features/resources/resource-drive.component').then(m => m.ResourceDriveComponent)
          },
          {
            path: 'messages',
            loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent)
          },
          {
            path: 'notifications',
            loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent)
          }
        ]
      }
    ]
  },

  {
    path: '**',
    redirectTo: 'login'
  }
];
