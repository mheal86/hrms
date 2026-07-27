import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainer } from './shared/toast-container/toast-container';
import { ConfirmModal } from './shared/confirm-modal/confirm-modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer, ConfirmModal],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}