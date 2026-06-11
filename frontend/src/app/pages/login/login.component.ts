import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-wrap">
      <div class="login-box">
        <div class="login-header">
          <div class="login-icon">&#x1F4BE;</div>
          <h1>bulk_extractor</h1>
          <p>Forensics Platform</p>
        </div>

        <div class="mode-toggle">
          <button [class.active]="mode()==='login'" (click)="mode.set('login')">Sign in</button>
          <button [class.active]="mode()==='register'" (click)="mode.set('register')">Register</button>
        </div>

        <form (ngSubmit)="submit()" #f="ngForm">
          <div class="field">
            <label>Email</label>
            <input class="input" type="email" [(ngModel)]="email" name="email" required />
          </div>
          <div class="field">
            <label>Password</label>
            <input class="input" type="password" [(ngModel)]="password" name="password" required />
          </div>
          @if (error()) {
            <p class="error">{{ error() }}</p>
          }
          <button class="btn btn-primary submit-btn" type="submit" [disabled]="loading()">
            {{ loading() ? 'Please wait…' : mode() === 'login' ? 'Sign in' : 'Create account' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #080d14; }
    .login-box { width: 340px; background: #0d1117; border: 0.5px solid #1e2d42; border-radius: 12px; padding: 28px; }
    .login-header { text-align: center; margin-bottom: 22px; }
    .login-icon { font-size: 28px; margin-bottom: 8px; }
    h1 { color: #c9d1d9; font-size: 16px; font-weight: 500; }
    p { color: #3d4f62; font-size: 11px; margin-top: 3px; }
    .mode-toggle { display: flex; background: #141d2a; border-radius: 8px; padding: 3px; margin-bottom: 18px; gap: 3px; }
    .mode-toggle button { flex: 1; padding: 6px; border: none; border-radius: 6px; font-size: 12px; font-family: inherit; cursor: pointer; background: transparent; color: #6b7c8f; &.active { background: #1e2d42; color: #c9d1d9; } }
    .field { margin-bottom: 14px; label { display: block; font-size: 11px; color: #6b7c8f; margin-bottom: 5px; } }
    .error { color: #f87171; font-size: 11px; margin-bottom: 10px; }
    .submit-btn { width: 100%; justify-content: center; padding: 9px; font-size: 13px; }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  mode = signal<'login' | 'register'>('login');
  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  submit() {
    this.error.set('');
    this.loading.set(true);
    const doLogin = () => this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => { this.error.set('Invalid credentials.'); this.loading.set(false); }
    });

    if (this.mode() === 'register') {
      this.auth.register(this.email, this.password).subscribe({
        next: () => doLogin(),
        error: () => { this.error.set('Registration failed — email may already be in use.'); this.loading.set(false); }
      });
    } else {
      doLogin();
    }
  }
}
