import { Injectable } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class Confirm {
  constructor(
    public confirmationService: ConfirmationService,
    public translate: TranslateService,
  ) { }

  ask(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmationService.confirm({
        message,
        header: this.translate.instant('COMMON.CONFIRM_HEADER'),
        icon: 'pi pi-exclamation-triangle',
        acceptIcon: 'none',
        rejectIcon: 'none',
        acceptButtonStyleClass: 'p-button-danger px-5',
        rejectButtonStyleClass: 'p-button-secondary p-button-outlined px-4',
        acceptLabel: this.translate.instant('COMMON.CONFIRM_ACCEPT'),
        rejectLabel: this.translate.instant('COMMON.CONFIRM_REJECT'),
        accept: () => resolve(true),
        reject: () => resolve(false),
      });
    });
  }
}
