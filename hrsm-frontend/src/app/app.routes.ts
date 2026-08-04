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
  { path: 'login', component: Login, title: 'ROUTE_TITLE.LOGIN' },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard, title: 'ROUTE_TITLE.DASHBOARD' },
      { path: 'departments', component: DepartmentList, title: 'ROUTE_TITLE.DEPARTMENTS' },
      { path: 'departments/new', component: DepartmentForm, title: 'ROUTE_TITLE.DEPARTMENT_ADD' },
      {
        path: 'departments/edit/:id',
        component: DepartmentForm,
        title: 'ROUTE_TITLE.DEPARTMENT_EDIT',
      },
      {
        path: 'departments/:id',
        component: DepartmentDetail,
        title: 'ROUTE_TITLE.DEPARTMENT_DETAIL',
      },
      { path: 'employees', component: EmployeeList, title: 'ROUTE_TITLE.EMPLOYEES' },
      { path: 'employees/new', component: EmployeeForm, title: 'ROUTE_TITLE.EMPLOYEE_ADD' },
      { path: 'employees/edit/:id', component: EmployeeForm, title: 'ROUTE_TITLE.EMPLOYEE_EDIT' },
      { path: 'employees/:id', component: EmployeeDetail, title: 'ROUTE_TITLE.EMPLOYEE_DETAIL' },
      { path: 'profile', component: Profile, title: 'ROUTE_TITLE.PROFILE' },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', component: NotFound, title: 'ROUTE_TITLE.NOT_FOUND' },
];
