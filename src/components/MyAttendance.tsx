import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck,
  Clock,
  LogIn,
  LogOut,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Filter,
  RotateCcw,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import {
  checkIn,
  checkOut,
} from '../api/attendance';
import { AttendanceStatus } from '../types/attendance';

export const MyAttendance: React.FC = () => {
  const {
    currentUser,
    attendanceRecords,
    attendanceLoading,
    attendanceError,
    loadAttendance,
  } = useApp();

  // ============================================================
  // DATE HELPERS
  // ============================================================

  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1,
    ).padStart(2, '0');

    const day = String(
      date.getDate(),
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const today = formatLocalDate(new Date());

  const defaultFromDate = useMemo(() => {
    const date = new Date();

    date.setDate(
      date.getDate() - 7,
    );

    return formatLocalDate(date);
  }, []);

  // ============================================================
  // HISTORY FILTER
  // ============================================================

  const [fromDate, setFromDate] =
    useState<string>(defaultFromDate);

  const [toDate, setToDate] =
    useState<string>(today);

  const [appliedFromDate, setAppliedFromDate] =
    useState<string>(defaultFromDate);

  const [appliedToDate, setAppliedToDate] =
    useState<string>(today);

  const [filterError, setFilterError] =
    useState<string | null>(null);

  // ============================================================
  // ACTION STATE
  // ============================================================

  const [actionLoading, setActionLoading] = useState<
    'check-in' | 'check-out' | null
  >(null);

  const [actionError, setActionError] =
    useState<string | null>(null);

  const [actionSuccess, setActionSuccess] =
    useState<string | null>(null);

  // ============================================================
  // TODAY'S RECORD
  // ============================================================

  /*
   * The selected history range is independent from today's
   * check-in/check-out area.
   *
   * We therefore identify today's record from the loaded data.
   *
   * With the default range, today is always included.
   */
  const todayRecord = useMemo(() => {
    if (!currentUser) {
      return undefined;
    }

    return attendanceRecords.find(
      (record) =>
        record.userId === currentUser.userId &&
        record.date === today,
    );
  }, [
    attendanceRecords,
    currentUser,
    today,
  ]);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    loadAttendance({
      userId: currentUser.userId,
      fromDate: defaultFromDate,
      toDate: today,
    });
  }, [
    currentUser?.userId,
  ]);

  // ============================================================
  // FORMATTERS
  // ============================================================

  const formatTime = (
    value: string | null,
  ) => {
    if (!value) {
      return '—';
    }

    return value.substring(0, 5);
  };

  const formatHours = (
    value: number | null | undefined,
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return '—';
    }

    return `${Number(value).toFixed(2)} hrs`;
  };

  const getStatusBadge = (
    status: AttendanceStatus,
  ) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

      case 'Late':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';

      case 'HalfDay':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';

      case 'Absent':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';

      case 'OnLeave':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';

      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  // ============================================================
  // APPLY FILTER
  // ============================================================

  const handleApplyFilter = async () => {
    if (!currentUser) {
      return;
    }

    setFilterError(null);
    setActionError(null);
    setActionSuccess(null);

    if (!fromDate || !toDate) {
      setFilterError(
        'Please select both From Date and To Date.',
      );

      return;
    }

    if (fromDate > toDate) {
      setFilterError(
        'From Date cannot be later than To Date.',
      );

      return;
    }

    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);

    await loadAttendance({
      userId: currentUser.userId,
      fromDate,
      toDate,
    });
  };

  // ============================================================
  // RESET FILTER
  // ============================================================

  const handleResetFilter = async () => {
    if (!currentUser) {
      return;
    }

    setFilterError(null);
    setActionError(null);
    setActionSuccess(null);

    const resetFromDate = defaultFromDate;
    const resetToDate = today;

    setFromDate(resetFromDate);
    setToDate(resetToDate);

    setAppliedFromDate(resetFromDate);
    setAppliedToDate(resetToDate);

    await loadAttendance({
      userId: currentUser.userId,
      fromDate: resetFromDate,
      toDate: resetToDate,
    });
  };

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = async () => {
    if (!currentUser) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    setFilterError(null);

    await loadAttendance({
      userId: currentUser.userId,
      fromDate: appliedFromDate,
      toDate: appliedToDate,
    });
  };

  // ============================================================
  // CHECK IN
  // ============================================================

  const handleCheckIn = async () => {
    if (!currentUser) {
      return;
    }

    try {
      setActionLoading('check-in');
      setActionError(null);
      setActionSuccess(null);

      /*
       * Backend uses the current server time.
       *
       * No check-in time is sent from frontend.
       */
      const response = await checkIn({
        date: today,
      });

      setActionSuccess(
        response.message ||
          'Check-in successful.',
      );

      /*
       * Reload the currently selected history range.
       *
       * Default range contains today.
       */
      await loadAttendance({
        userId: currentUser.userId,
        fromDate: appliedFromDate,
        toDate: appliedToDate,
      });
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Failed to check in.',
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // CHECK OUT
  // ============================================================

  const handleCheckOut = async () => {
    if (!currentUser) {
      return;
    }

    try {
      setActionLoading('check-out');
      setActionError(null);
      setActionSuccess(null);

      /*
       * Backend uses the current server time.
       *
       * No check-out time is sent from frontend.
       */
      const response = await checkOut({
        date: today,
      });

      setActionSuccess(
        response.message ||
          'Check-out successful.',
      );

      await loadAttendance({
        userId: currentUser.userId,
        fromDate: appliedFromDate,
        toDate: appliedToDate,
      });
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Failed to check out.',
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // CHECK-IN / CHECK-OUT PERMISSIONS
  // ============================================================

  const canCheckIn =
    !todayRecord?.checkInTime &&
    actionLoading === null;

  const canCheckOut =
    !!todayRecord?.checkInTime &&
    !todayRecord?.checkOutTime &&
    actionLoading === null;

  // ============================================================
  // NO USER
  // ============================================================

  if (!currentUser) {
    return (
      <div className="p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/70 text-xs text-slate-400">
        Loading attendance...
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="space-y-5">

      {/* ============================================================
          EMPLOYEE HEADER
      ============================================================ */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        <div>
          <h2 className="text-base font-bold text-white">
            My Attendance
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            View your attendance and manage today's
            check-in and check-out.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={attendanceLoading}
          className="px-3 py-2 rounded-xl bg-[#140f3d] hover:bg-[#1f175a] border border-[#2d2770] text-slate-200 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              attendanceLoading
                ? 'animate-spin'
                : ''
            }`}
          />

          Refresh
        </button>

      </div>

      {/* ============================================================
          ERRORS / SUCCESS
      ============================================================ */}

      {(actionError || attendanceError) && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">

          <AlertCircle className="w-4 h-4 shrink-0" />

          <span>
            {actionError || attendanceError}
          </span>

        </div>
      )}

      {filterError && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">

          <AlertCircle className="w-4 h-4 shrink-0" />

          <span>
            {filterError}
          </span>

        </div>
      )}

      {actionSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">

          <CheckCircle2 className="w-4 h-4" />

          {actionSuccess}

        </div>
      )}

      {/* ============================================================
          TODAY'S ATTENDANCE
      ============================================================ */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* STATUS */}

        <div className="p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/80">

          <div className="flex items-center justify-between">

            <span className="text-[10px] text-slate-500 uppercase font-semibold">
              Today's Status
            </span>

            <CalendarCheck className="w-4 h-4 text-[#A78BFA]" />

          </div>

          <div className="mt-3">

            {todayRecord ? (
              <span
                className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getStatusBadge(
                  todayRecord.status,
                )}`}
              >
                {todayRecord.status}
              </span>
            ) : (
              <span className="text-sm font-semibold text-slate-400">
                Not marked
              </span>
            )}

          </div>

          <p className="text-[10px] text-slate-500 mt-2 font-mono">
            {today}
          </p>

        </div>

        {/* CHECK IN */}

        <div className="p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/80">

          <div className="flex items-center justify-between">

            <span className="text-[10px] text-slate-500 uppercase font-semibold">
              Check In
            </span>

            <LogIn className="w-4 h-4 text-emerald-400" />

          </div>

          <div className="mt-3">

            <span className="text-lg font-mono font-bold text-emerald-400">
              {formatTime(
                todayRecord?.checkInTime ?? null,
              )}
            </span>

          </div>

          <button
            type="button"
            onClick={handleCheckIn}
            disabled={!canCheckIn}
            className="mt-3 w-full px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >

            {actionLoading === 'check-in' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Checking In...
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                Check In
              </>
            )}

          </button>

          <p className="text-[9px] text-slate-600 mt-2 text-center">
            Time is recorded automatically
          </p>

        </div>

        {/* CHECK OUT */}

        <div className="p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/80">

          <div className="flex items-center justify-between">

            <span className="text-[10px] text-slate-500 uppercase font-semibold">
              Check Out
            </span>

            <LogOut className="w-4 h-4 text-cyan-400" />

          </div>

          <div className="mt-3">

            <span className="text-lg font-mono font-bold text-cyan-400">
              {formatTime(
                todayRecord?.checkOutTime ?? null,
              )}
            </span>

          </div>

          <button
            type="button"
            onClick={handleCheckOut}
            disabled={!canCheckOut}
            className="mt-3 w-full px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >

            {actionLoading === 'check-out' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Checking Out...
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                Check Out
              </>
            )}

          </button>

          <p className="text-[9px] text-slate-600 mt-2 text-center">
            Time is recorded automatically
          </p>

        </div>

        {/* HOURS */}

        <div className="p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/80">

          <div className="flex items-center justify-between">

            <span className="text-[10px] text-slate-500 uppercase font-semibold">
              Worked Hours
            </span>

            <Clock className="w-4 h-4 text-purple-400" />

          </div>

          <div className="mt-3">

            <span className="text-lg font-mono font-bold text-white">
              {todayRecord
                ? formatHours(
                    todayRecord.workedHours,
                  )
                : '—'}
            </span>

          </div>

          <div className="mt-2 text-[10px] text-slate-500">

            Overtime:{' '}

            <span className="text-purple-300 font-mono">
              {todayRecord
                ? formatHours(
                    todayRecord.overtimeHours,
                  )
                : '—'}
            </span>

          </div>

          {todayRecord && (
            <div className="mt-1 text-[10px] text-slate-500">

              Required:{' '}

              <span className="text-slate-300 font-mono">
                {formatHours(
                  todayRecord.requiredHours,
                )}
              </span>

            </div>
          )}

        </div>

      </div>

      {/* ============================================================
          TODAY'S DETAILS
      ============================================================ */}

      {todayRecord && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* WORK SCHEDULE */}

          <div className="p-4 rounded-2xl bg-[#09071e] border border-[#2d2770]/80">

            <div className="text-[10px] text-slate-500 uppercase font-semibold mb-3">
              Work Schedule
            </div>

            <div className="flex items-center justify-between text-xs">

              <span className="text-slate-400">
                Schedule
              </span>

              <span className="text-white font-mono">
                {formatTime(
                  todayRecord.scheduledStartTime,
                )}
                {' – '}
                {formatTime(
                  todayRecord.scheduledEndTime,
                )}
              </span>

            </div>

            <div className="flex items-center justify-between text-xs mt-2">

              <span className="text-slate-400">
                Required
              </span>

              <span className="text-white font-mono">
                {formatHours(
                  todayRecord.requiredHours,
                )}
              </span>

            </div>

            <div className="flex items-center justify-between text-xs mt-2">

              <span className="text-slate-400">
                Source
              </span>

              <span className="text-[#A78BFA] font-semibold">
                {todayRecord.scheduleSource}
              </span>

            </div>

          </div>

        </div>
      )}

      {/* ============================================================
          ATTENDANCE HISTORY
      ============================================================ */}

      <div className="rounded-2xl border border-[#2d2770]/80 bg-[#09071e] overflow-hidden">

        {/* ==========================================================
            HISTORY HEADER
        ========================================================== */}

        <div className="p-4 border-b border-[#231e54]">

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

            <div>

              <div className="flex items-center gap-2">

                <CalendarCheck className="w-4 h-4 text-[#A78BFA]" />

                <h3 className="text-sm font-bold text-white">
                  Attendance History
                </h3>

              </div>

              <p className="text-[10px] text-slate-500 mt-1">
                View your attendance records for the selected date range.
              </p>

            </div>

            <span className="self-start lg:self-auto px-2 py-1 rounded-lg bg-[#140f3d] border border-[#2d2770] text-[10px] text-[#A78BFA] font-mono">
              {attendanceRecords.length} Records
            </span>

          </div>

          {/* ========================================================
              DATE FILTER
          ======================================================== */}

          <div className="mt-4 p-3 rounded-xl bg-[#0e0b2e] border border-[#2d2770]/70">

            <div className="flex items-center gap-2 mb-3">

              <Filter className="w-3.5 h-3.5 text-[#A78BFA]" />

              <span className="text-[10px] uppercase font-bold text-slate-400">
                Filter Attendance History
              </span>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

              {/* FROM DATE */}

              <div>

                <label className="block text-[10px] text-slate-500 mb-1.5">
                  From Date
                </label>

                <input
                  type="date"
                  value={fromDate}
                  max={toDate || today}
                  onChange={(event) =>
                    setFromDate(
                      event.target.value,
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#09071e] border border-[#2d2770] text-xs text-white outline-none focus:border-[#5C3FE0] [color-scheme:dark]"
                />

              </div>

              {/* TO DATE */}

              <div>

                <label className="block text-[10px] text-slate-500 mb-1.5">
                  To Date
                </label>

                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  max={today}
                  onChange={(event) =>
                    setToDate(
                      event.target.value,
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#09071e] border border-[#2d2770] text-xs text-white outline-none focus:border-[#5C3FE0] [color-scheme:dark]"
                />

              </div>

              {/* APPLY */}

              <div className="flex items-end">

                <button
                  type="button"
                  onClick={handleApplyFilter}
                  disabled={
                    attendanceLoading
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#5C3FE0] hover:bg-[#684bea] text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >

                  {attendanceLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Filter className="w-3.5 h-3.5" />
                  )}

                  Apply Filter

                </button>

              </div>

              {/* RESET */}

              <div className="flex items-end">

                <button
                  type="button"
                  onClick={handleResetFilter}
                  disabled={
                    attendanceLoading
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#140f3d] hover:bg-[#1f175a] border border-[#2d2770] text-slate-300 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >

                  <RotateCcw className="w-3.5 h-3.5" />

                  Reset

                </button>

              </div>

            </div>

            <div className="mt-2 text-[9px] text-slate-600">
              Showing records from{' '}
              <span className="text-slate-400 font-mono">
                {appliedFromDate}
              </span>{' '}
              to{' '}
              <span className="text-slate-400 font-mono">
                {appliedToDate}
              </span>
            </div>

          </div>

        </div>

        {/* ==========================================================
            HISTORY CONTENT
        ========================================================== */}

        {attendanceLoading ? (

          <div className="p-8 text-center text-xs text-slate-500">

            <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-[#A78BFA]" />

            Loading attendance...

          </div>

        ) : attendanceRecords.length === 0 ? (

          <div className="p-8 text-center">

            <CalendarCheck className="w-7 h-7 mx-auto text-slate-600 mb-2" />

            <p className="text-xs text-slate-400">
              No attendance records found for the selected date range.
            </p>

            <p className="text-[10px] text-slate-600 mt-1">
              Try selecting a different date range.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left text-xs">

              <thead className="bg-[#120e38] border-b border-[#231e54] text-slate-400">

                <tr>

                  <th className="p-3.5">
                    Date
                  </th>

                  <th className="p-3.5">
                    Branch
                  </th>

                  <th className="p-3.5">
                    Schedule
                  </th>

                  <th className="p-3.5">
                    Check In
                  </th>

                  <th className="p-3.5">
                    Check Out
                  </th>

                  <th className="p-3.5">
                    Hours
                  </th>

                  <th className="p-3.5">
                    Overtime
                  </th>

                  <th className="p-3.5">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-[#1c164a]/60">

                {attendanceRecords.map(
                  (record) => (

                    <tr
                      key={record.id}
                      className="hover:bg-[#140f3d]/60 transition-colors"
                    >

                      {/* DATE */}

                      <td className="p-3.5 font-mono text-slate-300">
                        {record.date}
                      </td>

                      {/* BRANCH */}

                      <td className="p-3.5 text-slate-300">
                        {record.branchName || '—'}
                      </td>

                      {/* SCHEDULE */}

                      <td className="p-3.5">

                        <div className="font-mono text-slate-300">

                          {formatTime(
                            record.scheduledStartTime,
                          )}

                          {' – '}

                          {formatTime(
                            record.scheduledEndTime,
                          )}

                        </div>

                        <div className="text-[9px] text-slate-600 mt-1">
                          {record.scheduleSource}
                        </div>

                      </td>

                      {/* CHECK IN */}

                      <td className="p-3.5 font-mono text-emerald-400">
                        {formatTime(
                          record.checkInTime,
                        )}
                      </td>

                      {/* CHECK OUT */}

                      <td className="p-3.5 font-mono text-cyan-400">
                        {formatTime(
                          record.checkOutTime,
                        )}
                      </td>

                      {/* HOURS */}

                      <td className="p-3.5 font-mono text-white">
                        {formatHours(
                          record.workedHours,
                        )}
                      </td>

                      {/* OVERTIME */}

                      <td className="p-3.5 font-mono text-purple-300">
                        {formatHours(
                          record.overtimeHours,
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="p-3.5">

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(
                            record.status,
                          )}`}
                        >
                          {record.status}
                        </span>

                      </td>

                    </tr>

                  ),
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
};