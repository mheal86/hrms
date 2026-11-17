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
import { ExportService } from '../../../core/services/export.service';
import { Dialog } from 'primeng/dialog';
import { ProgressBar } from 'primeng/progressbar';
import { Tag } from 'primeng/tag';
import * as XLSX from 'xlsx';
import { validatePhone, validateAddress, validateGmail } from '../../../core/utils/validators';

export interface ImportPreviewRow {
  rowNumber: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  dob: string;
  hireDate: string;
  department: string;
  position: string;
  status: string;
  isValid: boolean;
  errors: string[];
}

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
    Dialog,
    ProgressBar,
    Tag,
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
  exportService = inject(ExportService);

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
  pageSize = 10;
  first = 0;
  sortField = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  exportItems: MenuItem[] = [];
  menuItems: MenuItem[] = [];
  getInitials = getInitials;
  destroy$ = new Subject<void>();

  // ─── PROPERTIES CHO EXCEL IMPORT ──────────────────────────────────
  importDialogVisible = signal(false);
  selectedFile: File | null = null;
  isDragOver = false;
  isValidating = signal(false);
  isImporting = signal(false);
  importProgress = signal(0);
  isDataChecked = signal(false);

  importPreviewData: ImportPreviewRow[] = [];
  dbEmails: Set<string> = new Set();

  totalImportRows = signal(0);
  validImportRows = signal(0);
  invalidImportRows = signal(0);

  ngOnInit() {
    this.loadDepartmentsForFilter();
    this.loadEmployees();
    this.initExportMenu();

    this.translate.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.initExportMenu());
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
    this.pageSize = event.rows ?? 7;
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

  initExportMenu() {
    this.exportItems = [
      {
        label: this.translate.instant('COMMON.EXPORT_EXCEL_FILTERED'),
        icon: 'pi pi-file-excel',
        command: () => this.onExport('excel', true),
      },
      {
        label: this.translate.instant('COMMON.EXPORT_EXCEL_ALL'),
        icon: 'pi pi-file-excel',
        command: () => this.onExport('excel', false),
      },
      {
        label: this.translate.instant('COMMON.EXPORT_PDF_FILTERED'),
        icon: 'pi pi-file-pdf',
        command: () => this.onExport('pdf', true),
      },
      {
        label: this.translate.instant('COMMON.EXPORT_PDF_ALL'),
        icon: 'pi pi-file-pdf',
        command: () => this.onExport('pdf', false),
      },
    ];
  }

  onExport(format: 'excel' | 'pdf', filteredOnly: boolean) {
    const limit = this.total() || 1000;
    const search = filteredOnly ? this.searchTerm : '';
    const department = filteredOnly ? this.departmentFilter : '';
    const status = filteredOnly ? this.statusFilter : '';

    this.employeeService
      .getAll(
        1,
        limit,
        search,
        this.sortField,
        this.sortOrder,
        department,
        status,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (!res.data || res.data.length === 0) {
            this.notificationService.error(this.translate.instant('COMMON.NO_DATA'));
            return;
          }
          this.executeExport(format, res.data);
        },
        error: (err) => {
          this.notificationService.error(
            err.error?.message || this.translate.instant('COMMON.EXPORT_ERROR')
          );
        },
      });
  }

  executeExport(format: 'excel' | 'pdf', data: EmployeeModel[]) {
    const headers = [
      this.translate.instant('EMPLOYEE.COL_FULL_NAME'),
      this.translate.instant('EMPLOYEE.COL_EMAIL'),
      this.translate.instant('EMPLOYEE.COL_DEPARTMENT'),
      this.translate.instant('EMPLOYEE.COL_POSITION'),
      this.translate.instant('EMPLOYEE.COL_STATUS'),
    ];

    const rows = data.map((emp) => [
      `${emp.firstName} ${emp.lastName}`,
      emp.email || '',
      this.languageService.getDepartmentName(emp.department),
      this.translate.instant(this.languageService.getPositionTranslation(emp.position)),
      emp.status === 'ACTIVE'
        ? this.translate.instant('COMMON.ACTIVE')
        : this.translate.instant('COMMON.INACTIVE'),
    ]);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `Danh_sach_nhan_vien_${timestamp}`;

    if (format === 'excel') {
      try {
        this.exportService.exportExcel(fileName, headers, rows);
        this.notificationService.success(this.translate.instant('COMMON.EXPORT_SUCCESS'));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '';
        this.notificationService.error(
          errorMsg || this.translate.instant('COMMON.EXPORT_ERROR')
        );
      }
    } else {
      const title = this.translate.instant('ROUTE_TITLE.EMPLOYEES');
      this.exportService
        .exportPDF(fileName, title, headers, rows)
        .then(() => {
          this.notificationService.success(this.translate.instant('COMMON.EXPORT_SUCCESS'));
        })
        .catch((err) => {
          this.notificationService.error(
            err.message || this.translate.instant('COMMON.EXPORT_ERROR')
          );
        });
    }
  }

  // ─── METHODS CHO EXCEL IMPORT ─────────────────────────────────────
  showImportDialog() {
    this.importDialogVisible.set(true);
    this.selectedFile = null;
    this.importPreviewData = [];
    this.isDataChecked.set(false);
    this.totalImportRows.set(0);
    this.validImportRows.set(0);
    this.invalidImportRows.set(0);
    this.loadDbEmailsForValidation();
  }

  loadDbEmailsForValidation() {
    this.employeeService.getAll(1, 100000)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.dbEmails = new Set(res.data.map((e) => e.email.toLowerCase()));
        },
        error: (err) => {
          this.notificationService.error(
            err.error?.message || this.translate.instant('EMPLOYEE_IMPORT.ERRORS.LOAD_EMAIL_FAILED')
          );
        }
      });
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file: File) {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      this.notificationService.error(this.translate.instant('EMPLOYEE_IMPORT.ERRORS.INVALID_FORMAT'));
      return;
    }
    this.selectedFile = file;
    this.importPreviewData = [];
    this.isDataChecked.set(false);
    this.totalImportRows.set(0);
    this.validImportRows.set(0);
    this.invalidImportRows.set(0);
  }

  getFileSizeString(bytes?: number): string {
    if (bytes === undefined) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  downloadTemplate() {
    const headers = [
      'Full Name',
      'Email',
      'Phone Number',
      'Address',
      'Gender',
      'Date of Birth',
      'Hire Date',
      'Department',
      'Position',
      'Status'
    ];

    const isEn = this.languageService.currentLang() === 'en';
    const rows = isEn ? [
      [
        'Nguyen Van A',
        'nguyenvana@gmail.com',
        '0912345678',
        '123 Nguyen Trai, Q1, HCMC',
        'Male',
        '1995-05-15',
        '2026-01-01',
        'Human Resources Department',
        'Staff',
        'Active'
      ],
      [
        'Jane Doe',
        'janedoe@gmail.com',
        '0987654321',
        '456 Le Loi, Q1, HCMC',
        'Female',
        '1998-10-20',
        '2026-02-15',
        'IT & Technical Department',
        'Team Leader',
        'Active'
      ]
    ] : [
      [
        'Nguyen Van A',
        'nguyenvana@gmail.com',
        '0912345678',
        '123 Nguyen Trai, Q1, HCMC',
        'Nam',
        '1995-05-15',
        '2026-01-01',
        'Phòng Nhân sự',
        'Nhân viên',
        'Hoạt động'
      ],
      [
        'Jane Doe',
        'janedoe@gmail.com',
        '0987654321',
        '456 Le Loi, Q1, HCMC',
        'Nữ',
        '1998-10-20',
        '2026-02-15',
        'Phòng Công nghệ thông tin',
        'Trưởng nhóm',
        'Hoạt động'
      ]
    ];

    const fileName = 'employee_import_template';
    try {
      this.exportService.exportExcel(fileName, headers, rows);
    } catch (err) {
      this.notificationService.error(this.translate.instant('COMMON.EXPORT_ERROR'));
    }
  }

  matchDepartmentLocal(deptStr: string): DepartmentModel | null {
    if (!deptStr) return null;
    const normalizedInput = deptStr.trim().toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const mappings = [
      { keys: ['hr', 'human resources', 'nhan su'], val: 'Nhân sự' },
      { keys: ['tech', 'it', 'information technology', 'cong nghe thong tin', 'cntt'], val: 'Công nghệ thông tin' },
      { keys: ['finance', 'accounting', 'ke toan'], val: 'Kế toán' },
      { keys: ['marketing'], val: 'Marketing' },
      { keys: ['sales', 'kinh doanh'], val: 'Kinh doanh' },
      { keys: ['admin', 'administration', 'hanh chinh'], val: 'Hành chính' },
      { keys: ['r&d', 'research', 'development', 'nghien cuu'], val: 'Nghiên cứu & Phát triển' },
      { keys: ['project', 'quan ly du an'], val: 'Quản lý dự án' },
      { keys: ['customer service', 'support', 'cham soc khach hang'], val: 'Chăm sóc khách hàng' },
      { keys: ['legal', 'phap che'], val: 'Pháp chế' },
      { keys: ['design', 'thiet ke'], val: 'Thiết kế' },
      { keys: ['training', 'dao tao'], val: 'Đào tạo' }
    ];

    let matchedVal: string | null = null;
    for (const item of mappings) {
      if (item.keys.some(k => normalizedInput.includes(k) || k.includes(normalizedInput))) {
        matchedVal = item.val;
        break;
      }
    }

    const currentDepts = this.departments();
    for (const dept of currentDepts) {
      const dbName = dept.name;
      const normalizedDbName = dbName.toLowerCase().trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      if (normalizedDbName === normalizedInput) {
        return dept;
      }
      if (matchedVal) {
        const normalizedMapped = matchedVal.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalizedDbName.includes(normalizedMapped) || normalizedMapped.includes(normalizedDbName)) {
          return dept;
        }
      }
      if (normalizedDbName.includes(normalizedInput) || normalizedInput.includes(normalizedDbName)) {
        return dept;
      }
    }

    return null;
  }

  validateImportData() {
    if (!this.selectedFile) return;

    this.isValidating.set(true);
    this.importProgress.set(10);

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        this.importProgress.set(40);
        const result = e.target?.result;
        if (!(result instanceof ArrayBuffer)) {
          throw new Error('Invalid file content');
        }
        const data = new Uint8Array(result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

        this.importProgress.set(70);

        if (rawRows.length === 0) {
          this.notificationService.error(this.translate.instant('EMPLOYEE_IMPORT.ERRORS.EMPTY_FILE'));
          this.isValidating.set(false);
          return;
        }

        const headers = Object.keys(rawRows[0]).map(h => h.trim().toLowerCase());
        const hasFullName = headers.includes('full name');
        const hasEmail = headers.includes('email');

        if (!hasFullName || !hasEmail) {
          this.notificationService.error(this.translate.instant('EMPLOYEE_IMPORT.ERRORS.MISSING_HEADERS'));
          this.isValidating.set(false);
          return;
        }

        const previewRows: ImportPreviewRow[] = [];
        const emailsInFile = new Set<string>();

        let validCount = 0;
        let invalidCount = 0;

        rawRows.forEach((row, index) => {
          const rowIndex = index + 2;

          let fullNameVal = '';
          let emailVal = '';
          let phoneVal = '';
          let addressVal = '';
          let genderVal = '';
          let dobVal: Date | string | number | null = null;
          let hireDateVal: Date | string | number | null = null;
          let departmentVal = '';
          let positionVal = '';
          let statusVal = '';

          for (const [key, value] of Object.entries(row)) {
            const normKey = key.trim().toLowerCase();
            if (normKey === 'full name') fullNameVal = String(value).trim();
            else if (normKey === 'email') emailVal = String(value).trim().toLowerCase();
            else if (normKey === 'phone number' || normKey === 'phone') phoneVal = String(value).trim();
            else if (normKey === 'address') addressVal = String(value).trim();
            else if (normKey === 'gender') genderVal = String(value).trim();
            else if (normKey === 'date of birth') dobVal = value as Date | string | number | null;
            else if (normKey === 'hire date') hireDateVal = value as Date | string | number | null;
            else if (normKey === 'department') departmentVal = String(value).trim();
            else if (normKey === 'position') positionVal = String(value).trim();
            else if (normKey === 'status') statusVal = String(value).trim();
          }

          if (!fullNameVal && !emailVal && !departmentVal && !positionVal) {
            return;
          }

          const rowErrors: string[] = [];

          if (!fullNameVal) {
            rowErrors.push(this.translate.instant('EMPLOYEE_IMPORT.ERRORS.REQUIRED_FULL_NAME'));
          }

          if (!emailVal) {
            rowErrors.push(this.translate.instant('EMPLOYEE_IMPORT.ERRORS.REQUIRED_EMAIL'));
          } else if (!validateGmail(emailVal)) {
            rowErrors.push(this.translate.instant('EMPLOYEE_IMPORT.ERRORS.INVALID_EMAIL'));
          } else if (emailsInFile.has(emailVal)) {
            rowErrors.push(this.translate.instant('EMPLOYEE_IMPORT.ERRORS.DUPLICATE_EMAIL_FILE'));
          } else {
            emailsInFile.add(emailVal);
            if (this.dbEmails.has(emailVal)) {
              rowErrors.push(this.translate.instant('EMPLOYEE_IMPORT.ERRORS.DUPLICATE_EMAIL_DB'));
            }
          }

          if (phoneVal && !validatePhone(phoneVal)) {
            rowErrors.push(this.translate.instant('EMPLOYEE_IMPORT.ERRORS.INVALID_PHONE'));
          }

          if (addressVal && !validateAddress(addressVal)) {
            rowErrors.push(this.translate.instant('EMPLOYEE_IMPORT.ERRORS.INVALID_ADDRESS'));
          }

          if (genderVal) {
            const g = genderVal.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (!['nam', 'nữ', 'khác', 'male', 'female', 'other', 'm', 'f', 'o', 'nu', 'khac'].includes(g)) {
              rowErrors.push(this.translate.instant('EMPLOYEE_IMPORT.ERRORS.INVALID_GENDER'));
            }
          }

          if (dobVal) {
            const parsedDob = new Date(dobVal);
            if (isNaN(parsedDob.getTime())) {
              rowErrors.push(this.translate.instant('EMPLOYEE_IMPORT.ERRORS.INVALID_DOB'));
            } else {
              const today = new Date();
              if (parsedDob > today) {
                rowErrors.push(this.translate.instant('EMPLOYEE_IMPORT.ERRORS.FUTURE_DOB'));
              } else {
                let age = today.getFullYear() - parsedDob.getFullYear();
                const m = today.getMonth() - parsedDob.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < parsedDob.getDate())) {
                  age--;
                }
                if (age < 18 || age > 65) {
                  rowErrors.push(this.translate.instant('EMPLOYEE_IMPORT.ERRORS.AGE_RANGE'));
                }
              }
            }
          }

          if (hireDateVal) {
            const parsedHire = new Date(hireDateVal);
            if (isNaN(parsedHire.getTime())) {
              rowErrors.push(this.translate.instant('EMPLOYEE_IMPORT.ERRORS.INVALID_HIRE_DATE'));
            }
          }

          let deptObj = null;
          if (!departmentVal) {
            rowErrors.push(this.translate.instant('EMPLOYEE_IMPORT.ERRORS.INVALID_DEPARTMENT'));
          } else {
            deptObj = this.matchDepartmentLocal(departmentVal);
            if (!deptObj) {
              rowErrors.push(this.translate.instant('EMPLOYEE_IMPORT.ERRORS.INVALID_DEPARTMENT'));
            }
          }

          if (positionVal) {
            const p = positionVal.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const allowed = [
              'nhân viên', 'trưởng nhóm', 'trưởng phòng', 'phó phòng', 'phó giám đốc', 'giám đốc', 'thực tập sinh',
              'staff', 'employee', 'team leader', 'leader', 'department head', 'dept head', 'deputy head', 'dept deputy',
              'deputy general director', 'deputy gd', 'general director', 'gd', 'intern', 'nhan vien', 'truong nhom', 'truong phong', 'pho phong', 'pho giam doc', 'giam doc', 'thuc tap sinh'
            ];
            if (!allowed.includes(p)) {
              rowErrors.push(this.translate.instant('EMPLOYEE_IMPORT.ERRORS.INVALID_POSITION'));
            }
          }

          const isValid = rowErrors.length === 0;
          if (isValid) {
            validCount++;
          } else {
            invalidCount++;
          }

          previewRows.push({
            rowNumber: rowIndex,
            fullName: fullNameVal,
            email: emailVal,
            phone: phoneVal,
            address: addressVal,
            gender: genderVal,
            dob: dobVal ? (dobVal instanceof Date ? dobVal.toISOString().slice(0, 10) : String(dobVal)) : '',
            hireDate: hireDateVal ? (hireDateVal instanceof Date ? hireDateVal.toISOString().slice(0, 10) : String(hireDateVal)) : '',
            department: departmentVal,
            position: positionVal,
            status: statusVal,
            isValid,
            errors: rowErrors
          });
        });

        this.importPreviewData = previewRows;
        this.totalImportRows.set(previewRows.length);
        this.validImportRows.set(validCount);
        this.invalidImportRows.set(invalidCount);

        this.importProgress.set(100);
        this.isDataChecked.set(true);
        this.isValidating.set(false);

      } catch (err) {
        this.notificationService.error(this.translate.instant('EMPLOYEE_IMPORT.ERRORS.INVALID_FORMAT'));
        this.isValidating.set(false);
      }
    };
    reader.readAsArrayBuffer(this.selectedFile);
  }

  downloadErrorFile() {
    if (this.importPreviewData.length === 0) return;

    const headers = [
      'Full Name',
      'Email',
      'Phone Number',
      'Address',
      'Gender',
      'Date of Birth',
      'Hire Date',
      'Department',
      'Position',
      'Status',
      'Error Message'
    ];

    const data = this.importPreviewData.map((row) => [
      row.fullName || '',
      row.email || '',
      row.phone || '',
      row.address || '',
      row.gender || '',
      row.dob || '',
      row.hireDate || '',
      row.department || '',
      row.position || '',
      row.status || '',
      row.errors.join(', ')
    ]);

    try {
      this.exportService.exportExcel('employee_import_errors', headers, data);
    } catch (err) {
      this.notificationService.error(this.translate.instant('COMMON.EXPORT_ERROR'));
    }
  }

  async confirmImport() {
    if (!this.selectedFile || this.invalidImportRows() > 0) return;

    const count = this.validImportRows();
    const confirmed = await this.confirmService.ask(
      this.translate.instant('EMPLOYEE_IMPORT.IMPORT_CONFIRM_MSG', { count })
    );

    if (confirmed) {
      this.executeImport();
    }
  }

  executeImport() {
    if (!this.selectedFile) return;

    this.isImporting.set(true);
    this.employeeService.importEmployees(this.selectedFile)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isImporting.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.notificationService.success(
              this.translate.instant('EMPLOYEE_IMPORT.SUCCESS_MSG', { count: res.imported })
            );
            this.importDialogVisible.set(false);
            this.loadEmployees();
          } else {
            this.notificationService.error(
              res.message || this.translate.instant('EMPLOYEE_IMPORT.FAILURE_MSG')
            );
          }
        },
        error: (err) => {
          this.notificationService.error(
            err.error?.message || this.translate.instant('EMPLOYEE_IMPORT.FAILURE_MSG')
          );
        }
      });
  }
}
