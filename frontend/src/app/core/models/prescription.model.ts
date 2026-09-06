export type PrescriptionStatus = 'DRAFT' | 'ISSUED' | 'VOIDED';
export type PrescriptionType = 'MEDICATION' | 'LABORATORY' | 'IMAGING' | 'DEVICE' | 'PARAMEDICAL';

export interface PrescriptionItemRequest {
  medicationName: string;
  strength?: string | null;
  pharmaceuticalForm?: string | null;
  dose?: string | null;
  route?: string | null;
  frequency?: string | null;
  duration?: string | null;
  quantity?: string | null;
  instructions?: string | null;
}

export interface PrescriptionItem extends PrescriptionItemRequest {
  id?: number;
  position: number;
}

export interface PrescriptionUpsertRequest {
  type: PrescriptionType;
  prescriberName: string;
  prescriberTitle: string;
  professionalId?: string | null;
  practiceName?: string | null;
  practiceAddress: string;
  practicePhone?: string | null;
  generalInstructions?: string | null;
  items: PrescriptionItemRequest[];
}

export interface Prescription {
  id: number;
  caseId: number;
  caseTitle: string;
  prescriptionNumber?: string | null;
  type: PrescriptionType;
  status: PrescriptionStatus;
  prescriberName: string;
  prescriberTitle: string;
  professionalId?: string | null;
  practiceName?: string | null;
  practiceAddress: string;
  practicePhone?: string | null;
  generalInstructions?: string | null;
  patientName: string;
  patientNumber?: string | null;
  patientDateOfBirth?: string | null;
  createdBy: string;
  issuedAt?: string | null;
  voidedAt?: string | null;
  voidReason?: string | null;
  createdAt: string;
  updatedAt: string;
  items: PrescriptionItem[];
}
