
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
  present: number;
  late: number;
  absent: number;
  halfDay: number;
  onLeave: number;
}

export interface DashboardMonthlyPayroll {
  year: number;
  month: number;
  netSalary: number;
  bonus: number;
  deductions: number;
  paidAmount: number;
  unpaidAmount: number;
  paidEmployees: number;
  unpaidEmployees: number;
}

export interface DashboardMonthlyWorkLog {
  year: number;
  month: number;
  entries: number;
  hours: number;
}

export interface DashboardAttendanceItem {
  userId: number;
  employeeName: string;
  employeeCode?: string | null;
  branchId?: number | null;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  workedHours: number;
  requiredHours?: number;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  status: string;
  isLate: boolean;
  isHalfDay: boolean;
  isEarlyLeaving: boolean;
}

export interface DashboardLeaveItem {
  id: number;
  userId: number;
  employeeName: string;
  employeeCode: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  reason: string | null;
  status: string;
  createdAtUtc: string;
}

export interface DashboardPayrollSummary {
  totalNetSalary: number;
  paidAmount: number;
  unpaidAmount: number;
  paidEmployees: number;
  unpaidEmployees: number;
  totalEmployees: number;
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
    employeesPresentToday: number;
    recordedAbsencesToday: number;
    leaveRequests: number;
    payrollCycles: number;
    payrollRecordsThisMonth: number;
    pendingSalaryChanges: number;
    overdueDeveloperTasks: number;
  };
  payrollSummary: DashboardPayrollSummary;
  todayAttendance: DashboardAttendanceItem[];
  recentLeaveRequests: DashboardLeaveItem[];
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
