import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Employee } from '../employee';
import { Department } from '../../department/department';
import { Department as DepartmentModel } from '../../department/department-model';
import { Spinner } from '../../../shared/spinner/spinner';
import { User, UserAccountData } from '../../../core/user';
import { Notification } from '../../../core/notification';

function gmailValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;

  // Bắt đầu bằng chữ hoặc số, sau đó là chữ/số/dấu chấm/gạch dưới/gạch ngang/cộng/phần trăm, sau đó là @, cuối cùng là domain hợp lệ
  const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(value)) {
    return { emailInvalid: true };
  }

  const parts = value.split('@');
  const localPart = parts[0];
  if (localPart.length < 3) {
    return { emailInvalid: true };
  }

  // Phải chứa ít nhất 1 chữ cái, không được phép chỉ chứa mỗi số
  const hasLetter = /[a-zA-Z]/.test(localPart);
  if (!hasLetter) {
    return { emailInvalid: true };
  }

  return null;
}

function usernameValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { required: true };
  }
  if (/\s/.test(value)) {
    return { hasSpaces: true };
  }
  const validRegex = /^[a-zA-Z0-9._-]+$/;
  if (!validRegex.test(value)) {
    return { invalidChars: true };
  }
  return null;
}

function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  return /^0\d{9}$/.test(value) ? null : { invalidPhone: true };
}

function addressValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  // Phải chứa ít nhất 3 ký tự chữ cái (kể cả tiếng Việt có dấu)
  const letterCount = (value.match(/[a-zA-ZÀ-ỹ]/g) || []).length;
  if (letterCount < 3) {
    return { invalidAddress: true };
  }
  return null;
}

function noFutureDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  const inputDate = new Date(value);
  const today = new Date();
  return inputDate > today ? { futureDate: true } : null;
}

function ageRangeValidator(minAge: number, maxAge: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;
    const birthDate = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < minAge) return { tooYoung: true };
    if (age > maxAge) return { tooOld: true };
    return null;
  };
}

import { CustomSelectComponent, SelectOption } from '../../../shared/custom-select/custom-select';

@Component({
  selector: 'app-employee-form',
  imports: [CommonModule, ReactiveFormsModule, Spinner, CustomSelectComponent],
  templateUrl: './employee-form.html',
  styleUrl: './employee-form.css',
})
export class EmployeeForm implements OnInit {
  form: FormGroup;
  isEditMode = signal(false);
  employeeId: string | null = null;
  errorMessage = signal('');
  isLoading = signal(false);
  departments = signal<DepartmentModel[]>([]);

  positions = ['Nhân viên', 'Trưởng nhóm', 'Trưởng phòng', 'Phó phòng', 'Phó giám đốc', 'Giám đốc', 'Thực tập sinh'];

  genderOptions: SelectOption[] = [
    { label: 'Nam', value: 'MALE' },
    { label: 'Nữ', value: 'FEMALE' },
    { label: 'Khác', value: 'OTHER' }
  ];

  statusOptions: SelectOption[] = [
    { label: 'Đang hoạt động', value: 'ACTIVE' },
    { label: 'Ngừng hoạt động', value: 'INACTIVE' }
  ];

  get positionOptions(): SelectOption[] {
    return this.positions.map(p => ({ label: p, value: p }));
  }

  get departmentOptions(): SelectOption[] {
    return this.departments().map(d => ({ label: d.name, value: d._id }));
  }

  selectedFile: File | null = null;
  currentAvatarUrl = signal('');

  createAccount = signal(false);
  accountForm: FormGroup;
  existingAccount = signal<UserAccountData | null>(null);

