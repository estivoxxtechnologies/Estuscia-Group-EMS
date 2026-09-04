import { apiRequest } from './client';

export interface BackendRole {
  roleNumber: number;
  roleName: string;
  isActive: boolean;
}

export async function getRoles(): Promise<BackendRole[]> {
  return apiRequest<BackendRole[]>('/Roles', {
    method: 'GET',
  });
}