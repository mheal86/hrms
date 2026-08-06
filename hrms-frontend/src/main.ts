import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { LanguageService } from './app/core/services/language.service';

bootstrapApplication(App, appConfig)
  .then((appRef) => {
    // Khởi tạo ngôn ngữ ngay sau khi app bootstrap
    const langService = appRef.injector.get(LanguageService);
    langService.init();
  })
  .catch((err) => console.error(err));
