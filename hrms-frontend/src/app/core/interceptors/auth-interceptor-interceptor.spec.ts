import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpResponse } from '@angular/common/http';
import { authInterceptorInterceptor } from './auth-interceptor-interceptor';
import { Auth } from '../services/auth';
import { of } from 'rxjs';

describe('authInterceptorInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceptorInterceptor(req, next));

  let mockAuthService: jasmine.SpyObj<Auth>;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('Auth', ['getToken']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: mockAuthService },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should not add Authorization header if token is absent', () => {
    mockAuthService.getToken.and.returnValue(null);
    const req = new HttpRequest('GET', '/api/test');
    const next: HttpHandlerFn = (request) => {
      expect(request.headers.has('Authorization')).toBe(false);
      return of(new HttpResponse({ status: 200 }));
    };

    interceptor(req, next);
  });

  it('should add Authorization header if token is present', () => {
    mockAuthService.getToken.and.returnValue('test-token-123');
    const req = new HttpRequest('GET', '/api/test');
    const next: HttpHandlerFn = (request) => {
      expect(request.headers.get('Authorization')).toBe('Bearer test-token-123');
      return of(new HttpResponse({ status: 200 }));
    };

    interceptor(req, next);
  });
});
