import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Employee } from '../employee';
import { Department } from '../../department/department';
import { Department as DepartmentModel } from '../../department/department-model';
import { Spinner } from '../../../shared/spinner/spinner';
import { User, UserAccountData } from '../../../core/user';
import { Notification } from '../../../core/notification';
import { Subject, takeUntil } from 'rxjs';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { SelectOption } from '../../../shared/custom-select/custom-select';

@Component({
  selector: 'app-employee-form',
  imports: [CommonModule, ReactiveFormsModule, Spinner, FormlyModule],
  templateUrl: './employee-form.html',
  styleUrl: './employee-form.css',
})
export class EmployeeForm implements OnInit, OnDestroy {
  form = new FormGroup({});
  model: any = {};
  fields: FormlyFieldConfig[] = [];

  accountForm = new FormGroup({});
  accountModel: any = {};
  accountFields: FormlyFieldConfig[] = [];

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
  localAvatarUrl = signal('');

  createAccount = signal(false);
  existingAccount = signal<UserAccountData | null>(null);
  private destroy$ = new Subject<void>();

  constructor(
    private employeeService: Employee,
    private departmentService: Department,
    private userService: User,
    private notificationService: Notification,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.initFields();
    this.loadDepartments();

    this.employeeId = this.route.snapshot.paramMap.get('id');
    if (this.employeeId) {
      this.isEditMode.set(true);
      this.loadEmployee(this.employeeId);
    } else {
      this.createAccount.set(true);

      this.route.queryParams
        .pipe(takeUntil(this.destroy$))
        .subscribe(params => {
          const deptId = params['departmentId'];
          if (deptId) {
            this.model = { ...this.model, department: deptId };
          }
        });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initFields() {
    this.fields = [
      {
        fieldGroupClassName: 'row mb-2',
        fieldGroup: [
          {
            className: 'col-md-3',
            key: 'firstName',
            type: 'input',
            props: {
              label: 'Họ',
              required: true,
              disabled: this.isEditMode(),
            },
          },
          {
            className: 'col-md-3',
            key: 'lastName',
            type: 'input',
            props: {
              label: 'Tên',
              required: true,
              disabled: this.isEditMode(),
            },
          },
          {
            className: 'col-md-3',
            key: 'gender',
            type: 'custom-select',
            props: {
              label: 'Giới tính',
              required: true,
              placeholder: 'Chọn giới tính',
              options: this.genderOptions,
              disabled: this.isEditMode(),
            },
          },
          {
            className: 'col-md-3',
            key: 'dateOfBirth',
            type: 'input',
            props: {
              label: 'Ngày sinh',
              type: 'date',
              required: true,
              disabled: this.isEditMode(),
            },
            validators: {
              futureDate: {
                expression: (c: AbstractControl) => !c.value || new Date(c.value) <= new Date(),
                message: 'Ngày sinh không được ở tương lai',
              },
              ageRange: {
                expression: (c: AbstractControl) => {
                  if (!c.value) return true;
                  const birthDate = new Date(c.value);
                  const today = new Date();
                  let age = today.getFullYear() - birthDate.getFullYear();
                  const monthDiff = today.getMonth() - birthDate.getMonth();
                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                  }
                  return age >= 18 && age <= 65;
                },
                message: (error: any, field: FormlyFieldConfig) => {
                  if (!field.formControl?.value) return '';
                  const birthDate = new Date(field.formControl.value);
                  const today = new Date();
                  let age = today.getFullYear() - birthDate.getFullYear();
                  const monthDiff = today.getMonth() - birthDate.getMonth();
                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                  }
                  if (age < 18) return 'Nhân viên phải từ 18 tuổi trở lên';
                  return 'Nhân viên không được quá 65 tuổi';
                }
              },
            },
          },
        ],
      },
      {
        fieldGroupClassName: 'row mb-2',
        fieldGroup: [
          {
            className: 'col-md-6',
            key: 'email',
            type: 'input',
            props: {
              label: 'Email',
              type: 'email',
              required: true,
              disabled: this.isEditMode(),
            },
            validators: {
              gmail: {
                expression: (c: AbstractControl) => {
                  const value = c.value as string;
                  if (!value) return true;
                  const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                  if (!emailRegex.test(value)) return false;
                  const parts = value.split('@');
                  const localPart = parts[0];
                  return localPart.length >= 3 && /[a-zA-Z]/.test(localPart);
                },
                message: 'Email không hợp lệ (cần ít nhất 3 ký tự ở phần tên và chứa chữ cái)',
              },
            },
          },
          {
            className: 'col-md-6',
            key: 'phone',
            type: 'input',
            props: {
              label: 'Số điện thoại',
              placeholder: 'VD: 0912345678',
              maxLength: 10,
            },
            hooks: {
              onInit: (field) => {
                field.formControl?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((val) => {
                  if (val) {
                    const cleaned = val.replace(/[^0-9]/g, '').slice(0, 10);
                    if (cleaned !== val) {
                      field.formControl?.setValue(cleaned, { emitEvent: false });
                    }
                  }
                });
              },
            },
            validators: {
              phone: {
                expression: (c: AbstractControl) => !c.value || /^0\d{9}$/.test(c.value),
                message: 'Số điện thoại phải bắt đầu bằng số 0 và có 10 chữ số',
              },
            },
          },
        ],
      },
      {
        fieldGroupClassName: 'row mb-2',
        fieldGroup: [
          {
            className: 'col-md-12',
            key: 'address',
            type: 'input',
            props: {
              label: 'Địa chỉ',
            },
            validators: {
              address: {
                expression: (c: AbstractControl) => {
                  const value = c.value as string;
                  if (!value) return true;
                  const letterCount = (value.match(/[a-zA-ZÀ-ỹ]/g) || []).length;
                  return letterCount >= 3;
                },
                message: 'Địa chỉ không hợp lệ (cần ít nhất 3 ký tự chữ)',
              },
            },
          },
        ],
      },
      {
        fieldGroupClassName: 'row mb-2',
        fieldGroup: [
          {
            className: 'col-md-6',
            key: 'position',
            type: 'custom-select',
            props: {
              label: 'Chức vụ',
              required: true,
              placeholder: 'Chọn chức vụ',
              options: this.positionOptions,
            },
          },
          {
            className: 'col-md-6',
            key: 'department',
            type: 'custom-select',
            props: {
              label: 'Phòng ban',
              required: true,
              placeholder: 'Chọn phòng ban',
              options: this.departmentOptions,
            },
          },
        ],
      },
      {
        fieldGroupClassName: 'row mb-2',
        fieldGroup: [
          {
            className: 'col-md-12',
            key: 'status',
            type: 'custom-select',
            props: {
              label: 'Trạng thái',
              placeholder: 'Chọn trạng thái',
              options: this.statusOptions,
            },
            hideExpression: () => !this.isEditMode(),
          },
        ],
      },
    ];

    this.accountFields = [
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-md-4',
            key: 'username',
            type: 'input',
            props: {
              label: 'Username',
              required: true,
              disabled: this.isEditMode(),
            },
            validators: {
              username: {
                expression: (c: AbstractControl) => {
                  const value = c.value as string;
                  if (!value) return true;
                  if (/\s/.test(value)) return false;
                  const validRegex = /^[a-zA-Z0-9._-]+$/;
                  return validRegex.test(value);
                },
                message: (error: any, field: FormlyFieldConfig) => {
                  const value = field.formControl?.value;
                  if (value && /\s/.test(value)) {
                    return 'Username không được chứa khoảng trắng';
                  }
                  return 'Username chỉ được chứa chữ, số, dấu chấm, gạch dưới, gạch ngang';
                }
              },
            },
            asyncValidators: {
              duplicateUsername: {
                expression: (c: AbstractControl) => {
                  if (!c.value || c.pristine || this.isEditMode()) {
                    return Promise.resolve(true);
                  }
                  return new Promise((resolve) => {
                    this.userService
                      .checkUsername(c.value)
                      .pipe(takeUntil(this.destroy$))
                      .subscribe({
                        next: (res) => resolve(!res.exists),
                        error: () => resolve(true),
                      });
                  });
                },
                message: 'Tên tài khoản này đã tồn tại',
              },
            },
          },
          {
            className: 'col-md-4',
            key: 'password',
            type: 'input',
            props: {
              type: 'password',
              label: this.existingAccount() ? 'Password (để trống nếu giữ nguyên)' : 'Password',
              required: !this.existingAccount() && !this.isEditMode(),
            }
          },
          {
            className: 'col-md-4',
            key: 'roleName',
            type: 'custom-select',
            props: {
              label: 'Vai trò',
              required: true,
              placeholder: 'Chọn vai trò',
              options: [
                { label: 'User', value: 'USER' },
                { label: 'Admin', value: 'ADMIN' }
              ],
            },
          },
        ],
      },
    ];
  }

  toggleCreateAccount() {
    if (!this.isEditMode()) return;
    this.createAccount.update((v) => !v);
  }

  loadDepartments() {
    this.departmentService
      .getAllUnpaginated()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.departments.set(data);
          this.updateDepartmentFieldOptions();
        },
        error: (err) => console.error('Không tải được danh sách phòng ban', err),
      });
  }

  updateDepartmentFieldOptions() {
    const deptField = this.findFieldByKey(this.fields, 'department');
    if (deptField && deptField.props) {
      deptField.props.options = this.departmentOptions;
    }
  }

  private findFieldByKey(fields: FormlyFieldConfig[], key: string): FormlyFieldConfig | null {
    for (const f of fields) {
      if (f.key === key) return f;
      if (f.fieldGroup) {
        const found = this.findFieldByKey(f.fieldGroup, key);
        if (found) return found;
      }
    }
    return null;
  }

  loadEmployee(id: string) {
    this.isLoading.set(true);
    this.employeeService
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const departmentId = typeof data.department === 'object' ? data.department._id : data.department;

          this.model = {
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
          };

          this.initFields();
          this.updateDepartmentFieldOptions();

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

  checkExistingAccount(employeeId: string) {
    this.userService
      .getByEmployeeId(employeeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.existingAccount.set(user);
          this.initFields();
          this.updateDepartmentFieldOptions();

          this.accountModel = {
            username: user.username,
            roleName: user.role.name,
          };
        },
        error: () => {},
      });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          this.localAvatarUrl.set(e.target.result as string);
        }
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.createAccount() && this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formValue = this.form.getRawValue();

    if (this.createAccount() && !this.isEditMode()) {
      const username = (this.accountForm.value as any).username;
      this.userService
        .checkUsername(username)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
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

  private proceedSave(formValue: any) {
    const request = this.isEditMode()
      ? this.employeeService.update(this.employeeId!, formValue)
      : this.employeeService.create(formValue);

    request.pipe(takeUntil(this.destroy$)).subscribe({
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

  private uploadAvatar(employeeId: string) {
    this.employeeService
      .uploadAvatar(employeeId, this.selectedFile!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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

  private navigateBack() {
    const deptId = this.route.snapshot.queryParamMap.get('departmentId');
    if (deptId) {
      this.router.navigate(['/departments', deptId]);
    } else {
      this.router.navigate(['/employees']);
    }
  }

  private saveUserAccount(employeeId: string) {
    const { username, password, roleName } = this.accountForm.getRawValue() as any;
    const existing = this.existingAccount();

    if (existing) {
      const payload: any = { username, roleName };
      if (password) {
        payload.newPassword = password;
      }

      this.userService
        .update(existing._id, payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
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
      this.userService
        .create({ username, password, roleName, employeeId })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
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

  onCancel() {
    this.form.reset();
    this.form.markAsUntouched();
    this.localAvatarUrl.set('');
    this.navigateBack();
  }
}