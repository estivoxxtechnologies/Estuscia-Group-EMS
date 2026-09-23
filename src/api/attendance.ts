import { apiRequest } from './client';

import {
  AttendanceRecord,
  AttendanceFilters,
  CheckInRequest,
  CheckInResponse,
  CheckOutRequest,
  CheckOutResponse,
  UpdateAttendanceRequest,
  UpdateAttendanceResponse,
  AttendanceBatchUploadRequest,
  AttendanceBatchUploadResponse,
} from '../types/attendance';

// ============================================================
// GET ATTENDANCE
// ============================================================

export async function getAttendance(
  filters: AttendanceFilters = {}
): Promise<AttendanceRecord[]> {
  const params = new URLSearchParams();

  // ----------------------------------------------------------
  // Branch filter
  // ----------------------------------------------------------

  if (filters.branchId !== undefined) {
    params.append('branchId', String(filters.branchId));
  }

  if (filters.fromDate !== undefined) {
    params.append('fromDate', filters.fromDate);
  }

  if (filters.toDate !== undefined) {
    params.append('toDate', filters.toDate);
  }

  if (filters.userId !== undefined) {
    params.append('userId', String(filters.userId));
  }

  const query = params.toString();

  return apiRequest<AttendanceRecord[]>(
    `/Attendance${query ? `?${query}` : ''}`,
    {
      method: 'GET',
    }
  );
}

// ============================================================
// GET ATTENDANCE BY ID
// ============================================================

export async function getAttendanceById(
  id: number
): Promise<AttendanceRecord> {
  return apiRequest<AttendanceRecord>(
    `/Attendance/${id}`,
    {
      method: 'GET',
    }
  );
}

// ============================================================
// CHECK IN
// ============================================================

export async function checkIn(
  request: CheckInRequest = {}
): Promise<CheckInResponse> {
  return apiRequest<CheckInResponse>(
    '/Attendance/check-in',
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );
}

// ============================================================
// CHECK OUT
// ============================================================

export async function checkOut(
  request: CheckOutRequest = {}
): Promise<CheckOutResponse> {
  return apiRequest<CheckOutResponse>(
    '/Attendance/check-out',
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );
}

// ============================================================
// UPDATE ATTENDANCE
// ============================================================

export async function updateAttendance(
  id: number,
  request: UpdateAttendanceRequest
): Promise<UpdateAttendanceResponse> {
  return apiRequest<UpdateAttendanceResponse>(
    `/Attendance/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(request),
    }
  );
}

// ============================================================
// BATCH UPLOAD ATTENDANCE
// ============================================================

export async function batchUploadAttendance(
  request: AttendanceBatchUploadRequest
): Promise<AttendanceBatchUploadResponse> {
  return apiRequest<AttendanceBatchUploadResponse>(
    '/Attendance/batch-upload',
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );
}