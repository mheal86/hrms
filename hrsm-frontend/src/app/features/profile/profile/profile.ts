import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Profile as ProfileService, ProfileData } from '../profile';
import { Spinner } from '../../../shared/spinner/spinner';
import { Notification } from '../../../core/notification';
import { Subject, takeUntil } from 'rxjs';
import { Auth } from '../../../core/auth';

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
  imports: [CommonModule, ReactiveFormsModule, Spinner],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit, OnDestroy {
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
    private authService: Auth
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
          this.notificationService.success('Cập nhật thành công');
          this.loadProfile();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.notificationService.error(err.error?.message || 'Cập nhật thất bại');
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

  toggleCurrentPassword() { this.showCurrentPassword.update(v => !v); }
  toggleNewPassword() { this.showNewPassword.update(v => !v); }
  toggleConfirmPassword() { this.showConfirmPassword.update(v => !v); }

  onChangePassword() {
    this.passwordErrorMessage.set('');
    this.passwordFormSubmitted.set(true);
 
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.passwordErrorMessage.set('Mật khẩu xác nhận không khớp');
      return;
    }

    this.isChangingPassword.set(true);

    this.profileService
      .changePassword(currentPassword, newPassword)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isChangingPassword.set(false);
          this.notificationService.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
          this.closePasswordModal();
          this.authService.logout();
        },
        error: (err) => {
          this.isChangingPassword.set(false);
          this.passwordErrorMessage.set(err.error?.message || 'Đổi mật khẩu thất bại');
        },
      });
  }

  getInitials(firstName?: string, lastName?: string, username?: string): string {
    if (firstName || lastName) {
      return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    }
    return username?.charAt(0)?.toUpperCase() || '?';
  }
}