import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AlertCircle,
  CalendarDays,
  Clock3,
  Filter,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  UserCheck,
  X,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import {
  AttendanceRecord,
  AttendanceStatus,
} from '../types/attendance';
import {
  getAttendance,
  updateAttendance,
} from '../api/attendance';

const STATUS_OPTIONS: AttendanceStatus[] = [
  'Present',
  'Late',
  'HalfDay',
  'Absent',
  'OnLeave',
];

/*
 * ============================================================
 * TIME HELPERS
 * ============================================================
 *
 * Backend TimeOnly values may come as:
 *
 *   09:00:00
 *
 * Attendance UI displays:
 *
 *   09:00
 *
 * This also protects the UI if the API returns null.
 */
function formatTime(
  time: string | null | undefined,
): string {
  if (!time) return '--';

  return time.length >= 5
    ? time.substring(0, 5)
    : time;
}

/*
 * ============================================================
 * WORKED HOURS
 * ============================================================
 */

function calculateWorkedHours(
  record: AttendanceRecord,
): number | null {
  if (
    !record.checkInTime ||
    !record.checkOutTime
  ) {
    return null;
  }

  const [
    inHour,
    inMinute,
    inSecond = 0,
  ] = record.checkInTime
    .split(':')
    .map(Number);

  const [
    outHour,
    outMinute,
    outSecond = 0,
  ] = record.checkOutTime
    .split(':')
    .map(Number);

  const checkIn =
    inHour * 3600 +
    inMinute * 60 +
    inSecond;

  const checkOut =
    outHour * 3600 +
    outMinute * 60 +
    outSecond;

  const seconds =
    checkOut - checkIn;

  if (seconds < 0) {
    return null;
  }

  return Number(
    (seconds / 3600).toFixed(2),
  );
}

/*
 * ============================================================
 * STATUS COLORS
 * ============================================================
 */

