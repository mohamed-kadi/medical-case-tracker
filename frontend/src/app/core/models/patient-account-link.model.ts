export interface PatientAccountCandidate {
  id: number;
  username: string;
  email: string;
}

export interface PatientAccountLinkPatient {
  id: number;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  status: string;
  verifiedUsername?: string | null;
  verifiedEmail?: string | null;
  verifiedAt?: string | null;
}

export interface VerifyPatientAccountLinkRequest {
  patientNumber: string;
  username: string;
  verificationMethod?: string | null;
}

export interface PatientAccountLink {
  id: number;
  userId: number;
  username: string;
  email: string;
  patientId: number;
  patientNumber: string;
  patientName: string;
  status: string;
  verificationMethod?: string | null;
  verifiedByUsername?: string | null;
  verifiedAt?: string | null;
}
