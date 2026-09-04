import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Appointment, AppointmentPage, AppointmentStatus, CreateAppointmentRequest } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getAppointmentsByPatientId(patientId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiBaseUrl}/api/appointments/patients/${patientId}`);
  }

  getUpcomingAppointments(fromDateTime?: string, toDateTime?: string): Observable<Appointment[]> {
    let params = new HttpParams();
    if (fromDateTime) {
      params = params.set('from', fromDateTime);
    }
    if (toDateTime) {
      params = params.set('to', toDateTime);
    }
    return this.http.get<Appointment[]>(`${this.apiBaseUrl}/api/appointments/upcoming`, { params });
  }

  getUpcomingAppointmentPage(page: number, size: number, fromDateTime?: string): Observable<AppointmentPage> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (fromDateTime) {
      params = params.set('from', fromDateTime);
    }
    return this.http.get<AppointmentPage>(`${this.apiBaseUrl}/api/appointments/upcoming/page`, { params });
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
