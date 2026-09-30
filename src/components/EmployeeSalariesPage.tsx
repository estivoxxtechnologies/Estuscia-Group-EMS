import React, {
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    Users,
    History,
    Pencil,
    X,
    RefreshCw,
    Loader2,
    CheckCircle2,
    XCircle,
    Bell,
    Eye,
} from 'lucide-react';

import { toast } from 'react-toastify';

import { useApp } from '../context/AppContext';
import { apiRequest } from '../api/client';

/* =========================================================
   TYPES
========================================================= */

interface SalaryEmployee {
    userId: number;

    employeeCode?: string | null;
    employeeName?: string | null;
    designation?: string | null;
    department?: string | null;
    branchId?: number | null;

    currentSalary: number;

    currencySymbol?: string | null;

    pendingSalary?: number | null;
    pendingHistoryId?: number | null;
    pendingStatus?: string | null;
}

interface SalaryHistoryItem {
    id: number;
    userId: number;

    previousSalary: number;
    newSalary: number;

    reason?: string | null;
    status: string;

    createdAtUtc?: string | null;
    createdByUserId?: number | null;

    approvedByUserId?: number | null;
    approvedAtUtc?: string | null;

    rejectedByUserId?: number | null;
    rejectedAtUtc?: string | null;

    rejectionReason?: string | null;
}

/* =========================================================
   PROPS
========================================================= */

interface EmployeeSalariesPageProps {
    /*
     * PayrollView is the owner of branch context.
     *
     * null = All Branches
     * number = Selected / Effective Branch
     */
    effectiveBranchId: number | null;
}

/* =========================================================
   PAGE
========================================================= */

const EmployeeSalariesPage: React.FC<
    EmployeeSalariesPageProps
