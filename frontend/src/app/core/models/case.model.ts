export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export const CASE_STATUSES: CaseStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export interface MedicalCase {
  id: number;
  title: string;
  description?: string | null;
  treatmentPlan?: string | null;
  status: CaseStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicalCaseUpsertRequest {
  title: string;
  description?: string | null;
  treatmentPlan?: string | null;
  status?: CaseStatus;
}
