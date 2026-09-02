import React from 'react';
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
  ShieldCheck,
  Building2,
  Code2,
  Receipt,
  UserCheck,
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

  console.log(currentUser,"erfffffffffffffffffffffffffffffffffffff")

  console.log(currentTenant,"tenaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaant")

  if (!currentUser || !currentTenant) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">
          Loading your workspace...
        </p>
      </div>
    </div>
  );
}

  const isStaff = currentUser.role === 'support_staff';
  const isDeveloper = currentUser.role === 'developer';
  const isHR = currentUser.role === 'hr_ops';
  const isManager = currentUser.role === 'branch_manager';
  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'company_admin';

  // Metrics
  const staffTarget =
    staffTargets.find((st) => st.userId === currentUser.id) ??
    staffTargets[0] ??
    null;

  const targetPercent = staffTarget
    ? Math.min(
      100,
      Math.round(
        (staffTarget.achievedAmount / staffTarget.targetAmount) * 100
      )
    )
    : 0;

  const userTodayAttendance =
    attendanceRecords.find((r) => r.userId === currentUser.id) ?? null;
  const todayUserLog = dailyWorkLogs.find((d) => d.userId === currentUser.id && d.date === new Date().toISOString().substring(0, 10));

  const pendingLeaves = leaveRequests.filter((l) => l.status === 'Pending');
  const pendingDeals = incentiveTransactions.filter((t) => t.status === 'Pending_Manager' || t.status === 'Verified_Manager');

  const totalDepositAmount = customerReceipts.reduce((acc, r) => acc + r.depositAmount, 0);
  const totalCallsToday = dailyWorkLogs.reduce((acc, l) => acc + (l.callsMade || 0), 0);
  const totalHotLeads = dailyWorkLogs.reduce((acc, l) => acc + (l.leadsRespondedWell || 0), 0);

  return (
    <div className="space-y-6 pb-12">

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Welcome back, {currentUser.name}
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5C3FE0]/20 text-[#5C3FE0] border border-[#5C3FE0]/30">
              {currentUser.designation}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {isStaff && "Today's call goals, personal investment targets, customer slips & incentives."}
            {isDeveloper && "Daily engineering sprint, task narrations, attendance & payslips."}
            {isHR && "Biometric attendance sync, leave management & monthly payroll disbursement."}
            {isManager && "Branch sales pipeline, daily outreach volume & deal approvals."}
            {isAdmin && `Comprehensive operational oversight & governance for ${currentTenant.name}.`}
          </p>
        </div>

        {/* Dynamic Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsWorkLogModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/30 transition-all flex items-center gap-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>+ Log Daily Work</span>
          </button>

          {(isStaff || isManager || isAdmin) && (
            <button
              onClick={() => setIsCreateReceiptModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/30 transition-all flex items-center gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>+ Issue Customer Slip</span>
            </button>
          )}

          {isHR && (
            <button
              onClick={() => setIsBatchUploadOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#5C3FE0] hover:bg-[#6A4DF4] text-white text-xs font-bold shadow-lg transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Import Excel Attendance</span>
            </button>
          )}
        </div>
      </div>

      {/* Role-Tailored Metric Grid */}
      {/* 1. For Staff / Sales Advisors */}
      {isStaff && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">My Calls Today</span>
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-300">
                <PhoneCall className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mt-1">
              {todayUserLog?.callsMade || 35}
            </h3>
            <span className="text-[10px] text-emerald-400 font-medium">
              {todayUserLog?.leadsRespondedWell || 8} Responded Well (Hot)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">Personal Target Progress</span>
              <div className="p-2 rounded-xl bg-[#5C3FE0]/15 text-[#5C3FE0]">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mt-1">{targetPercent}%</h3>
            <span className="text-[10px] text-gray-400 font-medium">
              {staffTarget
                ? `$${(staffTarget.achievedAmount / 1000).toFixed(0)}k of $${(
                  staffTarget.targetAmount / 1000
                ).toFixed(0)}k`
                : 'No target assigned'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">Earned Incentive</span>
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">$4,850</h3>
            <span className="text-[10px] text-emerald-500 font-medium">Approved for next payroll</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">Today's Attendance</span>
              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">Checked In</h3>
            <span className="text-[10px] text-cyan-300 font-medium">
              {userTodayAttendance
                ? `In: ${userTodayAttendance.inTime} (Biometric Validated)`
                : 'No attendance record for today'}
            </span>
          </div>
        </div>
      )}

      {/* 2. For Software Developers */}
      {isDeveloper && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">Daily Work Log</span>
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-300">
                <Code2 className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              {todayUserLog ? 'Submitted' : 'Pending Entry'}
            </h3>
            <span className="text-[10px] text-blue-400 font-medium">
              {todayUserLog?.hoursSpent || 8} Hours logged today
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">Attendance Status</span>
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-emerald-400 mt-1">Present (8.5 hrs)</h3>
            <span className="text-[10px] text-gray-400 font-medium">Synced via office biometric</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">CEO Masterclasses</span>
              <div className="p-2 rounded-xl bg-[#5C3FE0]/15 text-[#5C3FE0]">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-purple-300 mt-1">4 Videos Available</h3>
            <span className="text-[10px] text-gray-400 font-medium">Slab economics & tech specs</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">Monthly Basic & Net</span>
              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">${currentUser.salaryBase.toLocaleString()}</h3>
            <span className="text-[10px] text-cyan-300 font-medium">Payslip generated on time</span>
          </div>
        </div>
      )}

      {/* 3. For HR / Operations */}
      {isHR && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">Today's Present Staff</span>
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mt-1">94.2%</h3>
            <span className="text-[10px] text-emerald-400 font-medium">Excel sync operational</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">Pending Leave Requests</span>
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-300">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">{pendingLeaves.length}</h3>
            <span className="text-[10px] text-amber-300 font-medium">Awaiting HR review</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">Work Logs Submitted</span>
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-300">
                <PhoneCall className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mt-1">{dailyWorkLogs.length}</h3>
            <span className="text-[10px] text-purple-300 font-medium">Team outreach & narrations</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">Monthly Payroll Status</span>
              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">Draft Ready</h3>
            <span className="text-[10px] text-cyan-300 font-medium">Automatic attendance deduction</span>
          </div>
        </div>
      )}

      {/* 4. For Management & Super Admins */}
      {(isManager || isAdmin) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">Total Customer Custody</span>
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mt-1">
              ${(totalDepositAmount / 1000000).toFixed(2)}M
            </h3>
            <span className="text-[10px] text-emerald-400 font-medium">{customerReceipts.length} Official Slips Issued</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">Team Calls Today</span>
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-300">
                <PhoneCall className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mt-1">{totalCallsToday}</h3>
            <span className="text-[10px] text-emerald-400 font-medium">{totalHotLeads} Hot Leads Interested</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">Pending Deal Approvals</span>
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-300">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">{pendingDeals.length}</h3>
            <span className="text-[10px] text-amber-300 font-medium">Incentive verification required</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">Active Slab Version</span>
              <div className="p-2 rounded-xl bg-[#5C3FE0]/15 text-[#5C3FE0]">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-purple-300 mt-1">{activeSlabVersion.versionCode}</h3>
            <span className="text-[10px] text-gray-400 font-medium">Max 24.0% p.a. sovereign yield</span>
          </div>
        </div>
      )}

      {/* Main Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left 7 Columns: Daily Activity Feed / Call Summaries */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-[#09081E] border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Recent Daily Work & Call Submissions</h3>
              </div>
              <button
                onClick={() => setActiveTab('daily_work')}
                className="text-xs text-[#5C3FE0] hover:text-purple-300 font-semibold flex items-center gap-1"
              >
                <span>View All Logs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {dailyWorkLogs.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2 hover:border-white/15 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={log.userAvatar}
                        alt={log.userName}
                        className="w-7 h-7 rounded-full object-cover border border-white/10"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">{log.userName}</div>
                        <div className="text-[10px] text-gray-400">{log.designation}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {log.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                    {log.narration}
                  </p>

                  {log.workType === 'sales' && (
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1 border-t border-white/5">
                      <span>Calls: <strong className="text-white">{log.callsMade}</strong></span>
                      <span>•</span>
                      <span>Connected: <strong className="text-purple-300">{log.callsConnected}</strong></span>
                      <span>•</span>
                      <span>Hot Leads: <strong className="text-emerald-400">{log.leadsRespondedWell}</strong></span>
                    </div>
                  )}

                  {log.workType === 'developer' && (
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1 border-t border-white/5">
                      <span>Hours: <strong className="text-blue-300">{log.hoursSpent} hrs</strong></span>
                      <span>•</span>
                      <span className="truncate">{log.featuresShipped}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Customer Slips & CEO Knowledge Hub */}
        <div className="lg:col-span-5 space-y-4">

          {/* Customer Slips Widget */}
          <div className="p-5 rounded-2xl bg-[#09081E] border border-white/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Latest Customer Payment Slips</h3>
              </div>
              <button
                onClick={() => setActiveTab('receipts_slabs')}
                className="text-xs text-emerald-400 hover:underline font-semibold"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {customerReceipts.slice(0, 2).map((rcpt) => (
                <div
                  key={rcpt.id}
                  onClick={() => setSelectedReceiptForView(rcpt)}
                  className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer space-y-1 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white group-hover:text-emerald-300">
                      {rcpt.customerName}
                    </span>
                    <span className="font-bold text-emerald-400">
                      ${rcpt.depositAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span className="font-mono text-purple-300">{rcpt.receiptNumber}</span>
                    <span>{rcpt.slabTierName} ({rcpt.annualYieldPercent}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CEO Knowledge Hub Quick Access */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#120e3a] to-[#09081E] border border-[#5C3FE0]/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-300" />
                <h3 className="text-sm font-bold text-white">CEO Knowledge Hub</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                No Exams • Pure Teaching
              </span>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Watch video masterclasses from Alexander Sterling and executive leadership on sovereign investment slabs and client advisory techniques.
            </p>

            <button
              onClick={() => setActiveTab('knowledge_hub')}
              className="w-full py-2.5 rounded-xl bg-[#5C3FE0] hover:bg-[#6A4DF4] text-white text-xs font-bold shadow transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Explore Masterclasses</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
