import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BackendDailyWorkLog,
  getDailyWorkLogs,
  reviewDailyWorkLog,
} from '../api/dailyWork';

import {
  PhoneCall,
  UserCheck,
  Calendar,
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  Download,
  Check,
  Send,
  AlertCircle,
  RefreshCw,
  XCircle,
} from 'lucide-react';

export const DailyWorkView: React.FC = () => {
  const {
    setIsWorkLogModalOpen,
    currentUser,
    selectedBranch,
  } = useApp();

  // ============================================================
  // ROLE
  // ============================================================

  const role = (
    currentUser.roleName ||
    currentUser.role ||
    ''
  ).toLowerCase();

  const isSalesStaff = role === 'sales_staff';

  const isBranchManager =
    role === 'branch_manager';

  const isHrOps =
    role === 'hr_ops';

  const isCompanyAdmin =
    role === 'company_admin';

  const isManagement =
    isBranchManager ||
    isHrOps ||
    isCompanyAdmin;

  // Super admin intentionally has no Daily Work access.
  const isSuperAdmin =
    role === 'super_admin';

  // ============================================================
  // STATE
  // ============================================================

  const [dailyWorkLogs, setDailyWorkLogs] = useState<
    BackendDailyWorkLog[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [searchQuery, setSearchQuery] =
    useState('');

  const [selectedDate, setSelectedDate] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState<'all' | 'Submitted' | 'Reviewed' | 'Rejected'>(
      'all'
    );

  const [feedbackLogId, setFeedbackLogId] =
    useState<number | null>(null);

  const [feedbackText, setFeedbackText] =
    useState('');

  const [reviewingLogId, setReviewingLogId] =
    useState<number | null>(null);

  // ============================================================
  // LOAD DAILY WORK
  // ============================================================

  const loadDailyWork = async (
    showFullLoader = true
  ) => {
    if (isSuperAdmin) {
      setDailyWorkLogs([]);
      setIsLoading(false);
      return;
    }

    try {
      if (showFullLoader) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError(null);

      /*
       * Sales Staff:
       * Backend automatically restricts them to their own
       * Sales reports.
       *
       * Branch Manager:
       * Backend restricts them to their assigned branch.
       *
       * HR Ops / Company Admin:
       * They can see the tenant and optionally filter by branch.
       *
       * The selected branch is a DISPLAY FILTER for management.
       * It is NOT being trusted for authorization.
       */

      const branchId =
        isManagement &&
          !isBranchManager &&
          selectedBranch?.id
          ? selectedBranch.id
          : undefined;

      const logs = await getDailyWorkLogs({
        branchId,
        workType: 0, // Sales
      });

      setDailyWorkLogs(logs);
    } catch (err) {
      console.error(
        'Failed to load daily work logs:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load daily work reports.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDailyWork();
  }, [
    selectedBranch?.id,
    role,
  ]);

  // ============================================================
  // FILTER LOGS
  // ============================================================

  const filteredLogs = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    return dailyWorkLogs.filter((log) => {
      // Only Sales reports are currently supported.
      if (
        log.workType !== 'Sales' &&
        log.workType !== 0
      ) {
        return false;
      }

      // Date filter
      if (
        selectedDate &&
        log.workDate !== selectedDate
      ) {
        return false;
      }

      // Status filter
      if (
        statusFilter !== 'all' &&
        log.status !== statusFilter
      ) {
        return false;
      }

      // Search
      if (query) {
        const userName =
          log.user?.fullName || '';

        const employeeCode =
          log.user?.employeeCode || '';

        const designation =
          log.user?.designation || '';

        const department =
          log.user?.department || '';

        const narration =
          log.narration || '';

        const managerNotes =
          log.managerNotes || '';

        const branchName =
          log.branch?.branchName || '';

        const searchableText = [
          userName,
          employeeCode,
          designation,
          department,
          narration,
          managerNotes,
          branchName,
        ]
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [
    dailyWorkLogs,
    searchQuery,
    selectedDate,
    statusFilter,
  ]);

  // ============================================================
  // AGGREGATES
  // ============================================================

  const totalCalls = useMemo(
    () =>
      filteredLogs.reduce(
        (total, log) =>
          total + (log.callsMade || 0),
        0
      ),
    [filteredLogs]
  );

  const totalConnected = useMemo(
    () =>
      filteredLogs.reduce(
        (total, log) =>
          total + (log.callsConnected || 0),
        0
      ),
    [filteredLogs]
  );

  const totalHotLeads = useMemo(
    () =>
      filteredLogs.reduce(
        (total, log) =>
          total +
          (log.leadsRespondedWell || 0),
        0
      ),
    [filteredLogs]
  );

  const totalFollowUps = useMemo(
    () =>
      filteredLogs.reduce(
        (total, log) =>
          total +
          (log.followUpsScheduled || 0),
        0
      ),
    [filteredLogs]
  );

  // ============================================================
  // REVIEW
  // ============================================================

  const handleQuickReview = async (
    logId: number
  ) => {
    try {
      setReviewingLogId(logId);

      await reviewDailyWorkLog(
        logId,
        {
          managerNotes:
            'Report reviewed by management.',
          status: 'Reviewed',
        }
      );

      await loadDailyWork(false);
    } catch (err) {
      console.error(
        'Failed to review daily work:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to review report.'
      );
    } finally {
      setReviewingLogId(null);
    }
  };

  const handleFeedbackSubmit = async (
    logId: number
  ) => {
    if (!feedbackText.trim()) {
      return;
    }

    try {
      setReviewingLogId(logId);

      await reviewDailyWorkLog(
        logId,
        {
          managerNotes:
            feedbackText.trim(),
          status: 'Reviewed',
        }
      );

      setFeedbackLogId(null);
      setFeedbackText('');

      await loadDailyWork(false);
    } catch (err) {
      console.error(
        'Failed to submit review:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to submit management review.'
      );
    } finally {
      setReviewingLogId(null);
    }
  };

  const handleReject = async (
    logId: number
  ) => {
    const reason =
      window.prompt(
        'Enter the reason for rejecting this report:'
      );

    if (!reason?.trim()) {
      return;
    }

    try {
      setReviewingLogId(logId);

      await reviewDailyWorkLog(
        logId,
        {
          managerNotes:
            reason.trim(),
          status: 'Rejected',
        }
      );

      await loadDailyWork(false);
    } catch (err) {
      console.error(
        'Failed to reject daily work:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to reject report.'
      );
    } finally {
      setReviewingLogId(null);
    }
  };

  // ============================================================
  // CSV EXPORT
  // ============================================================

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      return;
    }

    const headers = [
      'Date',
      'Employee',
      'Employee Code',
      'Designation',
      'Department',
      'Branch',
      'Calls Made',
      'Calls Connected',
      'Leads Responded Well',
      'Follow-ups Scheduled',
      'Narration',
      'Status',
      'Manager Notes',
    ];

    const escapeCSV = (
      value: unknown
    ) => {
      const stringValue =
        value === null ||
          value === undefined
          ? ''
          : String(value);

      return `"${stringValue.replace(
        /"/g,
        '""'
      )}"`;
    };

    const rows = filteredLogs.map(
      (log) => [
        log.workDate,
        escapeCSV(
          log.user?.fullName || ''
        ),
        escapeCSV(
          log.user?.employeeCode || ''
        ),
        escapeCSV(
          log.user?.designation || ''
        ),
        escapeCSV(
          log.user?.department || ''
        ),
        escapeCSV(
          log.branch?.branchName || ''
        ),
        log.callsMade ?? 0,
        log.callsConnected ?? 0,
        log.leadsRespondedWell ?? 0,
        log.followUpsScheduled ?? 0,
        escapeCSV(log.narration),
        escapeCSV(log.status),
        escapeCSV(
          log.managerNotes || ''
        ),
      ]
    );

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.join(',')
      ),
    ].join('\n');

    const blob = new Blob(
      [csvContent],
      {
        type: 'text/csv;charset=utf-8;',
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;

    link.download =
      `Estuscia_Daily_Work_Report_${new Date()
        .toISOString()
        .substring(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ============================================================
  // SUPER ADMIN
  // ============================================================

  if (isSuperAdmin) {
    return null;
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">

      {/* ====================================================== */}
      {/* TOP HEADER */}
      {/* ====================================================== */}

      <div className="flex flex-col gap-4 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Daily Sales Work
            </h1>

            <span className="rounded-full border border-[#5C3FE0]/30 bg-[#5C3FE0]/20 px-2.5 py-0.5 text-[10px] font-semibold text-[#A78BFA]">
              EMS
            </span>
          </div>

          <p className="text-xs text-gray-400">
            {isManagement
              ? 'Review and manage daily sales activity reports for your authorized scope.'
              : 'Submit and track your daily sales activity.'}
          </p>
        </div>

        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={() =>
              loadDailyWork(false)
            }
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing
                ? 'animate-spin'
                : ''
                }`}
            />

            <span>Refresh</span>
          </button>

          {filteredLogs.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              <Download className="h-3.5 w-3.5" />

              <span>Export CSV</span>
            </button>
          )}

          {isSalesStaff && (
            <button
              type="button"
              onClick={() =>
                setIsWorkLogModalOpen(true)
              }
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5C3FE0] to-[#7C3AED] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#5C3FE0]/30 transition-all hover:from-[#6A4DF4] hover:to-[#8B5CF6]"
            >
              <Plus className="h-4 w-4" />

              <span>
                Submit Daily Work
              </span>
            </button>
          )}

        </div>
      </div>

      {/* ====================================================== */}
      {/* ERROR */}
      {/* ====================================================== */}

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">

          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

            <p className="text-xs text-red-300">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 transition hover:text-red-300"
          >
            <XCircle className="h-4 w-4" />
          </button>

        </div>
      )}

      {/* ====================================================== */}
      {/* METRIC CARDS */}
      {/* ====================================================== */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        {/* Calls */}

        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#09081E] p-4">
          <div>
            <p className="text-[11px] font-medium text-gray-400">
              Calls Made
            </p>

            <h3 className="mt-1 text-2xl font-bold text-white">
              {totalCalls}
            </h3>

            <span className="text-[10px] font-medium text-purple-400">
              Sales outreach
            </span>
          </div>

          <div className="rounded-xl border border-[#5C3FE0]/20 bg-[#5C3FE0]/15 p-3 text-[#A78BFA]">
            <PhoneCall className="h-5 w-5" />
          </div>
        </div>

        {/* Connected */}

        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#09081E] p-4">
          <div>
            <p className="text-[11px] font-medium text-gray-400">
              Calls Connected
            </p>

            <h3 className="mt-1 text-2xl font-bold text-white">
              {totalConnected}
            </h3>

            <span className="text-[10px] font-medium text-cyan-400">
              Successful connections
            </span>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-400">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        {/* Hot Leads */}

        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#09081E] p-4">
          <div>
            <p className="text-[11px] font-medium text-gray-400">
              Responded Well
            </p>

            <h3 className="mt-1 text-2xl font-bold text-emerald-400">
              {totalHotLeads}
            </h3>

            <span className="text-[10px] font-medium text-emerald-500">
              Positive responses
            </span>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-400">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        {/* Follow Ups */}

        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#09081E] p-4">
          <div>
            <p className="text-[11px] font-medium text-gray-400">
              Follow-ups
            </p>

            <h3 className="mt-1 text-2xl font-bold text-white">
              {totalFollowUps}
            </h3>

            <span className="text-[10px] font-medium text-blue-400">
              Scheduled activities
            </span>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-400">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* ====================================================== */}
      {/* FILTERS */}
      {/* ====================================================== */}

      <div className="space-y-3 rounded-2xl border border-white/10 bg-[#09081E] p-4">

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 p-1">

            <button
              type="button"
              onClick={() =>
                setStatusFilter('all')
              }
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${statusFilter === 'all'
                ? 'bg-[#5C3FE0] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              All Reports
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter('Submitted')
              }
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${statusFilter === 'Submitted'
                ? 'bg-[#5C3FE0] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Submitted
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter('Reviewed')
              }
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${statusFilter === 'Reviewed'
                ? 'bg-[#5C3FE0] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Reviewed
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter('Rejected')
              }
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${statusFilter === 'Rejected'
                ? 'bg-[#5C3FE0] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Rejected
            </button>

          </div>

          <div className="flex flex-col gap-2 sm:flex-row">

            {/* Search */}

            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                placeholder="Search employee, branch, narration..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-8 pr-3 text-xs text-white placeholder-gray-500 outline-none focus:border-[#5C3FE0]"
              />
            </div>

            {/* Date */}

            <input
              type="date"
              value={selectedDate}
              onChange={(event) =>
                setSelectedDate(
                  event.target.value
                )
              }
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-[#5C3FE0]"
            />

            {selectedDate && (
              <button
                type="button"
                onClick={() =>
                  setSelectedDate('')
                }
                className="px-2 text-[11px] text-[#A78BFA] hover:underline"
              >
                Clear
              </button>
            )}

          </div>

        </div>

        {/* Management scope */}

        {isManagement && (
          <div className="flex items-center gap-2 border-t border-white/5 pt-3 text-[11px] text-gray-500">
            <Clock className="h-3.5 w-3.5" />

            {isBranchManager
              ? 'Showing reports for your assigned branch.'
              : selectedBranch?.id
                ? `Showing reports for ${selectedBranch.branchName}.`
                : 'Showing reports across your authorized tenant scope.'}
          </div>
        )}

      </div>

      {/* ====================================================== */}
      {/* LOADING */}
      {/* ====================================================== */}

      {isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-[#09081E] p-12 text-center">

          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#A78BFA]" />

          <p className="mt-3 text-sm font-semibold text-white">
            Loading daily work reports...
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Fetching the latest Sales reports.
          </p>

        </div>
      ) : filteredLogs.length === 0 ? (

        /* ==================================================== */
        /* EMPTY */
        /* ==================================================== */

        <div className="space-y-3 rounded-2xl border border-white/10 bg-[#09081E] p-12 text-center">

          <FileText className="mx-auto h-10 w-10 text-gray-500" />

          <h4 className="text-sm font-semibold text-white">
            No Sales Work Reports Found
          </h4>

          <p className="mx-auto max-w-md text-xs text-gray-400">
            {isSalesStaff
              ? 'You have not submitted a Sales Daily Work report matching the selected criteria.'
              : 'No Sales Daily Work reports match the selected criteria.'}
          </p>

          {isSalesStaff && (
            <button
              type="button"
              onClick={() =>
                setIsWorkLogModalOpen(true)
              }
              className="mx-auto mt-2 flex items-center gap-2 rounded-xl bg-[#5C3FE0] px-4 py-2 text-xs font-bold text-white shadow-lg transition hover:bg-[#6A4DF4]"
            >
              <Plus className="h-3.5 w-3.5" />

              Submit Report
            </button>
          )}

        </div>
      ) : (

        /* ==================================================== */
        /* REPORT FEED */
        /* ==================================================== */

        <div className="space-y-4">

          {filteredLogs.map((log) => {
            const isOwnReport =
              log.userId ===
              currentUser.id;

            const isPending =
              log.status === 'Submitted';

            const isReviewed =
              log.status === 'Reviewed';

            const isRejected =
              log.status === 'Rejected';

            const userName =
              log.userName ||
              'Unknown Employee';

            const employeeCode =
              log.user?.employeeCode ||
              '—';

            const designation =
              log.user?.designation ||
              '—';

            const department =
              log.user?.department ||
              '—';

            const avatarUrl =
              log.user?.avatarUrl || '';

            const branchName =
              log.branchName ||
              'Unknown Branch';

            const branchCity =
              log.branch?.city || null;

            return (
              <div
                key={log.id}
                className={`rounded-2xl border bg-[#09081E] p-5 transition-all ${isOwnReport
                  ? 'border-[#5C3FE0]/40 bg-[#0c092a]'
                  : 'border-white/10 hover:border-white/20'
                  }`}
              >

                {/* ================================================== */}
                {/* REPORT HEADER */}
                {/* ================================================== */}

                <div className="flex flex-col gap-3 border-b border-white/5 pb-3 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-center gap-3">

                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={userName}
                        className="h-10 w-10 rounded-full border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#5C3FE0]/20 text-sm font-bold text-[#A78BFA]">
                        {userName
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}

                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <h4 className="text-sm font-bold text-white">
                          {userName}
                        </h4>

                        <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-gray-400">
                          {employeeCode}
                        </span>

                        {isOwnReport && (
                          <span className="rounded border border-[#5C3FE0]/30 bg-[#5C3FE0]/20 px-2 py-0.5 text-[10px] font-semibold text-[#A78BFA]">
                            You
                          </span>
                        )}

                      </div>

                      <p className="text-xs text-gray-400">
                        {designation}
                        {' • '}
                        <span className="text-gray-300">
                          {department}
                        </span>
                      </p>

                      <p className="mt-0.5 text-[10px] text-gray-500">
                        {branchName}
                        {branchCity
                          ? ` • ${branchCity}`
                          : ''}
                      </p>

                    </div>
                  </div>

                  <div className="flex items-center gap-3">

                    <div className="text-right">

                      <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-gray-300">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />

                        <span>
                          {log.workDate}
                        </span>
                      </div>

                      <span className="text-[10px] text-gray-500">
                        {new Date(
                          log.createdAtUtc
                        ).toLocaleString()}
                      </span>

                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${isReviewed
                        ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                        : isRejected
                          ? 'border-red-500/30 bg-red-500/15 text-red-400'
                          : 'border-amber-500/30 bg-amber-500/15 text-amber-400'
                        }`}
                    >
                      {log.status}
                    </span>

                  </div>
                </div>

                {/* ================================================== */}
                {/* SALES METRICS */}
                {/* ================================================== */}

                <div className="space-y-3 py-3.5">

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

                    {/* Calls Made */}

                    <div className="rounded-xl border border-white/5 bg-black/40 p-2.5">
                      <span className="block text-[10px] text-gray-400">
                        Calls Made
                      </span>

                      <span className="text-base font-bold text-white">
                        {log.callsMade ?? 0}
                      </span>
                    </div>

                    {/* Connected */}

                    <div className="rounded-xl border border-white/5 bg-black/40 p-2.5">
                      <span className="block text-[10px] text-gray-400">
                        Connected
                      </span>

                      <span className="text-base font-bold text-[#A78BFA]">
                        {log.callsConnected ?? 0}
                      </span>
                    </div>

                    {/* Responded */}

                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5">
                      <span className="block text-[10px] text-emerald-400">
                        Responded Well
                      </span>

                      <span className="text-base font-bold text-emerald-400">
                        {log.leadsRespondedWell ?? 0}
                      </span>
                    </div>

                    {/* Follow Ups */}

                    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2.5">
                      <span className="block text-[10px] text-cyan-400">
                        Follow-ups
                      </span>

                      <span className="text-base font-bold text-cyan-300">
                        {log.followUpsScheduled ?? 0}
                      </span>
                    </div>

                  </div>

                  {/* ================================================== */}
                  {/* NARRATION */}
                  {/* ================================================== */}

                  <div className="space-y-1 rounded-xl border border-white/5 bg-black/40 p-3.5">

                    <p className="text-[11px] font-semibold text-gray-400">
                      Daily Work Narration
                    </p>

                    <p className="whitespace-pre-line text-xs leading-relaxed text-gray-200">
                      {log.narration}
                    </p>

                  </div>

                  {/* ================================================== */}
                  {/* MANAGER NOTES */}
                  {/* ================================================== */}

                  {log.managerNotes && (
                    <div
                      className={`flex items-start gap-2.5 rounded-xl border p-3 ${isRejected
                        ? 'border-red-500/20 bg-red-500/10'
                        : 'border-emerald-500/20 bg-emerald-500/10'
                        }`}
                    >

                      {isRejected ? (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      ) : (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      )}

                      <div className="text-xs">

                        <span
                          className={`font-semibold ${isRejected
                            ? 'text-red-300'
                            : 'text-emerald-300'
                            }`}
                        >
                          Management Review:{' '}
                        </span>

                        <span className="text-gray-200">
                          {log.managerNotes}
                        </span>

                      </div>
                    </div>
                  )}

                  {/* ================================================== */}
                  {/* MANAGEMENT ACTIONS */}
                  {/* ================================================== */}

                  {isManagement &&
                    isPending && (
                      <div className="pt-2">

                        {feedbackLogId ===
                          log.id ? (
                          <div className="space-y-2 rounded-xl border border-[#5C3FE0]/40 bg-black/60 p-3">

                            <label className="block text-[11px] font-semibold text-[#A78BFA]">
                              Management Review
                            </label>

                            <textarea
                              rows={3}
                              value={feedbackText}
                              onChange={(event) =>
                                setFeedbackText(
                                  event.target.value
                                )
                              }
                              placeholder="Enter your review or feedback..."
                              disabled={
                                reviewingLogId ===
                                log.id
                              }
                              className="w-full rounded-lg border border-white/15 bg-black/80 px-3 py-2 text-xs text-white outline-none focus:border-[#5C3FE0]"
                            />

                            <div className="flex items-center justify-end gap-2">

                              <button
                                type="button"
                                onClick={() => {
                                  setFeedbackLogId(
                                    null
                                  );
                                  setFeedbackText(
                                    ''
                                  );
                                }}
                                disabled={
                                  reviewingLogId ===
                                  log.id
                                }
                                className="px-3 py-1.5 text-xs text-gray-400 transition hover:text-white"
                              >
                                Cancel
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleFeedbackSubmit(
                                    log.id
                                  )
                                }
                                disabled={
                                  !feedbackText.trim() ||
                                  reviewingLogId ===
                                  log.id
                                }
                                className="flex items-center gap-1.5 rounded-lg bg-[#5C3FE0] px-4 py-1.5 text-xs font-bold text-white shadow transition hover:bg-[#6A4DF4] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Send className="h-3 w-3" />

                                {reviewingLogId ===
                                  log.id
                                  ? 'Submitting...'
                                  : 'Submit Review'}
                              </button>

                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-2">

                            <div className="flex flex-wrap items-center gap-2">

                              {/* Quick Review */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickReview(
                                    log.id
                                  )
                                }
                                disabled={
                                  reviewingLogId ===
                                  log.id
                                }
                                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Check className="h-3.5 w-3.5 text-emerald-400" />

                                {reviewingLogId ===
                                  log.id
                                  ? 'Reviewing...'
                                  : 'Quick Review'}
                              </button>

                              {/* Feedback */}

                              <button
                                type="button"
                                onClick={() => {
                                  setFeedbackLogId(
                                    log.id
                                  );
                                  setFeedbackText(
                                    ''
                                  );
                                }}
                                disabled={
                                  reviewingLogId ===
                                  log.id
                                }
                                className="flex items-center gap-1.5 rounded-lg border border-[#5C3FE0]/40 bg-[#5C3FE0]/20 px-3 py-1.5 text-[11px] font-semibold text-[#A78BFA] transition hover:bg-[#5C3FE0]/30 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />

                                Add Feedback
                              </button>

                              {/* Reject */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleReject(
                                    log.id
                                  )
                                }
                                disabled={
                                  reviewingLogId ===
                                  log.id
                                }
                                className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <XCircle className="h-3.5 w-3.5" />

                                Reject
                              </button>

                            </div>

                            <span className="text-[10px] text-gray-500">
                              Awaiting management review
                            </span>

                          </div>
                        )}

                      </div>
                    )}

                </div>
              </div>
            );
          })}

        </div>
      )}

    </div>
  );
};