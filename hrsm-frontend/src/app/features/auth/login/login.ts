import { Component, OnDestroy, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../core/auth';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, Button, InputText, Password, TranslatePipe],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnDestroy {
  loginForm: FormGroup;
  errorMessage = signal('');
  isLoading = signal(false);
  showPassword = signal(false);
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router,
    private translate: TranslateService,
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update((v) => !v);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { username, password } = this.loginForm.value;

    this.authService
      .login(username, password)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading.set(false);
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
