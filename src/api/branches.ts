import { apiRequest } from './client';
import { Branch } from '../types/branch';

export interface CreateBranchRequest {
  tenantId: number;
  branchName: string;
  city: string | null;
  isActive: boolean;
}

export interface UpdateBranchRequest {
  branchName: string;
  city: string | null;
  isActive: boolean;
}

/**
 * Get all branches.
 */
export async function getBranches(): Promise<Branch[]> {
  return apiRequest<Branch[]>('/Branches', {
    method: 'GET',
  });
}

/**
 * Get branches belonging to a specific tenant.
 */
export const getBranchesByTenant = async (
  tenantId: number
): Promise<Branch[]> => {
  return apiRequest<Branch[]>(`/Branches/tenant/${tenantId}`, {
    method: 'GET',
  });
};

/**
 * Create a new branch for a tenant.
 */
export const createBranch = async (
  request: CreateBranchRequest
): Promise<Branch> => {
  return apiRequest<Branch>('/Branches', {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

/**
 * Update an existing branch.
 */
export const updateBranch = async (
  branchId: number,
  request: UpdateBranchRequest
): Promise<Branch> => {
  return apiRequest<Branch>(`/Branches/${branchId}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
};

/**
 * Enable / disable a branch.
 */
export const toggleBranchStatus = async (
  branchId: number,
  isActive: boolean
): Promise<Branch> => {
  return apiRequest<Branch>(`/Branches/${branchId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
};