import React, { useState } from 'react';
import {
  CalendarCheck,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Users,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { MyAttendance } from '../components/MyAttendance';
import { LeaveManagement } from '../components/LeaveManagement';
import AttendanceRecords from './AttendanceRecords';
import AttendanceBatchUpload from './AttendanceBatchUpload';

const normalizeTime = (
  value: string | null | undefined,
): string | null => {
  if (!value) return null;

  return value.slice(0, 5);
};

export const AttendanceView: React.FC = () => {
  const {
    currentUser,
    attendanceLoading,
    attendanceError,
    loadAttendance,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    'records' | 'leaves' | 'batches'
  >('records');

  const [actionError, setActionError] =
    useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/70 text-slate-300">
        Loading attendance...
      </div>
    );
  }

  const role =
    currentUser.roleName
      ?.trim()
      .toLowerCase();

  const isEmployee =
    role === 'sales_staff';

  const isManagement =
    role === 'company_admin' ||
    role === 'hr_ops' ||
    role === 'branch_manager';

  const isSuperAdmin =
    role === 'super_admin';

  /*
   * ============================================================
   * ATTENDANCE SCOPE
   * ============================================================
   */

  const attendanceScope = {
    tenantId:
      currentUser.tenantId ?? undefined,

    branchId:
      currentUser.branchId ?? undefined,

    userId:
      isEmployee
        ? currentUser.userId
        : undefined,
  };

  /*
   * ============================================================
   * REFRESH
   * ============================================================
   */

  const handleRefresh = async () => {
    try {
      setActionError(null);

      if (isEmployee) {
        await loadAttendance({
          userId: currentUser.userId,
          branchId:
            currentUser.branchId ?? undefined,
        });

        return;
      }

      if (role === 'branch_manager') {
        await loadAttendance({
          tenantId:
            currentUser.tenantId ?? undefined,

          branchId:
            currentUser.branchId ?? undefined,
        });

        return;
      }

      if (
        role === 'company_admin' ||
        role === 'hr_ops'
      ) {
        await loadAttendance({
          tenantId:
            currentUser.tenantId ?? undefined,
        });

        return;
      }

      /*
       * SuperAdmin should not accidentally inherit
       * an employee/branch attendance scope.
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

  return (
    <div className="space-y-6 pb-12">

      {/* ============================================================
          HEADER
      ============================================================ */}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">

        <div className="flex items-center gap-3">

          <div className="p-2.5 rounded-xl bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
            <CalendarCheck className="w-5 h-5" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-white">
              Attendance Center
            </h1>

            <p className="text-xs text-slate-400 mt-1">
              Attendance records, check-in and
              check-out management.
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={attendanceLoading}
          className="px-4 py-2 rounded-xl bg-[#140f3d] hover:bg-[#1f175a] border border-[#2d2770] text-slate-200 text-xs font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${attendanceLoading
                ? 'animate-spin'
                : ''
              }`}
          />

          Refresh
        </button>

      </div>

      {/* ============================================================
          TENANT / BRANCH CONTEXT
          ============================================================ */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="p-4 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">

          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            Tenant
          </p>

          <p className="text-sm font-bold text-white mt-1">
            {currentUser.tenantName ?? 'All Tenants'}
          </p>

        </div>

        <div className="p-4 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">

          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            Attendance Scope
          </p>

          <p className="text-sm font-bold text-white mt-1">
            {isEmployee
              ? currentUser.branchName ?? 'Assigned Branch'
              : role === 'branch_manager'
                ? currentUser.branchName ?? 'Assigned Branch'
                : 'All Branches'}
          </p>

        </div>

      </div>

      {/* ============================================================
          INFORMATION BANNER
      ============================================================ */}

      <div className="p-4 rounded-xl bg-gradient-to-r from-[#120e3b] via-[#1a144e] to-[#0c0828] border border-[#5C3FE0]/40 flex items-start gap-3 text-xs text-slate-300">

        <div className="p-1.5 rounded-lg bg-[#5C3FE0]/30 text-[#A78BFA] shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>

        <div>
          <span className="font-bold text-white block">
            Centralized Attendance
          </span>

          <span>
            Attendance is calculated using the effective
            working schedule configured for the tenant and
            branch. Branch-specific schedules override the
            tenant defaults when configured.
          </span>
        </div>

      </div>

      {/* ============================================================
          ERROR
      ============================================================ */}

      {(actionError || attendanceError) && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">

          <AlertCircle className="w-4 h-4" />

          {actionError || attendanceError}

        </div>
      )}

      {/* ============================================================
          EMPLOYEE
      ============================================================ */}

      {isEmployee && (
        <>
          <MyAttendance />

          <LeaveManagement />
        </>
      )}

      {/* ============================================================
          MANAGEMENT
      ============================================================ */}

      {isManagement && (
        <>
          <div className="flex items-center gap-2 border-b border-[#231e54] pb-2 text-xs">

            <button
              type="button"
              onClick={() =>
                setActiveSubTab('records')
              }
              className={`px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 ${activeSubTab === 'records'
                  ? 'bg-[#5C3FE0] text-white'
                  : 'text-slate-400 hover:text-white hover:bg-[#120e38]'
                }`}
            >
              <Users className="w-3.5 h-3.5" />

              Attendance Records
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveSubTab('leaves')
              }
              className={`px-4 py-2 rounded-xl font-bold transition-colors ${activeSubTab === 'leaves'
                  ? 'bg-[#5C3FE0] text-white'
                  : 'text-slate-400 hover:text-white hover:bg-[#120e38]'
                }`}
            >
              Leave Management
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveSubTab('batches')
              }
              className={`px-4 py-2 rounded-xl font-bold transition-colors ${activeSubTab === 'batches'
                  ? 'bg-[#5C3FE0] text-white'
                  : 'text-slate-400 hover:text-white hover:bg-[#120e38]'
                }`}
            >
              Batch Upload
            </button>

          </div>

          {activeSubTab === 'records' && (
            <AttendanceRecords />
          )}

          {activeSubTab === 'leaves' && (
            <LeaveManagement />
          )}

          {activeSubTab === 'batches' && (
            <AttendanceBatchUpload />
          )}

        </>
      )}

    </div>
  );
};