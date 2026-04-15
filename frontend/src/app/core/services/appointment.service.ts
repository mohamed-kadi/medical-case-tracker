import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Appointment, CreateAppointmentRequest } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

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
}
