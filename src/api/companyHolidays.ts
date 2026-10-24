import { apiRequest } from './client';

export interface CompanyHoliday {
  id: number;
  tenantId: number | null;
  branchId: number | null;
  branchName?: string;
  name: string;
  date: string;
  description: string | null;
  createdAtUtc?: string;
  updatedAtUtc?: string | null;
  createdByUserId?: number | null;
  updatedByUserId?: number | null;
}

export interface CreateCompanyHolidayRequest {
  branchId: number | null;
  name: string;
  date: string;
  description: string | null;
}

export interface UpdateCompanyHolidayRequest {
  branchId: number | null;  
  name: string;
  date: string;
  description: string | null;
}

export interface CompanyHolidayFilters {
  tenantId?: number;
  branchId?: number;
  fromDate?: string;
  toDate?: string;
}

/**
 * Build query parameters for holiday filtering.
 */
function buildQuery(filters?: CompanyHolidayFilters): string {
  const params = new URLSearchParams();

  if (filters?.tenantId != null) {
    params.set('tenantId', String(filters.tenantId));
  }

  if (filters?.branchId != null) {
    params.set('branchId', String(filters.branchId));
  }

  if (filters?.fromDate) {
    params.set('fromDate', filters.fromDate);
  }

  if (filters?.toDate) {
    params.set('toDate', filters.toDate);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

/**
 * Get company holidays.
 *
 * Optional filters:
 * - tenantId: Super Admin tenant selection
 * - branchId: branch selection
 * - fromDate / toDate: date range
 */
export async function getCompanyHolidays(
  filters?: CompanyHolidayFilters
): Promise<CompanyHoliday[]> {
  return apiRequest<CompanyHoliday[]>(
    `/CompanyHolidays${buildQuery(filters)}`,
    {
      method: 'GET',
    }
  );
}

/**
 * Get a specific company holiday.
 */
export async function getCompanyHolidayById(
  holidayId: number
): Promise<CompanyHoliday> {
  return apiRequest<CompanyHoliday>(`/CompanyHolidays/${holidayId}`, {
    method: 'GET',
  });
}

/**
 * Create a company holiday.
 */
export async function createCompanyHoliday(
  request: CreateCompanyHolidayRequest
): Promise<CompanyHoliday> {
  return apiRequest<CompanyHoliday>('/CompanyHolidays', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Update a company holiday.
 */
export async function updateCompanyHoliday(
  holidayId: number,
  request: UpdateCompanyHolidayRequest
): Promise<CompanyHoliday> {
  return apiRequest<CompanyHoliday>(`/CompanyHolidays/${holidayId}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

/**
 * Delete a company holiday.
 */
export async function deleteCompanyHoliday(
  holidayId: number
): Promise<void> {
  await apiRequest<void>(`/CompanyHolidays/${holidayId}`, {
    method: 'DELETE',
  });
}
