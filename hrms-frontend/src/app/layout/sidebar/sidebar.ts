import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '../../core/services/auth';
import { SidebarState } from '../../core/services/sidebar-state';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule, TranslatePipe],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  authService = inject(Auth);
  sidebarState = inject(SidebarState);

  menuItems = [
    { link: '/dashboard', icon: 'pi pi-home', label: 'SIDEBAR.DASHBOARD', adminOnly: false },
    { link: '/departments', icon: 'pi pi-building', label: 'SIDEBAR.DEPARTMENTS', adminOnly: true },
    { link: '/employees', icon: 'pi pi-users', label: 'SIDEBAR.EMPLOYEES', adminOnly: true },
    { link: '/profile', icon: 'pi pi-user', label: 'SIDEBAR.PROFILE', adminOnly: false },
  ];
}
