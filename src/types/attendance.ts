export type AttendanceStatus =
  | 'Present'
  | 'Late'
  | 'HalfDay'
  | 'Absent'
  | 'OnLeave';


// ============================================================
// ATTENDANCE RECORD
// ============================================================

export interface AttendanceRecord {
  id: number;

  tenantId: number;
  branchId: number;
  branchName: string;

  userId: number;
  userName: string;
  employeeCode: string;

  date: string;

  checkInTime: string | null;
  checkOutTime: string | null;

  // ============================================================
  // EFFECTIVE SCHEDULE
  // ============================================================

  requiredHours: number;

  scheduledStartTime: string;
  scheduledEndTime: string;

  scheduleSource: 'Tenant' | 'Branch';

  // ============================================================
  // CALCULATED VALUES
  // ============================================================

  workedHours: number;

  overtimeHours: number;

  workingHoursBalance: number;

  isLate: boolean;

  isEarlyLeaving: boolean;

  // ============================================================
  // STATUS
  // ============================================================

  statusId: number;

  status: AttendanceStatus;

  // ============================================================
  // BIOMETRIC
  // ============================================================

  biometricDeviceId: string | null;

  // ============================================================
  // AUDIT
  // ============================================================

  createdAtUtc: string;

  updatedAtUtc: string | null;

  createdByUserId: number | null;
}


// ============================================================
// CHECK-IN
// ============================================================

export interface CheckInRequest {
  date?: string;
  checkInTime?: string;

  // Keep this only if admin/manual attendance
  // is allowed to specify status.
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

  // Effective schedule
  requiredHours: number;
  scheduledStartTime: string;
  scheduledEndTime: string;
  scheduleSource: 'Tenant' | 'Branch';

  // Calculated values
  workedHours: number;
  overtimeHours: number;
  workingHoursBalance: number;

  lateMinutes: number;
  earlyLeavingMinutes: number;

  isLate: boolean;
  isEarlyLeaving: boolean;

  statusId: number;
  status: AttendanceStatus;

  biometricDeviceId: string | null;
}


// ============================================================
// CHECK-OUT
// ============================================================

export interface CheckOutRequest {
  date?: string;
  checkOutTime?: string;
}


export interface CheckOutResponse {
  message: string;

  attendanceId: number;

  tenantId: number | null;
  branchId: number;
  userId: number;

  date: string;

  checkInTime: string | null;
  checkOutTime: string | null;

  // Effective schedule
  requiredHours: number;
  scheduledStartTime: string;
  scheduledEndTime: string;
  scheduleSource: 'Tenant' | 'Branch';

  // Calculated values
  workedHours: number;
  overtimeHours: number;
  workingHoursBalance: number;

  lateMinutes: number;
  earlyLeavingMinutes: number;

  isLate: boolean;
  isEarlyLeaving: boolean;

  statusId: number;
  status: AttendanceStatus;
}


// ============================================================
// UPDATE ATTENDANCE
// ============================================================

export interface UpdateAttendanceRequest {
  checkInTime?: string;
  checkOutTime?: string;

  // Used only for manual/admin correction
  status?: AttendanceStatus;

  biometricDeviceId?: string;
}


export interface UpdateAttendanceResponse {
  message: string;
  attendanceId: number;
}


// ============================================================
// ATTENDANCE FILTERS
// ============================================================

export interface AttendanceFilters {
  branchId?: number;
  date?: string;
  fromDate?: string;
  toDate?: string;
  userId?: number;
}

// ============================================================
// ATTENDANCE BATCH UPLOAD
// ============================================================

export interface AttendanceBatchRow {
  rowNumber: number;

  employeeCode: string;

  date: string;

  checkInTime: string | null;

  checkOutTime: string | null;

  biometricDeviceId: string | null;

  // Browser-side validation
  isValid: boolean;

  validationMessage: string | null;
}

export interface AttendanceBatchUploadRequest {
  branchId: number;

  rows: {
    employeeCode: string;
    date: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    biometricDeviceId?: string | null;
  }[];
}

export interface AttendanceBatchUploadResponse {
  message: string;

  insertedCount: number;

  updatedCount: number;

  skippedCount: number;

  errors: {
    rowNumber: number;
    employeeCode: string | null;
    message: string;
  }[];
}