export interface PatientPortalPatient {
  id: number;
  patientNumber?: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  email: string;
  phoneNumber?: string | null;
  status: string;
  assignedDoctorUsername?: string | null;
  assignedFrontDeskUsername?: string | null;
}

export interface PatientPortalAppointment {
  id: number;
  scheduledAt: string;
  reason: string;
  status: string;
}

export interface PatientPortalDashboard {
  username: string;
  email: string;
  patient: PatientPortalPatient | null;
  upcomingAppointments: PatientPortalAppointment[];
}
