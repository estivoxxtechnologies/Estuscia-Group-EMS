export interface Branch {
  id: number;
  tenantId: number;
  branchName: string;
  city: string | null;
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