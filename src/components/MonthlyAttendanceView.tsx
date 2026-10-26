
import React, { useCallback, useEffect, useState } from 'react';
import {
    CalendarCheck,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Filter,
    Eye,
    X,
    LockKeyhole,
    Send,
    CheckCircle,
    RotateCcw,
    Users,
    ClipboardCheck,
    Clock,
    FileText,
    FileSpreadsheet,
} from 'lucide-react';

import {
    getMonthlyAttendanceReports,
    getMonthlyAttendanceReport,
    generateMonthlyAttendanceReport,
    submitMonthlyAttendanceReport,
    approveMonthlyAttendanceReport,
    returnMonthlyAttendanceReport,
    type MonthlyAttendanceReport,
    type MonthlyAttendanceReportDetails,
    type MonthlyAttendanceEmployee,
} from '../api/monthlyAttendance';

import {
    exportMonthlyAttendanceReport,
    exportMonthlyAttendanceReportList,
} from '../services/monthlyAttendanceExcelService';

interface BranchOption {
    id: number;
    name: string;
}

interface Props {
    branches: BranchOption[];
    canGenerate: boolean;
    canSubmit: boolean;
    canApprove: boolean;
}

const months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
];

const statusLabels: Record<number, string> = {
    1: 'Draft',
    2: 'Awaiting Approval',
    3: 'Approved - Locked',
    4: 'Returned',
};

function getStatusNumber(status: number | string): number {
    if (typeof status === 'number') return status;

    const numeric = Number(status);

    if (!Number.isNaN(numeric) && status.trim() !== '') {
        return numeric;
    }

    switch (status.toLowerCase()) {
        case 'draft':
            return 1;
        case 'submitted':
        case 'awaiting approval':
            return 2;
        case 'approved':
        case 'approved · locked':
        case 'approved - locked':
            return 3;
        case 'returned':
            return 4;
        default:
            return 0;
    }
}

function getStatusLabel(status: number | string): string {
    return statusLabels[getStatusNumber(status)] || String(status);
}

function getStatusClasses(status: number | string): string {
    switch (getStatusNumber(status)) {
        case 1:
            return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
        case 2:
            return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
        case 3:
            return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
        case 4:
            return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
        default:
            return 'bg-slate-700 text-slate-300 border-slate-600';
    }
}

function formatHours(value?: number | null): string {
    return Number(value ?? 0).toFixed(2);
}

function numeric(value: number | null | undefined): number {
    const result = Number(value ?? 0);
    return Number.isFinite(result) ? result : 0;
}

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

const panelClass =
    'rounded-2xl bg-[#09071e] border border-[#2d2770]/80';

const buttonClass =
    'px-3 py-2 rounded-xl bg-[#140f3d] hover:bg-[#1f175a] border border-[#2d2770] text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

const primaryButtonClass =
    'px-4 py-2.5 rounded-xl bg-[#5C3FE0] hover:bg-[#684bea] border border-[#6b50e8] text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

const dangerButtonClass =
    'px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

const inputClass =
    'w-full min-w-0 px-3 py-2.5 rounded-xl bg-[#09071e] border border-[#2d2770] text-xs text-white outline-none focus:border-[#5C3FE0] [color-scheme:dark] transition-colors';

const tableHeaderClass =
    'px-4 py-3.5 text-left text-[10px] uppercase tracking-wider font-bold text-slate-400 whitespace-nowrap bg-[#120e38] border-b border-[#231e54]';

const tableCellClass =
    'px-4 py-3.5 text-xs text-slate-300 border-b border-[#1c164a]/60 align-middle';

