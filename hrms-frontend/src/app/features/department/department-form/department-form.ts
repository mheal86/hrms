import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Department } from '../../../core/services/department.service';
import { Department as DepartmentModel } from '../../../core/models/department-model';
import { Spinner } from '../../../shared/spinner/spinner';
import { Subject, takeUntil, finalize, merge, of } from 'rxjs';
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
  // Cho phép chữ tiếng Việt, số, dấu cách, dấu ngoặc (), dấu chấm ., dấu gạch ngang -
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
  fb = inject(FormBuilder);
  departmentService = inject(Department);
  route = inject(ActivatedRoute);
  router = inject(Router);
  location = inject(Location);
  translate = inject(TranslateService);

  form: FormGroup = this.fb.group({});
  model: Partial<DepartmentModel> = {};
  fields: FormlyFieldConfig[] = [];

  isEditMode = signal(false);
  departmentId?: string;
  errorMessage = signal('');
  isLoading = signal(false);
  destroy$ = new Subject<void>();

  ngOnInit() {
    merge(
      of(null),
      this.translate.onLangChange
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.initFields());

    this.departmentId = this.route.snapshot.paramMap.get('id') ?? undefined;

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
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (data) => {
          this.model = {
            name: data.name,
            description: data.description,
          };
        },
        error: (err) => {
          this.errorMessage.set(
            err.error?.message || this.translate.instant('DEPARTMENT.LOAD_ERROR'),
          );
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

    request
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/departments']);
        },
        error: (err) => {
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
