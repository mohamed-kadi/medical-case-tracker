import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  BackupCreateResponse,
  BackupFile,
  BackupRestoreResponse,
  BackupStatus
} from '../models/admin-backup.model';

@Injectable({ providedIn: 'root' })
export class AdminBackupService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getStatus(): Observable<BackupStatus> {
    return this.http.get<BackupStatus>(`${this.apiBaseUrl}/api/admin/backups/status`);
  }

  listBackups(): Observable<BackupFile[]> {
    return this.http.get<BackupFile[]>(`${this.apiBaseUrl}/api/admin/backups`);
  }

  createBackup(): Observable<BackupCreateResponse> {
    return this.http.post<BackupCreateResponse>(`${this.apiBaseUrl}/api/admin/backups`, {});
  }

  downloadBackup(fileName: string): Observable<Blob> {
    return this.http.get(`${this.apiBaseUrl}/api/admin/backups/${encodeURIComponent(fileName)}`, {
      responseType: 'blob'
    });
  }

  restoreBackup(file: File, confirmation: string): Observable<BackupRestoreResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('confirmation', confirmation);

    return this.http.post<BackupRestoreResponse>(`${this.apiBaseUrl}/api/admin/backups/restore`, formData);
  }
}
