
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  RefreshCw,
  TrendingUp,
  Users,
  Video,
  Wallet,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import {
  getDashboard,
  type DashboardResponse,
  type DashboardCountItem,
} from '../api/dashboard';

const panel =
  'rounded-2xl border border-white/10 bg-[#09081E] p-5';

const numberFormat = new Intl.NumberFormat('en-IN');

const currencyFormat = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const monthLabel = (year: number, month: number) =>
  new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
    month: 'short',
    year: '2-digit',
  });

const readableStatus = (value: string) =>
  String(value ?? '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ');

const statusColor = (status: string) => {
  const value = status.toLowerCase().replace(/[_-]/g, ' ');

  if (value.includes('early leaving')) {
    return 'border-orange-500/20 bg-orange-500/10 text-orange-300';
  }

  if (
    value.includes('present') ||
    value.includes('approved') ||
    value.includes('paid') ||
    value.includes('completed')
  ) {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
  }

  if (
    value.includes('pending') ||
    value.includes('late') ||
    value.includes('submitted')
  ) {
    return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
  }

  if (
    value.includes('absent') ||
    value.includes('reject') ||
    value.includes('overdue')
  ) {
    return 'border-red-500/20 bg-red-500/10 text-red-300';
  }

  if (
    value.includes('half day') ||
    value.includes('halfday')
  ) {
    return 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300';
  }

  if (
    value.includes('leave')
  ) {
    return 'border-purple-500/20 bg-purple-500/10 text-purple-300';
  }

  return 'border-white/10 bg-white/5 text-gray-300';
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusColor(status)}`}
  >
    {readableStatus(status)}
  </span>
);

interface MetricCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  color?: 'purple' | 'green' | 'blue' | 'amber' | 'red';
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  description,
  icon: Icon,
  color = 'purple',
}) => {
  const colors: Record<string, string> = {
    purple: 'bg-purple-500/15 text-purple-300',
    green: 'bg-emerald-500/15 text-emerald-400',
    blue: 'bg-cyan-500/15 text-cyan-300',
    amber: 'bg-amber-500/15 text-amber-300',
    red: 'bg-red-500/15 text-red-300',
  };

  return (
    <div className={`${panel} transition-colors hover:border-white/20`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-gray-400">{label}</span>
        <div className={`rounded-xl p-2 ${colors[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 break-words text-2xl font-bold text-white">
        {typeof value === 'number' ? numberFormat.format(value) : value}
      </div>

      <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
        {description}
      </p>
    </div>
  );
};

const SectionHeading: React.FC<{
  title: string;
  description?: string;
}> = ({ title, description }) => (
  <div className="mb-4">
    <h2 className="text-sm font-bold text-white">{title}</h2>
    {description && (
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    )}
  </div>
);

