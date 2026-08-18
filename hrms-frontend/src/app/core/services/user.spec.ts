import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { User } from './user';
import type { CreateUserPayload, UserAccountData, UpdateUserPayload } from '../models/user-model';

describe('User Service', () => {
  let service: User;
  let httpMock: HttpTestingController;

  const MOCK_CREATE_USER_PAYLOAD: CreateUserPayload = { username: 'test', password: '123', employeeId: 'e1', roleName: 'USER' };
  const MOCK_USER_ACCOUNT_DATA: UserAccountData = {
    _id: 'u1',
    username: 'john',
    role: { _id: 'r1', name: 'USER' }
  };
  const MOCK_UPDATE_USER_PAYLOAD: UpdateUserPayload = { roleName: 'ADMIN' };
  const MOCK_SUCCESS_RESPONSE = { success: true };
  const MOCK_EXISTS_RESPONSE = { exists: true };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        User,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(User);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  describe('getUrl', () => {
    it('should build the correct base URL when no path is provided', () => {
      expect(service.getUrl()).toContain('/users');
    });

    it('should append the path to the base URL when a path is provided', () => {
      expect(service.getUrl('test')).toContain('/users/test');
    });
  });

  describe('create', () => {
    it('should send POST with the user creation payload and return a response', () => {
      service.create(MOCK_CREATE_USER_PAYLOAD).subscribe((res) => {
        expect(res).toEqual(MOCK_SUCCESS_RESPONSE);
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/users'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(MOCK_CREATE_USER_PAYLOAD);
      req.flush(MOCK_SUCCESS_RESPONSE);
    });
  });

  describe('checkUsername', () => {
    it('should check username existence via GET and return the status object', () => {
      service.checkUsername('testuser').subscribe((res) => {
        expect(res).toEqual(MOCK_EXISTS_RESPONSE);
      });

      const req = httpMock.expectOne(r => r.url.includes('/users/check-username') && r.params.get('username') === 'testuser');
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_EXISTS_RESPONSE);
    });
  });

  describe('getByEmployeeId', () => {
    it('should fetch user details by employee ID via GET', () => {
      service.getByEmployeeId('e1').subscribe((res) => {
        expect(res).toEqual(MOCK_USER_ACCOUNT_DATA);
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/users/by-employee/e1'));
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_USER_ACCOUNT_DATA);
    });
  });

  describe('update', () => {
    it('should send PUT with the user update payload and return a response', () => {
      service.update('u1', MOCK_UPDATE_USER_PAYLOAD).subscribe((res) => {
        expect(res).toEqual(MOCK_SUCCESS_RESPONSE);
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/users/u1'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(MOCK_UPDATE_USER_PAYLOAD);
      req.flush(MOCK_SUCCESS_RESPONSE);
    });
  });
});
