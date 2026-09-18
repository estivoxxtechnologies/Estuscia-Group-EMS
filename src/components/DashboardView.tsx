import React, { useMemo } from 'react';
import {
  TrendingUp,
  Target,
  Users,
  CalendarCheck,
  CreditCard,
  Video,
  DollarSign,
  PhoneCall,
  Clock,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Plus,
  Play,
  ChevronRight,
  Code2,
  Receipt,
  UserCheck,
  Building2,
  RefreshCw,
} from 'lucide-react';

import { useApp } from '../context/AppContext';

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    currentTenant,
    activeSlabVersion,
    attendanceRecords,
    staffTargets,
    incentiveTransactions,
    dailyWorkLogs,
    customerReceipts,
    payslips,
    leaveRequests,
    setActiveTab,
    setIsBatchUploadOpen,
    setIsWorkLogModalOpen,
    setIsCreateReceiptModalOpen,
    setSelectedReceiptForView,
  } = useApp();

  if (!currentUser || !currentTenant) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <p className="text-sm text-gray-400">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * ROLE
   * ============================================================
   */

  const role = (
    currentUser.roleName ||
    currentUser.role ||
    ''
  ).toLowerCase();

  const isSalesStaff = role === 'sales_staff';
  const isSupportStaff = role === 'support_staff';
  const isDeveloper = role === 'developer';
  const isHR = role === 'hr_ops';
  const isManager = role === 'branch_manager';
  const isCompanyAdmin = role === 'company_admin';
  const isSuperAdmin = role === 'super_admin';

  /*
   * SuperAdmin has a completely separate dashboard.
   *
   * App.tsx already routes SuperAdminDashboard for super_admin.
   * This guard is intentionally kept here as a second safety layer.
   */

  if (isSuperAdmin) {
    return null;
  }

  const isManagement =
    isManager ||
    isCompanyAdmin ||
    isHR;

  /*
   * ============================================================
   * CURRENT USER ID
   * ============================================================
   *
   * Existing AppContext versions have used both `id` and
   * `userId`, so support both safely.
   */

  const currentUserId =
    currentUser.id ??
    currentUser.userId;

  /*
   * ============================================================
   * TODAY
   * ============================================================
   */

  const today =
    new Date()
      .toISOString()
      .substring(0, 10);

  /*
   * ============================================================
   * DAILY WORK
   * ============================================================
   *
   * The current backend DailyWorkLog supports Sales metrics:
   *
   * CallsMade
   * CallsConnected
   * LeadsRespondedWell
   * FollowUpsScheduled
   *
   * No dealsPitched / closingInvestmentAmount are used here.
   */

  const salesWorkLogs = useMemo(() => {
    return dailyWorkLogs.filter((log: any) => {
      const workType = log.workType;

      return (
        workType === 0 ||
        workType === 'Sales' ||
        workType === 'sales'
      );
    });
  }, [dailyWorkLogs]);

  const todaySalesLogs = useMemo(() => {
    return salesWorkLogs.filter((log: any) => {
      const workDate =
        log.workDate ??
        log.date;

      return workDate === today;
    });
  }, [salesWorkLogs, today]);

  const todayUserLog = useMemo(() => {
    return salesWorkLogs.find((log: any) => {
      const userId =
        log.userId ??
        log.user?.id;

      const workDate =
        log.workDate ??
        log.date;

      return (
        userId === currentUserId &&
        workDate === today
      );
    });
  }, [
    salesWorkLogs,
    currentUserId,
    today,
  ]);

  /*
   * ============================================================
   * SALES METRICS
   * ============================================================
   */

  const totalCallsToday = useMemo(() => {
    return todaySalesLogs.reduce(
      (total: number, log: any) =>
        total +
        (log.callsMade ?? 0),
      0
    );
  }, [todaySalesLogs]);

  const totalConnectedToday = useMemo(() => {
    return todaySalesLogs.reduce(
      (total: number, log: any) =>
        total +
        (log.callsConnected ?? 0),
      0
    );
  }, [todaySalesLogs]);

  const totalHotLeadsToday = useMemo(() => {
    return todaySalesLogs.reduce(
      (total: number, log: any) =>
        total +
        (log.leadsRespondedWell ?? 0),
      0
    );
  }, [todaySalesLogs]);

  const totalFollowUpsToday = useMemo(() => {
    return todaySalesLogs.reduce(
      (total: number, log: any) =>
        total +
        (log.followUpsScheduled ?? 0),
      0
    );
  }, [todaySalesLogs]);

  /*
   * ============================================================
   * PERSONAL TARGET
   * ============================================================
   */

  const staffTarget =
    staffTargets.find(
      (target: any) =>
        target.userId === currentUserId
    ) ??
    (isSalesStaff
      ? staffTargets[0]
      : null) ??
    null;

  const targetPercent =
    staffTarget &&
    Number(staffTarget.targetAmount) > 0
      ? Math.min(
          100,
          Math.round(
            (Number(
              staffTarget.achievedAmount
            ) /
              Number(
                staffTarget.targetAmount
              )) *
              100
          )
        )
      : 0;

  /*
   * ============================================================
   * ATTENDANCE
   * ============================================================
   */

  const userTodayAttendance =
    attendanceRecords.find(
      (record: any) =>
        record.userId === currentUserId &&
        (
          record.date === today ||
          record.attendanceDate === today
        )
    ) ??
    attendanceRecords.find(
      (record: any) =>
        record.userId === currentUserId
    ) ??
    null;

  /*
   * ============================================================
   * HR / LEAVE
   * ============================================================
   */

  const pendingLeaves =
    leaveRequests.filter(
      (leave: any) =>
        leave.status === 'Pending'
    );

  /*
   * ============================================================
   * INCENTIVES
   * ============================================================
   */

  const pendingDeals =
    incentiveTransactions.filter(
      (transaction: any) =>
        transaction.status ===
          'Pending_Manager' ||
        transaction.status ===
          'Verified_Manager'
    );

  /*
   * ============================================================
   * RECEIPTS
   * ============================================================
   */

  const totalDepositAmount =
    customerReceipts.reduce(
      (total: number, receipt: any) =>
        total +
        Number(
          receipt.depositAmount ?? 0
        ),
      0
    );

  /*
   * ============================================================
   * RECENT SALES WORK
   * ============================================================
   */

  const recentSalesLogs =
    salesWorkLogs.slice(0, 3);

  /*
   * ============================================================
   * HELPER
   * ============================================================
   */

  const getUserName = (log: any) =>
    log.user?.fullName ??
    log.userName ??
    'Unknown Employee';

  const getUserDesignation = (
    log: any
  ) =>
    log.user?.designation ??
    log.designation ??
    'Sales Staff';

  const getAvatarUrl = (log: any) =>
    log.user?.avatarUrl ??
    log.userAvatar ??
    '';

  const getWorkDate = (log: any) =>
    log.workDate ??
    log.date ??
    '—';

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="space-y-6 pb-12">

      {/* ======================================================
          TOP BANNER
          ====================================================== */}

      <div className="flex flex-col items-start justify-between gap-4 border-b border-white/5 pb-4 sm:flex-row sm:items-center">

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Welcome back,{' '}
              {currentUser.name ??
                currentUser.fullName ??
                currentUser.username}
            </h1>

            {currentUser.designation && (
              <span className="rounded-full border border-[#5C3FE0]/30 bg-[#5C3FE0]/20 px-2 py-0.5 text-[10px] font-bold text-[#A78BFA]">
                {currentUser.designation}
              </span>
            )}
          </div>

          <p className="mt-0.5 text-xs text-gray-400">
            {isSalesStaff &&
              "Today's sales activity, outreach and personal performance."}

            {isSupportStaff &&
              "Daily operations, attendance, customer activity and support work."}

            {isDeveloper &&
              "Engineering activity, attendance, knowledge hub and payroll."}

            {isHR &&
              "Attendance, staff operations, leave management and payroll."}

            {isManager &&
              "Branch sales activity, team outreach and operational approvals."}

            {isCompanyAdmin &&
              `Operational overview for ${currentTenant.name}.`}
          </p>
        </div>

        {/* ====================================================
            ACTION BUTTONS
            ==================================================== */}

        <div className="flex flex-wrap items-center gap-2.5">

          {/* Sales staff only */}
          {isSalesStaff && (
            <button
              type="button"
              onClick={() =>
                setIsWorkLogModalOpen(true)
              }
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-purple-900/30 transition-all hover:bg-purple-500"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>
                + Log Daily Work
              </span>
            </button>
          )}

          {/* Customer receipt access */}
          {(isSalesStaff ||
            isManager ||
            isCompanyAdmin) && (
            <button
              type="button"
              onClick={() =>
                setIsCreateReceiptModalOpen(
                  true
                )
              }
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/30 transition-all hover:bg-emerald-500"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>
                + Issue Customer Slip
              </span>
            </button>
          )}

          {/* HR only */}
          {isHR && (
            <button
              type="button"
              onClick={() =>
                setIsBatchUploadOpen(true)
              }
              className="flex items-center gap-1.5 rounded-xl bg-[#5C3FE0] px-3.5 py-2 text-xs font-bold text-white shadow-lg transition-all hover:bg-[#6A4DF4]"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>
                Import Excel Attendance
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================
          SALES STAFF DASHBOARD
          ====================================================== */}

      {isSalesStaff && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

            {/* Calls */}
            <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-400">
                  My Calls Today
                </span>

                <div className="rounded-xl bg-purple-500/15 p-2 text-purple-300">
                  <PhoneCall className="h-4 w-4" />
                </div>
              </div>

              <h3 className="mt-1 text-2xl font-bold text-white">
                {todayUserLog?.callsMade ??
                  0}
              </h3>

              <span className="text-[10px] font-medium text-emerald-400">
                {todayUserLog?.leadsRespondedWell ??
                  0}{' '}
                Responded Well
              </span>
            </div>

            {/* Target */}
            <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-400">
                  Personal Target
                </span>

                <div className="rounded-xl bg-[#5C3FE0]/15 p-2 text-[#A78BFA]">
                  <Target className="h-4 w-4" />
                </div>
              </div>

              <h3 className="mt-1 text-2xl font-bold text-white">
                {targetPercent}%
              </h3>

              <span className="text-[10px] font-medium text-gray-400">
                {staffTarget
                  ? `${Number(
                      staffTarget.achievedAmount
                    ).toLocaleString()} / ${Number(
                      staffTarget.targetAmount
                    ).toLocaleString()}`
                  : 'No target assigned'}
              </span>
            </div>

            {/* Incentive */}
            <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-400">
                  Incentive
                </span>

                <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-400">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>

              <h3 className="mt-1 text-2xl font-bold text-emerald-400">
                {pendingDeals.filter(
                  (item: any) =>
                    item.userId ===
                    currentUserId
                ).length}
              </h3>

              <span className="text-[10px] font-medium text-emerald-500">
                Pending verification
              </span>
            </div>

            {/* Attendance */}
            <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-400">
                  Today's Attendance
                </span>

                <div className="rounded-xl bg-cyan-500/15 p-2 text-cyan-400">
                  <CalendarCheck className="h-4 w-4" />
                </div>
              </div>

              <h3 className="mt-1 text-lg font-bold text-white">
                {userTodayAttendance
                  ? 'Checked In'
                  : 'Not Checked In'}
              </h3>

              <span className="text-[10px] font-medium text-cyan-300">
                {userTodayAttendance
                  ? `In: ${
                      userTodayAttendance.inTime ??
                      userTodayAttendance.checkInTime ??
                      'Recorded'
                    }`
                  : 'No attendance record'}
              </span>
            </div>
          </div>
        </>
      )}

      {/* ======================================================
          SUPPORT STAFF DASHBOARD
          ====================================================== */}

      {isSupportStaff && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">
                Today's Calls
              </span>
              <div className="rounded-xl bg-purple-500/15 p-2 text-purple-300">
                <PhoneCall className="h-4 w-4" />
              </div>
            </div>

            <h3 className="mt-1 text-2xl font-bold text-white">
              {totalCallsToday}
            </h3>

            <span className="text-[10px] text-purple-300">
              Sales activity
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">
                Positive Responses
              </span>
              <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-400">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>

            <h3 className="mt-1 text-2xl font-bold text-emerald-400">
              {totalHotLeadsToday}
            </h3>

            <span className="text-[10px] text-emerald-400">
              Responded well
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">
                Follow-ups
              </span>
              <div className="rounded-xl bg-cyan-500/15 p-2 text-cyan-400">
                <CalendarCheck className="h-4 w-4" />
              </div>
            </div>

            <h3 className="mt-1 text-2xl font-bold text-white">
              {totalFollowUpsToday}
            </h3>

            <span className="text-[10px] text-cyan-300">
              Scheduled today
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">
                Attendance
              </span>
              <div className="rounded-xl bg-blue-500/15 p-2 text-blue-300">
                <Clock className="h-4 w-4" />
              </div>
            </div>

            <h3 className="mt-1 text-lg font-bold text-white">
              {userTodayAttendance
                ? 'Present'
                : 'Not Recorded'}
            </h3>

            <span className="text-[10px] text-gray-400">
              Today's status
            </span>
          </div>
        </div>
      )}

      {/* ======================================================
          DEVELOPER DASHBOARD
          ====================================================== */}

      {isDeveloper && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">
                Daily Work
              </span>

              <div className="rounded-xl bg-blue-500/15 p-2 text-blue-300">
                <Code2 className="h-4 w-4" />
              </div>
            </div>

            <h3 className="mt-1 text-lg font-bold text-white">
              Coming Soon
            </h3>

            <span className="text-[10px] font-medium text-blue-400">
              Developer work-log module
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">
                Attendance
              </span>

              <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-400">
                <CalendarCheck className="h-4 w-4" />
              </div>
            </div>

            <h3 className="mt-1 text-lg font-bold text-emerald-400">
              {userTodayAttendance
                ? 'Present'
                : 'Not Recorded'}
            </h3>

            <span className="text-[10px] text-gray-400">
              Office attendance
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">
                Knowledge Hub
              </span>

              <div className="rounded-xl bg-[#5C3FE0]/15 p-2 text-[#A78BFA]">
                <Video className="h-4 w-4" />
              </div>
            </div>

            <h3 className="mt-1 text-lg font-bold text-purple-300">
              Available
            </h3>

            <span className="text-[10px] text-gray-400">
              CEO masterclasses
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">
                Salary Base
              </span>

              <div className="rounded-xl bg-cyan-500/15 p-2 text-cyan-400">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>

            <h3 className="mt-1 text-xl font-bold text-white">
              {Number(
                currentUser.salaryBase ?? 0
              ).toLocaleString()}
            </h3>

            <span className="text-[10px] text-cyan-300">
              Current salary base
            </span>
          </div>
        </div>
      )}

      {/* ======================================================
          HR DASHBOARD
          ====================================================== */}

      {isHR && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">
                Present Staff
              </span>

              <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-400">
                <Users className="h-4 w-4" />
              </div>
            </div>

            <h3 className="mt-1 text-2xl font-bold text-white">
              {attendanceRecords.length}
            </h3>

            <span className="text-[10px] text-emerald-400">
              Attendance records loaded
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">
                Pending Leave
              </span>

              <div className="rounded-xl bg-amber-500/15 p-2 text-amber-300">
                <CalendarCheck className="h-4 w-4" />
              </div>
            </div>

            <h3 className="mt-1 text-2xl font-bold text-amber-400">
              {pendingLeaves.length}
            </h3>

            <span className="text-[10px] text-amber-300">
              Awaiting HR review
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">
                Sales Work Logs
              </span>

              <div className="rounded-xl bg-purple-500/15 p-2 text-purple-300">
                <PhoneCall className="h-4 w-4" />
              </div>
            </div>

            <h3 className="mt-1 text-2xl font-bold text-white">
              {salesWorkLogs.length}
            </h3>

            <span className="text-[10px] text-purple-300">
              Sales reports
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">
                Payroll
              </span>

              <div className="rounded-xl bg-cyan-500/15 p-2 text-cyan-400">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>

            <h3 className="mt-1 text-lg font-bold text-white">
              Available
            </h3>

            <span className="text-[10px] text-cyan-300">
              Open payroll module
            </span>
          </div>
        </div>
      )}

      {/* ======================================================
          MANAGER / COMPANY ADMIN
          ====================================================== */}

      {(isManager ||
        isCompanyAdmin) && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          {/* Customer custody */}
          <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">
                Customer Receipts
              </span>

              <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-400">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>

            <h3 className="mt-1 text-2xl font-bold text-white">
              {customerReceipts.length}
            </h3>

            <span className="text-[10px] text-emerald-400">
              Official slips issued
            </span>
          </div>

          {/* Team calls */}
          <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">
                Team Calls Today
              </span>

              <div className="rounded-xl bg-purple-500/15 p-2 text-purple-300">
                <PhoneCall className="h-4 w-4" />
              </div>
            </div>

            <h3 className="mt-1 text-2xl font-bold text-white">
              {totalCallsToday}
            </h3>

            <span className="text-[10px] text-emerald-400">
              {totalHotLeadsToday}{' '}
              positive responses
            </span>
          </div>

          {/* Follow-ups */}
          <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">
                Follow-ups Today
              </span>

              <div className="rounded-xl bg-cyan-500/15 p-2 text-cyan-400">
                <CalendarCheck className="h-4 w-4" />
              </div>
            </div>

            <h3 className="mt-1 text-2xl font-bold text-white">
              {totalFollowUpsToday}
            </h3>

            <span className="text-[10px] text-cyan-300">
              Scheduled activities
            </span>
          </div>

          {/* Slab */}
          <div className="rounded-2xl border border-white/10 bg-[#09081E] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">
                Active Slab
              </span>

              <div className="rounded-xl bg-[#5C3FE0]/15 p-2 text-[#A78BFA]">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>

            <h3 className="mt-1 text-lg font-bold text-purple-300">
              {activeSlabVersion?.versionCode ??
                '—'}
            </h3>

            <span className="text-[10px] text-gray-400">
              Current slab configuration
            </span>
          </div>
        </div>
      )}

      {/* ======================================================
          MAIN CONTENT
          ====================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

        {/* ====================================================
            LEFT — DAILY SALES ACTIVITY
            ==================================================== */}

        <div className="space-y-4 lg:col-span-7">

          <div className="space-y-4 rounded-2xl border border-white/10 bg-[#09081E] p-5">

            <div className="flex items-center justify-between border-b border-white/5 pb-3">

              <div className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-purple-400" />

                <h3 className="text-sm font-bold text-white">
                  Recent Sales Daily Work
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setActiveTab(
                    'daily_work'
                  )
                }
                className="flex items-center gap-1 text-xs font-semibold text-[#A78BFA] hover:text-purple-300"
              >
                <span>
                  View All Logs
                </span>

                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {recentSalesLogs.length ===
            0 ? (
              <div className="rounded-xl border border-white/5 bg-black/30 p-8 text-center">
                <PhoneCall className="mx-auto h-7 w-7 text-gray-600" />

                <p className="mt-2 text-xs font-semibold text-gray-300">
                  No Sales Work Reports
                </p>

                <p className="mt-1 text-[10px] text-gray-500">
                  Sales daily work submissions
                  will appear here.
                </p>

                {isSalesStaff && (
                  <button
                    type="button"
                    onClick={() =>
                      setIsWorkLogModalOpen(
                        true
                      )
                    }
                    className="mx-auto mt-3 flex items-center gap-1.5 rounded-lg bg-[#5C3FE0] px-3 py-1.5 text-[11px] font-semibold text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Submit Daily Work
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">

                {recentSalesLogs.map(
                  (log: any) => {
                    const userName =
                      getUserName(log);

                    const designation =
                      getUserDesignation(
                        log
                      );

                    const avatarUrl =
                      getAvatarUrl(log);

                    return (
                      <div
                        key={log.id}
                        className="space-y-2 rounded-xl border border-white/5 bg-black/40 p-3.5 transition-all hover:border-white/15"
                      >

                        <div className="flex items-center justify-between">

                          <div className="flex items-center gap-2.5">

                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={userName}
                                className="h-7 w-7 rounded-full border border-white/10 object-cover"
                              />
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#5C3FE0]/20 text-[10px] font-bold text-[#A78BFA]">
                                {userName
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}
                              </div>
                            )}

                            <div>
                              <div className="text-xs font-bold text-white">
                                {userName}
                              </div>

                              <div className="text-[10px] text-gray-400">
                                {designation}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">

                            <span className="text-[10px] text-gray-500">
                              {getWorkDate(
                                log
                              )}
                            </span>

                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                log.status ===
                                'Reviewed'
                                  ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                                  : log.status ===
                                      'Rejected'
                                    ? 'border-red-500/30 bg-red-500/15 text-red-400'
                                    : 'border-amber-500/30 bg-amber-500/15 text-amber-400'
                              }`}
                            >
                              {log.status ??
                                'Submitted'}
                            </span>
                          </div>
                        </div>

                        <p className="line-clamp-2 text-xs leading-relaxed text-gray-300">
                          {log.narration}
                        </p>

                        <div className="flex items-center gap-3 border-t border-white/5 pt-2 text-[11px] text-gray-400">

                          <span>
                            Calls:{' '}
                            <strong className="text-white">
                              {log.callsMade ??
                                0}
                            </strong>
                          </span>

                          <span>
                            •
                          </span>

                          <span>
                            Connected:{' '}
                            <strong className="text-purple-300">
                              {log.callsConnected ??
                                0}
                            </strong>
                          </span>

                          <span>
                            •
                          </span>

                          <span>
                            Responded:{' '}
                            <strong className="text-emerald-400">
                              {log.leadsRespondedWell ??
                                0}
                            </strong>
                          </span>

                          <span>
                            •
                          </span>

                          <span>
                            Follow-ups:{' '}
                            <strong className="text-cyan-300">
                              {log.followUpsScheduled ??
                                0}
                            </strong>
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>

        {/* ====================================================
            RIGHT — CUSTOMER RECEIPTS + KNOWLEDGE HUB
            ==================================================== */}

        <div className="space-y-4 lg:col-span-5">

          {/* Customer Slips */}
          <div className="space-y-3 rounded-2xl border border-white/10 bg-[#09081E] p-5">

            <div className="flex items-center justify-between border-b border-white/5 pb-2">

              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-400" />

                <h3 className="text-sm font-bold text-white">
                  Latest Customer Payment Slips
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setActiveTab(
                    'receipts_slabs'
                  )
                }
                className="text-xs font-semibold text-emerald-400 hover:underline"
              >
                View All
              </button>
            </div>

            {customerReceipts.length ===
            0 ? (
              <div className="py-6 text-center">
                <Receipt className="mx-auto h-6 w-6 text-gray-600" />

                <p className="mt-2 text-xs text-gray-400">
                  No customer slips yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">

                {customerReceipts
                  .slice(0, 2)
                  .map(
                    (receipt: any) => (
                      <div
                        key={receipt.id}
                        onClick={() =>
                          setSelectedReceiptForView(
                            receipt
                          )
                        }
                        className="group cursor-pointer space-y-1 rounded-xl border border-white/5 bg-black/40 p-3 transition-all hover:border-emerald-500/30"
                      >

                        <div className="flex items-center justify-between text-xs">

                          <span className="font-bold text-white group-hover:text-emerald-300">
                            {
                              receipt.customerName
                            }
                          </span>

                          <span className="font-bold text-emerald-400">
                            {Number(
                              receipt.depositAmount ??
                                0
                            ).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-gray-400">

                          <span className="font-mono text-purple-300">
                            {
                              receipt.receiptNumber
                            }
                          </span>

                          <span>
                            {receipt.slabTierName ??
                              'Slab'}
                          </span>
                        </div>
                      </div>
                    )
                  )}
              </div>
            )}
          </div>

          {/* Knowledge Hub */}
          <div className="space-y-3 rounded-2xl border border-[#5C3FE0]/30 bg-gradient-to-br from-[#120e3a] to-[#09081E] p-5">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-purple-300" />

                <h3 className="text-sm font-bold text-white">
                  CEO Knowledge Hub
                </h3>
              </div>

              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                Learning
              </span>
            </div>

            <p className="text-xs leading-relaxed text-gray-300">
              Access leadership masterclasses,
              investment slab education and
              client advisory training.
            </p>

            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  'knowledge_hub'
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5C3FE0] py-2.5 text-xs font-bold text-white shadow transition-all hover:bg-[#6A4DF4]"
            >
              <Play className="h-3.5 w-3.5 fill-white" />

              <span>
                Explore Masterclasses
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          MANAGEMENT QUICK ACTIONS
          ====================================================== */}

      {isManagement && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                'daily_work'
              )
            }
            className="group flex items-center justify-between rounded-2xl border border-white/10 bg-[#09081E] p-4 text-left transition-all hover:border-[#5C3FE0]/40"
          >
            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-purple-500/15 p-2.5 text-purple-300">
                <PhoneCall className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs font-bold text-white">
                  Review Daily Work
                </p>

                <p className="mt-0.5 text-[10px] text-gray-500">
                  Review Sales submissions
                </p>
              </div>
            </div>

            <ArrowUpRight className="h-4 w-4 text-gray-500 transition group-hover:text-[#A78BFA]" />
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                'attendance'
              )
            }
            className="group flex items-center justify-between rounded-2xl border border-white/10 bg-[#09081E] p-4 text-left transition-all hover:border-cyan-500/30"
          >
            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-cyan-500/15 p-2.5 text-cyan-400">
                <CalendarCheck className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs font-bold text-white">
                  Attendance
                </p>

                <p className="mt-0.5 text-[10px] text-gray-500">
                  View staff attendance
                </p>
              </div>
            </div>

            <ArrowUpRight className="h-4 w-4 text-gray-500 transition group-hover:text-cyan-300" />
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                'staff'
              )
            }
            className="group flex items-center justify-between rounded-2xl border border-white/10 bg-[#09081E] p-4 text-left transition-all hover:border-emerald-500/30"
          >
            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-emerald-500/15 p-2.5 text-emerald-400">
                <Users className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs font-bold text-white">
                  Staff Management
                </p>

                <p className="mt-0.5 text-[10px] text-gray-500">
                  Manage authorized staff
                </p>
              </div>
            </div>

            <ArrowUpRight className="h-4 w-4 text-gray-500 transition group-hover:text-emerald-300" />
          </button>
        </div>
      )}
    </div>
  );
};