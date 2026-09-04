import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Patient, PatientAssignmentRequest, PatientPage, PatientUpsertRequest } from '../models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getVisiblePatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiBaseUrl}/api/patients`);
  }

  getVisiblePatientPage(page: number, size: number, query?: string, status?: string): Observable<PatientPage> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (query?.trim()) {
      params = params.set('query', query.trim());
    }
    if (status?.trim()) {
      params = params.set('status', status.trim());
    }
    return this.http.get<PatientPage>(`${this.apiBaseUrl}/api/patients/page`, { params });
  }

  getPatientById(patientId: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiBaseUrl}/api/patients/${patientId}`);
  }

  createPatient(request: PatientUpsertRequest): Observable<Patient> {
    return this.http.post<Patient>(`${this.apiBaseUrl}/api/patients`, request);
  }

  updatePatient(patientId: number, request: PatientUpsertRequest): Observable<Patient> {
    return this.http.put<Patient>(`${this.apiBaseUrl}/api/patients/${patientId}`, request);
  }

  assignPatient(patientId: number, request: PatientAssignmentRequest): Observable<Patient> {
    return this.http.patch<Patient>(`${this.apiBaseUrl}/api/admin/patients/${patientId}/assignment`, request);
  }
}
