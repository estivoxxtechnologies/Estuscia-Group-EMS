import React, {
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    CalendarDays,
    Search,
    RefreshCw,
    Pencil,
    X,
    Save,
    Loader2,
    Clock3,
    Timer,
    LogIn,
    LogOut,
} from 'lucide-react';

import { useApp } from '../context/AppContext';

import {
    updateAttendance,
} from '../api/attendance';

import {
    AttendanceStatus,
    AttendanceRecord,
} from '../types/attendance';


// ============================================================
// STATUS OPTIONS
// ============================================================

const STATUS_OPTIONS: AttendanceStatus[] = [
    'Present',
    'Late',
    'HalfDay',
    'Absent',
    'OnLeave',
];


// ============================================================
// DATE HELPERS
// ============================================================

function formatDate(date: string) {
    if (!date) {
        return '-';
    }

    const value = new Date(`${date}T00:00:00`);

    return value.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}


function toInputDate(date: Date) {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
        date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
}


function getToday() {
    return toInputDate(new Date());
}


function getInitialDateRange() {
    const today = new Date();

    const toDate = new Date(today);

    const fromDate = new Date(today);

    // 7 days before today.
    //
    // Example:
    // Today = Sep 23
    // From  = Sep 16
    fromDate.setDate(
        fromDate.getDate() - 7
    );

    return {
        fromDate: toInputDate(fromDate),
        toDate: toInputDate(toDate),
    };
}


// ============================================================
// TIME
// ============================================================

function formatTime(
    time?: string | null
) {
    if (!time) {
        return '-';
    }

    return time.substring(0, 5);
}


// ============================================================
// HOURS
// ============================================================

function formatHours(
    hours?: number | null
) {
    if (
        hours === null ||
        hours === undefined ||
        Number.isNaN(hours)
    ) {
        return '0.00 h';
    }

    return `${hours.toFixed(2)} h`;
}


// ============================================================
// STATUS STYLE
// ============================================================

