import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Profile } from './profile';
import { Profile as ProfileService } from '../../../core/services/profile.service';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';
import { LanguageService } from '../../../core/services/language.service';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { FormlyModule, FieldType } from '@ngx-formly/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { signal, Component } from '@angular/core';
import { ProfileData } from '../../../core/models/profile-model';
import { Employee as EmployeeModel } from '../../../core/models/employee-model';

const MOCK_PROFILE_DATA: ProfileData = {
  _id: 'u1',
  username: 'john',
  role: { _id: 'r1', name: 'USER' },
  employee: {
    _id: 'emp1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '1234567890',
    address: '123 St',
    position: 'DEVELOPER',
    department: 'd1',
  } as Partial<EmployeeModel> & EmployeeModel,
} as Partial<ProfileData> & ProfileData;

const MOCK_PROFILE_DATA_CANCEL_EDIT: ProfileData = {
  _id: 'u1',
  username: 'john',
  role: { _id: 'r1', name: 'USER' },
  employee: {
    _id: 'emp1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '099',
    address: 'Hanoi',
    department: 'd1',
  } as Partial<EmployeeModel> & EmployeeModel,
} as Partial<ProfileData> & ProfileData;

const MOCK_PROFILE_DATA_UNDEFINED_EMPLOYEE: ProfileData = {
  _id: 'u1',
  username: 'test',
  role: { _id: 'r1', name: 'USER' },
  employee: undefined
} as Partial<ProfileData> & ProfileData;

const MOCK_AUTH_USER = { id: '1', username: 'admin', role: 'ADMIN' };

const MOCK_UPDATE_PAYLOAD = { phone: '0912345678', address: 'Da Nang' };

