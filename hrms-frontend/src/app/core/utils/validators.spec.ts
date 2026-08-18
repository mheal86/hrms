import { FormControl } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { Subject } from 'rxjs';
import {
  validatePhone,
  phoneValidator,
  validateAddress,
  addressValidator,
  validateGmail,
  cleanNumericInput,
  setupNumericInputHook
} from './validators';

describe('validators utility', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('validatePhone', () => {
    it('should return true for empty value', () => {
      expect(validatePhone()).toBe(true);
      expect(validatePhone('')).toBe(true);
    });

    describe('validate phone numbers starting with 0 and having 10 digits', () => {
      it('should validate valid phone number', () => {
        expect(validatePhone('0123456789')).toBe(true);
      });

      it('should invalidate phone number not starting with 0', () => {
        expect(validatePhone('1234567890')).toBe(false);
      });

      it('should invalidate phone number shorter than 10 digits', () => {
        expect(validatePhone('012345678')).toBe(false);
      });

      it('should invalidate phone number longer than 10 digits', () => {
        expect(validatePhone('01234567890')).toBe(false);
      });
    });
  });

  describe('phoneValidator', () => {
    describe('validate form control value', () => {
      it('should return null for valid phone', () => {
        const control1 = new FormControl('0123456789');
        expect(phoneValidator(control1)).toBeNull();
      });

      it('should return error for invalid phone', () => {
        const control2 = new FormControl('invalid');
        expect(phoneValidator(control2)).toEqual({ invalidPhone: true });
      });
    });
  });

  describe('validateAddress', () => {
    it('should return true for empty value', () => {
      expect(validateAddress()).toBe(true);
      expect(validateAddress('')).toBe(true);
    });

    describe('validate address having at least 3 Vietnamese/English letters', () => {
      it('should validate address with 3 english letters', () => {
        expect(validateAddress('abc')).toBe(true);
      });

      it('should validate address with Vietnamese letters', () => {
        expect(validateAddress('Hà Nội')).toBe(true);
      });

      it('should invalidate address with only numbers', () => {
        expect(validateAddress('12')).toBe(false);
      });

      it('should invalidate address with numbers and 1 letter', () => {
        expect(validateAddress('12 a')).toBe(false);
      });

      it('should invalidate address with numbers and 2 letters', () => {
        expect(validateAddress('12 ab')).toBe(false);
      });
    });
  });

  describe('addressValidator', () => {
    describe('validate form control value', () => {
      it('should return null for valid address', () => {
        const control1 = new FormControl('Hà Nội');
        expect(addressValidator(control1)).toBeNull();
      });

      it('should return error for invalid address', () => {
        const control2 = new FormControl('12');
        expect(addressValidator(control2)).toEqual({ invalidAddress: true });
      });
    });
  });

  describe('validateGmail', () => {
    it('should return true for empty value', () => {
      expect(validateGmail()).toBe(true);
      expect(validateGmail('')).toBe(true);
    });

    describe('validate gmail format and constraints', () => {
      it('should validate valid gmail', () => {
        expect(validateGmail('abc@gmail.com')).toBe(true);
      });

      it('should invalidate when localPart too short', () => {
        expect(validateGmail('ab@gmail.com')).toBe(false);
      });

      it('should invalidate when localPart has no letters', () => {
        expect(validateGmail('123@gmail.com')).toBe(false);
      });

      it('should invalidate when invalid domain', () => {
        expect(validateGmail('abc@com')).toBe(false);
      });
    });
  });

  describe('cleanNumericInput', () => {
    describe('clean and limit input', () => {
      it('should handle empty string', () => {
        expect(cleanNumericInput('')).toBe('');
      });

      it('should strip non-numeric characters', () => {
        expect(cleanNumericInput('abc123def456')).toBe('123456');
      });

      it('should truncate to maxLength', () => {
        expect(cleanNumericInput('123456789012345', 5)).toBe('12345');
      });
    });
  });

  describe('setupNumericInputHook', () => {
    it('should clean values emitted by formControl valueChanges', () => {
      const destroy$ = new Subject<void>();
      const formControl = new FormControl('');
      const field: FormlyFieldConfig = { formControl };

      setupNumericInputHook(destroy$, 5)(field);

      formControl.setValue('abc123xyz45');
      expect(formControl.value).toBe('12345');

      destroy$.next();
      destroy$.complete();
    });
  });
});