> = ({
    effectiveBranchId,
}) => {
    const {
        currentUser,
    } = useApp();

    const [employees, setEmployees] =
        useState<SalaryEmployee[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [actionLoading, setActionLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    /* =======================================================
       PROPOSAL MODAL
    ======================================================= */

    const [showSalaryModal, setShowSalaryModal] =
        useState(false);

    const [selectedEmployee, setSelectedEmployee] =
        useState<SalaryEmployee | null>(null);

    const [newSalary, setNewSalary] =
        useState('');

    const [salaryReason, setSalaryReason] =
        useState('');

    const [newSalaryError, setNewSalaryError] =
        useState('');

    const [salaryReasonError, setSalaryReasonError] =
        useState('');

    /* =======================================================
       HISTORY / APPROVAL MODAL
    ======================================================= */

    const [showHistoryModal, setShowHistoryModal] =
        useState(false);

    const [historyEmployee, setHistoryEmployee] =
        useState<SalaryEmployee | null>(null);

    const [salaryHistory, setSalaryHistory] =
        useState<SalaryHistoryItem[]>([]);

    /* =======================================================
       REJECTION
    ======================================================= */

    const [showRejectReason, setShowRejectReason] =
        useState(false);

    const [rejectionReason, setRejectionReason] =
        useState('');

    const [rejectionReasonError, setRejectionReasonError] =
        useState('');

    /* =======================================================
       ROLES
    ======================================================= */

    const isPayrollManager =
        currentUser.roleName === 'hr_ops' ||
        currentUser.roleName === 'branch_manager';

    const isCompanyAdmin =
        currentUser.roleName === 'company_admin';

    const isSuperAdmin =
        currentUser.roleName === 'super_admin';

    const canEdit =
        isPayrollManager;

    const canApprove =
        isCompanyAdmin ||
        isSuperAdmin;

    /* =======================================================
       PENDING PROPOSALS
    ======================================================= */

    const pendingEmployees = useMemo(
        () =>
            employees.filter(
                employee =>
                    employee.pendingHistoryId != null &&
                    employee.pendingStatus === 'PendingApproval'
            ),
        [employees]
    );

    const pendingProposalCount =
        pendingEmployees.length;

    /* =======================================================
       LOAD EMPLOYEES
    ======================================================= */

    const loadSalaryEmployees = async () => {
        try {
            setLoading(true);
            setError(null);

            /*
             * effectiveBranchId comes from PayrollView.
             *
             * null:
             *     GET /Salary/employees
             *
             * branch selected:
             *     GET /Salary/employees?branchId=1
             */
            const query =
                effectiveBranchId !== null
                    ? `?branchId=${effectiveBranchId}`
                    : '';

            console.log(
                '[Salary] Effective branch:',
                effectiveBranchId
            );

            console.log(
                '[Salary] Request:',
                `/Salary/employees${query}`
            );

            const data =
                await apiRequest<SalaryEmployee[]>(
                    `/Salary/employees${query}`,
                    {
                        method: 'GET',
                    }
                );

            console.log(
                '[Salary] Employees:',
                data
            );

            setEmployees(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (err) {
            console.error(
                '[Salary] Failed to load employee salaries:',
                err
            );

            const message =
                err instanceof Error
                    ? err.message
                    : 'Failed to load employee salaries.';

            setError(message);
            setEmployees([]);

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    /*
     * Reload whenever PayrollView changes the effective branch.
     */
    useEffect(() => {
        if (!currentUser) {
            return;
        }

        void loadSalaryEmployees();
    }, [
        currentUser,
        effectiveBranchId,
    ]);

    /* =======================================================
       OPEN SALARY PROPOSAL MODAL
    ======================================================= */

    const handleOpenSalaryModal = (
        employee: SalaryEmployee
    ) => {
        setSelectedEmployee(employee);

        setNewSalary(
            String(employee.currentSalary ?? '')
        );

        setSalaryReason('');

        setNewSalaryError('');
        setSalaryReasonError('');

        setShowSalaryModal(true);
    };

    /* =======================================================
       CLOSE SALARY PROPOSAL
    ======================================================= */

    const handleCloseSalaryModal = () => {
        if (actionLoading) {
            return;
        }

        setShowSalaryModal(false);
        setSelectedEmployee(null);

        setNewSalary('');
        setSalaryReason('');

        setNewSalaryError('');
        setSalaryReasonError('');
    };

    /* =======================================================
       SALARY VALIDATION
    ======================================================= */

    const validateSalaryProposal = (): boolean => {
        if (!selectedEmployee) {
            return false;
        }

        let valid = true;

        const trimmedSalary =
            newSalary.trim();

        const amount =
            Number(trimmedSalary);

        /* -----------------------------------------------
           NEW SALARY
        ------------------------------------------------ */

        if (!trimmedSalary) {
            setNewSalaryError(
                'New salary is required.'
            );

            valid = false;
        } else if (
            Number.isNaN(amount) ||
            amount <= 0
        ) {
            setNewSalaryError(
                'Enter a valid proposed salary.'
            );

            valid = false;
        } else if (
            amount ===
            Number(
                selectedEmployee.currentSalary
            )
        ) {
            setNewSalaryError(
                'Proposed salary must be different from the current salary.'
            );

            valid = false;
        } else {
            setNewSalaryError('');
        }

        /* -----------------------------------------------
           REASON
        ------------------------------------------------ */

        if (!salaryReason.trim()) {
            setSalaryReasonError(
                'Reason for the salary change is required.'
            );

            valid = false;
        } else {
            setSalaryReasonError('');
        }

        /* -----------------------------------------------
           TOAST
        ------------------------------------------------ */

        if (!valid) {
            if (
                !trimmedSalary ||
                Number.isNaN(amount) ||
                amount <= 0
            ) {
                toast.warning(
                    'Please enter a valid proposed salary.'
                );
            } else if (
                amount ===
                Number(
                    selectedEmployee.currentSalary
                )
            ) {
                toast.warning(
                    'The proposed salary must be different from the current salary.'
                );
            } else if (!salaryReason.trim()) {
                toast.warning(
                    'Please enter a reason for the salary change.'
                );
            }

            return false;
        }

        return true;
    };

    /* =======================================================
       SUBMIT SALARY PROPOSAL
    ======================================================= */

    const handleSalaryProposal = async () => {
        if (!selectedEmployee) {
            toast.error(
                'No employee is selected.'
            );
            return;
        }

        if (!validateSalaryProposal()) {
            return;
        }

        const amount =
            Number(newSalary);

        try {
            setActionLoading(true);

            await apiRequest(
                '/Salary/propose',
                {
                    method: 'POST',

                    body: JSON.stringify({
                        userId:
                            selectedEmployee.userId,

                        newSalary:
                            amount,

                        reason:
                            salaryReason.trim(),
                    }),
                }
            );

            setShowSalaryModal(false);
            setSelectedEmployee(null);

            setNewSalary('');
            setSalaryReason('');

            setNewSalaryError('');
            setSalaryReasonError('');

            await loadSalaryEmployees();

            toast.success(
                'Salary proposal submitted to Company Admin for approval.'
            );
        } catch (err) {
            console.error(
                '[Salary] Proposal failed:',
                err
            );

            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to submit salary proposal.'
            );
        } finally {
            setActionLoading(false);
        }
    };

    /* =======================================================
       OPEN SALARY HISTORY
    ======================================================= */

    const handleOpenHistory = async (
        employee: SalaryEmployee
    ) => {
        try {
            setActionLoading(true);

            const response =
                await apiRequest<{
                    userId: number;
                    employeeCode?: string | null;
                    employeeName?: string | null;
                    designation?: string | null;
                    department?: string | null;
                    currentSalary: number;
                    history: SalaryHistoryItem[];
                }>(
                    `/Salary/${employee.userId}/history`,
                    {
                        method: 'GET',
                    }
                );

            setHistoryEmployee({
                ...employee,

                employeeCode:
                    response.employeeCode ??
                    employee.employeeCode,

                employeeName:
                    response.employeeName ??
                    employee.employeeName,

                designation:
                    response.designation ??
                    employee.designation,

                department:
                    response.department ??
                    employee.department,

                currentSalary:
                    Number(
                        response.currentSalary ??
                        employee.currentSalary ??
                        0
                    ),
            });

            setSalaryHistory(
                Array.isArray(response?.history)
                    ? response.history
                    : []
            );

            setShowRejectReason(false);
            setRejectionReason('');
            setRejectionReasonError('');

            setShowHistoryModal(true);
        } catch (err) {
            console.error(
                '[Salary] History load failed:',
                err
            );

            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to load salary history.'
            );
        } finally {
            setActionLoading(false);
        }
    };

    /* =======================================================
       REFRESH SALARY HISTORY
    ======================================================= */

    const refreshSalaryHistory = async () => {
        if (!historyEmployee) {
            return;
        }

        try {
            setActionLoading(true);

            const response =
                await apiRequest<{
                    userId: number;
                    employeeCode?: string | null;
                    employeeName?: string | null;
                    designation?: string | null;
                    department?: string | null;
                    currentSalary: number;
                    history: SalaryHistoryItem[];
                }>(
                    `/Salary/${historyEmployee.userId}/history`,
                    {
                        method: 'GET',
                    }
                );

            setHistoryEmployee(prev => {
                if (!prev) {
                    return prev;
                }

                return {
                    ...prev,

                    employeeCode:
                        response.employeeCode ??
                        prev.employeeCode,

                    employeeName:
                        response.employeeName ??
                        prev.employeeName,

                    designation:
                        response.designation ??
                        prev.designation,

                    department:
                        response.department ??
                        prev.department,

                    currentSalary:
                        Number(
                            response.currentSalary ??
                            prev.currentSalary ??
                            0
                        ),
                };
            });

            setSalaryHistory(
                Array.isArray(response?.history)
                    ? response.history
                    : []
            );

            toast.success(
                'Salary history refreshed.'
            );
        } catch (err) {
            console.error(
                '[Salary] History refresh failed:',
                err
            );

            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to refresh salary history.'
            );
        } finally {
            setActionLoading(false);
        }
    };

    /* =======================================================
       CLOSE HISTORY
    ======================================================= */

    const handleCloseHistory = () => {
        if (actionLoading) {
            return;
        }

        setShowHistoryModal(false);
        setHistoryEmployee(null);
        setSalaryHistory([]);

        setShowRejectReason(false);
        setRejectionReason('');
        setRejectionReasonError('');
    };

    /* =======================================================
       START REJECTION
    ======================================================= */

    const handleStartReject = () => {
        setShowRejectReason(true);
        setRejectionReason('');
        setRejectionReasonError('');
    };

    /* =======================================================
       CANCEL REJECTION
    ======================================================= */

    const handleCancelReject = () => {
        if (actionLoading) {
            return;
        }

        setShowRejectReason(false);
        setRejectionReason('');
        setRejectionReasonError('');
    };

    /* =======================================================
       REJECT
    ======================================================= */

    const handleReject = async (
        historyId: number
    ) => {
        const trimmedReason =
            rejectionReason.trim();

        if (!trimmedReason) {
            setRejectionReasonError(
                'Rejection reason is required.'
            );

            toast.warning(
                'Please enter a rejection reason.'
            );

            return;
        }

        setRejectionReasonError('');

        try {
            setActionLoading(true);

            await apiRequest(
                `/Salary/${historyId}/reject`,
                {
                    method: 'POST',

                    body: JSON.stringify({
                        reason:
                            trimmedReason,
                    }),
                }
            );

            await loadSalaryEmployees();

            setShowHistoryModal(false);
            setHistoryEmployee(null);
            setSalaryHistory([]);

            setShowRejectReason(false);
            setRejectionReason('');
            setRejectionReasonError('');

            toast.success(
                'Salary proposal rejected. Current salary was not changed.'
            );
        } catch (err) {
            console.error(
                '[Salary] Reject failed:',
                err
            );

            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to reject salary change.'
            );
        } finally {
            setActionLoading(false);
        }
    };

    /* =======================================================
       APPROVE
    ======================================================= */

    const handleApprove = async (
        historyId: number
    ) => {
        try {
            setActionLoading(true);

            await apiRequest(
                `/Salary/${historyId}/approve`,
                {
                    method: 'POST',
                }
            );

            await loadSalaryEmployees();

            setShowHistoryModal(false);
            setHistoryEmployee(null);
            setSalaryHistory([]);

            setShowRejectReason(false);
            setRejectionReason('');
            setRejectionReasonError('');

            toast.success(
                'Salary change approved. Current salary has been updated.'
            );
        } catch (err) {
            console.error(
                '[Salary] Approve failed:',
                err
            );

            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to approve salary change.'
            );
        } finally {
            setActionLoading(false);
        }
    };

    /* =======================================================
       LOADING
    ======================================================= */

    if (
        loading &&
        employees.length === 0
    ) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-7 h-7 text-[#A78BFA] animate-spin" />
            </div>
        );
    }

    /* =======================================================
       ERROR
    ======================================================= */

    if (error) {
        return (
            <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300">

                <div className="font-semibold">
                    Failed to load employee salaries
                </div>

                <div className="text-sm mt-1">
                    {error}
                </div>

                <button
                    onClick={() =>
                        void loadSalaryEmployees()
                    }
                    className="mt-4 px-4 py-2 rounded-lg bg-[#5C3FE0] text-white text-xs font-semibold"
                >
                    Retry
                </button>

            </div>
        );
    }

    return (
        <div className="space-y-4">

            {/* ===================================================
                HEADER
            =================================================== */}

            <div className="p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                    <div className="flex items-start gap-3">

                        <div className="p-2.5 rounded-xl bg-[#17123d] border border-[#2d2770]">
                            <Users className="w-5 h-5 text-[#A78BFA]" />
                        </div>

                        <div>

                            <div className="flex flex-wrap items-center gap-2">

                                <h2 className="text-sm font-bold text-white">
                                    Employee Salaries
                                </h2>

                                {canApprove &&
                                    pendingProposalCount > 0 && (

                                        <button
                                            onClick={() => {
                                                if (
                                                    pendingEmployees.length === 1
                                                ) {
                                                    void handleOpenHistory(
                                                        pendingEmployees[0]
                                                    );
                                                } else {
                                                    toast.info(
                                                        `${pendingProposalCount} salary proposals are waiting for approval.`
                                                    );
                                                }
                                            }}
                                            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition"
                                        >

                                            <Bell className="w-3.5 h-3.5" />

                                            <span className="text-[10px] font-bold">
                                                {pendingProposalCount}
                                                {' '}
                                                Pending
                                            </span>

                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />

                                        </button>

                                    )}

                            </div>

                            <p className="text-[11px] text-slate-400 mt-1">
                                Current salary is taken directly from the employee
                                record. Proposed changes stay pending until Company
                                Admin approval.
                            </p>

                            {canApprove &&
                                pendingProposalCount > 0 && (

                                    <div className="mt-3 inline-flex items-center gap-2 text-[11px] text-amber-300">

                                        <Bell className="w-3.5 h-3.5" />

                                        <span>
                                            You have{' '}
                                            <strong>
                                                {pendingProposalCount}
                                            </strong>{' '}
                                            salary proposal
                                            {pendingProposalCount !== 1
                                                ? 's'
                                                : ''}{' '}
                                            waiting for approval.
                                        </span>

                                    </div>

                                )}

                        </div>

                    </div>

                    <div className="flex items-center gap-2">

                        <button
                            onClick={() =>
                                void loadSalaryEmployees()
                            }
                            disabled={loading}
                            className="p-2 rounded-lg bg-[#17123d] border border-[#2d2770] text-slate-300 hover:text-white disabled:opacity-50"
                            title="Refresh salaries"
                        >
                            <RefreshCw
                                className={`w-4 h-4 ${loading
                                    ? 'animate-spin'
                                    : ''
                                    }`}
                            />
                        </button>

                    </div>

                </div>

            </div>

            {/* ===================================================
                TABLE
            =================================================== */}

            <div className="rounded-2xl border border-[#2d2770]/80 bg-[#09071e] overflow-hidden">

                <div className="overflow-x-auto">

                    <table className="w-full text-left text-xs">

                        <thead className="bg-[#120e38] text-slate-400">

                            <tr>

                                <th className="p-3.5">
                                    Employee
                                </th>

                                <th className="p-3.5">
                                    Current Salary
                                </th>

                                <th className="p-3.5">
                                    Designation
                                </th>

                                <th className="p-3.5">
                                    Department
                                </th>

                                <th className="p-3.5">
                                    Pending Proposal
                                </th>

                                <th className="p-3.5">
                                    Salary History
                                </th>

                                <th className="p-3.5">
                                    Action
                                </th>

                            </tr>

                        </thead>

                        <tbody className="divide-y divide-[#1c164a]/60">

                            {employees.map(
                                employee => {

                                    const hasPendingProposal =
                                        employee.pendingHistoryId != null &&
                                        employee.pendingStatus === 'PendingApproval';

                                    const currentSalary =
                                        Number(
                                            employee.currentSalary ?? 0
                                        );

                                    const proposedSalary =
                                        Number(
                                            employee.pendingSalary ?? 0
                                        );

                                    const salaryDifference =
                                        proposedSalary -
                                        currentSalary;

                                    return (
                                        <tr
                                            key={employee.userId}
                                            className={`hover:bg-[#140f3d]/60 ${hasPendingProposal
                                                ? 'bg-amber-500/[0.025]'
                                                : ''
                                                }`}
                                        >

                                            {/* EMPLOYEE */}

                                            <td className="p-3.5">

                                                <div className="font-bold text-white">
                                                    {employee.employeeName ||
                                                        '-'}
                                                </div>

                                                <div className="text-[10px] text-slate-400 font-mono">
                                                    {employee.employeeCode ||
                                                        '-'}
                                                </div>

                                            </td>

                                            {/* CURRENT SALARY */}

                                            <td className="p-3.5">

                                                <span className="font-mono text-emerald-400 font-bold">

                                                    {employee.currencySymbol ||
                                                        '₹'}

                                                    {currentSalary.toLocaleString(
                                                        'en-IN'
                                                    )}

                                                </span>

                                            </td>

                                            {/* DESIGNATION */}

                                            <td className="p-3.5 text-slate-300">
                                                {employee.designation ||
                                                    '-'}
                                            </td>

                                            {/* DEPARTMENT */}

                                            <td className="p-3.5 text-slate-300">
                                                {employee.department ||
                                                    '-'}
                                            </td>

                                            {/* PENDING PROPOSAL */}

                                            <td className="p-3.5">

                                                {hasPendingProposal ? (

                                                    <div className="space-y-2">

                                                        <div className="flex items-center gap-2">

                                                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />

                                                            <span className="text-[10px] font-bold text-amber-300">
                                                                Pending Approval
                                                            </span>

                                                        </div>

                                                        <div className="text-amber-200 font-semibold">

                                                            {employee.currencySymbol ||
                                                                '₹'}

                                                            {proposedSalary.toLocaleString(
                                                                'en-IN'
                                                            )}

                                                        </div>

                                                        <div className="text-[10px] text-slate-500">

                                                            Current:{' '}

                                                            {employee.currencySymbol ||
                                                                '₹'}

                                                            {currentSalary.toLocaleString(
                                                                'en-IN'
                                                            )}

                                                        </div>

                                                        <div
                                                            className={`text-[10px] font-semibold ${salaryDifference >=
                                                                0
                                                                ? 'text-emerald-400'
                                                                : 'text-rose-400'
                                                                }`}
                                                        >

                                                            {salaryDifference >=
                                                                0
                                                                ? '+'
                                                                : ''}

                                                            {employee.currencySymbol ||
                                                                '₹'}

                                                            {Math.abs(
                                                                salaryDifference
                                                            ).toLocaleString(
                                                                'en-IN'
                                                            )}

                                                        </div>

                                                    </div>

                                                ) : (

                                                    <span className="text-[10px] text-slate-500">
                                                        No pending proposal
                                                    </span>

                                                )}

                                            </td>

                                            {/* HISTORY */}

                                            <td className="p-3.5">

                                                <button
                                                    onClick={() =>
                                                        void handleOpenHistory(
                                                            employee
                                                        )
                                                    }
                                                    disabled={
                                                        actionLoading
                                                    }
                                                    className="px-3 py-1.5 rounded-lg bg-[#17123d] border border-[#2d2770] text-slate-300 hover:text-white text-xs flex items-center gap-1.5 disabled:opacity-50"
                                                >

                                                    <History className="w-3.5 h-3.5" />

                                                    History

                                                </button>

                                            </td>

                                            {/* ACTION */}

                                            <td className="p-3.5">

                                                {canEdit ? (

                                                    <button
                                                        onClick={() =>
                                                            handleOpenSalaryModal(
                                                                employee
                                                            )
                                                        }
                                                        disabled={
                                                            hasPendingProposal ||
                                                            actionLoading
                                                        }
                                                        className="px-3 py-1.5 rounded-lg bg-[#5C3FE0]/20 border border-[#5C3FE0]/40 text-[#A78BFA] hover:bg-[#5C3FE0]/30 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5"
                                                    >

                                                        <Pencil className="w-3.5 h-3.5" />

                                                        {hasPendingProposal
                                                            ? 'Proposal Pending'
                                                            : 'Propose Change'}

                                                    </button>

                                                ) : hasPendingProposal &&
                                                    canApprove ? (

                                                    <button
                                                        onClick={() =>
                                                            void handleOpenHistory(
                                                                employee
                                                            )
                                                        }
                                                        disabled={
                                                            actionLoading
                                                        }
                                                        className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5"
                                                    >

                                                        <Eye className="w-3.5 h-3.5" />

                                                        View Details

                                                    </button>

                                                ) : (

                                                    <span className="text-[10px] text-slate-500">
                                                        View only
                                                    </span>

                                                )}

                                            </td>

                                        </tr>
                                    );
                                }
                            )}

                        </tbody>

                    </table>

                    {employees.length === 0 && (

                        <div className="p-12 text-center text-sm text-slate-500">
                            No employees found.
                        </div>

                    )}

                </div>

            </div>

            {/* ===================================================
                SALARY PROPOSAL MODAL
            =================================================== */}

            {showSalaryModal &&
                selectedEmployee && (

                    <SalaryProposalModal
                        employee={selectedEmployee}
                        newSalary={newSalary}
                        reason={salaryReason}
                        newSalaryError={newSalaryError}
                        reasonError={salaryReasonError}
                        loading={actionLoading}

                        onSalaryChange={value => {
                            setNewSalary(value);

                            if (newSalaryError) {
                                setNewSalaryError('');
                            }
                        }}

                        onReasonChange={value => {
                            setSalaryReason(value);

                            if (salaryReasonError) {
                                setSalaryReasonError('');
                            }
                        }}

                        onClose={
                            handleCloseSalaryModal
                        }

                        onSave={
                            handleSalaryProposal
                        }
                    />

                )}

            {/* ===================================================
                HISTORY / APPROVAL MODAL
            =================================================== */}

            {showHistoryModal &&
                historyEmployee && (

                    <SalaryHistoryModal
                        employee={historyEmployee}
                        history={salaryHistory}
                        loading={actionLoading}
                        canApprove={canApprove}

                        showRejectReason={
                            showRejectReason
                        }

                        rejectionReason={
                            rejectionReason
                        }

                        rejectionReasonError={
                            rejectionReasonError
                        }

                        onApprove={
                            handleApprove
                        }

                        onReject={
                            handleReject
                        }

                        onStartReject={
                            handleStartReject
                        }

                        onCancelReject={
                            handleCancelReject
                        }

                        onRejectReasonChange={
                            value => {
                                setRejectionReason(
                                    value
                                );

                                if (
                                    rejectionReasonError &&
                                    value.trim()
                                ) {
                                    setRejectionReasonError(
                                        ''
                                    );
                                }
                            }
                        }

                        onRefresh={
                            refreshSalaryHistory
                        }

                        onClose={
                            handleCloseHistory
                        }
                    />

                )}

        </div>
    );
};

