import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SidebarState {
  isOpen = signal(false);
  isDesktopCollapsed = signal(false);

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggleDesktop(): void {
    this.isDesktopCollapsed.update((v) => !v);
  }
}