
import { apiRequest } from './client';

export interface DashboardCountItem {
  status: string;
  count: number;
}

export interface DashboardMonthlyAttendance {
  year: number;
  month: number;
  records: number;
  workedHours: number;
}

export interface DashboardMonthlyPayroll {
  year: number;
  month: number;
  netSalary: number;
  bonus: number;
  deductions: number;
}

export interface DashboardMonthlyWorkLog {
  year: number;
  month: number;
  entries: number;
  hours: number;
}

export interface DashboardResponse {
  role: string;
  generatedAtUtc: string;
  period: {
    today: string;
    monthStart: string;
    nextMonth: string;
  };
  kpis: {
    activeUsers: number;
    activeBranches: number;
    attendanceRecordsToday: number;
    leaveRequests: number;
    payrollCycles: number;
    payrollRecordsThisMonth: number;
    pendingSalaryChanges: number;
    overdueDeveloperTasks: number;
  };
  charts: {
    attendanceStatus: DashboardCountItem[];
    leaveStatus: DashboardCountItem[];
    salaryChangeStatus: DashboardCountItem[];
    payrollStatus: DashboardCountItem[];
    monthlyAttendance: DashboardMonthlyAttendance[];
    monthlyPayroll: DashboardMonthlyPayroll[];
    developerTaskStatus: DashboardCountItem[];
    developerTaskPriority: DashboardCountItem[];
    monthlyWorkLogs: DashboardMonthlyWorkLog[];
  };
  superAdmin?: {
    totalTenants: number;
    activeTenants: number;
    paymentStatus: DashboardCountItem[];
  } | null;
}

export interface DashboardFilters {
  branchId?: number | null;
}

export async function getDashboard(
  filters: DashboardFilters = {},
): Promise<DashboardResponse> {
  const params = new URLSearchParams();

  if (filters.branchId != null) {
    params.set('branchId', String(filters.branchId));
  }

  const query = params.toString();
  const endpoint = `/Dashboard${query ? `?${query}` : ''}`;

  return apiRequest<DashboardResponse>(endpoint, {
    method: 'GET',
  });
}
