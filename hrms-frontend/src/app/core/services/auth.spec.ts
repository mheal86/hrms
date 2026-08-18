import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Auth } from './auth';
import { environment } from '../../../environments/environment';
import { provideHttpClient } from '@angular/common/http';

describe('Auth', () => {
  let service: Auth;
  let httpMock: HttpTestingController;
  let mockRouter: jasmine.SpyObj<Router>;

  const MOCK_LOGIN_RESPONSE = {
    token: 'my-token',
    user: { id: '1', username: 'admin', role: 'ADMIN' },
  };

  const MOCK_USER_OBJ = { id: '1', username: 'john', role: 'USER' };

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        Auth,
        { provide: Router, useValue: mockRouter },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(Auth);
    httpMock = TestBed.inject(HttpTestingController);

    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  describe('getUrl', () => {
    it('should build the correct base auth URL when no path is provided', () => {
      expect(service.getUrl()).toBe(`${environment.apiUrl}/auth`);
    });

    it('should append the path to the auth URL when a path is provided', () => {
      expect(service.getUrl('test')).toBe(`${environment.apiUrl}/auth/test`);
    });
  });

  describe('login', () => {
    it('should send POST request, store token and user object in localStorage, and return the response', () => {
      service.login('admin', 'password').subscribe((res) => {
        expect(res).toEqual(MOCK_LOGIN_RESPONSE);
        expect(localStorage.getItem('token')).toBe('my-token');
        expect(localStorage.getItem('user')).toContain('admin');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'admin', password: 'password' });
      req.flush(MOCK_LOGIN_RESPONSE);
    });
  });

  describe('logout', () => {
    it('should clear token and user from localStorage, and navigate to /login', () => {
      localStorage.setItem('token', 'some-token');
      localStorage.setItem('user', JSON.stringify({ username: 'user' }));

      service.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(mockRouter.navigate).toHaveBeenCalledOnceWith(['/login']);
    });
  });

  describe('getToken', () => {
    it('should return null when token is not present in localStorage', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should return the token when present in localStorage', () => {
      localStorage.setItem('token', 'token-123');
      expect(service.getToken()).toBe('token-123');
    });
  });

  describe('getUser', () => {
    it('should return null when user is not present in localStorage', () => {
      expect(service.getUser()).toBeNull();
    });

    it('should return the parsed user object when present in localStorage', () => {
      localStorage.setItem('user', JSON.stringify(MOCK_USER_OBJ));
      expect(service.getUser()).toEqual(MOCK_USER_OBJ);
    });
  });

  describe('isLoggedIn', () => {
    it('should return false when token is not present', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should return true when token is present', () => {
      localStorage.setItem('token', 'xyz');
      expect(service.isLoggedIn()).toBe(true);
    });
  });

  describe('isAdmin', () => {
    describe('isAdmin when user is not authenticated', () => {
      it('should return false', () => {
        expect(service.isAdmin()).toBe(false);
      });
    });

    describe('isAdmin when user has non-ADMIN role', () => {
      it('should return false', () => {
        localStorage.setItem('user', JSON.stringify({ role: 'USER' }));
        expect(service.isAdmin()).toBe(false);
      });
    });

    it('should return true when user role is ADMIN', () => {
      localStorage.setItem('user', JSON.stringify({ role: 'ADMIN' }));
      expect(service.isAdmin()).toBe(true);
    });
  });
});
