import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

const checkAdminAccess = (): boolean => {
  const authService = inject(Auth);
  const router = inject(Router);

  const currentUser = authService.getUser();
  const currentRole = currentUser?.role;

  // Xử lý trường hợp role là object (populate chưa đúng) hoặc string
  const roleName =
    typeof currentRole === 'object' && currentRole !== null
      ? (currentRole as { name?: string }).name
      : currentRole;

  const isAdmin = roleName === 'ADMIN';

  if (isAdmin) {
    return true;
  }

  router.navigate(['/403']);
  return false;
};

// Dùng cho canActivate trên từng route cụ thể
export const adminGuard: CanActivateFn = () => checkAdminAccess();

// Dùng cho canActivateChild trên parent để bắt TOÀN BỘ child navigation
export const adminGuardChild: CanActivateChildFn = () => checkAdminAccess();
