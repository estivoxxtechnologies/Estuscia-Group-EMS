
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
  FileSpreadsheet,
  Play,
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

const panel = 'rounded-2xl border border-white/10 bg-[#09081E] p-5';

const numberFormat = new Intl.NumberFormat('en-IN');

const monthLabel = (year: number, month: number) =>
  new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
    month: 'short',
    year: '2-digit',
  });

const readableStatus = (value: string) =>
  String(value ?? '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ');

interface MetricCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  color?: 'purple' | 'green' | 'blue' | 'amber' | 'red';
}

/**
 * Branch fields supported here:
 * - id
 * - tenantId (optional)
 * - branchName (preferred)
 * - name (fallback)
 */
interface BranchDisplayInfo {
  id: number | string;
  tenantId?: number | string | null;
  branchName?: string | null;
  name?: string | null;
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
        <p className="mt-4 text-xs text-gray-500">
          No records available yet.
        </p>
      ) : (
        <>
          <div className="mt-2 text-xs text-gray-500">
            Total:{' '}
            <span className="font-semibold text-gray-300">
              {numberFormat.format(total)}
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {items.map((item) => {
              const count = Math.max(0, Number(item.count) || 0);
              const percentage = total
                ? Math.round((count / total) * 100)
                : 0;

              return (
                <div key={item.status}>
                  <div className="mb-1.5 flex justify-between gap-3 text-xs">
                    <span className="capitalize text-gray-300">
                      {readableStatus(item.status)}
                    </span>

                    <span className="shrink-0 font-semibold text-white">
                      {numberFormat.format(count)}
                      <span className="ml-1 text-gray-500">
                        ({percentage}%)
                      </span>
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#5C3FE0] to-purple-400 transition-all"
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

const MonthlyBars: React.FC<{
  title: string;
  data: { year: number; month: number; value: number }[];
  valueLabel: string;
}> = ({ title, data, valueLabel }) => {
  const maximum = Math.max(
    1,
    ...data.map((item) => Math.max(0, Number(item.value) || 0)),
  );

  return (
    <section className={panel}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <span className="text-[10px] text-gray-500">{valueLabel}</span>
      </div>

      {data.length === 0 ? (
        <p className="mt-5 text-xs text-gray-500">
          No monthly data available.
        </p>
      ) : (
        <div className="mt-5 flex h-40 items-end gap-2 sm:gap-3">
          {data.map((item) => {
            const value = Math.max(0, Number(item.value) || 0);
            const height =
              value > 0 ? Math.max(5, (value / maximum) * 100) : 0;

            return (
              <div
                key={`${item.year}-${item.month}`}
                className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                title={`${monthLabel(item.year, item.month)}: ${numberFormat.format(value)} ${valueLabel}`}
              >
                <span className="max-w-full truncate text-[9px] text-gray-400">
                  {numberFormat.format(value)}
                </span>

                <div className="flex h-24 w-full items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-[#5C3FE0] to-purple-400 transition-all"
                    style={{ height: `${height}%` }}
                  />
                </div>

                <span className="text-center text-[9px] text-gray-500">
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

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    selectedBranchId,
    branches,
    setActiveTab,
    setIsBatchUploadOpen,
  } = useApp();

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Prevent an older request from overwriting data for a newer selection.
  const dashboardRequestId = useRef(0);

  const roleName = (
    currentUser?.roleName ??
    currentUser?.role ??
    ''
  )
    .trim()
    .toLowerCase();

  const canSelectBranch =
    roleName === 'company_admin' || roleName === 'hr_ops';

  /**
   * Resolve the selected branch name using the branch ID.
   * The branches collection is expected to contain branches
   * already loaded for the current user's authorized tenant.
   *
   * If tenantId is present on a branch, verify that it matches
   * the current user's tenant before using the branch.
   */
  const selectedBranchName = React.useMemo(() => {
    if (selectedBranchId == null || !branches?.length) {
      return undefined;
    }

    const tenantId = currentUser?.tenantId;

    const matchingBranch = (
      branches as unknown as BranchDisplayInfo[]
    ).find((branch) => {
      if (Number(branch.id) !== Number(selectedBranchId)) {
        return false;
      }

      // If the branch has no tenant ID, rely on the tenant-scoped
      // branches collection supplied by AppContext.
      if (
        branch.tenantId == null ||
        tenantId == null
      ) {
        return true;
      }

      return Number(branch.tenantId) === Number(tenantId);
    });

    return (
      matchingBranch?.branchName?.trim() ||
      matchingBranch?.name?.trim() ||
      undefined
    );
  }, [branches, currentUser?.tenantId, selectedBranchId]);

  const activeBranchesValue: string | number =
    selectedBranchId != null
      ? selectedBranchName ?? `Branch ID: ${selectedBranchId}`
      : data?.kpis.activeBranches ?? 0;

  const loadDashboard = useCallback(async () => {
    const requestId = ++dashboardRequestId.current;

    setLoading(true);
    setError('');

    try {
      const result = await getDashboard({
        branchId: canSelectBranch ? selectedBranchId : undefined,
      });

      if (requestId !== dashboardRequestId.current) return;

      setData(result);
    } catch (err) {
      if (requestId !== dashboardRequestId.current) return;

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load dashboard data.',
      );
    } finally {
      if (requestId === dashboardRequestId.current) {
        setLoading(false);
      }
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
      dashboardRequestId.current += 1;
    };
  }, [currentUser, loadDashboard]);

  const role = (
    data?.role ||
    currentUser?.roleName ||
    currentUser?.role ||
    ''
  )
    .trim()
    .toLowerCase();

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
    isSalesStaff ||
    isSupportStaff ||
    isDeveloper ||
    isKnowledgeTrainer;

  if (!currentUser) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-sm text-gray-400">
        Loading your workspace...
      </div>
    );
  }

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
    ? 'Tenant growth, branches, users and subscription payment overview.'
    : isCompanyAdmin
      ? `Operational and workforce overview for ${currentUser.tenantName ?? 'your company'}.`
      : isHR
        ? 'Workforce attendance, leave requests, payroll and salary approvals.'
        : isManager
          ? 'Branch attendance, employee activity and operational progress.'
          : isSalesStaff
            ? 'Your daily sales activity, work logs and monthly performance.'
            : isDeveloper
              ? 'Your engineering activity, attendance and task progress.'
              : isSupportStaff
                ? 'Your work activity, attendance and operational information.'
                : isKnowledgeTrainer
                  ? 'Learning activity, work records and attendance.'
                  : 'Your workspace overview.';

  const priorityItems = (
    charts.developerTaskPriority as Array<{
      priority?: string;
      status?: string;
      count: number;
    }>
  ).map((item) => ({
    status: item.priority ?? item.status ?? 'Unknown',
    count: item.count,
  }));

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

          <p className="mt-1 text-[10px] text-gray-600">
            Updated {new Date(data.generatedAtUtc).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* {(isHR || isManager) && (
            <button
              type="button"
              onClick={() => setIsBatchUploadOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-purple-500"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Import Attendance
            </button>
          )} */}

          <button
            type="button"
            disabled={loading}
            onClick={() => void loadDashboard()}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">
          <span>
            Refresh failed. Showing the last successfully loaded dashboard.
          </span>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="shrink-0 underline"
          >
            Retry
          </button>
        </div>
      )}

      {isSuperAdmin && data.superAdmin && (
        <section>
          <SectionHeading
            title="Platform Statistics"
            description="Company-wide platform and tenant information."
          />

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard
              label="Total Tenants"
              value={data.superAdmin.totalTenants}
              description="Registered companies"
              icon={Building2}
            />
            <MetricCard
              label="Active Tenants"
              value={data.superAdmin.activeTenants}
              description="Currently active companies"
              icon={CheckCircle2}
              color="green"
            />
            <MetricCard
              label="Active Branches"
              value={kpis.activeBranches}
              description="Branches in the current scope"
              icon={Building2}
              color="blue"
            />
            <MetricCard
              label="Active Users"
              value={kpis.activeUsers}
              description="Users in the current scope"
              icon={Users}
            />
          </div>
        </section>
      )}

      {isManagement && (
        <>
          <section>
            <SectionHeading
              title="Daily Operations"
              description="Current attendance and workforce workload."
            />

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <MetricCard
                label="Active Employees"
                value={kpis.activeUsers}
                description="Active users in your scope"
                icon={Users}
              />
              <MetricCard
                label="Attendance Records Today"
                value={kpis.attendanceRecordsToday}
                description="Attendance entries dated today"
                icon={CalendarCheck}
                color="green"
              />
              <MetricCard
                label="Leave Requests"
                value={kpis.leaveRequests}
                description="Leave requests in your scope"
                icon={Clock}
                color="amber"
              />
              <MetricCard
                label="Active Branches"
                value={activeBranchesValue}
                description={
                  selectedBranchId != null
                    ? 'Currently selected branch'
                    : 'Total active branches across your scope'
                }
                icon={Building2}
                color="blue"
              />
            </div>
          </section>

          <section>
            <SectionHeading
              title="Monthly Operations"
              description="Payroll, approvals and work requiring attention."
            />

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              <MetricCard
                label="Payroll Cycles"
                value={kpis.payrollCycles}
                description="Payroll cycles in your scope"
                icon={CreditCard}
                color="blue"
              />
              <MetricCard
                label="Payroll Records This Month"
                value={kpis.payrollRecordsThisMonth}
                description="Monthly payroll records"
                icon={CreditCard}
              />
              <MetricCard
                label="Salary Changes Pending"
                value={kpis.pendingSalaryChanges}
                description="Pending salary change approvals"
                icon={TrendingUp}
                color="amber"
              />
            </div>
          </section>
        </>
      )}

      {isIndividual && (
        <section>
          <SectionHeading
            title="My Daily Overview"
            description="Work activity and attendance information available to your account."
          />

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            <MetricCard
              label="Attendance Records Today"
              value={kpis.attendanceRecordsToday}
              description="Attendance records returned by the API"
              icon={CalendarCheck}
              color="green"
            />
            <MetricCard
              label="My Leave Requests"
              value={kpis.leaveRequests}
              description="Leave requests"
              icon={Clock}
              color="amber"
            />
            <MetricCard
              label="Payroll Records This Month"
              value={kpis.payrollRecordsThisMonth}
              description="Monthly payroll records"
              icon={CreditCard}
              color="blue"
            />
          </div>
        </section>
      )}

      <section>
        <SectionHeading
          title="Attendance & Requests"
          description="Status breakdowns from the dashboard API."
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {isSuperAdmin && data.superAdmin && (
            <StatusBreakdown
              title="Tenant Payment Status"
              items={data.superAdmin.paymentStatus}
            />
          )}

          <StatusBreakdown
            title="Attendance Status"
            items={charts.attendanceStatus}
          />

          <StatusBreakdown
            title="Leave Request Status"
            items={charts.leaveStatus}
          />

          {(isCompanyAdmin || isHR) && (
            <>
              <StatusBreakdown
                title="Salary Change Status"
                items={charts.salaryChangeStatus}
              />
              <StatusBreakdown
                title="Payroll Cycle Status"
                items={charts.payrollStatus}
              />
            </>
          )}

          {isDeveloper && (
            <>
              <StatusBreakdown
                title="Developer Task Status"
                items={charts.developerTaskStatus}
              />
              <StatusBreakdown
                title="Developer Task Priority"
                items={priorityItems}
              />
            </>
          )}
        </div>
      </section>

      {(isCompanyAdmin || isHR || isManager || isDeveloper || isIndividual) && (
        <section>
          <SectionHeading
            title="Monthly Trends"
            description="Historical totals returned by the backend."
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <MonthlyBars
              title="Monthly Attendance Records"
              data={charts.monthlyAttendance.map((item) => ({
                year: item.year,
                month: item.month,
                value: item.records,
              }))}
              valueLabel="Records"
            />

            {(isCompanyAdmin || isHR) && (
              <MonthlyBars
                title="Monthly Net Payroll"
                data={charts.monthlyPayroll.map((item) => ({
                  year: item.year,
                  month: item.month,
                  value: item.netSalary,
                }))}
                valueLabel="Net salary"
              />
            )}
          </div>
        </section>
      )}

      <section>
        <SectionHeading
          title="Quick Access"
          description="Open the areas relevant to your role."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(isCompanyAdmin || isHR || isManager) && (
            <>
              <QuickLink
                title="Attendance"
                description="Review attendance records and daily attendance status."
                icon={CalendarCheck}
                color="text-cyan-300"
                onClick={() => setActiveTab('attendance')}
              />

              <QuickLink
                title="Staff Management"
                description="Manage staff within your authorized scope."
                icon={Users}
                color="text-emerald-300"
                onClick={() => setActiveTab('staff')}
              />

              <QuickLink
                title="Salary & Payroll"
                description="Review payroll, salaries and payslips."
                icon={CreditCard}
                color="text-purple-300"
                onClick={() => setActiveTab('payroll')}
              />
            </>
          )}

          {(isDeveloper ||
            isSupportStaff ||
            isKnowledgeTrainer ||
            isSalesStaff) && (
              <>
                <QuickLink
                  title="Salary"
                  description="View your salary details and payslips."
                  icon={Wallet}
                  color="text-purple-300"
                  onClick={() => setActiveTab('payroll')}
                />

                <QuickLink
                  title="My Attendance"
                  description="Review your attendance records."
                  icon={CalendarCheck}
                  color="text-cyan-300"
                  onClick={() => setActiveTab('attendance')}
                />
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
              <Play className="h-3.5 w-3.5" />
              Explore learning
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </button>
        </div>
      </section>
    </div>
  );
};
