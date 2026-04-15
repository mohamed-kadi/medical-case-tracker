export type ImageCategory =
  | 'BEFORE_TREATMENT'
  | 'DURING_TREATMENT'
  | 'AFTER_TREATMENT'
  | 'X_RAY'
  | 'MRI'
  | 'CT_SCAN'
  | 'ULTRASOUND'
  | 'OTHER';

export const IMAGE_CATEGORIES: ImageCategory[] = [
  'BEFORE_TREATMENT',
  'DURING_TREATMENT',
  'AFTER_TREATMENT',
  'X_RAY',
  'MRI',
  'CT_SCAN',
  'ULTRASOUND',
  'OTHER'
];

export interface MedicalImage {
  id: number;
  fileName: string;
  contentType: string;
  description?: string | null;
  category: ImageCategory;
  mimeType: string;
  size: number;
  createdAt?: string;
  updatedAt?: string;
  uploadedBy: string;
}
