
import { apiRequest } from './client';

export interface DatabaseBackup {
  id: number;
  rdsTaskId: number | null;
  databaseName: string;
  fileName: string;
  status: string;
  progressPercent: number;
  startedAtUtc: string;
  completedAtUtc: string | null;
  fileSizeBytes: number | null;
  errorMessage: string | null;
  isFileAvailable: boolean;
  downloadUrl: string | null;
}

interface DatabaseBackupDownloadResponse {
  downloadUrl: string;
}

export async function startDatabaseBackup(): Promise<DatabaseBackup> {
  return apiRequest<DatabaseBackup>('/DatabaseBackup', {
    method: 'POST',
  });
}

export async function getDatabaseBackupHistory(): Promise<DatabaseBackup[]> {
  return apiRequest<DatabaseBackup[]>('/DatabaseBackup', {
    method: 'GET',
  });
}

export async function getDatabaseBackupStatus(
  id: number
): Promise<DatabaseBackup> {
  return apiRequest<DatabaseBackup>(`/DatabaseBackup/${id}`, {
    method: 'GET',
  });
}

export async function getDatabaseBackupDownloadUrl(
  id: number
): Promise<string> {
  const response = await apiRequest<DatabaseBackupDownloadResponse>(
    `/DatabaseBackup/${id}/download`,
    {
      method: 'GET',
    }
  );

  return response.downloadUrl;
}
