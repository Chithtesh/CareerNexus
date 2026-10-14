import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

/**
 * Product-Ready Route Guard:
 * Strictly enforces that each user can only access the workspace belonging to their
 * verified database role. Zero role switching, zero bypass.
 */
export const authGuard: CanActivateFn = (route, _state): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Authentication check
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // 2. Account active status check
  const currentUser = authService.currentUser();
  if (currentUser?.isActive === false || currentUser?.status === 'deactivated') {
    authService.logout();
    return router.createUrlTree(['/login']);
  }

  // 3. Strict Role Authorization
  const expectedRoles = route.data?.['roles'] as UserRole[] | undefined;
  const actualRole = authService.actualRole();

  if (expectedRoles && expectedRoles.length > 0) {
    if (!expectedRoles.includes(actualRole)) {
      // Access denied - strictly redirect user to their own authorized dashboard
      return router.createUrlTree([authService.getRoleDashboardRoute(actualRole)]);
    }
  }

  return true;
};
