import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Navbar } from './navbar';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { Auth } from '../../core/services/auth';
import { LanguageService } from '../../core/services/language.service';
import { SidebarState } from '../../core/services/sidebar-state';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let mockAuth: jasmine.SpyObj<Auth>;
  let mockLanguageService: jasmine.SpyObj<LanguageService>;
  let sidebarState: SidebarState;

  const MOCK_AUTH_USER = { id: '1', username: 'admin', role: 'ADMIN' };
  const MOCK_LANGUAGES = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English', flag: 'en' }
  ];

  beforeEach(async () => {
    localStorage.clear();

    mockAuth = jasmine.createSpyObj<Auth>('Auth', ['getUser', 'logout']);
    mockAuth.getUser.and.returnValue(MOCK_AUTH_USER);

    mockLanguageService = jasmine.createSpyObj<LanguageService>('LanguageService', ['switchLang']);
    Object.defineProperty(mockLanguageService, 'currentLang', {
      value: signal('vi'),
      writable: true
    });
    Object.defineProperty(mockLanguageService, 'languages', {
      value: MOCK_LANGUAGES,
      writable: true
    });

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        provideHttpClient(),
        { provide: Auth, useValue: mockAuth },
        { provide: LanguageService, useValue: mockLanguageService },
        SidebarState,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    sidebarState = TestBed.inject(SidebarState);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark-theme');
    document.body.classList.remove('dark-theme');
    localStorage.clear();
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should render brand logo, user info and logout when user is logged in', () => {
    const brand = fixture.debugElement.query(By.css('.navbar-brand'));
    const userText = fixture.debugElement.query(By.css('.navbar-user-text'));
    const logoutBtn = fixture.debugElement.query(By.css('.logout-btn'));

    expect(brand).not.toBeNull();
    expect(userText.nativeElement.textContent).toContain('admin');
    expect(logoutBtn).not.toBeNull();
  });

  it('should not render user elements if no user is logged in', () => {
    mockAuth.getUser.and.returnValue(null);
    fixture.detectChanges();

    const userText = fixture.debugElement.query(By.css('.navbar-user-text'));
    const logoutBtn = fixture.debugElement.query(By.css('.logout-btn'));
    expect(userText).toBeNull();
    expect(logoutBtn).toBeNull();
  });

  it('should initialize with light theme by default', () => {
    expect(component.isDarkMode).toBe(false);
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
    expect(document.body.classList.contains('dark-theme')).toBe(false);
  });

  it('should initialize with dark theme if stored in localStorage', () => {
    localStorage.setItem('theme', 'dark');
    const newFixture = TestBed.createComponent(Navbar);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    expect(newComponent.isDarkMode).toBe(true);
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
    expect(document.body.classList.contains('dark-theme')).toBe(true);
  });

  it('should switch to dark theme when toggled from light', () => {
    const dispatchSpy = spyOn(window, 'dispatchEvent').and.callThrough();

    component.toggleTheme();

    expect(component.isDarkMode).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
    expect(dispatchSpy).toHaveBeenCalledWith(jasmine.any(Event));
  });

  it('should switch back to light theme when toggled from dark', () => {
    component.isDarkMode = true;
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark-theme');

    component.toggleTheme();

    expect(component.isDarkMode).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
  });

  it('should switch language', () => {
    component.onLangChange('en');
    fixture.detectChanges();
    expect(mockLanguageService.switchLang).toHaveBeenCalledWith('en');
  });

  it('should logout user', () => {
    component.onLogout();
    fixture.detectChanges();
    expect(mockAuth.logout).toHaveBeenCalled();
  });

  it('should trigger sidebarState toggle when mobile hamburger is clicked', () => {
    spyOn(sidebarState, 'toggle');
    const buttons = fixture.debugElement.queryAll(By.css('p-button'));
    const toggleBtn = buttons.find(b => b.nativeElement.classList.contains('d-md-none'));
    expect(toggleBtn).toBeDefined();

    toggleBtn?.triggerEventHandler('onClick', {});
    fixture.detectChanges();

    expect(sidebarState.toggle).toHaveBeenCalled();
  });

  it('should trigger sidebarState toggleDesktop when desktop chevron trigger is clicked', () => {
    spyOn(sidebarState, 'toggleDesktop');
    const triggerBtn = fixture.debugElement.query(By.css('.sidebar-trigger-btn'));
    expect(triggerBtn).not.toBeNull();

    triggerBtn.triggerEventHandler('onClick', {});
    fixture.detectChanges();

    expect(sidebarState.toggleDesktop).toHaveBeenCalled();
  });
});
