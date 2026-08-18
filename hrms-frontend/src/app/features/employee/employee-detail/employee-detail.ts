import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Subject, takeUntil, finalize, merge, of } from 'rxjs';
import { Employee } from '../../../core/services/employee.service';
import { Employee as EmployeeModel, EmployeeHistory, EmployeeStatus } from '../../../core/models/employee-model';
import { Department as DepartmentService } from '../../../core/services/department.service';
import { Department as DepartmentModel } from '../../../core/models/department-model';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuditLog, AuditLogDetails } from '../../../core/models/audit-log-model';
import { Notification } from '../../../core/services/notification';
import { Spinner } from '../../../shared/spinner/spinner';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { Auth } from '../../../core/services/auth';
import { LanguageService } from '../../../core/services/language.service';
import { getInitials } from '../../../core/utils/employee-utils';
import { SelectOption } from '../../../core/models/select-option-model';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { MenuItem } from 'primeng/api';
import { Confirm } from '../../../core/services/confirm';
import {
  validatePhone,
  validateAddress,
  setupNumericInputHook,
} from '../../../core/utils/validators';

import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { AbstractControl } from '@angular/forms';
import { Menu } from 'primeng/menu';
import { Dialog } from 'primeng/dialog';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { Tag } from 'primeng/tag';
import { Select } from 'primeng/select';

@Component({
  selector: 'app-employee-detail',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    Spinner,
    Button,
    TranslatePipe,
    FormlyModule,
    TableModule,
    RouterLink,
    Menu,
    Dialog,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Tag,
    Select,
  ],
  templateUrl: './employee-detail.html',
  styleUrl: './employee-detail.scss',
})
export class EmployeeDetail implements OnInit, OnDestroy {
  // ─── Injected Services ────────────────────────────────────────
  employeeService = inject(Employee);
  departmentService = inject(DepartmentService);
  auditLogService = inject(AuditLogService);
  notificationService = inject(Notification);
  confirmService = inject(Confirm);
  route = inject(ActivatedRoute);
  location = inject(Location);
  translate = inject(TranslateService);
  languageService = inject(LanguageService);
  router = inject(Router);
  authService = inject(Auth);

  // ─── Constants ────────────────────────────────────────────────
  baseUrl = environment.baseUrl;
  getInitials = getInitials;

  // ─── State Signals ────────────────────────────────────────────
  employee = signal<EmployeeModel | undefined>(undefined);
  history = signal<EmployeeHistory[]>([]);
  departmentDetail = signal<DepartmentModel | undefined>(undefined);
  departments = signal<DepartmentModel[]>([]);
  auditLogs = signal<AuditLog[]>([]);

  isLoading = signal(false);
  isLoadingHistory = signal(false);
  isLoadingAuditLogs = signal(false);
  isEditingPersonal = signal(false);
  isEditingDepartment = signal(false);
  isSavingPersonal = signal(false);
  isSavingDepartment = signal(false);
  errorMessage = signal('');
  departmentId = signal<string | undefined>(undefined);
  activeTab = signal<string>('0');
  actionItems = signal<MenuItem[]>([]);

  historyCols = [
    { field: 'fromDepartment', header: 'EMPLOYEE.HISTORY_COL_OLD' },
    { field: 'toDepartment', header: 'EMPLOYEE.HISTORY_COL_NEW' },
    { field: 'transferDate', header: 'EMPLOYEE.HISTORY_COL_DATE' },
  ];

  // ─── Audit Log Detail Dialog ──────────────────────────────────
  showDetailsDialog = false;
  selectedDetails: AuditLogDetails = null;
  parsedDetails = signal<
    | { type: 'diff'; diffs: { field: string; before: string; after: string }[] }
    | { type: 'key-value'; pairs: { key: string; value: string }[] }
    | { type: 'simple'; simpleText: string }
    | null
  >(null);
  departmentMap = new Map<string, string>();

  // ─── Transfer Department Dialog ────────────────────────────────
  showTransferDialog = false;
  selectedTransferDeptId = '';
  isTransferring = signal<boolean>(false);

  // ─── Formly Forms ─────────────────────────────────────────────
  personalForm = new FormGroup({});
  personalModel: Record<string, unknown> = {};
  personalFields: FormlyFieldConfig[] = [];

