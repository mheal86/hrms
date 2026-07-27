import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Confirm } from '../../core/confirm';

@Component({
  selector: 'app-confirm-modal',
  imports: [CommonModule],
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.css',
})
export class ConfirmModal {
  constructor(public confirmService: Confirm) {}
}