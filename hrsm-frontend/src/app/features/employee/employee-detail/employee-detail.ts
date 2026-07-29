import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Employee } from '../employee';
import { Employee as EmployeeModel } from '../employee-model';
import { Spinner } from '../../../shared/spinner/spinner';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-employee-detail',
  imports: [CommonModule, RouterLink, Spinner],
  templateUrl: './employee-detail.html',
  styleUrl: './employee-detail.css',
})
export class EmployeeDetail implements OnInit, OnDestroy {
  employee = signal<EmployeeModel | null>(null);
  history = signal<any[]>([]);
  isLoading = signal(false);
  isLoadingHistory = signal(false);
  errorMessage = signal('');
  departmentId = signal<string | null>(null);
  private destroy$ = new Subject<void>();

  constructor(private employeeService: Employee, private route: ActivatedRoute, private location: Location) {}

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
          this.errorMessage.set(err.error?.message || 'Không tải được dữ liệu');
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
    if (!dept) return 'Chưa phân phòng';
    return typeof dept === 'object' ? (dept.name || 'Chưa phân phòng') : dept;
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }
}