/* =========================================================
   SALARY PROPOSAL MODAL
========================================================= */

const SalaryProposalModal: React.FC<{
    employee: SalaryEmployee;

    newSalary: string;
    reason: string;

    newSalaryError: string;
    reasonError: string;

    loading: boolean;

    onSalaryChange: (
        value: string
    ) => void;

    onReasonChange: (
        value: string
    ) => void;

    onClose: () => void;
    onSave: () => void;
}> = ({
    employee,
    newSalary,
    reason,
    newSalaryError,
    reasonError,
    loading,
    onSalaryChange,
    onReasonChange,
    onClose,
    onSave,
}) => (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">

            <div className="w-full max-w-lg rounded-2xl bg-[#0b0824] border border-[#2d2770] shadow-2xl">

                {/* HEADER */}

                <div className="p-5 border-b border-[#231e54] flex items-center justify-between">

                    <div>

                        <h2 className="text-white font-bold">
                            Propose Salary Change
                        </h2>

                        <p className="text-[11px] text-slate-400 mt-1">
                            {employee.employeeName}
                            {' • '}
                            {employee.employeeCode}
                        </p>

                    </div>

                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-50"
                    >
                        <X className="w-4 h-4" />
                    </button>

                </div>

                {/* BODY */}

                <div className="p-5 space-y-5">

                    <div className="grid grid-cols-2 gap-3">

                        {/* CURRENT */}

                        <div className="p-4 rounded-xl bg-[#120e38] border border-[#231e54]">

                            <div className="text-[10px] text-slate-500 uppercase">
                                Current Salary
                            </div>

                            <div className="mt-1 text-lg font-bold text-white">

                                {employee.currencySymbol ||
                                    '₹'}

                                {Number(
                                    employee.currentSalary ?? 0
                                ).toLocaleString('en-IN')}

                            </div>

                        </div>

                        {/* PROPOSED */}

                        <div className="p-4 rounded-xl bg-[#120e38] border border-[#231e54]">

                            <div className="text-[10px] text-slate-500 uppercase">
                                Proposed Salary
                            </div>

                            <div className="mt-1 text-lg font-bold text-[#A78BFA]">

                                {employee.currencySymbol ||
                                    '₹'}

                                {Number(
                                    newSalary || 0
                                ).toLocaleString('en-IN')}

                            </div>

                        </div>

                    </div>

                    {/* NEW SALARY */}

                    <div>

                        <label className="text-xs font-semibold text-slate-300 block mb-2">
                            New Salary
                            <span className="text-rose-400 ml-1">
                                *
                            </span>
                        </label>

                        <div className="relative">

                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                                {employee.currencySymbol ||
                                    '₹'}
                            </span>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={newSalary}
                                onChange={e =>
                                    onSalaryChange(
                                        e.target.value
                                    )
                                }
                                disabled={loading}
                                className={`w-full pl-8 pr-3 py-3 rounded-xl bg-[#09071e] border ${newSalaryError
                                    ? 'border-rose-500'
                                    : 'border-[#2d2770]'
                                    } text-white outline-none focus:border-[#5C3FE0] disabled:opacity-50`}
                            />

                        </div>

                        {newSalaryError && (
                            <p className="mt-1.5 text-[11px] text-rose-400">
                                {newSalaryError}
                            </p>
                        )}

                    </div>

                    {/* REASON */}

                    <div>

                        <label className="text-xs font-semibold text-slate-300 block mb-2">
                            Reason
                            <span className="text-rose-400 ml-1">
                                *
                            </span>
                        </label>

                        <textarea
                            value={reason}
                            onChange={e =>
                                onReasonChange(
                                    e.target.value
                                )
                            }
                            disabled={loading}
                            rows={4}
                            placeholder="Enter reason for salary change..."
                            className={`w-full px-3 py-3 rounded-xl bg-[#09071e] border ${reasonError
                                ? 'border-rose-500'
                                : 'border-[#2d2770]'
                                } text-white placeholder:text-slate-600 outline-none focus:border-[#5C3FE0] resize-none disabled:opacity-50`}
                        />

                        {reasonError && (
                            <p className="mt-1.5 text-[11px] text-rose-400">
                                {reasonError}
                            </p>
                        )}

                    </div>

                    {/* APPROVAL INFO */}

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">

                        <div className="text-xs text-amber-300 font-semibold">
                            Approval Required
                        </div>

                        <div className="text-[10px] text-amber-200/70 mt-1">
                            The current salary will not change immediately.
                            The proposal must be approved by Company Admin
                            first.
                        </div>

                    </div>

                </div>

                {/* FOOTER */}

                <div className="p-5 border-t border-[#231e54] flex justify-end gap-2">

                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-[#17123d] border border-[#2d2770] text-slate-300 text-xs font-semibold disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onSave}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-[#5C3FE0] hover:bg-[#7152FF] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2"
                    >

                        {loading && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        )}

                        Submit Salary Proposal

                    </button>

                </div>

            </div>

        </div>
    );

