export interface BackupFile {
  fileName: string;
  createdAt: string;
  sizeBytes: number;
}

export interface BackupCreateResponse extends BackupFile {
  imageFileCount: number;
}

export interface BackupStatus {
  backupDirectory: string;
  imageStorageDirectory: string;
  latestBackup: BackupFile | null;
  restoreConfirmationText: string;
}

export interface BackupRestoreResponse {
  message: string;
  restoredAt: string;
  preRestoreBackupFileName: string;
}
