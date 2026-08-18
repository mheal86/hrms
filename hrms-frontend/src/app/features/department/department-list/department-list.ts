import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { Department } from '../../../core/services/department.service';
import { Department as DepartmentModel } from '../../../core/models/department-model';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';
import { Confirm } from '../../../core/services/confirm';
import { TableSkeleton } from '../../../shared/table-skeleton/table-skeleton';
import { Paginator } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';

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
    InputText,
    Menu,
    TranslatePipe,
  ],
  templateUrl: './department-list.html',
  styleUrl: './department-list.scss',
})
export class DepartmentList implements OnInit, OnDestroy {
  departmentService = inject(Department);
  authService = inject(Auth);
  notificationService = inject(Notification);
  confirmService = inject(Confirm);
  translate = inject(TranslateService);
  languageService = inject(LanguageService);

  baseUrl = environment.baseUrl;
  departments = signal<DepartmentModel[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  searchTerm = '';
  cols = [
    { field: 'name', header: 'DEPARTMENT.COL_NAME', sortable: false },
    { field: 'description', header: 'DEPARTMENT.COL_DESCRIPTION', sortable: false },
  ];

  currentPage = signal(1);
  totalPages = signal(1);
  total = signal(0);
  pageSize = 5;
  first = 0;
  menuItems: MenuItem[] = [];

  destroy$ = new Subject<void>();

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
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          this.departments.set(res.data);
          this.total.set(res.pagination.total);
          this.totalPages.set(res.pagination.totalPages);
        },
        error: (err) => {
          this.errorMessage.set(
            err.error?.message || this.translate.instant('DEPARTMENT.LOAD_ERROR'),
          );
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
        name: this.languageService.getDepartmentName(dept.name),
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
          if (employeeCount != null) {
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
}
