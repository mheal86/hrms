import { TestBed } from '@angular/core/testing';
import { LanguageService, LANG_STORAGE_KEY } from './language.service';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideFormlyCore, FormlyConfig, FormlyFieldConfig } from '@ngx-formly/core';
import { FormControl } from '@angular/forms';

describe('LanguageService', () => {
  let service: LanguageService;
  let translate: TranslateService;
  let formlyConfig: FormlyConfig;

  const MOCK_DEPT_HR = { _id: '1', name: 'Phòng Nhân sự' };
  const MOCK_DEPT_EMPTY = { _id: '1', name: '' };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        provideTranslateService(),
        provideFormlyCore(),
      ],
    });
    service = TestBed.inject(LanguageService);
    translate = TestBed.inject(TranslateService);
    formlyConfig = TestBed.inject(FormlyConfig);
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  describe('init', () => {
    it('should read stored language and call translate.use with it', () => {
      localStorage.setItem(LANG_STORAGE_KEY, 'en');
      const useSpy = spyOn(translate, 'use').and.callThrough();

      service.init();

      expect(service.currentLang()).toBe('en');
      expect(useSpy).toHaveBeenCalledWith('en');
    });

    it('should register formly validator messages with correct translation keys', () => {
      service.init();

      const cases: Array<[string, string]> = [
        ['required', 'VALIDATION.REQUIRED'],
        ['email', 'VALIDATION.EMAIL'],
        ['futureDate', 'VALIDATION.FUTURE_DATE'],
        ['phone', 'VALIDATION.PHONE_INVALID'],
        ['gmail', 'VALIDATION.GMAIL_INVALID'],
        ['address', 'VALIDATION.ADDRESS_INVALID'],
        ['duplicateUsername', 'VALIDATION.USERNAME_EXISTS'],
        ['specialChars', 'VALIDATION.DEPT_NAME_SPECIAL'],
      ];

      for (const [key, expectedTranslationKey] of cases) {
        const msgFn = formlyConfig.getValidatorMessage(key);
        expect(msgFn).toBeDefined();
        if (typeof msgFn === 'function') {
          const result = msgFn(undefined as unknown as FormControl, {} as Partial<FormlyFieldConfig> & FormlyFieldConfig);
          expect(result).toBe(expectedTranslationKey);
        } else {
          expect(msgFn).toBe(expectedTranslationKey);
        }
      }
    });

    it('should return VALIDATION.AGE_MIN for date under 18 years', () => {
      service.init();
      const ageRangeMsgFn = formlyConfig.getValidatorMessage('ageRange');
      expect(ageRangeMsgFn).toBeDefined();

      if (typeof ageRangeMsgFn === 'function') {
        const today = new Date();
        const under18Date = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
        const mockField: FormlyFieldConfig = {
          formControl: new FormControl(under18Date)
        };
        const result = ageRangeMsgFn(undefined as unknown as FormControl, mockField);
        expect(result).toBe('VALIDATION.AGE_MIN');
      }
    });

    it('should return VALIDATION.AGE_MAX for date over 60 years', () => {
      service.init();
      const ageRangeMsgFn = formlyConfig.getValidatorMessage('ageRange');
      expect(ageRangeMsgFn).toBeDefined();

      if (typeof ageRangeMsgFn === 'function') {
        const today = new Date();
        const over60Date = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
        const mockField: FormlyFieldConfig = {
          formControl: new FormControl(over60Date)
        };
        const result = ageRangeMsgFn(undefined as unknown as FormControl, mockField);
        expect(result).toBe('VALIDATION.AGE_MAX');
      }
    });

    it('should return empty string for ageRange when formControl has no value', () => {
      service.init();
      const ageRangeMsgFn = formlyConfig.getValidatorMessage('ageRange');
      expect(ageRangeMsgFn).toBeDefined();

      if (typeof ageRangeMsgFn === 'function') {
        const mockField: FormlyFieldConfig = {
          formControl: new FormControl(null)
        };
        const result = ageRangeMsgFn(undefined as unknown as FormControl, mockField);
        expect(result).toBe('');
      }
    });

    it('should return VALIDATION.AGE_MIN for birthday that has not passed yet this year (monthDiff === 0 branch)', () => {
      service.init();
      const ageRangeMsgFn = formlyConfig.getValidatorMessage('ageRange');
      expect(ageRangeMsgFn).toBeDefined();

      if (typeof ageRangeMsgFn === 'function') {
        const today = new Date();
        const sameMonthNextDay = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate() + 1);
        const mockField: FormlyFieldConfig = {
          formControl: new FormControl(sameMonthNextDay)
        };
        const result = ageRangeMsgFn(undefined as unknown as FormControl, mockField);
        expect(result).toBe('VALIDATION.AGE_MIN');
      }
    });

    it('should return VALIDATION.USERNAME_SPACE when username contains a space', () => {
      service.init();
      const usernameMsgFn = formlyConfig.getValidatorMessage('username');
      expect(usernameMsgFn).toBeDefined();

      if (typeof usernameMsgFn === 'function') {
        const mockField: FormlyFieldConfig = {
          formControl: new FormControl('user name')
        };
        const result = usernameMsgFn(undefined as unknown as FormControl, mockField);
        expect(result).toBe('VALIDATION.USERNAME_SPACE');
      }
    });

    it('should return VALIDATION.USERNAME_CHARS when username has no space', () => {
      service.init();
      const usernameMsgFn = formlyConfig.getValidatorMessage('username');
      expect(usernameMsgFn).toBeDefined();

      if (typeof usernameMsgFn === 'function') {
        const mockField: FormlyFieldConfig = {
          formControl: new FormControl('username')
        };
        const result = usernameMsgFn(undefined as unknown as FormControl, mockField);
        expect(result).toBe('VALIDATION.USERNAME_CHARS');
      }
    });
  });

  describe('switchLang', () => {
    it('should update currentLang signal, call translate.use, and persist to localStorage', () => {
      const useSpy = spyOn(translate, 'use').and.callThrough();

      service.switchLang('en');

      expect(service.currentLang()).toBe('en');
      expect(useSpy).toHaveBeenCalledWith('en');
      expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('en');
    });
  });

  describe('getDepartmentName', () => {
    it('should return COMMON.UNASSIGNED when no argument is provided', () => {
      expect(service.getDepartmentName()).toBe('COMMON.UNASSIGNED');
    });

    it('should return COMMON.UNASSIGNED when dept object has an empty name', () => {
      expect(service.getDepartmentName(MOCK_DEPT_EMPTY)).toBe('COMMON.UNASSIGNED');
    });

    it('should translate known department name string via mapping', () => {
      spyOn(translate, 'instant').and.callFake((key) => {
        if (key === 'DEPARTMENTS_LIST.HR') return 'Human Resources';
        return key;
      });

      expect(service.getDepartmentName('Phòng Nhân sự')).toBe('Human Resources');
    });

    it('should translate known department name from an object via mapping', () => {
      spyOn(translate, 'instant').and.callFake((key) => {
        if (key === 'DEPARTMENTS_LIST.HR') return 'Human Resources';
        return key;
      });

      expect(service.getDepartmentName(MOCK_DEPT_HR)).toBe('Human Resources');
    });

    it('should return the original name when no translation mapping exists', () => {
      expect(service.getDepartmentName('Phòng Lạ')).toBe('Phòng Lạ');
    });

    it('should return the original name when translation key equals its own translation', () => {
      spyOn(translate, 'instant').and.callFake((key: string) => key);

      expect(service.getDepartmentName('Phòng Nhân sự')).toBe('Phòng Nhân sự');
    });
  });

  describe('getDepartmentDesc', () => {
    it('should return empty string when no arguments are provided', () => {
      expect(service.getDepartmentDesc()).toBe('');
    });

    it('should return the fallback description when no department name is given', () => {
      expect(service.getDepartmentDesc(undefined, 'Fallback Desc')).toBe('Fallback Desc');
    });

    it('should translate known department description via mapping', () => {
      spyOn(translate, 'instant').and.callFake((key) => {
        if (key === 'DEPARTMENTS_DESC.HR') return 'HR Dept Description';
        return key;
      });

      expect(service.getDepartmentDesc('Phòng Nhân sự', 'original desc')).toBe('HR Dept Description');
    });

    it('should return original description when no mapping exists for the department', () => {
      expect(service.getDepartmentDesc('Phòng Lạ', 'original desc')).toBe('original desc');
    });

    it('should return original description when translation key equals its own translation', () => {
      spyOn(translate, 'instant').and.callFake((key: string) => key);

      expect(service.getDepartmentDesc('Phòng Nhân sự', 'orig desc')).toBe('orig desc');
    });

    it('should return empty string when no mapping and no description are provided', () => {
      expect(service.getDepartmentDesc('Phòng Lạ')).toBe('');
    });

    it('should return empty string when translation key equals its own translation and no description is given', () => {
      spyOn(translate, 'instant').and.callFake((key: string) => key);

      expect(service.getDepartmentDesc('Phòng Nhân sự')).toBe('');
    });
  });

  describe('getPositionTranslation', () => {
    it('should translate known Vietnamese position to translation key', () => {
      expect(service.getPositionTranslation('Nhân viên')).toBe('FORM.POSITION_STAFF');
      expect(service.getPositionTranslation('Giám đốc')).toBe('FORM.POSITION_GD');
    });

    it('should return the original value for unknown positions', () => {
      expect(service.getPositionTranslation('Unknown')).toBe('Unknown');
    });

    it('should return empty string when no position is provided', () => {
      expect(service.getPositionTranslation()).toBe('');
    });
  });
});
