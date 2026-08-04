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
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-employee-form',
  imports: [CommonModule, ReactiveFormsModule, Spinner, FormlyModule, TranslatePipe, Button],
  templateUrl: './employee-form.html',
  styleUrl: './employee-form.scss',
})
export class EmployeeForm implements OnInit, OnDestroy {
  baseUrl = environment.baseUrl;
  form = new FormGroup({});
  model: any = {};
  employeeFields: FormlyFieldConfig[] = [];

  accountForm = new FormGroup({});
  accountModel: any = {};
  accountFields: FormlyFieldConfig[] = [];

  isEditMode = signal(false);
  employeeId: string | null = null;
  errorMessage = signal('');
  isLoading = signal(false);
  departments = signal<DepartmentModel[]>([]);

  positions = [
    'Nhân viên',
    'Trưởng nhóm',
    'Trưởng phòng',
    'Phó phòng',
    'Phó giám đốc',
    'Giám đốc',
    'Thực tập sinh',
  ];

  get genderOptions(): SelectOption[] {
    return [
      { label: this.translate.instant('EMPLOYEE.GENDER_MALE'), value: 'MALE' },
      { label: this.translate.instant('EMPLOYEE.GENDER_FEMALE'), value: 'FEMALE' },
      { label: this.translate.instant('EMPLOYEE.GENDER_OTHER'), value: 'OTHER' },
    ];
  }

  get statusOptions(): SelectOption[] {
    return [
      { label: this.translate.instant('COMMON.ACTIVE'), value: 'ACTIVE' },
      { label: this.translate.instant('COMMON.INACTIVE'), value: 'INACTIVE' },
    ];
  }

  get positionOptions(): SelectOption[] {
    const keyMap: { [key: string]: string } = {
      'Nhân viên': 'FORM.POSITION_STAFF',
      'Trưởng nhóm': 'FORM.POSITION_TEAM_LEADER',
      'Trưởng phòng': 'FORM.POSITION_DEPT_HEAD',
      'Phó phòng': 'FORM.POSITION_DEPT_DEPUTY',
      'Phó giám đốc': 'FORM.POSITION_DEPUTY_GD',
      'Giám đốc': 'FORM.POSITION_GD',
      'Thực tập sinh': 'FORM.POSITION_INTERN',
    };
    return this.positions.map((p) => ({
      label: this.translate.instant(keyMap[p] || p),
      value: p,
    }));
  }

