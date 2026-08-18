import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, finalize, merge, of } from 'rxjs';
import { Button } from 'primeng/button';
import { FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, Button, FormlyModule, TranslatePipe],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit, OnDestroy {
  fb = inject(FormBuilder);
  authService = inject(Auth);
  router = inject(Router);
  translate = inject(TranslateService);

  loginForm: FormGroup = this.fb.group({});
  loginModel = {
    username: '',
    password: '',
  };
  loginFields: FormlyFieldConfig[] = [];

  errorMessage = signal('');
  isLoading = signal(false);
  destroy$ = new Subject<void>();

  ngOnInit() {
    merge(
      of(null),
      this.translate.onLangChange
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.initFields());
  }

  initFields() {
    this.loginFields = [
      {
        key: 'username',
        type: 'input',
        className: 'mb-3 d-block',
        props: {
          label: this.translate.instant('AUTH.USERNAME_LABEL'),
          placeholder: this.translate.instant('AUTH.USERNAME_PLACEHOLDER'),
          required: true,
        },
        validation: {
          messages: {
            required: () => this.translate.instant('AUTH.USERNAME_REQUIRED'),
          },
        },
      },
      {
        key: 'password',
        type: 'input',
        className: 'mb-3 d-block',
        props: {
          type: 'password',
          label: this.translate.instant('AUTH.PASSWORD_LABEL'),
          placeholder: this.translate.instant('AUTH.PASSWORD_PLACEHOLDER'),
          required: true,
        },
        validation: {
          messages: {
            required: () => this.translate.instant('AUTH.PASSWORD_REQUIRED'),
          },
        },
      },
    ];
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { username, password } = this.loginModel;

    this.authService
      .login(username, password)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          const rawMessage = err.error?.message;
          let translatedMessageKey = 'AUTH.ERROR_FAILED';

          if (rawMessage === 'Invalid username or password') {
            translatedMessageKey = 'AUTH.ERROR_INVALID';
          } else if (rawMessage === 'Username and password are required') {
            translatedMessageKey = 'AUTH.ERROR_REQUIRED';
          }

          this.errorMessage.set(this.translate.instant(translatedMessageKey));
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
