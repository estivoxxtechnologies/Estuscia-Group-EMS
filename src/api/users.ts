import { apiRequest } from './client';

export interface BackendUser {
    id: number;

    tenantId: number;
    tenantName: string;

    branchId: number | null;
    branchName: string | null;

    fullName: string;
    email: string;

    employeeCode: string;

    roleId: number;
    roleName: string;

    designation: string;
    department: string;

    salaryBase: number;

    avatarUrl: string;

    isActive: boolean;
}

export interface CreateUserRequest {
    fullName: string;
    email: string;
    password: string;
    employeeCode: string;
    roleNumber: number;
    designation: string;
    department: string;
    branchId: number | null;
    salaryBase: number;
    avatarUrl: string;
}

export async function getUsers(): Promise<BackendUser[]> {
    return apiRequest<BackendUser[]>('/Users', {
        method: 'GET',
    });
}

export async function createUser(
    request: CreateUserRequest
): Promise<{ id: number; message: string }> {
    return apiRequest<{ id: number; message: string }>('/Users', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}