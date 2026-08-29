import { apiRequest } from './client';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    designation: string;
    branch: string;
    tenantId: string;
    tenantName: string;
    avatar: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
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