const StatusBreakdown: React.FC<{
  title: string;
  items: DashboardCountItem[];
}> = ({ title, items }) => {
  const total = items.reduce(
    (sum, item) => sum + Math.max(0, Number(item.count) || 0),
    0,
  );

  return (
    <section className={panel}>
      <h3 className="text-sm font-bold text-white">{title}</h3>

      {items.length === 0 ? (
        <p className="mt-4 text-xs text-gray-500">No records available yet.</p>
      ) : (
        <>
          <div className="mt-2 text-xs text-gray-500">
            Total: <span className="font-semibold text-gray-300">
              {numberFormat.format(total)}
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {items.map((item) => {
              const count = Math.max(0, Number(item.count) || 0);
              const percentage = total ? (count / total) * 100 : 0;

              return (
                <div key={item.status}>
                  <div className="mb-1.5 flex justify-between gap-3 text-xs">
                    <span className="capitalize text-gray-300">
                      {readableStatus(item.status)}
                    </span>
                    <span className="shrink-0 font-semibold text-white">
                      {numberFormat.format(count)}
                      <span className="ml-1 text-gray-500">
                        ({Math.round(percentage)}%)
                      </span>
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#5C3FE0] to-purple-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};

const QuickLink: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}> = ({ title, description, icon: Icon, color, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`${panel} flex items-center justify-between gap-3 text-left transition hover:border-white/25 hover:bg-white/[0.03]`}
  >
    <span className="flex min-w-0 items-center gap-3">
      <span className={`shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold text-white">{title}</span>
        <span className="mt-1 block text-[10px] leading-relaxed text-gray-500">
          {description}
        </span>
      </span>
    </span>
    <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
  </button>
);

const AttendanceTable: React.FC<{
  data: DashboardResponse['todayAttendance'];
}> = ({ data }) => (
  <section className={`${panel} min-w-0`}>
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-bold text-white">
          Today's Attendance
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Check-in, check-out, working hours and attendance status
        </p>
      </div>

      <CalendarCheck className="h-5 w-5 shrink-0 text-cyan-300" />
    </div>

    {data.length === 0 ? (
      <p className="py-6 text-center text-xs text-gray-500">
        No attendance records for today.
      </p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-xs">
          <thead className="text-[10px] uppercase tracking-wide text-gray-500">
            <tr className="border-b border-white/10">
              <th className="pb-3 pr-4 font-medium">Employee</th>
              <th className="pb-3 pr-4 font-medium">Check-in</th>
              <th className="pb-3 pr-4 font-medium">Check-out</th>
              <th className="pb-3 pr-4 font-medium">Hours</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item, index) => (
              <tr
                key={`${item.userId}-${item.date}-${index}`}
                className="border-b border-white/5 last:border-0"
              >
                <td className="py-3 pr-4">
                  <p className="font-semibold text-gray-200">
                    {item.employeeName}
                  </p>

                  <p className="mt-1 text-[10px] text-gray-500">
                    {item.employeeCode || `User ${item.userId}`}
                  </p>
                </td>

                <td className="py-3 pr-4 text-gray-300">
                  {item.checkInTime || '—'}
                </td>

                <td className="py-3 pr-4 text-gray-300">
                  {item.checkOutTime || '—'}
                </td>

                <td className="py-3 pr-4 text-gray-300">
                  {Number(item.workedHours || 0).toFixed(1)} h
                </td>

                <td className="py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={item.status} />

                    {item.isEarlyLeaving && (
                      <StatusBadge status="Early Leaving" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

const LeaveTable: React.FC<{
  data: DashboardResponse['recentLeaveRequests'];
}> = ({ data }) => (
  <section className={`${panel} min-w-0`}>
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-bold text-white">
          Leave Requests This Month
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Latest submitted requests and their current status
        </p>
      </div>
      <Clock className="h-5 w-5 shrink-0 text-amber-300" />
    </div>

    {data.length === 0 ? (
      <p className="py-6 text-center text-xs text-gray-500">
        No leave requests submitted this month.
      </p>
    ) : (
      <div className="space-y-3">
        {data.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
          >
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-200">
                  {item.employeeName}
                </p>
                <p className="mt-1 text-[10px] text-gray-500">
                  {item.employeeCode || `User ${item.userId}`} ·{' '}
                  {readableStatus(item.leaveType)}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </div>

            <p className="mt-3 text-[11px] text-gray-400">
              {item.startDate} – {item.endDate} · {item.requestedDays} day(s)
            </p>
            {item.reason && (
              <p className="mt-2 break-words text-[11px] text-gray-500">
                {item.reason}
              </p>
            )}
          </div>
        ))}
      </div>
    )}
  </section>
);

const PayrollOverview: React.FC<{
  data: DashboardResponse;
}> = ({ data }) => {
  const summary = data.payrollSummary;
  const total = Math.max(0, summary.totalNetSalary);
  const paid = Math.max(0, summary.paidAmount);
  const unpaid = Math.max(0, summary.unpaidAmount);
  const paidPercentage = total > 0 ? Math.min(100, (paid / total) * 100) : 0;

  return (
    <section className={panel}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">Payroll Overview</h3>
          <p className="mt-1 text-xs text-gray-500">
            Current month's payroll records
          </p>
        </div>
        <Wallet className="h-5 w-5 text-purple-300" />
      </div>

      <p className="mt-5 text-xs text-gray-400">Total net payroll</p>
      <p className="mt-1 text-2xl font-bold text-white">
        {currencyFormat.format(total)}
      </p>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-emerald-400 transition-all"
          style={{ width: `${paidPercentage}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between gap-3 text-[10px] text-gray-500">
        <span>{Math.round(paidPercentage)}% paid by amount</span>
        <span>{Math.round(100 - paidPercentage)}% unpaid</span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
          <p className="text-[11px] text-gray-400">Paid</p>
          <p className="mt-1 break-words text-lg font-bold text-emerald-300">
            {currencyFormat.format(paid)}
          </p>
          <p className="mt-1 text-[10px] text-gray-500">
            {numberFormat.format(summary.paidEmployees)} employee(s)
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-3">
          <p className="text-[11px] text-gray-400">Unpaid</p>
          <p className="mt-1 break-words text-lg font-bold text-amber-300">
            {currencyFormat.format(unpaid)}
          </p>
          <p className="mt-1 text-[10px] text-gray-500">
            {numberFormat.format(summary.unpaidEmployees)} employee(s)
          </p>
        </div>
      </div>
    </section>
  );
};

const MonthlyPayrollBars: React.FC<{
  data: DashboardResponse['charts']['monthlyPayroll'];
}> = ({ data }) => {
  const maximum = Math.max(
    1,
    ...data.map((item) =>
      Math.max(Number(item.paidAmount) || 0, Number(item.unpaidAmount) || 0),
    ),
  );

  return (
    <section className={panel}>
      <h3 className="text-sm font-bold text-white">
        Monthly Payroll: Paid vs Unpaid
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        Amounts grouped by payroll cycle month
      </p>

      <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-gray-400">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
          Paid
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
          Unpaid
        </span>
      </div>

      {data.length === 0 ? (
        <p className="py-8 text-xs text-gray-500">No payroll trend available.</p>
      ) : (
        <div className="mt-5 flex h-44 items-end gap-3 overflow-x-auto">
          {data.map((item) => {
            const paidHeight = Math.max(
              0,
              (Math.max(0, item.paidAmount) / maximum) * 100,
            );
            const unpaidHeight = Math.max(
              0,
              (Math.max(0, item.unpaidAmount) / maximum) * 100,
            );

            return (
              <div
                key={`${item.year}-${item.month}`}
                className="flex h-full min-w-10 flex-1 flex-col items-center justify-end gap-2"
                title={`${monthLabel(item.year, item.month)} · Paid ${currencyFormat.format(item.paidAmount)} · Unpaid ${currencyFormat.format(item.unpaidAmount)}`}
              >
                <div className="flex h-32 w-full items-end justify-center gap-1">
                  <div
                    className="w-1/2 max-w-5 rounded-t-sm bg-emerald-400"
                    style={{ height: `${paidHeight}%` }}
                  />
                  <div
                    className="w-1/2 max-w-5 rounded-t-sm bg-amber-400"
                    style={{ height: `${unpaidHeight}%` }}
                  />
                </div>
                <span className="whitespace-nowrap text-[9px] text-gray-500">
                  {monthLabel(item.year, item.month)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

const MonthlyAttendanceBars: React.FC<{
  data: DashboardResponse['charts']['monthlyAttendance'];
}> = ({ data }) => {
  const statuses = [
    { key: 'present', label: 'Present', color: 'bg-emerald-400' },
    { key: 'late', label: 'Late', color: 'bg-amber-400' },
    { key: 'absent', label: 'Absent', color: 'bg-red-400' },
    { key: 'halfDay', label: 'Half day', color: 'bg-cyan-400' },
    { key: 'onLeave', label: 'On leave', color: 'bg-purple-400' },
  ] as const;

  const maximum = Math.max(
    1,
    ...data.map((item) =>
      Math.max(
        item.present,
        item.late,
        item.absent,
        item.halfDay,
        item.onLeave,
      ),
    ),
  );

  return (
    <section className={panel}>
      <h3 className="text-sm font-bold text-white">
        Monthly Attendance by Status
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        Recorded attendance entries for the last six months
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        {statuses.map((status) => (
          <span
            key={status.key}
            className="flex items-center gap-1.5 text-[10px] text-gray-400"
          >
            <span className={`h-2 w-2 rounded-sm ${status.color}`} />
            {status.label}
          </span>
        ))}
      </div>

      {data.length === 0 ? (
        <p className="py-8 text-xs text-gray-500">
          No attendance trend available.
        </p>
      ) : (
        <div className="mt-5 flex h-44 items-end gap-3 overflow-x-auto">
          {data.map((item) => (
            <div
              key={`${item.year}-${item.month}`}
              className="flex h-full min-w-10 flex-1 flex-col items-center justify-end gap-2"
            >
              <div className="flex h-32 w-full items-end justify-center gap-0.5">
                {statuses.map((status) => {
                  const value = item[status.key];
                  const height = value > 0 ? Math.max(3, (value / maximum) * 100) : 0;

                  return (
                    <div
                      key={status.key}
                      title={`${status.label}: ${value}`}
                      className={`w-full max-w-3 rounded-t-sm ${status.color}`}
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>
              <span className="whitespace-nowrap text-[9px] text-gray-500">
                {monthLabel(item.year, item.month)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

interface BranchDisplayInfo {
  id: number | string;
  tenantId?: number | string | null;
  branchName?: string | null;
  name?: string | null;
}

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    selectedBranchId,
    branches,
    setActiveTab,
  } = useApp();

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const roleName = (
    currentUser?.roleName ??
    currentUser?.role ??
    ''
  ).trim().toLowerCase();

  const canSelectBranch =
    roleName === 'company_admin' || roleName === 'hr_ops';

  const selectedBranchName = React.useMemo(() => {
    if (selectedBranchId == null || !branches?.length) return undefined;

    const tenantId = currentUser?.tenantId;

    const matchingBranch = (
      branches as unknown as BranchDisplayInfo[]
    ).find((branch) => {
      if (Number(branch.id) !== Number(selectedBranchId)) return false;

      if (branch.tenantId == null || tenantId == null) return true;

      return Number(branch.tenantId) === Number(tenantId);
    });

    return (
      matchingBranch?.branchName?.trim() ||
      matchingBranch?.name?.trim() ||
      undefined
    );
  }, [branches, currentUser?.tenantId, selectedBranchId]);

  const loadDashboard = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');

    try {
      const result = await getDashboard({
        branchId: canSelectBranch ? selectedBranchId : undefined,
      });

      if (currentRequest === requestId.current) setData(result);
    } catch (err) {
      if (currentRequest === requestId.current) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load dashboard data.',
        );
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [canSelectBranch, selectedBranchId]);

  useEffect(() => {
    if (!currentUser) {
      setData(null);
      setLoading(false);
      return;
    }

    void loadDashboard();

    return () => {
      requestId.current += 1;
    };
  }, [currentUser, loadDashboard]);

  if (!currentUser) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-sm text-gray-400">
        Loading your workspace...
      </div>
    );
  }

  const role = (
    data?.role ||
    currentUser.roleName ||
    currentUser.role ||
    ''
  ).trim().toLowerCase();

  const isSalesStaff = role === 'sales_staff';
  const isSupportStaff = role === 'support_staff';
  const isDeveloper = role === 'developer';
  const isHR = role === 'hr_ops';
  const isManager = role === 'branch_manager';
  const isCompanyAdmin = role === 'company_admin';
  const isSuperAdmin = role === 'super_admin';
  const isKnowledgeTrainer = role === 'knowledge_trainer';

  const isManagement = isManager || isCompanyAdmin || isHR;
  const isIndividual =
    isSalesStaff || isSupportStaff || isDeveloper || isKnowledgeTrainer;

  if (loading && !data) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        <p className="text-sm text-gray-400">Loading your dashboard...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={`${panel} flex flex-col items-start gap-3`}>
        <div className="flex items-center gap-2 text-red-300">
          <AlertCircle className="h-5 w-5" />
          <h2 className="font-semibold">Dashboard could not load</h2>
        </div>
        <p className="text-sm text-gray-400">{error}</p>
        <button
          type="button"
          onClick={() => void loadDashboard()}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, charts } = data;

  const heading = isSuperAdmin
    ? 'Platform Overview'
    : isCompanyAdmin
      ? 'Company Overview'
      : isHR
        ? 'HR Operations'
        : isManager
          ? 'Branch Overview'
          : isSalesStaff
            ? 'Sales Performance'
            : isDeveloper
              ? 'Developer Workspace'
              : isSupportStaff
                ? 'Support Operations'
                : isKnowledgeTrainer
                  ? 'Learning & Training'
                  : 'Dashboard';

  const description = isSuperAdmin
    ? 'Tenant growth, branches, users and payment overview.'
    : isCompanyAdmin
      ? `Workforce and finance overview for ${currentUser.tenantName ?? 'your company'}.`
      : isHR
        ? 'Attendance, leave requests, payroll and salary approvals.'
        : isManager
          ? 'Branch attendance, employee activity and operational progress.'
          : 'Your attendance, work activity and available payroll information.';

  const priorityItems = charts.developerTaskPriority as Array<{
    status?: string;
    priority?: string;
    count: number;
  }>;

  const branchValue =
    selectedBranchId != null
      ? selectedBranchName ?? `Branch ID: ${selectedBranchId}`
      : kpis.activeBranches;

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col justify-between gap-4 border-b border-white/5 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              {heading}
            </h1>
            {currentUser.designation && (
              <span className="rounded-full border border-purple-500/30 bg-purple-500/15 px-2 py-1 text-[10px] font-semibold text-purple-300">
                {currentUser.designation}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-400">{description}</p>
          {isManagement && selectedBranchId != null && (
            <p className="mt-2 text-[11px] text-purple-300">
              Current branch: {selectedBranchName ?? `Branch ${selectedBranchId}`}
            </p>
          )}
          <p className="mt-1 text-[10px] text-gray-600">
            Updated {new Date(data.generatedAtUtc).toLocaleString('en-IN')}
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void loadDashboard()}
          className="flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10 disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">
          <span>Refresh failed. Showing the last successfully loaded dashboard.</span>
          <button type="button" onClick={() => void loadDashboard()} className="shrink-0 underline">
            Retry
          </button>
        </div>
      )}

      {isSuperAdmin && data.superAdmin && (
        <section>
          <SectionHeading title="Platform Statistics" description="Tenant and platform overview." />
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <MetricCard label="Total Tenants" value={data.superAdmin.totalTenants} description="Registered companies" icon={Building2} />
            <MetricCard label="Active Tenants" value={data.superAdmin.activeTenants} description="Currently active companies" icon={CheckCircle2} color="green" />
            <MetricCard label="Active Branches" value={kpis.activeBranches} description="Branches in the current scope" icon={Building2} color="blue" />
            <MetricCard label="Active Users" value={kpis.activeUsers} description="Users in the current scope" icon={Users} />
          </div>
        </section>
      )}

      {isManagement && (
        <>
          <section>
            <SectionHeading title="Daily Operations" description="Today's recorded workforce activity." />
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <MetricCard label="Active Employees" value={kpis.activeUsers} description="Active users in your scope" icon={Users} />
              <MetricCard label="Present Today" value={kpis.employeesPresentToday} description="Distinct employees marked Present or Late" icon={CalendarCheck} color="green" />
              <MetricCard label="Recorded Absences" value={kpis.recordedAbsencesToday} description="Employees explicitly marked Absent" icon={Clock} color="red" />
              <MetricCard label="Active Branches" value={branchValue} description={selectedBranchId != null ? 'Selected branch' : 'Active branches in your scope'} icon={Building2} color="blue" />
            </div>
          </section>

          <section>
            <SectionHeading title="Monthly Operations" description="Payroll, requests and items requiring attention." />
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              <MetricCard label="Leave Requests" value={kpis.leaveRequests} description="Requests submitted this month" icon={Clock} color="amber" />
              <MetricCard label="Payroll Records" value={kpis.payrollRecordsThisMonth} description="Records created this month" icon={CreditCard} color="blue" />
              <MetricCard label="Pending Salary Changes" value={kpis.pendingSalaryChanges} description="Awaiting salary change approval" icon={TrendingUp} color="amber" />
            </div>
          </section>

          <PayrollOverview data={data} />

          <section>
            <SectionHeading title="Attendance & Leave Details" description="Review the latest operational records." />
            <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
              <AttendanceTable data={data.todayAttendance} />
              <LeaveTable data={data.recentLeaveRequests} />
            </div>
          </section>
        </>
      )}

      {isIndividual && (
        <section>
          <SectionHeading title="My Overview" description="Personal records only." />
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            <MetricCard label="My Attendance Today" value={kpis.attendanceRecordsToday} description="Your attendance records today" icon={CalendarCheck} color="green" />
            <MetricCard label="My Leave Requests" value={kpis.leaveRequests} description="Requests submitted this month" icon={Clock} color="amber" />
            <MetricCard label="My Payroll Records" value={kpis.payrollRecordsThisMonth} description="Records created this month" icon={CreditCard} color="blue" />
          </div>
          <div className="mt-4">
            <AttendanceTable data={data.todayAttendance} />
          </div>
        </section>
      )}

      <section>
        <SectionHeading title="Status Overview" description="Current status counts in your authorized scope." />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {isSuperAdmin && data.superAdmin && (
            <StatusBreakdown title="Tenant Payment Status" items={data.superAdmin.paymentStatus} />
          )}
          <StatusBreakdown title="Today's Attendance Status" items={charts.attendanceStatus} />
          <StatusBreakdown title="Leave Request Status" items={charts.leaveStatus} />
          {(isCompanyAdmin || isHR) && (
            <>
              <StatusBreakdown title="Salary Change Status" items={charts.salaryChangeStatus} />
              <StatusBreakdown title="Payroll Cycle Status" items={charts.payrollStatus} />
            </>
          )}
          {isDeveloper && (
            <>
              <StatusBreakdown title="Developer Task Status" items={charts.developerTaskStatus} />
              <StatusBreakdown
                title="Developer Task Priority"
                items={priorityItems.map((item) => ({
                  status: item.priority ?? item.status ?? 'Unknown',
                  count: item.count,
                }))}
              />
            </>
          )}
        </div>
      </section>

      {(isManagement || isDeveloper || isIndividual) && (
        <section>
          <SectionHeading title="Monthly Trends" description="Attendance status and payroll payment progress." />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <MonthlyAttendanceBars data={charts.monthlyAttendance} />
            {(isCompanyAdmin || isHR) && (
              <MonthlyPayrollBars data={charts.monthlyPayroll} />
            )}
          </div>
        </section>
      )}

      <section>
        <SectionHeading title="Quick Access" description="Open the areas relevant to your role." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(isCompanyAdmin || isHR || isManager) && (
            <>
              <QuickLink title="Attendance" description="Review attendance and leave records." icon={CalendarCheck} color="text-cyan-300" onClick={() => setActiveTab('attendance')} />
              <QuickLink title="Staff Management" description="Manage employees in your authorized scope." icon={Users} color="text-emerald-300" onClick={() => setActiveTab('staff')} />
              <QuickLink title="Salary & Payroll" description="Review payroll and payslips." icon={CreditCard} color="text-purple-300" onClick={() => setActiveTab('payroll')} />
            </>
          )}

          {isIndividual && (
            <>
              <QuickLink title="My Attendance" description="Review your attendance records." icon={CalendarCheck} color="text-cyan-300" onClick={() => setActiveTab('attendance')} />
              <QuickLink title="My Salary" description="View your salary details and payslips." icon={Wallet} color="text-purple-300" onClick={() => setActiveTab('payroll')} />
            </>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('knowledge_hub')}
            className="group rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#120e3a] to-[#09081E] p-5 text-left transition hover:border-purple-500/50"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-white">
              <Video className="h-4 w-4 text-purple-300" />
              CEO Knowledge Hub
            </span>
            <p className="mt-2 text-xs leading-relaxed text-gray-400">
              Access leadership masterclasses and training resources.
            </p>
            <span className="mt-4 flex items-center gap-2 text-xs font-semibold text-purple-300">
              Explore learning
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </button>
        </div>
      </section>
    </div>
  );
};
