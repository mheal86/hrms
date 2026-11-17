import { ApplicationConfig, inject, LOCALE_ID, provideAppInitializer } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeng/themes/aura';
import { MessageService, ConfirmationService } from 'primeng/api';
import { provideFormlyCore } from '@ngx-formly/core';
import { withFormlyBootstrap } from '@ngx-formly/bootstrap';
import { FormlyFieldCustomSelect } from './shared/custom-select-type/custom-select-type';
import { FormlyFieldDatePicker } from './shared/custom-datepicker-type/custom-datepicker-type';
import { routes } from './app.routes';
import { authInterceptorInterceptor } from './core/interceptors/auth-interceptor-interceptor';
import { demoBackendInterceptor } from './core/interceptors/demo-backend-interceptor';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { TitleStrategy } from '@angular/router';
import { CustomTitleStrategy } from './core/services/custom-title-strategy';
import { LanguageService } from './core/services/language.service';

registerLocaleData(localeVi);

const RegisterAuraPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{teal.50}',
      100: '{teal.100}',
      200: '{teal.200}',
      300: '{teal.300}',
      400: '{teal.400}',
      500: '{teal.500}',
      600: '{teal.600}',
      700: '{teal.700}',
      800: '{teal.800}',
      900: '{teal.900}',
      950: '{teal.950}',
    },
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{teal.500}',
      offset: '2px',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
    { provide: TitleStrategy, useClass: CustomTitleStrategy },
    provideHttpClient(withInterceptors([authInterceptorInterceptor, demoBackendInterceptor])),
    { provide: LOCALE_ID, useValue: 'vi' },
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: RegisterAuraPreset,
        options: {
          darkModeSelector: '.dark-theme',
        },
      },
    }),
    MessageService,
    ConfirmationService,
    provideTranslateService({
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({
        prefix: './i18n/',
        suffix: '.json',
      }),
    }),
    provideAppInitializer(() => {
      const langService = inject(LanguageService);
      return firstValueFrom(langService.init().pipe(catchError(() => of(null))));
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
