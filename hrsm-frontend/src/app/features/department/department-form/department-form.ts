import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Department } from '../department';
import { Spinner } from '../../../shared/spinner/spinner';

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
  imports: [CommonModule, ReactiveFormsModule, Spinner],
  templateUrl: './department-form.html',
  styleUrl: './department-form.css',
})
export class DepartmentForm implements OnInit {
  form: FormGroup;
  isEditMode = signal(false);
  departmentId: string | null = null;
  errorMessage = signal('');
  isLoading = signal(false);

  constructor(
    private fb: FormBuilder,
    private departmentService: Department,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, departmentNameValidator]],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.departmentId = this.route.snapshot.paramMap.get('id');

    if (this.departmentId) {
      this.isEditMode.set(true);
      this.loadDepartment(this.departmentId);
    }
  }

  loadDepartment(id: string): void {
    this.isLoading.set(true);
    this.departmentService.getById(id).subscribe({
      next: (data) => {
        this.form.patchValue({
          name: data.name,
          description: data.description,
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Không tải được dữ liệu');
        this.isLoading.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formValue = this.form.value;

    const request = this.isEditMode()
      ? this.departmentService.update(this.departmentId!, formValue)
      : this.departmentService.create(formValue);

    request.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/departments']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Lưu thất bại');
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/departments']);
  }
}