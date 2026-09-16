import { apiRequest } from './client';

const API_ROOT = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

function normalizeAvatarUrl(
    avatarUrl?: string | null
): string {
    if (!avatarUrl) {
        return '';
    }

    // Already an absolute URL
    if (
        avatarUrl.startsWith('http://') ||
        avatarUrl.startsWith('https://')
    ) {
        return avatarUrl;
    }

    // Backend returns something like:
    // /uploads/avatars/user-123.jpg
    if (avatarUrl.startsWith('/')) {
        return `${API_ROOT}${avatarUrl}`;
    }

    // Backend returns something like:
    // uploads/avatars/user-123.jpg
    return `${API_ROOT}/${avatarUrl}`;
}

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

export interface UpdateUserRequest {
    fullName: string;
    email: string;
    employeeCode: string;
    roleNumber: number;
    designation: string;
    department: string;
    salaryBase: number;
    branchId: number | null;
    avatarUrl?: string;
    isActive: boolean;
}

export async function getUsers(): Promise<BackendUser[]> {
    const users = await apiRequest<BackendUser[]>('/Users', {
        method: 'GET',
    });

    return users.map((user) => ({
        ...user,
        avatarUrl: normalizeAvatarUrl(user.avatarUrl),
    }));
}

export async function createUser(
    request: CreateUserRequest
): Promise<{ id: number; message: string }> {
    return apiRequest<{ id: number; message: string }>('/Users', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

export async function updateUser(
    id: number,
    request: UpdateUserRequest
): Promise<BackendUser> {
    const user = await apiRequest<BackendUser>(`/Users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(request),
    });

    return {
        ...user,
        avatarUrl: normalizeAvatarUrl(user.avatarUrl),
    };
}