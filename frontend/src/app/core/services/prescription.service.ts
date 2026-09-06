import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Prescription, PrescriptionUpsertRequest } from '../models/prescription.model';

@Injectable({ providedIn: 'root' })
export class PrescriptionService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getByCaseId(caseId: number): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.apiBaseUrl}/api/prescriptions/cases/${caseId}`);
  }

  getByPatientId(patientId: number): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.apiBaseUrl}/api/prescriptions/patients/${patientId}`);
  }

  createDraft(caseId: number, request: PrescriptionUpsertRequest): Observable<Prescription> {
    return this.http.post<Prescription>(`${this.apiBaseUrl}/api/prescriptions/cases/${caseId}`, request);
  }

  updateDraft(id: number, request: PrescriptionUpsertRequest): Observable<Prescription> {
    return this.http.put<Prescription>(`${this.apiBaseUrl}/api/prescriptions/${id}`, request);
  }

  issue(id: number): Observable<Prescription> {
    return this.http.post<Prescription>(`${this.apiBaseUrl}/api/prescriptions/${id}/issue`, {});
  }

  recordPrint(id: number): Observable<Prescription> {
    return this.http.post<Prescription>(`${this.apiBaseUrl}/api/prescriptions/${id}/print`, {});
  }

  voidPrescription(id: number, reason: string): Observable<Prescription> {
    return this.http.post<Prescription>(`${this.apiBaseUrl}/api/prescriptions/${id}/void`, { reason });
  }

  deleteDraft(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/api/prescriptions/${id}`);
  }
}
