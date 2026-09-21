import React, {
    FormEvent,
    useCallback,
    useEffect,
    useState,
} from 'react';

import {
    AlertCircle,
    CalendarDays,
    Check,
    ChevronDown,
    Clock3,
    FileText,
    Loader2,
    Plus,
    RefreshCw,
    Send,
    X,
    XCircle,
} from 'lucide-react';

import { useApp } from '../context/AppContext';

import {
    approveLeaveRequest,
    cancelLeaveRequest,
    createLeaveRequest,
    getLeaveRequests,
    getMyLeaveRequests,
    rejectLeaveRequest,
} from '../api/leaveRequests';

import {
    LeaveRequest,
    LeaveRequestStatus,
    LeaveType,
} from '../types/leave';

/*
 * ============================================================
 * OPTIONS
 * ============================================================
 */

const leaveTypeOptions = [
    {
        value: LeaveType.Earned,
        label: 'Earned Leave',
    },
    {
        value: LeaveType.Casual,
        label: 'Casual Leave',
    },
    {
        value: LeaveType.Sick,
        label: 'Sick Leave',
    },
];

const statusOptions = [
    {
        value: LeaveRequestStatus.Pending,
        label: 'Pending',
    },
    {
        value: LeaveRequestStatus.Approved,
        label: 'Approved',
    },
    {
        value: LeaveRequestStatus.Rejected,
        label: 'Rejected',
    },
    {
        value: LeaveRequestStatus.Cancelled,
        label: 'Cancelled',
    },
];

/*
 * ============================================================
 * STATUS STYLE
 * ============================================================
 */

const getStatusClass = (
    status: LeaveRequestStatus,
) => {
    switch (status) {
        case LeaveRequestStatus.Approved:
            return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';

        case LeaveRequestStatus.Rejected:
            return 'bg-rose-500/10 text-rose-300 border-rose-500/30';

        case LeaveRequestStatus.Cancelled:
            return 'bg-slate-500/10 text-slate-300 border-slate-500/30';

        default:
            return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    }
};

/*
 * ============================================================
 * DATE FORMATTER
 * ============================================================
 */

