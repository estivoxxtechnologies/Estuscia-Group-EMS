import { apiRequest } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface BackendUser {
  id: string;
  email: string;
  name: string;
  role: string;
  designation: string;

  branchId: string;
  branch: string;

  tenantId: string;
  tenantName: string;

  avatar: string;
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