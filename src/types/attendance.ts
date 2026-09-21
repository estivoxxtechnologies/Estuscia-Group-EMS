export type AttendanceStatus =
  | 'Present'
  | 'Late'
  | 'HalfDay'
  | 'Absent'
  | 'OnLeave';

export interface AttendanceRecord {
  id: number;

  tenantId: number | null;

  branchId: number;
  branchName: string;

  userId: number;
  userName: string;
  employeeCode: string | null;

  date: string;

  checkInTime: string | null;
  checkOutTime: string | null;

  statusId: number;
  status: AttendanceStatus;

  overtimeHours: number;

  biometricDeviceId: string | null;

  createdAtUtc: string;
  updatedAtUtc: string | null;
  createdByUserId: number | null;
}

export interface CheckInRequest {
  date?: string;
  checkInTime?: string;
  status?: AttendanceStatus;
  biometricDeviceId?: string;
}

export interface CheckInResponse {
  message: string;

  attendanceId: number;

  tenantId: number | null;
  branchId: number;
  userId: number;

  date: string;

  checkInTime: string | null;
  checkOutTime: string | null;

  statusId: number;
  status: AttendanceStatus;

  overtimeHours: number;
}

export interface CheckOutRequest {
  date?: string;
  checkOutTime?: string;
}

export interface CheckOutResponse {
  message: string;

  attendanceId: number;

  date: string;

  checkInTime: string | null;
  checkOutTime: string | null;

  overtimeHours: number;

  statusId: number;
  status: AttendanceStatus;
}

export interface UpdateAttendanceRequest {
  checkInTime?: string;
  checkOutTime?: string;
  status?: AttendanceStatus;
  overtimeHours?: number;
  biometricDeviceId?: string;
}

export interface UpdateAttendanceResponse {
  message: string;
  attendanceId: number;
}

export interface AttendanceFilters {
  branchId?: number;
  date?: string;
  userId?: number;
}