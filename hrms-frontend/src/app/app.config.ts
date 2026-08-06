import { ApplicationConfig } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import { LOCALE_ID } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { MessageService, ConfirmationService } from 'primeng/api';
import { provideFormlyCore } from '@ngx-formly/core';
import { withFormlyBootstrap } from '@ngx-formly/bootstrap';
import { FormlyFieldCustomSelect } from './shared/custom-select-type/custom-select-type';
import { FormlyFieldDatePicker } from './shared/custom-datepicker-type/custom-datepicker-type';
import { routes } from './app.routes';
import { authInterceptorInterceptor } from './core/interceptors/auth-interceptor-interceptor';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { TitleStrategy } from '@angular/router';
import { CustomTitleStrategy } from './core/services/custom-title-strategy';

registerLocaleData(localeVi);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
    { provide: TitleStrategy, useClass: CustomTitleStrategy },
    provideHttpClient(withInterceptors([authInterceptorInterceptor])),
    { provide: LOCALE_ID, useValue: 'vi' },
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark-theme',
        },
      },
    }),
    MessageService,
    ConfirmationService,
    provideTranslateService({
      fallbackLang: 'vi',
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json',
      }),
    }),
    provideFormlyCore({
      types: [
        { name: 'custom-select', component: FormlyFieldCustomSelect, wrappers: ['form-field'] },
        { name: 'custom-datepicker', component: FormlyFieldDatePicker, wrappers: ['form-field'] },
      ],
    }),
    provideFormlyCore(withFormlyBootstrap()),
  ],
};
