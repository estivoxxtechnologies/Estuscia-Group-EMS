import { apiRequest } from './client';

import {
  TenantCompanyProfile,
  UpdateTenantCompanyProfileRequest,
} from '../types/tenantCompanyProfile';

export const getTenantCompanyProfile =
  async (): Promise<TenantCompanyProfile> => {
    return apiRequest<TenantCompanyProfile>(
      '/TenantCompanyProfile'
    );
  };

export const updateTenantCompanyProfile =
  async (
    request: UpdateTenantCompanyProfileRequest
  ): Promise<TenantCompanyProfile> => {
    return apiRequest<TenantCompanyProfile>(
      '/TenantCompanyProfile',
      {
        method: 'PUT',
        body: JSON.stringify(request),
      }
    );
  };