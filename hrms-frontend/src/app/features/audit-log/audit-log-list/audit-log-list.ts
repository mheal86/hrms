import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuditLog, AuditLogDetails } from '../../../core/models/audit-log-model';
import { Auth } from '../../../core/services/auth';
import { TableSkeleton } from '../../../shared/table-skeleton/table-skeleton';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { DatePicker } from 'primeng/datepicker';
import { Tag } from 'primeng/tag';
import { Dialog } from 'primeng/dialog';
import { CustomSelectComponent } from '../../../shared/custom-select/custom-select';
import { Chip } from 'primeng/chip';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../core/services/language.service';
import { Department as DepartmentService } from '../../../core/services/department.service';

@Component({
  selector: 'app-audit-log-list',
  imports: [
    CommonModule,
    FormsModule,
    TableSkeleton,
    Paginator,
    TableModule,
    Button,
    InputText,
    CustomSelectComponent,
    DatePicker,
    Tag,
    Chip,
    Dialog,
    TranslatePipe,
  ],
  templateUrl: './audit-log-list.html',
  styleUrl: './audit-log-list.scss',
})
export class AuditLogList implements OnInit, OnDestroy {
  auditLogService = inject(AuditLogService);
  departmentService = inject(DepartmentService);
  authService = inject(Auth);
  translate = inject(TranslateService);
  languageService = inject(LanguageService);

  departmentMap = new Map<string, string>();

  logs = signal<AuditLog[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  // Search & Filter state
  searchTerm = '';
  selectedUser: string | null = null;
  selectedAction: string | null = null;
  dateRange: Date[] | null = null;
  startDate: string | undefined = undefined;
  endDate: string | undefined = undefined;

  // Dropdown options
  userOptions = signal<{ label: string; value: string }[]>([]);
  actionOptions = signal<{ label: string; value: string }[]>([]);

  // Columns configuration
  cols = [
    { field: 'createdAt', header: 'AUDIT.COL_TIME', sortable: true },
    { field: 'username', header: 'AUDIT.COL_USER', sortable: true },
    { field: 'action', header: 'AUDIT.COL_ACTION', sortable: true },
    { field: 'targetName', header: 'AUDIT.COL_TARGET', sortable: true },
    { field: 'details', header: 'AUDIT.COL_DETAILS', sortable: false },
  ];

  // Pagination & Sorting state
  currentPage = signal(1);
  totalPages = signal(1);
  total = signal(0);
  pageSize = 7;
  first = 0;
  sortField = 'createdAt';
  sortOrder = 'desc';

  displayDetails = false;
  parsedDetails = signal<
    | { type: 'diff'; diffs: { field: string; before: string; after: string }[] }
    | { type: 'key-value'; pairs: { key: string; value: string }[] }
    | { type: 'simple'; simpleText: string }
    | null
  >(null);

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.loadFilterOptions();
    this.loadLogs();
    this.loadDepartments();
  }

