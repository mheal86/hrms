import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class Notification {
  constructor(private messageService: MessageService) {}

  success(message: string) {
    this.messageService.add({ severity: 'success', summary: 'Thành công', detail: message });
  }

  error(message: string) {
    this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: message });
  }
}