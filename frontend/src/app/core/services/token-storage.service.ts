import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'medicaltracker.accessToken';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  setToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}
