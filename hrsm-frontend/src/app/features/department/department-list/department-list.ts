import { Component, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Department } from '../department';
import { Department as DepartmentModel } from '../department-model';
import { Auth } from '../../../core/auth';
import { Notification } from '../../../core/notification';
import { Confirm } from '../../../core/confirm';
import { TableSkeleton } from '../../../shared/table-skeleton/table-skeleton';
import { Paginator } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-department-list',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TableSkeleton,
    Paginator,
    TableModule,
    Button,
    Menu,
    TranslatePipe,
  ],
  templateUrl: './department-list.html',
  styleUrl: './department-list.scss',
})
export class DepartmentList implements OnInit, OnDestroy {
  departments = signal<DepartmentModel[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  searchTerm = '';
  cols = [
    { field: 'name', header: 'DEPARTMENT.COL_NAME' },
    { field: 'description', header: 'DEPARTMENT.COL_DESCRIPTION' },
  ];

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

  currentPage = signal(1);
  totalPages = signal(1);
  total = signal(0);
  pageSize = 5;
  first = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private departmentService: Department,
    public authService: Auth,
    private notificationService: Notification,
    private confirmService: Confirm,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.loadDepartments();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDepartments() {
    this.isLoading.set(true);
    this.departmentService
      .getAll(this.searchTerm, this.currentPage(), this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.departments.set(res.data);
          this.total.set(res.pagination.total);
          this.totalPages.set(res.pagination.totalPages);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(
            err.error?.message || this.translate.instant('DEPARTMENT.LOAD_ERROR'),
          );
          this.isLoading.set(false);
        },
      });
  }

  onSearchTrigger() {
    this.currentPage.set(1);
    this.first = 0;
    this.loadDepartments();
  }

  onPageChange(event: { first?: number; rows?: number; page?: number }) {
    this.first = event.first ?? 0;
    this.pageSize = event.rows ?? 5;
    this.currentPage.set((event.page ?? 0) + 1);
    this.loadDepartments();
  }

  menuItems: MenuItem[] = [];

  getDepartmentMenuItems(dept: DepartmentModel): MenuItem[] {
    return [
      {
        label: this.translate.instant('EMPLOYEE.MENU_VIEW'),
        icon: 'pi pi-eye',
        routerLink: ['/departments', dept._id],
      },
      {
        label: this.translate.instant('DEPARTMENT.MENU_EDIT'),
        icon: 'pi pi-pencil',
        routerLink: ['/departments/edit', dept._id],
      },
      {
        label: this.translate.instant('DEPARTMENT.MENU_DELETE'),
        icon: 'pi pi-trash',
        styleClass: 'text-danger',
        command: () => this.onDelete(dept),
      },
    ];
  }

  async onDelete(dept: DepartmentModel): Promise<void> {
    if (!dept._id) return;

    const confirmed = await this.confirmService.ask(
      this.translate.instant('DEPARTMENT.DELETE_CONFIRM', {
        name: this.getDepartmentName(dept.name),
      }),
    );
    if (!confirmed) return;

    this.departmentService
      .delete(dept._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success(this.translate.instant('DEPARTMENT.DELETE_SUCCESS'));
          this.loadDepartments();
        },
        error: (err) => {
          const employeeCount = err.error?.employeeCount;
          if (employeeCount !== undefined && employeeCount !== null) {
            this.notificationService.error(
              this.translate.instant('DEPARTMENT.DELETE_HAS_EMPLOYEES_ERROR', {
                count: employeeCount,
              }),
            );
          } else {
            this.notificationService.error(
              err.error?.message || this.translate.instant('DEPARTMENT.DELETE_ERROR'),
            );
          }
        },
      });
  }

  getDepartmentName(dept: string | { _id: string; name: string } | null | undefined): string {
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

  getDepartmentDesc(name: any, description: any): string {
    const mapping: { [key: string]: string } = {
      'Phòng Nhân sự': 'DEPARTMENTS_DESC.HR',
      'Phòng Công nghệ thông tin': 'DEPARTMENTS_DESC.TECH',
      'Phòng Kế toán': 'DEPARTMENTS_DESC.FINANCE',
      'Phòng Marketing': 'DEPARTMENTS_DESC.MARKETING',
      'Phòng Kinh doanh': 'DEPARTMENTS_DESC.SALES',
      'Phòng Hành chính': 'DEPARTMENTS_DESC.ADMIN',
      'Phòng Nghiên cứu & Phát triển': 'DEPARTMENTS_DESC.RD',
      'Phòng R&D': 'DEPARTMENTS_DESC.RD',
      'Phòng Quản lý dự án': 'DEPARTMENTS_DESC.PROJECT',
      'Phòng Chăm sóc khách hàng': 'DEPARTMENTS_DESC.CUSTOMER_SERVICE',
      'Phòng Pháp chế': 'DEPARTMENTS_DESC.LEGAL',
      'Phòng Thiết kế': 'DEPARTMENTS_DESC.DESIGN',
      'Phòng Đào tạo': 'DEPARTMENTS_DESC.TRAINING',
    };
    const translationKey = mapping[name];
    if (translationKey) {
      const translated = this.translate.instant(translationKey);
      return translated !== translationKey ? translated : description;
    }
    return description || '';
  }
}
