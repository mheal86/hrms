import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SidebarState {
  isOpen = signal(false);
  isDesktopCollapsed = signal(false);

  toggle() {
    this.isOpen.update((v) => !v);
  }

  close() {
    this.isOpen.set(false);
  }

  toggleDesktop() {
    this.isDesktopCollapsed.update((v) => !v);
  }
}
