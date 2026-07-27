import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Profile as ProfileService, ProfileData } from '../profile';
import { Spinner } from '../../../shared/spinner/spinner';
import { Notification } from '../../../core/notification';

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
export class Profile implements OnInit {
  profileData = signal<ProfileData | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');

  isEditMode = signal(false);
  isSaving = signal(false);

  form: FormGroup;

  isPasswordModalOpen = signal(false);
  passwordErrorMessage = signal('');
  isChangingPassword = signal(false);
  passwordForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private notificationService: Notification
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

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.profileService.getProfile().subscribe({
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

  enterEditMode(): void {
    this.isEditMode.set(true);
  }

  cancelEdit(): void {
    const data = this.profileData();
    this.form.patchValue({
      phone: data?.employee?.phone || '',
      address: data?.employee?.address || '',
    });
    this.form.markAsUntouched();
    this.isEditMode.set(false);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    this.profileService.updateProfile(this.form.value).subscribe({
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

  openPasswordModal(): void {
    this.passwordForm.reset();
    this.passwordErrorMessage.set('');
    this.isPasswordModalOpen.set(true);
  }

  closePasswordModal(): void {
    this.isPasswordModalOpen.set(false);
  }

  onChangePassword(): void {
    this.passwordErrorMessage.set('');

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

    this.profileService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.notificationService.success('Đổi mật khẩu thành công');
        this.closePasswordModal();
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