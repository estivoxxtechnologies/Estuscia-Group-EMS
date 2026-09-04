export interface Branch {
  id: number;
  tenantId: number;
  branchName: string;
  city: string | null;
  isActive: boolean;
}