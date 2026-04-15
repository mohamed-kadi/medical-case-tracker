export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
  id: number;
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
