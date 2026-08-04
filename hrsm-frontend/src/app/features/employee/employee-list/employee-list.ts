import { Component, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Employee } from '../employee';
import { Employee as EmployeeModel } from '../employee-model';
import { Auth } from '../../../core/auth';
import { Notification } from '../../../core/notification';
import { Confirm } from '../../../core/confirm';
import { TableSkeleton } from '../../../shared/table-skeleton/table-skeleton';
import { Department } from '../../department/department';
import { Department as DepartmentModel } from '../../department/department-model';
import { Paginator } from 'primeng/paginator';
import { CustomSelectComponent, SelectOption } from '../../../shared/custom-select/custom-select';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';

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
    TableModule,
    Menu,
    TranslatePipe,
  ],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.scss',
})
export class EmployeeList implements OnInit, OnDestroy {
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
      { label: this.translate.instant('EMPLOYEE.STATUS_ACTIVE'), value: 'ACTIVE' },
      { label: this.translate.instant('EMPLOYEE.STATUS_INACTIVE'), value: 'INACTIVE' },
    ];
  }

  get departmentOptions(): SelectOption[] {
    const mapping: { [key: string]: string } = {
      'Phòng Nhân sự': 'DEPARTMENTS_LIST.HR',
      'Phòng Công nghệ thông tin': 'DEPARTMENTS_LIST.TECH',
      'Phòng Kế toán': 'DEPARTMENTS_LIST.FINANCE',
      'Phòng Marketing': 'DEPARTMENTS_LIST.MARKETING',
      'Phòng Kinh doanh': 'DEPARTMENTS_LIST.SALES',
      'Phòng Hành chính': 'DEPARTMENTS_LIST.ADMIN',
      'Phòng Nghiên cứu & Phát triển': 'DEPARTMENTS_LIST.RD',
      'Phòng R&D': 'DEPARTMENTS_LIST.RD',
      'Phòng Quản lý dự án': 'DEPARTMENTS_LIST.PROJECT',
      'Phòng Chăm sóc khách hàng': 'DEPARTMENTS_LIST.CUSTOMER_SERVICE',
      'Phòng Pháp chế': 'DEPARTMENTS_LIST.LEGAL',
      'Phòng Thiết kế': 'DEPARTMENTS_LIST.DESIGN',
      'Phòng Đào tạo': 'DEPARTMENTS_LIST.TRAINING',
    };
    return [
      { label: this.translate.instant('EMPLOYEE.ALL_DEPARTMENTS'), value: '' },
      ...this.departments().map((d) => {
        const translationKey = mapping[d.name];
        const label = translationKey ? this.translate.instant(translationKey) : d.name;
        return { label, value: d._id };
      }),
    ];
  }
  currentPage = signal(1);
  totalPages = signal(1);
  total = signal(0);
  pageSize = 5;
  first = 0;
  sortField = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  activeActionsMenuId = signal<string | null>(null);

  toggleActionsMenu(id: string, event: Event) {
    event.stopPropagation();
    if (this.activeActionsMenuId() === id) {
      this.activeActionsMenuId.set(null);
    } else {
      this.activeActionsMenuId.set(id);
    }
  }

  @HostListener('document:click')
  closeActionsMenu() {
    this.activeActionsMenuId.set(null);
  }

  private destroy$ = new Subject<void>();

  constructor(
    private employeeService: Employee,
    public authService: Auth,
    private notificationService: Notification,
    private confirmService: Confirm,
    private departmentService: Department,
    private translate: TranslateService,
  ) {}

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
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.employees.set(res.data);
          this.totalPages.set(res.pagination.totalPages);
          this.total.set(res.pagination.total);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(
            err.error?.message || this.translate.instant('EMPLOYEE.LOAD_ERROR'),
          );
          this.isLoading.set(false);
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

    const newStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

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

  getSortIcon(field: string): string {
    if (this.sortField !== field) return '↕';
    return this.sortOrder === 'asc' ? '↑' : '↓';
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
        disabled: emp.status === 'INACTIVE',
        routerLink: ['/employees/edit', emp._id],
      },
      {
        label: this.translate.instant('EMPLOYEE.MENU_DELETE'),
        icon: 'pi pi-trash',
        disabled: emp.status === 'ACTIVE',
        styleClass: 'text-danger',
        command: () => this.onDelete(emp),
      },
    ];
  }

  getDepartmentName(dept: any): string {
    const fallback = this.translate.instant('EMPLOYEE.UNASSIGNED');
    if (!dept) return fallback;
    const name = typeof dept === 'object' ? dept.name || fallback : dept;
    const mapping: { [key: string]: string } = {
      'Phòng Nhân sự': 'DEPARTMENTS_LIST.HR',
      'Phòng Công nghệ thông tin': 'DEPARTMENTS_LIST.TECH',
      'Phòng Kế toán': 'DEPARTMENTS_LIST.FINANCE',
      'Phòng Marketing': 'DEPARTMENTS_LIST.MARKETING',
      'Phòng Kinh doanh': 'DEPARTMENTS_LIST.SALES',
      'Phòng Hành chính': 'DEPARTMENTS_LIST.ADMIN',
      'Phòng Nghiên cứu & Phát triển': 'DEPARTMENTS_LIST.RD',
      'Phòng R&D': 'DEPARTMENTS_LIST.RD',
      'Phòng Quản lý dự án': 'DEPARTMENTS_LIST.PROJECT',
      'Phòng Chăm sóc khách hàng': 'DEPARTMENTS_LIST.CUSTOMER_SERVICE',
      'Phòng Pháp chế': 'DEPARTMENTS_LIST.LEGAL',
      'Phòng Thiết kế': 'DEPARTMENTS_LIST.DESIGN',
      'Phòng Đào tạo': 'DEPARTMENTS_LIST.TRAINING',
    };
    const translationKey = mapping[name];
    if (translationKey) {
      const translated = this.translate.instant(translationKey);
      return translated !== translationKey ? translated : name;
    }
    return name;
  }

  getPositionTranslation(position: any): string {
    if (!position) return '';
    const mapping: { [key: string]: string } = {
      'Nhân viên': 'FORM.POSITION_STAFF',
      'Trưởng nhóm': 'FORM.POSITION_TEAM_LEADER',
      'Trưởng phòng': 'FORM.POSITION_DEPT_HEAD',
      'Phó phòng': 'FORM.POSITION_DEPT_DEPUTY',
      'Phó giám đốc': 'FORM.POSITION_DEPUTY_GD',
      'Giám đốc': 'FORM.POSITION_GD',
      'Thực tập sinh': 'FORM.POSITION_INTERN',
    };
    return mapping[position] || position;
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }
}
