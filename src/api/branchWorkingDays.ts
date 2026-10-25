
import { apiRequest } from './client';

export interface BranchWorkingDay {
  id?: number;
  tenantId: number | null;
  branchId: number;
  dayOfWeek: number;
  isWorkingDay: boolean;
}

export interface SaveBranchWorkingDaysRequest {
  tenantId?: number;
  days: {
    dayOfWeek: number;
    isWorkingDay: boolean;
  }[];
}

export async function getBranchWorkingDays(
  branchId: number,
  tenantId?: number,
): Promise<BranchWorkingDay[]> {
  const params = new URLSearchParams();
  params.set('branchId', String(branchId));

  if (tenantId != null) {
    params.set('tenantId', String(tenantId));
  }

  return apiRequest<BranchWorkingDay[]>(
    `/BranchWorkingDays?${params.toString()}`,
    { method: 'GET' },
  );
}

export async function saveBranchWorkingDays(
  branchId: number,
  request: SaveBranchWorkingDaysRequest,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `/BranchWorkingDays/${branchId}`,
    {
      method: 'PUT',
      body: JSON.stringify(request),
    },
  );
}
