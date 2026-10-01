export type PayrollCycleStatus =
  | 'Draft'
  | 'SubmittedByHr'
  | 'ApprovedByCompanyAdmin'
  | 'Rejected'
  | 'Processing'
  | 'Paid'
  | 'Locked';

export type PayrollAdjustmentType = 'Bonus' | 'Deduction';

export type PayrollAdjustmentStatus =
  | 'PendingApproval'
  | 'ApprovedByCompanyAdmin'
  | 'Rejected';

export interface PayrollCycle {
  id: number;
  tenantId?: number | null;

  year: number;
  month: number;
  monthYear: string;

  status: PayrollCycleStatus;

  totalBasicSalary: number;
  totalBonus: number;
  totalDeduction: number;
  totalNetSalary: number;

  submittedByUserId?: number | null;
  submittedAtUtc?: string | null;

  approvedByUserId?: number | null;
  approvedAtUtc?: string | null;

  rejectedByUserId?: number | null;
  rejectedAtUtc?: string | null;
  rejectionReason?: string | null;

  paidByUserId?: number | null;
  paidAtUtc?: string | null;

  isLocked: boolean;

  payrollRecords?: PayrollRecord[];
}

export interface PayrollRecord {
  id: number;
  tenantId?: number | null;
  payrollCycleId: number;
  userId: number;

  basicSalary: number;
  totalBonus: number;
  totalDeduction: number;
  netSalary: number;

  status: PayrollCycleStatus;

  submittedByUserId?: number | null;
  submittedAtUtc?: string | null;

  approvedByUserId?: number | null;
  approvedAtUtc?: string | null;

  paidByUserId?: number | null;
  paidAtUtc?: string | null;

  paymentStatus: PayrollPaymentStatus;

  isLocked: boolean;

  employeeName: string;
  employeeCode: string;
  designation?: string;
  department?: string;

  branchId?: number | null;

  currencyCode: string;
  currencySymbol: string;

  adjustments?: PayrollAdjustment[];
}

export type PayrollPaymentStatus =
  | 'Pending'
  | 'Paid';

export interface PayrollAdjustment {
  id: number;
  payrollCycleId: number;
  userId: number;

  type: PayrollAdjustmentType;
  amount: number;
  reason: string;

  status: PayrollAdjustmentStatus;

  approvedByUserId?: number | null;
  approvedAtUtc?: string | null;

  rejectedByUserId?: number | null;
  rejectedAtUtc?: string | null;

  rejectionReason?: string | null;
}

export interface Payslip {
  id: number;
  payrollCycleId: number;
  userId: number;

  monthYear: string;

  employeeName: string;
  employeeCode: string;

  designation?: string;
  department?: string;
  branchName?: string;

  basicSalary: number;
  totalBonus: number;
  totalDeduction: number;
  netSalary: number;

  currencyCode: string;
  currencySymbol: string;

  status: PayrollCycleStatus;
  isLocked: boolean;

  generatedAtUtc: string;

  adjustments: PayrollAdjustment[];
}

export interface CreatePayrollAdjustmentRequest {
  userId: number;
  type: PayrollAdjustmentType;
  amount: number;
  reason: string;
}