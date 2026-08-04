import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Profile as ProfileService, ProfileData } from '../profile';
import { Spinner } from '../../../shared/spinner/spinner';
import { Notification } from '../../../core/notification';
import { Subject, takeUntil } from 'rxjs';
import { Auth } from '../../../core/auth';
import { Dialog } from 'primeng/dialog';
import { Password } from 'primeng/password';
import { FloatLabel } from 'primeng/floatlabel';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';

function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  return /^0\d{9}$/.test(value) ? null : { invalidPhone: true };
}

function addressValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  const letterCount = (value.match(/[a-zA-ZÀ-ỹ]/g) || []).length;
  if (letterCount < 3) {
    return { invalidAddress: true };
  }
  return null;
}

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Spinner,
    Dialog,
    Password,
    FloatLabel,
    Button,
    TableModule,
    TranslatePipe,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit, OnDestroy {
  baseUrl = environment.baseUrl;
  profileData = signal<ProfileData | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');

  isEditMode = signal(false);
  isSaving = signal(false);

  form: FormGroup;

  isPasswordModalOpen = signal(false);
  passwordErrorMessage = signal('');
  isChangingPassword = signal(false);
  passwordFormSubmitted = signal(false);
  passwordForm: FormGroup;

  // Toggle hiển thị mật khẩu cho từng trường trong modal đổi mật khẩu
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private notificationService: Notification,
    private authService: Auth,
    private translate: TranslateService,
  ) {
    this.form = this.fb.group({
      phone: ['', phoneValidator],
      address: ['', addressValidator],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.loadProfile();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProfile() {
    this.isLoading.set(true);
    this.profileService
      .getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.profileData.set(data);
          this.form.patchValue({
            phone: data.employee?.phone || '',
            address: data.employee?.address || '',
          });
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Không tải được thông tin');
          this.isLoading.set(false);
        },
      });
  }

  enterEditMode() {
    this.isEditMode.set(true);
  }

  onPhoneInput(event: any) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 10);
    this.form.get('phone')?.setValue(input.value, { emitEvent: false });
  }

  cancelEdit() {
    const data = this.profileData();
    this.form.patchValue({
      phone: data?.employee?.phone || '',
      address: data?.employee?.address || '',
    });
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
      .updateProfile(this.form.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.isEditMode.set(false);
          this.notificationService.success(this.translate.instant('PROFILE.UPDATE_SUCCESS'));
          this.loadProfile();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.notificationService.error(
            err.error?.message || this.translate.instant('PROFILE.UPDATE_ERROR'),
          );
        },
      });
  }

  openPasswordModal() {
    this.passwordForm.reset();
    this.passwordFormSubmitted.set(false);
    this.passwordErrorMessage.set('');
    // Reset trạng thái hiển thị mật khẩu mỗi lần mở modal
    this.showCurrentPassword.set(false);
    this.showNewPassword.set(false);
    this.showConfirmPassword.set(false);
    this.isPasswordModalOpen.set(true);
  }

  closePasswordModal() {
    this.isPasswordModalOpen.set(false);
    this.passwordForm.reset();
    this.passwordFormSubmitted.set(false);
    this.passwordErrorMessage.set('');
    // Reset trạng thái khi đóng modal
    this.showCurrentPassword.set(false);
    this.showNewPassword.set(false);
    this.showConfirmPassword.set(false);
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
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isChangingPassword.set(false);
          this.notificationService.success(this.translate.instant('PROFILE.CHANGE_PASS_SUCCESS'));
          this.closePasswordModal();
          this.authService.logout();
        },
        error: (err) => {
          this.isChangingPassword.set(false);
          this.passwordErrorMessage.set(
            err.error?.message || this.translate.instant('PROFILE.CHANGE_PASS_ERROR'),
          );
        },
      });
  }

  getInitials(firstName?: string, lastName?: string, username?: string): string {
    if (firstName || lastName) {
      return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    }
    return username?.charAt(0)?.toUpperCase() || '?';
  }

  get newPasswordValue(): string {
    return this.passwordForm.get('newPassword')?.value || '';
  }

  hasMinLength(): boolean {
    return this.newPasswordValue.length >= 6;
  }

  hasUppercase(): boolean {
    return /[A-Z]/.test(this.newPasswordValue);
  }

  hasLowercase(): boolean {
    return /[a-z]/.test(this.newPasswordValue);
  }

  hasNumber(): boolean {
    return /[0-9]/.test(this.newPasswordValue);
  }

  hasSpecialChar(): boolean {
    return /[^A-Za-z0-9]/.test(this.newPasswordValue);
  }

  get strengthValue(): number {
    let score = 0;
    if (this.hasMinLength()) score += 20;
    if (this.hasUppercase()) score += 20;
    if (this.hasLowercase()) score += 20;
    if (this.hasNumber()) score += 20;
    if (this.hasSpecialChar()) score += 20;
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

  getDepartmentName(dept: any): string {
    const fallback = this.translate.instant('COMMON.UNASSIGNED');
    if (!dept) return fallback;
    const name = typeof dept === 'object' ? dept.name || fallback : dept;
    const mapping: { [key: string]: string } = {
      'Phòng Nhân sự': 'DEPARTMENTS_LIST.HR',
      'Phòng Công nghệ thông tin': 'DEPARTMENTS_LIST.TECH',
      'Phòng Kế toán': 'DEPARTMENTS_LIST.FINANCE',
      'Phòng Marketing': 'DEPARTMENTS_LIST.MARKETING',
      'Phòng Kinh doanh': 'DEPARTMENTS_LIST.SALES',
      'Phòng Hành chính': 'DEPARTMENTS_LIST.ADMIN',
      'Phòng Nghiên cứu & Phát triển': 'DEPARTMENTS_LIST.RD',
      'Phòng R&D': 'DEPARTMENTS_LIST.RD',
    };
    const translationKey = mapping[name];
    if (translationKey) {
      const translated = this.translate.instant(translationKey);
      return translated !== translationKey ? translated : name;
    }
    return name;
  }

  getPositionTranslation(position: any): string {
    if (!position) return '';
    const mapping: { [key: string]: string } = {
      'Nhân viên': 'FORM.POSITION_STAFF',
      'Trưởng nhóm': 'FORM.POSITION_TEAM_LEADER',
      'Trưởng phòng': 'FORM.POSITION_DEPT_HEAD',
      'Phó phòng': 'FORM.POSITION_DEPT_DEPUTY',
      'Phó giám đốc': 'FORM.POSITION_DEPUTY_GD',
      'Giám đốc': 'FORM.POSITION_GD',
      'Thực tập sinh': 'FORM.POSITION_INTERN',
    };
    return mapping[position] || position;
  }
}
