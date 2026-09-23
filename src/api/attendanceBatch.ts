import { apiRequest } from './client';

import {
  AttendanceBatchExcelRow,
  ValidateAttendanceBatchResponse,
  SubmitAttendanceBatchResponse,
} from '../types/attendanceBatch';

// ============================================================
// VALIDATE BATCH
// ============================================================

export async function validateAttendanceBatch(
  rows: AttendanceBatchExcelRow[],
): Promise<ValidateAttendanceBatchResponse> {
  return apiRequest<ValidateAttendanceBatchResponse>(
    '/Attendance/batch/validate',
    {
      method: 'POST',
      body: JSON.stringify({
        rows,
      }),
    },
  );
}

// ============================================================
// SUBMIT BATCH
// ============================================================

export async function submitAttendanceBatch(
  rows: AttendanceBatchExcelRow[],
): Promise<SubmitAttendanceBatchResponse> {
  return apiRequest<SubmitAttendanceBatchResponse>(
    '/Attendance/batch/submit',
    {
      method: 'POST',
      body: JSON.stringify({
        rows,
      }),
    },
  );
}