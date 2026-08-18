import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainLayout } from './main-layout';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { MessageService, ConfirmationService } from 'primeng/api';
import { By } from '@angular/platform-browser';
import { SidebarState } from '../../core/services/sidebar-state';

describe('MainLayout', () => {
  let fixture: ComponentFixture<MainLayout>;
  let sidebarState: SidebarState;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        provideHttpClient(),
        MessageService,
        ConfirmationService,
        SidebarState,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayout);
    sidebarState = TestBed.inject(SidebarState);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should render navbar, sidebar, breadcrumb and router-outlet in template', () => {
    const navbar = fixture.debugElement.query(By.css('app-navbar'));
    const sidebar = fixture.debugElement.query(By.css('app-sidebar'));
    const breadcrumb = fixture.debugElement.query(By.css('app-breadcrumb'));
    const routerOutlet = fixture.debugElement.query(By.css('router-outlet'));

    expect(navbar).not.toBeNull();
    expect(sidebar).not.toBeNull();
    expect(breadcrumb).not.toBeNull();
    expect(routerOutlet).not.toBeNull();
  });

  it('should apply sidebar-collapsed-layout class when isDesktopCollapsed signal is true', () => {
    const mainEl = fixture.debugElement.query(By.css('main'));
    expect(mainEl.nativeElement.classList.contains('sidebar-collapsed-layout')).toBe(false);

    sidebarState.isDesktopCollapsed.set(true);
    fixture.detectChanges();

    expect(mainEl.nativeElement.classList.contains('sidebar-collapsed-layout')).toBe(true);
  });
});
