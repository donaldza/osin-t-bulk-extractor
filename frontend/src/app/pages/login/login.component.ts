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

        <form (ngSubmit)="submit()" #f="ngForm">
          <div class="field">
            <label>User</label>
            <input class="input" type="text" [(ngModel)]="username" name="username" autocomplete="username" required />
          </div>
          @if (error()) {
            <p class="error">{{ error() }}</p>
          }
          <button class="btn btn-primary submit-btn" type="submit" [disabled]="loading()">
            {{ loading() ? 'Please wait…' : 'Sign in' }}
          </button>
          <p class="hint">Enter User to continue.</p>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: transparent; }
    .login-box { width: 340px; background: var(--panel-strong); border: 1px solid var(--border); border-radius: 12px; padding: 28px; box-shadow: var(--shadow); }
    .login-header { text-align: center; margin-bottom: 22px; }
    .login-icon { font-size: 28px; margin-bottom: 8px; }
    h1 { color: var(--text); font-size: 16px; font-weight: 500; }
    p { color: var(--muted); font-size: 11px; margin-top: 3px; }
    .field { margin-bottom: 14px; label { display: block; font-size: 11px; color: var(--muted); margin-bottom: 5px; } }
    .error { color: var(--danger); font-size: 11px; margin-bottom: 10px; }
    .submit-btn { width: 100%; justify-content: center; padding: 9px; font-size: 13px; }
    .hint { margin-top: 12px; text-align: center; color: var(--muted); }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = 'User';
  error = signal('');
  loading = signal(false);

  submit() {
    this.error.set('');
    this.loading.set(true);
    this.auth.login(this.username).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => { this.error.set('Enter User to sign in.'); this.loading.set(false); }
    });
  }
}
