import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Profile as ProfileService } from '../../../core/services/profile.service';
import { ProfileData } from '../../../core/models/profile-model';
import { Spinner } from '../../../shared/spinner/spinner';
import { Notification } from '../../../core/services/notification';
import { Subject, takeUntil, finalize, merge, of } from 'rxjs';
import { Auth } from '../../../core/services/auth';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { LanguageService } from '../../../core/services/language.service';
import { FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';
import { getInitials } from '../../../core/utils/employee-utils';
import { phoneValidator, addressValidator, validatePhone, validateAddress, cleanNumericInput, setupNumericInputHook } from '../../../core/utils/validators';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Spinner,
    Dialog,
    Button,
    TableModule,
    TranslatePipe,
    FormlyModule,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit, OnDestroy {
  fb = inject(FormBuilder);
  profileService = inject(ProfileService);
  notificationService = inject(Notification);
  authService = inject(Auth);
  translate = inject(TranslateService);
  languageService = inject(LanguageService);

  baseUrl = environment.baseUrl;
  getInitials = getInitials;
  profileData = signal<ProfileData | undefined>(undefined);
  isLoading = signal(false);
  errorMessage = signal('');

  isEditMode = signal(false);
  isSaving = signal(false);

  form: FormGroup = this.fb.group({
    phone: ['', phoneValidator],
    address: ['', addressValidator],
  });

  isPasswordModalOpen = signal(false);
  passwordErrorMessage = signal('');
  isChangingPassword = signal(false);
  passwordFormSubmitted = signal(false);
  
  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  });

  // Toggle hiển thị mật khẩu cho từng trường trong modal đổi mật khẩu
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  passwordRules = [
    { key: 'minLength' as const, label: 'PROFILE.PASS_MIN_LENGTH' },
    { key: 'uppercase' as const, label: 'PROFILE.PASS_UPPERCASE' },
    { key: 'lowercase' as const, label: 'PROFILE.PASS_LOWERCASE' },
    { key: 'number' as const, label: 'PROFILE.PASS_NUMBER' },
    { key: 'specialChar' as const, label: 'PROFILE.PASS_SPECIAL' },
  ];

  destroy$ = new Subject<void>();
  profileFields: FormlyFieldConfig[] = [];
  profileModel: { phone?: string; address?: string } = {};
  passwordFields: FormlyFieldConfig[] = [];
  passwordModel = { currentPassword: '', newPassword: '', confirmPassword: '' };

  ngOnInit() {
    merge(
      of(null),
      this.translate.onLangChange
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.initFields());

    this.loadProfile();
  }

  initFields() {
    this.profileFields = [
      {
        key: 'phone',
        type: 'input',
        props: {
          label: this.translate.instant('PROFILE.PHONE_LABEL'),
          placeholder: this.translate.instant('PROFILE.PHONE_PLACEHOLDER'),
          maxLength: 10,
        },
        hooks: {
          onInit: setupNumericInputHook(this.destroy$),
        },
        validators: {
          phone: {
            expression: (c: AbstractControl) => validatePhone(c.value),
            message: () => this.translate.instant('PROFILE.PHONE_INVALID'),
          },
        },
      },
      {
        key: 'address',
        type: 'input',
        props: {
          label: this.translate.instant('PROFILE.ADDRESS_LABEL'),
        },
        validators: {
          address: {
            expression: (c: AbstractControl) => validateAddress(c.value),
            message: () => this.translate.instant('PROFILE.ADDRESS_INVALID'),
          },
        },
      },
    ];

    this.passwordFields = [
      {
        key: 'currentPassword',
        type: 'input',
        className: 'mb-3 d-block',
        props: {
          type: 'password',
          label: this.translate.instant('PROFILE.CURRENT_PASSWORD'),
          required: true,
        },
        validation: {
          messages: {
            required: () => this.translate.instant('PROFILE.CURRENT_PASS_REQUIRED'),
          },
        },
      },
      {
        key: 'newPassword',
        type: 'input',
        className: 'mb-3 d-block',
        props: {
          type: 'password',
          label: this.translate.instant('PROFILE.NEW_PASSWORD'),
          required: true,
          minLength: 6,
        },
        validation: {
          messages: {
            required: () => this.translate.instant('PROFILE.NEW_PASS_REQUIRED'),
            minlength: () => this.translate.instant('PROFILE.PASS_MIN_LENGTH'),
          },
        },
      },
      {
        key: 'confirmPassword',
        type: 'input',
        className: 'mb-3 d-block',
        props: {
          type: 'password',
          label: this.translate.instant('PROFILE.CONFIRM_PASSWORD'),
          required: true,
        },
        validation: {
          messages: {
            required: () => this.translate.instant('PROFILE.CONFIRM_PASS_REQUIRED'),
          },
        },
      },
    ];
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProfile() {
    this.isLoading.set(true);
    this.profileService
      .getProfile()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (data) => {
          this.profileData.set(data);
          this.profileModel = {
            phone: data.employee?.phone || '',
            address: data.employee?.address || '',
          };
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || this.translate.instant('PROFILE.LOAD_ERROR'));
        },
      });
  }

  enterEditMode() {
    this.isEditMode.set(true);
  }

  onPhoneInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = cleanNumericInput(input.value);
    this.form.get('phone')?.setValue(input.value, { emitEvent: false });
  }

  cancelEdit() {
    const data = this.profileData();
    this.profileModel = {
      phone: data?.employee?.phone || '',
      address: data?.employee?.address || '',
    };
    this.form.reset();
    this.form.markAsUntouched();
    this.isEditMode.set(false);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    this.profileService
      .updateProfile(this.profileModel)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: () => {
          this.isEditMode.set(false);
          this.notificationService.success(this.translate.instant('PROFILE.UPDATE_SUCCESS'));
          this.loadProfile();
        },
        error: (err) => {
          this.notificationService.error(
            err.error?.message || this.translate.instant('PROFILE.UPDATE_ERROR'),
          );
        },
      });
  }

  resetPasswordFormState() {
    this.passwordForm.reset();
    this.passwordModel = { currentPassword: '', newPassword: '', confirmPassword: '' };
    this.passwordFormSubmitted.set(false);
    this.passwordErrorMessage.set('');
    this.showCurrentPassword.set(false);
    this.showNewPassword.set(false);
    this.showConfirmPassword.set(false);
  }

  openPasswordModal() {
    this.resetPasswordFormState();
    this.isPasswordModalOpen.set(true);
  }

  closePasswordModal() {
    this.isPasswordModalOpen.set(false);
    this.resetPasswordFormState();
  }

  toggleCurrentPassword() {
    this.showCurrentPassword.update((v) => !v);
  }

  toggleNewPassword() {
    this.showNewPassword.update((v) => !v);
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.update((v) => !v);
  }

  onChangePassword() {
    this.passwordErrorMessage.set('');
    this.passwordFormSubmitted.set(true);

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.passwordErrorMessage.set(this.translate.instant('PROFILE.CONFIRM_PASS_REQUIRED'));
      return;
    }

    this.isChangingPassword.set(true);

    this.profileService
      .changePassword(currentPassword, newPassword)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isChangingPassword.set(false))
      )
      .subscribe({
        next: () => {
          this.notificationService.success(this.translate.instant('PROFILE.CHANGE_PASS_SUCCESS'));
          this.closePasswordModal();
          this.authService.logout();
        },
        error: (err) => {
          this.passwordErrorMessage.set(
            err.error?.message || this.translate.instant('PROFILE.CHANGE_PASS_ERROR'),
          );
        },
      });
  }

  get newPasswordValue(): string {
    return this.passwordModel.newPassword || this.passwordForm.get('newPassword')?.value || '';
  }

  get newPasswordValidation() {
    const val = this.newPasswordValue;
    return {
      minLength: val.length >= 6,
      uppercase: /[A-Z]/.test(val),
      lowercase: /[a-z]/.test(val),
      number: /[0-9]/.test(val),
      specialChar: /[^A-Za-z0-9]/.test(val),
    };
  }

  get strengthValue(): number {
    const checks = this.newPasswordValidation;
    let score = 0;
    if (checks.minLength) score += 20;
    if (checks.uppercase) score += 20;
    if (checks.lowercase) score += 20;
    if (checks.number) score += 20;
    if (checks.specialChar) score += 20;
    return score;
  }

  get strengthColor(): string {
    const val = this.strengthValue;
    if (val <= 40) return '#ef4444';
    if (val <= 80) return '#f59e0b';
    return '#22c55e';
  }

  get strengthLabel(): string {
    const val = this.strengthValue;
    if (val <= 40) return this.translate.instant('PROFILE.STRENGTH_WEAK');
    if (val <= 80) return this.translate.instant('PROFILE.STRENGTH_MEDIUM');
    return this.translate.instant('PROFILE.STRENGTH_STRONG');
  }
}
