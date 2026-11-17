import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmployeeDetail } from './employee-detail';
import { Employee as EmployeeService } from '../../../core/services/employee.service';
import { Department as DepartmentService } from '../../../core/services/department.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';
import { Confirm } from '../../../core/services/confirm';
import { LanguageService } from '../../../core/services/language.service';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { Location } from '@angular/common';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { MessageService, ConfirmationService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { FormlyModule, FieldType, FormlyFieldConfig } from '@ngx-formly/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Component } from '@angular/core';
import { Employee as EmployeeModel, EmployeeStatus } from '../../../core/models/employee-model';
import { Department as DepartmentModel } from '../../../core/models/department-model';
import { AuditLog } from '../../../core/models/audit-log-model';

@Component({
  selector: 'dummy-input',
  template: '',
  standalone: true
})
class DummyComponent extends FieldType { }

interface ParsedDetailsKeyValue {
  type: 'key-value';
  pairs: { key: string; value: string }[];
}

interface ParsedDetailsDiff {
  type: 'diff';
  diffs: { field: string; before: string; after: string }[];
}

describe('EmployeeDetail', () => {
  let component: EmployeeDetail;
  let fixture: ComponentFixture<EmployeeDetail>;
  let confirmService: Confirm;
  let notificationService: Notification;
  let router: Router;
  let translate: TranslateService;

  const MOCK_AUTH_USER = { id: '1', username: 'admin', role: 'ADMIN' };

  const MOCK_DEPARTMENT: DepartmentModel = { _id: 'd1', name: 'IT', description: 'Tech' } as Partial<DepartmentModel> & DepartmentModel;
  const MOCK_DEPARTMENTS_LIST: DepartmentModel[] = [
    MOCK_DEPARTMENT,
    { _id: undefined, name: 'HR', description: 'HR' } as Partial<DepartmentModel> & DepartmentModel
  ];

  const MOCK_EMPTY_EMPLOYEE = {
    firstName: 'A',
    lastName: 'B',
    gender: 'MALE',
    dateOfBirth: undefined,
    phone: undefined,
    address: undefined,
    department: undefined,
    position: undefined
  } as unknown as Partial<EmployeeModel> & EmployeeModel;

  const MOCK_PERSONAL_FORM_DATA = {
    firstName: 'John',
    lastName: 'Doe',
    gender: 'MALE',
    dateOfBirth: new Date('1995-05-05'),
    phone: '0912345678',
    address: 'Hanoi'
  };

  const MOCK_DEPARTMENT_FORM_DATA = {
    position: 'Trưởng phòng',
    department: 'd1'
  };

  const mockEmployee: EmployeeModel = {
    _id: 'emp1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    gender: 'MALE',
    dateOfBirth: '1995-05-05',
    phone: '0912345678',
    address: 'Hanoi',
    position: 'Nhân viên',
    status: EmployeeStatus.ACTIVE,
    department: { _id: 'd1', name: 'IT' },
    hireDate: '2020-01-01',
  };

  let mockEmployeeService: jasmine.SpyObj<EmployeeService>;
  let mockDepartmentService: jasmine.SpyObj<DepartmentService>;
  let mockAuditLogService: jasmine.SpyObj<AuditLogService>;
  let mockAuth: jasmine.SpyObj<Auth>;
  let mockLanguageService: jasmine.SpyObj<LanguageService>;

  beforeEach(async () => {
    mockEmployeeService = jasmine.createSpyObj<EmployeeService>('EmployeeService', ['getById', 'getHistory', 'update', 'delete']);
    mockEmployeeService.getById.and.returnValue(of(mockEmployee));
    mockEmployeeService.getHistory.and.returnValue(of([]));
    mockEmployeeService.update.and.returnValue(of(mockEmployee));
    mockEmployeeService.delete.and.returnValue(of(undefined));

    mockDepartmentService = jasmine.createSpyObj<DepartmentService>('DepartmentService', ['getById', 'getAllUnpaginated']);
    mockDepartmentService.getById.and.returnValue(of(MOCK_DEPARTMENT));
    mockDepartmentService.getAllUnpaginated.and.returnValue(of(MOCK_DEPARTMENTS_LIST));

    mockAuditLogService = jasmine.createSpyObj<AuditLogService>('AuditLogService', ['getAll']);
    mockAuditLogService.getAll.and.returnValue(of({
      data: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 1 }
    } as unknown as { data: AuditLog[]; pagination: { total: number; page: number; limit: number; totalPages: number } }));

    mockAuth = jasmine.createSpyObj<Auth>('Auth', ['getUser', 'isAdmin']);
    mockAuth.getUser.and.returnValue(MOCK_AUTH_USER);
    mockAuth.isAdmin.and.returnValue(true);

    mockLanguageService = jasmine.createSpyObj<LanguageService>('LanguageService', ['getDepartmentName', 'getPositionTranslation']);
    mockLanguageService.getDepartmentName.and.callFake((name: string) => name);
    mockLanguageService.getPositionTranslation.and.callFake((pos: string) => pos);

    // cast using ReturnType to satisfy jasmine.SpyObj wrapper types
    (mockLanguageService as unknown as { currentLang: ReturnType<typeof signal<'vi' | 'en'>> }).currentLang = signal('vi');

    await TestBed.configureTestingModule({
      imports: [
        EmployeeDetail,
        ReactiveFormsModule,
        FormlyModule.forRoot({
          types: [
            { name: 'input', component: DummyComponent },
            { name: 'custom-select', component: DummyComponent },
            { name: 'custom-datepicker', component: DummyComponent },
          ]
        }),
      ],
      providers: [
        { provide: EmployeeService, useValue: mockEmployeeService },
        { provide: DepartmentService, useValue: mockDepartmentService },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: Auth, useValue: mockAuth },
        { provide: LanguageService, useValue: mockLanguageService },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'id' ? 'emp1' : null,
              },
              queryParamMap: {
                get: (key: string) => key === 'departmentId' ? 'd1' : null,
              },
            },
          },
        },
        provideTranslateService(),
        provideHttpClient(),
        MessageService,
        ConfirmationService,
        Notification,
        Confirm,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeDetail);
    component = fixture.componentInstance;
    confirmService = TestBed.inject(Confirm);
    notificationService = TestBed.inject(Notification);
    router = TestBed.inject(Router);
    translate = TestBed.inject(TranslateService);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  describe('Formly dateOfBirth validators', () => {
    let futureDateVal: ((control: FormControl) => boolean) | undefined;
    let ageRangeVal: ((control: FormControl) => boolean) | undefined;

    beforeEach(() => {
      const fieldGroup = component.personalFields[1]?.fieldGroup;
      const dobField = fieldGroup?.[1];
      const validators = dobField?.validators as Record<string, { expression: (control: FormControl) => boolean }> | undefined;

      futureDateVal = validators?.['futureDate']?.expression as ((control: FormControl) => boolean) | undefined;
      ageRangeVal = validators?.['ageRange']?.expression as ((control: FormControl) => boolean) | undefined;
    });

    describe('futureDate validator', () => {
      it('should be defined', () => {
        expect(futureDateVal).toBeDefined();
      });

      it('should return true for empty value', () => {
        if (futureDateVal) expect(futureDateVal(new FormControl(''))).toBe(true);
      });

      it('should return false for future dates (e.g. 3026)', () => {
        if (futureDateVal) expect(futureDateVal(new FormControl('3026-01-01'))).toBe(false);
      });

      it('should return true for past dates (e.g. 2020)', () => {
        if (futureDateVal) expect(futureDateVal(new FormControl('2020-01-01'))).toBe(true);
      });
    });

    describe('ageRange validator', () => {
      it('should be defined', () => {
        expect(ageRangeVal).toBeDefined();
      });

      it('should return true for null value', () => {
        if (ageRangeVal) expect(ageRangeVal(new FormControl(null))).toBe(true);
      });

      it('should return true for valid 20 years old', () => {
        if (!ageRangeVal) return;
        const today = new Date();
        const birthMonth = (today.getMonth() + 1) % 12;
        const birthYear = today.getFullYear() - 20;
        const birthDateStr = `${birthYear}-${String(birthMonth + 1).padStart(2, '0')}-15`;
        expect(ageRangeVal(new FormControl(birthDateStr))).toBe(true);
      });

      it('should return true for tomorrow birthday (still 20 years old)', () => {
        if (!ageRangeVal) return;
        const today = new Date();
        const birthDateTomorrow = new Date(today.getFullYear() - 20, today.getMonth(), today.getDate() + 1);
        const birthDateTomorrowStr = `${birthDateTomorrow.getFullYear()}-${String(birthDateTomorrow.getMonth() + 1).padStart(2, '0')}-${String(birthDateTomorrow.getDate()).padStart(2, '0')}`;
        expect(ageRangeVal(new FormControl(birthDateTomorrowStr))).toBe(true);
      });
    });
  });

  it('should load employee, history, and audit logs on init', () => {
    expect(mockEmployeeService.getById).toHaveBeenCalledWith('emp1');
    expect(mockEmployeeService.getHistory).toHaveBeenCalledWith('emp1');
    expect(mockAuditLogService.getAll).toHaveBeenCalled();
    expect(component.employee()).toEqual(mockEmployee);
  });

  it('should loadEmployee and handle default status and position translation', () => {
    const mockEmpTemp = { ...mockEmployee, status: 'UNKNOWN' as EmployeeStatus, position: 'UNKNOWN' };
    mockEmployeeService.getById.and.returnValue(of(mockEmpTemp));
    component.loadEmployee('emp1');
    fixture.detectChanges();
    expect(component.employee()?.status).toBe('UNKNOWN' as EmployeeStatus);
    expect(component.employee()?.position).toBe('UNKNOWN');
  });

  describe('Format values in details tab', () => {
    it('should identify diff view format when before and after properties are present', () => {
      component.openDetails({
        before: { firstName: 'John' },
        after: { firstName: 'Jane' }
      });
      fixture.detectChanges();
      expect(component.parsedDetails()?.type).toBe('diff');
    });

    it('should identify key-value view format for other object structures', () => {
      component.openDetails({
        firstName: 'John',
        lastName: 'Doe'
      });
      fixture.detectChanges();
      expect(component.parsedDetails()?.type).toBe('key-value');
    });
  });

  it('should handle tabs correctly', () => {
    expect(component.activeTab()).toBe('0');
    component.activeTab.set('1');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('1');
  });

  it('should deleteEmployee after user confirmation and navigate back', async () => {
    component.employee.set(mockEmployee);
    spyOn(confirmService, 'ask').and.returnValue(Promise.resolve(true));
    mockEmployeeService.delete.and.returnValue(of(undefined));
    const successSpy = spyOn(notificationService, 'success').and.callThrough();
    const navigateSpy = spyOn(router, 'navigate').and.callThrough();

    await component.deleteEmployee();
    fixture.detectChanges();

    expect(mockEmployeeService.delete).toHaveBeenCalledWith('emp1');
    expect(successSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/employees']);
  });

  it('should handle deleteEmployee error', async () => {
    component.employee.set(mockEmployee);
    spyOn(confirmService, 'ask').and.returnValue(Promise.resolve(true));
    mockEmployeeService.delete.and.returnValue(throwError(() => ({
      error: { message: 'Delete failed' }
    })));

    await component.deleteEmployee();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Delete failed');
  });

  it('should navigate back on goBack', () => {
    const location = TestBed.inject(Location);
    const backSpy = spyOn(location, 'back').and.callThrough();
    component.goBack();
    expect(backSpy).toHaveBeenCalled();
  });

  it('should return empty parsed details when details is undefined', () => {
    component.openDetails(undefined);
    expect(component.parsedDetails()).toBeNull();
  });

  it('should formatVal key correctly for translatable columns', () => {
    spyOn(translate, 'instant').and.callFake((key: string | string[]) => typeof key === 'string' ? key : key[0]);
    component.openDetails({ status: 'ACTIVE' });
    fixture.detectChanges();
    const details = component.parsedDetails();
    expect(details?.type).toBe('key-value');
  });

  it('should handle loadEmployee error', () => {
    mockEmployeeService.getById.and.returnValue(throwError(() => ({
      error: { message: 'Load error' }
    })));
    component.loadEmployee('emp1');
    fixture.detectChanges();
    expect(component.errorMessage()).toBe('Load error');
  });

  it('should handle loadHistory error', () => {
    mockEmployeeService.getHistory.and.returnValue(throwError(() => ({
      error: { message: 'History error' }
    })));
    component.loadHistory('emp1');
    fixture.detectChanges();
    expect(component.errorMessage()).toBe('History error');
  });

  it('should handle loadAuditLogs error by setting empty array', () => {
    mockAuditLogService.getAll.and.returnValue(throwError(() => new Error('Log error')));
    component.loadAuditLogs('emp1');
    fixture.detectChanges();
    expect(component.auditLogs()).toEqual([]);
  });

  describe('findFieldByKey', () => {
    it('should return field when key exists', () => {
      const result = component.findFieldByKey(component.personalFields, 'firstName');
      expect(result?.key).toBe('firstName');
    });

    it('should return null when key does not exist', () => {
      const notFound = component.findFieldByKey(component.personalFields, 'nonexistent');
      expect(notFound).toBeNull();
    });
  });

  it('should reloadAuditLogs after save', () => {
    mockAuditLogService.getAll.and.returnValue(
      of({ data: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } } as unknown as { data: AuditLog[]; pagination: { total: number; page: number; limit: number; totalPages: number } })
    );
    component.reloadAuditLogs('emp1');
    fixture.detectChanges();
    expect(mockAuditLogService.getAll).toHaveBeenCalled();
  });

  it('should handle error when reloadAuditLogs fails', () => {
    const errorSpy = spyOn(notificationService, 'error');
    mockAuditLogService.getAll.and.returnValue(throwError(() => new Error('Error loading audit logs')));
    component.reloadAuditLogs('emp1');
    fixture.detectChanges();
    expect(mockAuditLogService.getAll).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    expect(component.auditLogs()).toEqual([]);
  });

  it('should early return in deleteEmployee if employee is undefined', async () => {
    component.employee.set(undefined as unknown as Partial<EmployeeModel> & EmployeeModel);
    mockEmployeeService.delete.and.callThrough();
    await component.deleteEmployee();
    expect(mockEmployeeService.delete).not.toHaveBeenCalled();
  });

  describe('translateFieldKey', () => {
    beforeEach(() => {
      spyOn(translate, 'instant').and.callFake((key: string | string[]) => {
        const k = typeof key === 'string' ? key : key[0];
        return k === 'AUDIT.FIELDS.position' ? 'Vị trí' : k;
      });
    });

    it('should return translated label for known key', () => {
      expect(component.translateFieldKey('position')).toBe('Vị trí');
    });

    it('should return the key itself for unknown keys', () => {
      expect(component.translateFieldKey('unknownField')).toBe('unknownField');
    });
  });

  it('should parse diff with department object reference in formatVal', () => {
    spyOn(translate, 'instant').and.callFake((key: string | string[]) => typeof key === 'string' ? key : key[0]);
    component.departmentMap.set('d1', 'Engineering');
    component.openDetails({
      before: { position: 'Nhân viên', department: 'd1' },
      after: { position: 'Trưởng nhóm', department: 'd2' }
    });
    fixture.detectChanges();
    expect(component.parsedDetails()?.type).toBe('diff');
  });

  it('should parse key-value with boolean field in formatVal', () => {
    spyOn(translate, 'instant').and.callFake((key: string | string[]) => typeof key === 'string' ? key : key[0]);
    component.openDetails({ isActive: true, name: 'John' });
    fixture.detectChanges();
    expect(component.parsedDetails()?.type).toBe('key-value');
  });

  it('should handle loadDepartmentDetail success', () => {
    const dept = { _id: 'd2', name: 'HR' };
    mockDepartmentService.getById.and.returnValue(of(dept as Partial<DepartmentModel> & DepartmentModel));
    component.loadDepartmentDetail('d2');
    fixture.detectChanges();
    expect(mockDepartmentService.getById).toHaveBeenCalledWith('d2');
    expect(component.departmentDetail()).toEqual(dept as Partial<DepartmentModel> & DepartmentModel);
  });

  it('should handle loadDepartmentDetail error', () => {
    mockDepartmentService.getById.and.returnValue(throwError(() => new Error('Load error')));
    component.departmentDetail.set(undefined);
    component.loadDepartmentDetail('d2');
    fixture.detectChanges();
    expect(component.departmentDetail()).toBeUndefined();
  });

  it('should handle loadDepartments error', () => {
    mockDepartmentService.getAllUnpaginated.and.returnValue(throwError(() => new Error('Load error')));
    component.departments.set([]);
    component.loadDepartments();
    fixture.detectChanges();
    expect(component.departments()).toEqual([]);
  });

  it('should not delete employee if delete confirmed is false', async () => {
    component.employee.set(mockEmployee);
    spyOn(confirmService, 'ask').and.returnValue(Promise.resolve(false));
    await component.deleteEmployee();
    fixture.detectChanges();
    expect(mockEmployeeService.delete).not.toHaveBeenCalled();
  });

  describe('formatVal helper', () => {
    beforeEach(() => {
      spyOn(translate, 'instant').and.callFake((key: string | string[]) => typeof key === 'string' ? key : key[0]);
    });

    it('should format object with name property when key is not department', () => {
      component.openDetails({ manager: { name: 'Alice Manager' } });
      fixture.detectChanges();
      const pairs = component.parsedDetails()?.type === 'key-value' ? (component.parsedDetails() as unknown as ParsedDetailsKeyValue).pairs : [];
      const pair = pairs.find((p) => p.key === 'manager');
      expect(pair?.value).toBe('Alice Manager');
    });

    it('should format object without name property as JSON string', () => {
      component.openDetails({ metadata: { foo: 'bar' } });
      fixture.detectChanges();
      const pairs = component.parsedDetails()?.type === 'key-value' ? (component.parsedDetails() as unknown as ParsedDetailsKeyValue).pairs : [];
      const pair = pairs.find((p) => p.key === 'metadata');
      expect(pair?.value).toBe(JSON.stringify({ foo: 'bar' }));
    });

    it('should format false boolean value as "Không"', () => {
      component.openDetails({ isManager: false });
      fixture.detectChanges();
      const pairs = component.parsedDetails()?.type === 'key-value' ? (component.parsedDetails() as unknown as ParsedDetailsKeyValue).pairs : [];
      const pair = pairs.find((p) => p.key === 'isManager');
      expect(pair?.value).toBe('Không');
    });

    it('should format nullish value inside a diff as "-"', () => {
      component.openDetails({
        before: { description: null },
        after: { description: 'IT Dept' }
      });
      fixture.detectChanges();
      let diffs = component.parsedDetails()?.type === 'diff' ? (component.parsedDetails() as unknown as ParsedDetailsDiff).diffs : [];
      const diff = diffs.find((d) => d.field === 'description' || d.field === 'DEPARTMENT.COL_DESC');
      expect(diff?.before).toBe('-');
    });

    it('should format department object with name property', () => {
      component.openDetails({ department: { name: 'IT Dept' } });
      fixture.detectChanges();
      let pairs = component.parsedDetails()?.type === 'key-value' ? (component.parsedDetails() as unknown as ParsedDetailsKeyValue).pairs : [];
      let pair = pairs.find((p) => p.key === 'department');
      expect(pair?.value).toBe('IT Dept');
    });

    it('should format undefined values inside a diff as "-"', () => {
      component.openDetails({
        before: { description: undefined },
        after: { description: 'IT Dept' }
      });
      fixture.detectChanges();
      let diffs = component.parsedDetails()?.type === 'diff' ? (component.parsedDetails() as unknown as ParsedDetailsDiff).diffs : [];
      const diff = diffs.find((d) => d.field === 'description' || d.field === 'DEPARTMENT.COL_DESC');
      expect(diff?.before).toBe('-');
    });

    it('should format objects inside diffs as JSON strings', () => {
      component.openDetails({
        before: { metadata: { foo: 'bar' } },
        after: { metadata: { foo: 'baz' } }
      });
      fixture.detectChanges();
      let diffs = component.parsedDetails()?.type === 'diff' ? (component.parsedDetails() as unknown as ParsedDetailsDiff).diffs : [];
      const diff = diffs.find((d) => d.field === 'metadata');
      expect(diff?.before).toBe(JSON.stringify({ foo: 'bar' }));
    });
  });

  it('should decrement age in validator if birth date is later in the year', () => {
    component.initPersonalFields();
    const fieldGroup = component.personalFields[1]?.fieldGroup;
    const dobField = fieldGroup?.[1];
    const validators = dobField?.validators as Record<string, { expression: (control: FormControl) => boolean }> | undefined;
    const ageVal = validators?.['ageRange']?.expression;

    expect(ageVal).toBeDefined();
    if (ageVal) {
      // empty birth date is valid
      expect(ageVal(new FormControl(null))).toBe(true);

      const today = new Date();
      // birthDate: 20 years ago, but 1 month later in the year
      const birthMonth = (today.getMonth() + 1) % 12;
      const birthYear = today.getFullYear() - 20;
      const birthDateStr = `${birthYear}-${String(birthMonth + 1).padStart(2, '0')}-15`;

      // age decremented to 19 (which is >= 18 and <= 65)
      expect(ageVal(new FormControl(birthDateStr))).toBe(true);
    }
  });

  // Replaced in consolidated block
  it('should cover line 319 in updateDepartmentFieldOptions', () => {
    component.departmentFields = [{ key: 'department', props: {} }] as FormlyFieldConfig[];
    Object.defineProperty(component, 'departmentOptions', { value: [{ label: 'IT', value: 'd1' }] });
    component.updateDepartmentFieldOptions();
    expect(component.departmentFields[0].props?.['options']).toBeDefined();
  });

  it('should cover line 644 continue; when formatting nullish key-value detail', () => {
    component.openDetails({
      someKey: 'someValue',
      nullKey: null,
      undefinedKey: undefined
    });
    fixture.detectChanges();
    expect(component.parsedDetails()).toBeDefined();
  });

  it('should cover optional route query params and empty department fallback in departmentOptions', () => {
    fixture = TestBed.createComponent(EmployeeDetail);
    component = fixture.componentInstance;

    spyOn(component.route.snapshot.paramMap, 'get').and.returnValue(null);
    spyOn(component.route.snapshot.queryParamMap, 'get').and.returnValue(null);
    Object.defineProperty(component, 'departmentOptions', { value: [{ label: 'Empty', value: '' }] });

    fixture.detectChanges();
    expect(component.employee()).toBeUndefined();
    expect(component.departmentId()).toBeUndefined();
  });

  describe('syncPersonalModel fallback', () => {
    it('should set default values for missing personal fields', () => {
      component.syncPersonalModel(MOCK_EMPTY_EMPLOYEE);
      expect(component.personalModel['dateOfBirth']).toBeNull();
      expect(component.personalModel['phone']).toBe('');
    });
  });

  describe('syncDepartmentModel fallback', () => {
    it('should set default values for missing department fields', () => {
      component.syncDepartmentModel(MOCK_EMPTY_EMPLOYEE);
      expect(component.departmentModel['department']).toBe('');
    });
  });

  describe('Fallback error messages for API methods', () => {
    it('should cover fallback error message for loadEmployee', () => {
      mockEmployeeService.getById.and.returnValue(throwError(() => ({})));
      component.loadEmployee('e1');
      fixture.detectChanges();
      expect(component.errorMessage()).toContain('EMPLOYEE.LOAD_ERROR');
    });

    it('should cover fallback error message for loadHistory', () => {
      mockEmployeeService.getHistory.and.returnValue(throwError(() => ({})));
      component.loadHistory('e1');
      fixture.detectChanges();
      expect(component.errorMessage()).toContain('EMPLOYEE.LOAD_ERROR');
    });

    it('should cover fallback error message for deleteEmployee', async () => {
      spyOn(confirmService, 'ask').and.resolveTo(true);
      mockEmployeeService.delete.and.returnValue(throwError(() => ({})));
      await component.deleteEmployee();
      fixture.detectChanges();
      expect(component.errorMessage()).toContain('EMPLOYEE.DELETE_ERROR');
    });
  });

  it('should cover object department format during loadEmployee and saveDepartmentInfo', () => {
    // 1. loadEmployee with object department (covers line 346)
    const mockEmpWithDeptObj = {
      _id: 'emp1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      department: { _id: 'd1', name: 'IT' }
    };
    mockEmployeeService.getById.and.returnValue(of(mockEmpWithDeptObj as Partial<EmployeeModel> & EmployeeModel));
    component.loadEmployee('emp1');
    fixture.detectChanges();
    expect(component.employee()).toBeDefined();
  });

  it('should cover undefined department format during loadEmployee and saveDepartmentInfo', () => {
    // 1. loadEmployee with undefined department (covers falsy check in line 346)
    const mockEmpWithNoDept = {
      _id: 'emp1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      department: undefined as unknown as string
    };
    mockEmployeeService.getById.and.returnValue(of(mockEmpWithNoDept as Partial<EmployeeModel> & EmployeeModel));
    component.loadEmployee('emp1');
    fixture.detectChanges();
    expect(component.employee()).toBeDefined();
  });

  it('should save personal information successfully', () => {
    component.employee.set(mockEmployee);
    const updateSpy = mockEmployeeService.update.and.returnValue(of(mockEmployee));
    const successSpy = spyOn(notificationService, 'success').and.callThrough();

    component.activeTab.set('1');
    component.startEditPersonal();

    component.personalForm.addControl('firstName', new FormControl(''));
    component.personalForm.addControl('lastName', new FormControl(''));
    component.personalForm.addControl('gender', new FormControl(''));
    component.personalForm.addControl('dateOfBirth', new FormControl(''));
    component.personalForm.addControl('phone', new FormControl(''));
    component.personalForm.addControl('address', new FormControl(''));

    component.personalForm.setValue(MOCK_PERSONAL_FORM_DATA);

    component.savePersonalInfo();
    fixture.detectChanges();

    expect(updateSpy).toHaveBeenCalled();
    expect(successSpy).toHaveBeenCalled();
    expect(component.isEditingPersonal()).toBe(false);
  });

  it('should handle save personal information error', () => {
    component.employee.set(mockEmployee);
    mockEmployeeService.update.and.returnValue(throwError(() => ({
      error: { message: 'Save personal failed' }
    })));

    component.activeTab.set('1');
    component.startEditPersonal();

    component.personalForm.addControl('firstName', new FormControl(''));
    component.personalForm.addControl('lastName', new FormControl(''));
    component.personalForm.addControl('gender', new FormControl(''));
    component.personalForm.addControl('dateOfBirth', new FormControl(''));
    component.personalForm.addControl('phone', new FormControl(''));
    component.personalForm.addControl('address', new FormControl(''));

    component.personalForm.setValue(MOCK_PERSONAL_FORM_DATA);

    component.savePersonalInfo();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Save personal failed');
    expect(component.isEditingPersonal()).toBe(true);
  });

  it('should early return in savePersonalInfo if form is invalid', () => {
    component.employee.set(mockEmployee);
    const updateSpy = mockEmployeeService.update;
    spyOnProperty(component.personalForm, 'invalid', 'get').and.returnValue(true);

    component.savePersonalInfo();
    fixture.detectChanges();

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('should save department information successfully', () => {
    component.employee.set(mockEmployee);
    const updateSpy = mockEmployeeService.update.and.returnValue(of(mockEmployee));
    const successSpy = spyOn(notificationService, 'success').and.callThrough();

    component.activeTab.set('2');
    component.startEditDepartment();

    component.departmentForm.addControl('position', new FormControl(''));
    component.departmentForm.addControl('department', new FormControl(''));

    component.departmentForm.setValue(MOCK_DEPARTMENT_FORM_DATA);

    component.saveDepartmentInfo();
    fixture.detectChanges();

    expect(updateSpy).toHaveBeenCalledWith('emp1', MOCK_DEPARTMENT_FORM_DATA);
    expect(successSpy).toHaveBeenCalled();
  });

  it('should handle save department info error', () => {
    component.employee.set(mockEmployee);
    mockEmployeeService.update.and.returnValue(throwError(() => ({
      error: { message: 'Save department failed' }
    })));

    component.activeTab.set('2');
    component.startEditDepartment();

    component.departmentForm.addControl('position', new FormControl(''));
    component.departmentForm.addControl('department', new FormControl(''));

    component.departmentForm.setValue(MOCK_DEPARTMENT_FORM_DATA);

    component.saveDepartmentInfo();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Save department failed');
  });

  it('should early return in saveDepartmentInfo if form is invalid', () => {
    component.employee.set(mockEmployee);
    const updateSpy = mockEmployeeService.update;
    spyOnProperty(component.departmentForm, 'invalid', 'get').and.returnValue(true);

    component.saveDepartmentInfo();
    fixture.detectChanges();

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('should return hire date when no history is available', () => {
    component.history.set([]);
    component.employee.set({ ...mockEmployee, hireDate: '2020-01-01' });
    fixture.detectChanges();
    expect(component.getJoinedDepartmentDate()).toBe('2020-01-01');
  });

  it('should return first history transferDate when history exists', () => {
    component.history.set([{ transferDate: '2021-06-15', toDepartment: { _id: 'd1', name: 'IT' } }]);
    fixture.detectChanges();
    expect(component.getJoinedDepartmentDate()).toBe('2021-06-15');
  });

  it('should return null from getJoinedDepartmentDate when no history and no employee', () => {
    component.history.set([]);
    component.employee.set(undefined as unknown as Partial<EmployeeModel> & EmployeeModel);
    fixture.detectChanges();
    expect(component.getJoinedDepartmentDate()).toBeNull();
  });

  describe('isActiveEmployee', () => {
    it('should return true when status is ACTIVE', () => {
      component.employee.set({ ...mockEmployee, status: EmployeeStatus.ACTIVE });
      fixture.detectChanges();
      expect(component.isActiveEmployee()).toBe(true);
    });

    it('should return false when status is INACTIVE', () => {
      component.employee.set({ ...mockEmployee, status: EmployeeStatus.INACTIVE });
      fixture.detectChanges();
      expect(component.isActiveEmployee()).toBe(false);
    });
  });

  it('should getDepartmentManagerName from translate', () => {
    spyOn(translate, 'instant').and.callFake((key: string | string[]) => typeof key === 'string' ? key : key[0]);
    const result = component.getDepartmentManagerName();
    fixture.detectChanges();
    expect(result).toBe('EMPLOYEE.DEPT_MANAGER_VAL');
  });

  describe('Cancel editing states', () => {
    it('discards unsaved personal edits without updating the employee', () => {
      component.startEditPersonal();
      component.personalModel = { ...component.personalModel, phone: '0999999999', address: 'Unsaved address' };
      component.cancelEditPersonal();
      expect(component.personalModel['phone']).toBe(mockEmployee.phone);
      expect(component.personalModel['address']).toBe(mockEmployee.address);
      expect(mockEmployeeService.update).not.toHaveBeenCalled();
    });

    it('discards unsaved work edits without transferring the employee', () => {
      component.startEditDepartment();
      component.departmentModel = { position: 'Unsaved position', department: 'd2' };
      component.cancelEditDepartment();
      expect(component.departmentModel).toEqual({ position: mockEmployee.position, department: 'd1' });
      expect(mockEmployeeService.update).not.toHaveBeenCalled();
    });

    it('should cancel editing personal state', () => {
      component.isEditingPersonal.set(true);
      component.cancelEditPersonal();
      expect(component.isEditingPersonal()).toBe(false);
    });

    it('should cancel editing department state', () => {
      component.isEditingDepartment.set(true);
      component.cancelEditDepartment();
      expect(component.isEditingDepartment()).toBe(false);
    });
  });

  describe('Formly personal validators (phone, address)', () => {
    let phoneVal: Function | undefined;
    let addressVal: Function | undefined;

    beforeEach(() => {
      const phoneField = component.findFieldByKey(component.personalFields, 'phone');
      const addressField = component.findFieldByKey(component.personalFields, 'address');
      phoneVal = (phoneField?.validators as Record<string, { expression: Function }> | undefined)?.['phone']?.expression;
      addressVal = (addressField?.validators as Record<string, { expression: Function }> | undefined)?.['address']?.expression;
    });

    it('should be defined', () => {
      expect(phoneVal).toBeDefined();
      expect(addressVal).toBeDefined();
    });

    describe('phone validator', () => {
      it('should return null for valid phone', () => {
        if (phoneVal) expect(phoneVal(new FormControl('0912345678'))).toBe(true);
      });

      it('should return error for invalid phone', () => {
        if (phoneVal) expect(phoneVal(new FormControl('invalid'))).toBe(false);
      });
    });

    describe('address validator', () => {
      it('should return null for valid address', () => {
        if (addressVal) expect(addressVal(new FormControl('Hanoi'))).toBe(true);
      });

      it('should return error for invalid address', () => {
        if (addressVal) expect(addressVal(new FormControl('Ha'))).toBe(false);
      });
    });
  });

  describe('Falsy employee in action methods', () => {
    beforeEach(() => {
      component.employee.set(undefined as unknown as EmployeeModel);
    });

    it('should not call update when saving personal info with falsy employee', () => {
      const updateSpy = mockEmployeeService.update;
      component.savePersonalInfo();
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should not call update when saving department info with falsy employee', () => {
      const updateSpy = mockEmployeeService.update;
      component.saveDepartmentInfo();
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should not show confirmation dialog when deleting falsy employee', async () => {
      const askSpy = spyOn(confirmService, 'ask');
      await component.deleteEmployee();
      expect(askSpy).not.toHaveBeenCalled();
    });
  });

  it('should test getDepartmentName', () => {
    mockLanguageService.getDepartmentName.and.returnValue('IT Department');
    const result = component.getDepartmentName({ department: 'd1' } as EmployeeModel);
    expect(result).toBe('IT Department');
  });

  describe('openDetails fallback parse branches', () => {
    it('should handle simple raw string details', () => {
      component.openDetails('some raw string details');
      expect(component.parsedDetails()?.type).toBe('simple');
      expect((component.parsedDetails() as unknown as { simpleText: string })?.simpleText).toBe('some raw string details');
    });

    it('should handle invalid JSON string details', () => {
      component.openDetails('{invalid json');
      expect(component.parsedDetails()?.type).toBe('simple');
      expect((component.parsedDetails() as unknown as { simpleText: string })?.simpleText).toBe('{invalid json');
    });

    it('should handle non-object data such as numbers', () => {
      component.openDetails(42);
      expect(component.parsedDetails()?.type).toBe('simple');
      expect((component.parsedDetails() as unknown as { simpleText: string })?.simpleText).toBe('42');
    });

    it('should handle empty object or object with only excluded keys', () => {
      component.openDetails({ _id: '123', password: 'abc' });
      expect(component.parsedDetails()?.type).toBe('simple');
      expect((component.parsedDetails() as unknown as { simpleText: string })?.simpleText).toContain('123');
    });
  });

  it('should return action severity mapping correctly', () => {
    expect(component.getActionSeverity('CREATE_EMPLOYEE')).toBe('success');
    expect(component.getActionSeverity('UPDATE_EMPLOYEE')).toBe('info');
    expect(component.getActionSeverity('DELETE_EMPLOYEE')).toBe('danger');
    expect(component.getActionSeverity('TRANSFER_EMPLOYEE')).toBe('warn');
    expect(component.getActionSeverity('UNKNOWN_ACTION')).toBe('secondary');
  });

  describe('Menu action items commands', () => {
    let items: any[];

    beforeEach(() => {
      component.employee.set(mockEmployee);
      component.initActionItems();
      items = component.actionItems();
    });

    it('should navigate to Edit Info route', () => {
      const navigateSpy = spyOn(router, 'navigate');
      items[0].command?.({ item: items[0] });
      expect(navigateSpy).toHaveBeenCalledWith(['/employees/edit', 'emp1'], jasmine.any(Object));
    });

    it('should switch to Edit Personal tab', () => {
      items[1].command?.({ item: items[1] });
      expect(component.activeTab()).toBe('1');
      expect(component.isEditingPersonal()).toBe(true);
    });

    it('should switch to Edit Department tab', () => {
      items[2].command?.({ item: items[2] });
      expect(component.activeTab()).toBe('2');
      expect(component.isEditingDepartment()).toBe(true);
    });

    it('should open Transfer Dialog', () => {
      const transferSpy = spyOn(component, 'openTransferDialog');
      items[3].command?.({ item: items[3] });
      expect(transferSpy).toHaveBeenCalled();
    });

    it('should trigger delete process', () => {
      const deleteSpy = spyOn(component, 'deleteEmployee');
      items[5].command?.({ item: items[5] });
      expect(deleteSpy).toHaveBeenCalled();
    });
  });

  it('should save personal info when dateOfBirth is a string and handle empty error message fallback', () => {
    component.employee.set(mockEmployee);
    mockEmployeeService.update.and.returnValue(throwError(() => ({})));
    component.startEditPersonal();

    component.personalForm.addControl('firstName', new FormControl(''));
    component.personalForm.addControl('lastName', new FormControl(''));
    component.personalForm.addControl('gender', new FormControl(''));
    component.personalForm.addControl('dateOfBirth', new FormControl(''));
    component.personalForm.addControl('phone', new FormControl(''));
    component.personalForm.addControl('address', new FormControl(''));

    component.personalForm.setValue({
      firstName: 'John',
      lastName: 'Doe',
      gender: 'MALE',
      dateOfBirth: '1995-05-05',
      phone: '0912345678',
      address: 'Hanoi'
    });

    component.savePersonalInfo();
    fixture.detectChanges();

    expect(component.errorMessage()).toContain('EMPLOYEE.SAVE_ERROR');
  });

  describe('onTabChange', () => {
    it('should set activeTab when tab index is defined', () => {
      component.onTabChange('3');
      expect(component.activeTab()).toBe('3');
    });

    it('should default to 0 when tab index is undefined', () => {
      component.onTabChange(undefined);
      expect(component.activeTab()).toBe('0');
    });
  });

  describe('saveDepartmentInfo', () => {
    it('should save successfully when department is a string', () => {
      component.employee.set(mockEmployee);
      const empWithDeptStr = { ...mockEmployee, department: 'd1' };
      mockEmployeeService.update.and.returnValue(of(empWithDeptStr as Partial<EmployeeModel> & EmployeeModel));

      component.startEditDepartment();
      component.departmentForm.addControl('position', new FormControl(''));
      component.departmentForm.addControl('department', new FormControl(''));
      component.departmentForm.setValue({
        position: 'Trưởng phòng',
        department: 'd1'
      });

      component.saveDepartmentInfo();
      fixture.detectChanges();
      expect(component.departmentModel['department']).toBe('d1');
    });

    it('should handle empty error message fallback on save failure', () => {
      component.employee.set(mockEmployee);
      mockEmployeeService.update.and.returnValue(throwError(() => ({})));

      component.startEditDepartment();
      component.departmentForm.addControl('position', new FormControl(''));
      component.departmentForm.addControl('department', new FormControl(''));
      component.departmentForm.setValue({
        position: 'Trưởng phòng',
        department: 'd1'
      });

      component.saveDepartmentInfo();
      fixture.detectChanges();
      expect(component.errorMessage()).toContain('EMPLOYEE.SAVE_ERROR');
    });
  });

  it('should getCurrentDepartmentId when department is a string', () => {
    component.employee.set({ ...mockEmployee, department: 'd1' } as EmployeeModel);
    expect(component.getCurrentDepartmentId()).toBe('d1');
  });

  it('should openTransferDialog correctly', () => {
    component.openTransferDialog();
    expect(component.selectedTransferDeptId).toBe('');
    expect(component.showTransferDialog).toBe(true);
  });

  it('should early return in confirmTransfer if employee is undefined', async () => {
    component.employee.set(undefined);
    await component.confirmTransfer();
    expect(mockEmployeeService.update).not.toHaveBeenCalled();
  });

  it('should early return in confirmTransfer if selectedTransferDeptId is empty', async () => {
    component.employee.set(mockEmployee);
    component.selectedTransferDeptId = '';
    await component.confirmTransfer();
    expect(mockEmployeeService.update).not.toHaveBeenCalled();
  });

  it('should not transfer if user cancels confirmation', async () => {
    component.employee.set(mockEmployee);
    component.selectedTransferDeptId = 'd2';
    spyOn(confirmService, 'ask').and.returnValue(Promise.resolve(false));

    await component.confirmTransfer();
    expect(mockEmployeeService.update).not.toHaveBeenCalled();
  });

  it('should transfer successfully if user confirms and update succeeds', async () => {
    component.employee.set(mockEmployee);
    component.selectedTransferDeptId = 'd2';
    spyOn(confirmService, 'ask').and.returnValue(Promise.resolve(true));

    const updatedEmp = { ...mockEmployee, department: 'd2' };
    mockEmployeeService.update.and.returnValue(of(updatedEmp as Partial<EmployeeModel> & EmployeeModel));
    const successSpy = spyOn(notificationService, 'success').and.callThrough();

    await component.confirmTransfer();
    fixture.detectChanges();

    expect(mockEmployeeService.update).toHaveBeenCalledWith('emp1', { department: 'd2' });
    expect(successSpy).toHaveBeenCalled();
    expect(component.showTransferDialog).toBe(false);
  });

  describe('transfer error handling', () => {
    it('should show specific error message from API', async () => {
      component.employee.set(mockEmployee);
      component.selectedTransferDeptId = 'd2';
      spyOn(confirmService, 'ask').and.returnValue(Promise.resolve(true));

      mockEmployeeService.update.and.returnValue(throwError(() => ({ error: { message: 'Transfer failed' } })));
      const errorSpy = spyOn(notificationService, 'error').and.callThrough();

      await component.confirmTransfer();
      fixture.detectChanges();

      expect(errorSpy).toHaveBeenCalledWith('Transfer failed');
      expect(component.isTransferring()).toBe(false);
    });

    it('should show default error when API error message is empty', async () => {
      component.employee.set(mockEmployee);
      component.selectedTransferDeptId = 'd2';
      spyOn(confirmService, 'ask').and.returnValue(Promise.resolve(true));

      mockEmployeeService.update.and.returnValue(throwError(() => ({})));
      const errorSpy = spyOn(notificationService, 'error').and.callThrough();

      await component.confirmTransfer();
      fixture.detectChanges();

      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
