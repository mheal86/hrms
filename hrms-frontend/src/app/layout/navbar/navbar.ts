import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../core/services/auth';
import { SidebarState } from '../../core/services/sidebar-state';
import { LanguageService, SupportedLang } from '../../core/services/language.service';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, Button, Select, FormsModule, TranslatePipe, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit {
  authService = inject(Auth);
  sidebarState = inject(SidebarState);
  languageService = inject(LanguageService);

  isDarkMode = false;

  ngOnInit() {
    const theme = localStorage.getItem('theme') || 'light';
    this.isDarkMode = theme === 'dark';
    this.applyTheme();
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
    window.dispatchEvent(new Event('themeChanged'));
  }

  applyTheme() {
    const root = document.documentElement;
    if (this.isDarkMode) {
      root.classList.add('dark-theme');
      document.body.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
      document.body.classList.remove('dark-theme');
    }
  }

  onLangChange(lang: SupportedLang) {
    this.languageService.switchLang(lang);
  }

  onLogout() {
    this.authService.logout();
  }
}
