import { Injectable, Injector } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class CustomTitleStrategy extends TitleStrategy {
  lastState?: RouterStateSnapshot;
  translateService?: TranslateService;

  constructor(
    public readonly title: Title,
    public injector: Injector,
  ) {
    super();
  }

  get translate(): TranslateService {
    if (!this.translateService) {
      this.translateService = this.injector.get(TranslateService);
      // Listen for language changes and update the title dynamically
      this.translateService.onLangChange.subscribe(() => {
        this.updateTitleForCurrentState();
      });
    }
    return this.translateService;
  }

  override updateTitle(routerState: RouterStateSnapshot) {
    this.lastState = routerState;
    const titleKey = this.buildTitle(routerState);
    if (titleKey) {
      this.translate.get(titleKey).subscribe((translatedTitle) => {
        this.title.setTitle(`${translatedTitle} - HRMS`);
      });
    } else {
      this.title.setTitle('HRMS');
    }
  }

  updateTitleForCurrentState() {
    if (this.lastState) {
      this.updateTitle(this.lastState);
    }
  }
}
