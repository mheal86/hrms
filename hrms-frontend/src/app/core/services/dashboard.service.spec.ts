import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Dashboard } from './dashboard.service';
import { DashboardSummary } from '../models/dashboard-model';

describe('Dashboard Service', () => {
  let service: Dashboard;
  let httpTestingController: HttpTestingController;

  const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
    totalEmployees: 100,
    totalDepartments: 5,
    totalUsers: 20,
    activeEmployees: 90,
    employeesByDepartment: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        Dashboard,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(Dashboard);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    TestBed.resetTestingModule();
  });

  it('should getSummary and return the mocked dashboard summary data', () => {
    service.getSummary().subscribe((data) => {
      expect(data).toEqual(MOCK_DASHBOARD_SUMMARY);
    });

    const req = httpTestingController.expectOne(req => req.url.endsWith('/dashboard/summary'));
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_DASHBOARD_SUMMARY);
  });

  it('should build getUrl without parameter', () => {
    expect(service.getUrl()).toContain('/dashboard');
  });

  it('should build getUrl with path parameter', () => {
    expect(service.getUrl('test')).toContain('/dashboard/test');
  });
});
