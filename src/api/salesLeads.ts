import { apiRequest } from './client';

/* ============================================================
   ENUMS
============================================================ */

export enum SalesLeadOutcome {
  Pending = 'Pending',
  Connected = 'Connected',
  RespondedWell = 'RespondedWell',
  FollowUp = 'FollowUp',
  NotConnected = 'NotConnected',
}

/* ============================================================
   TYPES
============================================================ */

export interface SalesLeadResponse {
  assignmentId: number;
  salesLeadId: number;

  tenantId: number;
  branchId: number;
  branchName: string;

  phoneNumber: string;
  customerName?: string | null;

  assignedToUserId: number;
  assignedToUserName: string;
  assignedToEmployeeCode?: string | null;

  assignedByUserId: number;
  assignedByUserName: string;

  assignedAtUtc: string;

  outcome: SalesLeadOutcome;
  notes?: string | null;
  completedAtUtc?: string | null;
}

export interface UpdateSalesLeadOutcomeRequest {
  outcome: SalesLeadOutcome;
  notes?: string | null;
}

export interface SalesLeadMetrics {
  callsMade: number;
  connected: number;
  respondedWell: number;
  followUp: number;
  notConnected: number;
  otherConnected: number;
  pending: number;
}

/* ============================================================
   HELPERS
============================================================ */

export const getSalesLeadOutcomeLabel = (
  outcome: SalesLeadOutcome
): string => {
  switch (outcome) {
    case SalesLeadOutcome.Pending:
      return 'Pending';

    case SalesLeadOutcome.Connected:
      return 'Connected';

    case SalesLeadOutcome.RespondedWell:
      return 'Responded Well';

    case SalesLeadOutcome.FollowUp:
      return 'Follow-up';

    case SalesLeadOutcome.NotConnected:
      return 'Not Connected';

    default:
      return 'Unknown';
  }
};

/* ============================================================
   GET MY SALES LEADS
   GET /api/SalesLeads/my
============================================================ */

export const getMySalesLeads = async (
  outcome?: SalesLeadOutcome,
  date?: string
): Promise<SalesLeadResponse[]> => {
  const params = new URLSearchParams();

  if (outcome !== undefined) {
    params.append('outcome', String(outcome));
  }

  if (date) {
    params.append('date', date);
  }

  const queryString = params.toString();

  const endpoint = queryString
    ? `/SalesLeads/my?${queryString}`
    : '/SalesLeads/my';

  return apiRequest<SalesLeadResponse[]>(endpoint, {
    method: 'GET',
  });
};

/* ============================================================
   GET SINGLE ASSIGNMENT
   GET /api/SalesLeads/{assignmentId}
============================================================ */

export const getSalesLeadAssignment = async (
  assignmentId: number
): Promise<SalesLeadResponse> => {
  return apiRequest<SalesLeadResponse>(
    `/SalesLeads/${assignmentId}`,
    {
      method: 'GET',
    }
  );
};

/* ============================================================
   UPDATE OUTCOME
   PUT /api/SalesLeads/{assignmentId}/outcome
============================================================ */

export const updateSalesLeadOutcome = async (
  assignmentId: number,
  request: UpdateSalesLeadOutcomeRequest
): Promise<SalesLeadResponse> => {
  return apiRequest<SalesLeadResponse>(
    `/SalesLeads/${assignmentId}/outcome`,
    {
      method: 'PUT',
      body: JSON.stringify(request),
    }
  );
};

/* ============================================================
   GET MY / TEAM METRICS
   GET /api/SalesLeads/metrics
============================================================ */

export const getSalesLeadMetrics = async (
  userId?: number,
  branchId?: number
): Promise<SalesLeadMetrics> => {
  const params = new URLSearchParams();

  if (userId !== undefined) {
    params.append('userId', String(userId));
  }

  if (branchId !== undefined) {
    params.append('branchId', String(branchId));
  }

  const queryString = params.toString();

  const endpoint = queryString
    ? `/SalesLeads/metrics?${queryString}`
    : '/SalesLeads/metrics';

  return apiRequest<SalesLeadMetrics>(endpoint, {
    method: 'GET',
  });
};