import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ImageCategory, MedicalImage } from '../models/image.model';

@Injectable({ providedIn: 'root' })
export class ImageService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getImagesByCase(caseId: number, category: ImageCategory | 'ALL' = 'ALL'): Observable<MedicalImage[]> {
    if (category === 'ALL') {
      return this.http.get<MedicalImage[]>(`${this.apiBaseUrl}/api/images/case/${caseId}`);
    }

    const params = new HttpParams().set('category', category);
    return this.http.get<MedicalImage[]>(`${this.apiBaseUrl}/api/images/case/${caseId}/category`, { params });
  }

  uploadImage(file: File, caseId: number, category: ImageCategory, description?: string | null): Observable<MedicalImage> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('caseId', String(caseId));
    formData.append('category', category);

    const normalizedDescription = (description ?? '').trim();
    if (normalizedDescription.length > 0) {
      formData.append('description', normalizedDescription);
    }

    return this.http.post<MedicalImage>(`${this.apiBaseUrl}/api/images/upload`, formData);
  }

  deleteImage(imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/api/images/${imageId}`);
  }

  downloadImage(imageId: number): Observable<Blob> {
    return this.http.get(`${this.apiBaseUrl}/api/images/download/${imageId}`, {
      responseType: 'blob'
    });
  }
}