  constructor(
    private fb: FormBuilder,
    private employeeService: Employee,
    private departmentService: Department,
    private userService: User,
    private notificationService: Notification,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email, gmailValidator]],
      phone: ['', phoneValidator],
      gender: ['', Validators.required],
      dateOfBirth: ['', [Validators.required, noFutureDateValidator, ageRangeValidator(18, 65)]],
      address: ['', addressValidator],
      position: ['', Validators.required],
      department: ['', Validators.required],
      status: ['ACTIVE'],
    });

    this.accountForm = this.fb.group({
      username: ['', [Validators.required, usernameValidator]],
      password: [''],
      roleName: ['USER', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadDepartments();

    this.employeeId = this.route.snapshot.paramMap.get('id');
    if (this.employeeId) {
      this.isEditMode.set(true);
      this.loadEmployee(this.employeeId);
    } else {
      // Thêm mới: bắt buộc luôn phải cấp tài khoản
      this.createAccount.set(true);

      // Đọc query param 'departmentId' để chọn sẵn phòng ban
      this.route.queryParams.subscribe(params => {
        const deptId = params['departmentId'];
        if (deptId) {
          this.form.patchValue({ department: deptId });
        }
      });
    }
  }

  toggleCreateAccount(): void {
    if (!this.isEditMode()) return; // Thêm mới thì không cho tắt
    this.createAccount.update((v) => !v);
  }

  loadDepartments(): void {
    this.departmentService.getAllUnpaginated().subscribe({
      next: (data) => this.departments.set(data),
      error: (err) => console.error('Không tải được danh sách phòng ban', err),
    });
  }

  loadEmployee(id: string): void {
    this.isLoading.set(true);
    this.employeeService.getById(id).subscribe({
      next: (data) => {
        const departmentId = typeof data.department === 'object' ? data.department._id : data.department;

        this.form.patchValue({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.substring(0, 10) : '',
          address: data.address,
          position: data.position,
          department: departmentId,
          status: data.status || 'ACTIVE',
        });

        if (this.isEditMode()) {
          this.form.get('firstName')?.disable();
          this.form.get('lastName')?.disable();
          this.form.get('gender')?.disable();
          this.form.get('email')?.disable();
          this.form.get('dateOfBirth')?.disable();
        }

        this.currentAvatarUrl.set(data.avatarUrl || '');
        this.isLoading.set(false);
        this.checkExistingAccount(id);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Không tải được dữ liệu');
        this.isLoading.set(false);
      },
    });
  }

  checkExistingAccount(employeeId: string): void {
    this.userService.getByEmployeeId(employeeId).subscribe({
      next: (user) => {
        this.existingAccount.set(user);
        this.accountForm.patchValue({
          username: user.username,
          roleName: user.role.name,
        });
        if (this.isEditMode()) {
          this.accountForm.get('username')?.disable();
        }
      },
      error: () => {},
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  checkUsernameExists(): void {
    const control = this.accountForm.get('username');
    if (!control || control.invalid || this.isEditMode()) return;

    const username = control.value;
    this.userService.checkUsername(username).subscribe({
      next: (res) => {
        if (res.exists) {
          control.setErrors({ duplicateUsername: true });
        }
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.createAccount() && this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    if (this.createAccount() && !this.existingAccount() && !this.accountForm.value.password) {
      this.accountForm.get('password')?.setErrors({ required: true });
      this.accountForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formValue = this.form.getRawValue();

    if (this.createAccount() && !this.isEditMode()) {
      const username = this.accountForm.value.username;
      this.userService.checkUsername(username).subscribe({
        next: (res) => {
          if (res.exists) {
            this.isLoading.set(false);
            const usernameControl = this.accountForm.get('username');
            usernameControl?.setErrors({ duplicateUsername: true });
            usernameControl?.markAsTouched();
            return;
          }
          this.proceedSave(formValue);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || 'Không thể kiểm tra trùng lặp tài khoản');
        }
      });
    } else {
      this.proceedSave(formValue);
    }
  }

  private proceedSave(formValue: any): void {
    const request = this.isEditMode()
      ? this.employeeService.update(this.employeeId!, formValue)
      : this.employeeService.create(formValue);

    request.subscribe({
      next: (savedEmployee) => {
        if (this.selectedFile && savedEmployee._id) {
          this.uploadAvatar(savedEmployee._id);
        } else if (this.createAccount() && savedEmployee._id) {
          this.saveUserAccount(savedEmployee._id);
        } else {
          this.isLoading.set(false);
          this.navigateBack();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Lưu thất bại');
      },
    });
  }

  private uploadAvatar(employeeId: string): void {
    this.employeeService.uploadAvatar(employeeId, this.selectedFile!).subscribe({
      next: () => {
        if (this.createAccount()) {
          this.saveUserAccount(employeeId);
        } else {
          this.isLoading.set(false);
          this.navigateBack();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Lưu thông tin thành công nhưng upload avatar thất bại: ' + (err.error?.message || ''));
      },
    });
  }

  private navigateBack(): void {
    const deptId = this.route.snapshot.queryParamMap.get('departmentId');
    if (deptId) {
      this.router.navigate(['/departments', deptId]);
    } else {
      this.router.navigate(['/employees']);
    }
  }

  private saveUserAccount(employeeId: string): void {
    const { username, password, roleName } = this.accountForm.getRawValue();
    const existing = this.existingAccount();

    if (existing) {
      const payload: any = { username, roleName };
      if (password) {
        payload.newPassword = password;
      }

      this.userService.update(existing._id, payload).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.notificationService.success('Cập nhật tài khoản thành công');
          this.navigateBack();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.notificationService.error('Lưu nhân viên thành công nhưng cập nhật tài khoản thất bại: ' + (err.error?.message || ''));
          this.navigateBack();
        },
      });
    } else {
      this.userService.create({ username, password, roleName, employeeId }).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.notificationService.success('Tạo nhân viên và cấp tài khoản thành công');
          this.navigateBack();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.notificationService.error('Tạo nhân viên thành công nhưng cấp tài khoản thất bại: ' + (err.error?.message || ''));
          this.navigateBack();
        },
      });
    }
  }

  onCancel(): void {
    this.navigateBack();
  }
}