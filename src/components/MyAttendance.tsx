import React, { useMemo, useState } from 'react';
import {
  CalendarCheck,
  Clock,
  LogIn,
  LogOut,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
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

  const [actionLoading, setActionLoading] = useState<
    'check-in' | 'check-out' | null
  >(null);

  const [actionError, setActionError] = useState<string | null>(
    null,
  );

  const [actionSuccess, setActionSuccess] = useState<string | null>(
    null,
  );

  if (!currentUser) {
    return (
      <div className="p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/70 text-xs text-slate-400">
        Loading attendance...
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  const todayRecord = useMemo(() => {
    return attendanceRecords.find(
      (record) =>
        record.userId === currentUser.userId &&
        record.date === today,
    );
  }, [
    attendanceRecords,
    currentUser.userId,
    today,
  ]);

  const calculateHours = (
    checkInTime: string | null,
    checkOutTime: string | null,
  ) => {
    if (!checkInTime || !checkOutTime) {
      return null;
    }

    const start = new Date(
      `1970-01-01T${checkInTime}`,
    );

    const end = new Date(
      `1970-01-01T${checkOutTime}`,
    );

    const difference =
      end.getTime() - start.getTime();

    if (difference < 0) {
      return null;
    }

    return difference / (1000 * 60 * 60);
  };

  const formatTime = (
    value: string | null,
  ) => {
    if (!value) {
      return '—';
    }

    return value.substring(0, 5);
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

  const handleRefresh = async () => {
    setActionError(null);
    setActionSuccess(null);

    await loadAttendance({
      userId: currentUser.userId,
    });
  };

  const handleCheckIn = async () => {
    try {
      setActionLoading('check-in');
      setActionError(null);
      setActionSuccess(null);

      const response = await checkIn({
        date: today,
      });

      setActionSuccess(
        response.message || 'Check-in successful.',
      );

      await loadAttendance({
        userId: currentUser.userId,
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

  const handleCheckOut = async () => {
    try {
      setActionLoading('check-out');
      setActionError(null);
      setActionSuccess(null);

      const response = await checkOut({
        date: today,
      });

      setActionSuccess(
        response.message || 'Check-out successful.',
      );

      await loadAttendance({
        userId: currentUser.userId,
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

  const workedHours = todayRecord
    ? calculateHours(
        todayRecord.checkInTime,
        todayRecord.checkOutTime,
      )
    : null;

  const canCheckIn =
    !todayRecord?.checkInTime &&
    actionLoading === null;

  const canCheckOut =
    !!todayRecord?.checkInTime &&
    !todayRecord?.checkOutTime &&
    actionLoading === null;

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

        {/* Status */}

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

        {/* Check In */}

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

        </div>

        {/* Check Out */}

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

        </div>

        {/* Hours */}

        <div className="p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/80">

          <div className="flex items-center justify-between">

            <span className="text-[10px] text-slate-500 uppercase font-semibold">
              Worked Hours
            </span>

            <Clock className="w-4 h-4 text-purple-400" />

          </div>

          <div className="mt-3">

            <span className="text-lg font-mono font-bold text-white">
              {workedHours !== null
                ? `${workedHours.toFixed(2)} hrs`
                : '—'}
            </span>

          </div>

          <div className="mt-2 text-[10px] text-slate-500">
            Overtime:{' '}
            <span className="text-purple-300 font-mono">
              {todayRecord
                ? `${Number(
                    todayRecord.overtimeHours,
                  ).toFixed(2)} hrs`
                : '—'}
            </span>
          </div>

        </div>

      </div>

      {/* ============================================================
          ATTENDANCE HISTORY
      ============================================================ */}

      <div className="rounded-2xl border border-[#2d2770]/80 bg-[#09071e] overflow-hidden">

        <div className="flex items-center justify-between p-4 border-b border-[#231e54]">

          <div>
            <h3 className="text-sm font-bold text-white">
              Attendance History
            </h3>

            <p className="text-[10px] text-slate-500 mt-1">
              Your attendance records from the backend.
            </p>
          </div>

          <span className="px-2 py-1 rounded-lg bg-[#140f3d] border border-[#2d2770] text-[10px] text-[#A78BFA] font-mono">
            {attendanceRecords.length} Records
          </span>

        </div>

        {attendanceLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Loading attendance...
          </div>
        ) : attendanceRecords.length === 0 ? (
          <div className="p-8 text-center">

            <CalendarCheck className="w-7 h-7 mx-auto text-slate-600 mb-2" />

            <p className="text-xs text-slate-400">
              No attendance records found.
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
                  (record) => {

                    const hours =
                      calculateHours(
                        record.checkInTime,
                        record.checkOutTime,
                      );

                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-[#140f3d]/60 transition-colors"
                      >

                        <td className="p-3.5 font-mono text-slate-300">
                          {record.date}
                        </td>

                        <td className="p-3.5 text-slate-300">
                          {record.branchName || '—'}
                        </td>

                        <td className="p-3.5 font-mono text-emerald-400">
                          {formatTime(
                            record.checkInTime,
                          )}
                        </td>

                        <td className="p-3.5 font-mono text-cyan-400">
                          {formatTime(
                            record.checkOutTime,
                          )}
                        </td>

                        <td className="p-3.5 font-mono text-white">
                          {hours !== null
                            ? `${hours.toFixed(2)} hrs`
                            : '—'}
                        </td>

                        <td className="p-3.5 font-mono text-purple-300">
                          {Number(
                            record.overtimeHours,
                          ).toFixed(2)}{' '}
                          hrs
                        </td>

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
                    );
                  },
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
};