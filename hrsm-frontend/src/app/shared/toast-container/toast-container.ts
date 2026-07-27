import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification } from '../../core/notification';

@Component({
  selector: 'app-toast-container',
  imports: [CommonModule],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
})
export class ToastContainer {
  constructor(public notificationService: Notification) {}
}