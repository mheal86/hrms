import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { Auth } from '../../../core/services/auth';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { FormlyModule, FieldType, FormlyFieldConfig } from '@ngx-formly/core';
import { Component } from '@angular/core';

@Component({
  selector: 'app-dummy',
  template: '<div>Dummy</div>',
})
class DummyComponent extends FieldType { }

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let router: Router;
  let translate: TranslateService;

  const MOCK_LOGIN_SUCCESS_RESPONSE = {
    token: 'test',
    user: { id: '1', username: 'admin', role: 'ADMIN' }
  };

  const MOCK_LOGIN_CREDENTIALS = { username: 'admin', password: 'password' };

  let mockAuth: jasmine.SpyObj<Auth>;

  beforeEach(async () => {
    mockAuth = jasmine.createSpyObj<Auth>('Auth', ['login', 'logout', 'getToken', 'getUser', 'isLoggedIn', 'isAdmin']);
    mockAuth.login.and.returnValue(of(MOCK_LOGIN_SUCCESS_RESPONSE));
    mockAuth.getToken.and.returnValue(null);
    mockAuth.getUser.and.returnValue(null);
    mockAuth.isLoggedIn.and.returnValue(false);
    mockAuth.isAdmin.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [
        Login,
        FormlyModule.forRoot({
          types: [
            { name: 'input', component: DummyComponent }
          ]
        })
      ],
      providers: [
        { provide: Auth, useValue: mockAuth },
        provideRouter([]),
        provideTranslateService(),
        provideHttpClient(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    translate = TestBed.inject(TranslateService);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should reload fields on lang change', () => {
    const initSpy = spyOn(component, 'initFields').and.callThrough();
    translate.use('en');
    expect(initSpy).toHaveBeenCalled();
  });

  it('should return correct validation messages', () => {
    spyOn(translate, 'instant').and.callFake((key: string | string[]) => typeof key === 'string' ? key : key[0]);

    const usernameRequiredMsg = component.loginFields[0].validation?.messages?.['required'];
    const passwordRequiredMsg = component.loginFields[1].validation?.messages?.['required'];

    expect(usernameRequiredMsg).toBeDefined();
    expect(passwordRequiredMsg).toBeDefined();

    if (typeof usernameRequiredMsg === 'function') {
      expect(usernameRequiredMsg(null, null as unknown as FormlyFieldConfig)).toBe('AUTH.USERNAME_REQUIRED');
    }
    if (typeof passwordRequiredMsg === 'function') {
      expect(passwordRequiredMsg(null, null as unknown as FormlyFieldConfig)).toBe('AUTH.PASSWORD_REQUIRED');
    }
  });

  it('should not submit if form is invalid', () => {
    component.onSubmit();
    fixture.detectChanges();
    expect(mockAuth.login).not.toHaveBeenCalled();
    expect(component.loginForm.touched).toBe(true);
  });

  it('should login successfully and navigate to dashboard', () => {
    mockAuth.login.and.returnValue(of(MOCK_LOGIN_SUCCESS_RESPONSE));
    const navigateSpy = spyOn(router, 'navigate').and.callThrough();

    component.loginForm.setValue(MOCK_LOGIN_CREDENTIALS);
    component.onSubmit();
    fixture.detectChanges();

    expect(mockAuth.login).toHaveBeenCalledWith('admin', 'password');
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    expect(component.isLoading()).toBe(false);
  });

  it('should set error key invalid on invalid username/password error', () => {
    mockAuth.login.and.returnValue(throwError(() => ({
      error: { message: 'Invalid username or password' }
    })));
    spyOn(translate, 'instant').and.callFake((key) => key);

    component.loginForm.setValue(MOCK_LOGIN_CREDENTIALS);
    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('AUTH.ERROR_INVALID');
  });

  it('should set error key required on missing credentials error', () => {
    mockAuth.login.and.returnValue(throwError(() => ({
      error: { message: 'Username and password are required' }
    })));
    spyOn(translate, 'instant').and.callFake((key) => key);

    component.loginForm.setValue(MOCK_LOGIN_CREDENTIALS);
    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('AUTH.ERROR_REQUIRED');
  });

  it('should set error key failed on general login error', () => {
    mockAuth.login.and.returnValue(throwError(() => ({
      error: { message: 'Some other error' }
    })));
    spyOn(translate, 'instant').and.callFake((key) => key);

    component.loginForm.setValue(MOCK_LOGIN_CREDENTIALS);
    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('AUTH.ERROR_FAILED');
  });
});
