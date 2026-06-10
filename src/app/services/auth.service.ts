import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8081';
  private readonly tokenKey = 'pharm_user_token';

  loginPanelOpen = signal(false);
  isLoggedIn     = signal(false);
  userEmail      = signal('');
  userRole       = signal('');

  constructor() {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      const payload = this.decodeToken(token);
      if (payload) {
        this.isLoggedIn.set(true);
        this.userEmail.set(payload.email ?? payload.sub ?? '');
        this.userRole.set(payload.role ?? '');
      }
    }
  }

  openLogin(): void  { this.loginPanelOpen.set(true); }
  closeLogin(): void { this.loginPanelOpen.set(false); }

  sendOtp(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/send-otp`, { email });
  }

  verifyOtp(email: string, otp: string, role: 'customer' | 'doctor'): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/verify-otp/${role}`, { email, otp });
  }

  setSession(token: string, email: string, role: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.isLoggedIn.set(true);
    this.userEmail.set(email);
    this.userRole.set(role);
    this.loginPanelOpen.set(false);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.isLoggedIn.set(false);
    this.userEmail.set('');
    this.userRole.set('');
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}