const formatDate = (value: string) => {
    if (!value) {
        return '-';
    }

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

/*
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export const LeaveManagement: React.FC = () => {
    const { currentUser } = useApp();

    /*
     * ============================================================
     * STATE
     * ============================================================
     */

    const [requests, setRequests] =
        useState<LeaveRequest[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [success, setSuccess] =
        useState<string | null>(null);

    const [showCreateForm, setShowCreateForm] =
        useState(false);

    const [statusFilter, setStatusFilter] =
        useState<LeaveRequestStatus | ''>('');

    const [leaveTypeFilter, setLeaveTypeFilter] =
        useState<LeaveType | ''>('');

    const [reviewRequest, setReviewRequest] =
        useState<LeaveRequest | null>(null);

    const [reviewAction, setReviewAction] =
        useState<'approve' | 'reject' | null>(null);

    const [reviewReason, setReviewReason] =
        useState('');

    const [form, setForm] = useState({
        leaveType: LeaveType.Casual as LeaveType,
        startDate: '',
        endDate: '',
        reason: '',
        medicalCertificateFileUrl: '',
        medicalCertificateFileName: '',
    });

    /*
     * ============================================================
     * USER / ROLE
     * ============================================================
     */

    const role = currentUser?.roleName
        ?.trim()
        .toLowerCase()
        .replace(/\s+/g, '_');

    const isEmployee =
        role === 'sales_staff';

    const isHrOps =
        role === 'hr_ops';

    const isBranchManager =
        role === 'branch_manager' ||
        role === 'branch_admin';

    const isCompanyAdmin =
        role === 'company_admin';

    /*
     * Only HR Ops and Branch Manager can approve/reject.
     */
    const canReview =
        isHrOps ||
        isBranchManager;

    /*
     * ============================================================
     * LOAD REQUESTS
     * ============================================================
     */

    const loadRequests = useCallback(async () => {
        if (!currentUser) {
            setRequests([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            /*
             * SALES STAFF
             *
             * Only own leave requests.
             */
            if (isEmployee) {
                const result =
                    await getMyLeaveRequests();

                setRequests(result);
                return;
            }

            /*
             * MANAGEMENT
             *
             * HR Ops:
             *   Tenant-wide.
             *
             * Branch Manager:
             *   Only assigned branch.
             *
             * Company Admin:
             *   Tenant-wide view.
             */
            const result =
                await getLeaveRequests({
                    status:
                        statusFilter === ''
                            ? undefined
                            : statusFilter,

                    leaveType:
                        leaveTypeFilter === ''
                            ? undefined
                            : leaveTypeFilter,

                    branchId:
                        isBranchManager
                            ? currentUser.branchId ??
                              undefined
                            : undefined,
                });

            setRequests(result);
        } catch (err) {
            setRequests([]);

            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load leave requests.',
            );
        } finally {
            setLoading(false);
        }
    }, [
        currentUser,
        isEmployee,
        isBranchManager,
        statusFilter,
        leaveTypeFilter,
    ]);

    /*
     * ============================================================
     * INITIAL / FILTER LOAD
     * ============================================================
     */

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    /*
     * ============================================================
     * RESET FORM
     * ============================================================
     */

    const resetForm = () => {
        setForm({
            leaveType: LeaveType.Casual,
            startDate: '',
            endDate: '',
            reason: '',
            medicalCertificateFileUrl: '',
            medicalCertificateFileName: '',
        });
    };

    /*
     * ============================================================
     * CREATE LEAVE
     * ============================================================
     */

    const handleCreate = async (
        event: FormEvent,
    ) => {
        event.preventDefault();

        try {
            setSubmitting(true);
            setError(null);
            setSuccess(null);

            if (
                !form.startDate ||
                !form.endDate
            ) {
                throw new Error(
                    'Please select the leave start and end dates.',
                );
            }

            if (!form.reason.trim()) {
                throw new Error(
                    'Please provide a reason for the leave.',
                );
            }

            /*
             * Sick leave requires medical certificate.
             */
            if (
                form.leaveType === LeaveType.Sick &&
                !form.medicalCertificateFileUrl.trim()
            ) {
                throw new Error(
                    'A medical certificate URL is required for sick leave.',
                );
            }

            await createLeaveRequest({
                leaveType: form.leaveType,
                startDate: form.startDate,
                endDate: form.endDate,
                reason: form.reason.trim(),

                medicalCertificateFileUrl:
                    form.medicalCertificateFileUrl.trim() ||
                    undefined,

                medicalCertificateFileName:
                    form.medicalCertificateFileName.trim() ||
                    undefined,
            });

            setSuccess(
                'Leave request submitted successfully.',
            );

            setShowCreateForm(false);

            resetForm();

            await loadRequests();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to submit leave request.',
            );
        } finally {
            setSubmitting(false);
        }
    };

    /*
     * ============================================================
     * CANCEL LEAVE
     * ============================================================
     */

    const handleCancel = async (
        request: LeaveRequest,
    ) => {
        if (
            !window.confirm(
                'Are you sure you want to cancel this leave request?',
            )
        ) {
            return;
        }

        try {
            setError(null);
            setSuccess(null);

            await cancelLeaveRequest(
                request.id,
            );

            setSuccess(
                'Leave request cancelled successfully.',
            );

            await loadRequests();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to cancel leave request.',
            );
        }
    };

    /*
     * ============================================================
     * OPEN REVIEW
     * ============================================================
     */

    const openReview = (
        request: LeaveRequest,
        action: 'approve' | 'reject',
    ) => {
        setReviewRequest(request);
        setReviewAction(action);
        setReviewReason('');
        setError(null);
        setSuccess(null);
    };

    /*
     * ============================================================
     * CLOSE REVIEW
     * ============================================================
     */

    const closeReview = () => {
        if (submitting) {
            return;
        }

        setReviewRequest(null);
        setReviewAction(null);
        setReviewReason('');
    };

    /*
     * ============================================================
     * APPROVE / REJECT
     * ============================================================
     */

    const handleReview = async (
        event: FormEvent,
    ) => {
        event.preventDefault();

        if (
            !reviewRequest ||
            !reviewAction
        ) {
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            setSuccess(null);

            /*
             * REJECT REQUIRES REASON
             */
            if (
                reviewAction === 'reject' &&
                !reviewReason.trim()
            ) {
                throw new Error(
                    'A rejection reason is required.',
                );
            }

            /*
             * APPROVE
             */
            if (
                reviewAction === 'approve'
            ) {
                await approveLeaveRequest(
                    reviewRequest.id,
                    {
                        reviewReason:
                            reviewReason.trim() ||
                            undefined,
                    },
                );

                setSuccess(
                    'Leave request approved successfully.',
                );
            }

            /*
             * REJECT
             */
            else {
                await rejectLeaveRequest(
                    reviewRequest.id,
                    {
                        reviewReason:
                            reviewReason.trim(),
                    },
                );

                setSuccess(
                    'Leave request rejected successfully.',
                );
            }

            /*
             * CLOSE MODAL
             */
            setReviewRequest(null);
            setReviewAction(null);
            setReviewReason('');

            /*
             * RELOAD LIST
             */
            await loadRequests();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to update leave request.',
            );
        } finally {
            setSubmitting(false);
        }
    };

    /*
     * ============================================================
     * NO USER
     * ============================================================
     */

    if (!currentUser) {
        return (
            <div className="p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/70 text-slate-300">
                Loading leave management...
            </div>
        );
    }

    /*
     * ============================================================
     * UI
     * ============================================================
     */

    return (
        <div className="space-y-5">

            {/* ====================================================== */}
            {/* HEADER */}
            {/* ====================================================== */}

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                <div>
                    <div className="flex items-center gap-2">

                        <CalendarDays className="w-5 h-5 text-[#A78BFA]" />

                        <h2 className="text-lg font-bold text-white">
                            Leave Management
                        </h2>

                    </div>

                    <p className="text-xs text-slate-400 mt-1">
                        {isEmployee
                            ? 'Apply for leave and track your requests.'
                            : isBranchManager
                                ? 'Review leave requests for your assigned branch.'
                                : isHrOps
                                    ? 'Review and manage employee leave requests.'
                                    : 'View employee leave requests.'}
                    </p>
                </div>

                <div className="flex items-center gap-2">

                    <button
                        type="button"
                        onClick={loadRequests}
                        disabled={loading}
                        className="px-3 py-2 rounded-xl bg-[#140f3d] border border-[#2d2770] text-slate-200 text-xs font-semibold flex items-center gap-2 hover:bg-[#1f175a] disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${
                                loading
                                    ? 'animate-spin'
                                    : ''
                            }`}
                        />

                        Refresh
                    </button>

                    {isEmployee && (
                        <button
                            type="button"
                            onClick={() =>
                                setShowCreateForm(true)
                            }
                            className="px-4 py-2 rounded-xl bg-[#5C3FE0] hover:bg-[#6848ef] text-white text-xs font-bold flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />

                            Apply Leave
                        </button>
                    )}

                </div>
            </div>

            {/* ====================================================== */}
            {/* MESSAGES */}
            {/* ====================================================== */}

            {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">

                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />

                    <span>{error}</span>

                </div>
            )}

            {success && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">

                    <Check className="w-4 h-4 mt-0.5 shrink-0" />

                    <span>{success}</span>

                </div>
            )}

            {/* ====================================================== */}
            {/* MANAGEMENT FILTERS */}
            {/* ====================================================== */}

            {!isEmployee && (
                <div className="p-4 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">

                    <div className="flex flex-col md:flex-row gap-3">

                        {/* STATUS */}
                        <div className="relative flex-1">

                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target.value === ''
                                            ? ''
                                            : Number(
                                                event.target.value,
                                            ) as LeaveRequestStatus,
                                    )
                                }
                                className="w-full appearance-none bg-[#0e0b2e] border border-[#2d2770] rounded-xl px-3 py-2.5 pr-9 text-xs text-slate-200 outline-none"
                            >
                                <option value="">
                                    All Statuses
                                </option>

                                {statusOptions.map(
                                    (option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ),
                                )}
                            </select>

                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />

                        </div>

                        {/* LEAVE TYPE */}
                        <div className="relative flex-1">

                            <select
                                value={leaveTypeFilter}
                                onChange={(event) =>
                                    setLeaveTypeFilter(
                                        event.target.value === ''
                                            ? ''
                                            : Number(
                                                event.target.value,
                                            ) as LeaveType,
                                    )
                                }
                                className="w-full appearance-none bg-[#0e0b2e] border border-[#2d2770] rounded-xl px-3 py-2.5 pr-9 text-xs text-slate-200 outline-none"
                            >
                                <option value="">
                                    All Leave Types
                                </option>

                                {leaveTypeOptions.map(
                                    (option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ),
                                )}
                            </select>

                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />

                        </div>

                    </div>

                </div>
            )}

            {/* ====================================================== */}
            {/* CREATE FORM */}
            {/* ====================================================== */}

            {showCreateForm && isEmployee && (
                <div className="p-5 rounded-2xl bg-[#09071e] border border-[#5C3FE0]/40">

                    <div className="flex items-center justify-between mb-5">

                        <div>

                            <h3 className="text-sm font-bold text-white">
                                Apply for Leave
                            </h3>

                            <p className="text-xs text-slate-400 mt-1">
                                Submit a new leave request for approval.
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setShowCreateForm(false);
                                resetForm();
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                        >
                            <X className="w-4 h-4" />
                        </button>

                    </div>

                    <form
                        onSubmit={handleCreate}
                        className="space-y-4"
                    >

                        {/* LEAVE TYPE + DATES */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            <div>

                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Leave Type
                                </label>

                                <select
                                    value={form.leaveType}
                                    onChange={(event) =>
                                        setForm((previous) => ({
                                            ...previous,
                                            leaveType:
                                                Number(
                                                    event.target.value,
                                                ) as LeaveType,
                                        }))
                                    }
                                    className="w-full bg-[#0e0b2e] border border-[#2d2770] rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                                >
                                    {leaveTypeOptions.map(
                                        (option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ),
                                    )}
                                </select>

                            </div>

                            <div>

                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Start Date
                                </label>

                                <input
                                    type="date"
                                    value={form.startDate}
                                    onChange={(event) =>
                                        setForm((previous) => ({
                                            ...previous,
                                            startDate:
                                                event.target.value,
                                        }))
                                    }
                                    className="w-full bg-[#0e0b2e] border border-[#2d2770] rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                                    required
                                />

                            </div>

                            <div>

                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    End Date
                                </label>

                                <input
                                    type="date"
                                    value={form.endDate}
                                    min={
                                        form.startDate ||
                                        undefined
                                    }
                                    onChange={(event) =>
                                        setForm((previous) => ({
                                            ...previous,
                                            endDate:
                                                event.target.value,
                                        }))
                                    }
                                    className="w-full bg-[#0e0b2e] border border-[#2d2770] rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                                    required
                                />

                            </div>

                        </div>

                        {/* REASON */}
                        <div>

                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Reason
                            </label>

                            <textarea
                                value={form.reason}
                                onChange={(event) =>
                                    setForm((previous) => ({
                                        ...previous,
                                        reason:
                                            event.target.value,
                                    }))
                                }
                                rows={3}
                                placeholder="Enter the reason for your leave..."
                                className="w-full resize-none bg-[#0e0b2e] border border-[#2d2770] rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none"
                                required
                            />

                        </div>

                        {/* MEDICAL CERTIFICATE */}
                        {form.leaveType ===
                            LeaveType.Sick && (
                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">

                                <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">

                                    <FileText className="w-4 h-4" />

                                    Medical Certificate

                                </div>

                                <input
                                    type="text"
                                    value={
                                        form.medicalCertificateFileName
                                    }
                                    onChange={(event) =>
                                        setForm((previous) => ({
                                            ...previous,
                                            medicalCertificateFileName:
                                                event.target.value,
                                        }))
                                    }
                                    placeholder="Certificate file name"
                                    className="w-full bg-[#0e0b2e] border border-[#2d2770] rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none"
                                />

                                <input
                                    type="url"
                                    value={
                                        form.medicalCertificateFileUrl
                                    }
                                    onChange={(event) =>
                                        setForm((previous) => ({
                                            ...previous,
                                            medicalCertificateFileUrl:
                                                event.target.value,
                                        }))
                                    }
                                    placeholder="Medical certificate URL"
                                    className="w-full bg-[#0e0b2e] border border-[#2d2770] rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none"
                                    required
                                />

                                <p className="text-[11px] text-slate-500">
                                    File upload will be connected when the
                                    document upload endpoint is added.
                                </p>

                            </div>
                        )}

                        {/* FORM ACTIONS */}
                        <div className="flex justify-end gap-2 pt-2">

                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    resetForm();
                                }}
                                className="px-4 py-2 rounded-xl bg-[#140f3d] border border-[#2d2770] text-slate-300 text-xs font-semibold"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 rounded-xl bg-[#5C3FE0] text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}

                                Submit Leave
                            </button>

                        </div>

                    </form>

                </div>
            )}

            {/* ====================================================== */}
            {/* TABLE */}
            {/* ====================================================== */}

            <div className="rounded-2xl bg-[#09071e] border border-[#2d2770]/70 overflow-hidden">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[1050px] text-xs">

                        <thead className="bg-[#0e0b2e] border-b border-[#2d2770]">

                            <tr className="text-left text-slate-400">

                                {!isEmployee && (
                                    <th className="px-4 py-3 font-semibold">
                                        Employee
                                    </th>
                                )}

                                <th className="px-4 py-3 font-semibold">
                                    Leave
                                </th>

                                {!isEmployee && (
                                    <th className="px-4 py-3 font-semibold">
                                        Branch
                                    </th>
                                )}

                                <th className="px-4 py-3 font-semibold">
                                    Dates
                                </th>

                                <th className="px-4 py-3 font-semibold">
                                    Days
                                </th>

                                <th className="px-4 py-3 font-semibold">
                                    Reason
                                </th>

                                <th className="px-4 py-3 font-semibold">
                                    Status
                                </th>

                                <th className="px-4 py-3 font-semibold">
                                    Review
                                </th>

                                <th className="px-4 py-3 font-semibold text-right">
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody className="divide-y divide-[#1d1847]">

                            {/* LOADING */}
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={
                                            isEmployee
                                                ? 7
                                                : 9
                                        }
                                        className="px-4 py-12 text-center text-slate-500"
                                    >
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />

                                        Loading leave requests...
                                    </td>
                                </tr>
                            )

                            /* EMPTY */
                            : requests.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            isEmployee
                                                ? 7
                                                : 9
                                        }
                                        className="px-4 py-12 text-center text-slate-500"
                                    >
                                        <CalendarDays className="w-7 h-7 mx-auto mb-2 opacity-40" />

                                        No leave requests found.
                                    </td>
                                </tr>
                            )

                            /* DATA */
                            : (
                                requests.map(
                                    (request) => {

                                        /*
                                         * Backend normally returns:
                                         *
                                         * status = 1
                                         * statusName = "Pending"
                                         *
                                         * This check supports both numeric
                                         * and string responses safely.
                                         */
                                        const isPending =
                                            request.status ===
                                                LeaveRequestStatus.Pending ||
                                            String(
                                                request.status,
                                            ).toLowerCase() ===
                                                'pending' ||
                                            String(
                                                request.statusName,
                                            ).toLowerCase() ===
                                                'pending';

                                        return (
                                            <tr
                                                key={request.id}
                                                className="hover:bg-[#0e0b2e]/70"
                                            >

                                                {/* EMPLOYEE */}
                                                {!isEmployee && (
                                                    <td className="px-4 py-4">

                                                        <div className="font-semibold text-white">
                                                            {
                                                                request.employeeName
                                                            }
                                                        </div>

                                                        {request.employeeCode && (
                                                            <div className="text-[10px] text-slate-500 mt-0.5">
                                                                {
                                                                    request.employeeCode
                                                                }
                                                            </div>
                                                        )}

                                                    </td>
                                                )}

                                                {/* LEAVE TYPE */}
                                                <td className="px-4 py-4">

                                                    <div className="font-semibold text-slate-200">
                                                        {
                                                            request.leaveTypeName
                                                        }
                                                    </div>

                                                </td>

                                                {/* BRANCH */}
                                                {!isEmployee && (
                                                    <td className="px-4 py-4 text-slate-400">
                                                        {
                                                            request.branchName
                                                        }
                                                    </td>
                                                )}

                                                {/* DATES */}
                                                <td className="px-4 py-4">

                                                    <div className="text-slate-300">
                                                        {formatDate(
                                                            request.startDate,
                                                        )}
                                                    </div>

                                                    <div className="text-slate-500">
                                                        to{' '}
                                                        {formatDate(
                                                            request.endDate,
                                                        )}
                                                    </div>

                                                </td>

                                                {/* DAYS */}
                                                <td className="px-4 py-4">

                                                    <div className="flex items-center gap-1 text-slate-300">

                                                        <Clock3 className="w-3.5 h-3.5 text-slate-500" />

                                                        {
                                                            request.requestedDays
                                                        }

                                                    </div>

                                                </td>

                                                {/* REASON */}
                                                <td className="px-4 py-4 max-w-[240px]">

                                                    <div className="text-slate-400 line-clamp-2">
                                                        {
                                                            request.reason
                                                        }
                                                    </div>

                                                    {request.medicalCertificateFileName && (
                                                        <div className="flex items-center gap-1 mt-1 text-[#A78BFA]">

                                                            <FileText className="w-3 h-3" />

                                                            {
                                                                request.medicalCertificateFileName
                                                            }

                                                        </div>
                                                    )}

                                                </td>

                                                {/* STATUS */}
                                                <td className="px-4 py-4">

                                                    <span
                                                        className={`inline-flex px-2 py-1 rounded-lg border text-[10px] font-bold ${getStatusClass(
                                                            request.status,
                                                        )}`}
                                                    >
                                                        {
                                                            request.statusName
                                                        }
                                                    </span>

                                                </td>

                                                {/* REVIEW */}
                                                <td className="px-4 py-4 max-w-[180px]">

                                                    {request.reviewReason ? (
                                                        <div>

                                                            <div className="text-slate-400 line-clamp-2">
                                                                {
                                                                    request.reviewReason
                                                                }
                                                            </div>

                                                            {request.reviewedByName && (
                                                                <div className="text-[10px] text-slate-600 mt-1">
                                                                    by{' '}
                                                                    {
                                                                        request.reviewedByName
                                                                    }
                                                                </div>
                                                            )}

                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-600">
                                                            —
                                                        </span>
                                                    )}

                                                </td>

                                                {/* ACTIONS */}
                                                <td className="px-4 py-4 text-right">

                                                    <div className="flex justify-end gap-2">

                                                        {/* SALES STAFF - CANCEL */}
                                                        {isEmployee &&
                                                            isPending && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleCancel(
                                                                            request,
                                                                        )
                                                                    }
                                                                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 text-[10px] font-semibold"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            )}

                                                        {/* HR OPS / BRANCH MANAGER */}
                                                        {canReview &&
                                                            isPending && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openReview(
                                                                                request,
                                                                                'approve',
                                                                            )
                                                                        }
                                                                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 text-[10px] font-semibold flex items-center gap-1"
                                                                    >
                                                                        <Check className="w-3 h-3" />

                                                                        Approve
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openReview(
                                                                                request,
                                                                                'reject',
                                                                            )
                                                                        }
                                                                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 text-[10px] font-semibold flex items-center gap-1"
                                                                    >
                                                                        <XCircle className="w-3 h-3" />

                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}

                                                        {/* COMPANY ADMIN */}
                                                        {isCompanyAdmin &&
                                                            isPending && (
                                                                <span className="text-[10px] text-slate-600">
                                                                    Awaiting HR /
                                                                    Branch Manager
                                                                </span>
                                                            )}

                                                    </div>

                                                </td>

                                            </tr>
                                        );
                                    },
                                )
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

            {/* ====================================================== */}
            {/* REVIEW MODAL */}
            {/* ====================================================== */}

            {reviewRequest &&
                reviewAction && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

                        <div className="w-full max-w-lg rounded-2xl bg-[#09071e] border border-[#2d2770] shadow-2xl">

                            {/* MODAL HEADER */}
                            <div className="flex items-center justify-between p-5 border-b border-[#231e54]">

                                <div>

                                    <h3 className="text-sm font-bold text-white">

                                        {reviewAction ===
                                            'approve'
                                            ? 'Approve Leave Request'
                                            : 'Reject Leave Request'}

                                    </h3>

                                    <p className="text-xs text-slate-500 mt-1">

                                        {
                                            reviewRequest.employeeName
                                        }

                                        {' • '}

                                        {
                                            reviewRequest.leaveTypeName
                                        }

                                    </p>

                                </div>

                                <button
                                    type="button"
                                    onClick={closeReview}
                                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                            </div>

                            {/* MODAL FORM */}
                            <form
                                onSubmit={handleReview}
                                className="p-5 space-y-4"
                            >

                                {/* LEAVE SUMMARY */}
                                <div className="p-3 rounded-xl bg-[#0e0b2e] border border-[#2d2770]">

                                    <div className="text-xs text-slate-400">
                                        Leave period
                                    </div>

                                    <div className="text-sm font-semibold text-white mt-1">

                                        {formatDate(
                                            reviewRequest.startDate,
                                        )}

                                        {' — '}

                                        {formatDate(
                                            reviewRequest.endDate,
                                        )}

                                    </div>

                                    <div className="text-xs text-slate-500 mt-1">

                                        {
                                            reviewRequest.requestedDays
                                        }{' '}
                                        day(s)

                                    </div>

                                </div>

                                {/* REVIEW REASON */}
                                <div>

                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">

                                        {reviewAction ===
                                            'reject'
                                            ? 'Rejection Reason *'
                                            : 'Review Note'}

                                    </label>

                                    <textarea
                                        value={reviewReason}
                                        onChange={(event) =>
                                            setReviewReason(
                                                event.target.value,
                                            )
                                        }
                                        rows={4}
                                        placeholder={
                                            reviewAction ===
                                                'reject'
                                                ? 'Explain why this leave request is being rejected...'
                                                : 'Optional approval note...'
                                        }
                                        className="w-full resize-none bg-[#0e0b2e] border border-[#2d2770] rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none"
                                        required={
                                            reviewAction ===
                                            'reject'
                                        }
                                    />

                                </div>

                                {/* MODAL ACTIONS */}
                                <div className="flex justify-end gap-2">

                                    <button
                                        type="button"
                                        onClick={closeReview}
                                        disabled={submitting}
                                        className="px-4 py-2 rounded-xl bg-[#140f3d] border border-[#2d2770] text-slate-300 text-xs font-semibold"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50 ${
                                            reviewAction ===
                                            'approve'
                                                ? 'bg-emerald-600 hover:bg-emerald-500'
                                                : 'bg-rose-600 hover:bg-rose-500'
                                        }`}
                                    >

                                        {submitting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : reviewAction ===
                                            'approve' ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <XCircle className="w-4 h-4" />
                                        )}

                                        {reviewAction ===
                                            'approve'
                                            ? 'Approve Leave'
                                            : 'Reject Leave'}

                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>
                )}

        </div>
    );
};