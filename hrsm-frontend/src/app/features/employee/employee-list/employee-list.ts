import { Component, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
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

@Component({
  selector: 'app-employee-list',
  imports: [CommonModule, RouterLink, FormsModule, TableSkeleton, Paginator, CustomSelectComponent],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css',
})
export class EmployeeList implements OnInit, OnDestroy {
  employees = signal<EmployeeModel[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  departments = signal<DepartmentModel[]>([]);

  searchTerm = '';
  departmentFilter = '';
  statusFilter = '';

  statusOptions: SelectOption[] = [
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Đang hoạt động', value: 'ACTIVE' },
    { label: 'Ngừng hoạt động', value: 'INACTIVE' }
  ];

  get departmentOptions(): SelectOption[] {
    return [
      { label: 'Tất cả phòng ban', value: '' },
      ...this.departments().map(d => ({ label: d.name, value: d._id }))
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
    private departmentService: Department
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
        this.statusFilter
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
          this.errorMessage.set(err.error?.message || 'Không tải được danh sách');
          this.isLoading.set(false);
        },
      });
  }

  onSearchTrigger() {
    this.currentPage.set(1);
    this.first = 0;
    this.loadEmployees();
  }

  onFilterChange() {
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
    this.currentPage.set(1);
    this.first = 0;
    this.loadEmployees();
  }

  onPageChange(event: any) {
    this.first = event.first;
    this.pageSize = event.rows;
    this.currentPage.set((event.page ?? 0) + 1);
    this.loadEmployees();
  }

  async onDelete(emp: EmployeeModel): Promise<void> {
    if (!emp._id) return;

    const confirmed = await this.confirmService.ask(
      `Bạn có chắc muốn xóa nhân viên "${emp.firstName} ${emp.lastName}"?`
    );
    if (!confirmed) return;

    this.employeeService
      .delete(emp._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadEmployees();
          this.notificationService.success('Xóa nhân viên thành công');
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Xóa thất bại'),
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
          this.notificationService.success('Cập nhật trạng thái thành công');
          this.loadEmployees();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Cập nhật thất bại'),
      });
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return '↕';
    return this.sortOrder === 'asc' ? '↑' : '↓';
  }

  getDepartmentName(dept: any): string {
    if (!dept) return 'Chưa phân phòng';
    return typeof dept === 'object' ? (dept.name || 'Chưa phân phòng') : dept;
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }
}