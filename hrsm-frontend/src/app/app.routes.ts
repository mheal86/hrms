import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { MainLayout } from './layout/main-layout/main-layout';
import { Dashboard } from './features/dashboard/dashboard/dashboard';
import { DepartmentList } from './features/department/department-list/department-list';
import { DepartmentForm } from './features/department/department-form/department-form';
import { EmployeeList } from './features/employee/employee-list/employee-list';
import { EmployeeForm } from './features/employee/employee-form/employee-form';
import { Profile } from './features/profile/profile/profile';
import { authGuard } from './core/auth-guard-guard';
import { NotFound } from './features/not-found/not-found';
import { EmployeeDetail } from './features/employee/employee-detail/employee-detail';
import { DepartmentDetail } from './features/department/department-detail/department-detail';

export const routes: Routes = [
  { path: 'login', component: Login, title: 'Đăng nhập - HRMS' },
  { 
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard, title: 'Dashboard - HRMS' },
      { path: 'departments', component: DepartmentList, title: 'Department - HRMS' },
      { path: 'departments/new', component: DepartmentForm, title: 'Thêm phòng ban - HRMS' },
      { path: 'departments/edit/:id', component: DepartmentForm, title: 'Sửa phòng ban - HRMS' },
      { path: 'departments/:id', component: DepartmentDetail, title: 'Chi tiết phòng ban - HRMS' },
      { path: 'employees', component: EmployeeList, title: 'Employee - HRMS' },
      { path: 'employees/new', component: EmployeeForm, title: 'Thêm nhân viên - HRMS' },
      { path: 'employees/edit/:id', component: EmployeeForm, title: 'Sửa nhân viên - HRMS' },
      { path: 'employees/:id', component: EmployeeDetail, title: 'Chi tiết nhân viên - HRMS' },
      { path: 'profile', component: Profile, title: 'Profile - HRMS' },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ],
  },
  { path: '**', component: NotFound, title: 'Không tìm thấy trang - HRMS' },
];