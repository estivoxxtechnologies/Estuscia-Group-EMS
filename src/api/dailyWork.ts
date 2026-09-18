import { apiRequest } from './client';

// ============================================================
// TYPES
// ============================================================

export type WorkLogType = 0 | 1 | 2;
// 0 = Sales
// 1 = Developer
// 2 = General

export interface BackendDailyWorkLog {
  id: number;

  tenantId: number | null;
  branchId: number;
  userId: number;

  workDate: string;
  workType: WorkLogType | string;

  narration: string;

  callsMade: number | null;
  callsConnected: number | null;
  leadsRespondedWell: number | null;
  followUpsScheduled: number | null;

  hoursSpent: number | null;
  featuresShipped: string | null;
  repositoryPrLinks: string | null;
  blockersEncountered: string | null;

  status: string;
  managerNotes: string | null;
  reviewedByManagerId: number | null;

  createdAtUtc: string;
  updatedAtUtc: string | null;
  createdByUserId: number | null;

  user?: {
    id: number;
    fullName: string;
    email: string;
    employeeCode: string;
    designation: string;
    department: string;
    avatarUrl: string;
  };

  branch?: {
    id: number;
    branchName: string;
    city: string | null;
  };
}

// ============================================================
// GET DAILY WORK LOGS
// ============================================================

export interface GetDailyWorkParams {
  branchId?: number;
  workType?: WorkLogType;
  workDate?: string;
}

export async function getDailyWorkLogs(
  params: GetDailyWorkParams = {}
): Promise<BackendDailyWorkLog[]> {
  const searchParams = new URLSearchParams();

  if (params.branchId !== undefined) {
    searchParams.append('branchId', String(params.branchId));
  }

  if (params.workType !== undefined) {
    searchParams.append('workType', String(params.workType));
  }

  if (params.workDate) {
    searchParams.append('workDate', params.workDate);
  }

  const queryString = searchParams.toString();

  const url = queryString
    ? `/DailyWork?${queryString}`
    : '/DailyWork';

  return apiRequest<BackendDailyWorkLog[]>(url, {
    method: 'GET',
  });
}

// ============================================================
// SUBMIT SALES DAILY WORK
// ============================================================

export interface SubmitSalesDailyWorkRequest {
  workDate?: string;
  workType: 0;
  narration: string;

  callsMade?: number;
  callsConnected?: number;
  leadsRespondedWell?: number;
  followUpsScheduled?: number;
}

export async function submitDailyWorkLog(
  request: SubmitSalesDailyWorkRequest
): Promise<BackendDailyWorkLog> {
  return apiRequest<BackendDailyWorkLog>(
    '/DailyWork/submit',
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );
}

// ============================================================
// UPDATE DAILY WORK
// ============================================================

export interface UpdateDailyWorkRequest {
  workDate?: string;
  narration?: string;

  callsMade?: number;
  callsConnected?: number;
  leadsRespondedWell?: number;
  followUpsScheduled?: number;
}

export async function updateDailyWorkLog(
  id: number,
  request: UpdateDailyWorkRequest
): Promise<BackendDailyWorkLog> {
  return apiRequest<BackendDailyWorkLog>(
    `/DailyWork/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(request),
    }
  );
}

// ============================================================
// REVIEW DAILY WORK
// ============================================================

export type DailyWorkReviewStatus =
  | 'Submitted'
  | 'Reviewed'
  | 'Rejected';

export interface ReviewDailyWorkLogRequest {
  managerNotes?: string;
  status: DailyWorkReviewStatus;
}

export async function reviewDailyWorkLog(
  id: number,
  request: ReviewDailyWorkLogRequest
): Promise<BackendDailyWorkLog> {
  return apiRequest<BackendDailyWorkLog>(
    `/DailyWork/${id}/review`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );
}