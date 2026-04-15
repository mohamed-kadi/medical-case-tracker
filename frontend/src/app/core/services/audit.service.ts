import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuditEvent, AuditEventFilters } from '../models/audit-event.model';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getEvents(filters?: AuditEventFilters): Observable<AuditEvent[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.entityType && filters.entityType.trim().length > 0) {
        params = params.set('entityType', filters.entityType.trim());
      }
      if (filters.action && filters.action.trim().length > 0) {
        params = params.set('action', filters.action.trim());
      }
      if (filters.actor && filters.actor.trim().length > 0) {
        params = params.set('actor', filters.actor.trim());
      }
      if (typeof filters.limit === 'number') {
        params = params.set('limit', String(filters.limit));
      }
    }

    return this.http.get<AuditEvent[]>(`${this.apiBaseUrl}/api/admin/audit/events`, { params });
  }
}
