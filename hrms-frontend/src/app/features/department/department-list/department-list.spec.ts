import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DepartmentList } from './department-list';
import { Department as DepartmentService } from '../../../core/services/department.service';
import { Auth } from '../../../core/services/auth';
import { LanguageService } from '../../../core/services/language.service';
import { Notification } from '../../../core/services/notification';
import { Confirm } from '../../../core/services/confirm';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { MessageService, ConfirmationService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { Department as DepartmentModel } from '../../../core/models/department-model';

describe('DepartmentList', () => {
  let component: DepartmentList;
  let fixture: ComponentFixture<DepartmentList>;
  let confirmService: Confirm;
  let notificationService: Notification;

  const MOCK_AUTH_USER = { id: '1', username: 'admin', role: 'ADMIN' };

  const MOCK_DEPARTMENT: DepartmentModel = { _id: 'd1', name: 'IT', description: 'Tech' };
  const MOCK_DEPARTMENT_WITHOUT_ID: DepartmentModel = { name: 'IT', description: '' };

  const MOCK_PAGINATED_DEPARTMENTS = {
    data: [MOCK_DEPARTMENT],
    pagination: { total: 1, page: 1, limit: 7, totalPages: 1 }
  };

  let mockDepartmentService: jasmine.SpyObj<DepartmentService>;
  let mockAuth: jasmine.SpyObj<Auth>;
  let mockLanguageService: jasmine.SpyObj<LanguageService>;

  beforeEach(async () => {
    mockDepartmentService = jasmine.createSpyObj<DepartmentService>('DepartmentService', ['getAll', 'delete']);
    mockDepartmentService.getAll.and.returnValue(of(MOCK_PAGINATED_DEPARTMENTS));
    mockDepartmentService.delete.and.returnValue(of(undefined));

    mockAuth = jasmine.createSpyObj<Auth>('Auth', ['getUser', 'isAdmin']);
    mockAuth.getUser.and.returnValue(MOCK_AUTH_USER);
    mockAuth.isAdmin.and.returnValue(true);

    mockLanguageService = jasmine.createSpyObj<LanguageService>('LanguageService', ['getDepartmentName', 'getDepartmentDesc']);
    mockLanguageService.getDepartmentName.and.callFake((name: string) => name);
    mockLanguageService.getDepartmentDesc.and.callFake((_name: string, desc: string) => desc);

    await TestBed.configureTestingModule({
      imports: [DepartmentList],
      providers: [
        { provide: DepartmentService, useValue: mockDepartmentService },
        { provide: Auth, useValue: mockAuth },
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

    fixture = TestBed.createComponent(DepartmentList);
    component = fixture.componentInstance;
    confirmService = TestBed.inject(Confirm);
    notificationService = TestBed.inject(Notification);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should handle pagination in onPageChange', () => {
    const loadSpy = spyOn(component, 'loadDepartments').and.callThrough();
    component.onPageChange({ page: 1, rows: 10, first: 10 });
    fixture.detectChanges();

    expect(component.currentPage()).toBe(2);
    expect(component.pageSize).toBe(10);
    expect(component.first).toBe(10);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should delete department after user confirmation', async () => {
    spyOn(confirmService, 'ask').and.resolveTo(true);
    mockDepartmentService.delete.and.returnValue(of(undefined));
    const successSpy = spyOn(notificationService, 'success').and.callThrough();
    const loadSpy = spyOn(component, 'loadDepartments').and.callThrough();

    await component.onDelete(MOCK_DEPARTMENT);
    fixture.detectChanges();

    expect(mockDepartmentService.delete).toHaveBeenCalledWith('d1');
    expect(successSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should handle delete error', async () => {
    spyOn(confirmService, 'ask').and.resolveTo(true);
    mockDepartmentService.delete.and.returnValue(throwError(() => ({
      error: { message: 'Cannot delete' }
    })));
    const errorSpy = spyOn(notificationService, 'error').and.callThrough();

    await component.onDelete(MOCK_DEPARTMENT);
    fixture.detectChanges();

    expect(errorSpy).toHaveBeenCalledWith('Cannot delete');
  });

  it('should handle loadDepartments error with message', () => {
    mockDepartmentService.getAll.and.returnValue(throwError(() => ({
      error: { message: 'Load error' }
    })));
    component.loadDepartments();
    fixture.detectChanges();
    expect(component.errorMessage()).toBe('Load error');
  });

  it('should handle loadDepartments error with fallback message', () => {
    mockDepartmentService.getAll.and.returnValue(throwError(() => ({})));
    component.loadDepartments();
    fixture.detectChanges();
    expect(component.errorMessage()).toContain('DEPARTMENT.LOAD_ERROR');
  });

  it('should trigger search and reset pagination', () => {
    const loadSpy = spyOn(component, 'loadDepartments');
    component.searchTerm = 'IT';
    component.onSearchTrigger();
    fixture.detectChanges();
    expect(component.currentPage()).toBe(1);
    expect(component.first).toBe(0);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should handle onPageChange with nullish event values', () => {
    spyOn(component, 'loadDepartments');
    component.onPageChange({});
    fixture.detectChanges();
    expect(component.first).toBe(0);
    expect(component.pageSize).toBe(5);
    expect(component.currentPage()).toBe(1);
  });

  it('should return menu items and call onDelete on command', () => {
    const deleteSpy = spyOn(component, 'onDelete');
    const items = component.getDepartmentMenuItems(MOCK_DEPARTMENT);
    expect(items.length).toBe(3);

    const deleteItem = items.find(i => i.label?.includes('DELETE') || i.icon?.includes('trash'));
    expect(deleteItem).toBeDefined();
    deleteItem?.command?.({ item: deleteItem });
    fixture.detectChanges();

    expect(deleteSpy).toHaveBeenCalledWith(MOCK_DEPARTMENT);
  });

  it('should early return in onDelete if department has no id', async () => {
    const askSpy = spyOn(confirmService, 'ask');
    await component.onDelete(MOCK_DEPARTMENT_WITHOUT_ID);
    fixture.detectChanges();
    expect(askSpy).not.toHaveBeenCalled();
  });

  it('should early return in onDelete if user rejects confirmation', async () => {
    spyOn(confirmService, 'ask').and.resolveTo(false);
    await component.onDelete(MOCK_DEPARTMENT);
    fixture.detectChanges();
    expect(mockDepartmentService.delete).not.toHaveBeenCalled();
  });

  it('should show employee count error on delete failure', async () => {
    spyOn(confirmService, 'ask').and.resolveTo(true);
    mockDepartmentService.delete.and.returnValue(throwError(() => ({
      error: { employeeCount: 3 }
    })));
    const errorSpy = spyOn(notificationService, 'error');
    await component.onDelete(MOCK_DEPARTMENT);
    fixture.detectChanges();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should show fallback error on delete failure', async () => {
    spyOn(confirmService, 'ask').and.resolveTo(true);
    mockDepartmentService.delete.and.returnValue(throwError(() => ({})));
    const errorSpy = spyOn(notificationService, 'error');
    await component.onDelete(MOCK_DEPARTMENT);
    fixture.detectChanges();
    expect(errorSpy).toHaveBeenCalled();
  });
});
