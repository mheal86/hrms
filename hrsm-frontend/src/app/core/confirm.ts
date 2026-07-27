import { Injectable, signal } from '@angular/core';

export interface ConfirmState {
  isOpen: boolean;
  message: string;
  resolve: ((value: boolean) => void) | null;
}

@Injectable({
  providedIn: 'root',
})
export class Confirm {
  state = signal<ConfirmState>({
    isOpen: false,
    message: '',
    resolve: null,
  });

  ask(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.state.set({
        isOpen: true,
        message,
        resolve,
      });
    });
  }

  onConfirm(): void {
    const current = this.state();
    current.resolve?.(true);
    this.close();
  }

  onCancel(): void {
    const current = this.state();
    current.resolve?.(false);
    this.close();
  }

  private close(): void {
    this.state.set({ isOpen: false, message: '', resolve: null });
  }
}