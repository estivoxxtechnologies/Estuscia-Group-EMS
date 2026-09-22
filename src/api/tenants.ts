import { apiRequest } from './client';

export interface BackendTenant {
  id: number;
  name: string;
  code: string;
  domain: string;
  plan: string;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string | null;
  createdByUserId: number | null;
  standardWorkingHours: number;
  workStartTime: string;
  workEndTime: string;
  defaultCurrencyId: number;


  defaultCurrency: {
    id: number;
    code: string;
    name: string;
    symbol: string;
  };
}

export interface CreateTenantRequest {
  name: string;
  code: string;
  domain: string;
  plan: string;
  defaultCurrencyId: number;
  standardWorkingHours: number;
  workStartTime: string;
  workEndTime: string;
  isActive: boolean;
}

export interface UpdateTenantRequest {
  name: string;
  code: string;
  domain: string;
  plan: string;
  defaultCurrencyId: number;
  standardWorkingHours: number;
  workStartTime: string;
  workEndTime: string;
  isActive: boolean;
}

export async function getTenants(): Promise<BackendTenant[]> {
  return apiRequest<BackendTenant[]>('/Tenants', {
    method: 'GET',
  });
}

export async function createTenant(
  request: CreateTenantRequest
): Promise<BackendTenant> {
  return apiRequest<BackendTenant>('/Tenants', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function updateTenant(
  id: number,
  request: UpdateTenantRequest
): Promise<BackendTenant> {
  return apiRequest<BackendTenant>(`/Tenants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}