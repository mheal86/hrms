import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Employee } from '../employee';
import { Employee as EmployeeModel, EmployeeHistory } from '../employee-model';
import { Spinner } from '../../../shared/spinner/spinner';
import { Subject, takeUntil } from 'rxjs';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-employee-detail',
  imports: [CommonModule, RouterLink, Spinner, Button, TableModule, TranslatePipe],
  templateUrl: './employee-detail.html',
  styleUrl: './employee-detail.scss',
})
export class EmployeeDetail implements OnInit, OnDestroy {
  baseUrl = environment.baseUrl;
  employee = signal<EmployeeModel | null>(null);
  history = signal<EmployeeHistory[]>([]);
  isLoading = signal(false);
  isLoadingHistory = signal(false);
  errorMessage = signal('');
  departmentId = signal<string | null>(null);
  historyCols = [
    { field: 'fromDepartment', header: 'EMPLOYEE.HISTORY_COL_OLD' },
    { field: 'toDepartment', header: 'EMPLOYEE.HISTORY_COL_NEW' },
    { field: 'transferDate', header: 'EMPLOYEE.HISTORY_COL_DATE' },
  ];
  private destroy$ = new Subject<void>();

  constructor(
    private employeeService: Employee,
    private route: ActivatedRoute,
    private location: Location,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEmployee(id);
      this.loadHistory(id);
    }
    this.departmentId.set(this.route.snapshot.queryParamMap.get('departmentId'));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEmployee(id: string) {
    this.isLoading.set(true);
    this.employeeService
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.employee.set(data);
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

  loadHistory(id: string) {
    this.isLoadingHistory.set(true);
    this.employeeService
      .getHistory(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.history.set(data);
          this.isLoadingHistory.set(false);
        },
        error: () => {
          this.isLoadingHistory.set(false);
        },
      });
  }

  goBack() {
    this.location.back();
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
