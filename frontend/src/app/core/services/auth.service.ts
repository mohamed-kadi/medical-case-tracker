import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { JwtPayload, LoginRequest, LoginResponse, RegisterRequest } from '../models/auth.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly tokenStorageService: TokenStorageService
  ) {}

  login(request: LoginRequest): Observable<void> {
    return this.http.post<LoginResponse>(`${this.apiBaseUrl}/api/auth/login`, request).pipe(
      tap((response) => this.tokenStorageService.setToken(response.token)),
      map(() => void 0)
    );
  }

  register(request: RegisterRequest): Observable<string> {
    return this.http.post(`${this.apiBaseUrl}/api/auth/register`, request, {
      responseType: 'text'
    });
  }

  logout(): void {
    this.tokenStorageService.clearToken();
  }

  isAuthenticated(): boolean {
    const token = this.tokenStorageService.getToken();
    if (!token) {
      return false;
    }

    return !this.isTokenExpired(token);
  }

  getCurrentUsername(): string {
    const payload = this.decodePayload(this.tokenStorageService.getToken());
    return payload?.sub ?? '';
  }

  getCurrentRole(): string {
    const payload = this.decodePayload(this.tokenStorageService.getToken());
    return payload?.role ?? '';
  }

  getAccessToken(): string | null {
    return this.tokenStorageService.getToken();
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodePayload(token);
    if (!payload?.exp) {
      return true;
    }

    const currentEpochSeconds = Math.floor(Date.now() / 1000);
    return payload.exp <= currentEpochSeconds;
  }

  private decodePayload(token: string | null): JwtPayload | null {
    if (!token) {
      return null;
    }

    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) {
        return null;
      }

      const json = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }
}
