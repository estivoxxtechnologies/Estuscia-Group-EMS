
import { apiRequest } from './client';

// ----------------------------------------------------
// TYPES
// ----------------------------------------------------

export interface EmployeeBasicInfo {
  id: number;
  fullName: string;
  employeeCode?: string | null;
  email?: string | null;
  designation?: string | null;
  department?: string | null;
  tenantId: number;
  branchId?: number | null;
}

export interface UserDetails {
  id: number;
  userId: number;

  dateOfBirth?: string | null;
  dateOfJoining?: string | null;

  phoneNumber?: string | null;
  officialNumber?: string | null;

  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;

  emergencyContactName?: string | null;
  emergencyContactNumber?: string | null;

  bankName?: string | null;
  accountHolderName?: string | null;

  // Account number is stored and returned as a normal string.
  accountNumber?: string | null;

  ifscCode?: string | null;
  bankBranchName?: string | null;

  notes?: string | null;
}

export interface UpdateUserDetailsRequest {
  dateOfBirth?: string | null;
  dateOfJoining?: string | null;

  phoneNumber?: string | null;
  officialNumber?: string | null;

  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;

  emergencyContactName?: string | null;
  emergencyContactNumber?: string | null;

  bankName?: string | null;
  accountHolderName?: string | null;

  // Sent to the API over HTTPS and stored as a normal string.
  accountNumber?: string | null;

  ifscCode?: string | null;
  bankBranchName?: string | null;

  notes?: string | null;
}

export type EmployeeDocumentType =
  | 'EducationCertificate'
  | 'Aadhaar'
  | 'PAN'
  | 'BankDocument'
  | 'PassportPhoto'
  | 'Passport'
  | 'Other';

export type DocumentVerificationStatus =
  | 'Pending'
  | 'Verified'
  | 'Rejected';

export interface EmployeeDocument {
  id: number;
  userId?: number;
  documentType: string;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  verificationStatus: DocumentVerificationStatus | string;
  verifiedAtUtc?: string | null;
  rejectionReason?: string | null;
  uploadedAtUtc: string;
}

export interface MyUserDetailsResponse {
  employee: EmployeeBasicInfo;
  details: UserDetails | null;
  documents: EmployeeDocument[];
}

export interface EmployeeUserDetailsResponse {
  employee: EmployeeBasicInfo;
  details: UserDetails | null;
  documents: EmployeeDocument[];
}

export interface UploadEmployeeDocumentResponse {
  message: string;
  document: EmployeeDocument;
}

export interface ReviewEmployeeDocumentRequest {
  verificationStatus: 'Verified' | 'Rejected';
  rejectionReason?: string | null;
}

// ----------------------------------------------------
// HELPERS
// ----------------------------------------------------

function employeeDetailsEndpoint(userId: number): string {
  return `/UserDetails/employees/${userId}`;
}

// ----------------------------------------------------
// GET MY DETAILS
// GET: /api/UserDetails/me
// ----------------------------------------------------

export async function getMyUserDetails(): Promise<MyUserDetailsResponse> {
  return apiRequest<MyUserDetailsResponse>('/UserDetails/me', {
    method: 'GET',
  });
}

// ----------------------------------------------------
// UPDATE MY DETAILS
// PUT: /api/UserDetails/me
// ----------------------------------------------------

export async function updateMyUserDetails(
  request: UpdateUserDetailsRequest,
): Promise<unknown> {
  return apiRequest('/UserDetails/me', {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

// ----------------------------------------------------
// GET EMPLOYEE DETAILS
// GET: /api/UserDetails/employees/{userId}
// ----------------------------------------------------

export async function getEmployeeUserDetails(
  userId: number,
): Promise<EmployeeUserDetailsResponse> {
  return apiRequest<EmployeeUserDetailsResponse>(
    employeeDetailsEndpoint(userId),
    {
      method: 'GET',
    },
  );
}

// ----------------------------------------------------
// UPDATE EMPLOYEE DETAILS
// PUT: /api/UserDetails/employees/{userId}
// ----------------------------------------------------

export async function updateEmployeeUserDetails(
  userId: number,
  request: UpdateUserDetailsRequest,
): Promise<unknown> {
  return apiRequest(
    employeeDetailsEndpoint(userId),
    {
      method: 'PUT',
      body: JSON.stringify(request),
    },
  );
}

// ----------------------------------------------------
// UPLOAD EMPLOYEE DOCUMENT
// POST: /api/UserDetails/employees/{userId}/documents
// ----------------------------------------------------

export async function uploadEmployeeDocument(
  userId: number,
  file: File,
  documentType: EmployeeDocumentType,
): Promise<UploadEmployeeDocumentResponse> {
  const formData = new FormData();

  formData.append('file', file);
  formData.append('documentType', documentType);

  // Do not manually set Content-Type.
  // The browser creates the multipart boundary.
  return apiRequest<UploadEmployeeDocumentResponse>(
    `/UserDetails/employees/${userId}/documents`,
    {
      method: 'POST',
      body: formData,
    },
  );
}

// ----------------------------------------------------
// DOWNLOAD EMPLOYEE DOCUMENT
// ----------------------------------------------------

export async function downloadEmployeeDocument(
  documentId: number,
): Promise<Blob> {
  const response = await fetch(
    `/api/UserDetails/documents/${documentId}/download`,
    {
      method: 'GET',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to download document (${response.status}).`,
    );
  }

  return response.blob();
}

// ----------------------------------------------------
// REVIEW DOCUMENT
// PUT: /api/UserDetails/documents/{documentId}/review
// ----------------------------------------------------

export async function reviewEmployeeDocument(
  documentId: number,
  request: ReviewEmployeeDocumentRequest,
): Promise<unknown> {
  return apiRequest(
    `/UserDetails/documents/${documentId}/review`,
    {
      method: 'PUT',
      body: JSON.stringify(request),
    },
  );
}
