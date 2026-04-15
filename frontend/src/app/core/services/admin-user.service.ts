import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AdminCreateUserRequest, AdminUserResponse, InternalUserRole } from '../models/admin-user.model';

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getInternalUsers(roleFilter: 'ALL' | InternalUserRole = 'ALL'): Observable<AdminUserResponse[]> {
    const endpoint = `${this.apiBaseUrl}/api/admin/users`;
    if (roleFilter === 'ALL') {
      return this.http.get<AdminUserResponse[]>(endpoint);
    }

    return this.http.get<AdminUserResponse[]>(endpoint, { params: { role: roleFilter } });
  }

  createInternalUser(request: AdminCreateUserRequest): Observable<AdminUserResponse> {
    return this.http.post<AdminUserResponse>(`${this.apiBaseUrl}/api/admin/users`, request);
  }
}
