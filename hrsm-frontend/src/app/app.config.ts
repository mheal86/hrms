import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
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
import { FormlyFieldCustomSelect } from './shared/custom-select/custom-select-type';

import { routes } from './app.routes';
import { authInterceptorInterceptor } from './core/auth-interceptor-interceptor';

registerLocaleData(localeVi);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptorInterceptor])),
    { provide: LOCALE_ID, useValue: 'vi' },
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark-theme',
        }
      }
    }),
    MessageService,
    ConfirmationService,
    provideFormlyCore({
      validationMessages: [
        { name: 'required', message: 'Trường này là bắt buộc' },
        { name: 'email', message: 'Email không hợp lệ' },
      ],
      types: [
        { name: 'custom-select', component: FormlyFieldCustomSelect, wrappers: ['form-field'] },
      ],
    }),
    provideFormlyCore(withFormlyBootstrap())
  ],
};