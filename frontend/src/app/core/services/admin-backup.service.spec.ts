import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '../../../environments/environment';
import { AdminBackupService } from './admin-backup.service';

describe('AdminBackupService', () => {
  let service: AdminBackupService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AdminBackupService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads backup status', () => {
    service.getStatus().subscribe((status) => {
      expect(status.restoreConfirmationText).toBe('RESTORE');
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/api/admin/backups/status`);
    expect(request.request.method).toBe('GET');
    request.flush({
      backupDirectory: '/backups',
      imageStorageDirectory: '/images',
      latestBackup: null,
      restoreConfirmationText: 'RESTORE'
    });
  });

  it('creates a backup', () => {
    service.createBackup().subscribe((backup) => {
      expect(backup.fileName).toBe('medicaltracker-backup.zip');
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/api/admin/backups`);
    expect(request.request.method).toBe('POST');
    request.flush({
      fileName: 'medicaltracker-backup.zip',
      createdAt: '2026-06-03T12:00:00',
      sizeBytes: 100,
      imageFileCount: 2
    });
  });

  it('posts restore confirmation and backup file as form data', () => {
    const file = new File(['zip-data'], 'backup.zip', { type: 'application/zip' });

    service.restoreBackup(file, 'RESTORE').subscribe((response) => {
      expect(response.preRestoreBackupFileName).toBe('pre-restore.zip');
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/api/admin/backups/restore`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body instanceof FormData).toBeTrue();
    request.flush({
      message: 'Backup restored',
      restoredAt: '2026-06-03T12:30:00',
      preRestoreBackupFileName: 'pre-restore.zip'
    });
  });
});
