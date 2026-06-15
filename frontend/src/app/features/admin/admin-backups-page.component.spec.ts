import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AdminBackupsPageComponent } from './admin-backups-page.component';
import { AdminBackupService } from '../../core/services/admin-backup.service';
import { I18nService } from '../../core/services/i18n.service';

describe('AdminBackupsPageComponent', () => {
  let backupServiceSpy: jasmine.SpyObj<AdminBackupService>;
  let i18nServiceSpy: jasmine.SpyObj<I18nService>;

  beforeEach(async () => {
    backupServiceSpy = jasmine.createSpyObj<AdminBackupService>('AdminBackupService', [
      'getStatus',
      'listBackups',
      'createBackup',
      'restoreBackup',
      'downloadBackup'
    ]);
    i18nServiceSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);

    i18nServiceSpy.t.and.callFake((key: string) => key);
    backupServiceSpy.getStatus.and.returnValue(
      of({
        backupDirectory: '/backups',
        imageStorageDirectory: '/images',
        latestBackup: null,
        restoreConfirmationText: 'RESTORE'
      })
    );
    backupServiceSpy.listBackups.and.returnValue(
      of([
        {
          fileName: 'medicaltracker-backup-20260603-120000.zip',
          createdAt: '2026-06-03T12:00:00',
          sizeBytes: 2048
        }
      ])
    );
    backupServiceSpy.createBackup.and.returnValue(
      of({
        fileName: 'medicaltracker-backup-20260603-130000.zip',
        createdAt: '2026-06-03T13:00:00',
        sizeBytes: 4096,
        imageFileCount: 2
      })
    );
    backupServiceSpy.restoreBackup.and.returnValue(
      of({
        message: 'Backup restored',
        restoredAt: '2026-06-03T13:30:00',
        preRestoreBackupFileName: 'medicaltracker-backup-20260603-125900.zip'
      })
    );

    await TestBed.configureTestingModule({
      imports: [AdminBackupsPageComponent],
      providers: [
        provideRouter([]),
        { provide: AdminBackupService, useValue: backupServiceSpy },
        { provide: I18nService, useValue: i18nServiceSpy }
      ]
    }).compileComponents();
  });

  it('loads backup status and history on init', () => {
    const fixture = TestBed.createComponent(AdminBackupsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const text = fixture.nativeElement.textContent as string;

    expect(backupServiceSpy.getStatus).toHaveBeenCalled();
    expect(backupServiceSpy.listBackups).toHaveBeenCalled();
    expect(component.backups.length).toBe(1);
    expect(text).toContain('medicaltracker-backup-20260603-120000.zip');
  });

  it('creates a backup and refreshes overview', () => {
    const fixture = TestBed.createComponent(AdminBackupsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.createBackup();

    expect(backupServiceSpy.createBackup).toHaveBeenCalled();
    expect(backupServiceSpy.getStatus).toHaveBeenCalledTimes(2);
    expect(component.successMessage).toContain('medicaltracker-backup-20260603-130000.zip');
  });

  it('requires selected file and RESTORE confirmation before restore', () => {
    const fixture = TestBed.createComponent(AdminBackupsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.isRestoreDisabled).toBeTrue();

    const file = new File(['zip-data'], 'backup.zip', { type: 'application/zip' });
    component.selectedFile = file;
    component.confirmationControl.setValue('RESTORE');
    component.restoreBackup();

    expect(backupServiceSpy.restoreBackup).toHaveBeenCalledWith(file, 'RESTORE');
    expect(component.successMessage).toContain('medicaltracker-backup-20260603-125900.zip');
  });

  it('shows load error state', () => {
    backupServiceSpy.getStatus.and.returnValue(throwError(() => new Error('failed')));

    const fixture = TestBed.createComponent(AdminBackupsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.errorMessage).toBe('admin.backups.error.load');
    expect(component.isLoading).toBeFalse();
  });
});