/* =========================================================
   SALARY HISTORY / APPROVAL DETAILS MODAL
========================================================= */

const SalaryHistoryModal: React.FC<{
    employee: SalaryEmployee;
    history: SalaryHistoryItem[];

    loading: boolean;
    canApprove: boolean;

    showRejectReason: boolean;

    rejectionReason: string;
    rejectionReasonError: string;

    onApprove: (
        id: number
    ) => void;

    onReject: (
        id: number
    ) => void;

    onStartReject: () => void;

    onCancelReject: () => void;

    onRejectReasonChange: (
        value: string
    ) => void;

    onRefresh: () => void;

    onClose: () => void;
}> = ({
    employee,
    history,
    loading,
    canApprove,

    showRejectReason,

    rejectionReason,
    rejectionReasonError,

    onApprove,
    onReject,

    onStartReject,
    onCancelReject,

    onRejectReasonChange,

    onRefresh,
    onClose,
}) => {

        /*
         * Find pending proposal from history.
         */
        const pendingProposal =
            history.find(
                item =>
                    item.status ===
                    'PendingApproval'
            );

        const currentSalary =
            Number(
                employee.currentSalary ?? 0
            );

        const proposedSalary =
            Number(
                pendingProposal?.newSalary ??
                employee.pendingSalary ??
                0
            );

        const salaryDifference =
            proposedSalary -
            currentSalary;

        const hasPendingProposal =
            !!pendingProposal;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">

                <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-[#0b0824] border border-[#2d2770] shadow-2xl">

                    {/* HEADER */}

                    <div className="p-5 border-b border-[#231e54] flex items-center justify-between">

                        <div className="flex items-center gap-3">

                            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">

                                <History className="w-5 h-5 text-violet-300" />

                            </div>

                            <div>

                                <h2 className="text-white font-bold">
                                    {hasPendingProposal
                                        ? 'Salary Change Request'
                                        : 'Salary History'}
                                </h2>

                                <p className="text-[11px] text-slate-400 mt-1">
                                    {employee.employeeName}
                                    {' • '}
                                    {employee.employeeCode}
                                </p>

                            </div>

                        </div>

                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-50"
                        >
                            <X className="w-4 h-4" />
                        </button>

                    </div>

                    {/* BODY */}

                    <div className="p-5 overflow-y-auto max-h-[75vh]">

                        {/* =================================================
                        PENDING PROPOSAL
                    ================================================= */}

                        {hasPendingProposal ? (

                            <div className="space-y-5">

                                {/* PENDING HEADER */}

                                <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">

                                    <div className="flex items-center gap-3">

                                        <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center">

                                            <Bell className="w-4 h-4 text-amber-300" />

                                        </div>

                                        <div>

                                            <div className="text-sm font-bold text-amber-200">
                                                Pending Company Admin Approval
                                            </div>

                                            <div className="text-[10px] text-amber-200/60 mt-0.5">
                                                Review the proposed salary change
                                                before approving or rejecting it.
                                            </div>

                                        </div>

                                    </div>

                                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-300">
                                        Pending Approval
                                    </span>

                                </div>

                                {/* SALARY COMPARISON */}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                                    {/* CURRENT */}

                                    <div className="p-4 rounded-xl bg-[#120e38] border border-[#231e54]">

                                        <div className="text-[10px] text-slate-500 uppercase font-semibold">
                                            Current Salary
                                        </div>

                                        <div className="mt-2 text-2xl font-bold text-white">

                                            {employee.currencySymbol ||
                                                '₹'}

                                            {currentSalary.toLocaleString(
                                                'en-IN'
                                            )}

                                        </div>

                                    </div>

                                    {/* PROPOSED */}

                                    <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">

                                        <div className="text-[10px] text-violet-300 uppercase font-semibold">
                                            Proposed Salary
                                        </div>

                                        <div className="mt-2 text-2xl font-bold text-violet-200">

                                            {employee.currencySymbol ||
                                                '₹'}

                                            {proposedSalary.toLocaleString(
                                                'en-IN'
                                            )}

                                        </div>

                                    </div>

                                    {/* DIFFERENCE */}

                                    <div
                                        className={`p-4 rounded-xl border ${salaryDifference >= 0
                                            ? 'bg-emerald-500/5 border-emerald-500/20'
                                            : 'bg-rose-500/5 border-rose-500/20'
                                            }`}
                                    >

                                        <div
                                            className={`text-[10px] uppercase font-semibold ${salaryDifference >= 0
                                                ? 'text-emerald-300'
                                                : 'text-rose-300'
                                                }`}
                                        >
                                            Salary Change
                                        </div>

                                        <div
                                            className={`mt-2 text-2xl font-bold ${salaryDifference >= 0
                                                ? 'text-emerald-300'
                                                : 'text-rose-300'
                                                }`}
                                        >

                                            {salaryDifference >= 0
                                                ? '+'
                                                : '-'}

                                            {employee.currencySymbol ||
                                                '₹'}

                                            {Math.abs(
                                                salaryDifference
                                            ).toLocaleString(
                                                'en-IN'
                                            )}

                                        </div>

                                    </div>

                                </div>

                                {/* CHANGE PERCENTAGE */}

                                {currentSalary > 0 && (

                                    <div className="text-center text-[11px] text-slate-500">

                                        Salary change:{' '}

                                        <span
                                            className={
                                                salaryDifference >= 0
                                                    ? 'text-emerald-400 font-semibold'
                                                    : 'text-rose-400 font-semibold'
                                            }
                                        >
                                            {(
                                                (
                                                    salaryDifference /
                                                    currentSalary
                                                ) *
                                                100
                                            ).toFixed(2)}
                                            %
                                        </span>

                                    </div>

                                )}

                                {/* REASON */}

                                <div className="p-4 rounded-xl bg-[#120e38] border border-[#231e54]">

                                    <div className="text-[10px] text-slate-500 uppercase font-semibold">
                                        Reason for Salary Change
                                    </div>

                                    <div className="mt-2 text-sm leading-6 text-slate-200 whitespace-pre-wrap">
                                        {pendingProposal?.reason ||
                                            'No reason provided.'}
                                    </div>

                                </div>

                                {/* REQUEST DETAILS */}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <div className="p-4 rounded-xl bg-[#120e38] border border-[#231e54]">

                                        <div className="text-[10px] text-slate-500 uppercase font-semibold">
                                            Requested On
                                        </div>

                                        <div className="mt-2 text-sm text-slate-200">

                                            {pendingProposal?.createdAtUtc
                                                ? new Date(
                                                    pendingProposal.createdAtUtc
                                                ).toLocaleString()
                                                : '-'}

                                        </div>

                                    </div>

                                    <div className="p-4 rounded-xl bg-[#120e38] border border-[#231e54]">

                                        <div className="text-[10px] text-slate-500 uppercase font-semibold">
                                            Requested By
                                        </div>

                                        <div className="mt-2 text-sm text-slate-200">

                                            {pendingProposal?.createdByUserId
                                                ? `User #${pendingProposal.createdByUserId}`
                                                : '-'}

                                        </div>

                                    </div>

                                </div>

                                {/* =================================================
                                APPROVAL ACTIONS
                            ================================================= */}

                                {canApprove &&
                                    pendingProposal && (

                                        <div className="p-4 rounded-xl bg-[#120e38] border border-[#2d2770]">

                                            <div className="mb-4">

                                                <div className="text-sm font-bold text-white">
                                                    Company Admin Decision
                                                </div>

                                                <div className="text-[10px] text-slate-500 mt-1">
                                                    Approving will update the employee's
                                                    current salary. Rejecting will leave
                                                    the current salary unchanged.
                                                </div>

                                            </div>

                                            {!showRejectReason ? (

                                                <div className="flex flex-col sm:flex-row justify-end gap-2">

                                                    <button
                                                        onClick={
                                                            onStartReject
                                                        }
                                                        disabled={
                                                            loading
                                                        }
                                                        className="px-4 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 disabled:opacity-50 text-xs font-bold flex items-center justify-center gap-2"
                                                    >

                                                        <XCircle className="w-3.5 h-3.5" />

                                                        Reject Proposal

                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            onApprove(
                                                                pendingProposal.id
                                                            )
                                                        }
                                                        disabled={
                                                            loading
                                                        }
                                                        className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2"
                                                    >

                                                        {loading ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                        )}

                                                        Approve Salary Change

                                                    </button>

                                                </div>

                                            ) : (

                                                <div className="space-y-4">

                                                    <div>

                                                        <label className="text-xs font-semibold text-slate-300 block mb-2">

                                                            Rejection Reason

                                                            <span className="text-rose-400 ml-1">
                                                                *
                                                            </span>

                                                        </label>

                                                        <textarea
                                                            value={
                                                                rejectionReason
                                                            }
                                                            onChange={e =>
                                                                onRejectReasonChange(
                                                                    e.target.value
                                                                )
                                                            }
                                                            disabled={
                                                                loading
                                                            }
                                                            rows={4}
                                                            placeholder="Enter the reason for rejecting this salary proposal..."
                                                            className={`w-full px-3 py-3 rounded-xl bg-[#09071e] border ${rejectionReasonError
                                                                ? 'border-rose-500'
                                                                : 'border-[#2d2770]'
                                                                } text-white placeholder:text-slate-600 outline-none focus:border-[#5C3FE0] resize-none disabled:opacity-50`}
                                                        />

                                                        {rejectionReasonError && (
                                                            <p className="mt-1.5 text-[11px] text-rose-400">
                                                                {
                                                                    rejectionReasonError
                                                                }
                                                            </p>
                                                        )}

                                                    </div>

                                                    <div className="flex flex-col sm:flex-row justify-end gap-2">

                                                        <button
                                                            onClick={
                                                                onCancelReject
                                                            }
                                                            disabled={
                                                                loading
                                                            }
                                                            className="px-4 py-2.5 rounded-lg bg-[#17123d] border border-[#2d2770] text-slate-300 hover:text-white disabled:opacity-50 text-xs font-semibold"
                                                        >
                                                            Cancel
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                onReject(
                                                                    pendingProposal.id
                                                                )
                                                            }
                                                            disabled={
                                                                loading
                                                            }
                                                            className="px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2"
                                                        >

                                                            {loading ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <XCircle className="w-3.5 h-3.5" />
                                                            )}

                                                            Confirm Rejection

                                                        </button>

                                                    </div>

                                                </div>

                                            )}

                                        </div>

                                    )}

                            </div>

                        ) : (

                            /* =================================================
                               SALARY HISTORY
                            ================================================= */

                            <div className="space-y-3">

                                <div className="flex items-center justify-between">

                                    <div>

                                        <h3 className="text-sm font-bold text-white">
                                            Salary History
                                        </h3>

                                        <p className="text-[10px] text-slate-500 mt-1">
                                            Previous approved and rejected salary changes.
                                        </p>

                                    </div>

                                    <History className="w-4 h-4 text-slate-500" />

                                </div>

                                {history.length === 0 ? (

                                    <div className="p-10 text-center text-sm text-slate-500">
                                        No salary history found.
                                    </div>

                                ) : (

                                    <div className="space-y-3">

                                        {history.map(item => (

                                            <div
                                                key={item.id}
                                                className="p-4 rounded-xl bg-[#120e38] border border-[#231e54]"
                                            >

                                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">

                                                    <div>

                                                        <div className="text-[10px] text-slate-500 uppercase">
                                                            Salary Change
                                                        </div>

                                                        <div className="mt-1 text-sm font-bold text-white">

                                                            {employee.currencySymbol ||
                                                                '₹'}

                                                            {Number(
                                                                item.previousSalary ??
                                                                0
                                                            ).toLocaleString(
                                                                'en-IN'
                                                            )}

                                                            <span className="text-slate-500 mx-2">
                                                                →
                                                            </span>

                                                            <span className="text-emerald-400">

                                                                {employee.currencySymbol ||
                                                                    '₹'}

                                                                {Number(
                                                                    item.newSalary ??
                                                                    0
                                                                ).toLocaleString(
                                                                    'en-IN'
                                                                )}

                                                            </span>

                                                        </div>

                                                    </div>

                                                    <StatusBadge
                                                        status={
                                                            item.status
                                                        }
                                                    />

                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-[11px]">

                                                    <div>

                                                        <span className="text-slate-500 block">
                                                            Reason
                                                        </span>

                                                        <span className="text-slate-300">
                                                            {item.reason ||
                                                                '-'}
                                                        </span>

                                                    </div>

                                                    <div>

                                                        <span className="text-slate-500 block">
                                                            Created
                                                        </span>

                                                        <span className="text-slate-300">

                                                            {item.createdAtUtc
                                                                ? new Date(
                                                                    item.createdAtUtc
                                                                ).toLocaleString()
                                                                : '-'}

                                                        </span>

                                                    </div>

                                                    <div>

                                                        <span className="text-slate-500 block">
                                                            Decision
                                                        </span>

                                                        <span className="text-slate-300">

                                                            {item.approvedAtUtc
                                                                ? `Approved: ${new Date(
                                                                    item.approvedAtUtc
                                                                ).toLocaleString()}`
                                                                : item.rejectedAtUtc
                                                                    ? `Rejected: ${new Date(
                                                                        item.rejectedAtUtc
                                                                    ).toLocaleString()}`
                                                                    : 'Pending'}

                                                        </span>

                                                    </div>

                                                </div>

                                                {item.rejectionReason && (

                                                    <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">

                                                        <span className="font-semibold">
                                                            Rejection reason:
                                                        </span>{' '}

                                                        {item.rejectionReason}

                                                    </div>

                                                )}

                                            </div>

                                        ))}

                                    </div>

                                )}

                            </div>

                        )}

                    </div>

                    {/* FOOTER */}

                    <div className="p-5 border-t border-[#231e54] flex justify-between">

                        <button
                            onClick={() =>
                                void onRefresh()
                            }
                            disabled={loading}
                            className="px-4 py-2 rounded-lg bg-[#17123d] border border-[#2d2770] text-slate-300 hover:text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-2"
                        >

                            {loading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                            )}

                            Refresh

                        </button>

                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 rounded-lg bg-[#17123d] border border-[#2d2770] text-slate-300 hover:text-white text-xs font-semibold disabled:opacity-50"
                        >
                            Close
                        </button>

                    </div>

                </div>

            </div>
        );
    };

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge: React.FC<{
    status: string;
}> = ({
    status,
}) => {

        const styles: Record<string, string> = {

            PendingApproval:
                'bg-amber-500/10 text-amber-300 border-amber-500/30',

            Approved:
                'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',

            Rejected:
                'bg-rose-500/10 text-rose-300 border-rose-500/30',

        };

        return (
            <span
                className={`px-2 py-1 rounded text-[10px] font-bold border ${styles[status] ||
                    'bg-slate-500/10 text-slate-300 border-slate-500/30'
                    }`}
            >
                {status}
            </span>
        );
    };

export default EmployeeSalariesPage;