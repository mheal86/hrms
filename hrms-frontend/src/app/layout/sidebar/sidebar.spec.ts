import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Sidebar } from './sidebar';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Auth } from '../../core/services/auth';
import { SidebarState } from '../../core/services/sidebar-state';
import { By } from '@angular/platform-browser';

describe('Sidebar', () => {
  let fixture: ComponentFixture<Sidebar>;
  let mockAuth: jasmine.SpyObj<Auth>;
  let sidebarState: SidebarState;

  beforeEach(async () => {
    mockAuth = jasmine.createSpyObj<Auth>('Auth', ['isAdmin']);

    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [
        provideRouter([
          { path: '**', redirectTo: '' }
        ]),
        provideTranslateService(),
        { provide: Auth, useValue: mockAuth },
        SidebarState, // Use real SidebarState service to avoid signal change detection mismatch
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    sidebarState = TestBed.inject(SidebarState);
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should render all menu items for Admin user', fakeAsync(() => {
    mockAuth.isAdmin.and.returnValue(true);
    sidebarState.isOpen.set(true);

    fixture.detectChanges();
    tick();

    const links = fixture.debugElement.queryAll(By.css('.nav-link'));
    expect(links.length).toBe(5);

    const labels = links.map(el => el.query(By.css('.nav-text')).nativeElement.textContent.trim());
    expect(labels).toContain('SIDEBAR.DASHBOARD');
    expect(labels).toContain('SIDEBAR.DEPARTMENTS');
    expect(labels).toContain('SIDEBAR.EMPLOYEES');
    expect(labels).toContain('SIDEBAR.AUDIT_LOGS');
    expect(labels).toContain('SIDEBAR.PROFILE');
  }));

  it('should hide only the admin-only menu items (audit logs) for regular user', fakeAsync(() => {
    mockAuth.isAdmin.and.returnValue(false);
    sidebarState.isOpen.set(true);

    fixture.detectChanges();
    tick();

    const links = fixture.debugElement.queryAll(By.css('.nav-link'));
    expect(links.length).toBe(4);

    const labels = links.map(el => el.query(By.css('.nav-text')).nativeElement.textContent.trim());
    expect(labels).toContain('SIDEBAR.DASHBOARD');
    expect(labels).toContain('SIDEBAR.DEPARTMENTS');
    expect(labels).toContain('SIDEBAR.EMPLOYEES');
    expect(labels).toContain('SIDEBAR.PROFILE');
    expect(labels).not.toContain('SIDEBAR.AUDIT_LOGS');
  }));

  it('should call sidebarState.close when backdrop is clicked', fakeAsync(() => {
    mockAuth.isAdmin.and.returnValue(true);
    sidebarState.isOpen.set(true);

    fixture.detectChanges();
    tick();

    spyOn(sidebarState, 'close').and.callThrough();
    const backdrop = fixture.debugElement.query(By.css('.sidebar-backdrop'));
    expect(backdrop).not.toBeNull();

    backdrop.nativeElement.click();
    fixture.detectChanges();
    tick();

    expect(sidebarState.close).toHaveBeenCalled();
  }));

  it('should call sidebarState.close when a nav link is clicked', fakeAsync(() => {
    mockAuth.isAdmin.and.returnValue(false);
    fixture.detectChanges();
    tick();

    spyOn(sidebarState, 'close').and.callThrough();
    const link = fixture.debugElement.query(By.css('.nav-link'));
    link.nativeElement.click();
    fixture.detectChanges();
    tick();

    expect(sidebarState.close).toHaveBeenCalled();
  }));

  it('should apply collapsed class to aside when desktop is collapsed', fakeAsync(() => {
    mockAuth.isAdmin.and.returnValue(true);
    sidebarState.isDesktopCollapsed.set(true);

    fixture.detectChanges();
    tick();

    const aside = fixture.debugElement.query(By.css('aside'));
    expect(aside.nativeElement.classList.contains('collapsed')).toBe(true);
  }));
});
