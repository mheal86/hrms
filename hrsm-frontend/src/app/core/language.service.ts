import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FormlyConfig } from '@ngx-formly/core';

export type SupportedLang = 'vi' | 'en';

export const LANG_STORAGE_KEY = 'hrms_lang';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  currentLang = signal<SupportedLang>('vi');

  readonly languages = [
    { code: 'vi' as SupportedLang, label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en' as SupportedLang, label: 'English', flag: 'en' },
  ];

  constructor(
    private translate: TranslateService,
    private formlyConfig: FormlyConfig,
  ) {}

  /**
   * Gọi trong main.ts trước khi app khởi động để áp dụng ngôn ngữ đã lưu.
   */
  init(): void {
    // Configure Formly validation messages globally using TranslateService
    this.formlyConfig.addValidatorMessage('required', () =>
      this.translate.instant('VALIDATION.REQUIRED'),
    );
    this.formlyConfig.addValidatorMessage('email', () =>
      this.translate.instant('VALIDATION.EMAIL'),
    );
    this.formlyConfig.addValidatorMessage('futureDate', () =>
      this.translate.instant('VALIDATION.FUTURE_DATE'),
    );
    this.formlyConfig.addValidatorMessage('phone', () =>
      this.translate.instant('VALIDATION.PHONE_INVALID'),
    );
    this.formlyConfig.addValidatorMessage('gmail', () =>
      this.translate.instant('VALIDATION.GMAIL_INVALID'),
    );
    this.formlyConfig.addValidatorMessage('address', () =>
      this.translate.instant('VALIDATION.ADDRESS_INVALID'),
    );
    this.formlyConfig.addValidatorMessage('duplicateUsername', () =>
      this.translate.instant('VALIDATION.USERNAME_EXISTS'),
    );
    this.formlyConfig.addValidatorMessage('username', (err, field) => {
      const controlValue = field.formControl?.value;
      if (controlValue && /\s/.test(controlValue)) {
        return this.translate.instant('VALIDATION.USERNAME_SPACE');
      }
      return this.translate.instant('VALIDATION.USERNAME_CHARS');
    });
    this.formlyConfig.addValidatorMessage('ageRange', (err, field) => {
      if (!field.formControl?.value) return '';
      const birthDate = new Date(field.formControl.value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) return this.translate.instant('VALIDATION.AGE_MIN');
      return this.translate.instant('VALIDATION.AGE_MAX');
    });
    this.formlyConfig.addValidatorMessage('specialChars', () =>
      this.translate.instant('VALIDATION.DEPT_NAME_SPECIAL'),
    );

    const saved = localStorage.getItem(LANG_STORAGE_KEY) as SupportedLang | null;
    const lang: SupportedLang = saved === 'en' ? 'en' : 'vi';
    this.currentLang.set(lang);
    this.translate.use(lang);
  }

  /**
   * Chuyển đổi ngôn ngữ và lưu vào localStorage.
   */
  switchLang(lang: SupportedLang): void {
    this.currentLang.set(lang);
    this.translate.use(lang);
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  }
}
