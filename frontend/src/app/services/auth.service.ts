import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  get token(): string | null { return localStorage.getItem('token'); }
  get isLoggedIn(): boolean { return !!this.token; }

  login(email: string, password: string) {
    const body = new URLSearchParams({ username: email, password });
    return this.http.post<{ access_token: string }>(
      `${environment.apiUrl}/auth/login`, body.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    ).pipe(tap(r => localStorage.setItem('token', r.access_token)));
  }

  register(email: string, password: string) {
    return this.http.post<User>(`${environment.apiUrl}/auth/register`, { email, password });
  }

  me() { return this.http.get<User>(`${environment.apiUrl}/auth/me`); }

  logout() { localStorage.removeItem('token'); this.router.navigate(['/login']); }
}
