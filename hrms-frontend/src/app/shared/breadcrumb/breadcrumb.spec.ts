import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Breadcrumb } from './breadcrumb';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';

@Component({
  template: ''
})
class DummyComponent { }

describe('Breadcrumb', () => {
  let component: Breadcrumb;
  let fixture: ComponentFixture<Breadcrumb>;
  let router: Router;
  let translate: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Breadcrumb],
      providers: [
        provideRouter([
          { path: 'profile', component: DummyComponent }
        ]),
        provideTranslateService(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Breadcrumb);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    translate = TestBed.inject(TranslateService);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should hide p-breadcrumb when items array is empty', () => {
    const pBreadcrumb = fixture.debugElement.query(By.css('p-breadcrumb'));
    expect(pBreadcrumb).toBeNull(); // Empty by default
  });

  it('should render p-breadcrumb when items array is populated', () => {
    component.buildBreadcrumb('/dashboard/departments');
    fixture.detectChanges();

    const pBreadcrumb = fixture.debugElement.query(By.css('p-breadcrumb'));
    expect(pBreadcrumb).not.toBeNull();
  });

  it('should build breadcrumbs correctly from URL segments', () => {
    spyOn(translate, 'instant').and.callFake((key: string | string[]) => {
      const k = typeof key === 'string' ? key : key[0];
      if (k === 'SIDEBAR.DASHBOARD') return 'Trang chủ';
      if (k === 'SIDEBAR.DEPARTMENTS') return 'Phòng ban';
      if (k === 'COMMON.ADD') return 'Thêm mới';
      return k;
    });

    component.buildBreadcrumb('/dashboard/departments/new');
    fixture.detectChanges();
    const items = component.items();

    expect(items.length).toBe(3);
    expect(items[0].label).toBe('Trang chủ');
    expect(items[0].routerLink).toBe('/dashboard');
    expect(items[1].label).toBe('Phòng ban');
    expect(items[1].routerLink).toBe('/dashboard/departments');
    expect(items[2].label).toBe('Thêm mới');
    expect(items[2].routerLink).toBe('/dashboard/departments/new');
  });

  it('should ignore segments that look like Mongo DB IDs', () => {
    component.buildBreadcrumb('/employees/60d5ec4b1234567890123456/edit');
    fixture.detectChanges();
    const items = component.items();

    expect(items.length).toBe(2);
    expect(items[0].label).toBe('SIDEBAR.EMPLOYEES');
    expect(items[0].routerLink).toBe('/employees');
    expect(items[1].label).toBe('COMMON.EDIT');
    expect(items[1].routerLink).toBe('/employees/edit');
  });

  it('should use raw segment if not present in LABEL_MAP', () => {
    component.buildBreadcrumb('/unknown-segment');
    fixture.detectChanges();
    const items = component.items();
    expect(items.length).toBe(1);
    expect(items[0].label).toBe('unknown-segment');
  });

  it('should update breadcrumbs when NavigationEnd event occurs', async () => {
    const buildSpy = spyOn(component, 'buildBreadcrumb').and.callThrough();
    component.listenToRouteChanges();

    await router.navigateByUrl('/profile');
    fixture.detectChanges();

    expect(buildSpy).toHaveBeenCalledWith('/profile');
  });

  it('should update breadcrumbs when language changes', () => {
    const buildSpy = spyOn(component, 'buildBreadcrumb').and.callThrough();
    component.listenToRouteChanges();

    translate.use('en');
    fixture.detectChanges();

    expect(buildSpy).toHaveBeenCalled();
  });
});
