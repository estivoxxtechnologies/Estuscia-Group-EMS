export type PaymentMode =
  | 'Monthly'
  | 'Quarterly'
  | 'HalfYearly'
  | 'Yearly';

export type PaymentStatus =
  | 'Pending'
  | 'Paid';

export interface TenantPayment {
  id: number;
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