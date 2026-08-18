import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { AuditLog } from '../models/audit-log-model';
import { AuditLogService } from './audit-log.service';
import { environment } from '../../../environments/environment';
import { provideHttpClient } from '@angular/common/http';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let httpMock: HttpTestingController;

  const MOCK_QUERY_PARAMS = {
    search: 'test',
    userId: 'user123',
    action: 'DELETE',
    startDate: '2026-01-01',
    endDate: '2026-01-02',
    targetId: 'target123',
    page: 2,
    limit: 10,
    sort: 'createdAt',
    order: 'asc',
  };

  const MOCK_AUDIT_LOG_ITEM: AuditLog = {
    _id: 'log1',
    userId: { _id: 'u1', username: 'admin' },
    username: 'admin',
    action: 'DELETE',
    targetType: 'Employee',
    targetId: 'target123',
    targetName: 'John Doe',
    details: {},
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const MOCK_ACTIONS = ['CREATE_EMPLOYEE', 'UPDATE_EMPLOYEE'];
  const MOCK_USERS = [{ _id: 'u1', username: 'admin' }];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuditLogService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuditLogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  describe('getAll', () => {
    it('should send GET with all provided query parameters and return the response', () => {
      const mockResponse = { data: [MOCK_AUDIT_LOG_ITEM], pagination: { total: 1, page: 2, limit: 10, totalPages: 1 } };

      service.getAll(MOCK_QUERY_PARAMS).subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne((request) => {
        const p = request.params;
        return (
          request.url === `${environment.apiUrl}/audit-logs` &&
          p.get('page') === '2' &&
          p.get('limit') === '10' &&
          p.get('sort') === 'createdAt' &&
          p.get('order') === 'asc' &&
          p.get('search') === 'test' &&
          p.get('userId') === 'user123' &&
          p.get('action') === 'DELETE' &&
          p.get('targetId') === 'target123' &&
          p.get('startDate') === '2026-01-01' &&
          p.get('endDate') === '2026-01-02'
        );
      });

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should send GET with no query parameters when called with no arguments', () => {
      const mockResponse = { data: [] as AuditLog[], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      service.getAll().subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/audit-logs`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResponse);
    });
  });

  describe('getActions', () => {
    it('should send GET to the actions endpoint and return an array of action strings', () => {
      service.getActions().subscribe((res) => {
        expect(res).toEqual(MOCK_ACTIONS);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/audit-logs/actions`);
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_ACTIONS);
    });
  });

  describe('getUsers', () => {
    it('should send GET to the users endpoint and return an array of user objects', () => {
      service.getUsers().subscribe((res) => {
        expect(res).toEqual(MOCK_USERS);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/audit-logs/users`);
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_USERS);
    });
  });
});
