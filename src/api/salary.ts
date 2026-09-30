import { apiRequest } from './client';

/* ============================================================
   TYPES
============================================================ */

export interface SalaryEmployee {
  userId: number;

  employeeCode?: string | null;
  employeeName?: string | null;
  designation?: string | null;
  department?: string | null;
  branchId?: number | null;

  currentSalary: number;

  /*
   * These names MUST match SalaryEmployeeDto
   * returned by SalaryController.
   */
  pendingSalary?: number | null;
  pendingHistoryId?: number | null;
  pendingStatus?: string | null;
}

export interface SalaryHistory {
  id: number;
  userId: number;

  previousSalary: number;
  newSalary: number;

  reason?: string | null;

  status: string;

  createdAtUtc: string;
  createdByUserId?: number | null;

  approvedByUserId?: number | null;
  approvedAtUtc?: string | null;

  rejectedByUserId?: number | null;
  rejectedAtUtc?: string | null;

  rejectionReason?: string | null;
}

export interface SalaryHistoryResponse {
  userId: number;

  employeeCode?: string | null;
  employeeName?: string | null;
  designation?: string | null;
  department?: string | null;

  currentSalary: number;

  history: SalaryHistory[];
}

export interface PendingSalaryChange {
  id: number;
  userId: number;

  employeeCode?: string | null;
  employeeName?: string | null;
  designation?: string | null;
  department?: string | null;

  branchId?: number | null;

  previousSalary: number;
  newSalary: number;

  reason?: string | null;

  status: string;

  createdAtUtc: string;
  createdByUserId?: number | null;
}

/* ============================================================
   GET EMPLOYEE SALARIES
============================================================ */

export const getSalaryEmployees =
  async (): Promise<SalaryEmployee[]> => {
    return apiRequest<SalaryEmployee[]>(
      '/Salary/employees',
      {
        method: 'GET',
      },
    );
  };

/* ============================================================
   GET SALARY HISTORY
============================================================ */

export const getSalaryHistory =
  async (
    userId: number,
  ): Promise<SalaryHistoryResponse> => {
    return apiRequest<SalaryHistoryResponse>(
      `/Salary/${userId}/history`,
      {
        method: 'GET',
      },
    );
  };

/* ============================================================
   PROPOSE SALARY
============================================================ */

export const proposeSalary =
  async (
    userId: number,
    newSalary: number,
    reason: string,
  ): Promise<unknown> => {
    return apiRequest(
      '/Salary/propose',
      {
        method: 'POST',

        body: JSON.stringify({
          userId,
          newSalary,
          reason,
        }),
      },
    );
  };

/* ============================================================
   GET PENDING SALARY CHANGES
============================================================ */

export const getPendingSalaryChanges =
  async (): Promise<PendingSalaryChange[]> => {
    return apiRequest<PendingSalaryChange[]>(
      '/Salary/pending',
      {
        method: 'GET',
      },
    );
  };

/* ============================================================
   APPROVE SALARY
   IMPORTANT:
   Backend route:
   POST /api/Salary/{historyId}/approve
============================================================ */

export const approveSalaryChange =
  async (
    historyId: number,
  ): Promise<unknown> => {
    return apiRequest(
      `/Salary/${historyId}/approve`,
      {
        method: 'POST',
      },
    );
  };

/* ============================================================
   REJECT SALARY
   IMPORTANT:
   Backend route:
   POST /api/Salary/{historyId}/reject
============================================================ */

export const rejectSalaryChange =
  async (
    historyId: number,
    reason: string,
  ): Promise<unknown> => {
    return apiRequest(
      `/Salary/${historyId}/reject`,
      {
        method: 'POST',

        body: JSON.stringify({
          reason,
        }),
      },
    );
  };