@Component({
  selector: 'dummy-input',
  template: '',
  standalone: true
})
class DummyComponent extends FieldType { }

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let notificationService: Notification;

  let mockProfileService: jasmine.SpyObj<ProfileService>;
  let mockAuth: jasmine.SpyObj<Auth>;
  let mockLanguageService: jasmine.SpyObj<LanguageService>;

  beforeEach(async () => {
    mockProfileService = jasmine.createSpyObj<ProfileService>('ProfileService', ['getProfile', 'updateProfile', 'changePassword']);
    mockProfileService.getProfile.and.returnValue(of(MOCK_PROFILE_DATA));
    mockProfileService.updateProfile.and.returnValue(of({}));
    mockProfileService.changePassword.and.returnValue(of({}));

    mockAuth = jasmine.createSpyObj<Auth>('Auth', ['getUser', 'isAdmin', 'logout']);
    mockAuth.getUser.and.returnValue(MOCK_AUTH_USER);
    mockAuth.isAdmin.and.returnValue(true);

    mockLanguageService = jasmine.createSpyObj<LanguageService>('LanguageService', ['getDepartmentName', 'getPositionTranslation']);
    mockLanguageService.getDepartmentName.and.callFake((name: string) => name);
    mockLanguageService.getPositionTranslation.and.callFake((pos: string) => pos);

    // cast using ReturnType to satisfy jasmine.SpyObj wrapper types
    (mockLanguageService as unknown as { currentLang: ReturnType<typeof signal<'vi' | 'en'>> }).currentLang = signal('vi');

    await TestBed.configureTestingModule({
      imports: [
        Profile,
        ReactiveFormsModule,
        FormlyModule.forRoot({
          types: [
            { name: 'input', component: DummyComponent }
          ]
        }),
      ],
      providers: [
        { provide: ProfileService, useValue: mockProfileService },
        { provide: Auth, useValue: mockAuth },
        { provide: LanguageService, useValue: mockLanguageService },
        provideRouter([]),
        provideTranslateService(),
        provideHttpClient(),
        MessageService,
        ConfirmationService,
        Notification,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    notificationService = TestBed.inject(Notification);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  describe('phone validator', () => {
    let phoneField: any;
    let phoneVal: ((control: FormControl) => boolean) | undefined;

    beforeEach(() => {
      phoneField = component.profileFields[0];
      const phoneValidators = phoneField?.validators as Record<string, { expression: (control: FormControl) => boolean }> | undefined;
      phoneVal = phoneValidators?.['phone']?.expression;
    });

    it('should return false for invalid phone', () => {
      expect(phoneVal).toBeDefined();
      if (phoneVal) expect(phoneVal(new FormControl('123'))).toBe(false);
    });

    it('should return true for valid phone', () => {
      if (phoneVal) expect(phoneVal(new FormControl('0912345678'))).toBe(true);
    });

    it('should have correct message', () => {
      const phoneMsg = (phoneField?.validators as Record<string, { message: () => string }> | undefined)?.['phone']?.message;
      expect(phoneMsg?.()).toBe('PROFILE.PHONE_INVALID');
    });
  });

  describe('address validator', () => {
    let addressField: any;
    let addressVal: ((control: FormControl) => boolean) | undefined;

    beforeEach(() => {
      addressField = component.profileFields[1];
      const addressValidators = addressField?.validators as Record<string, { expression: (control: FormControl) => boolean }> | undefined;
      addressVal = addressValidators?.['address']?.expression;
    });

    it('should return false for invalid address', () => {
      expect(addressVal).toBeDefined();
      if (addressVal) expect(addressVal(new FormControl('Ha'))).toBe(false);
    });

    it('should return true for valid address', () => {
      if (addressVal) expect(addressVal(new FormControl('Hanoi!'))).toBe(true);
    });

    it('should have correct message', () => {
      const addressMsg = (addressField?.validators as Record<string, { message: () => string }> | undefined)?.['address']?.message;
      expect(addressMsg?.()).toBe('PROFILE.ADDRESS_INVALID');
    });
  });

  describe('password visibility toggles', () => {
    it('should toggle showCurrentPassword', () => {
      expect(component.showCurrentPassword()).toBe(false);
      component.toggleCurrentPassword();
      fixture.detectChanges();
      expect(component.showCurrentPassword()).toBe(true);
    });

    it('should toggle showNewPassword', () => {
      expect(component.showNewPassword()).toBe(false);
      component.toggleNewPassword();
      fixture.detectChanges();
      expect(component.showNewPassword()).toBe(true);
    });

    it('should toggle showConfirmPassword', () => {
      expect(component.showConfirmPassword()).toBe(false);
      component.toggleConfirmPassword();
      fixture.detectChanges();
      expect(component.showConfirmPassword()).toBe(true);
    });
  });

  describe('password strength computation', () => {
    it('should show no strength for empty password', () => {
      expect(component.strengthValue).toBe(0);
    });

    it('should show weak strength', () => {
      component.passwordForm.patchValue({ newPassword: 'abc' });
      fixture.detectChanges();
      expect(component.strengthValue).toBe(20);
      expect(component.strengthColor).toBe('#ef4444');
      expect(component.strengthLabel).toBe('PROFILE.STRENGTH_WEAK');
    });

    it('should show medium strength', () => {
      component.passwordForm.patchValue({ newPassword: 'Abc1' });
      fixture.detectChanges();
      expect(component.strengthValue).toBe(60);
      expect(component.strengthColor).toBe('#f59e0b');
      expect(component.strengthLabel).toBe('PROFILE.STRENGTH_MEDIUM');
    });

    it('should show strong strength', () => {
      component.passwordForm.patchValue({ newPassword: 'Abc123!' });
      fixture.detectChanges();
      expect(component.strengthValue).toBe(100);
      expect(component.strengthColor).toBe('#22c55e');
      expect(component.strengthLabel).toBe('PROFILE.STRENGTH_STRONG');
    });
  });

  it('should save profile personal updates successfully', () => {
    mockProfileService.updateProfile.and.returnValue(of({}));
    const successSpy = spyOn(notificationService, 'success').and.callThrough();

    component.enterEditMode();
    component.profileModel = MOCK_UPDATE_PAYLOAD;
    component.onSubmit();
    fixture.detectChanges();

    expect(mockProfileService.updateProfile).toHaveBeenCalledWith(MOCK_UPDATE_PAYLOAD);
    expect(successSpy).toHaveBeenCalled();
    expect(component.isEditMode()).toBe(false);
  });

  it('should handle profile update error', () => {
    mockProfileService.updateProfile.and.returnValue(throwError(() => ({
      error: { message: 'Update failed' }
    })));
    const errorSpy = spyOn(notificationService, 'error').and.callThrough();

    component.enterEditMode();
    component.profileModel = MOCK_UPDATE_PAYLOAD;
    component.onSubmit();
    fixture.detectChanges();

    expect(errorSpy).toHaveBeenCalledWith('Update failed');
    expect(component.isEditMode()).toBe(true);
  });

  it('should close password modal and reset password form', () => {
    component.openPasswordModal();
    expect(component.isPasswordModalOpen()).toBe(true);

    component.passwordForm.patchValue({ currentPassword: '123' });
    component.closePasswordModal();
    fixture.detectChanges();

    expect(component.isPasswordModalOpen()).toBe(false);
    expect(component.passwordForm.value.currentPassword).toBeNull();
  });

  it('should show error when passwords do not match during changePassword', () => {
    const translate = TestBed.inject(TranslateService);
    spyOn(translate, 'instant').and.callFake((key: string | string[]) => typeof key === 'string' ? key : key[0]);
    component.openPasswordModal();

    component.passwordForm.patchValue({
      currentPassword: 'old',
      newPassword: 'newPassword123!',
      confirmPassword: 'mismatchPassword'
    });

    component.onChangePassword();
    fixture.detectChanges();

    expect(component.passwordErrorMessage()).toBe('PROFILE.CONFIRM_PASS_REQUIRED');
  });

  it('should successfully change password and logout user', () => {
    mockProfileService.changePassword.and.returnValue(of({}));
    const successSpy = spyOn(notificationService, 'success').and.callThrough();

    component.openPasswordModal();
    component.passwordForm.patchValue({
      currentPassword: 'old',
      newPassword: 'newPassword123!',
      confirmPassword: 'newPassword123!'
    });

    component.onChangePassword();
    fixture.detectChanges();

    expect(mockProfileService.changePassword).toHaveBeenCalledWith('old', 'newPassword123!');
    expect(successSpy).toHaveBeenCalled();
    expect(mockAuth.logout).toHaveBeenCalled();
  });

  it('should handle change password error', () => {
    mockProfileService.changePassword.and.returnValue(throwError(() => ({
      error: { message: 'Incorrect current password' }
    })));

    component.openPasswordModal();
    component.passwordForm.patchValue({
      currentPassword: 'wrong_old',
      newPassword: 'newPassword123!',
      confirmPassword: 'newPassword123!'
    });

    component.onChangePassword();
    fixture.detectChanges();

    expect(component.passwordErrorMessage()).toBe('Incorrect current password');
  });

  it('should handle loadProfile error', () => {
    mockProfileService.getProfile.and.returnValue(throwError(() => ({
      error: { message: 'Load failed' }
    })));
    component.loadProfile();
    fixture.detectChanges();
    expect(component.errorMessage()).toBe('Load failed');
  });

  it('should handle loadProfile fallback error', () => {
    mockProfileService.getProfile.and.returnValue(throwError(() => ({})));
    component.loadProfile();
    fixture.detectChanges();
    expect(component.errorMessage()).toContain('PROFILE.LOAD_ERROR');
  });

  it('should clean numeric input on phone input event', () => {
    const inputEl = document.createElement('input');
    inputEl.value = '123-abc-456';
    const event = { target: inputEl } as unknown as Event;

    component.onPhoneInput(event);
    expect(inputEl.value).toBe('123456');
  });

  it('should reset component values and form on cancelEdit', () => {
    spyOn(component.form, 'reset');
    spyOn(component.form, 'markAsUntouched');
    component.profileData.set(MOCK_PROFILE_DATA_CANCEL_EDIT);

    component.cancelEdit();
    fixture.detectChanges();

    expect(component.profileModel.phone).toBe('099');
    expect(component.profileModel.address).toBe('Hanoi');
    expect(component.form.reset).toHaveBeenCalled();
    expect(component.form.markAsUntouched).toHaveBeenCalled();
    expect(component.isEditMode()).toBe(false);
  });

  it('should mark all controls as touched if form is invalid on submit', () => {
    spyOnProperty(component.form, 'invalid', 'get').and.returnValue(true);
    spyOn(component.form, 'markAllAsTouched');
    component.onSubmit();
    fixture.detectChanges();
    expect(component.form.markAllAsTouched).toHaveBeenCalled();
  });

  it('should show error notification when updateProfile fails', () => {
    spyOnProperty(component.form, 'invalid', 'get').and.returnValue(false);
    mockProfileService.updateProfile.and.returnValue(throwError(() => ({
      error: { message: 'Update failed' }
    })));
    const errorSpy = spyOn(notificationService, 'error');
    component.onSubmit();
    fixture.detectChanges();
    expect(errorSpy).toHaveBeenCalledWith('Update failed');
  });

  it('should show fallback error notification when updateProfile fails', () => {
    spyOnProperty(component.form, 'invalid', 'get').and.returnValue(false);
    mockProfileService.updateProfile.and.returnValue(throwError(() => ({})));
    const errorSpy = spyOn(notificationService, 'error');
    component.onSubmit();
    fixture.detectChanges();
    expect(errorSpy).toHaveBeenCalledWith('PROFILE.UPDATE_ERROR');
  });

  it('should mark all controls as touched on change password if form is invalid', () => {
    spyOnProperty(component.passwordForm, 'invalid', 'get').and.returnValue(true);
    spyOn(component.passwordForm, 'markAllAsTouched');
    component.onChangePassword();
    fixture.detectChanges();
    expect(component.passwordForm.markAllAsTouched).toHaveBeenCalled();
  });

  it('should fallback to empty string if data.employee is undefined on loadProfile success', () => {
    mockProfileService.getProfile.and.returnValue(of(MOCK_PROFILE_DATA_UNDEFINED_EMPLOYEE));
    component.loadProfile();
    fixture.detectChanges();
    expect(component.profileModel.phone).toBe('');
    expect(component.profileModel.address).toBe('');
  });

  it('should fallback to empty string if data.employee is undefined on cancelEdit', () => {
    component.profileData.set(MOCK_PROFILE_DATA_UNDEFINED_EMPLOYEE);
    component.cancelEdit();
    fixture.detectChanges();
    expect(component.profileModel.phone).toBe('');
    expect(component.profileModel.address).toBe('');
  });

  it('should fallback to default error message if error.message is undefined during changePassword', () => {
    mockProfileService.changePassword.and.returnValue(throwError(() => ({})));
    component.openPasswordModal();
    spyOnProperty(component.passwordForm, 'invalid', 'get').and.returnValue(false);
    spyOn(component.passwordForm, 'get').and.returnValue(new FormControl('test'));

    component.onChangePassword();
    fixture.detectChanges();
    expect(component.passwordErrorMessage()).toContain('PROFILE.CHANGE_PASS_ERROR');
  });
});
