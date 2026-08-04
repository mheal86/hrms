import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Department } from '../department';
import { Department as DepartmentModel } from '../department-model';
import { Spinner } from '../../../shared/spinner/spinner';
import { Subject, takeUntil } from 'rxjs';
import { FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';
import { Button } from 'primeng/button';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

function departmentNameValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { required: true };
  }
  // Cho phÃ©p chá»¯ tiáº¿ng Viá»‡t, sá»‘, dáº¥u cÃ¡ch, dáº¥u ngoáº·c (), dáº¥u cháº¥m ., dáº¥u gáº¡ch ngang -
  const regex = /^[\p{L}0-9\s().-]+$/u;
  if (!regex.test(value)) {
    return { specialChars: true };
  }
  return null;
}

@Component({
  selector: 'app-department-form',
  imports: [CommonModule, ReactiveFormsModule, Spinner, FormlyModule, Button, TranslatePipe],
  templateUrl: './department-form.html',
  styleUrl: './department-form.scss',
})
export class DepartmentForm implements OnInit, OnDestroy {
  form: FormGroup;
  model: Partial<DepartmentModel> = {};
  fields: FormlyFieldConfig[] = [];

  isEditMode = signal(false);
  departmentId: string | null = null;
  errorMessage = signal('');
  isLoading = signal(false);
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private departmentService: Department,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private translate: TranslateService,
  ) {
    this.form = this.fb.group({});
  }

  ngOnInit() {
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.initFields();
    });

    this.initFields();
    this.departmentId = this.route.snapshot.paramMap.get('id');

    if (this.departmentId) {
      this.isEditMode.set(true);
      this.loadDepartment(this.departmentId);
    }
  }

  initFields() {
    this.fields = [
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            key: 'name',
            type: 'input',
            className: 'col-md-12 mb-3',
            props: {
              label: this.translate.instant('FORM.DEPT_NAME'),
              placeholder: this.translate.instant('FORM.DEPT_NAME_PLACEHOLDER'),
              required: true,
            },
            validators: {
              specialChars: {
                expression: (c: AbstractControl) => departmentNameValidator(c) === null,
              },
            },
          },
          {
            key: 'description',
            type: 'textarea',
            className: 'col-md-12 mb-3',
            props: {
              label: this.translate.instant('FORM.DEPT_DESC'),
              placeholder: this.translate.instant('FORM.DEPT_DESC_PLACEHOLDER'),
              rows: 3,
            },
          },
        ],
      },
    ];
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDepartment(id: string) {
    this.isLoading.set(true);
    this.departmentService
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.model = {
            name: data.name,
            description: data.description,
          };
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(
            err.error?.message || this.translate.instant('DEPARTMENT.LOAD_ERROR'),
          );
          this.isLoading.set(false);
        },
      });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formValue = this.model;

    const request = this.isEditMode()
      ? this.departmentService.update(this.departmentId!, formValue)
      : this.departmentService.create(formValue);

    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/departments']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || this.translate.instant('EMPLOYEE.SAVE_ERROR'));
      },
    });
  }

  onCancel() {
    this.form.reset();
    this.form.markAsUntouched();
    this.location.back();
  }
}