  departmentForm = new FormGroup({});
  departmentModel: Record<string, unknown> = {};
  departmentFields: FormlyFieldConfig[] = [];

  destroy$ = new Subject<void>();

  // ─── Options ──────────────────────────────────────────────────
  get genderOptions(): SelectOption[] {
    return [
      { label: this.translate.instant('EMPLOYEE.GENDER_MALE'), value: 'MALE' },
      { label: this.translate.instant('EMPLOYEE.GENDER_FEMALE'), value: 'FEMALE' },
      { label: this.translate.instant('EMPLOYEE.GENDER_OTHER'), value: 'OTHER' },
    ];
  }

  get positionOptions(): SelectOption[] {
    const positions = ['Nhân viên', 'Trưởng nhóm', 'Trưởng phòng', 'Phó phòng', 'Phó giám đốc', 'Giám đốc', 'Thực tập sinh'];
    return positions.map((p) => ({
      label: this.translate.instant(this.languageService.getPositionTranslation(p)),
      value: p,
    }));
  }

  get departmentOptions(): SelectOption[] {
    return this.departments().map((d) => ({
      label: this.languageService.getDepartmentName(d.name),
      value: d._id || '',
    }));
  }

  // ─── Lifecycle ────────────────────────────────────────────────
  ngOnInit() {
    this.departmentId.set(this.route.snapshot.queryParamMap.get('departmentId') ?? undefined);

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEmployee(id);
      this.loadHistory(id);
      this.loadAuditLogs(id);
    }

    this.loadDepartments();

    merge(of(null), this.translate.onLangChange)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.initFormFields();
        this.initActionItems();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Field Initialization ─────────────────────────────────────
  initFormFields() {
    this.initPersonalFields();
    this.initDepartmentFields();
  }

