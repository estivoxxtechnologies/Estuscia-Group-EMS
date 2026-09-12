import { apiRequest } from './client';

export interface MyProfile {
  id: number;

  fullName: string;
  email: string;
  avatarUrl: string;

  employeeCode: string;
  roleName: string;
  designation: string;
  department: string;

  tenantId: number;
  tenantName: string;

  branchId: number | null;
  branchName: string | null;

  isActive: boolean;
}

export interface UpdateMyProfileRequest {
  fullName: string;
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================================
// GET MY PROFILE
// ============================================================

export async function getMyProfile(): Promise<MyProfile> {
  return apiRequest<MyProfile>('/Profile/me', {
    method: 'GET',
  });
}

// ============================================================
// UPDATE MY PROFILE
// ============================================================

export async function updateMyProfile(
  request: UpdateMyProfileRequest
): Promise<MyProfile> {
  return apiRequest<MyProfile>('/Profile/me', {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

// ============================================================
// CHANGE PASSWORD
// ============================================================

export async function changeMyPassword(
  request: ChangePasswordRequest
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/Profile/me/password', {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

// ============================================================
// UPLOAD AVATAR
// ============================================================

export async function uploadMyAvatar(
  file: File
): Promise<MyProfile> {
  const formData = new FormData();

  formData.append('file', file);

  return apiRequest<MyProfile>('/Profile/me/avatar', {
    method: 'POST',
    body: formData,
  });
}