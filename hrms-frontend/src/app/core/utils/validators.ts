import { AbstractControl, ValidationErrors } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export function validatePhone(value?: string): boolean {
  if (!value) return true;
  return /^0\d{9}$/.test(value);
}

export function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  return validatePhone(value) ? null : { invalidPhone: true };
}

export function validateAddress(value?: string): boolean {
  if (!value) return true;
  const letterCount = (value.match(/[a-zA-ZÀ-ỹ]/g) || []).length;
  return letterCount >= 3;
}

export function addressValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  return validateAddress(value) ? null : { invalidAddress: true };
}

export function validateGmail(value?: string): boolean {
  if (!value) return true;
  const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(value)) return false;
  const parts = value.split('@');
  const localPart = parts[0];
  return localPart.length >= 3 && /[a-zA-Z]/.test(localPart);
}

export function cleanNumericInput(val: string, maxLen: number = 10): string {
  if (!val) return '';
  return val.replace(/[^0-9]/g, '').slice(0, maxLen);
}

export function setupNumericInputHook(destroy$: Subject<void>, maxLen: number = 10) {
  return (field: FormlyFieldConfig) => {
    field.formControl?.valueChanges.pipe(takeUntil(destroy$)).subscribe((val) => {
      if (val) {
        const cleaned = cleanNumericInput(val, maxLen);
        if (cleaned !== val) {
          field.formControl!.setValue(cleaned, { emitEvent: false });
        }
      }
    });
  };
}
