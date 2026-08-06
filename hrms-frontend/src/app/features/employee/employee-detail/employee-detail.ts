import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Employee } from '../../../core/services/employee.service';
import { Employee as EmployeeModel, EmployeeHistory } from '../../../core/models/employee-model';
import { Spinner } from '../../../shared/spinner/spinner';
import { Subject, takeUntil, finalize } from 'rxjs';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { LanguageService } from '../../../core/services/language.service';
import { getInitials } from '../../../core/utils/employee-utils';

@Component({
  selector: 'app-employee-detail',
  imports: [CommonModule, RouterLink, Spinner, Button, TableModule, TranslatePipe],
  templateUrl: './employee-detail.html',
  styleUrl: './employee-detail.scss',
})
export class EmployeeDetail implements OnInit, OnDestroy {
  employeeService = inject(Employee);
  route = inject(ActivatedRoute);
  location = inject(Location);
  translate = inject(TranslateService);
  languageService = inject(LanguageService);

  baseUrl = environment.baseUrl;
  employee = signal<EmployeeModel | undefined>(undefined);
  history = signal<EmployeeHistory[]>([]);
  isLoading = signal(false);
  isLoadingHistory = signal(false);
  errorMessage = signal('');
  departmentId = signal<string | undefined>(undefined);
  historyCols = [
    { field: 'fromDepartment', header: 'EMPLOYEE.HISTORY_COL_OLD' },
    { field: 'toDepartment', header: 'EMPLOYEE.HISTORY_COL_NEW' },
    { field: 'transferDate', header: 'EMPLOYEE.HISTORY_COL_DATE' },
  ];
  destroy$ = new Subject<void>();

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEmployee(id);
      this.loadHistory(id);
    }
    this.departmentId.set(this.route.snapshot.queryParamMap.get('departmentId') ?? undefined);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEmployee(id: string) {
    this.isLoading.set(true);
    this.employeeService
      .getById(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (data) => {
          this.employee.set(data);
        },
        error: (err) => {
          this.errorMessage.set(
            err.error?.message || this.translate.instant('EMPLOYEE.LOAD_ERROR'),
          );
        },
      });
  }

  loadHistory(id: string) {
    this.isLoadingHistory.set(true);
    this.employeeService
      .getHistory(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingHistory.set(false))
      )
      .subscribe({
        next: (data) => {
          this.history.set(data);
        },
        error: (err) => {
          this.errorMessage.set(
            err.error?.message || this.translate.instant('EMPLOYEE.LOAD_ERROR'),
          );
        },
      });
  }

  goBack() {
    this.location.back();
  }

  getInitials = getInitials;
}
