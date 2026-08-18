import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Employee } from '../../../core/services/employee.service';
import { Employee as EmployeeModel, EmployeeStatus } from '../../../core/models/employee-model';
import { Department } from '../../../core/services/department.service';
import { Department as DepartmentModel } from '../../../core/models/department-model';
import { Spinner } from '../../../shared/spinner/spinner';
import { User } from '../../../core/services/user';
import { UserAccountData } from '../../../core/models/user-model';
import { Notification } from '../../../core/services/notification';
import { Subject, takeUntil, finalize, of, switchMap, catchError, map, merge } from 'rxjs';
import { LanguageService } from '../../../core/services/language.service';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { SelectOption } from '../../../core/models/select-option-model';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { environment } from '../../../../environments/environment';
import { validatePhone, validateAddress, validateGmail, setupNumericInputHook } from '../../../core/utils/validators';

@Component({
  selector: 'app-employee-form',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    Spinner,
    FormlyModule,
    TranslatePipe,
    Button,
    Checkbox,
    InputText,
  ],
  templateUrl: './employee-form.html',
  styleUrl: './employee-form.scss',
})
export class EmployeeForm implements OnInit, OnDestroy {
  employeeService = inject(Employee);
  departmentService = inject(Department);
  userService = inject(User);
  notificationService = inject(Notification);
  route = inject(ActivatedRoute);
  router = inject(Router);
  translate = inject(TranslateService);
  languageService = inject(LanguageService);

  baseUrl = environment.baseUrl;
  form = new FormGroup({});
  model: Omit<Partial<EmployeeModel>, 'dateOfBirth'> & { dateOfBirth?: Date | null } = {};
  employeeFields: FormlyFieldConfig[] = [];

  accountForm = new FormGroup({});
  accountModel: Record<string, string | undefined> = {};
  accountFields: FormlyFieldConfig[] = [];