  initPersonalFields() {
    this.personalFields = [
      {
        fieldGroupClassName: 'row mb-2',
        fieldGroup: [
          {
            className: 'col-md-6',
            key: 'firstName',
            type: 'input',
            props: {
              label: this.translate.instant('FORM.FIRST_NAME'),
              required: true,
              disabled: true,
            },
          },
          {
            className: 'col-md-6',
            key: 'lastName',
            type: 'input',
            props: {
              label: this.translate.instant('FORM.LAST_NAME'),
              required: true,
              disabled: true,
            },
          },
        ],
      },
      {
        fieldGroupClassName: 'row mb-2',
        fieldGroup: [
          {
            className: 'col-md-6',
            key: 'gender',
            type: 'custom-select',
            props: {
              label: this.translate.instant('FORM.GENDER'),
              required: true,
              placeholder: this.translate.instant('FORM.GENDER_PLACEHOLDER'),
              options: this.genderOptions,
              disabled: true,
            },
          },
          {
            className: 'col-md-6',
            key: 'dateOfBirth',
            type: 'custom-datepicker',
            props: {
              label: this.translate.instant('FORM.DOB'),
              required: true,
              disabled: true,
            },
            validators: {
              futureDate: {
                expression: (c: AbstractControl) => !c.value || new Date(c.value) <= new Date(),
              },
              ageRange: {
                expression: (c: AbstractControl) => {
                  if (!c.value) return true;
                  const birthDate = new Date(c.value);
                  const today = new Date();
                  let age = today.getFullYear() - birthDate.getFullYear();
                  const monthDiff = today.getMonth() - birthDate.getMonth();
                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                  }
                  return age >= 18 && age <= 65;
                },
              },
            },
          },
        ],
      },
      {
        fieldGroupClassName: 'row mb-2',
        fieldGroup: [
          {
            className: 'col-md-6',
            key: 'phone',
            type: 'input',
            props: {
              label: this.translate.instant('EMPLOYEE.FIELD_PHONE'),
              placeholder: '0912345678',
              maxLength: 10,
            },
            hooks: { onInit: setupNumericInputHook(this.destroy$) },
            validators: {
              phone: {
                expression: (c: AbstractControl) => validatePhone(c.value),
              },
            },
          },
          {
            className: 'col-md-6',
            key: 'address',
            type: 'input',
            props: { label: this.translate.instant('EMPLOYEE.FIELD_ADDRESS') },
            validators: {
              address: {
                expression: (c: AbstractControl) => validateAddress(c.value),
              },
            },
          },
        ],
      },
    ];
  }

  initDepartmentFields() {
    this.departmentFields = [
      {
        fieldGroupClassName: 'row mb-2',
        fieldGroup: [
          {
            className: 'col-md-6',
            key: 'position',
            type: 'custom-select',
            props: {
              label: this.translate.instant('FORM.POSITION'),
              required: true,
              placeholder: this.translate.instant('FORM.POSITION_PLACEHOLDER'),
              options: this.positionOptions,
            },
          },
          {
            className: 'col-md-6',
            key: 'department',
            type: 'custom-select',
            props: {
              label: this.translate.instant('FORM.DEPARTMENT'),
              required: true,
              placeholder: this.translate.instant('FORM.DEPARTMENT_PLACEHOLDER'),
              options: this.departmentOptions,
            },
          },
        ],
      },
    ];
  }

  updateDepartmentFieldOptions() {
    const field = this.findFieldByKey(this.departmentFields, 'department');
    if (field?.props) {
      field.props['options'] = this.departmentOptions;
    }
  }

  findFieldByKey(fields: FormlyFieldConfig[], key: string): FormlyFieldConfig | null {
    for (const f of fields) {
      if (f.key === key) return f;
      if (f.fieldGroup) {
        const found = this.findFieldByKey(f.fieldGroup, key);
        if (found) return found;
      }
    }
    return null;
  }

  // ─── Data Loading ─────────────────────────────────────────────
  loadEmployee(id: string) {
    this.isLoading.set(true);
    this.employeeService
      .getById(id)
      .pipe(takeUntil(this.destroy$), finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.employee.set(data);
          this.initActionItems();
          this.syncPersonalModel(data);
          this.syncDepartmentModel(data);
          const deptId = (data.department && typeof data.department === 'object') ? data.department._id : data.department;
          if (deptId) this.loadDepartmentDetail(deptId);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || this.translate.instant('EMPLOYEE.LOAD_ERROR'));
        },
      });
  }

  loadHistory(id: string) {
    this.isLoadingHistory.set(true);
    this.employeeService
      .getHistory(id)
      .pipe(takeUntil(this.destroy$), finalize(() => this.isLoadingHistory.set(false)))
      .subscribe({
        next: (data) => this.history.set(data),
        error: (err) => {
          this.errorMessage.set(err.error?.message || this.translate.instant('EMPLOYEE.LOAD_ERROR'));
        },
      });
  }

  loadAuditLogs(employeeId: string) {
    this.isLoadingAuditLogs.set(true);
    this.auditLogService
      .getAll({ targetId: employeeId, limit: 50, sort: 'createdAt', order: 'desc' })
      .pipe(takeUntil(this.destroy$), finalize(() => this.isLoadingAuditLogs.set(false)))
      .subscribe({
        next: (res) => this.auditLogs.set(res.data),
        error: () => {
          this.auditLogs.set([]);
          this.notificationService.error(this.translate.instant('AUDIT.LOAD_ERROR'));
        },
      });
  }

  loadDepartmentDetail(deptId: string) {
    this.departmentService
      .getById(deptId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dept) => this.departmentDetail.set(dept),
        error: () => this.notificationService.error(this.translate.instant('DEPARTMENT.LOAD_ERROR')),
      });
  }

  loadDepartments() {
    this.departmentService
      .getAllUnpaginated()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.departments.set(data);
          for (const d of data) {
            if (d._id) {
              this.departmentMap.set(d._id, d.name);
            }
          }
          this.updateDepartmentFieldOptions();
        },
        error: () => this.notificationService.error(this.translate.instant('DEPARTMENT.LOAD_ERROR')),
      });
  }

  // ─── Form Model Sync ──────────────────────────────────────────
  syncPersonalModel(emp: EmployeeModel) {
    this.personalModel = {
      firstName: emp.firstName,
      lastName: emp.lastName,
      gender: emp.gender,
      dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth) : null,
      phone: emp.phone ?? '',
      address: emp.address ?? '',
    };
  }

  syncDepartmentModel(emp: EmployeeModel) {
    const deptId = (emp.department && typeof emp.department === 'object') ? emp.department._id : emp.department;
    this.departmentModel = {
      position: emp.position ?? '',
      department: deptId ?? '',
    };
  }

  // ─── Inline Edit Actions ──────────────────────────────────────
  startEditPersonal() {
    const emp = this.employee();
    if (emp) this.syncPersonalModel(emp);
    this.isEditingPersonal.set(true);
  }

  cancelEditPersonal() {
    this.isEditingPersonal.set(false);
  }

  savePersonalInfo() {
    this.personalForm.markAllAsTouched();
    if (this.personalForm.invalid) return;

    const emp = this.employee();
    if (!emp?._id) return;
    const empId = emp._id;

    this.isSavingPersonal.set(true);
    const rawValue = this.personalForm.getRawValue() as Record<string, unknown>;
    const payload: Partial<EmployeeModel> = {
      ...rawValue,
      dateOfBirth: rawValue['dateOfBirth'] instanceof Date
        ? (rawValue['dateOfBirth'] as Date).toISOString().substring(0, 10)
        : (rawValue['dateOfBirth'] as string | undefined),
    } as Partial<EmployeeModel>;

    this.employeeService
      .update(empId, payload)
      .pipe(takeUntil(this.destroy$), finalize(() => this.isSavingPersonal.set(false)))
      .subscribe({
        next: (updated) => {
          this.employee.set(updated);
          this.initActionItems();
          this.syncPersonalModel(updated);
          this.isEditingPersonal.set(false);
          this.notificationService.success(this.translate.instant('EMPLOYEE.UPDATE_SUCCESS'));
          this.reloadAuditLogs(empId);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || this.translate.instant('EMPLOYEE.SAVE_ERROR'));
        },
      });
  }

  startEditDepartment() {
    const emp = this.employee();
    if (emp) this.syncDepartmentModel(emp);
    this.isEditingDepartment.set(true);
  }

  cancelEditDepartment() {
    this.isEditingDepartment.set(false);
  }

  onTabChange(value: unknown) {
    if (value !== undefined && value !== null) {
      this.activeTab.set(String(value));
    }
  }

  saveDepartmentInfo() {
    this.departmentForm.markAllAsTouched();
    if (this.departmentForm.invalid) return;

    const emp = this.employee();
    if (!emp?._id) return;
    const empId = emp._id;

    this.isSavingDepartment.set(true);
    const payload = this.departmentForm.getRawValue() as Partial<EmployeeModel>;

    this.employeeService
      .update(empId, payload)
      .pipe(takeUntil(this.destroy$), finalize(() => this.isSavingDepartment.set(false)))
      .subscribe({
        next: (updated) => {
          this.employee.set(updated);
          this.initActionItems();
          this.syncDepartmentModel(updated);
          this.isEditingDepartment.set(false);

          const newDeptId = (updated.department && typeof updated.department === 'object') ? updated.department._id : updated.department;
          if (newDeptId) this.loadDepartmentDetail(newDeptId);

          this.notificationService.success(this.translate.instant('EMPLOYEE.UPDATE_SUCCESS'));
          this.reloadAuditLogs(empId);
          this.loadHistory(empId);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || this.translate.instant('EMPLOYEE.SAVE_ERROR'));
        },
      });
  }

  reloadAuditLogs(employeeId: string) {
    this.auditLogService
      .getAll({ targetId: employeeId, limit: 50, sort: 'createdAt', order: 'desc' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.auditLogs.set(res.data),
        error: () => {
          this.auditLogs.set([]);
          this.notificationService.error(this.translate.instant('AUDIT.LOAD_ERROR'));
        },
      });
  }

  // ─── Navigation ───────────────────────────────────────────────
  goBack() {
    this.location.back();
  }

  // ─── Audit Log Helpers ────────────────────────────────────────
  openDetails(details?: AuditLogDetails) {
    this.selectedDetails = details;
    this.parseDetailsData(details);
    this.showDetailsDialog = true;
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

  getActionSeverity(action: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severityMap: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      CREATE_EMPLOYEE: 'success',
      UPDATE_EMPLOYEE: 'info',
      DELETE_EMPLOYEE: 'danger',
      TRANSFER_EMPLOYEE: 'warn',
    };
    return severityMap[action] ?? 'secondary';
  }

  isActiveEmployee(): boolean {
    return this.employee()?.status === EmployeeStatus.ACTIVE;
  }

  getDepartmentName(emp: EmployeeModel): string {
    return this.languageService.getDepartmentName(emp.department);
  }

  getDepartmentManagerName(): string {
    return this.translate.instant('EMPLOYEE.DEPT_MANAGER_VAL');
  }

  getJoinedDepartmentDate(): string | null {
    const hist = this.history();
    if (hist.length > 0) {
      return hist[0].transferDate;
    }
    return this.employee()?.hireDate ?? null;
  }

  initActionItems() {
    const items: MenuItem[] = [];

    items.push({
      label: this.translate.instant('EMPLOYEE.EDIT_INFO_BTN'),
      icon: 'pi pi-pencil',
      command: () => {
        this.router.navigate(['/employees/edit', this.employee()?._id], {
          queryParams: { departmentId: this.departmentId(), fromDetail: true }
        });
      }
    });

    items.push({
      label: this.translate.instant('EMPLOYEE.EDIT_PERSONAL_BTN'),
      icon: 'pi pi-user-edit',
      command: () => {
        this.activeTab.set('1'); // Switch to Personal Info tab
        this.startEditPersonal();
      }
    });

    items.push({
      label: this.translate.instant('EMPLOYEE.EDIT_DEPT_BTN'),
      icon: 'pi pi-pencil',
      command: () => {
        this.activeTab.set('2'); // Switch to Department Info tab
        this.startEditDepartment();
      }
    });

    if (this.authService.isAdmin()) {
      items.push({
        label: this.translate.instant('EMPLOYEE.TRANSFER_TITLE'),
        icon: 'pi pi-arrow-right-arrow-left',
        command: () => {
          this.openTransferDialog();
        }
      });
    }

    items.push({
      separator: true
    });

    items.push({
      label: this.translate.instant('COMMON.DELETE'),
      icon: 'pi pi-trash',
      disabled: this.employee()?.status === EmployeeStatus.ACTIVE,
      styleClass: 'text-danger',
      command: () => {
        this.deleteEmployee();
      }
    });

    this.actionItems.set(items);
  }

  getCurrentDepartmentId(): string {
    const dept = this.employee()?.department;
    if (!dept) return '';
    return typeof dept === 'string' ? dept : dept._id;
  }

  filteredDepartmentOptions(): SelectOption[] {
    const currentId = this.getCurrentDepartmentId();
    return this.departmentOptions.filter((opt) => opt.value !== currentId);
  }

  openTransferDialog() {
    this.selectedTransferDeptId = '';
    this.showTransferDialog = true;
  }

  async confirmTransfer() {
    const emp = this.employee();
    if (!emp?._id || !this.selectedTransferDeptId) return;
    const empId = emp._id;

    // Check confirmation first as requested
    const confirmed = await this.confirmService.ask(
      this.translate.instant('EMPLOYEE.TRANSFER_CONFIRM_MSG', {
        name: `${emp.firstName} ${emp.lastName}`,
        dept: this.departmentOptions.find(d => d.value === this.selectedTransferDeptId)?.label || ''
      })
    );

    if (!confirmed) return;

    this.isTransferring.set(true);
    // Call update API to change department
    const payload = {
      department: this.selectedTransferDeptId
    };

    this.employeeService.update(empId, payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isTransferring.set(false))
      )
      .subscribe({
        next: (updated) => {
          this.employee.set(updated);
          this.showTransferDialog = false;
          this.loadHistory(empId);
          this.loadAuditLogs(empId);
          this.notificationService.success(this.translate.instant('EMPLOYEE.TRANSFER_SUCCESS'));
          this.initActionItems();
          // Also sync the department form model so the form stays updated
          this.syncDepartmentModel(updated);
        },
        error: (err) => {
          this.notificationService.error(err.error?.message || this.translate.instant('EMPLOYEE.SAVE_ERROR'));
        }
      });
  }

  async deleteEmployee() {
    const emp = this.employee();
    if (!emp?._id) return;
    const empId = emp._id;

    const confirmed = await this.confirmService.ask(
      this.translate.instant('EMPLOYEE.DELETE_CONFIRM', { name: `${emp.firstName} ${emp.lastName}` })
    );

    if (confirmed) {
      this.employeeService.delete(empId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.success(this.translate.instant('EMPLOYEE.DELETE_SUCCESS'));
            this.router.navigate(['/employees']);
          },
          error: (err) => {
            this.errorMessage.set(err.error?.message || this.translate.instant('EMPLOYEE.DELETE_ERROR'));
          }
        });
    }
  }
}
