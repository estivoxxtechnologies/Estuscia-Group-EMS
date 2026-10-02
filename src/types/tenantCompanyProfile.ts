export interface TenantCompanyProfile {
  id: number;
  tenantId: number | null;

  legalName: string | null;
  displayName: string | null;

  // Company logo
  logoUrl: string | null;
  logoFileName: string | null;
  logoContentType: string | null;

  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;

  phone: string | null;
  email: string | null;
  website: string | null;

  taxRegistrationNumber: string | null;
  companyRegistrationNumber: string | null;

  payslipFooterText: string | null;

  createdAtUtc: string;
  updatedAtUtc: string | null;

  createdByUserId: number | null;
  updatedByUserId: number | null;
}

export interface UpdateTenantCompanyProfileRequest {
  legalName?: string | null;
  displayName?: string | null;

  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;

  phone?: string | null;
  email?: string | null;
  website?: string | null;

  taxRegistrationNumber?: string | null;
  companyRegistrationNumber?: string | null;

  payslipFooterText?: string | null;
}