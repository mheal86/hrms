import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EmployeeForm } from './employee-form';
import { Employee as EmployeeService } from '../../../core/services/employee.service';
import { Department as DepartmentService } from '../../../core/services/department.service';
import { User as UserService } from '../../../core/services/user';
import { LanguageService } from '../../../core/services/language.service';
import { ActivatedRoute, Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { FormlyModule, FieldType } from '@ngx-formly/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { signal, Component } from '@angular/core';
import { Notification } from '../../../core/services/notification';
import { Employee as EmployeeModel } from '../../../core/models/employee-model';
import { Department as DepartmentModel } from '../../../core/models/department-model';
import { UserAccountData } from '../../../core/models/user-model';

@Component({
  selector: 'dummy-input',
  template: '',
  standalone: true
})
class DummyComponent extends FieldType { }

describe('EmployeeForm', () => {
  let component: EmployeeForm;
  let fixture: ComponentFixture<EmployeeForm>;
  let router: Router;
  let notificationService: Notification;

  let mockEmployeeService: jasmine.SpyObj<EmployeeService>;
  let mockDepartmentService: jasmine.SpyObj<DepartmentService>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockLanguageService: jasmine.SpyObj<LanguageService>;

  const MOCK_EMPLOYEE: Partial<EmployeeModel> & EmployeeModel = {
    _id: 'e1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    department: 'd1'
  } as Partial<EmployeeModel> & EmployeeModel;

  const MOCK_DEPARTMENTS: (Partial<DepartmentModel> & DepartmentModel)[] = [
    { _id: 'd1', name: 'IT', description: 'Tech' },
    { _id: 'd2', name: 'HR', description: 'HR' }
  ] as (Partial<DepartmentModel> & DepartmentModel)[];

  const MOCK_USER_ACCOUNT: Partial<UserAccountData> & UserAccountData = {
    _id: 'u1',
    username: 'john',
    role: { _id: 'r1', name: 'USER' }
  } as Partial<UserAccountData> & UserAccountData;

  const MOCK_USER_ACCOUNT_A1: Partial<UserAccountData> & UserAccountData = {
    _id: 'a1',
    username: 'john',
    role: { _id: 'r1', name: 'USER' }
  } as Partial<UserAccountData> & UserAccountData;

  const MOCK_FORM_PAYLOAD = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@gmail.com',
    gender: 'MALE',
    dateOfBirth: new Date('1990-01-01'),
    position: 'Staff',
    department: 'd1'
  };

  const mockParamMapGet = jasmine.createSpy();
  const mockQueryParamMapGet = jasmine.createSpy();
  const mockQueryParams = new BehaviorSubject<Record<string, string>>({});

  beforeEach(async () => {
    mockParamMapGet.calls.reset();
    mockParamMapGet.and.returnValue(null);
    mockQueryParamMapGet.calls.reset();
    mockQueryParamMapGet.and.returnValue(null);
    mockQueryParams.next({});

    mockEmployeeService = jasmine.createSpyObj<EmployeeService>('EmployeeService', ['getById', 'create', 'update', 'uploadAvatar']);
    mockEmployeeService.getById.and.returnValue(of(MOCK_EMPLOYEE));
    mockEmployeeService.create.and.returnValue(of({ _id: 'e1' } as Partial<EmployeeModel> & EmployeeModel));
    mockEmployeeService.update.and.returnValue(of({ _id: 'e1' } as Partial<EmployeeModel> & EmployeeModel));
    mockEmployeeService.uploadAvatar.and.returnValue(of({} as Partial<EmployeeModel> & EmployeeModel));

    mockDepartmentService = jasmine.createSpyObj<DepartmentService>('DepartmentService', ['getAllUnpaginated']);
    mockDepartmentService.getAllUnpaginated.and.returnValue(of(MOCK_DEPARTMENTS));

    mockUserService = jasmine.createSpyObj<UserService>('UserService', ['checkUsername', 'getByEmployeeId', 'create', 'update']);
    mockUserService.checkUsername.and.returnValue(of({ exists: false }));
    mockUserService.getByEmployeeId.and.returnValue(of(MOCK_USER_ACCOUNT));
    mockUserService.create.and.returnValue(of({}));
    mockUserService.update.and.returnValue(of({}));

    mockLanguageService = jasmine.createSpyObj<LanguageService>('LanguageService', ['getDepartmentName', 'getPositionTranslation']);
    mockLanguageService.getDepartmentName.and.callFake((name: string) => name);
    mockLanguageService.getPositionTranslation.and.callFake((pos: string) => pos);

    // cast using ReturnType to satisfy jasmine.SpyObj wrapper types
    (mockLanguageService as unknown as { currentLang: ReturnType<typeof signal<'vi' | 'en'>> }).currentLang = signal('vi');

    await TestBed.configureTestingModule({
      imports: [
        EmployeeForm,
        ReactiveFormsModule,
        FormlyModule.forRoot({
          types: [
            { name: 'input', component: DummyComponent },
            { name: 'textarea', component: DummyComponent },
            { name: 'custom-select', component: DummyComponent },
            { name: 'custom-datepicker', component: DummyComponent },
          ]
        }),
      ],
      providers: [
        { provide: EmployeeService, useValue: mockEmployeeService },
        { provide: DepartmentService, useValue: mockDepartmentService },
        { provide: UserService, useValue: mockUserService },
        { provide: LanguageService, useValue: mockLanguageService },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => mockParamMapGet(key),
              },
              queryParamMap: {
                get: (key: string) => mockQueryParamMapGet(key),
              },
            },
            queryParams: mockQueryParams,
          },
        },
        provideTranslateService(),
        provideHttpClient(),
        MessageService,
        ConfirmationService,
        Notification,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeForm);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    notificationService = TestBed.inject(Notification);
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
      component.initFields();
      const fieldGroup = component.employeeFields[0]?.fieldGroup;
      const dobField = fieldGroup?.[3];
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
        const nextMonth = today.getMonth() === 11 ? 11 : today.getMonth() + 1;
        const nextDay = today.getMonth() === 11 ? today.getDate() + 5 : 15;
        const birthDateStr = `${today.getFullYear() - 20}-${String(nextMonth + 1).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
        expect(ageRangeVal(new FormControl(birthDateStr))).toBe(true);
      });
    });
  });

  describe('Username Validator', () => {
    let validator: ((control: FormControl) => boolean) | undefined;

    beforeEach(() => {
      component.initFields();
      const fieldGroup = component.accountFields[0]?.fieldGroup;
      const usernameField = fieldGroup?.[0];
      const validators = usernameField?.validators as Record<string, { expression: (control: FormControl) => boolean }> | undefined;
      validator = validators?.['username']?.expression;
    });

    it('should be defined', () => {
      expect(validator).toBeDefined();
    });

    it('should return true for empty value', () => {
      if (validator) {
        expect(validator(new FormControl(''))).toBe(true);
      }
    });

    it('should return false for value containing spaces', () => {
      if (validator) {
        expect(validator(new FormControl('user name'))).toBe(false);
      }
    });

    it('should return false for value containing special characters', () => {
      if (validator) {
        expect(validator(new FormControl('user@name'))).toBe(false);
      }
    });

    it('should return true for valid username format', () => {
      if (validator) {
        expect(validator(new FormControl('username123'))).toBe(true);
      }
    });
  });

  describe('Async Duplicate Username Validator', () => {
    let asyncVal: ((control: FormControl) => any) | undefined;
    let ctrl2: FormControl;

    beforeEach(() => {
      component.initFields();
      const fieldGroup = component.accountFields[0]?.fieldGroup;
      const usernameField = fieldGroup?.[0];
      const asyncValidators = usernameField?.asyncValidators as Record<string, { expression: (control: FormControl) => any }> | undefined;
      asyncVal = asyncValidators?.['duplicateUsername']?.expression;

      ctrl2 = new FormControl('user1');
      ctrl2.markAsDirty();
    });

    it('should be defined', () => {
      expect(asyncVal).toBeDefined();
    });

    it('should return true for empty username', async () => {
      if (asyncVal) {
        const ctrl1 = new FormControl('');
        expect(await asyncVal(ctrl1)).toBe(true);
      }
    });

    it('should return false if username already exists', async () => {
      if (asyncVal) {
        mockUserService.checkUsername.and.returnValue(of({ exists: true }));
        const res = await asyncVal(ctrl2);
        expect(res).toBe(false);
      }
    });

    it('should return true if username does not exist', async () => {
      if (asyncVal) {
        mockUserService.checkUsername.and.returnValue(of({ exists: false }));
        const res = await asyncVal(ctrl2);
        expect(res).toBe(true);
      }
    });

    it('should return true on validation error fallback', async () => {
      if (asyncVal) {
        mockUserService.checkUsername.and.returnValue(throwError(() => new Error('API error')));
        const res = await asyncVal(ctrl2);
        expect(res).toBe(true);
      }
    });
  });

  it('should upload avatar and update existing account if present during onSubmit', () => {
    mockParamMapGet.and.returnValue('e1');
    fixture = TestBed.createComponent(EmployeeForm);
    component = fixture.componentInstance;
    fixture.detectChanges();

    spyOnProperty(component.form, 'invalid', 'get').and.returnValue(false);
    component.selectedFile = new File([''], 'avatar.png', { type: 'image/png' });
    component.createAccount.set(true);
    component.existingAccount.set(MOCK_USER_ACCOUNT_A1);

    (component as unknown as { accountForm: FormGroup }).accountForm = new FormGroup({
      username: new FormControl('john'),
      password: new FormControl('newpassword123'),
      roleName: new FormControl('STAFF'),
    });

    mockEmployeeService.update.and.returnValue(of({ _id: 'e1' } as Partial<EmployeeModel> & EmployeeModel));
    mockEmployeeService.uploadAvatar.and.returnValue(of({} as Partial<EmployeeModel> & EmployeeModel));
    mockUserService.update.and.returnValue(of({}));

    component.form.patchValue(MOCK_FORM_PAYLOAD);
    component.onSubmit();
    fixture.detectChanges();

    expect(mockEmployeeService.update).toHaveBeenCalled();
    expect(mockEmployeeService.uploadAvatar).toHaveBeenCalledWith('e1', component.selectedFile);
    expect(mockUserService.update).toHaveBeenCalledWith('a1', {
      username: 'john',
      roleName: 'STAFF',
      newPassword: 'newpassword123',
    });
  });

  it('should create new account during onSubmit if createAccount is true and no existingAccount', () => {
    mockParamMapGet.and.returnValue(null);
    fixture = TestBed.createComponent(EmployeeForm);
    component = fixture.componentInstance;
    fixture.detectChanges();

    spyOnProperty(component.form, 'invalid', 'get').and.returnValue(false);
    component.createAccount.set(true);
    component.existingAccount.set(undefined);

    (component as unknown as { accountForm: FormGroup }).accountForm = new FormGroup({
      username: new FormControl('john'),
      password: new FormControl('password123'),
      roleName: new FormControl('STAFF'),
    });

    mockEmployeeService.create.and.returnValue(of({ _id: 'e1' } as Partial<EmployeeModel> & EmployeeModel));
    mockUserService.create.and.returnValue(of({}));

    component.form.patchValue(MOCK_FORM_PAYLOAD);
    component.onSubmit();
    fixture.detectChanges();

    expect(mockEmployeeService.create).toHaveBeenCalled();
    expect(mockUserService.create).toHaveBeenCalledWith({
      username: 'john',
      password: 'password123',
      roleName: 'STAFF',
      employeeId: 'e1',
    });
  });

  it('should handle cancel action and navigate back', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.onCancel();
    fixture.detectChanges();
    expect(navigateSpy).toHaveBeenCalledWith(['/employees']);
  });

  it('should handle file select action', () => {
    const event = {
      target: {
        files: [new File([''], 'avatar.png', { type: 'image/png' })]
      }
    } as unknown as Event;
    component.onFileSelected(event);
    fixture.detectChanges();
    expect(component.selectedFile).toBeDefined();
    expect(component.selectedFile?.name).toBe('avatar.png');
  });

  it('should load employee user account info in edit mode', () => {
    mockParamMapGet.and.returnValue('e1');
    mockUserService.getByEmployeeId.and.returnValue(of(MOCK_USER_ACCOUNT));

    fixture = TestBed.createComponent(EmployeeForm);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isEditMode()).toBe(true);
    expect(mockUserService.getByEmployeeId).toHaveBeenCalledWith('e1');
    expect(component.existingAccount()).toBeDefined();
    expect(component.createAccount()).toBe(false);
  });

  it('should handle avatar upload error', () => {
    mockParamMapGet.and.returnValue(null);
    fixture = TestBed.createComponent(EmployeeForm);
    component = fixture.componentInstance;
    fixture.detectChanges();

    spyOnProperty(component.form, 'invalid', 'get').and.returnValue(false);
    component.createAccount.set(false);
    component.selectedFile = new File([''], 'avatar.png');
    component.form.patchValue(MOCK_FORM_PAYLOAD);
    mockEmployeeService.create.and.returnValue(of({ _id: 'e1' } as Partial<EmployeeModel> & EmployeeModel));
    mockEmployeeService.uploadAvatar.and.returnValue(throwError(() => new Error('Upload error')));

    component.onSubmit();
    fixture.detectChanges();

    expect(mockEmployeeService.create).toHaveBeenCalled();
    expect(mockEmployeeService.uploadAvatar).toHaveBeenCalled();
    expect(component.errorMessage()).toContain('EMPLOYEE.AVATAR_UPLOAD_ERROR');
  });

  it('should handle save account error', () => {
    mockParamMapGet.and.returnValue(null);
    fixture = TestBed.createComponent(EmployeeForm);
    component = fixture.componentInstance;
    fixture.detectChanges();

    spyOnProperty(component.form, 'invalid', 'get').and.returnValue(false);
    component.createAccount.set(true);
    component.existingAccount.set(undefined);

    (component as unknown as { accountForm: FormGroup }).accountForm = new FormGroup({
      username: new FormControl('john'),
      password: new FormControl('12'),
      roleName: new FormControl('STAFF'),
    });

    mockEmployeeService.create.and.returnValue(of({ _id: 'e1' } as Partial<EmployeeModel> & EmployeeModel));
    mockUserService.create.and.returnValue(throwError(() => new Error('Account error')));
    const errorSpy = spyOn(notificationService, 'error');

    component.form.patchValue(MOCK_FORM_PAYLOAD);
    component.onSubmit();
    fixture.detectChanges();

    expect(errorSpy).toHaveBeenCalled();
  });

  it('should handle loadDepartments error', () => {
    mockDepartmentService.getAllUnpaginated.and.returnValue(throwError(() => new Error('Load error')));

    fixture = TestBed.createComponent(EmployeeForm);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.errorMessage()).toContain('DEPARTMENT.LOAD_ERROR');
  });

  it('should handle loadEmployee error', () => {
    mockParamMapGet.and.returnValue('e1');
    mockEmployeeService.getById.and.returnValue(throwError(() => new Error('Load error')));

    fixture = TestBed.createComponent(EmployeeForm);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.errorMessage()).toContain('EMPLOYEE.LOAD_ERROR');
  });

  it('should return early in onSubmit if form is invalid', () => {
    mockParamMapGet.and.returnValue(null);
    fixture = TestBed.createComponent(EmployeeForm);
    component = fixture.componentInstance;
    fixture.detectChanges();

    spyOnProperty(component.form, 'invalid', 'get').and.returnValue(true);
    component.onSubmit();
    fixture.detectChanges();

    expect(mockEmployeeService.create).not.toHaveBeenCalled();
  });

  it('should handle userService update account error', () => {
    mockParamMapGet.and.returnValue('e1');
    fixture = TestBed.createComponent(EmployeeForm);
    component = fixture.componentInstance;
    fixture.detectChanges();

    spyOnProperty(component.form, 'invalid', 'get').and.returnValue(false);
    component.createAccount.set(true);
    component.existingAccount.set(MOCK_USER_ACCOUNT_A1);
    (component as unknown as { accountForm: FormGroup }).accountForm = new FormGroup({
      username: new FormControl('john'),
      password: new FormControl('12'),
      roleName: new FormControl('STAFF'),
    });

    mockEmployeeService.update.and.returnValue(of({ _id: 'e1' } as Partial<EmployeeModel> & EmployeeModel));
    mockUserService.update.and.returnValue(throwError(() => new Error('Update error')));
    const errorSpy = spyOn(notificationService, 'error');

    component.onSubmit();
    fixture.detectChanges();

    expect(errorSpy).toHaveBeenCalled();
  });

  it('should handle getByEmployeeId error during loadEmployee', () => {
    mockParamMapGet.and.returnValue('e1');
    mockEmployeeService.getById.and.returnValue(of({ _id: 'e1' } as Partial<EmployeeModel> & EmployeeModel));
    mockUserService.getByEmployeeId.and.returnValue(throwError(() => new Error('Load error')));

    fixture = TestBed.createComponent(EmployeeForm);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.employeeId).toBe('e1');
  });

  it('should handle successful submit in Edit Mode without account creation', () => {
    mockParamMapGet.and.returnValue('e1');
    fixture = TestBed.createComponent(EmployeeForm);
    component = fixture.componentInstance;
    fixture.detectChanges();

    spyOnProperty(component.form, 'invalid', 'get').and.returnValue(false);
    component.createAccount.set(false);

    mockEmployeeService.update.and.returnValue(of({ _id: 'e1' } as Partial<EmployeeModel> & EmployeeModel));
    const successSpy = spyOn(notificationService, 'success');

    component.onSubmit();
    fixture.detectChanges();
    expect(mockEmployeeService.update).toHaveBeenCalled();
    expect(successSpy).toHaveBeenCalled();
  });

  it('should handle successful submit in Create Mode without account creation', () => {
    mockParamMapGet.and.returnValue(null);
    fixture = TestBed.createComponent(EmployeeForm);
    component = fixture.componentInstance;
    fixture.detectChanges();

    spyOnProperty(component.form, 'invalid', 'get').and.returnValue(false);
    component.createAccount.set(false);

    mockEmployeeService.create.and.returnValue(of({ _id: 'e1' } as Partial<EmployeeModel> & EmployeeModel));
    const successSpy = spyOn(notificationService, 'success');

    component.onSubmit();
    fixture.detectChanges();
    expect(mockEmployeeService.create).toHaveBeenCalled();
    expect(successSpy).toHaveBeenCalled();
  });

  describe('loadEmployee data format handling', () => {
    beforeEach(() => {
      mockParamMapGet.and.returnValue('e1');
    });

    it('should map department object correctly', () => {
      mockEmployeeService.getById.and.returnValue(of({
        _id: 'e1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        department: { _id: 'd1', name: 'IT' }
      } as Partial<EmployeeModel> & EmployeeModel));

      fixture = TestBed.createComponent(EmployeeForm);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.model.department).toBe('d1');
    });

    it('should handle department as string', () => {
      mockEmployeeService.getById.and.returnValue(of({
        _id: 'e1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        department: 'd2',
        dateOfBirth: '1990-01-01'
      } as Partial<EmployeeModel> & EmployeeModel));

      fixture = TestBed.createComponent(EmployeeForm);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.model.department).toBe('d2');
      expect(component.model.dateOfBirth).toBeDefined();
    });

    it('should handle undefined date of birth', () => {
      mockEmployeeService.getById.and.returnValue(of({
        _id: 'e1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        department: 'd1',
        dateOfBirth: undefined
      } as Partial<EmployeeModel> & EmployeeModel));

      fixture = TestBed.createComponent(EmployeeForm);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.model.dateOfBirth).toBeNull();
    });
  });

  describe('Form submission error handling', () => {
    beforeEach(() => {
      mockParamMapGet.and.returnValue(null);
      fixture = TestBed.createComponent(EmployeeForm);
      component = fixture.componentInstance;
      fixture.detectChanges();

      spyOnProperty(component.form, 'invalid', 'get').and.returnValue(false);
      component.createAccount.set(true);
      component.accountModel = {
        username: 'john',
        roleName: 'STAFF'
      };
      (component as unknown as { accountForm: FormGroup }).accountForm = new FormGroup({
        username: new FormControl('john'),
        password: new FormControl('12'),
        roleName: new FormControl('STAFF'),
      });
    });

    it('should handle check_username error with specific message', () => {
      mockUserService.checkUsername.and.returnValue(throwError(() => ({
        error: { message: 'Username exists' }
      })));
      component.onSubmit();
      fixture.detectChanges();
      expect(component.errorMessage()).toBe('Username exists');
    });

    it('should handle check_username fallback error without message', () => {
      mockUserService.checkUsername.and.returnValue(throwError(() => ({})));
      component.onSubmit();
      fixture.detectChanges();
      expect(component.errorMessage()).toContain('VALIDATION.USERNAME_CHECK_ERROR');
    });

    it('should handle save_employee error with specific message', () => {
      component.createAccount.set(false);
      mockEmployeeService.create.and.returnValue(throwError(() => ({
        error: { message: 'Server error' }
      })));
      component.onSubmit();
      fixture.detectChanges();
      expect(component.errorMessage()).toBe('Server error');
    });

    it('should handle save_employee fallback error without message', () => {
      component.createAccount.set(false);
      mockEmployeeService.create.and.returnValue(throwError(() => ({})));
      component.onSubmit();
      fixture.detectChanges();
      expect(component.errorMessage()).toContain('EMPLOYEE.SAVE_ERROR');
    });
  });

  describe('Password field label expression', () => {
    let labelExpr: Function | undefined;

    beforeEach(() => {
      component.initFields();
      const fieldGroup = component.accountFields[0]?.fieldGroup;
      const passwordField = fieldGroup?.[1];
      const expressions = passwordField?.expressions as Record<string, Function> | undefined;
      labelExpr = expressions?.['props.label'];
    });

    it('should be defined', () => {
      expect(labelExpr).toBeDefined();
    });

    it('should return edit password label when existingAccount is present', () => {
      if (labelExpr) {
        component.existingAccount.set({} as Partial<UserAccountData> & UserAccountData);
        fixture.detectChanges();
        expect(labelExpr()).toContain('FORM.PASSWORD_EDIT');
      }
    });

    it('should return create password label when existingAccount is not present', () => {
      if (labelExpr) {
        component.existingAccount.set(undefined);
        fixture.detectChanges();
        expect(labelExpr()).toContain('FORM.PASSWORD');
      }
    });
  });

  it('should initialize model department if departmentId is in query params', () => {
    mockParamMapGet.and.returnValue(null);
    mockQueryParams.next({ departmentId: 'd1' });

    // Recreate component to run ngOnInit with new query params
    fixture = TestBed.createComponent(EmployeeForm);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.model.department).toBe('d1');
  });

  it('should toggle createAccount in edit mode', () => {
    component.isEditMode.set(true);
    component.createAccount.set(false);
    component.toggleCreateAccount();
    expect(component.createAccount()).toBe(true);

    component.toggleCreateAccount();
    expect(component.createAccount()).toBe(false);
  });

  it('should not toggle createAccount in create mode', () => {
    component.isEditMode.set(false);
    component.createAccount.set(true);
    component.toggleCreateAccount();
    expect(component.createAccount()).toBe(true);
  });

  it('should handle duplicate username error during submit', fakeAsync(() => {
    mockParamMapGet.and.returnValue(null);
    fixture = TestBed.createComponent(EmployeeForm);
    component = fixture.componentInstance;

    component.accountForm.addControl('username', new FormControl('john'));
    component.accountForm.addControl('password', new FormControl('password123'));
    component.accountForm.addControl('roleName', new FormControl('STAFF'));

    spyOnProperty(component.form, 'invalid', 'get').and.returnValue(false);
    spyOnProperty(component.accountForm, 'invalid', 'get').and.returnValue(false);
    component.createAccount.set(true);
    component.isEditMode.set(false);

    // Mock userService checkUsername to return exists: true
    mockUserService.checkUsername.and.returnValue(of({ exists: true }));

    const usernameControl = component.accountForm.get('username');
    expect(usernameControl).toBeDefined();
    if (usernameControl) {
      const setErrorsSpy = spyOn(usernameControl, 'setErrors').and.callThrough();

      component.onSubmit();
      tick();

      expect(setErrorsSpy).toHaveBeenCalledWith({ duplicateUsername: true });
      expect(usernameControl.touched).toBe(true);
    }
  }));

  it('should navigate to department page on cancel/navigateBack if departmentId is in query params', () => {
    mockQueryParamMapGet.and.returnValue('d1');
    const navigateSpy = spyOn(router, 'navigate');
    component.onCancel();
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/departments', 'd1']);
  });

  it('should cover existing account password update error flow during onSubmit', fakeAsync(() => {
    mockParamMapGet.and.returnValue('e1');
    mockUserService.getByEmployeeId.and.returnValue(of({ _id: 'a1', username: 'john', role: { _id: 'r1', name: 'STAFF' } }));
    fixture = TestBed.createComponent(EmployeeForm);
    component = fixture.componentInstance;

    (component as unknown as { accountForm: FormGroup }).accountForm = new FormGroup({
      username: new FormControl('john'),
      password: new FormControl('newpassword123'),
      roleName: new FormControl('STAFF')
    });

    component.createAccount.set(true);
    component.isEditMode.set(true);

    fixture.detectChanges();
    tick(); // Resolve checkExistingAccount observable subscription
    fixture.detectChanges();

    const navigateSpy = spyOn(router, 'navigate');
    const errorSpy = spyOn(notificationService, 'error');
    spyOnProperty(component.form, 'invalid', 'get').and.returnValue(false);
    spyOnProperty(component.accountForm, 'invalid', 'get').and.returnValue(false);
    mockEmployeeService.update.and.returnValue(of({ _id: 'e1' } as EmployeeModel));
    mockUserService.update.and.returnValue(throwError(() => new Error('Save account error')));

    component.onSubmit();
    tick();
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  }));
});
