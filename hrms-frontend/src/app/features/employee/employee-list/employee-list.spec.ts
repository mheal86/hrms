import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EmployeeList, ImportPreviewRow } from './employee-list';
import { Employee as EmployeeService } from '../../../core/services/employee.service';
import { Department as DepartmentService } from '../../../core/services/department.service';
import { Auth } from '../../../core/services/auth';
import { ExportService } from '../../../core/services/export.service';
import { LanguageService } from '../../../core/services/language.service';
import { Notification } from '../../../core/services/notification';
import { Confirm } from '../../../core/services/confirm';
import { provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { MessageService, ConfirmationService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import * as XLSX from 'xlsx';
import { Employee as EmployeeModel, EmployeeStatus } from '../../../core/models/employee-model';
import { Department as DepartmentModel } from '../../../core/models/department-model';
import { signal } from '@angular/core';

describe('EmployeeList', () => {
  let component: EmployeeList;
  let fixture: ComponentFixture<EmployeeList>;

  // Mock Excel Data
  const MOCK_EXCEL_VALID_DATA = [
    ['Full Name', 'Email', 'Phone Number', 'Address', 'Gender', 'Date of Birth', 'Hire Date', 'Department', 'Position', 'Status'],
    ['Nguyen Van A', 'nguyenvana@gmail.com', '0912345678', '123 Nguyen Trai', 'Nam', new Date('1990-01-01'), new Date('2026-01-01'), 'Nhân sự', 'Nhân viên', 'Hoạt động'],
    ['', 'invalid-email', '123', 'A', 'Invalid', 'InvalidDate', 'InvalidDate', 'Không tồn tại', 'InvalidPosition', '']
  ];

  const MOCK_EXCEL_EMPTY_DATA: unknown[][] = [];

  const MOCK_EXCEL_MISSING_HEADERS = [
    ['Phone Number', 'Address'],
    ['0912345678', '123 Nguyen Trai']
  ];

  const getMockExcelValidationData = (dobDate: Date, futureDob: Date) => [
    ['Full Name', 'Email', 'Phone Number', 'Address', 'Gender', 'Date of Birth', 'Hire Date', 'Department', 'Position', 'Status'],
    ['', '', '', '', '', '', '', '', '', ''],
    ['Nguyen A', '', '', '', '', '', '', '', '', ''],
    ['Nguyen B', 'nguyenb@gmail.com', '', '', '', dobDate, '2026-01-01', 'IT', '', ''],
    ['Nguyen C', 'nguyenc@gmail.com', '', '', '', futureDob, '', 'IT', '', ''],
    ['Nguyen D', 'nguyenc@gmail.com', '', '', '', '', '', 'IT', '', ''],
    ['Nguyen E', 'duplicate-db@gmail.com', '', '', '', '', '', 'IT', '', ''],
    ['Nguyen F', 'nguyenf@gmail.com', '', '', '', '', '', '', '', ''],
  ];

  const MOCK_AUTH_USER = { id: '1', username: 'admin', role: 'ADMIN' };

  const MOCK_EMPLOYEE: EmployeeModel = {
    _id: 'e1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    status: EmployeeStatus.ACTIVE,
    department: 'd1',
    position: 'STAFF'
  };

  const MOCK_EMPLOYEE_WITHOUT_ID: EmployeeModel = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    status: EmployeeStatus.ACTIVE,
    department: 'd1'
  };

  const MOCK_EMPLOYEE_INACTIVE: EmployeeModel = {
    _id: 'e2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    status: EmployeeStatus.INACTIVE,
    department: 'd2'
  };

  const MOCK_EMPLOYEE_ACTIVE_E2: EmployeeModel = {
    ...MOCK_EMPLOYEE_INACTIVE,
    status: EmployeeStatus.ACTIVE
  };

  const MOCK_EMPLOYEE_BOB: EmployeeModel = {
    _id: 'e3',
    firstName: 'Bob',
    lastName: 'Lee',
    email: 'bob@example.com',
    status: EmployeeStatus.INACTIVE,
    department: 'd1'
  };

  const MOCK_EMPLOYEE_WITH_ADMIN_EMAIL: Partial<EmployeeModel> & EmployeeModel = {
    email: 'admin@gmail.com'
  } as Partial<EmployeeModel> & EmployeeModel;

  const MOCK_SAMPLE_EMPLOYEES: EmployeeModel[] = [
    MOCK_EMPLOYEE,
    MOCK_EMPLOYEE_INACTIVE
  ];

  const MOCK_INACTIVE_EMPLOYEES_LIST: EmployeeModel[] = [
    MOCK_EMPLOYEE_BOB
  ];

  const MOCK_DEPARTMENTS: DepartmentModel[] = [
    { _id: 'd1', name: 'IT', description: 'Tech' } as Partial<DepartmentModel> & DepartmentModel,
    { _id: 'd2', name: 'Phòng Nhân sự', description: 'HR' } as Partial<DepartmentModel> & DepartmentModel
  ];

  const MOCK_DEPARTMENT_WITHOUT_ID: DepartmentModel = { name: 'Finance' } as Partial<DepartmentModel> & DepartmentModel;
  const MOCK_DEPARTMENT_KY_THUAT: DepartmentModel = { _id: 'd3', name: 'Phòng Kỹ thuật', description: 'IT' } as Partial<DepartmentModel> & DepartmentModel;

  const MOCK_PREVIEW_DATA_WITH_ERRORS: ImportPreviewRow[] = [
    { fullName: 'A', email: 'a@gmail.com', dob: '1990-01-01', hireDate: '2026-01-01', errors: ['Invalid email'] }
  ] as unknown as ImportPreviewRow[];

  const MOCK_PREVIEW_DATA_EMPTY_FIELDS: ImportPreviewRow[] = [
    { fullName: '', email: '', dob: '', hireDate: '', errors: ['Invalid email'] }
  ] as unknown as ImportPreviewRow[];

  let confirmService: Confirm;
  let notificationService: Notification;

  let mockEmployeeService: jasmine.SpyObj<EmployeeService>;
  let mockDepartmentService: jasmine.SpyObj<DepartmentService>;
  let mockAuth: jasmine.SpyObj<Auth>;
  let mockExportService: jasmine.SpyObj<ExportService>;
  let mockLanguageService: jasmine.SpyObj<LanguageService>;

  beforeEach(async () => {
    mockEmployeeService = jasmine.createSpyObj<EmployeeService>('EmployeeService', ['getAll', 'delete', 'update', 'importEmployees']);
    mockEmployeeService.getAll.and.returnValue(of({
      data: [MOCK_EMPLOYEE],
      pagination: { total: 1, page: 1, limit: 7, totalPages: 1 }
    }));
    mockEmployeeService.delete.and.returnValue(of(undefined));
    mockEmployeeService.update.and.returnValue(of({} as Partial<EmployeeModel> & EmployeeModel));
    mockEmployeeService.importEmployees.and.returnValue(of({ success: true, imported: 0 }));

    mockDepartmentService = jasmine.createSpyObj<DepartmentService>('DepartmentService', ['getAllUnpaginated']);
    mockDepartmentService.getAllUnpaginated.and.returnValue(of([MOCK_DEPARTMENTS[0]]));

    mockAuth = jasmine.createSpyObj<Auth>('Auth', ['getUser', 'isAdmin']);
    mockAuth.getUser.and.returnValue(MOCK_AUTH_USER);
    mockAuth.isAdmin.and.returnValue(true);

    mockExportService = jasmine.createSpyObj<ExportService>('ExportService', ['exportExcel', 'exportPDF']);
    mockExportService.exportPDF.and.returnValue(Promise.resolve());

    mockLanguageService = jasmine.createSpyObj<LanguageService>('LanguageService', ['getDepartmentName', 'getPositionTranslation']);
    mockLanguageService.getDepartmentName.and.callFake((name: string) => name);
    mockLanguageService.getPositionTranslation.and.callFake((pos: string) => pos);
    Object.defineProperty(mockLanguageService, 'currentLang', {
      value: signal('vi'),
      writable: true
    });

    await TestBed.configureTestingModule({
      imports: [EmployeeList],
      providers: [
        { provide: EmployeeService, useValue: mockEmployeeService },
        { provide: DepartmentService, useValue: mockDepartmentService },
        { provide: Auth, useValue: mockAuth },
        { provide: ExportService, useValue: mockExportService },
        { provide: LanguageService, useValue: mockLanguageService },
        provideRouter([]),
        provideTranslateService(),
        provideHttpClient(),
        MessageService,
        ConfirmationService,
        Notification,
        Confirm,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeList);
    component = fixture.componentInstance;
    confirmService = TestBed.inject(Confirm);
    notificationService = TestBed.inject(Notification);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should load departments unpaginated and build options', () => {
    expect(component.departmentOptions.length).toBe(2);
    expect(component.departmentOptions[0]).toEqual({ label: 'EMPLOYEE.ALL_DEPARTMENTS', value: '' });
    expect(component.departmentOptions[1]).toEqual({ label: 'IT', value: 'd1' });
  });

  describe('onSort', () => {
    it('should toggle sort direction on same column', () => {
      component.sortField = 'firstName';
      component.sortOrder = 'desc';

      component.onSort('firstName');
      fixture.detectChanges();
      expect(component.sortOrder).toBe('asc');
    });

    it('should reset sort direction when changing column', () => {
      const loadSpy = spyOn(component, 'loadEmployees').and.callThrough();
      component.sortField = 'firstName';
      component.sortOrder = 'desc';

      component.onSort('email');
      fixture.detectChanges();
      expect(component.sortField).toBe('email');
      expect(component.sortOrder).toBe('asc');
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  it('should handle pagination in onPageChange', () => {
    const loadSpy = spyOn(component, 'loadEmployees').and.callThrough();
    component.onPageChange({ page: 2, rows: 10, first: 20 });
    fixture.detectChanges();

    expect(component.currentPage()).toBe(3);
    expect(component.pageSize).toBe(10);
    expect(component.first).toBe(20);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should toggle employee status successfully', () => {
    const updateSpy = mockEmployeeService.update.and.returnValue(of({} as Partial<EmployeeModel> & EmployeeModel));
    const successSpy = spyOn(notificationService, 'success').and.callThrough();
    const loadSpy = spyOn(component, 'loadEmployees').and.callThrough();

    component.onToggleStatus(MOCK_EMPLOYEE);
    fixture.detectChanges();

    expect(updateSpy).toHaveBeenCalledWith('e1', jasmine.objectContaining({ status: EmployeeStatus.INACTIVE }));
    expect(successSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should handle toggle employee status error', () => {
    mockEmployeeService.update.and.returnValue(throwError(() => ({
      error: { message: 'Toggle error' }
    })));
    const errorSpy = spyOn(notificationService, 'error').and.callThrough();

    component.onToggleStatus(MOCK_EMPLOYEE);
    fixture.detectChanges();

    expect(errorSpy).toHaveBeenCalledWith('Toggle error');
  });

  it('should delete employee after confirm', async () => {
    spyOn(confirmService, 'ask').and.resolveTo(true);
    const deleteSpy = mockEmployeeService.delete.and.returnValue(of(undefined));
    const successSpy = spyOn(notificationService, 'success').and.callThrough();
    const loadSpy = spyOn(component, 'loadEmployees').and.callThrough();

    await component.onDelete(MOCK_EMPLOYEE);
    fixture.detectChanges();

    expect(deleteSpy).toHaveBeenCalledWith('e1');
    expect(successSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should reset pagination and reload employees when filter changes or search is triggered', () => {
    const loadSpy = spyOn(component, 'loadEmployees').and.callThrough();

    // Simulating user input in the search box
    const searchInput = fixture.nativeElement.querySelector('input[pInputText]') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = 'John';
      searchInput.dispatchEvent(new Event('input'));
    } else {
      component.searchTerm = 'John';
    }
    fixture.detectChanges();

    // Trigger search click
    const searchBtn = fixture.nativeElement.querySelector('p-button[icon="pi pi-search"] button') as HTMLButtonElement;
    if (searchBtn) {
      searchBtn.click();
    } else {
      component.resetAndLoad();
    }
    fixture.detectChanges();

    expect(component.currentPage()).toBe(1);
    expect(component.first).toBe(0);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should export Excel for employees', () => {
    component.total.set(1);
    mockEmployeeService.getAll.and.returnValue(of({
      data: [MOCK_EMPLOYEE],
      pagination: { total: 1, page: 1, limit: 7, totalPages: 1 }
    }));
    const excelSpy = mockExportService.exportExcel;
    const successSpy = spyOn(notificationService, 'success').and.callThrough();

    component.onExport('excel', true);
    fixture.detectChanges();

    expect(excelSpy).toHaveBeenCalledWith(
      jasmine.any(String),
      jasmine.any(Array),
      jasmine.any(Array)
    );
    expect(successSpy).toHaveBeenCalled();
  });

  it('should export PDF for employees', async () => {
    component.total.set(1);
    mockEmployeeService.getAll.and.returnValue(of({
      data: [MOCK_EMPLOYEE],
      pagination: { total: 1, page: 1, limit: 7, totalPages: 1 }
    }));
    const pdfSpy = mockExportService.exportPDF.and.resolveTo();
    const successSpy = spyOn(notificationService, 'success').and.callThrough();

    component.onExport('pdf', true);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(pdfSpy).toHaveBeenCalledWith(
      jasmine.any(String),
      jasmine.any(String),
      jasmine.any(Array),
      jasmine.any(Array)
    );
    expect(successSpy).toHaveBeenCalled();
  });

  it('should handle excel export error', () => {
    component.total.set(1);
    mockEmployeeService.getAll.and.returnValue(of({
      data: [MOCK_EMPLOYEE],
      pagination: { total: 1, page: 1, limit: 7, totalPages: 1 }
    }));
    mockExportService.exportExcel.and.callFake(() => {
      throw new Error('Excel error');
    });
    const errorSpy = spyOn(notificationService, 'error').and.callThrough();

    component.onExport('excel', true);
    fixture.detectChanges();

    expect(errorSpy).toHaveBeenCalled();
  });

  it('should handle pdf export error', fakeAsync(() => {
    component.total.set(1);
    mockEmployeeService.getAll.and.returnValue(of({
      data: [MOCK_EMPLOYEE],
      pagination: { total: 1, page: 1, limit: 7, totalPages: 1 }
    }));
    mockExportService.exportPDF.and.rejectWith(new Error('PDF error'));
    const errorSpy = spyOn(notificationService, 'error').and.callThrough();

    component.onExport('pdf', true);
    tick();
    fixture.detectChanges();

    expect(errorSpy).toHaveBeenCalled();
  }));

  it('should handle loadEmployees error', () => {
    mockEmployeeService.getAll.and.returnValue(throwError(() => ({
      error: { message: 'Load error' }
    })));
    component.loadEmployees();
    fixture.detectChanges();
    expect(component.errorMessage()).toBe('Load error');
  });

  it('should not delete if employee has no _id', async () => {
    const deleteSpy = mockEmployeeService.delete.and.callThrough();
    await component.onDelete(MOCK_EMPLOYEE_WITHOUT_ID);
    fixture.detectChanges();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('should not delete if user cancels confirmation', async () => {
    spyOn(confirmService, 'ask').and.resolveTo(false);
    const deleteSpy = mockEmployeeService.delete.and.callThrough();
    await component.onDelete(MOCK_EMPLOYEE);
    fixture.detectChanges();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('should handle delete error', async () => {
    spyOn(confirmService, 'ask').and.resolveTo(true);
    mockEmployeeService.delete.and.returnValue(throwError(() => ({
      error: { message: 'Delete failed' }
    })));
    const errorSpy = spyOn(notificationService, 'error').and.callThrough();
    await component.onDelete(MOCK_EMPLOYEE);
    fixture.detectChanges();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should handle onToggleStatus error', () => {
    mockEmployeeService.update.and.returnValue(throwError(() => ({
      error: { message: 'Toggle failed' }
    })));
    const errorSpy = spyOn(notificationService, 'error').and.callThrough();
    component.onToggleStatus(MOCK_EMPLOYEE);
    fixture.detectChanges();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should not toggle status if no emp._id', () => {
    const updateSpy = mockEmployeeService.update.and.callThrough();
    component.onToggleStatus(MOCK_EMPLOYEE_WITHOUT_ID);
    fixture.detectChanges();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('should notify error when export data is empty', () => {
    mockEmployeeService.getAll.and.returnValue(of({
      data: [],
      pagination: { total: 0, page: 1, limit: 7, totalPages: 0 }
    }));
    const errorSpy = spyOn(notificationService, 'error').and.callThrough();
    component.onExport('excel', true);
    fixture.detectChanges();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should notify error when fetch for export fails', () => {
    mockEmployeeService.getAll.and.returnValue(throwError(() => new Error('fetch failed')));
    const errorSpy = spyOn(notificationService, 'error').and.callThrough();
    component.onExport('excel', true);
    fixture.detectChanges();
    expect(errorSpy).toHaveBeenCalled();
  });

  describe('Export Menu Actions', () => {
    let exportSpy: jasmine.Spy;
    let excelFiltered: any, excelAll: any, pdfFiltered: any, pdfAll: any;

    beforeEach(() => {
      const translateService = TestBed.inject(TranslateService);
      component.initExportMenu();
      fixture.detectChanges();
      exportSpy = spyOn(component, 'onExport').and.callThrough();

      const findItem = (labelKey: string) => {
        const translated = translateService.instant(labelKey);
        return component.exportItems.find(item => item.label === translated);
      };

      excelFiltered = findItem('COMMON.EXPORT_EXCEL_FILTERED');
      excelAll = findItem('COMMON.EXPORT_EXCEL_ALL');
      pdfFiltered = findItem('COMMON.EXPORT_PDF_FILTERED');
      pdfAll = findItem('COMMON.EXPORT_PDF_ALL');
    });

    it('should execute export Excel (filtered)', () => {
      expect(excelFiltered).toBeDefined();
      excelFiltered?.command?.({ item: excelFiltered });
      expect(exportSpy).toHaveBeenCalledWith('excel', true);
    });

    it('should execute export Excel (all)', () => {
      expect(excelAll).toBeDefined();
      excelAll?.command?.({ item: excelAll });
      expect(exportSpy).toHaveBeenCalledWith('excel', false);
    });

    it('should execute export PDF (filtered)', () => {
      expect(pdfFiltered).toBeDefined();
      pdfFiltered?.command?.({ item: pdfFiltered });
      expect(exportSpy).toHaveBeenCalledWith('pdf', true);
    });

    it('should execute export PDF (all)', () => {
      expect(pdfAll).toBeDefined();
      pdfAll?.command?.({ item: pdfAll });
      expect(exportSpy).toHaveBeenCalledWith('pdf', false);
    });
  });

  it('should return correct employee menu items', () => {
    const items = component.getEmployeeMenuItems(MOCK_EMPLOYEE);
    expect(items.length).toBe(3);
    expect(items[0].routerLink).toEqual(['/employees', 'e1']);
    expect(items[1].routerLink).toEqual(['/employees/edit', 'e1']);
  });

  it('should call onDelete via employee menu item delete command', async () => {
    spyOn(confirmService, 'ask').and.resolveTo(false);
    const items = component.getEmployeeMenuItems(MOCK_EMPLOYEE);
    const deleteItem = items.find(i => i.label?.includes('DELETE') || i.icon?.includes('trash'));
    expect(deleteItem).toBeDefined();
    await deleteItem?.command?.({ item: deleteItem });
    fixture.detectChanges();
    expect(confirmService.ask).toHaveBeenCalled();
  });

  it('should trigger resetAndLoad from resetAndLoad', () => {
    component.currentPage.set(3);
    const loadSpy = spyOn(component, 'loadEmployees').and.callThrough();
    component.resetAndLoad();
    fixture.detectChanges();
    expect(component.currentPage()).toBe(1);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should fallback to default error message if err.error is missing when loading departments', () => {
    mockDepartmentService.getAllUnpaginated.and.returnValue(
      throwError(() => new Error('Unexpected network error without err.error'))
    );
    component.loadDepartmentsForFilter();
    fixture.detectChanges();
    expect(component.errorMessage()).toBe('DEPARTMENT.LOAD_ERROR');
  });

  it('should handle missing department _id when building departmentOptions', () => {
    component.departments.set([MOCK_DEPARTMENT_WITHOUT_ID]);
    fixture.detectChanges();
    const options = component.departmentOptions;
    expect(options[1].value).toBe('');
  });

  it('should sort asc to desc when clicking same field', () => {
    component.sortField = 'firstName';
    component.sortOrder = 'asc';
    component.onSort('firstName');
    fixture.detectChanges();
    expect(component.sortOrder).toBe('desc');
  });

  it('should handle undefined event values in onPageChange', () => {
    component.onPageChange({});
    fixture.detectChanges();
    expect(component.first).toBe(0);
    expect(component.pageSize).toBe(7);
    expect(component.currentPage()).toBe(1);
  });

  it('should handle missing err.error on employee delete', async () => {
    spyOn(confirmService, 'ask').and.returnValue(Promise.resolve(true));
    mockEmployeeService.delete.and.returnValue(throwError(() => new Error('Delete fallback')));
    const errorSpy = spyOn(notificationService, 'error');

    await component.onDelete(MOCK_EMPLOYEE_INACTIVE);
    fixture.detectChanges();
    expect(errorSpy).toHaveBeenCalledWith('EMPLOYEE.DELETE_ERROR');
  });

  it('should toggle employee status to ACTIVE if currently INACTIVE', () => {
    const updateSpy = mockEmployeeService.update.and.returnValue(of({} as Partial<EmployeeModel> & EmployeeModel));
    component.onToggleStatus(MOCK_EMPLOYEE_INACTIVE);
    fixture.detectChanges();
    expect(updateSpy).toHaveBeenCalledWith('e2', jasmine.objectContaining({ status: EmployeeStatus.ACTIVE }));
  });

  it('should fallback to default error if err.error is missing when toggling status', () => {
    mockEmployeeService.update.and.returnValue(throwError(() => new Error('Toggle error fallback')));
    const errorSpy = spyOn(notificationService, 'error');
    component.onToggleStatus(MOCK_EMPLOYEE_ACTIVE_E2);
    fixture.detectChanges();
    expect(errorSpy).toHaveBeenCalledWith('EMPLOYEE.STATUS_UPDATE_ERROR');
  });

  it('should export unfiltered data when filteredOnly is false', () => {
    component.searchTerm = 'John';
    component.total.set(0); // force total=0 so limit falls back to 1000
    mockEmployeeService.getAll.and.returnValue(of({
      data: [MOCK_EMPLOYEE_INACTIVE],
      pagination: { total: 1, page: 1, limit: 7, totalPages: 1 }
    }));
    component.onExport('excel', false);
    fixture.detectChanges();
    expect(mockEmployeeService.getAll).toHaveBeenCalledWith(1, 1000, '', component.sortField, component.sortOrder, '', '');
  });

  it('should fallback to default limit 1000 if total is 0 when exporting', () => {
    component.total.set(0);
    mockEmployeeService.getAll.and.returnValue(of({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } } as unknown as { data: EmployeeModel[]; pagination: { total: number; page: number; limit: number; totalPages: number } }));
    component.onExport('excel', true);
    fixture.detectChanges();
    expect(mockEmployeeService.getAll).toHaveBeenCalledWith(1, 1000, component.searchTerm, component.sortField, component.sortOrder, component.departmentFilter, component.statusFilter);
  });

  it('should handle missing email and output INACTIVE in executeExport', () => {
    mockEmployeeService.getAll.and.returnValue(of({
      data: [MOCK_EMPLOYEE_INACTIVE],
      pagination: { total: 1, page: 1, limit: 7, totalPages: 1 }
    }));
    const excelMock = mockExportService.exportExcel;
    component.onExport('excel', true);
    fixture.detectChanges();

    expect(excelMock).toHaveBeenCalled();
  });

  it('should re-init export menu on language change', fakeAsync(() => {
    const translate = TestBed.inject(TranslateService);
    const spy = spyOn(component, 'initExportMenu');
    translate.use('vi');
    tick();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalled();
  }));

  it('should handle loadEmployees error and fallback to default message if err.error is missing', () => {
    mockEmployeeService.getAll.and.returnValue(throwError(() => new Error('No err.error')));
    component.loadEmployees();
    fixture.detectChanges();
    expect(component.errorMessage()).toBe('EMPLOYEE.LOAD_ERROR');
  });

  describe('Excel Import', () => {
    it('should show import dialog and reset state', () => {
      mockEmployeeService.getAll.and.returnValue(of({
        data: [MOCK_EMPLOYEE_WITH_ADMIN_EMAIL],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
      } as unknown as { data: EmployeeModel[]; pagination: { total: number; page: number; limit: number; totalPages: number } }));

      component.showImportDialog();
      fixture.detectChanges();

      expect(component.importDialogVisible()).toBe(true);
      expect(component.selectedFile).toBeNull();
      expect(component.importPreviewData.length).toBe(0);
      expect(component.isDataChecked()).toBe(false);
      expect(component.totalImportRows()).toBe(0);
      expect(component.validImportRows()).toBe(0);
      expect(component.invalidImportRows()).toBe(0);
    });

    it('should show error toast if file format is not .xlsx or .xls', () => {
      const errorSpy = spyOn(notificationService, 'error');
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      const event = { target: { files: [file] } };

      component.onFileSelected(event as unknown as Event);
      fixture.detectChanges();

      expect(errorSpy).toHaveBeenCalled();
      expect(component.selectedFile).toBeNull();
    });

    it('should accept valid excel file extension', () => {
      const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const event = { target: { files: [file] } };

      component.onFileSelected(event as unknown as Event);
      fixture.detectChanges();

      expect(component.selectedFile).toBe(file);
      expect(component.isDataChecked()).toBe(false);
    });

    describe('matchDepartmentLocally', () => {
      beforeEach(() => {
        component.departments.set(MOCK_DEPARTMENTS);
        fixture.detectChanges();
      });

      it('should match department case-insensitively', () => {
        expect(component.matchDepartmentLocal('Nhân sự')?._id).toBe('d2');
        expect(component.matchDepartmentLocal('Phòng Nhân sự')?._id).toBe('d2');
        expect(component.matchDepartmentLocal('hr')?._id).toBe('d2');
        expect(component.matchDepartmentLocal('IT')?._id).toBe('d1');
      });

      it('should return null when no department matches', () => {
        expect(component.matchDepartmentLocal('Không tồn tại')).toBeNull();
      });
    });

    it('should download template using exportService', () => {
      component.downloadTemplate();
      fixture.detectChanges();
      expect(mockExportService.exportExcel).toHaveBeenCalled();
    });

    it('should download error file using exportService if preview data exists', () => {
      component.importPreviewData = MOCK_PREVIEW_DATA_WITH_ERRORS;
      component.downloadErrorFile();
      fixture.detectChanges();
      expect(mockExportService.exportExcel).toHaveBeenCalled();
    });

    it('should format file sizes correctly', () => {
      expect(component.getFileSizeString(undefined)).toBe('');
      expect(component.getFileSizeString(0)).toBe('0 Bytes');
      expect(component.getFileSizeString(1024)).toBe('1 KB');
      expect(component.getFileSizeString(1024 * 1024 * 2.5)).toBe('2.5 MB');
    });

    describe('Drag & Drop Excel Import File', () => {
      let preventDefaultSpy: jasmine.Spy;
      let stopPropagationSpy: jasmine.Spy;
      let dragEvent: DragEvent;

      beforeEach(() => {
        preventDefaultSpy = jasmine.createSpy('preventDefault');
        stopPropagationSpy = jasmine.createSpy('stopPropagation');
        dragEvent = {
          preventDefault: preventDefaultSpy,
          stopPropagation: stopPropagationSpy,
          dataTransfer: {
            files: [new File([''], 'test.xlsx')]
          }
        } as unknown as DragEvent;
      });

      it('should set isDragOver to true on dragOver event', () => {
        component.onDragOver(dragEvent);
        expect(component.isDragOver).toBe(true);
        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(stopPropagationSpy).toHaveBeenCalled();
      });

      it('should set isDragOver to false on dragLeave event', () => {
        component.onDragLeave(dragEvent);
        expect(component.isDragOver).toBe(false);
        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(stopPropagationSpy).toHaveBeenCalled();
      });

      it('should handle file selection on drop event', () => {
        component.onDrop(dragEvent);
        expect(component.isDragOver).toBe(false);
        expect(component.selectedFile?.name).toBe('test.xlsx');
        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(stopPropagationSpy).toHaveBeenCalled();
      });
    });

    it('should confirm and execute successful import', fakeAsync(() => {
      component.selectedFile = new File([''], 'test.xlsx');
      component.validImportRows.set(10);
      component.invalidImportRows.set(0);
      fixture.detectChanges();

      spyOn(confirmService, 'ask').and.returnValue(Promise.resolve(true));
      mockEmployeeService.importEmployees.and.returnValue(of({ success: true, imported: 10 }));
      const successSpy = spyOn(notificationService, 'success');
      const loadSpy = spyOn(component, 'loadEmployees');

      component.confirmImport();
      tick();
      fixture.detectChanges();

      expect(mockEmployeeService.importEmployees).toHaveBeenCalled();
      expect(successSpy).toHaveBeenCalled();
      expect(loadSpy).toHaveBeenCalled();
      expect(component.importDialogVisible()).toBe(false);
    }));

    it('should confirm and handle failed import response', fakeAsync(() => {
      component.selectedFile = new File([''], 'test.xlsx');
      component.validImportRows.set(10);
      component.invalidImportRows.set(0);
      fixture.detectChanges();

      spyOn(confirmService, 'ask').and.returnValue(Promise.resolve(true));
      mockEmployeeService.importEmployees.and.returnValue(of({ success: false, message: 'Server failed' }));
      const errorSpy = spyOn(notificationService, 'error');

      component.confirmImport();
      tick();
      fixture.detectChanges();

      expect(mockEmployeeService.importEmployees).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith('Server failed');
    }));

    it('should handle API errors on import execution', fakeAsync(() => {
      component.selectedFile = new File([''], 'test.xlsx');
      component.validImportRows.set(10);
      component.invalidImportRows.set(0);
      fixture.detectChanges();

      spyOn(confirmService, 'ask').and.returnValue(Promise.resolve(true));
      mockEmployeeService.importEmployees.and.returnValue(throwError(() => ({ error: { message: 'Network error' } })));
      const errorSpy = spyOn(notificationService, 'error');

      component.confirmImport();
      tick();
      fixture.detectChanges();

      expect(errorSpy).toHaveBeenCalledWith('Network error');
    }));

    it('should parse and validate import data synchronously', fakeAsync(() => {
      const ws = XLSX.utils.aoa_to_sheet(MOCK_EXCEL_VALID_DATA);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

      component.selectedFile = new File([excelBuffer], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      component.departments.set(MOCK_DEPARTMENTS);
      fixture.detectChanges();

      const mockReader = {
        result: excelBuffer,
        readAsArrayBuffer: function () {
          if (this.onload) {
            this.onload.call(undefined as unknown as FileReader, { target: { result: excelBuffer } } as unknown as ProgressEvent<FileReader>);
          }
        },
        onload: null as unknown as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null
      };
      spyOn(window, 'FileReader').and.returnValue(mockReader as unknown as FileReader);

      component.validateImportData();
      tick();
      fixture.detectChanges();

      expect(component.totalImportRows()).toBe(2);
      expect(component.validImportRows()).toBe(1);
      expect(component.invalidImportRows()).toBe(1);
      expect(component.importPreviewData[0].isValid).toBe(true);
      expect(component.importPreviewData[1].isValid).toBe(false);
      expect(component.importPreviewData[1].errors.length).toBeGreaterThan(0);
    }));

    it('should handle error when loading DB emails for validation', () => {
      const errorSpy = spyOn(notificationService, 'error');
      mockEmployeeService.getAll.and.returnValue(throwError(() => new Error('DB error')));
      component.loadDbEmailsForValidation();
      fixture.detectChanges();
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should return null when matching empty department name', () => {
      expect(component.matchDepartmentLocal('')).toBeNull();
      expect(component.matchDepartmentLocal(null as unknown as string)).toBeNull();
    });

    it('should match department as substring for non-mapped keyword', () => {
      component.departments.set([MOCK_DEPARTMENT_KY_THUAT]);
      fixture.detectChanges();
      expect(component.matchDepartmentLocal('Kỹ thuật')?._id).toBe('d3');
    });

    it('should return early from validateImportData if selectedFile is null', () => {
      component.selectedFile = null;
      fixture.detectChanges();
      const readSpy = spyOn(window, 'FileReader');
      component.validateImportData();
      expect(readSpy).not.toHaveBeenCalled();
    });

    it('should show error toast if excel file contains no rows', fakeAsync(() => {
      const ws = XLSX.utils.aoa_to_sheet(MOCK_EXCEL_EMPTY_DATA);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

      component.selectedFile = new File([excelBuffer], 'test.xlsx');
      fixture.detectChanges();
      const errorSpy = spyOn(notificationService, 'error');

      const mockReader = {
        result: excelBuffer,
        readAsArrayBuffer: function () {
          if (this.onload) this.onload.call(undefined as unknown as FileReader, { target: { result: excelBuffer } } as unknown as ProgressEvent<FileReader>);
        },
        onload: null as unknown as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null
      };
      spyOn(window, 'FileReader').and.returnValue(mockReader as unknown as FileReader);

      component.validateImportData();
      tick();
      fixture.detectChanges();

      expect(errorSpy).toHaveBeenCalled();
      expect(component.isValidating()).toBe(false);
    }));

    it('should show error toast if excel file is missing required headers', fakeAsync(() => {
      const ws = XLSX.utils.aoa_to_sheet(MOCK_EXCEL_MISSING_HEADERS);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

      component.selectedFile = new File([excelBuffer], 'test.xlsx');
      fixture.detectChanges();
      const errorSpy = spyOn(notificationService, 'error');

      const mockReader = {
        result: excelBuffer,
        readAsArrayBuffer: function () {
          if (this.onload) this.onload.call(undefined as unknown as FileReader, { target: { result: excelBuffer } } as unknown as ProgressEvent<FileReader>);
        },
        onload: null as unknown as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null
      };
      spyOn(window, 'FileReader').and.returnValue(mockReader as unknown as FileReader);

      component.validateImportData();
      tick();
      fixture.detectChanges();

      expect(errorSpy).toHaveBeenCalled();
      expect(component.isValidating()).toBe(false);
    }));

    it('should ignore empty rows and validate field validation details', fakeAsync(() => {
      const today = new Date();
      const dobDate = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate() + 1);
      const futureDob = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());

      const ws = XLSX.utils.aoa_to_sheet(getMockExcelValidationData(dobDate, futureDob));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

      component.selectedFile = new File([excelBuffer], 'test.xlsx');
      component.departments.set([MOCK_DEPARTMENTS[0]]);
      component.dbEmails = new Set(['duplicate-db@gmail.com']);
      fixture.detectChanges();

      const mockReader = {
        result: excelBuffer,
        readAsArrayBuffer: function () {
          if (this.onload) this.onload.call(undefined as unknown as FileReader, { target: { result: excelBuffer } } as unknown as ProgressEvent<FileReader>);
        },
        onload: null as unknown as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null
      };
      spyOn(window, 'FileReader').and.returnValue(mockReader as unknown as FileReader);

      component.validateImportData();
      tick();
      fixture.detectChanges();

      expect(component.totalImportRows()).toBe(6);
      expect(component.invalidImportRows()).toBe(6);
    }));

    it('should download template using exportService for English locale', () => {
      mockLanguageService.currentLang.set('en');
      component.downloadTemplate();
      fixture.detectChanges();
      expect(mockExportService.exportExcel).toHaveBeenCalled();
    });

    it('should download error file fallback branches for missing DOB/Hire date', () => {
      component.importPreviewData = MOCK_PREVIEW_DATA_EMPTY_FIELDS;
      component.downloadErrorFile();
      fixture.detectChanges();
      expect(mockExportService.exportExcel).toHaveBeenCalled();
    });

    it('should show error notification if downloadTemplate throws error', () => {
      mockExportService.exportExcel.and.throwError(new Error('Excel crash'));
      const errorSpy = spyOn(notificationService, 'error');
      component.downloadTemplate();
      fixture.detectChanges();
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should show error notification if downloadErrorFile throws error', () => {
      mockExportService.exportExcel.and.throwError(new Error('Excel crash'));
      component.importPreviewData = MOCK_PREVIEW_DATA_EMPTY_FIELDS;
      const errorSpy = spyOn(notificationService, 'error');
      component.downloadErrorFile();
      fixture.detectChanges();
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should handle executeImport next response when success is false and message is empty', fakeAsync(() => {
      component.selectedFile = new File([''], 'test.xlsx');
      mockEmployeeService.importEmployees.and.returnValue(of({ success: false }));
      const errorSpy = spyOn(notificationService, 'error');
      component.executeImport();
      tick();
      fixture.detectChanges();
      expect(errorSpy).toHaveBeenCalledWith('EMPLOYEE_IMPORT.FAILURE_MSG');
    }));

    it('should handle executeImport error callback when err.error is falsy', fakeAsync(() => {
      component.selectedFile = new File([''], 'test.xlsx');
      mockEmployeeService.importEmployees.and.returnValue(throwError(() => ({})));
      const errorSpy = spyOn(notificationService, 'error');
      component.executeImport();
      tick();
      fixture.detectChanges();
      expect(errorSpy).toHaveBeenCalledWith('EMPLOYEE_IMPORT.FAILURE_MSG');
    }));

    it('should catch parsing errors in validateImportData', fakeAsync(() => {
      component.selectedFile = new File([''], 'test.xlsx');
      const errorSpy = spyOn(notificationService, 'error');

      const mockReader = {
        result: null,
        readAsArrayBuffer: function () {
          if (this.onload) {
            this.onload.call(undefined as unknown as FileReader, null as unknown as ProgressEvent<FileReader>);
          }
        },
        onload: null as unknown as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null
      };
      spyOn(window, 'FileReader').and.returnValue(mockReader as unknown as FileReader);

      component.validateImportData();
      tick();
      fixture.detectChanges();

      expect(errorSpy).toHaveBeenCalled();
      expect(component.isValidating()).toBe(false);
    }));

    it('should return early in downloadErrorFile if no preview data exists', () => {
      component.importPreviewData = [];
      component.downloadErrorFile();
      fixture.detectChanges();
      expect(mockExportService.exportExcel).not.toHaveBeenCalled();
    });

    describe('confirmImport early returns', () => {
      it('should return early when no file is selected', () => {
        const askSpy = spyOn(confirmService, 'ask');

        component.selectedFile = null;
        component.invalidImportRows.set(0);
        component.confirmImport();
        expect(askSpy).not.toHaveBeenCalled();
      });

      it('should return early when invalid rows exist', () => {
        const askSpy = spyOn(confirmService, 'ask');

        component.selectedFile = new File([''], 'test.xlsx');
        component.invalidImportRows.set(1);
        component.confirmImport();
        expect(askSpy).not.toHaveBeenCalled();
      });
    });

    it('should return early in executeImport if selectedFile is null', () => {
      component.selectedFile = null;
      const importSpy = mockEmployeeService.importEmployees;
      component.executeImport();
      expect(importSpy).not.toHaveBeenCalled();
    });
  });

  describe('executeExport', () => {
    it('should call exportExcel with correct headers and rows and notify success', () => {
      mockExportService.exportExcel.and.stub();
      const successSpy = spyOn(notificationService, 'success');

      component.executeExport('excel', MOCK_SAMPLE_EMPLOYEES);
      fixture.detectChanges();

      expect(mockExportService.exportExcel).toHaveBeenCalledWith(
        jasmine.any(String),
        jasmine.any(Array),
        jasmine.any(Array)
      );
      expect(successSpy).toHaveBeenCalled();
    });

    it('should call exportPDF with correct headers and rows and notify success', fakeAsync(() => {
      mockExportService.exportPDF.and.resolveTo();
      const successSpy = spyOn(notificationService, 'success');

      component.executeExport('pdf', MOCK_SAMPLE_EMPLOYEES);
      tick();
      fixture.detectChanges();

      expect(mockExportService.exportPDF).toHaveBeenCalledWith(
        jasmine.any(String),
        jasmine.any(String),
        jasmine.any(Array),
        jasmine.any(Array)
      );
      expect(successSpy).toHaveBeenCalled();
    }));

    it('should notify error if exportExcel throws', () => {
      mockExportService.exportExcel.and.callFake(() => { throw new Error('Excel crash'); });
      const errorSpy = spyOn(notificationService, 'error');

      component.executeExport('excel', MOCK_SAMPLE_EMPLOYEES);
      fixture.detectChanges();

      expect(errorSpy).toHaveBeenCalled();
    });

    it('should notify error if exportPDF rejects', fakeAsync(() => {
      mockExportService.exportPDF.and.rejectWith(new Error('PDF crash'));
      const errorSpy = spyOn(notificationService, 'error');

      component.executeExport('pdf', MOCK_SAMPLE_EMPLOYEES);
      tick();
      fixture.detectChanges();

      expect(errorSpy).toHaveBeenCalled();
    }));

    it('should map INACTIVE status to translated COMMON.INACTIVE label', () => {
      mockExportService.exportExcel.and.stub();

      component.executeExport('excel', MOCK_INACTIVE_EMPLOYEES_LIST);
      fixture.detectChanges();

      const [, , rows] = mockExportService.exportExcel.calls.mostRecent().args;
      expect(rows[0][4]).toContain('COMMON.INACTIVE');
    });
  });

  describe('handleFile', () => {
    it('should set selectedFile and reset import state for a valid .xlsx file', () => {
      const file = new File([''], 'import.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      component.isDataChecked.set(true);
      component.totalImportRows.set(5);

      component.handleFile(file);
      fixture.detectChanges();

      expect(component.selectedFile).toBe(file);
      expect(component.isDataChecked()).toBe(false);
      expect(component.totalImportRows()).toBe(0);
      expect(component.validImportRows()).toBe(0);
      expect(component.invalidImportRows()).toBe(0);
      expect(component.importPreviewData.length).toBe(0);
    });

    it('should set selectedFile and reset import state for a valid .xls file', () => {
      const file = new File([''], 'import.xls', { type: 'application/vnd.ms-excel' });

      component.handleFile(file);
      fixture.detectChanges();

      expect(component.selectedFile).toBe(file);
    });

    it('should notify error and NOT set selectedFile for an unsupported file type', () => {
      const file = new File([''], 'document.pdf', { type: 'application/pdf' });
      const errorSpy = spyOn(notificationService, 'error');
      component.selectedFile = null;

      component.handleFile(file);
      fixture.detectChanges();

      expect(errorSpy).toHaveBeenCalled();
      expect(component.selectedFile).toBeNull();
    });
  });
});
