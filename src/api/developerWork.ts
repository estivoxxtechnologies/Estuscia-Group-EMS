import { apiRequest } from './client';

// ============================================================
// ENUMS
// ============================================================

export enum DeveloperWorkStatus {
  Pending = 'Pending',
  InProgress = 'InProgress',
  OnHold = 'OnHold',
  Completed = 'Completed',
}

export enum DeveloperWorkPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Urgent = 'Urgent',
}

export enum DeveloperWorkType {
  Other = 'Other',
  Bug = 'Bug',
  Feature = 'Feature',
  Frontend = 'Frontend',
  Backend = 'Backend',
  API = 'API',
  Database = 'Database',
  UIUX = 'UIUX',
  Deployment = 'Deployment',
}

// ============================================================
// RESPONSE
// ============================================================

export interface DeveloperWorkResponse {
  id: number;

  tenantId: number;
  branchId: number;
  branchName: string;

  title: string;
  description: string;

  workType: DeveloperWorkType;
  priority: DeveloperWorkPriority;
  status: DeveloperWorkStatus;

  assignedToUserId: number;
  assignedToUserName: string;
  assignedToEmployeeCode?: string | null;

  assignedByUserId: number;
  assignedByUserName: string;

  assignedAtUtc: string;

  dueDateUtc?: string | null;
  startedAtUtc?: string | null;
  completedAtUtc?: string | null;

  completionNotes?: string | null;
}

// ============================================================
// REQUESTS
// ============================================================

export interface CreateDeveloperWorkRequest {
  branchId: number;
  assignedToUserId: number;

  title: string;
  description: string;

  workType: DeveloperWorkType;
  priority: DeveloperWorkPriority;

  dueDateUtc?: string | null;
}

export interface UpdateDeveloperWorkStatusRequest {
  status: DeveloperWorkStatus;
  completionNotes?: string | null;
}

export interface UpdateDeveloperWorkRequest {
  title: string;
  description: string;

  workType: DeveloperWorkType;
  priority: DeveloperWorkPriority;

  dueDateUtc?: string | null;
}

// ============================================================
// LABEL HELPERS
// ============================================================

export const getDeveloperWorkStatusLabel = (
  status: DeveloperWorkStatus
): string => {
  switch (status) {
    case DeveloperWorkStatus.Pending:
      return 'Pending';

    case DeveloperWorkStatus.InProgress:
      return 'In Progress';

    case DeveloperWorkStatus.OnHold:
      return 'On Hold';

    case DeveloperWorkStatus.Completed:
      return 'Completed';

    default:
      return 'Unknown';
  }
};

export const getDeveloperWorkPriorityLabel = (
  priority: DeveloperWorkPriority
): string => {
  switch (priority) {
    case DeveloperWorkPriority.Low:
      return 'Low';

    case DeveloperWorkPriority.Medium:
      return 'Medium';

    case DeveloperWorkPriority.High:
      return 'High';

    case DeveloperWorkPriority.Urgent:
      return 'Urgent';

    default:
      return 'Unknown';
  }
};

export const getDeveloperWorkTypeLabel = (
  type: DeveloperWorkType
): string => {
  switch (type) {
    case DeveloperWorkType.Bug:
      return 'Bug';

    case DeveloperWorkType.Feature:
      return 'Feature';

    case DeveloperWorkType.Frontend:
      return 'Frontend';

    case DeveloperWorkType.Backend:
      return 'Backend';

    case DeveloperWorkType.API:
      return 'API';

    case DeveloperWorkType.Database:
      return 'Database';

    case DeveloperWorkType.UIUX:
      return 'UI / UX';

    case DeveloperWorkType.Deployment:
      return 'Deployment';

    case DeveloperWorkType.Other:
    default:
      return 'Other';
  }
};

// ============================================================
// GET MY WORK
// ============================================================

export const getMyDeveloperWork = async (
  status?: DeveloperWorkStatus,
  date?: string
): Promise<DeveloperWorkResponse[]> => {
  const params = new URLSearchParams();

  if (status !== undefined) {
    params.append('status', String(status));
  }

  if (date) {
    params.append('date', date);
  }

  const queryString = params.toString();

  const endpoint = queryString
    ? `/DeveloperWork/my?${queryString}`
    : '/DeveloperWork/my';

  return apiRequest<DeveloperWorkResponse[]>(
    endpoint,
    {
      method: 'GET',
    }
  );
};

// ============================================================
// GET TEAM WORK
// ============================================================

export const getDeveloperTeamWork = async (
  branchId?: number,
  assignedToUserId?: number,
  status?: DeveloperWorkStatus
): Promise<DeveloperWorkResponse[]> => {
  const params = new URLSearchParams();

  if (branchId !== undefined) {
    params.append('branchId', String(branchId));
  }

  if (assignedToUserId !== undefined) {
    params.append(
      'assignedToUserId',
      String(assignedToUserId)
    );
  }

  if (status !== undefined) {
    params.append('status', String(status));
  }

  const queryString = params.toString();

  const endpoint = queryString
    ? `/DeveloperWork/team?${queryString}`
    : '/DeveloperWork/team';

  return apiRequest<DeveloperWorkResponse[]>(
    endpoint,
    {
      method: 'GET',
    }
  );
};

// ============================================================
// GET SINGLE WORK
// ============================================================

export const getDeveloperWork = async (
  id: number
): Promise<DeveloperWorkResponse> => {
  return apiRequest<DeveloperWorkResponse>(
    `/DeveloperWork/${id}`,
    {
      method: 'GET',
    }
  );
};

// ============================================================
// CREATE WORK
// ============================================================

export const createDeveloperWork = async (
  request: CreateDeveloperWorkRequest
): Promise<DeveloperWorkResponse> => {
  return apiRequest<DeveloperWorkResponse>(
    '/DeveloperWork',
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );
};

// ============================================================
// UPDATE STATUS
// ============================================================

export const updateDeveloperWorkStatus = async (
  id: number,
  request: UpdateDeveloperWorkStatusRequest
): Promise<DeveloperWorkResponse> => {
  return apiRequest<DeveloperWorkResponse>(
    `/DeveloperWork/${id}/status`,
    {
      method: 'PUT',
      body: JSON.stringify(request),
    }
  );
};

// ============================================================
// UPDATE WORK DETAILS
// ============================================================

export const updateDeveloperWork = async (
  id: number,
  request: UpdateDeveloperWorkRequest
): Promise<DeveloperWorkResponse> => {
  return apiRequest<DeveloperWorkResponse>(
    `/DeveloperWork/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(request),
    }
  );
};