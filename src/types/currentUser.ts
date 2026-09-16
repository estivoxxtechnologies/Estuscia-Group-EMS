import { CurrentUserCurrency } from "./currentCurrency";

export interface CurrentUser {
  userId: number;
  username: string;
  email: string;

  tenantId: number;
  tenantName: string;

  branchId: number | null;
  branchName: string | null;

  roleId: number;
  roleName: string;
  designation: string;
  avatarUrl: string;
  currency: {
    id: number;
    code: string;
    name: string;
    symbol: string;
  } | null;

}