export interface Patient {
  id: number;
  patientNumber?: string | null;
  registeredByUsername?: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email: string;
  phoneNumber?: string | null;
  medicalHistory?: string | null;
  status: string;
  assignedDoctorUsername?: string | null;
  assignedFrontDeskUsername?: string | null;
}

export interface PatientUpsertRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phoneNumber?: string | null;
  medicalHistory?: string | null;
  status: string;
}

export interface PatientAssignmentRequest {
  doctorUsername?: string | null;
  frontDeskUsername?: string | null;
}
