import { apiRequest } from './client';

export interface MonthlyAttendanceReport {
    id: number;
    tenantId?: number;
    branchId: number;
    branchName?: string;
    year: number;
    month: number;
    status: number | string;
    submittedAtUtc?: string | null;
    approvedAtUtc?: string | null;
    returnedAtUtc?: string | null;
    returnReason?: string | null;
    employeeCount: number;
    employeesNeedingReview: number;
}

export interface MonthlyAttendanceEmployee {
    id: number;
    userId: number;
    employeeName?: string;
    workingDays: number;
    presentDays: number;
    approvedLeaveDays: number;
    halfDays: number;
    absentDays: number;
    lateArrivals: number;
    missingCheckIns: number;
    missingCheckOuts: number;
    totalWorkedHours: number;
    requiredWorkingHours: number;
    daysBelowRequiredHours: number;
    totalShortageHours: number;
    missingAttendanceDays: number;
    needsHrReview: boolean;
    hrReviewNotes?: string | null;
}


export interface MonthlyAttendanceReportDetails
    extends MonthlyAttendanceReport {
    employees: MonthlyAttendanceEmployee[];
}


export interface GenerateMonthlyAttendanceRequest {
    branchId: number;
    year: number;
    month: number;
}

export interface ReturnMonthlyAttendanceRequest {
    reason: string;
}

/**
 * Get monthly attendance reports using optional filters.
 */
export async function getMonthlyAttendanceReports(filters?: {
    year?: number;
    month?: number;
    branchId?: number;
    status?: number;
}): Promise<MonthlyAttendanceReport[]> {
    const params = new URLSearchParams();

    if (filters?.year != null) params.set('year', String(filters.year));
    if (filters?.month != null) params.set('month', String(filters.month));
    if (filters?.branchId != null) {
        params.set('branchId', String(filters.branchId));
    }
    if (filters?.status != null) params.set('status', String(filters.status));

    const query = params.toString();

    return apiRequest<MonthlyAttendanceReport[]>(
        `/MonthlyAttendance${query ? `?${query}` : ''}`,
        { method: 'GET' }
    );
}

/**
 * Get one report, including employee summaries.
 */
export async function getMonthlyAttendanceReport(
    reportId: number
): Promise<MonthlyAttendanceReportDetails> {
    return apiRequest<MonthlyAttendanceReportDetails>(
        `/MonthlyAttendance/${reportId}`,
        { method: 'GET' }
    );
}

/**
 * Generate or recalculate a monthly attendance report.
 */
export async function generateMonthlyAttendanceReport(
    request: GenerateMonthlyAttendanceRequest
): Promise<MonthlyAttendanceReport | void> {
    return apiRequest<MonthlyAttendanceReport | void>(
        '/MonthlyAttendance/generate',
        {
            method: 'POST',
            body: JSON.stringify(request),
        }
    );
}

/**
 * Submit a draft or returned report for approval.
 */
export async function submitMonthlyAttendanceReport(
    reportId: number
): Promise<void> {
    return apiRequest<void>(`/MonthlyAttendance/${reportId}/submit`, {
        method: 'POST',
    });
}

/**
 * Approve and lock a submitted report.
 */
export async function approveMonthlyAttendanceReport(
    reportId: number
): Promise<void> {
    return apiRequest<void>(`/MonthlyAttendance/${reportId}/approve`, {
        method: 'POST',
    });
}

/**
 * Return a submitted report to HR with a reason.
 */
export async function returnMonthlyAttendanceReport(
    reportId: number,
    request: ReturnMonthlyAttendanceRequest
): Promise<void> {
    return apiRequest<void>(`/MonthlyAttendance/${reportId}/return`, {
        method: 'POST',
        body: JSON.stringify(request),
    });
}
