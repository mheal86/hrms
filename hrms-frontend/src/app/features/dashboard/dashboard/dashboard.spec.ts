import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { Dashboard as DashboardService } from '../../../core/services/dashboard.service';
import { Employee as EmployeeService } from '../../../core/services/employee.service';
import { Auth } from '../../../core/services/auth';
import { LanguageService } from '../../../core/services/language.service';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { DashboardSummary } from '../../../core/models/dashboard-model';
import { Employee as EmployeeModel } from '../../../core/models/employee-model';
import { Chart, TooltipItem, TooltipModel } from 'chart.js';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let translate: TranslateService;

  const MOCK_AUTH_USER = { id: '1', username: 'admin', role: 'ADMIN' };

  const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
    totalEmployees: 100,
    activeEmployees: 80,
    totalDepartments: 5,
    totalUsers: 40,
    employeesByDepartment: [
      { departmentName: 'IT', totalCount: 50, lastMonthCount: 0, thisMonthCount: 0 },
      { departmentName: 'HR', totalCount: 30, lastMonthCount: 0, thisMonthCount: 0 }
    ]
  };

  const MOCK_RECENT_EMPLOYEES: EmployeeModel[] = [
    { _id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', department: 'd1' } as Partial<EmployeeModel> & EmployeeModel
  ];

  let mockDashboardService: jasmine.SpyObj<DashboardService>;
  let mockEmployeeService: jasmine.SpyObj<EmployeeService>;
  let mockAuth: jasmine.SpyObj<Auth>;
  let mockLanguageService: jasmine.SpyObj<LanguageService>;

  beforeEach(async () => {
    mockDashboardService = jasmine.createSpyObj<DashboardService>('DashboardService', ['getSummary']);
    mockDashboardService.getSummary.and.returnValue(of(MOCK_DASHBOARD_SUMMARY));

    mockEmployeeService = jasmine.createSpyObj<EmployeeService>('EmployeeService', ['getAll']);
    mockEmployeeService.getAll.and.returnValue(of({
      data: MOCK_RECENT_EMPLOYEES,
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
    }));

    mockAuth = jasmine.createSpyObj<Auth>('Auth', ['getUser', 'isAdmin', 'isLoggedIn', 'logout']);
    mockAuth.getUser.and.returnValue(MOCK_AUTH_USER);
    mockAuth.isAdmin.and.returnValue(true);
    mockAuth.isLoggedIn.and.returnValue(true);

    mockLanguageService = jasmine.createSpyObj<LanguageService>('LanguageService', ['getDepartmentName']);
    mockLanguageService.getDepartmentName.and.callFake((name: string) => name);

    // Mock requestAnimationFrame to execute asynchronously to avoid Zone.js signal write errors during rendering
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
      setTimeout(() => cb(performance.now() + 800), 0);
      return 0;
    });

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: DashboardService, useValue: mockDashboardService },
        { provide: EmployeeService, useValue: mockEmployeeService },
        { provide: Auth, useValue: mockAuth },
        { provide: LanguageService, useValue: mockLanguageService },
        provideTranslateService(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    translate = TestBed.inject(TranslateService);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should load summary, animate count ups and update chart', fakeAsync(() => {
    component.loadSummary();
    tick(800);
    fixture.detectChanges();

    expect(component.displayTotalEmployees()).toBe(100);
    expect(component.displayActiveEmployees()).toBe(80);
    expect(component.displayTotalDepartments()).toBe(5);
    expect(component.displayTotalUsers()).toBe(40);

    const chartData = component.chartData();
    expect(chartData).toBeDefined();
    expect(chartData?.labels).toEqual(['IT', 'HR']);
    expect(chartData?.datasets[0].data).toEqual([50, 30]);
  }));

  it('should handle loadSummary error', () => {
    mockDashboardService.getSummary.and.returnValue(throwError(() => ({
      error: { message: 'Failed to load' }
    })));
    component.loadSummary();
    expect(component.errorMessage()).toBe('Failed to load');
  });

  it('should update chart when theme changes via HostListener', () => {
    component.summary.set(MOCK_DASHBOARD_SUMMARY);
    const updateSpy = spyOn(component, 'updateChart').and.callThrough();
    component.onThemeChanged();
    expect(updateSpy).toHaveBeenCalledWith(MOCK_DASHBOARD_SUMMARY);
  });

  it('should update chart when language changes', () => {
    component.summary.set(MOCK_DASHBOARD_SUMMARY);
    const updateSpy = spyOn(component, 'updateChart').and.callThrough();
    translate.use('en');
    expect(updateSpy).toHaveBeenCalled();
  });

  it('should execute centerText chart plugin beforeDraw', () => {
    component.loadSummary();
    const plugin = component.chartPlugins[0];
    const mockCtx = {
      save: jasmine.createSpy(),
      restore: jasmine.createSpy(),
      fillText: jasmine.createSpy(),
      font: '',
      fillStyle: '',
      textAlign: '',
      textBaseline: '',
    };
    const mockChart = {
      chartArea: { left: 10, right: 110, top: 10, bottom: 110 },
      ctx: mockCtx,
    } as unknown as Chart;
    expect(plugin).toBeDefined();
    plugin.beforeDraw?.(mockChart, {} as unknown as { cancelable: true }, {});
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('should handle loadRecentEmployees error', () => {
    mockEmployeeService.getAll.and.returnValue(throwError(() => ({
      error: { message: 'Load recent failed' }
    })));
    component.loadRecentEmployees();
    expect(component.errorMessage()).toBe('Load recent failed');
  });

  it('should invoke chartOptions tooltip label callback', () => {
    component.loadSummary();
    const chartOptions = component.chartOptions();
    if (chartOptions) {
      const labelFn = chartOptions.plugins?.tooltip?.callbacks?.label;
      expect(labelFn).toBeDefined();
      if (labelFn) {
        const result = labelFn.call(
          undefined as unknown as TooltipModel<'doughnut'>,
          { label: 'IT', raw: 5 } as unknown as TooltipItem<'doughnut'>
        );
        expect(result).toContain('IT');
        expect(result).toContain('5');
      }
    }
  });

  it('should handle animateCountUp running multiple frames', async () => {
    const target = signal(0);
    // Test that animateCountUp eventually sets the signal to the target value
    component.animateCountUp(target, 10);
    // After a tick, requestAnimationFrame is called
    await new Promise(resolve => setTimeout(resolve, 200));
    expect(target()).toBeGreaterThan(0);
  });

  it('should handle loadSummary error without error message', () => {
    mockDashboardService.getSummary.and.returnValue(throwError(() => ({
      error: {}
    })));
    component.loadSummary();
    expect(component.errorMessage()).toBe('DEPARTMENT.LOAD_ERROR');
  });

  it('should handle loadRecentEmployees error without error message', () => {
    mockEmployeeService.getAll.and.returnValue(throwError(() => ({
      error: {}
    })));
    component.loadRecentEmployees();
    expect(component.errorMessage()).toBe('EMPLOYEE.LOAD_ERROR');
  });

  it('should update chart with dark theme and default colors', () => {
    spyOn(document.body.classList, 'contains').and.callFake((cls: string) => cls === 'dark-theme');
    const mockStyle = {
      getPropertyValue: () => ''
    } as unknown as CSSStyleDeclaration;
    spyOn(window, 'getComputedStyle').and.returnValue(mockStyle);

    component.updateChart(MOCK_DASHBOARD_SUMMARY);

    const chartData = component.chartData();
    expect((chartData?.datasets[0].backgroundColor as string[])[0]).toBe('#818cf8');
    expect(chartData?.datasets[0].borderColor).toBe('#1e293b');

    const plugin = component.chartPlugins[0];
    const mockCtx = {
      save: jasmine.createSpy('save'),
      restore: jasmine.createSpy('restore'),
      fillText: jasmine.createSpy('fillText'),
      font: '',
      fillStyle: '',
      textAlign: '',
      textBaseline: '',
    };
    const mockChart = {
      chartArea: { left: 10, right: 110, top: 10, bottom: 110 },
      ctx: mockCtx,
    } as unknown as Chart;
    plugin.beforeDraw?.(mockChart, {} as unknown as { cancelable: true }, {});
    expect(mockCtx.fillStyle).toBe('#ffffff');
  });

  it('should use default value in chart tooltip callback if raw is falsy', () => {
    component.loadSummary();
    const chartOptions = component.chartOptions();
    const labelFn = chartOptions?.plugins?.tooltip?.callbacks?.label;
    expect(labelFn).toBeDefined();
    if (labelFn) {
      const result = labelFn.call(
        undefined as unknown as TooltipModel<'doughnut'>,
        { label: 'IT', raw: undefined } as unknown as TooltipItem<'doughnut'>
      );
      expect(result).toContain('0');
    }
  });

  it('should return early from centerText plugin if chartArea is not defined', () => {
    component.loadSummary();
    const plugin = component.chartPlugins[0];
    const mockCtx = {
      save: jasmine.createSpy('save'),
      restore: jasmine.createSpy('restore'),
    };
    const mockChart = {
      chartArea: undefined,
      ctx: mockCtx,
    } as unknown as Chart;
    plugin.beforeDraw?.(mockChart, {} as unknown as { cancelable: true }, {});
    expect(mockCtx.save).not.toHaveBeenCalled();
  });

  it('should handle animateCountUp and take progress < 1 branch', () => {
    const target = signal(0);
    const originalRaf = window.requestAnimationFrame;
    let stepFn: FrameRequestCallback | undefined = undefined;
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      stepFn = cb;
      return 1;
    }) as typeof window.requestAnimationFrame;

    const originalNow = performance.now;
    performance.now = () => 1000;

    component.animateCountUp(target, 10);

    const fnToCall = stepFn as FrameRequestCallback | undefined;
    if (fnToCall) {
      fnToCall(1400);
    }
    expect(target()).toBeGreaterThan(0);
    expect(target()).toBeLessThan(10);

    // cleanup
    window.requestAnimationFrame = originalRaf;
    performance.now = originalNow;
  });
});
