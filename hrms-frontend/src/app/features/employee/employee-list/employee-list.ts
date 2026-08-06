import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { Employee } from '../../../core/services/employee.service';
import { Employee as EmployeeModel, EmployeeStatus } from '../../../core/models/employee-model';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';
import { Confirm } from '../../../core/services/confirm';
import { TableSkeleton } from '../../../shared/table-skeleton/table-skeleton';
import { Department } from '../../../core/services/department.service';
import { Department as DepartmentModel } from '../../../core/models/department-model';
import { Paginator } from 'primeng/paginator';
import { CustomSelectComponent } from '../../../shared/custom-select/custom-select';
import { SelectOption } from '../../../core/models/select-option-model';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { LanguageService } from '../../../core/services/language.service';
import { getInitials } from '../../../core/utils/employee-utils';

@Component({
  selector: 'app-employee-list',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TableSkeleton,
    Paginator,
    CustomSelectComponent,
    Button,
    InputText,
    TableModule,
    Menu,
    TranslatePipe,
  ],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.scss',
})
export class EmployeeList implements OnInit, OnDestroy {
  employeeService = inject(Employee);
  authService = inject(Auth);
  notificationService = inject(Notification);
  confirmService = inject(Confirm);
  departmentService = inject(Department);
  translate = inject(TranslateService);
  languageService = inject(LanguageService);

  baseUrl = environment.baseUrl;
  employees = signal<EmployeeModel[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  departments = signal<DepartmentModel[]>([]);

  searchTerm = '';
  departmentFilter = '';
  statusFilter = '';
  cols = [
    { field: 'firstName', header: 'EMPLOYEE.COL_FULL_NAME', sortable: true },
    { field: 'email', header: 'EMPLOYEE.COL_EMAIL', sortable: true },
    { field: 'department', header: 'EMPLOYEE.COL_DEPARTMENT', sortable: false },
    { field: 'position', header: 'EMPLOYEE.COL_POSITION', sortable: true },
  ];

  get statusOptions(): SelectOption[] {
    return [
      { label: this.translate.instant('EMPLOYEE.ALL_STATUS'), value: '' },
      { label: this.translate.instant('EMPLOYEE.STATUS_ACTIVE'), value: EmployeeStatus.ACTIVE },
      { label: this.translate.instant('EMPLOYEE.STATUS_INACTIVE'), value: EmployeeStatus.INACTIVE },
    ];
  }

  get departmentOptions(): SelectOption[] {
    return [
      { label: this.translate.instant('EMPLOYEE.ALL_DEPARTMENTS'), value: '' },
      ...this.departments().map((d) => ({
        label: this.languageService.getDepartmentName(d.name),
        value: d._id || '',
      })),
    ];
  }
  currentPage = signal(1);
  totalPages = signal(1);
  total = signal(0);
  pageSize = 5;
  first = 0;
  sortField = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';



  destroy$ = new Subject<void>();

  ngOnInit() {
    this.loadDepartmentsForFilter();
    this.loadEmployees();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDepartmentsForFilter() {
    this.departmentService
      .getAllUnpaginated()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.departments.set(data),
        error: (err) => {
          this.errorMessage.set(
            err.error?.message || this.translate.instant('DEPARTMENT.LOAD_ERROR'),
          );
        },
      });
  }

  loadEmployees() {
    this.isLoading.set(true);
    this.employeeService
      .getAll(
        this.currentPage(),
        this.pageSize,
        this.searchTerm,
        this.sortField,
        this.sortOrder,
        this.departmentFilter,
        this.statusFilter,
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          this.employees.set(res.data);
          this.totalPages.set(res.pagination.totalPages);
          this.total.set(res.pagination.total);
        },
        error: (err) => {
          this.errorMessage.set(
            err.error?.message || this.translate.instant('EMPLOYEE.LOAD_ERROR'),
          );
        },
      });
  }

  resetAndLoad() {
    this.currentPage.set(1);
    this.first = 0;
    this.loadEmployees();
  }

  onSort(field: string) {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortOrder = 'asc';
    }
    this.resetAndLoad();
  }

  onPageChange(event: { first?: number; rows?: number; page?: number }) {
    this.first = event.first ?? 0;
    this.pageSize = event.rows ?? 5;
    this.currentPage.set((event.page ?? 0) + 1);
    this.loadEmployees();
  }

  async onDelete(emp: EmployeeModel): Promise<void> {
    if (!emp._id) return;

    const confirmed = await this.confirmService.ask(
      this.translate.instant('EMPLOYEE.DELETE_CONFIRM', {
        name: `${emp.firstName} ${emp.lastName}`,
      }),
    );
    if (!confirmed) return;

    this.employeeService
      .delete(emp._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadEmployees();
          this.notificationService.success(this.translate.instant('EMPLOYEE.DELETE_SUCCESS'));
        },
        error: (err) =>
          this.notificationService.error(
            err.error?.message || this.translate.instant('EMPLOYEE.DELETE_ERROR'),
          ),
      });
  }

  onToggleStatus(emp: EmployeeModel) {
    if (!emp._id) return;

    const newStatus = emp.status === EmployeeStatus.ACTIVE ? EmployeeStatus.INACTIVE : EmployeeStatus.ACTIVE;

    this.employeeService
      .update(emp._id, { ...emp, status: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success(
            this.translate.instant('EMPLOYEE.STATUS_UPDATE_SUCCESS'),
          );
          this.loadEmployees();
        },
        error: (err) =>
          this.notificationService.error(
            err.error?.message || this.translate.instant('EMPLOYEE.STATUS_UPDATE_ERROR'),
          ),
      });
  }

  menuItems: MenuItem[] = [];

  getEmployeeMenuItems(emp: EmployeeModel): MenuItem[] {
    return [
      {
        label: this.translate.instant('EMPLOYEE.MENU_VIEW'),
        icon: 'pi pi-eye',
        routerLink: ['/employees', emp._id],
      },
      {
        label: this.translate.instant('EMPLOYEE.MENU_EDIT'),
        icon: 'pi pi-pencil',
        disabled: emp.status === EmployeeStatus.INACTIVE,
        routerLink: ['/employees/edit', emp._id],
      },
      {
        label: this.translate.instant('EMPLOYEE.MENU_DELETE'),
        icon: 'pi pi-trash',
        disabled: emp.status === EmployeeStatus.ACTIVE,
        styleClass: 'text-danger',
        command: () => this.onDelete(emp),
      },
    ];
  }

  getInitials = getInitials;
}
