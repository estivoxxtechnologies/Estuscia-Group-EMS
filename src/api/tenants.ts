import { apiRequest } from './client';

export interface BackendTenant {
  id: number;
  name: string;
  code: string;
  domain: string;
  plan: string;
  currency: string;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string | null;
  createdByUserId: number | null;
}

export async function getTenants(): Promise<BackendTenant[]> {
  const response = await apiRequest<BackendTenant[]>('/Tenant', {
    method: 'GET',
  });

  return response;
};