  isEditMode = signal(false);
  employeeId?: string;
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
      { label: this.translate.instant('COMMON.ACTIVE'), value: EmployeeStatus.ACTIVE },
      { label: this.translate.instant('COMMON.INACTIVE'), value: EmployeeStatus.INACTIVE },
    ];
  }

  get positionOptions(): SelectOption[] {
    return this.positions.map((p) => ({
      label: this.translate.instant(this.languageService.getPositionTranslation(p)),
      value: p,
    }));
  }

  get departmentOptions(): SelectOption[] {
    return this.departments().map((d) => ({
      label: this.languageService.getDepartmentName(d.name),
      value: d._id || '',
    }));
  }

  selectedFile?: File;
  currentAvatarUrl = signal('');
  localAvatarUrl = signal('');

  createAccount = signal(false);
  existingAccount = signal<UserAccountData | undefined>(undefined);
  destroy$ = new Subject<void>();

  ngOnInit() {
    this.subscribeToLanguageChanges();
    this.loadDepartments();
    this.initFormMode();
  }

  subscribeToLanguageChanges() {
    merge(
      of(null),
      this.translate.onLangChange
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.initFields());
  }

  initFormMode() {
    this.employeeId = this.route.snapshot.paramMap.get('id') ?? undefined;
    if (this.employeeId) {
      this.isEditMode.set(true);
      this.loadEmployee(this.employeeId);
    } else {
      this.createAccount.set(true);
      this.loadDepartmentFromQueryParams();
    }
  }

  loadDepartmentFromQueryParams() {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const deptId = params['departmentId'];
      if (deptId) {
        this.model = { ...this.model, department: deptId };
      }
    });
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
            },
            expressions: {
              'props.disabled': () => this.isEditMode(),
            },
          },
          {
            className: 'col-md-3',
            key: 'lastName',
            type: 'input',
            props: {
              label: this.translate.instant('FORM.LAST_NAME'),
              required: true,
            },
            expressions: {
              'props.disabled': () => this.isEditMode(),
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
            },
            expressions: {
              'props.disabled': () => this.isEditMode(),
            },
          },
          {
            className: 'col-md-3',
            key: 'dateOfBirth',
            type: 'custom-datepicker',
            props: {
              label: this.translate.instant('FORM.DOB'),
              required: true,
            },
            expressions: {
              'props.disabled': () => this.isEditMode(),
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
            },
            expressions: {
              'props.disabled': () => this.isEditMode(),
            },
            validators: {
              gmail: {
                expression: (c: AbstractControl) => validateGmail(c.value),
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
              onInit: setupNumericInputHook(this.destroy$),
            },
            validators: {
              phone: {
                expression: (c: AbstractControl) => validatePhone(c.value),
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
                expression: (c: AbstractControl) => validateAddress(c.value),
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
            },
            expressions: {
              'props.disabled': () => this.isEditMode(),
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
            },
            expressions: {
              'props.label': () => this.existingAccount()
                ? this.translate.instant('FORM.PASSWORD_EDIT')
                : this.translate.instant('FORM.PASSWORD'),
              'props.required': () => !this.existingAccount() && !this.isEditMode(),
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
        error: (err) => {
          this.errorMessage.set(
            err.error?.message || this.translate.instant('DEPARTMENT.LOAD_ERROR'),
          );
        },
      });
  }

  updateDepartmentFieldOptions() {
    const deptField = this.findFieldByKey(this.employeeFields, 'department');
    if (deptField && deptField.props) {
      deptField.props.options = this.departmentOptions;
    }
  }

  findFieldByKey(fields: FormlyFieldConfig[], key: string): FormlyFieldConfig | null {
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
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
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
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            address: data.address,
            position: data.position,
            department: departmentId,
            status: data.status || EmployeeStatus.ACTIVE,
          };

          this.updateDepartmentFieldOptions();

          this.currentAvatarUrl.set(data.avatarUrl || '');
          this.checkExistingAccount(id);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || this.translate.instant('EMPLOYEE.LOAD_ERROR'));
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
          this.updateDepartmentFieldOptions();
          this.accountModel = {
            username: user.username,
            roleName: user.role.name,
          };
        },
        error: (err) => {
          this.notificationService.error(
            err.error?.message || this.translate.instant('EMPLOYEE.CHECK_ACCOUNT_ERROR')
          );
        },
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
    this.errorMessage.set('');

    const rawValue = this.form.getRawValue() as Record<string, unknown>;
    const formValue: Partial<EmployeeModel> = {
      ...rawValue,
      dateOfBirth: rawValue['dateOfBirth'] instanceof Date
        ? (rawValue['dateOfBirth'] as Date).toISOString().substring(0, 10)
        : (rawValue['dateOfBirth'] as string | undefined),
    };

    const username = (this.accountForm.get('username')?.value ?? '') as string;

    const checkUsername$ = (this.createAccount() && !this.isEditMode())
      ? this.userService.checkUsername(username).pipe(
        switchMap(res => {
          if (res.exists) {
            throw { isValidationError: true, controlName: 'username', error: { duplicateUsername: true } };
          }
          return of(null);
        }),
        catchError(err => {
          if (err.isValidationError) throw err;
          throw { type: 'check_username', originalError: err };
        })
      )
      : of(null);

    checkUsername$.pipe(
      switchMap(() => {
        const saveRequest = this.isEditMode()
          ? this.employeeService.update(this.employeeId!, formValue)
          : this.employeeService.create(formValue as EmployeeModel);
        return saveRequest.pipe(
          catchError(err => {
            throw { type: 'save_employee', originalError: err };
          })
        );
      }),
      switchMap((savedEmployee) => {
        if (this.selectedFile && savedEmployee._id) {
          return this.employeeService.uploadAvatar(savedEmployee._id, this.selectedFile).pipe(
            map(() => savedEmployee),
            catchError(err => {
              throw { type: 'upload_avatar', originalError: err };
            })
          );
        }
        return of(savedEmployee);
      }),
      switchMap((savedEmployee) => {
        if (this.createAccount() && savedEmployee._id) {
          const { username: accUsername, password: accPassword, roleName: accRoleName } = this.accountForm.getRawValue() as Record<string, string>;
          const existing = this.existingAccount();
          if (existing) {
            const payload: { username: string; roleName: string; newPassword?: string } = {
              username: accUsername,
              roleName: accRoleName,
            };
            if (accPassword) {
              payload.newPassword = accPassword;
            }
            return this.userService.update(existing._id, payload).pipe(
              map(() => ({ action: 'update_account', isEdit: this.isEditMode() })),
              catchError(err => {
                throw { type: 'save_account', originalError: err };
              })
            );
          } else {
            return this.userService.create({ username: accUsername, password: accPassword, roleName: accRoleName, employeeId: savedEmployee._id }).pipe(
              map(() => ({ action: 'create_account', isEdit: this.isEditMode() })),
              catchError(err => {
                throw { type: 'save_account', originalError: err };
              })
            );
          }
        }
        return of({ action: 'none', isEdit: this.isEditMode() });
      }),
      takeUntil(this.destroy$),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (result) => {
        if (result.action === 'create_account') {
          this.notificationService.success(this.translate.instant('EMPLOYEE.CREATE_ACCOUNT_SUCCESS'));
        } else if (result.action === 'update_account') {
          this.notificationService.success(this.translate.instant('EMPLOYEE.UPDATE_ACCOUNT_SUCCESS'));
        } else {
          this.notificationService.success(
            result.isEdit
              ? this.translate.instant('EMPLOYEE.UPDATE_SUCCESS')
              : this.translate.instant('EMPLOYEE.CREATE_SUCCESS')
          );
        }
        this.navigateBack();
      },
      error: (err) => {
        if (err && err.isValidationError) {
          const control = this.accountForm.get(err.controlName);
          control?.setErrors(err.error);
          control?.markAsTouched();
          return;
        }

        const originalError = err?.originalError || err;
        const msg = originalError?.error?.message || '';

        if (err?.type === 'check_username') {
          this.errorMessage.set(msg || this.translate.instant('VALIDATION.USERNAME_CHECK_ERROR'));
        } else if (err?.type === 'upload_avatar') {
          this.errorMessage.set(this.translate.instant('EMPLOYEE.AVATAR_UPLOAD_ERROR', { error: msg }));
        } else if (err?.type === 'save_account') {
          const isEdit = this.isEditMode();
          this.notificationService.error(
            this.translate.instant(
              isEdit ? 'EMPLOYEE.UPDATE_ACCOUNT_ERROR' : 'EMPLOYEE.CREATE_ACCOUNT_ERROR',
              { error: msg }
            )
          );
          this.navigateBack();
        } else {
          this.errorMessage.set(msg || this.translate.instant('EMPLOYEE.SAVE_ERROR'));
        }
      }
    });
  }

  navigateBack() {
    const deptId = this.route.snapshot.queryParamMap.get('departmentId');
    if (deptId) {
      this.router.navigate(['/departments', deptId]);
    } else {
      this.router.navigate(['/employees']);
    }
  }

  onCancel() {
    this.form.reset();
    this.form.markAsUntouched();
    this.localAvatarUrl.set('');
    this.navigateBack();
  }
}
