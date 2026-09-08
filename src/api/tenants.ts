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

export interface CreateTenantRequest {
  name: string;
  code: string;
  domain: string;
  plan: string;
  currency: string;
}

export interface UpdateTenantRequest {
  name: string;
  code: string;
  domain: string;
  plan: string;
  currency: string;
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