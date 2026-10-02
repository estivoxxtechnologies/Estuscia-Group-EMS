import { apiRequest } from './client';

import {
  TenantCompanyProfile,
  UpdateTenantCompanyProfileRequest,
} from '../types/tenantCompanyProfile';

// ============================================================
// GET COMPANY PROFILE
// ============================================================

export const getTenantCompanyProfile =
  async (): Promise<TenantCompanyProfile> => {
    return apiRequest<TenantCompanyProfile>(
      '/TenantCompanyProfile',
      {
        method: 'GET',
      }
    );
  };

// ============================================================
// UPDATE COMPANY PROFILE
// ============================================================

export const updateTenantCompanyProfile =
  async (
    request: UpdateTenantCompanyProfileRequest
  ): Promise<TenantCompanyProfile> => {
    return apiRequest<TenantCompanyProfile>(
      '/TenantCompanyProfile',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );
  };

// ============================================================
// UPLOAD COMPANY LOGO
// ============================================================

export const uploadTenantCompanyLogo =
  async (
    file: File
  ): Promise<TenantCompanyProfile> => {
    const formData = new FormData();

    formData.append('logo', file);

    /*
     * IMPORTANT:
     *
     * Do NOT manually set Content-Type here.
     *
     * The browser automatically creates:
     *
     * multipart/form-data; boundary=...
     *
     */

    return apiRequest<TenantCompanyProfile>(
      '/TenantCompanyProfile/logo',
      {
        method: 'POST',
        body: formData,
      }
    );
  };

// ============================================================
// DELETE COMPANY LOGO
// ============================================================

export const deleteTenantCompanyLogo =
  async (): Promise<TenantCompanyProfile> => {
    return apiRequest<TenantCompanyProfile>(
      '/TenantCompanyProfile/logo',
      {
        method: 'DELETE',
      }
    );
  };