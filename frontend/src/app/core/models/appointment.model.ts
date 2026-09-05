export type AppointmentStatus = 'SCHEDULED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
  id: number;
  patientId?: number | null;
  patientNumber?: string | null;
  patientName?: string | null;
  scheduledAt: string;
  reason: string;
  notes: string | null;
  status: AppointmentStatus;
}

export interface CreateAppointmentRequest {
  scheduledAt: string;
  reason: string;
  notes?: string | null;
}

export interface AppointmentPage {
  content: Appointment[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
