import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'medicaltracker.accessToken';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  setToken(token: string): void {
    this.clearLegacyToken();
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  getToken(): string | null {
    this.clearLegacyToken();
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  clearToken(): void {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    this.clearLegacyToken();
  }

  private clearLegacyToken(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}
