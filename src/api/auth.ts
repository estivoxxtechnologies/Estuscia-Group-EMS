import { apiRequest } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface BackendUser {
  userId: number;

  username: string;
  email: string;

  roleId: number;
  roleName: string;

  designation: string;

  tenantId: number;
  tenantName: string;

  branchId: number | null;
  branchName: string | null;

  avatarUrl: string;
}
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: BackendUser;
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/Auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function getCurrentUser(): Promise<BackendUser> {
  return apiRequest<BackendUser>('/Auth/me', {
    method: 'GET',
  });
}