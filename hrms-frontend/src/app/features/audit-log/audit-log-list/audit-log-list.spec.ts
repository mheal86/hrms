import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditLogList } from './audit-log-list';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { Auth } from '../../../core/services/auth';
import { LanguageService } from '../../../core/services/language.service';
import { Department as DepartmentService } from '../../../core/services/department.service';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

interface ParsedDetailsDiff {
  type: 'diff';
  diffs: { field: string; before: string; after: string }[];
}

interface ParsedDetailsKeyValue {
  type: 'key-value';
  pairs: { key: string; value: string }[];
}

interface ParsedDetailsSimple {
  type: 'simple';
  simpleText: string;
}

describe('AuditLogList', () => {
  let component: AuditLogList;
  let fixture: ComponentFixture<AuditLogList>;
  let translate: TranslateService;

  const MOCK_AUTH_USER = { id: '1', username: 'admin', role: 'ADMIN' };
  const MOCK_ACTIONS = ['CREATE_EMPLOYEE', 'UPDATE_EMPLOYEE'];
  const MOCK_USERS = [{ _id: 'u1', username: 'user1' }];
  const MOCK_DEPARTMENTS = [
    { _id: 'd1', name: 'Phòng Nhân sự', description: 'NS' },
    { _id: 'd2', name: 'Phòng R&D', description: 'RD' }
  ];

  const MOCK_DETAILS_KEY_VALUE = { ip: '127.0.0.1', department: 'd1', isApproved: true };
  const MOCK_DETAILS_DIFF = {
    before: { position: 'Nhân viên', email: 'old@example.com', password: 'hash' },
    after: { position: 'Trưởng nhóm', email: 'new@example.com', password: 'hash2' }
  };

  let mockAuditLogService: jasmine.SpyObj<AuditLogService>;
  let mockDepartmentService: jasmine.SpyObj<DepartmentService>;
  let mockAuth: jasmine.SpyObj<Auth>;
  let mockLanguageService: jasmine.SpyObj<LanguageService>;

  beforeEach(async () => {
    mockAuditLogService = jasmine.createSpyObj<AuditLogService>('AuditLogService', ['getAll', 'getActions', 'getUsers']);
    mockAuditLogService.getAll.and.returnValue(of({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } }));
    mockAuditLogService.getActions.and.returnValue(of(MOCK_ACTIONS));
    mockAuditLogService.getUsers.and.returnValue(of(MOCK_USERS));

    mockDepartmentService = jasmine.createSpyObj<DepartmentService>('DepartmentService', ['getAllUnpaginated']);
    mockDepartmentService.getAllUnpaginated.and.returnValue(of(MOCK_DEPARTMENTS));

    mockAuth = jasmine.createSpyObj<Auth>('Auth', ['getUser', 'isAdmin']);
    mockAuth.getUser.and.returnValue(MOCK_AUTH_USER);
    mockAuth.isAdmin.and.returnValue(true);

    mockLanguageService = jasmine.createSpyObj<LanguageService>('LanguageService', ['getDepartmentName', 'getPositionTranslation']);
    mockLanguageService.getDepartmentName.and.callFake((name: string) => name);
    mockLanguageService.getPositionTranslation.and.callFake((pos: string) => pos);
    Object.defineProperty(mockLanguageService, 'currentLang', {
      value: signal('vi'),
      writable: true
    });

    await TestBed.configureTestingModule({
      imports: [AuditLogList],
      providers: [
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: DepartmentService, useValue: mockDepartmentService },
        { provide: Auth, useValue: mockAuth },
        { provide: LanguageService, useValue: mockLanguageService },
        provideTranslateService(),
        provideRouter([]),
        provideHttpClient(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogList);
    component = fixture.componentInstance;
    translate = TestBed.inject(TranslateService);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should load departments into mapping map', () => {
    expect(component.departmentMap.get('d1')).toBe('Phòng Nhân sự');
    expect(component.departmentMap.get('d2')).toBe('Phòng R&D');
  });

  it('should load dropdown options in loadFilterOptions', () => {
    expect(component.actionOptions().length).toBe(2);
    expect(component.userOptions().length).toBe(1);
    expect(component.userOptions()[0]).toEqual({ label: 'user1', value: 'u1' });
  });

  it('should handle pagination in onPageChange', () => {
    const loadSpy = spyOn(component, 'loadLogs').and.callThrough();
    component.onPageChange({ page: 2, rows: 15, first: 30 });
    fixture.detectChanges();

    expect(component.currentPage()).toBe(3);
    expect(component.pageSize).toBe(15);
    expect(component.first).toBe(30);
    expect(loadSpy).toHaveBeenCalled();
  });

  describe('onSort', () => {
    it('should toggle sort direction when sorting the same field', () => {
      component.sortField = 'createdAt';
      component.sortOrder = 'desc';
      component.onSort('createdAt');
      fixture.detectChanges();
      expect(component.sortOrder).toBe('asc');
    });

    it('should reset sort direction when sorting a different field', () => {
      const loadSpy = spyOn(component, 'loadLogs').and.callThrough();
      component.onSort('username');
      fixture.detectChanges();
      expect(component.sortField).toBe('username');
      expect(component.sortOrder).toBe('desc');
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe('onDateRangeChange', () => {
    let loadSpy: jasmine.Spy;

    beforeEach(() => {
      loadSpy = spyOn(component, 'loadLogs').and.callThrough();
    });

    it('should clear date filters when range is null', () => {
      component.onDateRangeChange(null);
      fixture.detectChanges();
      expect(component.startDate).toBeUndefined();
      expect(component.endDate).toBeUndefined();
    });

    it('should set only start date when end date is missing', () => {
      const d1 = new Date('2026-01-01T12:00:00Z');
      component.onDateRangeChange([d1, null] as unknown as Date[]);
      fixture.detectChanges();
      expect(component.startDate).toBeDefined();
      expect(component.endDate).toBeUndefined();
    });

    it('should set both start and end dates when full range is provided', () => {
      const d1 = new Date('2026-01-01T12:00:00Z');
      const d2 = new Date('2026-01-02T12:00:00Z');
      component.onDateRangeChange([d1, d2]);
      fixture.detectChanges();
      expect(component.startDate).toBeDefined();
      expect(component.endDate).toBeDefined();
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  it('should clear all filters', () => {
    const loadSpy = spyOn(component, 'loadLogs').and.callThrough();
    component.searchTerm = 'test';
    component.selectedUser = 'u1';
    component.selectedAction = 'CREATE';

    component.clearFilters();
    fixture.detectChanges();

    expect(component.searchTerm).toBe('');
    expect(component.selectedUser).toBeNull();
    expect(component.selectedAction).toBeNull();
    expect(component.startDate).toBeUndefined();
    expect(component.endDate).toBeUndefined();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should map action keys to PrimeNG Tag severity configurations', () => {
    expect(component.getActionTagConfig('CREATE_EMPLOYEE').severity).toBe('success');
    expect(component.getActionTagConfig('UPDATE_DEPARTMENT').severity).toBe('warn');
    expect(component.getActionTagConfig('TRANSFER_EMPLOYEE').severity).toBe('contrast');
    expect(component.getActionTagConfig('DELETE_EMPLOYEE').severity).toBe('danger');
    expect(component.getActionTagConfig('CHANGE_PASSWORD').severity).toBe('secondary');
    expect(component.getActionTagConfig('UNKNOWN').severity).toBe('info');
  });

  describe('parseDetailsData', () => {
    it('should parse empty details', () => {
      component.showDetails(null);
      fixture.detectChanges();
      expect(component.parsedDetails()).toBeNull();
      expect(component.displayDetails).toBe(true);
    });

    it('should parse simple text details', () => {
      component.showDetails('simple plain text');
      fixture.detectChanges();
      expect(component.parsedDetails()).toEqual({ type: 'simple', simpleText: 'simple plain text' });
    });

    it('should parse invalid JSON as simple text', () => {
      component.showDetails('{invalid-json}');
      fixture.detectChanges();
      expect(component.parsedDetails()).toEqual({ type: 'simple', simpleText: '{invalid-json}' });
    });

    it('should parse key-value JSON objects', () => {
      spyOn(translate, 'instant').and.callFake((key) => {
        if (key === 'AUDIT.FIELDS.ip') return 'IP Address';
        if (key === 'AUDIT.FIELDS.department') return 'Phòng ban';
        if (key === 'AUDIT.FIELDS.isApproved') return 'Được duyệt';
        return typeof key === 'string' ? key : key[0];
      });

      component.showDetails(MOCK_DETAILS_KEY_VALUE);
      fixture.detectChanges();

      const parsed = component.parsedDetails() as ParsedDetailsKeyValue;
      expect(parsed.type).toBe('key-value');
      expect(parsed.pairs.length).toBe(3);
      expect(parsed.pairs[0]).toEqual({ key: 'IP Address', value: '127.0.0.1' });
      // Resolves d1 to 'Phòng Nhân sự' via departmentMap
      expect(parsed.pairs[1]).toEqual({ key: 'Phòng ban', value: 'Phòng Nhân sự' });
      // Resolves boolean to Vietnamese string
      expect(parsed.pairs[2]).toEqual({ key: 'Được duyệt', value: 'Có' });
    });

    it('should parse diff JSON objects with before/after changes', () => {
      spyOn(translate, 'instant').and.callFake((key) => {
        if (key === 'AUDIT.FIELDS.position') return 'Chức vụ';
        if (key === 'AUDIT.FIELDS.email') return 'Email';
        return typeof key === 'string' ? key : key[0];
      });

      component.showDetails(MOCK_DETAILS_DIFF);
      fixture.detectChanges();

      const parsed = component.parsedDetails() as ParsedDetailsDiff;
      expect(parsed.type).toBe('diff');
      // Password keys should be excluded from display
      expect(parsed.diffs.length).toBe(2);
      expect(parsed.diffs[0]).toEqual({
        field: 'Chức vụ',
        before: 'Nhân viên',
        after: 'Trưởng nhóm'
      });
    });
  });

  it('should parse formatVal with object having name field (non-department)', () => {
    spyOn(translate, 'instant').and.callFake((key) => typeof key === 'string' ? key : key[0]);
    component.showDetails({ manager: { name: 'John Doe', _id: 'u1' } });
    fixture.detectChanges();
    const parsed = component.parsedDetails() as ParsedDetailsKeyValue;
    expect(parsed.type).toBe('key-value');
    expect(parsed.pairs[0].value).toBe('John Doe');
  });

  it('should parse formatVal with department object type (goes through getDepartmentName)', () => {
    spyOn(translate, 'instant').and.callFake((key) => typeof key === 'string' ? key : key[0]);
    mockLanguageService.getDepartmentName.and.returnValue('Translated Dept');
    component.showDetails({ department: { _id: 'd1', name: 'Engineering' } });
    fixture.detectChanges();
    const parsed = component.parsedDetails() as ParsedDetailsKeyValue;
    expect(parsed.type).toBe('key-value');
    expect(mockLanguageService.getDepartmentName).toHaveBeenCalled();
  });

  it('should parse formatVal with object without name field (uses JSON.stringify)', () => {
    spyOn(translate, 'instant').and.callFake((key) => typeof key === 'string' ? key : key[0]);
    component.showDetails({ config: { key1: 'val1', key2: 'val2' } });
    fixture.detectChanges();
    const parsed = component.parsedDetails() as ParsedDetailsKeyValue;
    expect(parsed.type).toBe('key-value');
    expect(parsed.pairs[0].value).toContain('"val1"');
  });

  it('should parse formatVal with department key string (not in map)', () => {
    spyOn(translate, 'instant').and.callFake((key) => typeof key === 'string' ? key : key[0]);
    component.showDetails({ fromDepartment: 'Engineering', toDepartmentName: 'IT' });
    fixture.detectChanges();
    const parsed = component.parsedDetails() as ParsedDetailsKeyValue;
    expect(parsed.type).toBe('key-value');
  });

  it('should parse to simple JSON when all pairs have only excluded keys', () => {
    spyOn(translate, 'instant').and.callFake((key) => typeof key === 'string' ? key : key[0]);
    component.showDetails({ _id: 'xxx', __v: 0 });
    fixture.detectChanges();
    const parsed = component.parsedDetails() as ParsedDetailsSimple;
    expect(parsed.type).toBe('simple');
    expect(parsed.simpleText).toContain('xxx');
  });

  it('should produce empty diff (same before/after values = no diffs) and fall to key-value', () => {
    spyOn(translate, 'instant').and.callFake((key) => typeof key === 'string' ? key : key[0]);
    const details = {
      before: { email: 'same@example.com' },
      after: { email: 'same@example.com' },
      someKey: 'someValue'
    };
    component.showDetails(details);
    fixture.detectChanges();
    const parsed = component.parsedDetails() as ParsedDetailsKeyValue;
    expect(parsed.type).toBe('key-value');
  });

  it('should fallback to act when translate.instant is falsy', () => {
    spyOn(translate, 'instant').and.returnValue('');
    component.loadFilterOptions();
    fixture.detectChanges();
    expect(component.actionOptions()[0].label).toBe('CREATE_EMPLOYEE');
  });

  describe('onDateRangeChange array cases', () => {
    it('should reset date filters when range is an empty array', () => {
      const loadSpy = spyOn(component, 'resetAndLoad');
      component.onDateRangeChange([]);
      fixture.detectChanges();
      expect(component.startDate).toBeUndefined();
      expect(component.endDate).toBeUndefined();
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should set only start date when range has a single element', () => {
      spyOn(component, 'resetAndLoad');
      const d1 = new Date();
      component.onDateRangeChange([d1]);
      fixture.detectChanges();
      expect(component.startDate).toBeDefined();
      expect(component.endDate).toBeUndefined();
    });
  });

  describe('loadLogs error handling', () => {
    it('should set server error message when API returns error with message', () => {
      mockAuditLogService.getAll.and.returnValue(throwError(() => ({ error: { message: 'Server Error' } })));
      component.loadLogs();
      fixture.detectChanges();
      expect(component.errorMessage()).toBe('Server Error');
    });

    it('should set default fallback error message when API error has no message', () => {
      spyOn(translate, 'instant').and.returnValue('Default Error');
      mockAuditLogService.getAll.and.returnValue(throwError(() => ({})));
      component.loadLogs();
      fixture.detectChanges();
      expect(component.errorMessage()).toBe('Default Error');
    });
  });

  it('should parse non-object details that stringify to valid primitive JSON', () => {
    component.showDetails('"just a string"');
    fixture.detectChanges();
    const parsed = component.parsedDetails();
    expect(parsed).toEqual({ type: 'simple', simpleText: 'just a string' });
  });

  it('should handle diff formatting with null/undefined values and boolean false', () => {
    spyOn(translate, 'instant').and.callFake((key: string) => key);
    const details = {
      before: { foo: null, isApproved: true },
      after: { foo: 'bar', isApproved: false }
    };
    component.showDetails(details);
    fixture.detectChanges();
    const parsed = component.parsedDetails() as ParsedDetailsDiff;
    expect(parsed.type).toBe('diff');
    expect(parsed.diffs.find((d) => d.field === 'foo')?.before).toBe('-');
    expect(parsed.diffs.find((d) => d.field === 'isApproved')?.after).toBe('Không');
  });

  it('should use fallback values in onPageChange when event properties are nullish', () => {
    component.onPageChange({} as unknown as { page?: number; rows?: number; first?: number });
    fixture.detectChanges();
    expect(component.currentPage()).toBe(1);
    expect(component.pageSize).toBe(7);
    expect(component.first).toBe(0);
  });

  it('should toggle sortOrder from asc to desc when sorting same field', () => {
    component.sortField = 'createdAt';
    component.sortOrder = 'asc';
    component.onSort('createdAt');
    fixture.detectChanges();
    expect(component.sortOrder).toBe('desc');
  });

  describe('getActionTagConfig switch cases', () => {
    it('should return correct tag config for CREATE_DEPARTMENT', () => {
      expect(component.getActionTagConfig('CREATE_DEPARTMENT').severity).toBe('success');
    });

    it('should return correct tag config for UPDATE_EMPLOYEE', () => {
      expect(component.getActionTagConfig('UPDATE_EMPLOYEE').severity).toBe('warn');
    });

    it('should return correct tag config for UPDATE_USER', () => {
      expect(component.getActionTagConfig('UPDATE_USER').severity).toBe('warn');
    });

    it('should return correct tag config for DELETE_DEPARTMENT', () => {
      expect(component.getActionTagConfig('DELETE_DEPARTMENT').severity).toBe('danger');
    });

    it('should return correct tag config for CHANGE_PASSWORD_BY_ADMIN', () => {
      expect(component.getActionTagConfig('CHANGE_PASSWORD_BY_ADMIN').severity).toBe('secondary');
    });
  });

  it('should format department object with name property using getDepartmentName', () => {
    mockLanguageService.getDepartmentName.and.returnValue('Translated Dept');
    component.showDetails({ department: { name: 'Raw Dept' } });
    fixture.detectChanges();
    const parsed = component.parsedDetails() as ParsedDetailsKeyValue;
    expect(parsed.type).toBe('key-value');
    expect(parsed.pairs[0].value).toBe('Translated Dept');
    expect(mockLanguageService.getDepartmentName).toHaveBeenCalled();
  });

  it('should format object with name property for non-department key', () => {
    mockLanguageService.getDepartmentName.and.returnValue('Translated');
    component.showDetails({ someObject: { name: 'Engineering' } });
    fixture.detectChanges();
    const parsed = component.parsedDetails() as ParsedDetailsKeyValue;
    expect(parsed.type).toBe('key-value');
    expect(parsed.pairs[0].value).toBe('Engineering');
  });

  it('should skip null or undefined values in key-value details', () => {
    component.showDetails({ validKey: 'value', nullKey: null, undefinedKey: undefined });
    fixture.detectChanges();
    const parsed = component.parsedDetails() as ParsedDetailsKeyValue;
    expect(parsed.type).toBe('key-value');
    expect(parsed.pairs.length).toBe(1);
    expect(parsed.pairs[0].value).toBe('value');
  });
});
