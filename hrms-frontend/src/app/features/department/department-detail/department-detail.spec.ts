import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DepartmentDetail } from './department-detail';
import { Department as DepartmentService } from '../../../core/services/department.service';
import { Employee as EmployeeService } from '../../../core/services/employee.service';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';
import { Confirm } from '../../../core/services/confirm';
import { LanguageService } from '../../../core/services/language.service';
import { ActivatedRoute, Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { MessageService, ConfirmationService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import type { Department as DepartmentModel } from '../../../core/models/department-model';
import { Employee as EmployeeModel, EmployeeStatus } from '../../../core/models/employee-model';

describe('DepartmentDetail', () => {
  let component: DepartmentDetail;
  let fixture: ComponentFixture<DepartmentDetail>;
  let confirmService: Confirm;
  let notificationService: Notification;
  let router: Router;

  const MOCK_AUTH_USER = { id: '1', username: 'admin', role: 'ADMIN' };

  const MOCK_DEPARTMENT: DepartmentModel = { _id: 'd1', name: 'IT', code: 'IT01', description: 'Tech' } as Partial<DepartmentModel> & DepartmentModel;
  const MOCK_DEPARTMENTS_LIST: (Partial<DepartmentModel> & DepartmentModel)[] = [
    { _id: 'd1', name: 'IT', description: 'IT' },
    { _id: 'd2', name: 'HR', description: 'HR' }
  ] as (Partial<DepartmentModel> & DepartmentModel)[];

  const MOCK_SINGLE_ACTIVE_EMPLOYEE: (Partial<EmployeeModel> & EmployeeModel)[] = [
    { _id: 'e1', firstName: 'A', lastName: 'B', email: 'a@b.com', status: EmployeeStatus.ACTIVE } as Partial<EmployeeModel> & EmployeeModel
  ];

  const MOCK_EMPLOYEES_FOR_CHART: (Partial<EmployeeModel> & EmployeeModel)[] = [
    { _id: 'e1', firstName: 'A', lastName: 'B', email: 'a@b.com', status: EmployeeStatus.ACTIVE, position: 'P1' },
    { _id: 'e2', firstName: 'A', lastName: 'B', email: 'a@b.com', status: EmployeeStatus.ACTIVE, position: 'P2' },
    { _id: 'e3', firstName: 'A', lastName: 'B', email: 'a@b.com', status: EmployeeStatus.ACTIVE, position: 'P3' },
    { _id: 'e4', firstName: 'A', lastName: 'B', email: 'a@b.com', status: EmployeeStatus.ACTIVE, position: 'P4' },
    { _id: 'e5', firstName: 'A', lastName: 'B', email: 'a@b.com', status: EmployeeStatus.ACTIVE, position: 'P5' },
    { _id: 'e6', firstName: 'A', lastName: 'B', email: 'a@b.com', status: EmployeeStatus.ACTIVE, position: 'Nhân viên' },
  ] as (Partial<EmployeeModel> & EmployeeModel)[];

  const MOCK_OTHER_SEARCH_EMPLOYEES: (Partial<EmployeeModel> & EmployeeModel)[] = [
    { firstName: 'Alice', lastName: 'Smith', position: 'Developer', department: { name: 'IT' } },
    { firstName: 'Bob', lastName: 'Jones', position: 'Manager', department: 'd2' },
    { firstName: 'Charlie', lastName: 'Brown', position: 'Designer', department: { name: 'HR' } },
  ] as (Partial<EmployeeModel> & EmployeeModel)[];

  let mockDepartmentService: jasmine.SpyObj<DepartmentService>;
  let mockEmployees: EmployeeModel[];
  let mockEmployeeService: jasmine.SpyObj<EmployeeService>;
  let mockAuth: jasmine.SpyObj<Auth>;
  let mockLanguageService: jasmine.SpyObj<LanguageService>;

  beforeEach(async () => {
    mockDepartmentService = jasmine.createSpyObj<DepartmentService>('DepartmentService', ['getById', 'getAllUnpaginated']);
    mockDepartmentService.getById.and.returnValue(of(MOCK_DEPARTMENT));
    mockDepartmentService.getAllUnpaginated.and.returnValue(of(MOCK_DEPARTMENTS_LIST));

    mockEmployees = [
      {
        _id: 'emp1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        gender: 'MALE',
        dateOfBirth: '1990-01-01',
        position: 'Nhân viên',
        status: EmployeeStatus.ACTIVE,
        department: { _id: 'd1', name: 'IT' },
        hireDate: '2020-01-01',
      },
      {
        _id: 'emp2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        gender: 'FEMALE',
        dateOfBirth: '2000-01-01',
        position: 'Trưởng nhóm',
        status: EmployeeStatus.ACTIVE,
        department: { _id: 'd1', name: 'IT' },
        hireDate: '2022-01-01',
      },
      {
        _id: 'emp3',
        firstName: 'Inactive',
        lastName: 'User',
        email: 'inactive@example.com',
        status: EmployeeStatus.INACTIVE,
        department: { _id: 'd1', name: 'IT' },
      }
    ];

    mockEmployeeService = jasmine.createSpyObj<EmployeeService>('EmployeeService', ['getAll', 'update', 'delete']);
    mockEmployeeService.getAll.and.returnValue(of({ data: mockEmployees, pagination: { total: 3, page: 1, limit: 10, totalPages: 1 } }));
    mockEmployeeService.update.and.returnValue(of({} as Partial<EmployeeModel> & EmployeeModel));
    mockEmployeeService.delete.and.returnValue(of(undefined));

    mockAuth = jasmine.createSpyObj<Auth>('Auth', ['getUser', 'isAdmin']);
    mockAuth.getUser.and.returnValue(MOCK_AUTH_USER);
    mockAuth.isAdmin.and.returnValue(true);

    mockLanguageService = jasmine.createSpyObj<LanguageService>('LanguageService', ['getDepartmentName', 'getDepartmentDesc', 'getPositionTranslation']);
    mockLanguageService.getDepartmentName.and.callFake((name: string) => name);
    mockLanguageService.getDepartmentDesc.and.callFake((desc: string) => desc);
    mockLanguageService.getPositionTranslation.and.callFake((pos: string) => pos);
    Object.defineProperty(mockLanguageService, 'currentLang', {
      value: signal('vi'),
      writable: true
    });

    await TestBed.configureTestingModule({
      imports: [DepartmentDetail],
      providers: [
        { provide: DepartmentService, useValue: mockDepartmentService },
        { provide: EmployeeService, useValue: mockEmployeeService },
        { provide: Auth, useValue: mockAuth },
        { provide: LanguageService, useValue: mockLanguageService },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => 'd1',
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

    fixture = TestBed.createComponent(DepartmentDetail);
    component = fixture.componentInstance;
    confirmService = TestBed.inject(Confirm);
    notificationService = TestBed.inject(Notification);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should compute active employee statistics correctly', () => {
    expect(component.totalActiveEmployees()).toBe(2);
    expect(component.maleEmployeesCount()).toBe(1);
    expect(component.femaleEmployeesCount()).toBe(1);
    expect(component.malePercentage()).toBe(50);
    expect(component.femalePercentage()).toBe(50);
    expect(component.averageAge()).toBeGreaterThan(0);
    expect(component.newestEmployee()?._id).toBe('emp2');
    expect(component.longestServingEmployee()?._id).toBe('emp1');
  });

  it('should toggle transfer modal state', () => {
    expect(component.isTransferModalOpen()).toBe(false);
    component.openTransferModal(mockEmployees[0]);
    fixture.detectChanges();
    expect(component.isTransferModalOpen()).toBe(true);
    expect(component.selectedEmployeeForTransfer()).toEqual(mockEmployees[0]);

    component.closeTransferModal();
    fixture.detectChanges();
    expect(component.isTransferModalOpen()).toBe(false);
  });

  it('should toggle add employee modal state', () => {
    expect(component.isAddEmployeeModalOpen()).toBe(false);
    component.openAddEmployeeModal();
    fixture.detectChanges();
    expect(component.isAddEmployeeModalOpen()).toBe(true);

    component.closeAddEmployeeModal();
    fixture.detectChanges();
    expect(component.isAddEmployeeModalOpen()).toBe(false);
  });

  it('should handle Escape key to close modals', () => {
    component.isTransferModalOpen.set(true);
    component.isAddEmployeeModalOpen.set(true);
    fixture.detectChanges();

    component.handleEscape(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(component.isTransferModalOpen()).toBe(false);
    expect(component.isAddEmployeeModalOpen()).toBe(false);
  });

  it('should trigger themeChanged host listener', () => {
    const startVal = component.themeTrigger();
    component.onThemeChanged();
    fixture.detectChanges();
    expect(component.themeTrigger()).toBe(startVal + 1);
  });

  it('should transfer department after confirm', async () => {
    spyOn(confirmService, 'ask').and.resolveTo(true);
    const updateSpy = mockEmployeeService.update.and.returnValue(of(mockEmployees[0]));
    const successSpy = spyOn(notificationService, 'success').and.callThrough();

    component.openTransferModal(mockEmployees[0]);
    fixture.detectChanges();
    await component.confirmTransferDepartment('d2');
    fixture.detectChanges();

    expect(updateSpy).toHaveBeenCalledWith('emp1', { department: 'd2' });
    expect(successSpy).toHaveBeenCalled();
  });

  it('should handle transfer department reject', async () => {
    spyOn(confirmService, 'ask').and.resolveTo(false);
    mockEmployeeService.update.calls.reset();

    component.openTransferModal(mockEmployees[0]);
    fixture.detectChanges();
    await component.confirmTransferDepartment('d2');
    fixture.detectChanges();

    expect(mockEmployeeService.update).not.toHaveBeenCalled();
  });

  it('should delete employee after confirm', async () => {
    spyOn(confirmService, 'ask').and.resolveTo(true);
    const deleteSpy = mockEmployeeService.delete.and.returnValue(of(undefined));
    const successSpy = spyOn(notificationService, 'success').and.callThrough();

    await component.onDelete(mockEmployees[0]);
    fixture.detectChanges();

    expect(deleteSpy).toHaveBeenCalledWith('emp1');
    expect(successSpy).toHaveBeenCalled();
  });

  it('should search and transfer in employees', async () => {
    spyOn(confirmService, 'ask').and.resolveTo(true);
    const updateSpy = mockEmployeeService.update.and.returnValue(of(mockEmployees[0]));

    component.openAddEmployeeModal();
    fixture.detectChanges();
    // Simulate loading other employees
    component.otherEmployeesList = [
      { _id: 'emp4', firstName: 'Alice', lastName: 'Wonder', email: 'alice@example.com', department: { _id: 'd2', name: 'HR' }, position: 'Nhân viên' } as Partial<EmployeeModel> & EmployeeModel
    ];
    component.searchOtherEmployeeText = 'Alice';
    component.triggerSearchOtherEmployees();
    fixture.detectChanges();

    expect(component.searchedOtherEmployees().length).toBe(1);

    component.selectedEmployeeToTransferInId.set('emp4');
    fixture.detectChanges();
    await component.confirmTransferIn();
    fixture.detectChanges();

    expect(updateSpy).toHaveBeenCalledWith('emp4', { department: 'd1' });
  });

  it('should clear search and set empty result if search term is empty', () => {
    component.searchOtherEmployeeText = '';
    component.searchedOtherEmployees.set([mockEmployees[0]]);
    component.triggerSearchOtherEmployees();
    fixture.detectChanges();
    expect(component.searchedOtherEmployees().length).toBe(0);
  });

  it('should go back to choose sub-tab and reset values', () => {
    component.searchOtherEmployeeText = 'Alice';
    component.searchedOtherEmployees.set([mockEmployees[0]]);
    component.selectedEmployeeToTransferInId.set('emp1');
    component.activeSubTab.set('transfer');
    fixture.detectChanges();

    component.goBackToChooseSubTab();
    fixture.detectChanges();

    expect(component.searchOtherEmployeeText).toBe('');
    expect(component.searchedOtherEmployees().length).toBe(0);
    expect(component.selectedEmployeeToTransferInId()).toBe('');
    expect(component.activeSubTab()).toBe('choose');
  });

  it('should navigate to edit employee on menu item command', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.department.set({ _id: 'd1', name: 'IT' } as Partial<DepartmentModel> & DepartmentModel);
    const menuItems = component.getEmployeeMenuItems(mockEmployees[0]);

    const editItem = menuItems.find(i => i.icon === 'pi pi-pencil');
    expect(editItem).toBeDefined();
    editItem?.command?.({ item: editItem });
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/employees/edit', 'emp1'], {
      queryParams: { departmentId: 'd1' }
    });
  });

  it('should open transfer modal on menu item command', () => {
    const openSpy = spyOn(component, 'openTransferModal');
    const menuItems = component.getEmployeeMenuItems(mockEmployees[0]);

    const transferItem = menuItems.find(i => i.icon === 'pi pi-send');
    expect(transferItem).toBeDefined();
    transferItem?.command?.({ item: transferItem });
    fixture.detectChanges();

    expect(openSpy).toHaveBeenCalledWith(mockEmployees[0]);
  });

  it('should trigger onDelete on menu item command', () => {
    const deleteSpy = spyOn(component, 'onDelete');
    const menuItems = component.getEmployeeMenuItems(mockEmployees[0]);

    const deleteItem = menuItems.find(i => i.icon === 'pi pi-trash');
    expect(deleteItem).toBeDefined();
    deleteItem?.command?.({ item: deleteItem });
    fixture.detectChanges();

    expect(deleteSpy).toHaveBeenCalledWith(mockEmployees[0]);
  });

  it('should call location.back on goBack', () => {
    const backSpy = spyOn(component.location, 'back');
    component.goBack();
    fixture.detectChanges();
    expect(backSpy).toHaveBeenCalled();
  });

  it('should handle loadDepartment error', () => {
    mockDepartmentService.getById.and.returnValue(throwError(() => ({ error: { message: 'Failed to load department' } })));
    component.loadDepartment('d1');
    fixture.detectChanges();
    expect(component.errorMessage()).toBe('Failed to load department');
  });

  it('should handle loadAllDepartments error', () => {
    mockDepartmentService.getAllUnpaginated.and.returnValue(throwError(() => ({ error: { message: 'Failed to load depts' } })));
    const errorSpy = spyOn(notificationService, 'error');
    component.loadAllDepartments();
    fixture.detectChanges();
    expect(errorSpy).toHaveBeenCalledWith('Failed to load depts');
  });

  it('should handle loadEmployees error', () => {
    mockEmployeeService.getAll.and.returnValue(throwError(() => ({ error: { message: 'Failed to load emps' } })));
    const errorSpy = spyOn(notificationService, 'error');
    component.loadEmployees('d1');
    fixture.detectChanges();
    expect(errorSpy).toHaveBeenCalledWith('Failed to load emps');
  });

  it('should handle updateEmployeeDepartment error', () => {
    mockEmployeeService.update.and.returnValue(throwError(() => ({ error: { message: 'Update failed' } })));
    const errorSpy = spyOn(notificationService, 'error');
    component.updateEmployeeDepartment('emp1', 'd2', 'success');
    fixture.detectChanges();
    expect(errorSpy).toHaveBeenCalledWith('Update failed');
  });

  it('should handle onDelete error', async () => {
    spyOn(confirmService, 'ask').and.returnValue(Promise.resolve(true));
    mockEmployeeService.delete.and.returnValue(throwError(() => ({ error: { message: 'Delete failed' } })));
    const errorSpy = spyOn(notificationService, 'error');
    await component.onDelete(mockEmployees[0]);
    fixture.detectChanges();
    expect(errorSpy).toHaveBeenCalledWith('Delete failed');
  });

  it('should handle loadOtherEmployees error', () => {
    mockEmployeeService.getAll.and.returnValue(throwError(() => ({ error: { message: 'Load failed' } })));
    const errorSpy = spyOn(notificationService, 'error');
    component.loadOtherEmployees();
    fixture.detectChanges();
    expect(errorSpy).toHaveBeenCalledWith('Load failed');
  });

  it('should handle confirmTransferIn reject', async () => {
    spyOn(confirmService, 'ask').and.returnValue(Promise.resolve(false));
    mockEmployeeService.update.calls.reset();

    component.otherEmployeesList = [mockEmployees[0]];
    component.selectedEmployeeToTransferInId.set('emp1');
    component.department.set({ _id: 'd1', name: 'IT' } as Partial<DepartmentModel> & DepartmentModel);
    fixture.detectChanges();

    await component.confirmTransferIn();
    fixture.detectChanges();

    expect(mockEmployeeService.update).not.toHaveBeenCalled();
  });

  it('should do nothing in confirmTransferIn if emp or dept is missing', async () => {
    const askSpy = spyOn(confirmService, 'ask');

    // Missing employee id
    component.selectedEmployeeToTransferInId.set('');
    fixture.detectChanges();
    await component.confirmTransferIn();
    fixture.detectChanges();
    expect(askSpy).not.toHaveBeenCalled();
  });

  it('should return 0 average age if no active employees have birth date', () => {
    component.employees.set(MOCK_SINGLE_ACTIVE_EMPLOYEE);
    expect(component.averageAge()).toBe(0);
  });

  it('should decrement age if birth date is later in the year', () => {
    const today = new Date();
    const birthMonth = (today.getMonth() + 1) % 12;
    const birthYear = today.getFullYear() - 20;
    const birthDateStr = `${birthYear}-${String(birthMonth + 1).padStart(2, '0')}-15`;

    component.employees.set([{ _id: 'e1', firstName: 'A', lastName: 'B', email: 'a@b.com', status: EmployeeStatus.ACTIVE, dateOfBirth: birthDateStr } as Partial<EmployeeModel> & EmployeeModel]);
    expect(component.averageAge()).toBe(19);
  });

  it('should return undefined for newest and longest serving if no hire dates', () => {
    component.employees.set(MOCK_SINGLE_ACTIVE_EMPLOYEE);
    expect(component.newestEmployee()).toBeUndefined();
    expect(component.longestServingEmployee()).toBeUndefined();
  });

  it('should return tooltip labels in positionChartOptions', () => {
    component.employees.set(MOCK_EMPLOYEES_FOR_CHART);

    const options = component.positionChartOptions();
    expect(options.indexAxis).toBe('y');

    const tooltipLabelFn = options.plugins.tooltip.callbacks.label;
    const result = tooltipLabelFn({ label: 'Nhân viên', raw: 1 });
    expect(result).toContain('Nhân viên: 1');
  });

  it('should translate UNASSIGNED position', () => {
    component.employees.set([{ _id: 'e1', firstName: 'A', lastName: 'B', email: 'a@b.com', status: EmployeeStatus.ACTIVE, position: 'UNASSIGNED' } as Partial<EmployeeModel> & EmployeeModel]);
    const data = component.positionChartData();
    expect(data.labels?.[0]).toContain('DEPARTMENT.NO_POSITION');
  });

  describe('confirmTransferDepartment early returns', () => {
    it('should return early when no employee is selected', async () => {
      const askSpy = spyOn(confirmService, 'ask');

      component.selectedEmployeeForTransfer.set(undefined);
      fixture.detectChanges();
      await component.confirmTransferDepartment('d2');
      fixture.detectChanges();
      expect(askSpy).not.toHaveBeenCalled();
    });

    it('should return early when target department is invalid', async () => {
      const askSpy = spyOn(confirmService, 'ask');

      component.selectedEmployeeForTransfer.set({ _id: 'emp1' } as Partial<EmployeeModel> & EmployeeModel);
      fixture.detectChanges();
      await component.confirmTransferDepartment('d_invalid');
      fixture.detectChanges();
      expect(askSpy).not.toHaveBeenCalled();
    });
  });

  it('should early return in onDelete if employee has no id', async () => {
    const askSpy = spyOn(confirmService, 'ask');
    await component.onDelete({ firstName: 'John' } as Partial<EmployeeModel> & EmployeeModel);
    fixture.detectChanges();
    expect(askSpy).not.toHaveBeenCalled();
  });

  it('should filter other employees based on department', () => {
    mockEmployeeService.getAll.and.returnValue(of({
      data: [
        { _id: 'e1', department: 'd1' },
        { _id: 'e2', department: 'd2' },
        { _id: 'e3', department: { _id: 'd1' } },
        { _id: 'e4', department: { _id: 'd2' } },
      ],
      pagination: { total: 4, page: 1, limit: 10, totalPages: 1 }
    } as unknown as { data: EmployeeModel[]; pagination: { total: number; page: number; limit: number; totalPages: number } }));
    component.department.set({ _id: 'd1' } as Partial<DepartmentModel> & DepartmentModel);
    component.loadOtherEmployees();
    fixture.detectChanges();

    expect(component.otherEmployeesList.length).toBe(2);
    expect(component.otherEmployeesList.map(e => e._id)).toEqual(['e2', 'e4']);
  });

  describe('triggerSearchOtherEmployees filtering', () => {
    beforeEach(() => {
      component.otherEmployeesList = MOCK_OTHER_SEARCH_EMPLOYEES;
    });

    it('should filter by full name', () => {
      component.searchOtherEmployeeText = 'Alice';
      component.triggerSearchOtherEmployees();
      fixture.detectChanges();
      expect(component.searchedOtherEmployees().length).toBe(1);
    });

    it('should filter by position', () => {
      component.searchOtherEmployeeText = 'Manager';
      component.triggerSearchOtherEmployees();
      fixture.detectChanges();
      expect(component.searchedOtherEmployees().length).toBe(1);
    });

    it('should filter by department name', () => {
      component.searchOtherEmployeeText = 'HR';
      component.triggerSearchOtherEmployees();
      fixture.detectChanges();
      expect(component.searchedOtherEmployees().length).toBe(1);
    });
  });

  it('should early return in confirmTransferIn if employee is not found in list', async () => {
    const askSpy = spyOn(confirmService, 'ask');
    component.department.set({ _id: 'd1' } as Partial<DepartmentModel> & DepartmentModel);
    component.selectedEmployeeToTransferInId.set('emp_nonexistent');
    component.otherEmployeesList = [];
    fixture.detectChanges();

    await component.confirmTransferIn();
    fixture.detectChanges();
    expect(askSpy).not.toHaveBeenCalled();
  });

  it('should evaluate transferOptions computed signal with fallback empty value', () => {
    component.allDepartments.set([{ _id: undefined, name: 'HR' }] as (Partial<DepartmentModel> & DepartmentModel)[]);
    component.department.set({ _id: 'd1' } as Partial<DepartmentModel> & DepartmentModel);
    fixture.detectChanges();
    expect(component.transferOptions()).toBeDefined();
  });

  it('should early return in onDelete if confirmation is rejected', async () => {
    spyOn(confirmService, 'ask').and.resolveTo(false);
    mockEmployeeService.delete.calls.reset();
    await component.onDelete(mockEmployees[0]);
    fixture.detectChanges();
    expect(mockEmployeeService.delete).not.toHaveBeenCalled();
  });

  describe('Gender percentage and average age calculations', () => {
    it('should return 0 when employee list is empty', () => {
      component.employees.set([]);
      fixture.detectChanges();
      expect(component.malePercentage()).toBe(0);
      expect(component.femalePercentage()).toBe(0);
      expect(component.averageAge()).toBe(0);
    });

    it('should calculate percentages and age correctly when employee list is not empty', () => {
      const today = new Date();
      const dob1 = new Date(today.getFullYear() - 30, today.getMonth() - 2, today.getDate()).toISOString().split('T')[0];
      const dob2 = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate() + 5).toISOString().split('T')[0];
      const dob3 = new Date(today.getFullYear() - 40, today.getMonth() + 2, today.getDate()).toISOString().split('T')[0];

      component.employees.set([
        { _id: 'e1', firstName: 'A', lastName: 'B', email: 'a@b.com', status: EmployeeStatus.ACTIVE, gender: 'MALE', dateOfBirth: dob1, department: 'd1' },
        { _id: 'e2', firstName: 'A', lastName: 'B', email: 'a@b.com', status: EmployeeStatus.ACTIVE, gender: 'FEMALE', dateOfBirth: dob2, department: 'd1' },
        { _id: 'e3', firstName: 'A', lastName: 'B', email: 'a@b.com', status: EmployeeStatus.ACTIVE, gender: 'MALE', dateOfBirth: dob3, department: 'd1' },
      ] as (Partial<EmployeeModel> & EmployeeModel)[]);
      fixture.detectChanges();

      expect(component.malePercentage()).toBe(67);
      expect(component.femalePercentage()).toBe(33);
      expect(component.averageAge()).toBeDefined();
    });
  });

  describe('Fallback errors in load methods and actions', () => {
    let errorNotificationSpy: jasmine.Spy;

    beforeEach(() => {
      errorNotificationSpy = spyOn(notificationService, 'error');
      spyOn(confirmService, 'ask').and.resolveTo(true);
    });

    it('should cover loadDepartment error fallback', () => {
      mockDepartmentService.getById.and.returnValue(throwError(() => ({})));
      component.loadDepartment('d1');
      fixture.detectChanges();
      expect(component.errorMessage()).toContain('DEPARTMENT.LOAD_ERROR');
    });

    it('should cover loadAllDepartments error fallback', () => {
      mockDepartmentService.getAllUnpaginated.and.returnValue(throwError(() => ({})));
      component.loadAllDepartments();
      fixture.detectChanges();
      expect(errorNotificationSpy).toHaveBeenCalledWith('DEPARTMENT.LOAD_ERROR');
    });

    it('should cover loadEmployees error fallback', () => {
      mockEmployeeService.getAll.and.returnValue(throwError(() => ({})));
      component.loadEmployees('d1');
      fixture.detectChanges();
      expect(errorNotificationSpy).toHaveBeenCalledWith('DEPARTMENT.LOAD_ERROR');
    });

    it('should cover loadOtherEmployees error fallback', () => {
      mockEmployeeService.getAll.and.returnValue(throwError(() => ({})));
      component.loadOtherEmployees();
      fixture.detectChanges();
      expect(errorNotificationSpy).toHaveBeenCalledWith('DEPARTMENT.LOAD_ERROR');
    });

    it('should cover onDelete error fallback', async () => {
      mockEmployeeService.delete.and.returnValue(throwError(() => ({})));
      await component.onDelete(mockEmployees[0]);
      fixture.detectChanges();
      expect(errorNotificationSpy).toHaveBeenCalledWith('DEPARTMENT.DELETE_EMP_ERROR');
    });

    it('should cover confirmTransferIn error fallback', async () => {
      component.selectedEmployeeToTransferInId.set('emp1');
      component.otherEmployeesList = [{ _id: 'emp1', firstName: 'A', lastName: 'B', email: 'a@b.com' } as Partial<EmployeeModel> & EmployeeModel];
      component.department.set({ _id: 'd1', name: 'IT' } as Partial<DepartmentModel> & DepartmentModel);
      fixture.detectChanges();
      mockEmployeeService.update.and.returnValue(throwError(() => ({})));
      await component.confirmTransferIn();
      fixture.detectChanges();
      expect(errorNotificationSpy).toHaveBeenCalledWith('DEPARTMENT.TRANSFER_ERROR');
    });

    it('should cover confirmTransferOut error fallback', async () => {
      component.selectedEmployeeForTransfer.set(mockEmployees[1]);
      component.selectedTargetDepartmentId.set('d2');
      fixture.detectChanges();
      mockEmployeeService.update.and.returnValue(throwError(() => ({})));
      await component.confirmTransferDepartment('d2');
      fixture.detectChanges();
      expect(errorNotificationSpy).toHaveBeenCalledWith('DEPARTMENT.TRANSFER_ERROR');
    });
  });

  describe('Chart theme and tooltip callbacks', () => {
    beforeEach(() => {
      // Setup employees with undefined position and unassigned positions
      component.employees.set([
        { _id: 'e1', firstName: 'A', lastName: 'B', email: 'a@b.com', status: EmployeeStatus.ACTIVE, gender: 'MALE', dateOfBirth: new Date().toISOString().split('T')[0], position: undefined, department: 'd1' },
        { _id: 'e2', firstName: 'A', lastName: 'B', email: 'a@b.com', status: EmployeeStatus.ACTIVE, gender: 'FEMALE', dateOfBirth: new Date().toISOString().split('T')[0], position: 'Developer', department: 'd1' },
      ] as (Partial<EmployeeModel> & EmployeeModel)[]);
    });

    it('should calculate position distribution fallback for unassigned positions', () => {
      expect(component.positionDistribution()['UNASSIGNED']).toBe(1);
    });

    it('should compute chart data and options on light theme', () => {
      document.body.classList.remove('dark-theme');
      component.themeTrigger.set(1);
      fixture.detectChanges();
      expect(component.positionChartData()).toBeDefined();
      expect(component.positionChartOptions()).toBeDefined();
    });

    it('should compute chart data and options on dark theme', () => {
      document.body.classList.add('dark-theme');
      component.themeTrigger.set(2);
      fixture.detectChanges();
      expect(component.positionChartData()).toBeDefined();
      expect(component.positionChartOptions()).toBeDefined();
      document.body.classList.remove('dark-theme'); // cleanup
    });

    describe('Tooltip label callback', () => {
      let labelCallback: Function;

      beforeEach(() => {
        const tooltipOptions = component.positionChartOptions();
        labelCallback = tooltipOptions.plugins.tooltip.callbacks.label;
      });

      it('should format percentage when total count is greater than 0', () => {
        const labelText = labelCallback({ raw: 1, label: 'IT' });
        expect(labelText).toContain('50%');
      });

      it('should fallback to 0% when total count is 0', () => {
        component.employees.set([]);
        fixture.detectChanges();
        const labelText = labelCallback({ raw: 1, label: 'IT' });
        expect(labelText).toContain('0%');
      });

      it('should fallback to 0% when raw value is undefined', () => {
        const labelText = labelCallback({ raw: undefined, label: 'IT' });
        expect(labelText).toContain('0%');
      });
    });
  });

  describe('triggerSearchOtherEmployees fallbacks', () => {
    beforeEach(() => {
      component.otherEmployeesList = [
        {
          _id: 'e1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          position: undefined,
          department: 'd2' // string
        },
        {
          _id: 'e2',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          position: 'Manager',
          department: { _id: 'd3', name: undefined } // object without name
        }
      ] as (Partial<EmployeeModel> & EmployeeModel)[];
    });

    it('should show fallback message when no matches found', () => {
      component.searchOtherEmployeeText = 'doe';
      component.triggerSearchOtherEmployees();
      fixture.detectChanges();
      expect(component.searchedOtherEmployees().length).toBe(2);
    });

    it('should reset to all employees when search text is empty', () => {
      component.searchOtherEmployeeText = '';
      component.triggerSearchOtherEmployees();
      expect(component.searchedOtherEmployees().length).toBe(0);
    });
  });
});
