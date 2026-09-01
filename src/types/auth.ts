export interface JwtPayload {
  sub?: string;
  user_id?: string;
  nameid?: string;
  email?: string;
  unique_name?: string;
  role?: string;
  tenant_id?: string;
  branch?: string;
  designation?: string;

  exp?: number;
  iat?: number;
}