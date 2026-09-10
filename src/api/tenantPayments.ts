import { apiRequest } from './client';
import {
  TenantPayment,
  PaymentMode,
  PaymentStatus,
} from '../types/tenantPayment';

export interface TenantPaymentListItem extends TenantPayment {
  tenantId: number;
  tenantName: string;
  tenantCode: string;
}

export interface TenantPaymentListResponse {
  items: TenantPaymentListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateTenantPaymentDto {
  tenantId: number;
  totalBranches: number;
  paymentMode: PaymentMode;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentDateUtc: string | null;
  validFromUtc: string | null;
  validUntilUtc: string | null;
  registrationStatus: boolean;
  notes: string | null;
}

export interface UpdateTenantPaymentDto {
  totalBranches: number;
  paymentMode: PaymentMode;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentDateUtc: string | null;
  validFromUtc: string | null;
  validUntilUtc: string | null;
  registrationStatus: boolean;
  notes: string | null;
}

/* ============================================================
   BACKEND RESPONSE TYPES
============================================================ */

interface BackendTenantPayment {
  id: number;
  tenantId: number;

  tenant?: {
    id: number;
    name: string;
    code: string;
    domain?: string;
    plan?: string;
    currency?: string;
    isActive?: boolean;
  };

  totalBranches: number;
  paymentMode: number | string;
  amount: number;
  paymentStatus: number | string;
  paymentDateUtc: string | null;
  validFromUtc: string | null;
  validUntilUtc: string | null;
  registrationStatus: boolean;
  notes: string | null;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

interface BackendTenantPaymentListResponse {
  items: BackendTenantPayment[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ============================================================
   ENUM MAPPERS
============================================================ */

function mapPaymentMode(value: number | string): PaymentMode {
  if (typeof value === 'string') {
    return value as PaymentMode;
  }

  switch (value) {
    case 1:
      return 'Monthly';

    case 2:
      return 'Quarterly';

    case 3:
      return 'HalfYearly';

    case 4:
      return 'Yearly';

    default:
      return 'Monthly';
  }
}

function mapPaymentStatus(value: number | string): PaymentStatus {
  if (typeof value === 'string') {
    return value as PaymentStatus;
  }

  switch (value) {
    case 1:
      return 'Pending';

    case 2:
      return 'Paid';

    default:
      return 'Pending';
  }
}

/* ============================================================
   NORMALIZER
============================================================ */

function mapTenantPayment(
  payment: BackendTenantPayment
): TenantPaymentListItem {
  return {
    ...payment,

    tenantName: payment.tenant?.name ?? '',
    tenantCode: payment.tenant?.code ?? '',

    paymentMode: mapPaymentMode(payment.paymentMode),
    paymentStatus: mapPaymentStatus(payment.paymentStatus),
  };
}

/**
 * All payment records.
 */
export async function getTenantPayments(): Promise<TenantPaymentListResponse> {
  const data =
    await apiRequest<BackendTenantPaymentListResponse>(
      '/TenantPayments',
      {
        method: 'GET',
      }
    );

  return {
    ...data,
    items: data.items.map(mapTenantPayment),
  };
}

/**
 * Payment history for one tenant.
 */
export async function getTenantPaymentHistory(
  tenantId: number
): Promise<TenantPaymentListItem[]> {
  const data = await apiRequest<BackendTenantPayment[]>(
    `/TenantPayments/tenant/${tenantId}`,
    {
      method: 'GET',
    }
  );

  return data.map(mapTenantPayment);
}

/**
 * Single payment record.
 */
export async function getTenantPaymentById(
  id: number
): Promise<TenantPaymentListItem> {
  const data = await apiRequest<BackendTenantPayment>(
    `/TenantPayments/${id}`,
    {
      method: 'GET',
    }
  );

  return mapTenantPayment(data);
}

/**
 * Add payment.
 */
export async function createTenantPayment(
  data: CreateTenantPaymentDto
): Promise<TenantPaymentListItem> {
  const result = await apiRequest<BackendTenantPayment>(
    '/TenantPayments',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  return mapTenantPayment(result);
}

/**
 * Edit payment.
 */
export async function updateTenantPayment(
  id: number,
  data: UpdateTenantPaymentDto
): Promise<TenantPaymentListItem> {
  const result = await apiRequest<BackendTenantPayment>(
    `/TenantPayments/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );

  return mapTenantPayment(result);
}

/**
 * Delete payment.
 */
export async function deleteTenantPayment(id: number): Promise<void> {
  return apiRequest<void>(`/TenantPayments/${id}`, {
    method: 'DELETE',
  });
}