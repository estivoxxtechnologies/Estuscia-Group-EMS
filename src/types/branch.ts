export interface Branch {
  id: number;
  tenantId: number;
  branchName: string;
  city: string | null;

  // Branch override values.
  // null = inherit from tenant.
  standardWorkingHours: number | null;
  workStartTime: string | null;
  workEndTime: string | null;

  // Effective values after tenant inheritance.
  effectiveStandardWorkingHours: number | null;
  effectiveWorkStartTime: string | null;
  effectiveWorkEndTime: string | null;

  isActive: boolean;

  currencyId: number;

  currency: {
    id: number;
    code: string;
    name: string;
    symbol: string;
    isActive?: boolean;
  } | null;
}