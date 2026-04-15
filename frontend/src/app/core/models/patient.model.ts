export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email: string;
  phoneNumber?: string | null;
  medicalHistory?: string | null;
  status: string;
  assignedDoctorUsername?: string | null;
  assignedStaffUsername?: string | null;
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
  staffUsername?: string | null;
}