  loadDepartments() {
    this.departmentService
      .getAllUnpaginated()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (depts) => {
          for (const d of depts) {
            if (d._id) {
              this.departmentMap.set(d._id, d.name);
            }
          }
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFilterOptions() {
    // Load actions
    this.auditLogService
      .getActions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (actions) => {
          const options = actions.map((act) => ({
            label: this.translate.instant(`AUDIT.ACTIONS_LIST.${act}`) || act,
            value: act,
          }));
          this.actionOptions.set(options);
        },
      });

    // Load users
    this.auditLogService
      .getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          const options = users.map((u) => ({
            label: u.username,
            value: u._id,
          }));
          this.userOptions.set(options);
        },
      });
  }

  loadLogs() {
    this.isLoading.set(true);
    this.auditLogService
      .getAll({
        search: this.searchTerm.trim(),
        userId: this.selectedUser || undefined,
        action: this.selectedAction || undefined,
        startDate: this.startDate,
        endDate: this.endDate,
        page: this.currentPage(),
        limit: this.pageSize,
        sort: this.sortField,
        order: this.sortOrder,
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          this.logs.set(res.data);
          this.total.set(res.pagination.total);
          this.totalPages.set(res.pagination.totalPages);
        },
        error: (err) => {
          this.errorMessage.set(
            err.error?.message || this.translate.instant('AUDIT.LOAD_ERROR')
          );
        },
      });
  }

  resetAndLoad() {
    this.currentPage.set(1);
    this.first = 0;
    this.loadLogs();
  }

  onPageChange(event: PaginatorState) {
    this.currentPage.set((event.page ?? 0) + 1);
    this.pageSize = event.rows ?? 7;
    this.first = event.first ?? 0;
    this.loadLogs();
  }

  onSort(field: string) {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortOrder = 'desc';
    }
    this.resetAndLoad();
  }

  onDateRangeChange(dates: Date[] | null) {
    if (dates && dates[0]) {
      const start = new Date(dates[0]);
      start.setHours(0, 0, 0, 0);
      this.startDate = start.toISOString();
    } else {
      this.startDate = undefined;
    }

    if (dates && dates[1]) {
      const end = new Date(dates[1]);
      end.setHours(23, 59, 59, 999);
      this.endDate = end.toISOString();
      this.resetAndLoad();
    } else if (dates && dates.length === 2 && !dates[1]) {
      this.endDate = undefined;
    } else {
      this.endDate = undefined;
      this.resetAndLoad();
    }
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedUser = null;
    this.selectedAction = null;
    this.dateRange = null;
    this.startDate = undefined;
    this.endDate = undefined;
    this.resetAndLoad();
  }

  getActionTagConfig(action: string): { severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'; icon: string } {
    switch (action) {
      case 'CREATE_EMPLOYEE':
      case 'CREATE_DEPARTMENT':
        return { severity: 'success', icon: 'pi pi-plus-circle' };
      case 'UPDATE_EMPLOYEE':
      case 'UPDATE_DEPARTMENT':
      case 'UPDATE_USER':
        return { severity: 'warn', icon: 'pi pi-pencil' };
      case 'TRANSFER_EMPLOYEE':
        return { severity: 'contrast', icon: 'pi pi-arrow-right-arrow-left' };
      case 'DELETE_EMPLOYEE':
      case 'DELETE_DEPARTMENT':
        return { severity: 'danger', icon: 'pi pi-trash' };
      case 'CHANGE_PASSWORD':
      case 'CHANGE_PASSWORD_BY_ADMIN':
        return { severity: 'secondary', icon: 'pi pi-key' };
      default:
        return { severity: 'info', icon: 'pi pi-info-circle' };
    }
  }

  parseDetailsData(details?: AuditLogDetails) {
    if (!details) {
      this.parsedDetails.set(null);
      return;
    }

    let data: AuditLogDetails = details;
    if (typeof details === 'string') {
      try {
        data = JSON.parse(details);
      } catch (e) {
        this.parsedDetails.set({ type: 'simple', simpleText: details });
        return;
      }
    }

    if (typeof data !== 'object' || data === null) {
      this.parsedDetails.set({ type: 'simple', simpleText: String(data) });
      return;
    }

    const dataObj = data as Record<string, string | number | boolean | null | undefined | object>;

    const formatVal = (v: string | number | boolean | null | undefined | object, keyName: string): string => {
      if (v === null || v === undefined) return '-';

      if (typeof v === 'object') {
        const obj = v as Record<string, string | number | boolean | null | undefined>;
        if (obj['name']) {
          if (keyName === 'department') {
            return this.languageService.getDepartmentName(String(obj['name']));
          }
          return String(obj['name']);
        }
        return JSON.stringify(v);
      }

      const valStr = String(v);

      // Check if it's a department ID in our map
      if (this.departmentMap.has(valStr)) {
        return this.languageService.getDepartmentName(this.departmentMap.get(valStr));
      }

      if (keyName === 'position') {
        const translatedKey = this.languageService.getPositionTranslation(valStr);
        return this.translate.instant(translatedKey);
      }

      if (
        keyName === 'department' ||
        keyName === 'fromDepartmentName' ||
        keyName === 'toDepartmentName' ||
        keyName === 'fromDepartment' ||
        keyName === 'toDepartment'
      ) {
        return this.languageService.getDepartmentName(valStr);
      }

      if (typeof v === 'boolean') {
        return v ? 'Có' : 'Không';
      }

      return valStr;
    };

    // 1. Check if it is a Diff (has before and after)
    if (
      dataObj['before'] &&
      dataObj['after'] &&
      typeof dataObj['before'] === 'object' &&
      typeof dataObj['after'] === 'object'
    ) {
      const diffs: { field: string; before: string; after: string }[] = [];
      const beforeObj = dataObj['before'] as Record<string, string | number | boolean | null | undefined | object>;
      const afterObj = dataObj['after'] as Record<string, string | number | boolean | null | undefined | object>;

      const excludeKeys = ['_id', '__v', 'createdAt', 'updatedAt', 'password', 'id', 'avatarUrl'];
      const allKeys = Array.from(new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]))
        .filter(key => !excludeKeys.includes(key));

      for (const key of allKeys) {
        const valBefore = beforeObj[key];
        const valAfter = afterObj[key];

        const strBefore = formatVal(valBefore, key);
        const strAfter = formatVal(valAfter, key);

        if (strBefore !== strAfter) {
          diffs.push({
            field: this.translateFieldKey(key),
            before: strBefore,
            after: strAfter
          });
        }
      }

      if (diffs.length > 0) {
        this.parsedDetails.set({ type: 'diff', diffs });
        return;
      }
    }

    // 2. Otherwise render as Key-Value pairs
    const pairs: { key: string; value: string }[] = [];
    const excludeKeys = ['_id', '__v', 'createdAt', 'updatedAt', 'password', 'id', 'avatarUrl'];

    for (const key of Object.keys(dataObj)) {
      if (excludeKeys.includes(key)) continue;
      const val = dataObj[key];
      if (val === null || val === undefined) continue;

      pairs.push({
        key: this.translateFieldKey(key),
        value: formatVal(val, key)
      });
    }

    if (pairs.length > 0) {
      this.parsedDetails.set({ type: 'key-value', pairs });
    } else {
      this.parsedDetails.set({ type: 'simple', simpleText: JSON.stringify(dataObj, null, 2) });
    }
  }

  translateFieldKey(key: string): string {
    const translationKey = `AUDIT.FIELDS.${key}`;
    const translated = this.translate.instant(translationKey);
    return translated !== translationKey ? translated : key;
  }

  showDetails(details?: AuditLogDetails) {
    this.parseDetailsData(details);
    this.displayDetails = true;
  }
}
