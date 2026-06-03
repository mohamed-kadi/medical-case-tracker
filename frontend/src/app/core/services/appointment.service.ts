import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Appointment, AppointmentStatus, CreateAppointmentRequest } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getAppointmentsByPatientId(patientId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiBaseUrl}/api/appointments/patients/${patientId}`);
  }

  getUpcomingAppointments(fromDateTime?: string): Observable<Appointment[]> {
    let params = new HttpParams();
    if (fromDateTime) {
      params = params.set('from', fromDateTime);
    }
    return this.http.get<Appointment[]>(`${this.apiBaseUrl}/api/appointments/upcoming`, { params });
  }

  createAppointment(patientId: number, request: CreateAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiBaseUrl}/api/appointments/patients/${patientId}`, request);
  }

  updateAppointmentStatus(appointmentId: number, status: AppointmentStatus): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiBaseUrl}/api/appointments/${appointmentId}/status`, { status });
  }

  deleteAppointment(appointmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/api/appointments/${appointmentId}`);
  }
}
