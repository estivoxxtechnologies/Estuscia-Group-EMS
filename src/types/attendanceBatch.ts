import { AttendanceStatus } from './attendance';

// ============================================================
// RAW EXCEL ROW
// ============================================================

export interface AttendanceBatchExcelRow {
  employeeCode: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  biometricDeviceId: string | null;
}

// ============================================================
// BACKEND VALIDATED ROW
// ============================================================

export interface AttendanceBatchPreviewRow {
  rowNumber: number;

  employeeCode: string;

  userId: number | null;
  userName: string | null;

  tenantId: number | null;
  branchId: number | null;
  branchName: string | null;

  date: string;

  checkInTime: string | null;
  checkOutTime: string | null;

  biometricDeviceId: string | null;

  requiredHours: number | null;

  scheduledStartTime: string | null;
  scheduledEndTime: string | null;

  workedHours: number;
  overtimeHours: number;
  workingHoursBalance: number;

  isLate: boolean;
  isEarlyLeaving: boolean;

  statusId: number | null;
  status: AttendanceStatus | null;

  isValid: boolean;

  errors: string[];

  warnings: string[];
}

// ============================================================
// VALIDATE REQUEST
// ============================================================

export interface ValidateAttendanceBatchRequest {
  rows: AttendanceBatchExcelRow[];
}

// ============================================================
// VALIDATE RESPONSE
// ============================================================

export interface ValidateAttendanceBatchResponse {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warningRows: number;

  rows: AttendanceBatchPreviewRow[];
}

// ============================================================
// SUBMIT REQUEST
// ============================================================

export interface SubmitAttendanceBatchRequest {
  rows: AttendanceBatchExcelRow[];
}

// ============================================================
// SUBMIT RESPONSE
// ============================================================

export interface SubmitAttendanceBatchResponse {
  message: string;

  insertedCount: number;

  skippedCount: number;

  rows: {
    rowNumber: number;
    employeeCode: string;
    date: string;
    attendanceId: number | null;
    status: 'Inserted' | 'Skipped';
    message: string;
  }[];
}