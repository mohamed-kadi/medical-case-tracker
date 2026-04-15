import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CaseStatus, MedicalCase, MedicalCaseUpsertRequest } from '../models/case.model';

@Injectable({ providedIn: 'root' })
export class CaseService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getCasesByPatientId(patientId: number): Observable<MedicalCase[]> {
    return this.http.get<MedicalCase[]>(`${this.apiBaseUrl}/api/cases/patients/${patientId}`);
  }

  createCase(patientId: number, request: MedicalCaseUpsertRequest): Observable<MedicalCase> {
    return this.http.post<MedicalCase>(`${this.apiBaseUrl}/api/cases/patients/${patientId}`, request);
  }

  updateCase(caseId: number, request: MedicalCaseUpsertRequest): Observable<MedicalCase> {
    return this.http.put<MedicalCase>(`${this.apiBaseUrl}/api/cases/${caseId}`, request);
  }

  updateCaseStatus(caseId: number, status: CaseStatus): Observable<MedicalCase> {
    return this.http.patch<MedicalCase>(`${this.apiBaseUrl}/api/cases/${caseId}/status`, status);
  }
}
