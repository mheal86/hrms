import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Employee } from './employee.service';
import type { Employee as EmployeeModel, EmployeeHistory } from '../models/employee-model';

describe('Employee Service', () => {
  let service: Employee;
  let httpMock: HttpTestingController;

  const MOCK_EMPLOYEE = { _id: 'e1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' } as EmployeeModel;
  const MOCK_NEW_EMPLOYEE_PAYLOAD = { firstName: 'John', lastName: 'Doe', email: 'john@example.com', department: 'd1' } as Partial<EmployeeModel> & EmployeeModel;
  const MOCK_UPDATE_EMPLOYEE_PAYLOAD = { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', department: 'd1' } as Partial<EmployeeModel> & EmployeeModel;
  const MOCK_AVATAR_RESPONSE = { _id: 'e1', avatarUrl: 'avatar.png' } as unknown as EmployeeModel;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        Employee,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(Employee);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  describe('getAll', () => {
    it('should send GET with default page 1 and limit 10 when called without arguments', () => {
      const mockResponse = { data: [] as EmployeeModel[], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      service.getAll().subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(r => r.url.includes('/employees'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('limit')).toBe('10');
      req.flush(mockResponse);
    });

    it('should send GET with all custom parameters when provided', () => {
      const mockResponse = { data: [] as EmployeeModel[], pagination: { total: 0, page: 2, limit: 20, totalPages: 0 } };
      service.getAll(2, 20, 'John', 'firstName', 'asc', 'd1', 'ACTIVE').subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(r => r.url.includes('/employees'));
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('limit')).toBe('20');
      expect(req.request.params.get('search')).toBe('John');
      expect(req.request.params.get('sort')).toBe('firstName');
      expect(req.request.params.get('order')).toBe('asc');
      expect(req.request.params.get('department')).toBe('d1');
      expect(req.request.params.get('status')).toBe('ACTIVE');
      req.flush(mockResponse);
    });
  });

  describe('getById', () => {
    it('should send GET to the specific employee URL', () => {
      service.getById('e1').subscribe(res => {
        expect(res).toEqual(MOCK_EMPLOYEE);
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/employees/e1'));
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_EMPLOYEE);
    });
  });

  describe('create', () => {
    it('should send POST with the employee payload in the request body', () => {
      const mockCreated = { _id: 'e1', ...MOCK_NEW_EMPLOYEE_PAYLOAD } as EmployeeModel;
      service.create(MOCK_NEW_EMPLOYEE_PAYLOAD).subscribe(res => {
        expect(res).toEqual(mockCreated);
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/employees'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(MOCK_NEW_EMPLOYEE_PAYLOAD);
      req.flush(mockCreated);
    });
  });

  describe('update', () => {
    it('should send PUT with the employee payload to the specific employee URL', () => {
      const mockUpdated = { _id: 'e1', ...MOCK_UPDATE_EMPLOYEE_PAYLOAD } as EmployeeModel;
      service.update('e1', MOCK_UPDATE_EMPLOYEE_PAYLOAD).subscribe(res => {
        expect(res).toEqual(mockUpdated);
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/employees/e1'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(MOCK_UPDATE_EMPLOYEE_PAYLOAD);
      req.flush(mockUpdated);
    });
  });

  describe('delete', () => {
    it('should send DELETE to the specific employee URL', () => {
      service.delete('e1').subscribe(res => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/employees/e1'));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('uploadAvatar', () => {
    it('should send POST with FormData containing the avatar file', () => {
      const file = new File([''], 'avatar.png', { type: 'image/png' });
      service.uploadAvatar('e1', file).subscribe(res => {
        expect(res).toEqual(MOCK_AVATAR_RESPONSE);
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/employees/e1/avatar'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      req.flush(MOCK_AVATAR_RESPONSE);
    });
  });

  describe('getHistory', () => {
    it('should send GET to the employee history endpoint', () => {
      const mockHistory: EmployeeHistory[] = [];
      service.getHistory('e1').subscribe(res => {
        expect(res).toEqual(mockHistory);
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/employees/e1/history'));
      expect(req.request.method).toBe('GET');
      req.flush(mockHistory);
    });
  });

  describe('importEmployees', () => {
    it('should send POST with FormData containing the import file', () => {
      const file = new File([''], 'employees.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockResponse = { success: true, imported: 10 };
      service.importEmployees(file).subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/employees/import'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      req.flush(mockResponse);
    });
  });
});
