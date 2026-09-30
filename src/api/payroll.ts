import { apiRequest } from './client';

import {
  PayrollCycle,
  PayrollRecord,
  Payslip,
  PayrollAdjustment,
  CreatePayrollAdjustmentRequest,
} from '../types/payrollCycle';

// ============================================================
// GET PAYROLL CYCLES
// GET /api/Payroll/cycles
// ============================================================

export const getPayrollCycles = async (
  year?: number,
): Promise<PayrollCycle[]> => {
  const params = new URLSearchParams();

  if (year !== undefined) {
    params.set('year', String(year));
  }

  const query = params.toString();

  return apiRequest<PayrollCycle[]>(
    query
      ? `/Payroll/cycles?${query}`
      : '/Payroll/cycles',
    {
      method: 'GET',
    },
  );
};

// ============================================================
// GET SINGLE PAYROLL CYCLE
// GET /api/Payroll/cycles/{id}
// ============================================================

export const getPayrollCycle = async (
  id: number,
): Promise<PayrollCycle> => {
  return apiRequest<PayrollCycle>(
    `/Payroll/cycles/${id}`,
    {
      method: 'GET',
    },
  );
};

// ============================================================
// GET PAYROLL RECORDS
// ============================================================

export const getPayrollRecords = async (
  cycleId: number,
): Promise<PayrollRecord[]> => {
  const cycle = await getPayrollCycle(cycleId);

  return cycle.payrollRecords ?? [];
};

// ============================================================
// GENERATE PAYROLL
// ============================================================

export const generatePayroll = async (
  year: number,
  month: number,
  branchId: number | null,
): Promise<PayrollCycle> => {
  return apiRequest<PayrollCycle>(
    '/Payroll/generate',
    {
      method: 'POST',

      body: JSON.stringify({
        year,
        month,
        branchId,
      }),
    },
  );
};

// ============================================================
// DELETE PAYROLL CYCLE
// DELETE /api/Payroll/{id}
// ============================================================

export const deletePayroll = async (
  id: number,
): Promise<unknown> => {
  return apiRequest(
    `/Payroll/${id}`,
    {
      method: 'DELETE',
    },
  );
};

// ============================================================
// SUBMIT PAYROLL
// ============================================================

export const submitPayroll = async (
  id: number,
): Promise<PayrollCycle> => {
  await apiRequest(
    `/Payroll/${id}/submit`,
    {
      method: 'POST',
    },
  );

  return getPayrollCycle(id);
};

// ============================================================
// APPROVE PAYROLL
// ============================================================

export const approvePayroll = async (
  id: number,
): Promise<PayrollCycle> => {
  await apiRequest(
    `/Payroll/${id}/approve`,
    {
      method: 'POST',
    },
  );

  return getPayrollCycle(id);
};

// ============================================================
// REJECT PAYROLL
// ============================================================

export const rejectPayroll = async (
  id: number,
  reason: string,
): Promise<PayrollCycle> => {
  await apiRequest(
    `/Payroll/${id}/reject`,
    {
      method: 'POST',

      body: JSON.stringify({
        reason,
      }),
    },
  );

  return getPayrollCycle(id);
};

// ============================================================
// PAY / LOCK PAYROLL
// ============================================================

export const payPayroll = async (
  id: number,
): Promise<PayrollCycle> => {
  await apiRequest(
    `/Payroll/${id}/pay`,
    {
      method: 'POST',
    },
  );

  return getPayrollCycle(id);
};

// ============================================================
// GET MY PAYSLIPS
// ============================================================

export const getMyPayslips = async (): Promise<Payslip[]> => {
  return apiRequest<Payslip[]>(
    '/Payroll/my-payslips',
    {
      method: 'GET',
    },
  );
};

// ============================================================
// GET EMPLOYEE PAYSLIPS
// ============================================================

export interface PayrollPayslipFilters {
  cycleId?: number;
  userId?: number;
  branchId?: number | null;
}

export const getPayrollPayslips = async (
  filters?: PayrollPayslipFilters,
): Promise<Payslip[]> => {
  const params = new URLSearchParams();

  if (filters?.cycleId !== undefined) {
    params.set(
      'cycleId',
      String(filters.cycleId),
    );
  }

  if (filters?.userId !== undefined) {
    params.set(
      'userId',
      String(filters.userId),
    );
  }

  if (
    filters?.branchId !== undefined &&
    filters?.branchId !== null
  ) {
    params.set(
      'branchId',
      String(filters.branchId),
    );
  }

  const query = params.toString();

  return apiRequest<Payslip[]>(
    query
      ? `/Payroll/payslips?${query}`
      : '/Payroll/payslips',
    {
      method: 'GET',
    },
  );
};

// ============================================================
// GET SINGLE PAYSLIP
// ============================================================

export const getPayslip = async (
  recordId: number,
): Promise<Payslip> => {
  return apiRequest<Payslip>(
    `/Payroll/payslips/${recordId}`,
    {
      method: 'GET',
    },
  );
};

// ============================================================
// GET PAYROLL ADJUSTMENTS
// ============================================================

export const getPayrollAdjustments = async (
  cycleId: number,
): Promise<PayrollAdjustment[]> => {
  return apiRequest<PayrollAdjustment[]>(
    `/Payroll/${cycleId}/adjustments`,
    {
      method: 'GET',
    },
  );
};

// ============================================================
// CREATE PAYROLL ADJUSTMENT
// ============================================================

export const createPayrollAdjustment = async (
  cycleId: number,
  request: CreatePayrollAdjustmentRequest,
): Promise<{
  message: string;
  adjustmentId: number;
}> => {
  return apiRequest<{
    message: string;
    adjustmentId: number;
  }>(
    `/Payroll/${cycleId}/adjustments`,
    {
      method: 'POST',

      body: JSON.stringify(request),
    },
  );
};

// ============================================================
// APPROVE PAYROLL ADJUSTMENT
// ============================================================

export const approvePayrollAdjustment = async (
  id: number,
): Promise<unknown> => {
  return apiRequest(
    `/Payroll/adjustments/${id}/approve`,
    {
      method: 'POST',
    },
  );
};

// ============================================================
// REJECT PAYROLL ADJUSTMENT
// ============================================================

export const rejectPayrollAdjustment = async (
  id: number,
  reason: string,
): Promise<unknown> => {
  return apiRequest(
    `/Payroll/adjustments/${id}/reject`,
    {
      method: 'POST',

      body: JSON.stringify({
        reason,
      }),
    },
  );
};

// ============================================================
// DELETE PAYROLL ADJUSTMENT
// ============================================================

export const deletePayrollAdjustment = async (
  id: number,
): Promise<unknown> => {
  return apiRequest(
    `/Payroll/adjustments/${id}`,
    {
      method: 'DELETE',
    },
  );
};