function getStatusClasses(
  status: AttendanceStatus,
): string {
  switch (status) {
    case 'Present':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

    case 'Late':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';

    case 'HalfDay':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';

    case 'Absent':
      return 'bg-red-500/10 text-red-400 border-red-500/20';

    case 'OnLeave':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';

    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
}

/*
 * ============================================================
 * EDIT FORM
 * ============================================================
 */

interface EditFormState {
  checkInTime: string;
  checkOutTime: string;
  status: AttendanceStatus;
  overtimeHours: string;
  biometricDeviceId: string;
}

/*
 * ============================================================
 * API TIME FORMATTER
 * ============================================================
 *
 * HTML <input type="time"> gives:
 *
 *   HH:mm
 *
 * ASP.NET TimeOnly expects:
 *
 *   HH:mm:ss
 *
 * Therefore convert only when sending data to the API.
 */
function timeForApi(
  value: string,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return value.length === 5
    ? `${value}:00`
    : value;
}

export const AttendanceRecords: React.FC = () => {
  const {
    currentUser,
    attendanceRecords,
    attendanceLoading,
    attendanceError,
    loadAttendance,
  } = useApp();

  const [search, setSearch] =
    useState('');

  const [dateFilter, setDateFilter] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState<AttendanceStatus | ''>('');

  const [branchFilter, setBranchFilter] =
    useState('');

  const [
    editingRecord,
    setEditingRecord,
  ] = useState<AttendanceRecord | null>(
    null,
  );

  const [editForm, setEditForm] =
    useState<EditFormState>({
      checkInTime: '',
      checkOutTime: '',
      status: 'Present',
      overtimeHours: '0',
      biometricDeviceId: '',
    });

  const [saving, setSaving] =
    useState(false);

  const [actionError, setActionError] =
    useState<string | null>(null);

  /*
   * ============================================================
   * ROLE
   * ============================================================
   */

  const role =
    currentUser?.roleName
      ?.trim()
      .toLowerCase();

  const isEmployee =
    role === 'sales_staff';

  const isBranchManager =
    role === 'branch_manager';

  const isTenantManagement =
    role === 'company_admin' ||
    role === 'hr_ops';

  const isSuperAdmin =
    role === 'super_admin';

  const canEdit =
    isTenantManagement ||
    isBranchManager;

  /*
   * ============================================================
   * ATTENDANCE SCOPE
   * ============================================================
   *
   * IMPORTANT:
   *
   * Tenant and branch are determined from the
   * authenticated user / selected context.
   *
   * The backend must remain responsible for
   * authorization and tenant isolation.
   */

  const attendanceScope = useMemo(() => {
    /*
     * Employee:
     *
     * Only their own attendance.
     * Branch is included so backend can validate
     * the employee's branch scope.
     */
    if (isEmployee) {
      return {
        tenantId:
          currentUser?.tenantId ??
          undefined,

        branchId:
          currentUser?.branchId ??
          undefined,

        userId:
          currentUser?.userId ??
          undefined,
      };
    }

    /*
     * Branch manager:
     *
     * Only assigned tenant + branch.
     */
    if (isBranchManager) {
      return {
        tenantId:
          currentUser?.tenantId ??
          undefined,

        branchId:
          currentUser?.branchId ??
          undefined,

        userId: undefined,
      };
    }

    /*
     * Company Admin / HR Ops:
     *
     * Tenant-wide.
     *
     * branchId is intentionally not automatically
     * supplied because these users can have
     * branchId = null and can manage all branches.
     */
    if (isTenantManagement) {
      return {
        tenantId:
          currentUser?.tenantId ??
          undefined,

        branchId:
          branchFilter
            ? Number(branchFilter)
            : undefined,

        userId: undefined,
      };
    }

    /*
     * SuperAdmin:
     *
     * No forced tenant/branch scope here.
     *
     * If X-Tenant-Id is being used by AppContext/API
     * for tenant switching, backend will apply it.
     */
    if (isSuperAdmin) {
      return {
        tenantId: undefined,
        branchId: undefined,
        userId: undefined,
      };
    }

    return {
      tenantId: undefined,
      branchId: undefined,
      userId: undefined,
    };
  }, [
    currentUser,
    isEmployee,
    isBranchManager,
    isTenantManagement,
    isSuperAdmin,
    branchFilter,
  ]);

  /*
   * ============================================================
   * UNIQUE BRANCHES
   * ============================================================
   *
   * Branches are derived from records already loaded.
   *
   * This is only a UI filter.
   * Backend authorization remains authoritative.
   */

  const branches = useMemo(() => {
    const map = new Map<
      number,
      string
    >();

    attendanceRecords.forEach(
      (record) => {
        if (!map.has(record.branchId)) {
          map.set(
            record.branchId,
            record.branchName ||
              `Branch ${record.branchId}`,
          );
        }
      },
    );

    return Array.from(
      map.entries(),
    ).map(
      ([id, name]) => ({
        id,
        name,
      }),
    );
  }, [attendanceRecords]);

  /*
   * ============================================================
   * INITIAL LOAD
   * ============================================================
   */

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    /*
     * Company admin / HR ops:
     *
     * Load tenant-wide records initially.
     */
    const load = async () => {
      try {
        setActionError(null);

        if (isEmployee) {
          await loadAttendance({
            tenantId:
              currentUser.tenantId ??
              undefined,

            branchId:
              currentUser.branchId ??
              undefined,

            userId:
              currentUser.userId,
          });

          return;
        }

        if (isBranchManager) {
          await loadAttendance({
            tenantId:
              currentUser.tenantId ??
              undefined,

            branchId:
              currentUser.branchId ??
              undefined,
          });

          return;
        }

        if (isTenantManagement) {
          await loadAttendance({
            tenantId:
              currentUser.tenantId ??
              undefined,
          });

          return;
        }

        if (isSuperAdmin) {
          await loadAttendance();
        }
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : 'Failed to load attendance records.',
        );
      }
    };

    load();
  }, [
    currentUser,
    role,
    isEmployee,
    isBranchManager,
    isTenantManagement,
    isSuperAdmin,
    loadAttendance,
  ]);

  /*
   * ============================================================
   * FILTERED RECORDS
   * ============================================================
   */

  const filteredRecords =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return attendanceRecords.filter(
        (record) => {
          const matchesSearch =
            !searchValue ||
            record.userName
              ?.toLowerCase()
              .includes(searchValue) ||
            record.employeeCode
              ?.toLowerCase()
              .includes(searchValue) ||
            record.branchName
              ?.toLowerCase()
              .includes(searchValue);

          const matchesDate =
            !dateFilter ||
            record.date === dateFilter;

          const matchesStatus =
            !statusFilter ||
            record.status ===
              statusFilter;

          const matchesBranch =
            !branchFilter ||
            String(
              record.branchId,
            ) === branchFilter;

          return (
            matchesSearch &&
            matchesDate &&
            matchesStatus &&
            matchesBranch
          );
        },
      );
    }, [
      attendanceRecords,
      search,
      dateFilter,
      statusFilter,
      branchFilter,
    ]);

  /*
   * ============================================================
   * REFRESH
   * ============================================================
   */

  const handleRefresh =
    async () => {
      try {
        setActionError(null);

        /*
         * Employee
         */
        if (isEmployee) {
          await loadAttendance({
            tenantId:
              currentUser?.tenantId ??
              undefined,

            branchId:
              currentUser?.branchId ??
              undefined,

            userId:
              currentUser?.userId,
          });

          return;
        }

        /*
         * Branch manager
         */
        if (isBranchManager) {
          await loadAttendance({
            tenantId:
              currentUser?.tenantId ??
              undefined,

            branchId:
              currentUser?.branchId ??
              undefined,
          });

          return;
        }

        /*
         * Company admin / HR Ops
         *
         * Respect selected branch filter.
         */
        if (isTenantManagement) {
          await loadAttendance({
            tenantId:
              currentUser?.tenantId ??
              undefined,

            branchId:
              branchFilter
                ? Number(branchFilter)
                : undefined,
          });

          return;
        }

        /*
         * SuperAdmin
         */
        if (isSuperAdmin) {
          await loadAttendance();
        }
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : 'Failed to refresh attendance.',
        );
      }
    };

  /*
   * ============================================================
   * EDIT
   * ============================================================
   */

  const openEdit = (
    record: AttendanceRecord,
  ) => {
    setActionError(null);
    setEditingRecord(record);

    setEditForm({
      checkInTime:
        record.checkInTime
          ? record.checkInTime.substring(
              0,
              5,
            )
          : '',

      checkOutTime:
        record.checkOutTime
          ? record.checkOutTime.substring(
              0,
              5,
            )
          : '',

      status: record.status,

      overtimeHours: String(
        record.overtimeHours ?? 0,
      ),

      biometricDeviceId:
        record.biometricDeviceId ??
        '',
    });
  };

  /*
   * ============================================================
   * CLOSE EDIT
   * ============================================================
   */

  const closeEdit = () => {
    if (saving) {
      return;
    }

    setEditingRecord(null);

    setEditForm({
      checkInTime: '',
      checkOutTime: '',
      status: 'Present',
      overtimeHours: '0',
      biometricDeviceId: '',
    });
  };

  /*
   * ============================================================
   * SAVE
   * ============================================================
   */

  const handleSave =
    async () => {
      if (!editingRecord) {
        return;
      }

      try {
        setSaving(true);
        setActionError(null);

        /*
         * IMPORTANT:
         *
         * HTML input gives HH:mm.
         * Convert to HH:mm:ss before sending
         * to ASP.NET TimeOnly?.
         */
        await updateAttendance(
          editingRecord.id,
          {
            checkInTime:
              timeForApi(
                editForm.checkInTime,
              ),

            checkOutTime:
              timeForApi(
                editForm.checkOutTime,
              ),

            status:
              editForm.status,

            overtimeHours:
              editForm.overtimeHours ===
              ''
                ? undefined
                : Number(
                    editForm.overtimeHours,
                  ),

            biometricDeviceId:
              editForm
                .biometricDeviceId ||
              undefined,
          },
        );

        closeEdit();

        await handleRefresh();
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : 'Failed to update attendance.',
        );
      } finally {
        setSaving(false);
      }
    };

  /*
   * ============================================================
   * CLEAR FILTERS
   * ============================================================
   */

  const clearFilters = () => {
    setSearch('');
    setDateFilter('');
    setStatusFilter('');
    setBranchFilter('');
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="space-y-5">

      {/* =========================================================
          HEADER
      ========================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="flex items-center gap-2">

            <UserCheck className="w-5 h-5 text-[#A78BFA]" />

            <h2 className="text-lg font-semibold text-white">
              Attendance Records
            </h2>

          </div>

          <p className="mt-1 text-sm text-slate-400">
            View and manage employee attendance records
            according to tenant and branch access.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={attendanceLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2d2770] bg-[#0e0b2e] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-[#5C3FE0] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {attendanceLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}

          Refresh
        </button>

      </div>

      {/* =========================================================
          TENANT / BRANCH CONTEXT
      ========================================================= */}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

        <div className="rounded-2xl border border-[#2d2770]/70 bg-[#09071e] p-4">

          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Tenant
          </p>

          <p className="mt-1 text-sm font-semibold text-white">
            {currentUser?.tenantName ||
              'All Tenants'}
          </p>

        </div>

        <div className="rounded-2xl border border-[#2d2770]/70 bg-[#09071e] p-4">

          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Attendance Scope
          </p>

          <p className="mt-1 text-sm font-semibold text-white">

            {isEmployee
              ? currentUser?.branchName ||
                'Assigned Branch'
              : isBranchManager
                ? currentUser?.branchName ||
                  'Assigned Branch'
                : isTenantManagement
                  ? branchFilter
                    ? branches.find(
                        (branch) =>
                          String(
                            branch.id,
                          ) ===
                          branchFilter,
                      )?.name ||
                      'Selected Branch'
                    : 'All Branches'
                  : isSuperAdmin
                    ? 'System / Selected Tenant'
                    : 'Attendance'}
          </p>

        </div>

      </div>

      {/* =========================================================
          ERROR
      ========================================================= */}

      {(attendanceError ||
        actionError) && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">

          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <span>
            {actionError ||
              attendanceError}
          </span>

        </div>
      )}

      {/* =========================================================
          FILTERS
      ========================================================= */}

      <div className="rounded-2xl border border-[#2d2770]/70 bg-[#09071e] p-4">

        <div className="mb-4 flex items-center justify-between">

          <div className="flex items-center gap-2 text-sm font-medium text-white">

            <Filter className="h-4 w-4 text-[#A78BFA]" />

            Filters

          </div>

          {(search ||
            dateFilter ||
            statusFilter ||
            branchFilter) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-slate-400 transition hover:text-white"
            >
              Clear filters
            </button>
          )}

        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">

          {/* Search */}

          <div className="relative">

            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Employee, code or branch..."
              className="w-full rounded-xl border border-[#2d2770] bg-[#0e0b2e] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#5C3FE0]"
            />

          </div>

          {/* Date */}

          <div className="relative">

            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              type="date"
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-[#2d2770] bg-[#0e0b2e] py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-[#5C3FE0]"
            />

          </div>

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as
                  | AttendanceStatus
                  | '',
              )
            }
            className="rounded-xl border border-[#2d2770] bg-[#0e0b2e] px-3 py-2.5 text-sm text-white outline-none focus:border-[#5C3FE0]"
          >
            <option value="">
              All statuses
            </option>

            {STATUS_OPTIONS.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ),
            )}
          </select>

          {/* Branch */}

          <select
            value={branchFilter}
            onChange={(event) =>
              setBranchFilter(
                event.target.value,
              )
            }
            disabled={
              isEmployee ||
              isBranchManager
            }
            className="rounded-xl border border-[#2d2770] bg-[#0e0b2e] px-3 py-2.5 text-sm text-white outline-none focus:border-[#5C3FE0] disabled:cursor-not-allowed disabled:opacity-60"
          >

            <option value="">
              {isEmployee ||
              isBranchManager
                ? 'Assigned Branch'
                : 'All branches'}
            </option>

            {branches.map(
              (branch) => (
                <option
                  key={branch.id}
                  value={branch.id}
                >
                  {branch.name}
                </option>
              ),
            )}

          </select>

        </div>

      </div>

      {/* =========================================================
          SUMMARY
      ========================================================= */}

      <div className="flex items-center justify-between text-sm">

        <span className="text-slate-400">

          Showing{' '}

          <span className="font-medium text-white">
            {filteredRecords.length}
          </span>{' '}

          of{' '}

          <span className="font-medium text-white">
            {attendanceRecords.length}
          </span>{' '}

          records

        </span>

      </div>

      {/* =========================================================
          TABLE
      ========================================================= */}

      <div className="overflow-hidden rounded-2xl border border-[#2d2770]/70 bg-[#09071e]">

        <div className="overflow-x-auto">

          <table className="min-w-[1100px] w-full">

            <thead>

              <tr className="border-b border-[#2d2770]/70 bg-[#0e0b2e]">

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Employee
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Branch
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Date
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Check In
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Check Out
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Worked
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Overtime
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Status
                </th>

                {canEdit && (
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Action
                  </th>
                )}

              </tr>

            </thead>

            <tbody>

              {attendanceLoading &&
              attendanceRecords.length ===
                0 ? (

                <tr>

                  <td
                    colSpan={
                      canEdit
                        ? 9
                        : 8
                    }
                    className="px-4 py-12 text-center"
                  >

                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">

                      <Loader2 className="h-4 w-4 animate-spin" />

                      Loading attendance...

                    </div>

                  </td>

                </tr>

              ) : filteredRecords.length ===
                0 ? (

                <tr>

                  <td
                    colSpan={
                      canEdit
                        ? 9
                        : 8
                    }
                    className="px-4 py-12 text-center"
                  >

                    <div className="flex flex-col items-center gap-2">

                      <Clock3 className="h-8 w-8 text-slate-600" />

                      <p className="text-sm font-medium text-slate-300">
                        No attendance records found
                      </p>

                      <p className="text-xs text-slate-500">
                        Try changing the selected filters.
                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                filteredRecords.map(
                  (record) => {

                    const workedHours =
                      calculateWorkedHours(
                        record,
                      );

                    return (
                      <tr
                        key={record.id}
                        className="border-b border-[#2d2770]/40 last:border-b-0 hover:bg-[#0e0b2e]/70"
                      >

                        {/* Employee */}

                        <td className="px-4 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5C3FE0]/20 text-xs font-semibold text-[#C4B5FD]">

                              {record.userName
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                '?'}

                            </div>

                            <div>

                              <div className="text-sm font-medium text-white">
                                {record.userName}
                              </div>

                              <div className="text-xs text-slate-500">
                                {record.employeeCode ||
                                  `User #${record.userId}`}
                              </div>

                            </div>

                          </div>

                        </td>

                        {/* Branch */}

                        <td className="px-4 py-4 text-sm text-slate-300">
                          {record.branchName ||
                            `Branch ${record.branchId}`}
                        </td>

                        {/* Date */}

                        <td className="px-4 py-4 text-sm text-slate-300">
                          {record.date}
                        </td>

                        {/* Check In */}

                        <td className="px-4 py-4 text-sm text-slate-300">
                          {formatTime(
                            record.checkInTime,
                          )}
                        </td>

                        {/* Check Out */}

                        <td className="px-4 py-4 text-sm text-slate-300">
                          {formatTime(
                            record.checkOutTime,
                          )}
                        </td>

                        {/* Worked */}

                        <td className="px-4 py-4 text-sm text-slate-300">
                          {workedHours !==
                          null
                            ? `${workedHours.toFixed(
                                2,
                              )}h`
                            : '--'}
                        </td>

                        {/* Overtime */}

                        <td className="px-4 py-4 text-sm text-slate-300">
                          {Number(
                            record.overtimeHours ??
                              0,
                          ).toFixed(2)}
                          h
                        </td>

                        {/* Status */}

                        <td className="px-4 py-4">

                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                              record.status,
                            )}`}
                          >
                            {record.status}
                          </span>

                        </td>

                        {/* Action */}

                        {canEdit && (
                          <td className="px-4 py-4 text-right">

                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  record,
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#2d2770] bg-[#0e0b2e] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-[#5C3FE0] hover:text-white"
                            >

                              <Pencil className="h-3.5 w-3.5" />

                              Edit

                            </button>

                          </td>
                        )}

                      </tr>
                    );
                  },
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =========================================================
          EDIT MODAL
      ========================================================= */}

      {editingRecord && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="w-full max-w-lg rounded-2xl border border-[#2d2770] bg-[#09071e] shadow-2xl">

            {/* Header */}

            <div className="flex items-center justify-between border-b border-[#2d2770]/70 px-5 py-4">

              <div>

                <h3 className="text-base font-semibold text-white">
                  Edit Attendance
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  {editingRecord.userName}
                  {' · '}
                  {editingRecord.date}
                </p>

              </div>

              <button
                type="button"
                onClick={closeEdit}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-[#0e0b2e] hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* Body */}

            <div className="space-y-4 p-5">

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* Check In */}

                <div>

                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Check In
                  </label>

                  <input
                    type="time"
                    value={
                      editForm.checkInTime
                    }
                    onChange={(event) =>
                      setEditForm(
                        (previous) => ({
                          ...previous,
                          checkInTime:
                            event.target.value,
                        }),
                      )
                    }
                    className="w-full rounded-xl border border-[#2d2770] bg-[#0e0b2e] px-3 py-2.5 text-sm text-white outline-none focus:border-[#5C3FE0]"
                  />

                </div>

                {/* Check Out */}

                <div>

                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Check Out
                  </label>

                  <input
                    type="time"
                    value={
                      editForm.checkOutTime
                    }
                    onChange={(event) =>
                      setEditForm(
                        (previous) => ({
                          ...previous,
                          checkOutTime:
                            event.target.value,
                        }),
                      )
                    }
                    className="w-full rounded-xl border border-[#2d2770] bg-[#0e0b2e] px-3 py-2.5 text-sm text-white outline-none focus:border-[#5C3FE0]"
                  />

                </div>

                {/* Status */}

                <div>

                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Status
                  </label>

                  <select
                    value={
                      editForm.status
                    }
                    onChange={(event) =>
                      setEditForm(
                        (previous) => ({
                          ...previous,
                          status:
                            event.target
                              .value as AttendanceStatus,
                        }),
                      )
                    }
                    className="w-full rounded-xl border border-[#2d2770] bg-[#0e0b2e] px-3 py-2.5 text-sm text-white outline-none focus:border-[#5C3FE0]"
                  >

                    {STATUS_OPTIONS.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      ),
                    )}

                  </select>

                </div>

                {/* Overtime */}

                <div>

                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Overtime Hours
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      editForm.overtimeHours
                    }
                    onChange={(event) =>
                      setEditForm(
                        (previous) => ({
                          ...previous,
                          overtimeHours:
                            event.target
                              .value,
                        }),
                      )
                    }
                    className="w-full rounded-xl border border-[#2d2770] bg-[#0e0b2e] px-3 py-2.5 text-sm text-white outline-none focus:border-[#5C3FE0]"
                  />

                </div>

              </div>

              {/* Biometric */}

              <div>

                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Biometric Device ID
                </label>

                <input
                  type="text"
                  value={
                    editForm.biometricDeviceId
                  }
                  onChange={(event) =>
                    setEditForm(
                      (previous) => ({
                        ...previous,
                        biometricDeviceId:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="Optional"
                  className="w-full rounded-xl border border-[#2d2770] bg-[#0e0b2e] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#5C3FE0]"
                />

              </div>

              {/* Schedule information */}

              <div className="rounded-xl border border-[#2d2770]/70 bg-[#0e0b2e] p-3">

                <div className="flex items-center gap-2">

                  <Clock3 className="h-4 w-4 text-[#A78BFA]" />

                  <span className="text-xs font-semibold text-white">
                    Branch Working Schedule
                  </span>

                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Attendance schedule is determined
                  by the employee's branch. If the
                  branch has no custom schedule,
                  the tenant default schedule is used.
                </p>

              </div>

            </div>

            {/* Footer */}

            <div className="flex justify-end gap-3 border-t border-[#2d2770]/70 px-5 py-4">

              <button
                type="button"
                onClick={closeEdit}
                disabled={saving}
                className="rounded-xl border border-[#2d2770] bg-[#0e0b2e] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#5C3FE0] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#6d51ee] disabled:cursor-not-allowed disabled:opacity-50"
              >

                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {saving
                  ? 'Saving...'
                  : 'Save Changes'}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};