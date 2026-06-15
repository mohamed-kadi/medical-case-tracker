import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  PatientAccountCandidate,
  PatientAccountLink,
  PatientAccountLinkPatient,
  VerifyPatientAccountLinkRequest
} from '../models/patient-account-link.model';

@Injectable({ providedIn: 'root' })
export class PatientAccountLinkService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getPatientByNumber(patientNumber: string): Observable<PatientAccountLinkPatient> {
    return this.http.get<PatientAccountLinkPatient>(`${this.apiBaseUrl}/api/patient-account-links/patient`, {
      params: { patientNumber }
    });
  }

  searchPatientAccounts(query: string): Observable<PatientAccountCandidate[]> {
    return this.http.get<PatientAccountCandidate[]>(`${this.apiBaseUrl}/api/patient-account-links/accounts`, {
      params: { query }
    });
  }

  verifyLink(request: VerifyPatientAccountLinkRequest): Observable<PatientAccountLink> {
    return this.http.post<PatientAccountLink>(`${this.apiBaseUrl}/api/patient-account-links/verify`, request);
  }
}
