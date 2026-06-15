import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PatientPortalDashboard } from '../models/patient-portal.model';

@Injectable({ providedIn: 'root' })
export class PatientPortalService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getDashboard(): Observable<PatientPortalDashboard> {
    return this.http.get<PatientPortalDashboard>(`${this.apiBaseUrl}/api/patient-portal/dashboard`);
  }
}
