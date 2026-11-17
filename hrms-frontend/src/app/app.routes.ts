import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { MainLayout } from './layout/main-layout/main-layout';
import { Dashboard } from './features/dashboard/dashboard/dashboard';
import { DepartmentList } from './features/department/department-list/department-list';
import { DepartmentForm } from './features/department/department-form/department-form';
import { EmployeeList } from './features/employee/employee-list/employee-list';
import { EmployeeForm } from './features/employee/employee-form/employee-form';
import { Profile } from './features/profile/profile/profile';
import { authGuard } from './core/guards/auth-guard-guard';
import { adminGuard } from './core/guards/admin-guard';
import { NotFound } from './features/not-found/not-found';
import { Forbidden } from './features/forbidden/forbidden';
import { EmployeeDetail } from './features/employee/employee-detail/employee-detail';
import { DepartmentDetail } from './features/department/department-detail/department-detail';
import { AuditLogList } from './features/audit-log/audit-log-list/audit-log-list';

export const routes: Routes = [
  { path: 'login', component: Login, title: 'ROUTE_TITLE.LOGIN' },
  { path: '403', component: Forbidden, title: 'ROUTE_TITLE.FORBIDDEN' },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      // ─── Routes cho mọi User (đã đăng nhập) ───
      { path: 'dashboard', component: Dashboard, title: 'ROUTE_TITLE.DASHBOARD' },
      { path: 'profile', component: Profile, title: 'ROUTE_TITLE.PROFILE' },

      // Danh bạ phòng ban / nhân viên: User chỉ xem (hành động chỉnh sửa bị ẩn ở giao diện và chặn ở API)
      { path: 'departments', component: DepartmentList, title: 'ROUTE_TITLE.DEPARTMENTS' },
      { path: 'employees', component: EmployeeList, title: 'ROUTE_TITLE.EMPLOYEES' },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // ─── Routes dành riêng cho Admin (Bảo vệ toàn bộ group) ───
      {
        path: '',
        canActivate: [adminGuard],
        children: [
          // Departments (Thứ tự: tĩnh đứng trước động để tránh tranh chấp param)
          { path: 'departments/new', component: DepartmentForm, title: 'ROUTE_TITLE.DEPARTMENT_ADD' },
          { path: 'departments/edit/:id', component: DepartmentForm, title: 'ROUTE_TITLE.DEPARTMENT_EDIT' },

          // Employees (Thứ tự: tĩnh đứng trước động để tránh tranh chấp param)
          { path: 'employees/new', component: EmployeeForm, title: 'ROUTE_TITLE.EMPLOYEE_ADD' },
          { path: 'employees/edit/:id', component: EmployeeForm, title: 'ROUTE_TITLE.EMPLOYEE_EDIT' },

          // Audit Logs
          { path: 'audit-logs', component: AuditLogList, title: 'ROUTE_TITLE.AUDIT_LOGS' },
        ],
      },

      // Trang chi tiết (đặt sau nhóm Admin để 'new'/'edit' khớp trước ':id')
      { path: 'departments/:id', component: DepartmentDetail, title: 'ROUTE_TITLE.DEPARTMENT_DETAIL' },
      { path: 'employees/:id', component: EmployeeDetail, title: 'ROUTE_TITLE.EMPLOYEE_DETAIL' },
    ],
  },
  { path: '**', component: NotFound, title: 'ROUTE_TITLE.NOT_FOUND' },
];