  get departmentOptions(): SelectOption[] {
    const mapping: { [key: string]: string } = {
      'Phòng Nhân sự': 'DEPARTMENTS_LIST.HR',
      'Phòng Công nghệ thông tin': 'DEPARTMENTS_LIST.TECH',
      'Phòng Kế toán': 'DEPARTMENTS_LIST.FINANCE',
      'Phòng Marketing': 'DEPARTMENTS_LIST.MARKETING',
      'Phòng Kinh doanh': 'DEPARTMENTS_LIST.SALES',
      'Phòng Hành chính': 'DEPARTMENTS_LIST.ADMIN',
      'Phòng Nghiên cứu & Phát triển': 'DEPARTMENTS_LIST.RD',
      'Phòng R&D': 'DEPARTMENTS_LIST.RD',
      'Phòng Quản lý dự án': 'DEPARTMENTS_LIST.PROJECT',
      'Phòng Chăm sóc khách hàng': 'DEPARTMENTS_LIST.CUSTOMER_SERVICE',
      'Phòng Pháp chế': 'DEPARTMENTS_LIST.LEGAL',
      'Phòng Thiết kế': 'DEPARTMENTS_LIST.DESIGN',
      'Phòng Đào tạo': 'DEPARTMENTS_LIST.TRAINING',
    };
    return this.departments().map((d) => {
      const translationKey = mapping[d.name];
      const label = translationKey ? this.translate.instant(translationKey) : d.name;
      return { label, value: d._id };
    });
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
    private router: Router,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.initFields();
    });

    this.initFields();
    this.loadDepartments();

    this.employeeId = this.route.snapshot.paramMap.get('id');
    if (this.employeeId) {
      this.isEditMode.set(true);
      this.loadEmployee(this.employeeId);
    } else {
      this.createAccount.set(true);

      this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
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
    this.employeeFields = [
      {
        fieldGroupClassName: 'row mb-2',
        fieldGroup: [
          {
            className: 'col-md-3',
            key: 'firstName',
            type: 'input',
            props: {
              label: this.translate.instant('FORM.FIRST_NAME'),
              required: true,
              disabled: this.isEditMode(),
            },
          },
          {
            className: 'col-md-3',
            key: 'lastName',
            type: 'input',
            props: {
              label: this.translate.instant('FORM.LAST_NAME'),
              required: true,
              disabled: this.isEditMode(),
            },
          },
          {
            className: 'col-md-3',
            key: 'gender',
            type: 'custom-select',
            props: {
              label: this.translate.instant('FORM.GENDER'),
              required: true,
              placeholder: this.translate.instant('FORM.GENDER_PLACEHOLDER'),
              options: this.genderOptions,
              disabled: this.isEditMode(),
            },
          },
          {
            className: 'col-md-3',
            key: 'dateOfBirth',
            type: 'input',
            props: {
              label: this.translate.instant('FORM.DOB'),
              type: 'date',
              required: true,
              disabled: this.isEditMode(),
            },
            validators: {
              futureDate: {
                expression: (c: AbstractControl) => !c.value || new Date(c.value) <= new Date(),
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
              label: this.translate.instant('FORM.EMAIL'),
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
              },
            },
          },
          {
            className: 'col-md-6',
            key: 'phone',
            type: 'input',
            props: {
              label: this.translate.instant('FORM.PHONE'),
              placeholder: this.translate.instant('FORM.PHONE_PLACEHOLDER'),
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
              label: this.translate.instant('FORM.ADDRESS'),
            },
            validators: {
              address: {
                expression: (c: AbstractControl) => {
                  const value = c.value as string;
                  if (!value) return true;
                  const letterCount = (value.match(/[a-zA-ZÀ-ỹ]/g) || []).length;
                  return letterCount >= 3;
                },
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
              label: this.translate.instant('FORM.POSITION'),
              required: true,
              placeholder: this.translate.instant('FORM.POSITION_PLACEHOLDER'),
              options: this.positionOptions,
            },
          },
          {
            className: 'col-md-6',
            key: 'department',
            type: 'custom-select',
            props: {
              label: this.translate.instant('FORM.DEPARTMENT'),
              required: true,
              placeholder: this.translate.instant('FORM.DEPARTMENT_PLACEHOLDER'),
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
              label: this.translate.instant('FORM.STATUS'),
              placeholder: this.translate.instant('FORM.STATUS_PLACEHOLDER'),
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
              label: this.translate.instant('FORM.USERNAME'),
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
              },
            },
          },
          {
            className: 'col-md-4',
            key: 'password',
            type: 'input',
            props: {
              type: 'password',
              label: this.existingAccount()
                ? this.translate.instant('FORM.PASSWORD_EDIT')
                : this.translate.instant('FORM.PASSWORD'),
              required: !this.existingAccount() && !this.isEditMode(),
            },
          },
          {
            className: 'col-md-4',
            key: 'roleName',
            type: 'custom-select',
            props: {
              label: this.translate.instant('FORM.ROLE'),
              required: true,
              placeholder: this.translate.instant('FORM.ROLE_PLACEHOLDER'),
              options: [
                { label: this.translate.instant('FORM.ROLE_USER'), value: 'USER' },
                { label: this.translate.instant('FORM.ROLE_ADMIN'), value: 'ADMIN' },
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
    const deptField = this.findFieldByKey(this.employeeFields, 'department');
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
          const departmentId =
            typeof data.department === 'object' ? data.department._id : data.department;

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
    this.form.markAllAsTouched();
    if (this.createAccount()) {
      this.accountForm.markAllAsTouched();
    }

    if (this.form.invalid || (this.createAccount() && this.accountForm.invalid)) {
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
          },
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
          this.notificationService.success(
            this.isEditMode()
              ? this.translate.instant('EMPLOYEE.UPDATE_SUCCESS')
              : this.translate.instant('EMPLOYEE.CREATE_SUCCESS'),
          );
          this.navigateBack();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || this.translate.instant('EMPLOYEE.SAVE_ERROR'));
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
            this.notificationService.success(
              this.isEditMode()
                ? this.translate.instant('EMPLOYEE.UPDATE_SUCCESS')
                : this.translate.instant('EMPLOYEE.CREATE_SUCCESS'),
            );
            this.navigateBack();
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            this.translate.instant('EMPLOYEE.AVATAR_UPLOAD_ERROR', {
              error: err.error?.message || '',
            }),
          );
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
            this.notificationService.success(
              this.translate.instant('EMPLOYEE.UPDATE_ACCOUNT_SUCCESS'),
            );
            this.navigateBack();
          },
          error: (err) => {
            this.isLoading.set(false);
            this.notificationService.error(
              this.translate.instant('EMPLOYEE.UPDATE_ACCOUNT_ERROR', {
                error: err.error?.message || '',
              }),
            );
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
            this.notificationService.success(
              this.translate.instant('EMPLOYEE.CREATE_ACCOUNT_SUCCESS'),
            );
            this.navigateBack();
          },
          error: (err) => {
            this.isLoading.set(false);
            this.notificationService.error(
              this.translate.instant('EMPLOYEE.CREATE_ACCOUNT_ERROR', {
                error: err.error?.message || '',
              }),
            );
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
