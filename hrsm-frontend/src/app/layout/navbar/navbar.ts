import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../core/auth';
import { SidebarState } from '../../core/sidebar-state';
import { LanguageService, SupportedLang } from '../../core/language.service';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, Button, Select, FormsModule, TranslatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit {
  isDarkMode = false;

  constructor(
    public authService: Auth,
    public sidebarState: SidebarState,
    public languageService: LanguageService,
  ) {}

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

  private applyTheme() {
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
