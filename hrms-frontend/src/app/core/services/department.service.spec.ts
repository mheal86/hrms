import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Department } from './department.service';
import type { Department as DepartmentModel } from '../models/department-model';

describe('Department Service', () => {
  let service: Department;
  let httpMock: HttpTestingController;

  const MOCK_EMPTY_PAGINATED_RESPONSE = { data: [] as DepartmentModel[], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
  const MOCK_DEPARTMENT = { _id: 'd1', name: 'IT', description: 'Tech' } as DepartmentModel;
  const MOCK_CREATE_DEPARTMENT_PAYLOAD = { name: 'IT', description: 'Tech department' } as Partial<DepartmentModel> & DepartmentModel;
  const MOCK_UPDATE_DEPARTMENT_PAYLOAD = { name: 'HR', description: 'Human Resources' } as Partial<DepartmentModel> & DepartmentModel;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        Department,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(Department);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  describe('getUrl', () => {
    it('should return the base departments URL when called without an id', () => {
      expect(service.getUrl()).toContain('/departments');
    });

    it('should append the id to the URL when called with an id', () => {
      expect(service.getUrl('d1')).toContain('/departments/d1');
    });
  });

  describe('getAll', () => {
    it('should send GET with default page 1 and limit 10 when called without arguments', () => {
      service.getAll().subscribe(res => {
        expect(res).toEqual(MOCK_EMPTY_PAGINATED_RESPONSE);
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('/departments') &&
        r.params.get('page') === '1' &&
        r.params.get('limit') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_EMPTY_PAGINATED_RESPONSE);
    });

    it('should send GET with custom search, page, and limit when provided', () => {
      const mockResponse = { data: [] as DepartmentModel[], pagination: { total: 0, page: 2, limit: 20, totalPages: 0 } };
      service.getAll('IT', 2, 20).subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('/departments') &&
        r.params.get('page') === '2' &&
        r.params.get('limit') === '20' &&
        r.params.get('search') === 'IT'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getAllUnpaginated', () => {
    it('should send GET with limit 1000 and map the response data array', () => {
      service.getAllUnpaginated().subscribe(data => {
        expect(data.length).toBe(1);
        expect(data[0]._id).toBe('d1');
        expect(data[0].name).toBe('IT');
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('/departments') &&
        r.params.get('limit') === '1000' &&
        r.params.get('page') === '1'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: [MOCK_DEPARTMENT], pagination: { total: 1, page: 1, limit: 1000, totalPages: 1 } });
    });
  });

  describe('getById', () => {
    it('should send GET to the specific department URL', () => {
      service.getById('d1').subscribe(res => {
        expect(res).toEqual(MOCK_DEPARTMENT);
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/departments/d1'));
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_DEPARTMENT);
    });
  });

  describe('create', () => {
    it('should send POST with the department payload in the request body', () => {
      const mockCreated = { _id: 'd1', ...MOCK_CREATE_DEPARTMENT_PAYLOAD } as DepartmentModel;
      service.create(MOCK_CREATE_DEPARTMENT_PAYLOAD).subscribe(res => {
        expect(res).toEqual(mockCreated);
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/departments'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(MOCK_CREATE_DEPARTMENT_PAYLOAD);
      req.flush(mockCreated);
    });
  });

  describe('update', () => {
    it('should send PUT with the department payload to the specific department URL', () => {
      const mockUpdated = { _id: 'd1', ...MOCK_UPDATE_DEPARTMENT_PAYLOAD } as DepartmentModel;
      service.update('d1', MOCK_UPDATE_DEPARTMENT_PAYLOAD).subscribe(res => {
        expect(res).toEqual(mockUpdated);
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/departments/d1'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(MOCK_UPDATE_DEPARTMENT_PAYLOAD);
      req.flush(mockUpdated);
    });
  });

  describe('delete', () => {
    it('should send DELETE to the specific department URL', () => {
      service.delete('d1').subscribe(res => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/departments/d1'));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