function getStatusClasses(
    status?: string
) {
    switch (status) {
        case 'Present':
            return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

        case 'Late':
            return 'bg-amber-500/10 text-amber-400 border-amber-500/20';

        case 'HalfDay':
            return 'bg-orange-500/10 text-orange-400 border-orange-500/20';

        case 'Absent':
            return 'bg-red-500/10 text-red-400 border-red-500/20';

        case 'OnLeave':
            return 'bg-blue-500/10 text-blue-400 border-blue-500/20';

        default:
            return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
}


// ============================================================
// BOOLEAN BADGE
// ============================================================

function BooleanBadge({
    value,
    label,
    type,
}: {
    value?: boolean;
    label: string;
    type: 'late' | 'early';
}) {
    if (!value) {
        return (
            <span className="text-slate-600">
                -
            </span>
        );
    }

    return (
        <span
            className={
                type === 'late'
                    ? 'inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400'
                    : 'inline-flex items-center rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400'
            }
        >
            {label}
        </span>
    );
}


// ============================================================
// EDIT FORM
// ============================================================

interface EditFormState {
    checkInTime: string;
    checkOutTime: string;
    status: string;
    biometricDeviceId: string;
}


// ============================================================
// COMPONENT
// ============================================================

export default function AttendanceRecords() {

    const {
        currentUser,
        branches,
        selectedBranchId,
        attendanceRecords,
        attendanceLoading,
        attendanceError,
        loadAttendance,
    } = useApp();


    // ========================================================
    // ROLE
    // ========================================================

    const role =
        currentUser?.roleName
            ?.trim()
            .toLowerCase() ?? '';

    const isEmployee =
        role === 'sales_staff';

    const isBranchManager =
        role === 'branch_manager';

    const isTenantManagement =
        role === 'company_admin' ||
        role === 'hr_ops';

    const isSuperAdmin =
        role === 'super_admin';

    const canEdit =
        isTenantManagement ||
        isBranchManager ||
        isSuperAdmin;


    // ========================================================
    // INITIAL DATE RANGE
    // ========================================================

    const initialRange =
        useMemo(
            () => getInitialDateRange(),
            []
        );

    const [fromDate, setFromDate] =
        useState(
            initialRange.fromDate
        );

    const [toDate, setToDate] =
        useState(
            initialRange.toDate
        );


    // ========================================================
    // FILTERS
    // ========================================================

    const [search, setSearch] =
        useState('');

    const [statusFilter, setStatusFilter] =
        useState('all');


    // ========================================================
    // BRANCH FILTER
    //
    // IMPORTANT:
    //
    // Header branch:
    //     selectedBranchId
    //
    // Attendance branch:
    //     branchFilter
    //
    // When header = All Branches:
    //     branchFilter can be selected independently.
    //
    // When header = specific branch:
    //     branchFilter is forced to that branch.
    // ========================================================

    const [branchFilter, setBranchFilter] =
        useState<string>('all');


    // ========================================================
    // EDIT
    // ========================================================

    const [editingRecord, setEditingRecord] =
        useState<AttendanceRecord | null>(null);

    const [editForm, setEditForm] =
        useState<EditFormState>({
            checkInTime: '',
            checkOutTime: '',
            status: 'Present',
            biometricDeviceId: '',
        });

    const [saving, setSaving] =
        useState(false);


    // ========================================================
    // BRANCH OPTIONS
    //
    // Always use AppContext branches.
    //
    // Do NOT build options from attendanceRecords because the
    // records themselves are already filtered.
    // ========================================================

    const branchOptions =
        useMemo(() => {

            return [...branches]
                .filter(
                    branch =>
                        branch.id !== null &&
                        branch.id !== undefined
                )
                .sort(
                    (a, b) =>
                        a.branchName.localeCompare(
                            b.branchName
                        )
                );

        }, [branches]);


    // ========================================================
    // SYNCHRONIZE HEADER BRANCH -> ATTENDANCE BRANCH
    //
    // Header = All Branches
    //     => Attendance filter becomes All Branches.
    //
    // Header = Specific Branch
    //     => Attendance filter becomes that branch.
    //
    // This means changing the header automatically updates
    // the Attendance page.
    // ========================================================

    useEffect(() => {

        if (!isTenantManagement && !isSuperAdmin) {
            return;
        }

        if (
            selectedBranchId === null ||
            selectedBranchId === undefined
        ) {
            setBranchFilter('all');
            return;
        }

        setBranchFilter(
            String(selectedBranchId)
        );

    }, [
        selectedBranchId,
        isTenantManagement,
        isSuperAdmin,
    ]);


    // ========================================================
    // LOAD ATTENDANCE
    // ========================================================

    const loadData = async () => {

        if (!currentUser) {
            return;
        }

        if (!fromDate || !toDate) {
            return;
        }

        if (fromDate > toDate) {
            return;
        }


        const params: {
            fromDate: string;
            toDate: string;
            branchId?: number;
            userId?: number;
        } = {
            fromDate,
            toDate,
        };


        // ----------------------------------------------------
        // SALES STAFF
        //
        // Only own records.
        // ----------------------------------------------------

        if (isEmployee) {

            params.userId =
                currentUser.userId;

            if (
                currentUser.branchId !== null &&
                currentUser.branchId !== undefined
            ) {
                params.branchId =
                    currentUser.branchId;
            }
        }


        // ----------------------------------------------------
        // BRANCH MANAGER
        //
        // Only assigned branch.
        // ----------------------------------------------------

        else if (isBranchManager) {

            if (
                currentUser.branchId !== null &&
                currentUser.branchId !== undefined
            ) {
                params.branchId =
                    currentUser.branchId;
            }
        }


        // ----------------------------------------------------
        // COMPANY ADMIN / HR OPS
        //
        // Header = All Branches
        //     + Attendance = All Branches
        //     => no branchId
        //
        // Header = All Branches
        //     + Attendance = Kochi
        //     => branchId = Kochi
        //
        // Header = Kochi
        //     + Attendance = Kochi
        //     => branchId = Kochi
        // ----------------------------------------------------

        else if (isTenantManagement) {

            if (
                branchFilter !== 'all'
            ) {
                params.branchId =
                    Number(branchFilter);
            }
        }


        // ----------------------------------------------------
        // SUPER ADMIN
        // ----------------------------------------------------

        else if (isSuperAdmin) {

            if (
                branchFilter !== 'all'
            ) {
                params.branchId =
                    Number(branchFilter);
            }
        }


        await loadAttendance(params);
    };


    // ========================================================
    // AUTOMATIC LOAD
    //
    // Reload when:
    //
    // - User changes
    // - From Date changes
    // - To Date changes
    // - Header branch changes
    // - Attendance branch filter changes
    // ========================================================

    useEffect(() => {

        if (!currentUser) {
            return;
        }

        if (!fromDate || !toDate) {
            return;
        }

        if (fromDate > toDate) {
            return;
        }

        void loadData();

        // loadData is intentionally omitted because it is
        // recreated during rendering.
        //
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        currentUser?.userId,
        fromDate,
        toDate,
        branchFilter,
        selectedBranchId,
    ]);


    // ========================================================
    // STATUS FILTER
    // ========================================================

    const handleStatusChange = (
        value: string
    ) => {

        setStatusFilter(value);
    };


    // ========================================================
    // BRANCH FILTER CHANGE
    //
    // This works independently ONLY when header is All Branches.
    //
    // If header has a specific branch selected, we do not allow
    // the page filter to move outside that branch.
    // ========================================================

    const handleBranchChange = (
        value: string
    ) => {

        if (
            selectedBranchId !== null &&
            selectedBranchId !== undefined
        ) {
            setBranchFilter(
                String(selectedBranchId)
            );

            return;
        }

        setBranchFilter(value);
    };


    // ========================================================
    // REFRESH
    // ========================================================

    const handleRefresh = async () => {
        await loadData();
    };


    // ========================================================
    // OPEN EDIT
    // ========================================================

    const openEdit = (
        record: AttendanceRecord
    ) => {

        setEditingRecord(record);

        setEditForm({
            checkInTime:
                record.checkInTime
                    ? record.checkInTime.substring(0, 5)
                    : '',

            checkOutTime:
                record.checkOutTime
                    ? record.checkOutTime.substring(0, 5)
                    : '',

            status:
                record.status ??
                'Present',

            biometricDeviceId:
                record.biometricDeviceId ??
                '',
        });
    };


    // ========================================================
    // CLOSE EDIT
    // ========================================================

    const closeEdit = () => {

        setEditingRecord(null);

        setEditForm({
            checkInTime: '',
            checkOutTime: '',
            status: 'Present',
            biometricDeviceId: '',
        });
    };


    // ========================================================
    // TIME API
    // ========================================================

    const timeForApi = (
        value: string
    ) => {

        if (!value) {
            return null;
        }

        return value.length === 5
            ? `${value}:00`
            : value;
    };


    // ========================================================
    // SAVE
    // ========================================================

    const handleSave = async () => {

        if (!editingRecord) {
            return;
        }

        setSaving(true);

        try {

            await updateAttendance(
                editingRecord.id,
                {
                    checkInTime:
                        timeForApi(
                            editForm.checkInTime
                        ),

                    checkOutTime:
                        timeForApi(
                            editForm.checkOutTime
                        ),

                    status:
                        editForm.status,

                    biometricDeviceId:
                        editForm.biometricDeviceId ||
                        null,
                }
            );

            closeEdit();

            await loadData();

        } finally {

            setSaving(false);
        }
    };


    // ========================================================
    // CLIENT-SIDE SEARCH / STATUS
    // ========================================================

    const filteredRecords =
        useMemo(() => {

            const query =
                search
                    .trim()
                    .toLowerCase();

            return attendanceRecords.filter(
                record => {

                    const matchesSearch =
                        !query ||
                        record.userName
                            ?.toLowerCase()
                            .includes(query) ||
                        record.employeeCode
                            ?.toLowerCase()
                            .includes(query) ||
                        record.branchName
                            ?.toLowerCase()
                            .includes(query);

                    const matchesStatus =
                        statusFilter === 'all' ||
                        record.status === statusFilter;

                    return (
                        matchesSearch &&
                        matchesStatus
                    );
                }
            );

        }, [
            attendanceRecords,
            search,
            statusFilter,
        ]);


    // ========================================================
    // SUMMARY
    // ========================================================

    const summary =
        useMemo(() => {

            let worked = 0;
            let overtime = 0;
            let lateCount = 0;
            let earlyCount = 0;

            filteredRecords.forEach(
                record => {

                    worked +=
                        Number(
                            record.workedHours ?? 0
                        );

                    overtime +=
                        Number(
                            record.overtimeHours ?? 0
                        );

                    if (record.isLate) {
                        lateCount++;
                    }

                    if (record.isEarlyLeaving) {
                        earlyCount++;
                    }
                }
            );

            return {
                worked,
                overtime,
                lateCount,
                earlyCount,
            };

        }, [filteredRecords]);


    // ========================================================
    // SELECTED BRANCH DISPLAY NAME
    // ========================================================

    const selectedBranchName =
        useMemo(() => {

            if (
                branchFilter === 'all'
            ) {
                return 'All Branches';
            }

            const branch =
                branchOptions.find(
                    item =>
                        String(item.id) ===
                        branchFilter
                );

            return (
                branch?.branchName ??
                'Selected Branch'
            );

        }, [
            branchFilter,
            branchOptions,
        ]);


    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div className="space-y-6">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>

                    <h1 className="text-2xl font-semibold text-white">
                        Attendance
                    </h1>

                    <p className="mt-1 text-sm text-slate-400">
                        Attendance calculated from tenant and branch working schedules.
                    </p>

                </div>


                <button
                    onClick={handleRefresh}
                    disabled={attendanceLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
                >

                    <RefreshCw
                        className={`h-4 w-4 ${
                            attendanceLoading
                                ? 'animate-spin'
                                : ''
                        }`}
                    />

                    Refresh

                </button>

            </div>


            {/* =================================================
                FILTER BAR
            ================================================= */}

            <div className="rounded-2xl border border-white/10 bg-[#0e0b2e] p-4">

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">

                    {/* From */}

                    <div>

                        <label className="mb-2 block text-xs font-medium text-slate-400">
                            From Date
                        </label>

                        <div className="relative">

                            <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                            <input
                                type="date"
                                value={fromDate}
                                max={toDate}
                                onChange={e =>
                                    setFromDate(
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-[#5C3FE0]"
                            />

                        </div>

                    </div>


                    {/* To */}

                    <div>

                        <label className="mb-2 block text-xs font-medium text-slate-400">
                            To Date
                        </label>

                        <div className="relative">

                            <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                            <input
                                type="date"
                                value={toDate}
                                min={fromDate}
                                max={getToday()}
                                onChange={e =>
                                    setToDate(
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-[#5C3FE0]"
                            />

                        </div>

                    </div>


                    {/* Search */}

                    <div>

                        <label className="mb-2 block text-xs font-medium text-slate-400">
                            Search
                        </label>

                        <div className="relative">

                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                            <input
                                type="text"
                                value={search}
                                onChange={e =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Employee, code, branch..."
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-[#5C3FE0]"
                            />

                        </div>

                    </div>


                    {/* Status */}

                    <div>

                        <label className="mb-2 block text-xs font-medium text-slate-400">
                            Status
                        </label>

                        <select
                            value={statusFilter}
                            onChange={e =>
                                handleStatusChange(
                                    e.target.value
                                )
                            }
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5C3FE0]"
                        >

                            <option
                                value="all"
                                className="bg-[#0e0b2e]"
                            >
                                All Status
                            </option>

                            {STATUS_OPTIONS.map(
                                status => (
                                    <option
                                        key={status}
                                        value={status}
                                        className="bg-[#0e0b2e]"
                                    >
                                        {status}
                                    </option>
                                )
                            )}

                        </select>

                    </div>


                    {/* Branch */}

                    {!isEmployee &&
                        !isBranchManager && (

                            <div>

                                <label className="mb-2 block text-xs font-medium text-slate-400">
                                    Branch
                                </label>

                                <select
                                    value={branchFilter}
                                    onChange={e =>
                                        handleBranchChange(
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        selectedBranchId !== null &&
                                        selectedBranchId !== undefined
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5C3FE0] disabled:cursor-not-allowed disabled:opacity-70"
                                >

                                    <option
                                        value="all"
                                        className="bg-[#0e0b2e]"
                                    >
                                        All Branches
                                    </option>

                                    {branchOptions.map(
                                        branch => (

                                            <option
                                                key={branch.id}
                                                value={String(
                                                    branch.id
                                                )}
                                                className="bg-[#0e0b2e]"
                                            >
                                                {branch.branchName}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>

                        )}

                </div>

            </div>


            {/* =================================================
                ACTIVE FILTER INFORMATION
            ================================================= */}

            {!isEmployee &&
                !isBranchManager && (

                    <div className="flex flex-col gap-2 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-center gap-3">

                            <div className="h-2 w-2 rounded-full bg-violet-400" />

                            <div>

                                <p className="text-xs font-medium text-violet-300">
                                    Attendance Branch
                                </p>

                                <p className="mt-0.5 text-sm text-white">
                                    {selectedBranchId !== null &&
                                    selectedBranchId !== undefined
                                        ? `Header: ${selectedBranchName}`
                                        : `Filter: ${selectedBranchName}`}
                                </p>

                            </div>

                        </div>


                        <p className="text-xs text-slate-500">

                            {selectedBranchId !== null &&
                            selectedBranchId !== undefined
                                ? 'Following header branch'
                                : 'Attendance branch can be selected here'}

                        </p>

                    </div>

                )}


            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

                {/* Worked */}

                <div className="rounded-2xl border border-white/10 bg-[#0e0b2e] p-4">

                    <div className="flex items-center gap-3">

                        <Clock3 className="h-5 w-5 text-violet-400" />

                        <div>

                            <p className="text-xs text-slate-500">
                                Worked
                            </p>

                            <p className="mt-1 text-lg font-semibold text-white">
                                {formatHours(
                                    summary.worked
                                )}
                            </p>

                        </div>

                    </div>

                </div>


                {/* Overtime */}

                <div className="rounded-2xl border border-white/10 bg-[#0e0b2e] p-4">

                    <div className="flex items-center gap-3">

                        <Timer className="h-5 w-5 text-emerald-400" />

                        <div>

                            <p className="text-xs text-slate-500">
                                Overtime
                            </p>

                            <p className="mt-1 text-lg font-semibold text-white">
                                {formatHours(
                                    summary.overtime
                                )}
                            </p>

                        </div>

                    </div>

                </div>


                {/* Late */}

                <div className="rounded-2xl border border-white/10 bg-[#0e0b2e] p-4">

                    <div className="flex items-center gap-3">

                        <LogIn className="h-5 w-5 text-amber-400" />

                        <div>

                            <p className="text-xs text-slate-500">
                                Late Coming
                            </p>

                            <p className="mt-1 text-lg font-semibold text-white">
                                {summary.lateCount}
                            </p>

                        </div>

                    </div>

                </div>


                {/* Early */}

                <div className="rounded-2xl border border-white/10 bg-[#0e0b2e] p-4">

                    <div className="flex items-center gap-3">

                        <LogOut className="h-5 w-5 text-orange-400" />

                        <div>

                            <p className="text-xs text-slate-500">
                                Early Leaving
                            </p>

                            <p className="mt-1 text-lg font-semibold text-white">
                                {summary.earlyCount}
                            </p>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {attendanceError && (

                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {attendanceError}
                </div>

            )}


            {/* =================================================
                TABLE
            ================================================= */}

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e0b2e]">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[1100px]">

                        <thead>

                            <tr className="border-b border-white/10 bg-white/[0.02]">

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Employee
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Branch
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Date
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Schedule
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Check In
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Check Out
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Worked
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Overtime
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Late
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Early Leave
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Status
                                </th>

                                {canEdit && (

                                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Action
                                    </th>

                                )}

                            </tr>

                        </thead>


                        <tbody>

                            {attendanceLoading ? (

                                <tr>

                                    <td
                                        colSpan={
                                            canEdit
                                                ? 12
                                                : 11
                                        }
                                        className="px-5 py-16 text-center"
                                    >

                                        <div className="flex items-center justify-center gap-3 text-slate-400">

                                            <Loader2 className="h-5 w-5 animate-spin" />

                                            Loading attendance...

                                        </div>

                                    </td>

                                </tr>

                            ) : filteredRecords.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan={
                                            canEdit
                                                ? 12
                                                : 11
                                        }
                                        className="px-5 py-16 text-center text-sm text-slate-500"
                                    >
                                        No attendance records found for the selected period.
                                    </td>

                                </tr>

                            ) : (

                                filteredRecords.map(
                                    record => (

                                        <tr
                                            key={record.id}
                                            className="border-b border-white/5 transition hover:bg-white/[0.02]"
                                        >

                                            {/* Employee */}

                                            <td className="px-5 py-4">

                                                <div>

                                                    <div className="font-medium text-white">
                                                        {record.userName}
                                                    </div>

                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {record.employeeCode}
                                                    </div>

                                                </div>

                                            </td>


                                            {/* Branch */}

                                            <td className="px-5 py-4 text-sm text-slate-300">
                                                {record.branchName || '-'}
                                            </td>


                                            {/* Date */}

                                            <td className="px-5 py-4 text-sm text-slate-300">
                                                {formatDate(
                                                    record.date
                                                )}
                                            </td>


                                            {/* Schedule */}

                                            <td className="px-5 py-4">

                                                <div className="text-sm text-white">

                                                    {formatTime(
                                                        record.scheduledStartTime
                                                    )}

                                                    {' - '}

                                                    {formatTime(
                                                        record.scheduledEndTime
                                                    )}

                                                </div>

                                                <div className="mt-1 text-xs text-slate-500">

                                                    {formatHours(
                                                        record.requiredHours
                                                    )}

                                                    {' · '}

                                                    {record.scheduleSource}

                                                </div>

                                            </td>


                                            {/* Check In */}

                                            <td className="px-5 py-4 text-sm">

                                                <span
                                                    className={
                                                        record.isLate
                                                            ? 'font-medium text-amber-400'
                                                            : 'text-slate-300'
                                                    }
                                                >
                                                    {formatTime(
                                                        record.checkInTime
                                                    )}
                                                </span>

                                            </td>


                                            {/* Check Out */}

                                            <td className="px-5 py-4 text-sm">

                                                <span
                                                    className={
                                                        record.isEarlyLeaving
                                                            ? 'font-medium text-orange-400'
                                                            : 'text-slate-300'
                                                    }
                                                >
                                                    {formatTime(
                                                        record.checkOutTime
                                                    )}
                                                </span>

                                            </td>


                                            {/* Worked */}

                                            <td className="px-5 py-4 text-sm font-medium text-white">
                                                {formatHours(
                                                    record.workedHours
                                                )}
                                            </td>


                                            {/* Overtime */}

                                            <td className="px-5 py-4 text-sm font-medium text-emerald-400">

                                                {Number(
                                                    record.overtimeHours ?? 0
                                                ) > 0
                                                    ? formatHours(
                                                        record.overtimeHours
                                                    )
                                                    : '-'}

                                            </td>


                                            {/* Late */}

                                            <td className="px-5 py-4 text-sm">

                                                <BooleanBadge
                                                    value={
                                                        record.isLate
                                                    }
                                                    label="Late"
                                                    type="late"
                                                />

                                            </td>


                                            {/* Early */}

                                            <td className="px-5 py-4 text-sm">

                                                <BooleanBadge
                                                    value={
                                                        record.isEarlyLeaving
                                                    }
                                                    label="Early"
                                                    type="early"
                                                />

                                            </td>


                                            {/* Status */}

                                            <td className="px-5 py-4">

                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                                                        record.status
                                                    )}`}
                                                >
                                                    {record.status}
                                                </span>

                                            </td>


                                            {/* Action */}

                                            {canEdit && (

                                                <td className="px-5 py-4 text-right">

                                                    <button
                                                        onClick={() =>
                                                            openEdit(
                                                                record
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                                                    >

                                                        <Pencil className="h-3.5 w-3.5" />

                                                        Edit

                                                    </button>

                                                </td>

                                            )}

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* =================================================
                EDIT MODAL
            ================================================= */}

            {editingRecord && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

                    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e0b2e] shadow-2xl">

                        {/* Header */}

                        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

                            <div>

                                <h2 className="text-lg font-semibold text-white">
                                    Edit Attendance
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    {editingRecord.userName}
                                    {' · '}
                                    {formatDate(
                                        editingRecord.date
                                    )}
                                </p>

                            </div>

                            <button
                                onClick={closeEdit}
                                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>

                        </div>


                        {/* Body */}

                        <div className="space-y-5 px-6 py-6">

                            {/* Schedule */}

                            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">

                                <div className="flex items-start gap-3">

                                    <Clock3 className="mt-0.5 h-4 w-4 text-violet-400" />

                                    <div>

                                        <p className="text-xs font-medium text-violet-300">
                                            Effective Schedule
                                        </p>

                                        <p className="mt-1 text-sm text-white">

                                            {formatTime(
                                                editingRecord.scheduledStartTime
                                            )}

                                            {' - '}

                                            {formatTime(
                                                editingRecord.scheduledEndTime
                                            )}

                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">

                                            {formatHours(
                                                editingRecord.requiredHours
                                            )}

                                            {' · '}

                                            {editingRecord.scheduleSource}
                                            {' schedule'}

                                        </p>

                                    </div>

                                </div>

                            </div>


                            {/* Check In */}

                            <div>

                                <label className="mb-2 block text-xs font-medium text-slate-400">
                                    Check In
                                </label>

                                <input
                                    type="time"
                                    value={
                                        editForm.checkInTime
                                    }
                                    onChange={e =>
                                        setEditForm(
                                            previous => ({
                                                ...previous,
                                                checkInTime:
                                                    e.target.value,
                                            })
                                        )
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5C3FE0]"
                                />

                            </div>


                            {/* Check Out */}

                            <div>

                                <label className="mb-2 block text-xs font-medium text-slate-400">
                                    Check Out
                                </label>

                                <input
                                    type="time"
                                    value={
                                        editForm.checkOutTime
                                    }
                                    onChange={e =>
                                        setEditForm(
                                            previous => ({
                                                ...previous,
                                                checkOutTime:
                                                    e.target.value,
                                            })
                                        )
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5C3FE0]"
                                />

                            </div>


                            {/* Status */}

                            <div>

                                <label className="mb-2 block text-xs font-medium text-slate-400">
                                    Status
                                </label>

                                <select
                                    value={
                                        editForm.status
                                    }
                                    onChange={e =>
                                        setEditForm(
                                            previous => ({
                                                ...previous,
                                                status:
                                                    e.target.value,
                                            })
                                        )
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5C3FE0]"
                                >

                                    {STATUS_OPTIONS.map(
                                        status => (

                                            <option
                                                key={status}
                                                value={status}
                                                className="bg-[#0e0b2e]"
                                            >
                                                {status}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            {/* Biometric */}

                            <div>

                                <label className="mb-2 block text-xs font-medium text-slate-400">
                                    Biometric Device ID
                                </label>

                                <input
                                    type="text"
                                    value={
                                        editForm.biometricDeviceId
                                    }
                                    onChange={e =>
                                        setEditForm(
                                            previous => ({
                                                ...previous,
                                                biometricDeviceId:
                                                    e.target.value,
                                            })
                                        )
                                    }
                                    placeholder="Optional"
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-[#5C3FE0]"
                                />

                            </div>


                            {/* Calculated preview */}

                            <div className="grid grid-cols-2 gap-3">

                                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">

                                    <p className="text-xs text-slate-500">
                                        Current Worked
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-white">
                                        {formatHours(
                                            editingRecord.workedHours
                                        )}
                                    </p>

                                </div>


                                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">

                                    <p className="text-xs text-slate-500">
                                        Current Overtime
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-emerald-400">
                                        {formatHours(
                                            editingRecord.overtimeHours
                                        )}
                                    </p>

                                </div>

                            </div>


                            <p className="text-xs leading-5 text-slate-500">
                                Worked hours, overtime, late coming and early leaving are recalculated by the backend after saving.
                            </p>

                        </div>


                        {/* Footer */}

                        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">

                            <button
                                onClick={closeEdit}
                                disabled={saving}
                                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#5C3FE0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6c4de8] disabled:opacity-50"
                            >

                                {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}

                                Save Changes

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}