import { Injectable } from '@angular/core';
import { ConfirmationService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class Confirm {
  constructor(private confirmationService: ConfirmationService) {}

  ask(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmationService.confirm({
        message,
        header: 'Xác nhận',
        icon: 'pi pi-exclamation-triangle',
        acceptIcon: 'none',
        rejectIcon: 'none',
        rejectButtonStyleClass: 'p-button-text',
        acceptLabel: 'Đồng ý',
        rejectLabel: 'Hủy',
        accept: () => resolve(true),
        reject: () => resolve(false)
      });
    });
  }
}