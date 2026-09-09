import { apiRequest } from './client';
import { Branch } from '../types/branch';

export interface CreateBranchRequest {
  branchName: string;
  city: string | null;
}

export interface UpdateBranchRequest {
  branchName: string;
  city: string | null;
  isActive: boolean;
}

/**
 * Get all active branches.
 *
 * Used by existing branch combo boxes.
 */
export async function getBranches(): Promise<Branch[]> {
  return apiRequest<Branch[]>('/Branches', {
    method: 'GET',
  });
}

/**
 * Get all branches for a specific tenant.
 *
 * Used by Super Admin branch management.
 */
export async function getBranchesByTenant(
  tenantId: number
): Promise<Branch[]> {
  return apiRequest<Branch[]>(
    `/Branches/tenant/${tenantId}`,
    {
      method: 'GET',
    }
  );
}

/**
 * Create a branch for a specific tenant.
 */
export async function createBranch(
  tenantId: number,
  request: CreateBranchRequest
): Promise<Branch> {
  return apiRequest<Branch>(
    `/Branches/tenant/${tenantId}`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );
}

/**
 * Update an existing branch.
 */
export async function updateBranch(
  branchId: number,
  request: UpdateBranchRequest
): Promise<Branch> {
  return apiRequest<Branch>(
    `/Branches/${branchId}`,
    {
      method: 'PUT',
      body: JSON.stringify(request),
    }
  );
}

/**
 * Enable / disable a branch.
 */
export async function toggleBranchStatus(
  branchId: number,
  isActive: boolean
): Promise<Branch> {
  return apiRequest<Branch>(
    `/Branches/${branchId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify(isActive),
    }
  );
}