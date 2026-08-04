import { Injectable, Injector } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class CustomTitleStrategy extends TitleStrategy {
  private lastState?: RouterStateSnapshot;
  private translateService?: TranslateService;

  constructor(
    private readonly title: Title,
    private injector: Injector,
  ) {
    super();
  }

  private get translate(): TranslateService {
    if (!this.translateService) {
      this.translateService = this.injector.get(TranslateService);
      // Listen for language changes and update the title dynamically
      this.translateService.onLangChange.subscribe(() => {
        this.updateTitleForCurrentState();
      });
    }
    return this.translateService;
  }

  override updateTitle(routerState: RouterStateSnapshot): void {
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

  private updateTitleForCurrentState(): void {
    if (this.lastState) {
      this.updateTitle(this.lastState);
    }
  }
}
