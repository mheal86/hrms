import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FormlyConfig } from '@ngx-formly/core';

export type SupportedLang = 'vi' | 'en';

export const LANG_STORAGE_KEY = 'hrms_lang';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  currentLang = signal<SupportedLang>('en');

  readonly languages = [
    { code: 'en' as SupportedLang, label: 'English', flag: 'en' },
    { code: 'vi' as SupportedLang, label: 'Tiếng Việt', flag: '🇻🇳' },
  ];

  constructor(
    public translate: TranslateService,
    public formlyConfig: FormlyConfig,
  ) {}

  /**
   * Gọi trong main.ts trước khi app khởi động để áp dụng ngôn ngữ đã lưu.
   */
  init() {
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
    this.formlyConfig.addValidatorMessage('username', (_err, field) => {
      const controlValue = field.formControl?.value;
      if (controlValue && /\s/.test(controlValue)) {
        return this.translate.instant('VALIDATION.USERNAME_SPACE');
      }
      return this.translate.instant('VALIDATION.USERNAME_CHARS');
    });
    this.formlyConfig.addValidatorMessage('ageRange', (_err, field) => {
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
    const lang: SupportedLang = saved === 'vi' ? 'vi' : 'en';
    this.currentLang.set(lang);
    return this.translate.use(lang);
  }

  /**
   * Chuyển đổi ngôn ngữ và lưu vào localStorage.
   */
  switchLang(lang: SupportedLang) {
    this.currentLang.set(lang);
    this.translate.use(lang);
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  }

  getDepartmentName(dept?: string | { _id: string; name: string }): string {
    const fallback = this.translate.instant('COMMON.UNASSIGNED');
    if (!dept) return fallback;
    const name = typeof dept === 'object' ? dept.name || fallback : dept;
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
    const translationKey = mapping[name];
    if (translationKey) {
      const translated = this.translate.instant(translationKey);
      return translated !== translationKey ? translated : name;
    }
    return name;
  }

  getDepartmentDesc(name?: string, description?: string): string {
    if (!name) return description || '';
    const mapping: { [key: string]: string } = {
      'Phòng Nhân sự': 'DEPARTMENTS_DESC.HR',
      'Phòng Công nghệ thông tin': 'DEPARTMENTS_DESC.TECH',
      'Phòng Kế toán': 'DEPARTMENTS_DESC.FINANCE',
      'Phòng Marketing': 'DEPARTMENTS_DESC.MARKETING',
      'Phòng Kinh doanh': 'DEPARTMENTS_DESC.SALES',
      'Phòng Hành chính': 'DEPARTMENTS_DESC.ADMIN',
      'Phòng Nghiên cứu & Phát triển': 'DEPARTMENTS_DESC.RD',
      'Phòng R&D': 'DEPARTMENTS_DESC.RD',
      'Phòng Quản lý dự án': 'DEPARTMENTS_DESC.PROJECT',
      'Phòng Chăm sóc khách hàng': 'DEPARTMENTS_DESC.CUSTOMER_SERVICE',
      'Phòng Pháp chế': 'DEPARTMENTS_DESC.LEGAL',
      'Phòng Thiết kế': 'DEPARTMENTS_DESC.DESIGN',
      'Phòng Đào tạo': 'DEPARTMENTS_DESC.TRAINING',
    };
    const translationKey = mapping[name];
    if (translationKey) {
      const translated = this.translate.instant(translationKey);
      return translated !== translationKey ? translated : description || '';
    }
    return description || '';
  }

  getPositionTranslation(position?: string): string {
    if (!position) return '';
    const mapping: { [key: string]: string } = {
      'Nhân viên': 'FORM.POSITION_STAFF',
      'Trưởng nhóm': 'FORM.POSITION_TEAM_LEADER',
      'Trưởng phòng': 'FORM.POSITION_DEPT_HEAD',
      'Phó phòng': 'FORM.POSITION_DEPT_DEPUTY',
      'Phó giám đốc': 'FORM.POSITION_DEPUTY_GD',
      'Giám đốc': 'FORM.POSITION_GD',
      'Thực tập sinh': 'FORM.POSITION_INTERN',
    };
    return mapping[position] || position;
  }
}
