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
} from '../types/attendance';

export async function getAttendance(
  filters: AttendanceFilters = {}
): Promise<AttendanceRecord[]> {
  const params = new URLSearchParams();

  if (filters.branchId !== undefined) {
    params.append('branchId', String(filters.branchId));
  }

  if (filters.date !== undefined) {
    params.append('date', filters.date);
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

export async function getAttendanceById(
  id: number
): Promise<AttendanceRecord> {
  return apiRequest<AttendanceRecord>(`/Attendance/${id}`, {
    method: 'GET',
  });
}

export async function checkIn(
  request: CheckInRequest = {}
): Promise<CheckInResponse> {
  return apiRequest<CheckInResponse>('/Attendance/check-in', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function checkOut(
  request: CheckOutRequest = {}
): Promise<CheckOutResponse> {
  return apiRequest<CheckOutResponse>('/Attendance/check-out', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

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