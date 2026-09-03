export interface JwtPayload {
  sub?: string;
  user_id?: string;
  nameid?: string;

  email?: string;
  unique_name?: string;

  role_id?: string;
  role?: string;

  tenant_id?: string;
  branch_id?: string;

  designation?: string;

  exp?: number;
  iat?: number;
}