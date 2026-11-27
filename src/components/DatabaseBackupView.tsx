
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Database,
  Download,
  RefreshCw,
  ShieldCheck,
  Clock,
  HardDrive,
  CheckCircle2,
  Loader2,
  Play,
  FileArchive,
  X,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'react-toastify';

import {
  DatabaseBackup,
  startDatabaseBackup,
  getDatabaseBackupHistory,
  getDatabaseBackupStatus,
  getDatabaseBackupDownloadUrl,
} from '../api/databaseBackup';

const isRunning = (status: string) =>
  ['QUEUED', 'CREATED', 'IN_PROGRESS'].includes(
    status?.toUpperCase()
  );

const isFailed = (status: string) =>
  ['FAILED', 'ERROR', 'CANCELLED'].includes(
    status?.toUpperCase()
  );

const formatDate = (value: string | null) => {
  if (!value) return '—';

  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatSize = (bytes: number | null) => {
  if (bytes === null || bytes === undefined) return '—';

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const getStatusStyle = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'SUCCESS':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

    case 'FAILED':
    case 'ERROR':
    case 'CANCELLED':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';

    case 'IN_PROGRESS':
    case 'QUEUED':
    case 'CREATED':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';

    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
};

const DatabaseBackupView: React.FC = () => {
  const [backups, setBackups] = useState<DatabaseBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Track previous backup statuses to notify only when a job finishes.
  const previousStatuses = useRef<Map<number, string>>(new Map());

  const loadHistory = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);

      const data = await getDatabaseBackupHistory();

      setBackups(data);
    } catch (err) {
      console.error('Failed to load database backup history:', err);

      toast.error(
        err instanceof Error
          ? err.message
          : 'Unable to load backup history.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory(true);
  }, [loadHistory]);

  // Automatically refresh backups that are still running.
  useEffect(() => {
    const runningBackups = backups.filter((backup) =>
      isRunning(backup.status)
    );

    if (runningBackups.length === 0) return;

    const timer = window.setInterval(async () => {
      try {
        const updated = await Promise.all(
          runningBackups.map((backup) =>
            getDatabaseBackupStatus(backup.id)
          )
        );

        setBackups((previous) =>
          previous.map((backup) => {
            const latest = updated.find(
              (item) => item.id === backup.id
            );

            return latest ?? backup;
          })
        );
      } catch (err) {
        console.error('Failed to refresh backup status:', err);
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [backups]);

  // Notify when a running backup reaches a final status.
  useEffect(() => {
    backups.forEach((backup) => {
      const currentStatus = backup.status?.toUpperCase();
      const previousStatus = previousStatuses.current.get(backup.id);

      if (
        previousStatus &&
        isRunning(previousStatus) &&
        currentStatus === 'SUCCESS'
      ) {
        toast.success(
          'Database backup completed successfully!'
        );
      }

      if (
        previousStatus &&
        isRunning(previousStatus) &&
        isFailed(currentStatus)
      ) {
        toast.error(
          `Database backup ${currentStatus.toLowerCase()}. Please check backup history.`
        );
      }

      previousStatuses.current.set(
        backup.id,
        currentStatus
      );
    });
  }, [backups]);

  const handleStartBackup = async () => {
    try {
      setStarting(true);
      setShowConfirmModal(false);

      const newBackup = await startDatabaseBackup();

      setBackups((previous) => [
        newBackup,
        ...previous.filter((item) => item.id !== newBackup.id),
      ]);

      toast.success(
        'Database backup request submitted successfully.'
      );

      await loadHistory();
    } catch (err) {
      console.error('Failed to start database backup:', err);

      toast.error(
        err instanceof Error
          ? err.message
          : 'Unable to start the database backup.'
      );
    } finally {
      setStarting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadHistory();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownload = async (backup: DatabaseBackup) => {
    try {
      setDownloadingId(backup.id);

      const downloadUrl = await getDatabaseBackupDownloadUrl(
        backup.id
      );

      if (!downloadUrl) {
        throw new Error(
          'The download link was not returned by the server.'
        );
      }

      // Browser downloads the .bak file from the temporary secure S3 link.
      window.location.assign(downloadUrl);
    } catch (err) {
      console.error('Database backup download failed:', err);

      toast.error(
        err instanceof Error
          ? err.message
          : 'Unable to download the backup file.'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const runningCount = backups.filter((backup) =>
    isRunning(backup.status)
  ).length;

  const successfulCount = backups.filter(
    (backup) => backup.status?.toUpperCase() === 'SUCCESS'
  ).length;

  const latestBackup = backups[0];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-400">
            <ShieldCheck className="h-4 w-4" />
            Super Admin Control
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Database Backup
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Manage and download secure backups of the Estuscia EMS database.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-white/10 bg-[#0D0B20] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Backups</span>
            <Database className="h-5 w-5 text-violet-400" />
          </div>

          <p className="mt-3 text-3xl font-bold text-white">
            {backups.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Recorded backup jobs
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0D0B20] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Successful Backups</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>

          <p className="mt-3 text-3xl font-bold text-white">
            {successfulCount}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Completed successfully
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0D0B20] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Active Jobs</span>
            <Clock className="h-5 w-5 text-amber-400" />
          </div>

          <p className="mt-3 text-3xl font-bold text-white">
            {runningCount}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Currently processing
          </p>
        </div>
      </div>

      {/* CREATE BACKUP */}
      <div className="overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#17102F] to-[#0D0B20]">
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10">
              <HardDrive className="h-6 w-6 text-violet-300" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Create Database Backup
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                Generate a full SQL Server backup of EstusciaEMS.
                Once completed, download the .bak file directly to your computer.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                  Database: EstusciaEMS
                </span>

                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                  Format: .BAK
                </span>

                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                  Access: Super Admin
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={starting || runningCount > 0}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-900/30 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {starting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}

            {starting
              ? 'Starting Backup...'
              : runningCount > 0
                ? 'Backup In Progress'
                : 'Take Backup Now'}
          </button>
        </div>
      </div>

      {/* LATEST BACKUP */}
      {latestBackup && (
        <div className="rounded-2xl border border-white/10 bg-[#0D0B20] p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileArchive className="h-5 w-5 text-violet-400" />
            <h2 className="font-bold text-white">Latest Backup</h2>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="break-all text-sm font-semibold text-slate-200">
                {latestBackup.fileName}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Started {formatDate(latestBackup.startedAtUtc)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(latestBackup.status)}`}
              >
                {latestBackup.status}
              </span>

              {latestBackup.isFileAvailable && (
                <button
                  onClick={() => handleDownload(latestBackup)}
                  disabled={downloadingId === latestBackup.id}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  {downloadingId === latestBackup.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download
                </button>
              )}
            </div>
          </div>

          {isRunning(latestBackup.status) && (
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-slate-400">Backup progress</span>

                <span className="font-bold text-violet-300">
                  {latestBackup.progressPercent}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, latestBackup.progressPercent)
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* BACKUP HISTORY */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0D0B20]">
        <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-white">Backup History</h2>

            <p className="mt-1 text-xs text-slate-500">
              Previously generated database backup files.
            </p>
          </div>

          <span className="text-xs text-slate-500">
            {backups.length} record(s)
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading backup history...
          </div>
        ) : backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
              <Database className="h-7 w-7 text-slate-500" />
            </div>

            <h3 className="font-semibold text-white">
              No backups yet
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Your database backup history will appear here after the first backup is created.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Backup File</th>
                    <th className="px-5 py-4">Started</th>
                    <th className="px-5 py-4">Size</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {backups.map((backup) => (
                    <tr
                      key={backup.id}
                      className="transition hover:bg-white/[0.02]"
                    >
                      <td className="max-w-xs px-5 py-4">
                        <p className="break-all text-sm font-medium text-slate-200">
                          {backup.fileName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Task #{backup.rdsTaskId ?? '—'}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-400">
                        {formatDate(backup.startedAtUtc)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-400">
                        {formatSize(backup.fileSizeBytes)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusStyle(backup.status)}`}
                        >
                          {backup.status}
                        </span>

                        {isRunning(backup.status) && (
                          <p className="mt-1 text-[10px] text-slate-500">
                            {backup.progressPercent}% complete
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {backup.isFileAvailable ? (
                          <button
                            onClick={() => handleDownload(backup)}
                            disabled={downloadingId === backup.id}
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            {downloadingId === backup.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            Download
                          </button>
                        ) : (
                          <span className="text-xs text-slate-600">
                            {isRunning(backup.status)
                              ? 'Processing...'
                              : 'Unavailable'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE HISTORY CARDS */}
            <div className="space-y-3 p-4 md:hidden">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-all text-sm font-semibold text-slate-200">
                        {backup.fileName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(backup.startedAtUtc)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${getStatusStyle(backup.status)}`}
                    >
                      {backup.status}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                    <div>
                      <p className="text-[10px] text-slate-500">
                        File size
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-300">
                        {formatSize(backup.fileSizeBytes)}
                      </p>
                    </div>

                    {backup.isFileAvailable && (
                      <button
                        onClick={() => handleDownload(backup)}
                        disabled={downloadingId === backup.id}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        {downloadingId === backup.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        Download
                      </button>
                    )}

                    {isRunning(backup.status) && (
                      <span className="text-xs text-amber-400">
                        {backup.progressPercent}% complete
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="text-center text-[11px] leading-5 text-slate-600">
        Database backup operations are restricted to Super Admin accounts.
        Download links are temporary and should be used promptly after generation.
      </p>

      {/* CUSTOM BACKUP CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => !starting && setShowConfirmModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="backup-confirm-title"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#100D24] shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10">
                  <ShieldCheck className="h-5 w-5 text-violet-300" />
                </div>

                <div>
                  <h3
                    id="backup-confirm-title"
                    className="font-bold text-white"
                  >
                    Confirm Database Backup
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Super Admin action
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={starting}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                aria-label="Close confirmation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-5">
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />

                <p className="text-sm leading-6 text-amber-200">
                  You are about to create a new full database backup.
                  This operation will start a backup job for your production
                  database.
                </p>
              </div>

              <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Database
                  </span>

                  <span className="text-sm font-semibold text-white">
                    EstusciaEMS
                  </span>
                </div>

                <div className="h-px bg-white/5" />

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Backup type
                  </span>

                  <span className="text-sm font-semibold text-white">
                    Full Backup
                  </span>
                </div>

                <div className="h-px bg-white/5" />

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    File format
                  </span>

                  <span className="text-sm font-semibold text-white">
                    .BAK
                  </span>
                </div>

                <div className="h-px bg-white/5" />

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Storage
                  </span>

                  <span className="text-sm font-semibold text-white">
                    Secure AWS S3
                  </span>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                The backup will run in the background. You can monitor its
                progress and download the .bak file once it is completed.
              </p>
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={starting}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStartBackup}
                disabled={starting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-900/30 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {starting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting Backup...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Confirm & Start Backup
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseBackupView;
