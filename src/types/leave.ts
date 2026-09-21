export type LeaveType = 1 | 2 | 3;

export const LeaveType = {
  Earned: 1 as LeaveType,
  Casual: 2 as LeaveType,
  Sick: 3 as LeaveType,
} as const;

export type LeaveRequestStatus =
  | 1
  | 2
  | 3
  | 4;

export const LeaveRequestStatus = {
  Pending: 1 as LeaveRequestStatus,
  Approved: 2 as LeaveRequestStatus,
  Rejected: 3 as LeaveRequestStatus,
  Cancelled: 4 as LeaveRequestStatus,
} as const;

export interface LeaveRequest {
  id: number;

  userId: number;
  employeeName: string;
  employeeCode?: string | null;

  tenantId: number;
  branchId: number;
  branchName: string;

  leaveType: LeaveType;
  leaveTypeName: string;

  startDate: string;
  endDate: string;
  requestedDays: number;

  reason: string;

  status: LeaveRequestStatus;
  statusName: string;

  medicalCertificateFileUrl: string | null;
  medicalCertificateFileName: string | null;

  reviewedByUserId: number | null;
  reviewedByName?: string | null;
  reviewedAtUtc: string | null;
  reviewReason: string | null;

  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export interface CreateLeaveRequestRequest {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  medicalCertificateFileUrl?: string;
  medicalCertificateFileName?: string;
}

export interface ReviewLeaveRequestRequest {
  reviewReason?: string;
}

export interface LeaveRequestFilters {
  branchId?: number;
  status?: LeaveRequestStatus;
  leaveType?: LeaveType;
  userId?: number;
}
