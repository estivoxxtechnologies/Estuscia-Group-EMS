import { apiRequest } from './client';

import {
  CreateLeaveRequestRequest,
  LeaveRequest,
  LeaveRequestFilters,
  ReviewLeaveRequestRequest,
} from '../types/leave';

// ============================================================
// GET MY LEAVE REQUESTS
// GET /api/LeaveRequests/my
// ============================================================

export const getMyLeaveRequests =
  async (): Promise<LeaveRequest[]> => {
    return apiRequest<LeaveRequest[]>(
      '/LeaveRequests/my',
      {
        method: 'GET',
      },
    );
  };

// ============================================================
// GET LEAVE REQUESTS
// GET /api/LeaveRequests
// ============================================================

export const getLeaveRequests =
  async (
    filters?: LeaveRequestFilters,
  ): Promise<LeaveRequest[]> => {
    const params = new URLSearchParams();

    if (filters?.branchId !== undefined) {
      params.set(
        'branchId',
        String(filters.branchId),
      );
    }

    if (filters?.status !== undefined) {
      params.set(
        'status',
        String(filters.status),
      );
    }

    if (filters?.leaveType !== undefined) {
      params.set(
        'leaveType',
        String(filters.leaveType),
      );
    }

    if (filters?.userId !== undefined) {
      params.set(
        'userId',
        String(filters.userId),
      );
    }

    const query = params.toString();

    return apiRequest<LeaveRequest[]>(
      query
        ? `/LeaveRequests?${query}`
        : '/LeaveRequests',
      {
        method: 'GET',
      },
    );
  };

// ============================================================
// GET SINGLE LEAVE REQUEST
// GET /api/LeaveRequests/{id}
// ============================================================

export const getLeaveRequest =
  async (
    id: number,
  ): Promise<LeaveRequest> => {
    return apiRequest<LeaveRequest>(
      `/LeaveRequests/${id}`,
      {
        method: 'GET',
      },
    );
  };

// ============================================================
// CREATE LEAVE REQUEST
// POST /api/LeaveRequests
// ============================================================

export const createLeaveRequest =
  async (
    request: CreateLeaveRequestRequest,
  ): Promise<LeaveRequest> => {
    return apiRequest<LeaveRequest>(
      '/LeaveRequests',
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
    );
  };

// ============================================================
// APPROVE
// POST /api/LeaveRequests/{id}/approve
// ============================================================

export const approveLeaveRequest =
  async (
    id: number,
    request: ReviewLeaveRequestRequest = {},
  ): Promise<unknown> => {
    return apiRequest(
      `/LeaveRequests/${id}/approve`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
    );
  };

// ============================================================
// REJECT
// POST /api/LeaveRequests/{id}/reject
// ============================================================

export const rejectLeaveRequest =
  async (
    id: number,
    request: ReviewLeaveRequestRequest,
  ): Promise<unknown> => {
    return apiRequest(
      `/LeaveRequests/${id}/reject`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
    );
  };

// ============================================================
// CANCEL
// POST /api/LeaveRequests/{id}/cancel
// ============================================================

export const cancelLeaveRequest =
  async (
    id: number,
  ): Promise<unknown> => {
    return apiRequest(
      `/LeaveRequests/${id}/cancel`,
      {
        method: 'POST',
      },
    );
  };