export default function MonthlyAttendanceView({
    branches,
    canGenerate,
    canSubmit,
    canApprove,
}: Props) {
    const now = new Date();

    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [branchId, setBranchId] = useState('');
    const [status, setStatus] = useState('');

    const [reports, setReports] = useState<MonthlyAttendanceReport[]>([]);
    const [selected, setSelected] =
        useState<MonthlyAttendanceReportDetails | null>(null);

    const [returnReason, setReturnReason] = useState('');
    const [showReturnForm, setShowReturnForm] = useState(false);
    const [showReturnReasonModal, setShowReturnReasonModal] = useState(false);

    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const loadReports = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const data = await getMonthlyAttendanceReports({
                year,
                month,
                branchId: branchId ? Number(branchId) : undefined,
                status: status ? Number(status) : undefined,
            });

            setReports(data);
        } catch (err) {
            setError(
                getErrorMessage(err, 'Unable to load monthly attendance reports.'),
            );
        } finally {
            setLoading(false);
        }
    }, [year, month, branchId, status]);

    useEffect(() => {
        void loadReports();
    }, [loadReports]);

    async function openReport(id: number) {
        setError('');
        setNotice('');
        setShowReturnForm(false);
        setShowReturnReasonModal(false);
        setReturnReason('');

        try {
            const details = await getMonthlyAttendanceReport(id);
            setSelected(details);
        } catch (err) {
            setError(getErrorMessage(err, 'Unable to load report details.'));
        }
    }

    async function runAction(
        action: () => Promise<unknown>,
        successMessage: string,
    ) {
        if (!selected) return;

        const reportId = selected.id;

        setActionLoading(true);
        setError('');
        setNotice('');

        try {
            await action();

            const [details, list] = await Promise.all([
                getMonthlyAttendanceReport(reportId),
                getMonthlyAttendanceReports({
                    year,
                    month,
                    branchId: branchId ? Number(branchId) : undefined,
                    status: status ? Number(status) : undefined,
                }),
            ]);

            setSelected(details);
            setReports(list);
            setNotice(successMessage);
            setShowReturnForm(false);
            setReturnReason('');
        } catch (err) {
            setError(
                getErrorMessage(
                    err,
                    'The action failed or the updated report could not be loaded.',
                ),
            );

            try {
                const list = await getMonthlyAttendanceReports({
                    year,
                    month,
                    branchId: branchId ? Number(branchId) : undefined,
                    status: status ? Number(status) : undefined,
                });

                setReports(list);
            } catch {
                // Keep the original error visible.
            }
        } finally {
            setActionLoading(false);
        }
    }

    async function generateReport() {
        if (!branchId) {
            setError('Select a branch before generating the report.');
            return;
        }

        if (month < 1 || month > 12 || year < 2000 || year > 2100) {
            setError('Enter a valid reporting month and year.');
            return;
        }

        setActionLoading(true);
        setError('');
        setNotice('');

        try {
            await generateMonthlyAttendanceReport({
                branchId: Number(branchId),
                year,
                month,
            });

            setSelected(null);
            setNotice('Monthly attendance report generated or recalculated.');
            await loadReports();
        } catch (err) {
            setError(getErrorMessage(err, 'Report generation failed.'));
        } finally {
            setActionLoading(false);
        }
    }

    async function confirmReturn() {
        if (!selected) return;

        const reason = returnReason.trim();

        if (reason.length < 5) {
            setError('Enter a return reason of at least 5 characters.');
            return;
        }

        await runAction(
            () => returnMonthlyAttendanceReport(selected.id, { reason }),
            'Report returned to HR Ops with the reason recorded.',
        );
    }

    function exportSelectedReport() {
        if (!selected) {
            setError('Open an attendance report before exporting.');
            return;
        }

        try {
            setError('');
            setNotice('');
            exportMonthlyAttendanceReport(selected);
            setNotice('Attendance report exported successfully.');
        } catch (err) {
            setError(
                getErrorMessage(err, 'Unable to download the Excel report.'),
            );
        }
    }

    function exportReportList() {
        if (reports.length === 0) {
            setError('There are no reports to export for the current filters.');
            return;
        }

        try {
            setError('');
            setNotice('');
            exportMonthlyAttendanceReportList(reports, year, month);
            setNotice(`${reports.length} attendance report(s) exported successfully.`);
        } catch (err) {
            setError(
                getErrorMessage(err, 'Unable to download the Excel report list.'),
            );
        }
    }

    const employees: MonthlyAttendanceEmployee[] = selected?.employees ?? [];

    const selectedStatus = selected ? getStatusNumber(selected.status) : 0;
    const isDraftOrReturned =
        selectedStatus === 1 || selectedStatus === 4;

    const employeesNeedingReview = employees.filter(
        (employee) => employee.needsHrReview,
    );

    const totalReports = reports.length;

    const submittedCount = reports.filter(
        (report) => getStatusNumber(report.status) === 2,
    ).length;

    const approvedCount = reports.filter(
        (report) => getStatusNumber(report.status) === 3,
    ).length;

    const reviewCount = reports.reduce(
        (total, report) => total + numeric(report.employeesNeedingReview),
        0,
    );

    return (
        <div className="space-y-5 min-w-0">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#A78BFA]">
                        HR MANAGEMENT
                    </p>
                    <h2 className="text-base font-bold text-white mt-1">
                        Monthly Attendance
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Generate, review, submit, and approve monthly employee attendance.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        disabled={loading || reports.length === 0}
                        onClick={exportReportList}
                        className={buttonClass}
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Export Report List
                    </button>

                    {canGenerate && (
                        <button
                            type="button"
                            disabled={actionLoading || !branchId}
                            onClick={() => void generateReport()}
                            className={primaryButtonClass}
                        >
                            {actionLoading
                                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                : <CalendarCheck className="w-3.5 h-3.5" />}
                            {actionLoading ? 'Processing…' : 'Generate Report'}
                        </button>
                    )}
                </div>
            </div>

            {/* MESSAGES */}
            {error && (
                <div
                    role="alert"
                    className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs"
                >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="flex-1">{error}</span>
                    <button
                        type="button"
                        onClick={() => setError('')}
                        className="text-rose-200 font-bold"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {notice && (
                <div
                    role="status"
                    className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs"
                >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{notice}</span>
                    <button
                        type="button"
                        onClick={() => setNotice('')}
                        className="text-emerald-200 font-bold"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className={`${panelClass} p-5`}>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                            Total Reports
                        </span>
                        <FileText className="w-4 h-4 text-[#A78BFA]" />
                    </div>
                    <div className="mt-3 text-2xl font-bold text-white tabular-nums">
                        {totalReports}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">
                        Reports matching current filters
                    </p>
                </div>

                <div className={`${panelClass} p-5`}>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                            Awaiting Approval
                        </span>
                        <Clock className="w-4 h-4 text-sky-400" />
                    </div>
                    <div className="mt-3 text-2xl font-bold text-sky-300 tabular-nums">
                        {submittedCount}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">
                        Submitted reports
                    </p>
                </div>

                <div className={`${panelClass} p-5`}>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                            Approved
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="mt-3 text-2xl font-bold text-emerald-300 tabular-nums">
                        {approvedCount}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">
                        Finalized reports
                    </p>
                </div>

                <div className={`${panelClass} p-5`}>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                            Review Flags
                        </span>
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="mt-3 text-2xl font-bold text-amber-300 tabular-nums">
                        {reviewCount}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">
                        Employees requiring review
                    </p>
                </div>
            </div>

            {/* REPORTS + FILTERS */}
            <section className={`${panelClass} overflow-hidden`}>
                <div className="p-4 sm:p-5 border-b border-[#231e54]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <ClipboardCheck className="w-4 h-4 text-[#A78BFA]" />
                                <h3 className="text-sm font-bold text-white">
                                    Attendance Reports
                                </h3>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">
                                Filter reports by month, branch, and status.
                            </p>
                        </div>

                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => void loadReports()}
                            className={buttonClass}
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>

                    <div className="mt-4 p-3 sm:p-4 rounded-xl bg-[#0e0b2e] border border-[#2d2770]/70">
                        <div className="flex items-center gap-2 mb-3">
                            <Filter className="w-3.5 h-3.5 text-[#A78BFA]" />
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                                Filter Reports
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                            <label className="block min-w-0">
                                <span className="block text-[10px] text-slate-500 mb-1.5">
                                    Reporting Year
                                </span>
                                <input
                                    type="number"
                                    min={2000}
                                    max={2100}
                                    value={year || ''}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setYear(value === '' ? 0 : Number(value));
                                    }}
                                    className={inputClass}
                                />
                            </label>

                            <label className="block min-w-0">
                                <span className="block text-[10px] text-slate-500 mb-1.5">
                                    Reporting Month
                                </span>
                                <select
                                    value={month}
                                    onChange={(event) => setMonth(Number(event.target.value))}
                                    className={inputClass}
                                >
                                    {months.map((name, index) => (
                                        <option key={name} value={index + 1}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block min-w-0">
                                <span className="block text-[10px] text-slate-500 mb-1.5">
                                    Branch
                                </span>
                                <select
                                    value={branchId}
                                    onChange={(event) => setBranchId(event.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">All permitted branches</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block min-w-0">
                                <span className="block text-[10px] text-slate-500 mb-1.5">
                                    Approval Status
                                </span>
                                <select
                                    value={status}
                                    onChange={(event) => setStatus(event.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">All statuses</option>
                                    <option value="1">Draft</option>
                                    <option value="2">Awaiting Approval</option>
                                    <option value="3">Approved - Locked</option>
                                    <option value="4">Returned</option>
                                </select>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-xs">
                        <thead>
                            <tr>
                                <th className={tableHeaderClass}>Reporting Month</th>
                                <th className={tableHeaderClass}>Branch</th>
                                <th className={tableHeaderClass}>Employees</th>
                                <th className={tableHeaderClass}>Review Flags</th>
                                <th className={tableHeaderClass}>Status</th>
                                <th className={tableHeaderClass}>Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#1c164a]/60">
                            {loading && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-xs text-slate-500">
                                        <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-[#A78BFA]" />
                                        Loading attendance reports...
                                    </td>
                                </tr>
                            )}

                            {!loading && reports.map((report) => {
                                const needsReview = numeric(report.employeesNeedingReview);
                                const reportStatus = getStatusNumber(report.status);

                                return (
                                    <tr
                                        key={report.id}
                                        className="hover:bg-[#140f3d]/60 transition-colors"
                                    >
                                        <td className={tableCellClass}>
                                            <span className="block font-semibold text-white">
                                                {months[report.month - 1] ?? 'Unknown'} {report.year}
                                            </span>
                                            <span className="block text-[10px] text-slate-500 mt-1">
                                                Report #{report.id}
                                            </span>
                                        </td>

                                        <td className={tableCellClass}>
                                            {report.branchName || `Branch ${report.branchId}`}
                                        </td>

                                        <td className={tableCellClass}>
                                            <span className="inline-flex items-center gap-2">
                                                <Users className="w-3.5 h-3.5 text-slate-500" />
                                                {report.employeeCount ?? 0}
                                            </span>
                                        </td>

                                        <td className={tableCellClass}>
                                            <span className={`inline-flex items-center justify-center min-w-7 px-2 py-1 rounded-lg border text-[10px] font-bold ${
                                                needsReview > 0
                                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                            }`}>
                                                {needsReview}
                                            </span>
                                        </td>

                                        <td className={tableCellClass}>
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold whitespace-nowrap ${getStatusClasses(report.status)}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                {statusLabels[reportStatus] || String(report.status)}
                                            </span>
                                        </td>

                                        <td className={tableCellClass}>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    disabled={actionLoading}
                                                    onClick={() => void openReport(report.id)}
                                                    className={buttonClass}
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    View
                                                </button>

                                                {reportStatus === 4 && (
                                                    <button
                                                        type="button"
                                                        disabled={actionLoading}
                                                        onClick={() => void openReport(report.id).then(() => setShowReturnReasonModal(true))}
                                                        className={buttonClass}
                                                    >
                                                        <FileText className="w-3.5 h-3.5" />
                                                        Return Reason
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {!loading && reports.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center">
                                        <CalendarCheck className="w-8 h-8 mx-auto mb-3 text-slate-600" />
                                        <p className="text-sm font-semibold text-slate-300">
                                            No attendance reports found
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-2">
                                            Select a branch and generate a report to get started.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* SELECTED REPORT DETAILS */}
            {selected && (
                <section className={`${panelClass} overflow-hidden`}>
                    <div className="p-4 sm:p-5 border-b border-[#231e54]">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div>
                                <span className="text-[10px] text-[#A78BFA] uppercase font-bold tracking-wider">
                                    REPORT DETAILS
                                </span>

                                <h3 className="text-base font-bold text-white mt-1">
                                    {months[selected.month - 1] ?? 'Unknown'} {selected.year}
                                </h3>

                                <p className="text-xs text-slate-400 mt-1">
                                    {selected.branchName || `Branch ${selected.branchId}`}
                                    {' · '}Report #{selected.id}
                                </p>

                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 mt-3 rounded-lg border text-[10px] font-bold ${getStatusClasses(selected.status)}`}>
                                    {selectedStatus === 3 && <LockKeyhole className="w-3 h-3" />}
                                    {getStatusLabel(selected.status)}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {selected.returnReason && (
                                    <button
                                        type="button"
                                        onClick={() => setShowReturnReasonModal(true)}
                                        className={buttonClass}
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        View Return Reason
                                    </button>
                                )}

                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={exportSelectedReport}
                                    className={primaryButtonClass}
                                >
                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                    Excel Report
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelected(null);
                                        setShowReturnForm(false);
                                        setShowReturnReasonModal(false);
                                        setReturnReason('');
                                    }}
                                    className={buttonClass}
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Close Details
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:p-5">
                        <div className="p-4 rounded-xl bg-[#0e0b2e] border border-[#2d2770]/70">
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">
                                Employees
                            </span>
                            <strong className="block mt-2 text-xl text-white">
                                {selected.employeeCount ?? employees.length}
                            </strong>
                        </div>

                        <div className="p-4 rounded-xl bg-[#0e0b2e] border border-[#2d2770]/70">
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">
                                Needs HR Review
                            </span>
                            <strong className="block mt-2 text-xl text-amber-300">
                                {employeesNeedingReview.length}
                            </strong>
                        </div>

                        <div className="p-4 rounded-xl bg-[#0e0b2e] border border-[#2d2770]/70">
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">
                                Report Status
                            </span>
                            <strong className="block mt-2 text-sm text-white">
                                {getStatusLabel(selected.status)}
                            </strong>
                        </div>
                    </div>

                    {selectedStatus === 3 && (
                        <div className="mx-4 sm:mx-5 mb-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/25">
                            <div className="flex items-start gap-3">
                                <LockKeyhole className="w-5 h-5 text-emerald-400 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-emerald-300">
                                        Approved &amp; Locked
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        This monthly attendance report has been approved and finalized.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* EMPLOYEE ATTENDANCE TABLE */}
                    <div className="px-4 sm:px-5 pb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4 text-[#A78BFA]" />
                            <h4 className="text-xs font-bold text-white">
                                Employee Attendance Summary
                            </h4>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-[#2d2770]/70">
                            <table className="w-full min-w-[1350px] text-left text-xs">
                                <thead>
                                    <tr>
                                        <th className={tableHeaderClass}>Employee</th>
                                        <th className={tableHeaderClass}>Working Days</th>
                                        <th className={tableHeaderClass}>Present</th>
                                        <th className={tableHeaderClass}>Leave</th>
                                        <th className={tableHeaderClass}>Half Days</th>
                                        <th className={tableHeaderClass}>Late</th>
                                        <th className={tableHeaderClass}>Missing Attendance</th>
                                        <th className={tableHeaderClass}>Missing Check-In</th>
                                        <th className={tableHeaderClass}>Missing Check-Out</th>
                                        <th className={tableHeaderClass}>Worked Hours</th>
                                        <th className={tableHeaderClass}>Shortage</th>
                                        <th className={tableHeaderClass}>HR Review</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[#1c164a]/60">
                                    {employees.map((employee) => (
                                        <tr key={employee.id} className="hover:bg-[#140f3d]/60 transition-colors">
                                            <td className={tableCellClass}>
                                                <span className="block font-semibold text-white">
                                                    {employee.employeeName || `User ${employee.userId}`}
                                                </span>
                                                <span className="block text-[10px] text-slate-500 mt-1">
                                                    ID: {employee.userId}
                                                </span>
                                            </td>

                                            <td className={tableCellClass}>{employee.workingDays}</td>
                                            <td className={tableCellClass}>{employee.presentDays}</td>
                                            <td className={tableCellClass}>{employee.approvedLeaveDays}</td>
                                            <td className={tableCellClass}>{employee.halfDays}</td>
                                            <td className={tableCellClass}>{employee.lateArrivals}</td>
                                            <td className={tableCellClass}>{employee.missingAttendanceDays}</td>
                                            <td className={tableCellClass}>{employee.missingCheckIns}</td>
                                            <td className={tableCellClass}>{employee.missingCheckOuts}</td>

                                            <td className={`${tableCellClass} font-mono text-white`}>
                                                {formatHours(employee.totalWorkedHours)}
                                            </td>

                                            <td className={`${tableCellClass} font-mono text-amber-300`}>
                                                {formatHours(employee.totalShortageHours)}
                                            </td>

                                            <td className={tableCellClass}>
                                                {employee.needsHrReview ? (
                                                    <details className="max-w-64">
                                                        <summary className="cursor-pointer text-amber-300 font-semibold text-[10px]">
                                                            Review Required
                                                        </summary>
                                                        <p className="mt-2 text-[10px] text-slate-400 whitespace-normal">
                                                            {employee.hrReviewNotes || "Verify this employee's attendance."}
                                                        </p>
                                                    </details>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-emerald-300 text-[10px] font-semibold">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Clear
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}

                                    {employees.length === 0 && (
                                        <tr>
                                            <td colSpan={12} className="p-8 text-center text-xs text-slate-500">
                                                No employee summaries are available.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* WORKFLOW ACTIONS */}
                    {((canSubmit && isDraftOrReturned) ||
                        (canApprove && selectedStatus === 2)) && (
                        <div className="p-4 sm:p-5 border-t border-[#231e54]">
                            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                                {canSubmit && isDraftOrReturned && (
                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() => void runAction(
                                            () => submitMonthlyAttendanceReport(selected.id),
                                            'Report submitted for approval.',
                                        )}
                                        className={primaryButtonClass}
                                    >
                                        {actionLoading
                                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            : <Send className="w-3.5 h-3.5" />}
                                        Submit for Approval
                                    </button>
                                )}

                                {canApprove && selectedStatus === 2 && (
                                    <>
                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={() => void runAction(
                                                () => approveMonthlyAttendanceReport(selected.id),
                                                'Report approved and locked.',
                                            )}
                                            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/30 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            Approve and Lock
                                        </button>

                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={() => {
                                                setError('');
                                                setShowReturnForm((current) => !current);
                                            }}
                                            className={dangerButtonClass}
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            Return to HR
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* RETURN FORM */}
                    {showReturnForm && canApprove && selectedStatus === 2 && (
                        <div className="mx-4 sm:mx-5 mb-5 p-4 rounded-xl bg-[#0e0b2e] border border-rose-500/25">
                            <label
                                htmlFor="ma-return-reason"
                                className="block text-xs text-slate-200 font-semibold mb-2"
                            >
                                Reason for Returning This Report
                            </label>

                            <textarea
                                id="ma-return-reason"
                                rows={4}
                                maxLength={2000}
                                value={returnReason}
                                onChange={(event) => setReturnReason(event.target.value)}
                                placeholder="Explain which attendance details need correction..."
                                className="w-full px-3 py-3 rounded-xl bg-[#09071e] border border-[#2d2770] text-xs text-white placeholder:text-slate-600 outline-none focus:border-[#5C3FE0] resize-y"
                            />

                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-3">
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => setShowReturnForm(false)}
                                    className={buttonClass}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    disabled={actionLoading || returnReason.trim().length < 5}
                                    onClick={() => void confirmReturn()}
                                    className={dangerButtonClass}
                                >
                                    {actionLoading && (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    )}
                                    Confirm Return
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* RETURN REASON MODAL */}
            {showReturnReasonModal && selected && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowReturnReasonModal(false);
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="return-reason-title"
                        className="w-full max-w-lg rounded-2xl bg-[#09071e] border border-[#2d2770] shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-start justify-between gap-3 p-5 border-b border-[#231e54]">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                                    Attendance Report
                                </p>
                                <h3 id="return-reason-title" className="text-base font-bold text-white mt-1">
                                    Reason for Return
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    {months[selected.month - 1] ?? 'Unknown'} {selected.year}
                                    {' · '}Report #{selected.id}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowReturnReasonModal(false)}
                                className={buttonClass}
                                aria-label="Close return reason"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5">
                            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
                                <p className="text-sm text-slate-200 whitespace-pre-wrap break-words">
                                    {selected.returnReason?.trim() || 'No return reason was included in the report response.'}
                                </p>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold ${getStatusClasses(selected.status)}`}>
                                    {getStatusLabel(selected.status)}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => setShowReturnReasonModal(false)}
                                    className={primaryButtonClass}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
