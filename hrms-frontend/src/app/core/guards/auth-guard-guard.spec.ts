import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth-guard-guard';
import { Auth } from '../services/auth';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let mockAuthService: jasmine.SpyObj<Auth>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('Auth', ['isLoggedIn']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should return true if user is logged in', () => {
    mockAuthService.isLoggedIn.and.returnValue(true);
    const mockRoute = {} as Partial<ActivatedRouteSnapshot> & ActivatedRouteSnapshot;
    const mockState = {} as Partial<RouterStateSnapshot> & RouterStateSnapshot;

    const result = executeGuard(mockRoute, mockState);

    expect(result).toBe(true);
  });

  it('should navigate to /login and return false if user is not logged in', () => {
    mockAuthService.isLoggedIn.and.returnValue(false);
    const mockRoute = {} as Partial<ActivatedRouteSnapshot> & ActivatedRouteSnapshot;
    const mockState = {} as Partial<RouterStateSnapshot> & RouterStateSnapshot;

    const result = executeGuard(mockRoute, mockState);

    expect(result).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledOnceWith(['/login']);
  });
});
