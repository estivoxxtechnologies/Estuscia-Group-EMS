
import React, { useCallback, useEffect, useState } from 'react';
import {
    CalendarCheck,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Clock,
    FileText,
    ShieldCheck,
    Users,
    CalendarDays,
    TriangleAlert,
} from 'lucide-react';

import {
    getMyMonthlyAttendanceReports,
    type MyMonthlyAttendanceReport,
} from '../api/monthlyAttendance';

const months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
];

const panelClass =
    'rounded-2xl bg-[#09071e] border border-[#2d2770]/80';

const buttonClass =
    'px-3 py-2 rounded-xl bg-[#140f3d] hover:bg-[#1f175a] border border-[#2d2770] text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

const inputClass =
    'w-full min-w-0 px-3 py-2.5 rounded-xl bg-[#09071e] border border-[#2d2770] text-xs text-white outline-none focus:border-[#5C3FE0] [color-scheme:dark] transition-colors';

function formatHours(value?: number | null): string {
    const hours = Number(value ?? 0);
    return `${(Number.isFinite(hours) ? hours : 0).toFixed(2)} hrs`;
}

function formatDate(value?: string | null): string {
    if (!value) return 'Not available';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return 'Not available';

    return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

function Metric({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-3 border-b border-[#231e54] last:border-b-0">
            <span className="text-xs text-slate-400">{label}</span>
            <span className="text-xs font-bold text-white text-right tabular-nums">
                {value}
            </span>
        </div>
    );
}

function StatCard({
    label,
    value,
    description,
    icon,
    color = 'text-[#A78BFA]',
}: {
    label: string;
    value: string | number;
    description: string;
    icon: React.ReactNode;
    color?: string;
}) {
    return (
        <div className={`${panelClass} p-5`}>
            <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    {label}
                </span>
                <span className={color}>{icon}</span>
            </div>

            <div className="mt-3 text-2xl font-bold text-white tabular-nums">
                {value}
            </div>

            <p className="text-[10px] text-slate-500 mt-2">
                {description}
            </p>
        </div>
    );
}

export default function MyMonthlyAttendance() {
    const now = new Date();

    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);

    const [reports, setReports] = useState<MyMonthlyAttendanceReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const loadReport = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError('');

        try {
            const result = await getMyMonthlyAttendanceReports({
                year,
                month,
            });

            setReports(Array.isArray(result) ? result : []);
        } catch (err) {
            setReports([]);

            setError(
                getErrorMessage(
                    err,
                    'Unable to load your monthly attendance report.',
                ),
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [year, month]);

    useEffect(() => {
        void loadReport();
    }, [loadReport]);

    const report = reports.length > 0 ? reports[0] : null;

    const yearOptions = Array.from(
        { length: 7 },
        (_, index) => now.getFullYear() - index,
    );

    return (
        <div className="space-y-5 min-w-0">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#A78BFA]">
                        EMPLOYEE SELF-SERVICE
                    </p>

                    <h2 className="text-base font-bold text-white mt-1">
                        My Monthly Attendance
                    </h2>

                    <p className="text-xs text-slate-400 mt-1">
                        View your finalized monthly attendance and working hours.
                    </p>
                </div>

                <button
                    type="button"
                    disabled={loading || refreshing}
                    onClick={() => void loadReport(true)}
                    className={buttonClass}
                >
                    <RefreshCw
                        className={`w-3.5 h-3.5 ${
                            refreshing ? 'animate-spin' : ''
                        }`}
                    />
                    Refresh
                </button>
            </div>

            {/* ACCESS NOTICE */}
            <div className="flex items-start gap-3 rounded-xl border border-[#2d2770] bg-[#0e0b2e] p-4">
                <ShieldCheck className="w-5 h-5 shrink-0 text-[#A78BFA]" />

                <div>
                    <p className="text-xs font-bold text-white">
                        Read-only attendance report
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-slate-400">
                        You can view your own approved monthly attendance.
                        For corrections or discrepancies, contact HR Ops.
                    </p>
                </div>
            </div>

            {/* FILTERS */}
            <section className={`${panelClass} p-4 sm:p-5`}>
                <div className="flex items-center gap-2 mb-4">
                    <CalendarDays className="w-4 h-4 text-[#A78BFA]" />

                    <h3 className="text-xs font-bold text-white">
                        Select Reporting Period
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label>
                        <span className="block text-[10px] text-slate-500 mb-1.5">
                            Month
                        </span>

                        <select
                            value={month}
                            onChange={(event) =>
                                setMonth(Number(event.target.value))
                            }
                            className={inputClass}
                        >
                            {months.map((name, index) => (
                                <option key={name} value={index + 1}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <span className="block text-[10px] text-slate-500 mb-1.5">
                            Year
                        </span>

                        <select
                            value={year}
                            onChange={(event) =>
                                setYear(Number(event.target.value))
                            }
                            className={inputClass}
                        >
                            {yearOptions.map((value) => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </section>

            {/* ERROR */}
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
                        className="font-bold"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* LOADING */}
            {loading && (
                <div className={`${panelClass} p-10 text-center`}>
                    <RefreshCw className="w-6 h-6 mx-auto mb-3 animate-spin text-[#A78BFA]" />

                    <p className="text-xs text-slate-400">
                        Loading your attendance report...
                    </p>
                </div>
            )}

            {/* EMPTY STATE */}
            {!loading && !error && !report && (
                <div className={`${panelClass} p-8 sm:p-12 text-center`}>
                    <FileText className="w-10 h-10 mx-auto mb-4 text-slate-600" />

                    <h3 className="text-sm font-bold text-white">
                        No Finalized Report Available
                    </h3>

                    <p className="max-w-md mx-auto text-xs leading-6 text-slate-400 mt-2">
                        Your attendance report for {months[month - 1]} {year}
                        {' '}will appear here after HR Ops submits it and
                        your Company Admin approves it.
                    </p>

                    <button
                        type="button"
                        disabled={refreshing}
                        onClick={() => void loadReport(true)}
                        className={`${buttonClass} mx-auto mt-5`}
                    >
                        <RefreshCw
                            className={`w-3.5 h-3.5 ${
                                refreshing ? 'animate-spin' : ''
                            }`}
                        />
                        Check Again
                    </button>
                </div>
            )}

            {/* FINALIZED REPORT */}
            {!loading && report && (
                <>
                    {/* APPROVAL STATUS */}
                    <section className={`${panelClass} p-4 sm:p-5`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-emerald-300">
                                        Approved &amp; Finalized
                                    </p>

                                    <p className="text-xs text-slate-400 mt-1">
                                        {months[report.month - 1]} {report.year}
                                    </p>

                                    {report.branchName && (
                                        <p className="text-[10px] text-slate-500 mt-1">
                                            {report.branchName}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] uppercase font-semibold text-slate-500">
                                    Approved On
                                </p>

                                <p className="text-xs text-white mt-1">
                                    {formatDate(report.approvedAtUtc)}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* ATTENDANCE STAT CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        <StatCard
                            label="Present Days"
                            value={report.presentDays}
                            description="Days recorded as present"
                            icon={<CalendarCheck className="w-4 h-4" />}
                            color="text-emerald-400"
                        />

                        <StatCard
                            label="Approved Leave"
                            value={report.approvedLeaveDays}
                            description="Approved leave days"
                            icon={<CheckCircle2 className="w-4 h-4" />}
                            color="text-sky-400"
                        />

                        <StatCard
                            label="Half Days"
                            value={report.halfDays}
                            description="Recorded half-days"
                            icon={<Clock className="w-4 h-4" />}
                            color="text-amber-400"
                        />

                        <StatCard
                            label="Absent Days"
                            value={report.absentDays}
                            description="Recorded absence days"
                            icon={<Users className="w-4 h-4" />}
                            color="text-rose-400"
                        />
                    </div>

                    {/* DETAILED SUMMARY */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        <section className={`${panelClass} p-4 sm:p-5`}>
                            <div className="flex items-center gap-2 mb-2">
                                <CalendarDays className="w-4 h-4 text-[#A78BFA]" />

                                <h3 className="text-xs font-bold text-white">
                                    Attendance Summary
                                </h3>
                            </div>

                            <Metric
                                label="Total Working Days"
                                value={report.workingDays}
                            />

                            <Metric
                                label="Present Days"
                                value={report.presentDays}
                            />

                            <Metric
                                label="Approved Leave Days"
                                value={report.approvedLeaveDays}
                            />

                            <Metric
                                label="Half Days"
                                value={report.halfDays}
                            />

                            <Metric
                                label="Absent Days"
                                value={report.absentDays}
                            />

                            <Metric
                                label="Late Arrivals"
                                value={report.lateArrivals}
                            />
                        </section>

                        <section className={`${panelClass} p-4 sm:p-5`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-[#A78BFA]" />

                                <h3 className="text-xs font-bold text-white">
                                    Working Hours
                                </h3>
                            </div>

                            <Metric
                                label="Total Worked Hours"
                                value={formatHours(report.totalWorkedHours)}
                            />

                            <Metric
                                label="Required Working Hours"
                                value={formatHours(report.requiredWorkingHours)}
                            />

                            <Metric
                                label="Days Below Required Hours"
                                value={report.daysBelowRequiredHours}
                            />

                            <Metric
                                label="Total Shortage Hours"
                                value={formatHours(report.totalShortageHours)}
                            />
                        </section>
                    </div>

                    {/* ATTENDANCE ISSUES */}
                    <section className={`${panelClass} p-4 sm:p-5`}>
                        <div className="flex items-center gap-2 mb-4">
                            <TriangleAlert className="w-4 h-4 text-amber-400" />

                            <h3 className="text-xs font-bold text-white">
                                Attendance Records to Review
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="rounded-xl bg-[#0e0b2e] border border-[#2d2770]/70 p-4">
                                <p className="text-[10px] text-slate-500 uppercase font-semibold">
                                    Missing Check-ins
                                </p>

                                <p className="text-xl font-bold text-white mt-2">
                                    {report.missingCheckIns}
                                </p>
                            </div>

                            <div className="rounded-xl bg-[#0e0b2e] border border-[#2d2770]/70 p-4">
                                <p className="text-[10px] text-slate-500 uppercase font-semibold">
                                    Missing Check-outs
                                </p>

                                <p className="text-xl font-bold text-white mt-2">
                                    {report.missingCheckOuts}
                                </p>
                            </div>

                            <div className="rounded-xl bg-[#0e0b2e] border border-[#2d2770]/70 p-4">
                                <p className="text-[10px] text-slate-500 uppercase font-semibold">
                                    Missing Attendance Days
                                </p>

                                <p className="text-xl font-bold text-white mt-2">
                                    {report.missingAttendanceDays}
                                </p>
                            </div>
                        </div>

                        {(report.missingCheckIns > 0 ||
                            report.missingCheckOuts > 0 ||
                            report.missingAttendanceDays > 0 ||
                            report.daysBelowRequiredHours > 0) && (
                            <div className="flex items-start gap-2 mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
                                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />

                                <p className="text-[11px] leading-5 text-slate-300">
                                    Your finalized report contains attendance exceptions.
                                    Contact HR Ops if you believe any information is incorrect.
                                </p>
                            </div>
                        )}
                    </section>

                    {/* READ-ONLY NOTICE */}
                    <div className="flex items-start gap-3 rounded-xl border border-[#2d2770]/70 bg-[#0e0b2e] p-4">
                        <ShieldCheck className="w-5 h-5 shrink-0 text-[#A78BFA]" />

                        <div>
                            <p className="text-xs font-bold text-white">
                                Final Report — Read Only
                            </p>

                            <p className="text-[11px] leading-5 text-slate-400 mt-1">
                                This report has been approved and locked. You cannot
                                edit attendance details from this screen. Please
                                contact HR Ops if you need a correction.
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
