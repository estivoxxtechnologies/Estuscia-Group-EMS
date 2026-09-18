import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    AlertCircle,
    ArrowDown,
    ArrowUp,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    Clock3,
    Filter,
    Loader2,
    Phone,
    PhoneCall,
    RefreshCw,
    Search,
    Target,
    TrendingUp,
    UserCheck,
    Users,
    X,
    XCircle,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { apiRequest } from '../api/client';
import {
    SalesLeadOutcome,
    getSalesLeadOutcomeLabel,
} from '../api/salesLeads';


// ============================================================
// TYPES
// ============================================================

interface TeamUser {
    id: number;
    username: string;
    employeeCode?: string | null;
    designation?: string | null;
    roleName?: string | null;
    branchId?: number | null;
    branchName?: string | null;
    isActive?: boolean;
}

interface SalesLeadResponse {
    assignmentId: number;
    salesLeadId: number;
    tenantId: number;
    branchId: number;
    branchName: string;
    phoneNumber: string;
    customerName?: string | null;

    assignedToUserId: number;
    assignedToUserName: string;
    assignedToEmployeeCode?: string | null;

    assignedByUserId: number;
    assignedByUserName: string;

    assignedAtUtc: string;

    outcome: SalesLeadOutcome;

    notes?: string | null;
    completedAtUtc?: string | null;
}

interface SalesLeadMetrics {
    callsMade: number;
    connected: number;
    respondedWell: number;
    followUp: number;
    notConnected: number;
    otherConnected: number;
    pending: number;
}

interface AssignSalesLeadsRequest {
    branchId: number;
    assignedToUserId: number;
    leads: {
        phoneNumber: string;
        customerName: string | null;
    }[];
}


// ============================================================
// HELPERS
// ============================================================

const normalizeOutcome = (
    value: unknown
): SalesLeadOutcome => {
    if (typeof value === 'string') {
        const normalized = value.toLowerCase();

        switch (normalized) {
            case 'pending':
                return SalesLeadOutcome.Pending;

            case 'connected':
                return SalesLeadOutcome.Connected;

            case 'respondedwell':
            case 'responded_well':
            case 'responded well':
                return SalesLeadOutcome.RespondedWell;

            case 'followup':
            case 'follow_up':
            case 'follow-up':
                return SalesLeadOutcome.FollowUp;

            case 'notconnected':
            case 'not_connected':
            case 'not connected':
                return SalesLeadOutcome.NotConnected;
        }
    }

    return SalesLeadOutcome.Pending;
};


const normalizeLead = (
    lead: SalesLeadResponse
): SalesLeadResponse => ({
    ...lead,
    outcome: normalizeOutcome(lead.outcome),
});


const normalizeUser = (
    user: any
): TeamUser => ({
    id: Number(user.id ?? user.userId),
    username: user.fullName,
    employeeCode: user.employeeCode,
    designation: user.designation,
    roleName: user.roleName,
    branchId:
        user.branchId !== undefined && user.branchId !== null
            ? Number(user.branchId)
            : null,
    branchName:
        user.branchName ??
        user.branch?.branchName ??
        user.branch?.name ??
        null,
    isActive:
        user.isActive !== undefined
            ? Boolean(user.isActive)
            : true,
});


const parsePhoneNumbers = (
    value: string
): string[] => {
    return Array.from(
        new Set(
            value
                .split(/[\n,;]+/)
                .map((item) => item.trim())
                .filter(Boolean)
        )
    );
};


const formatDateTime = (
    value?: string | null
): string => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleString([], {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};


const formatDate = (
    value: string
): string => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString([], {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};


const getOutcomeBadgeClass = (
    outcome: SalesLeadOutcome
): string => {
    switch (outcome) {
        case SalesLeadOutcome.Pending:
            return 'border-amber-400/20 bg-amber-500/10 text-amber-300';

        case SalesLeadOutcome.Connected:
            return 'border-blue-400/20 bg-blue-500/10 text-blue-300';

        case SalesLeadOutcome.RespondedWell:
            return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300';

        case SalesLeadOutcome.FollowUp:
            return 'border-violet-400/20 bg-violet-500/10 text-violet-300';

        case SalesLeadOutcome.NotConnected:
            return 'border-red-400/20 bg-red-500/10 text-red-300';

        default:
            return 'border-white/10 bg-white/5 text-gray-300';
    }
};


const getOutcomeIcon = (
    outcome: SalesLeadOutcome
) => {
    switch (outcome) {
        case SalesLeadOutcome.Pending:
            return <Clock3 size={14} />;

        case SalesLeadOutcome.Connected:
            return <PhoneCall size={14} />;

        case SalesLeadOutcome.RespondedWell:
            return <CheckCircle2 size={14} />;

        case SalesLeadOutcome.FollowUp:
            return <Clock3 size={14} />;

        case SalesLeadOutcome.NotConnected:
            return <XCircle size={14} />;

        default:
            return <AlertCircle size={14} />;
    }
};


// ============================================================
// COMPONENT
// ============================================================

const SeniorSalesLeadsView: React.FC = () => {
    const { currentUser } = useApp();

    // ----------------------------------------------------------
    // USER / BRANCH
    // ----------------------------------------------------------

    const currentBranchId =
        currentUser?.branchId != null
            ? Number(currentUser.branchId)
            : null;

    const currentBranchName =
        currentUser?.branchName ||
        'Current Branch';


    // ----------------------------------------------------------
    // TEAM USERS
    // ----------------------------------------------------------

    const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    const [selectedUserId, setSelectedUserId] =
        useState<number | null>(null);


    // ----------------------------------------------------------
    // ASSIGNMENT FORM
    // ----------------------------------------------------------

    const [phoneNumbers, setPhoneNumbers] =
        useState('');

    const [assigning, setAssigning] =
        useState(false);


    // ----------------------------------------------------------
    // TEAM LEADS
    // ----------------------------------------------------------

    const [leads, setLeads] =
        useState<SalesLeadResponse[]>([]);

    const [loadingLeads, setLoadingLeads] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);


    // ----------------------------------------------------------
    // FILTERS
    // ----------------------------------------------------------

    const [search, setSearch] =
        useState('');

    const [staffFilter, setStaffFilter] =
        useState<number | null>(null);

    const [outcomeFilter, setOutcomeFilter] =
        useState<SalesLeadOutcome | ''>('');

    const [selectedDate, setSelectedDate] =
        useState('');

    const [showFilters, setShowFilters] =
        useState(false);


    // ----------------------------------------------------------
    // SELECTED LEAD
    // ----------------------------------------------------------

    const [selectedLead, setSelectedLead] =
        useState<SalesLeadResponse | null>(null);


    // ----------------------------------------------------------
    // METRICS
    // ----------------------------------------------------------

    const [metrics, setMetrics] =
        useState<SalesLeadMetrics>({
            callsMade: 0,
            connected: 0,
            respondedWell: 0,
            followUp: 0,
            notConnected: 0,
            otherConnected: 0,
            pending: 0,
        });

    const [loadingMetrics, setLoadingMetrics] =
        useState(true);


    // ==========================================================
    // PHONE NUMBER COUNT
    // ==========================================================

    const parsedNumbers = useMemo(
        () => parsePhoneNumbers(phoneNumbers),
        [phoneNumbers]
    );


    // ==========================================================
    // SELECTED STAFF
    // ==========================================================

    const selectedStaff = useMemo(
        () =>
            teamUsers.find(
                (user) => user.id === selectedUserId
            ) ?? null,
        [teamUsers, selectedUserId]
    );


    // ==========================================================
    // LOAD TEAM USERS
    // ==========================================================

    const loadTeamUsers = useCallback(
        async () => {
            if (!currentBranchId) {
                setTeamUsers([]);
                setLoadingUsers(false);
                return;
            }

            try {
                setLoadingUsers(true);

                const response = await apiRequest<any[]>(
                    '/Users',
                    {
                        method: 'GET',
                    }
                );

                const users = Array.isArray(response)
                    ? response.map(normalizeUser)
                    : [];

                const juniors = users.filter((user) => {
                    const sameBranch =
                        user.branchId === currentBranchId;

                    const active =
                        user.isActive !== false;

                    const role =
                        (user.roleName ?? '').toLowerCase();

                    const designation =
                        (user.designation ?? '').toLowerCase();

                    const isSalesStaff =
                        role === 'sales_staff' ||
                        role === 'sales staff';

                    const isJunior =
                        designation === 'junior';

                    return (
                        sameBranch &&
                        active &&
                        isSalesStaff &&
                        isJunior
                    );
                });

                setTeamUsers(juniors);

                // If current selected user no longer exists,
                // clear the selection.
                if (
                    selectedUserId !== null &&
                    !juniors.some(
                        (user) => user.id === selectedUserId
                    )
                ) {
                    setSelectedUserId(null);
                }
            } catch (error) {
                console.error(
                    'Failed to load sales team:',
                    error
                );

                setTeamUsers([]);
            } finally {
                setLoadingUsers(false);
            }
        },
        [
            currentBranchId,
            selectedUserId,
        ]
    );


    // ==========================================================
    // LOAD TEAM LEADS
    // ==========================================================

    const loadLeads = useCallback(
        async (
            silent = false
        ) => {
            if (!currentBranchId) {
                setLeads([]);
                setLoadingLeads(false);
                return;
            }

            try {
                if (silent) {
                    setRefreshing(true);
                } else {
                    setLoadingLeads(true);
                }

                const params = new URLSearchParams();

                params.append(
                    'branchId',
                    String(currentBranchId)
                );

                if (staffFilter !== null) {
                    params.append(
                        'assignedToUserId',
                        String(staffFilter)
                    );
                }

                if (outcomeFilter) {
                    params.append(
                        'outcome',
                        String(outcomeFilter)
                    );
                }

                if (selectedDate) {
                    params.append(
                        'date',
                        selectedDate
                    );
                }

                const response =
                    await apiRequest<SalesLeadResponse[]>(
                        `/SalesLeads?${params.toString()}`,
                        {
                            method: 'GET',
                        }
                    );

                const normalized =
                    Array.isArray(response)
                        ? response.map(normalizeLead)
                        : [];

                setLeads(normalized);
            } catch (error) {
                console.error(
                    'Failed to load sales leads:',
                    error
                );

                setLeads([]);
            } finally {
                setLoadingLeads(false);
                setRefreshing(false);
            }
        },
        [
            currentBranchId,
            staffFilter,
            outcomeFilter,
            selectedDate,
        ]
    );


    // ==========================================================
    // LOAD METRICS
    // ==========================================================

    const loadMetrics = useCallback(
        async () => {
            if (!currentBranchId) {
                setMetrics({
                    callsMade: 0,
                    connected: 0,
                    respondedWell: 0,
                    followUp: 0,
                    notConnected: 0,
                    otherConnected: 0,
                    pending: 0,
                });

                setLoadingMetrics(false);
                return;
            }

            try {
                setLoadingMetrics(true);

                const params = new URLSearchParams();

                params.append(
                    'branchId',
                    String(currentBranchId)
                );

                const response =
                    await apiRequest<SalesLeadMetrics>(
                        `/SalesLeads/metrics?${params.toString()}`,
                        {
                            method: 'GET',
                        }
                    );

                setMetrics({
                    callsMade: Number(
                        response?.callsMade ?? 0
                    ),
                    connected: Number(
                        response?.connected ?? 0
                    ),
                    respondedWell: Number(
                        response?.respondedWell ?? 0
                    ),
                    followUp: Number(
                        response?.followUp ?? 0
                    ),
                    notConnected: Number(
                        response?.notConnected ?? 0
                    ),
                    otherConnected: Number(
                        response?.otherConnected ?? 0
                    ),
                    pending: Number(
                        response?.pending ?? 0
                    ),
                });
            } catch (error) {
                console.error(
                    'Failed to load sales metrics:',
                    error
                );
            } finally {
                setLoadingMetrics(false);
            }
        },
        [currentBranchId]
    );


    // ==========================================================
    // INITIAL LOAD
    // ==========================================================

    useEffect(() => {
        loadTeamUsers();
    }, [loadTeamUsers]);


    useEffect(() => {
        loadLeads();
    }, [loadLeads]);


    useEffect(() => {
        loadMetrics();
    }, [loadMetrics]);


    // ==========================================================
    // SEARCH FILTER
    // ==========================================================

    const filteredLeads = useMemo(() => {
        const query =
            search.trim().toLowerCase();

        if (!query) {
            return leads;
        }

        return leads.filter((lead) => {
            return (
                lead.phoneNumber
                    ?.toLowerCase()
                    .includes(query) ||
                lead.customerName
                    ?.toLowerCase()
                    .includes(query) ||
                lead.assignedToUserName
                    ?.toLowerCase()
                    .includes(query) ||
                lead.assignedToEmployeeCode
                    ?.toLowerCase()
                    .includes(query) ||
                getSalesLeadOutcomeLabel(
                    lead.outcome
                )
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [leads, search]);


    // ==========================================================
    // ASSIGN LEADS
    // ==========================================================

    const handleAssignLeads = async () => {
        if (!currentBranchId) {
            alert(
                'You are not assigned to a branch.'
            );
            return;
        }

        if (!selectedUserId) {
            alert(
                'Please select a Junior Sales Staff member.'
            );
            return;
        }

        if (parsedNumbers.length === 0) {
            alert(
                'Please enter at least one phone number.'
            );
            return;
        }

        try {
            setAssigning(true);

            const payload: AssignSalesLeadsRequest = {
                branchId: currentBranchId,
                assignedToUserId: selectedUserId,
                leads: parsedNumbers.map(
                    (phoneNumber) => ({
                        phoneNumber,
                        customerName: null,
                    })
                ),
            };

            await apiRequest(
                '/SalesLeads/assign',
                {
                    method: 'POST',
                    body: JSON.stringify(payload),
                }
            );

            setPhoneNumbers('');

            await Promise.all([
                loadLeads(true),
                loadMetrics(),
            ]);

            alert(
                `${parsedNumbers.length} lead${parsedNumbers.length === 1
                    ? ''
                    : 's'
                } assigned successfully to ${selectedStaff?.username ??
                'the selected sales staff'
                }.`
            );
        } catch (error) {
            console.error(
                'Failed to assign sales leads:',
                error
            );

            alert(
                'Failed to assign leads. Please check the entered numbers and try again.'
            );
        } finally {
            setAssigning(false);
        }
    };


    // ==========================================================
    // REFRESH EVERYTHING
    // ==========================================================

    const handleRefresh = async () => {
        await Promise.all([
            loadTeamUsers(),
            loadLeads(true),
            loadMetrics(),
        ]);
    };


    // ==========================================================
    // CLEAR FILTERS
    // ==========================================================

    const clearFilters = () => {
        setSearch('');
        setStaffFilter(null);
        setOutcomeFilter('');
        setSelectedDate('');
    };


    const hasActiveFilters =
        search.trim() !== '' ||
        staffFilter !== null ||
        outcomeFilter !== '' ||
        selectedDate !== '';


    // ==========================================================
    // RENDER
    // ==========================================================

    return (
        <div className="min-h-full bg-transparent text-white">
            <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">

                {/* ====================================================
            HEADER
        ==================================================== */}

                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5C3FE0]/20">
                                <Target
                                    size={20}
                                    className="text-[#A78BFA]"
                                />
                            </div>

                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A78BFA]">
                                Sales Team
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Manage Sales Leads
                        </h1>

                        <p className="mt-1 text-sm text-gray-400">
                            Assign customer numbers to your junior
                            sales team and monitor their call activity.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">

                        <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-[#09071e] px-4 py-2.5 text-sm text-gray-300 sm:flex">
                            <Users
                                size={16}
                                className="text-[#A78BFA]"
                            />

                            <span>
                                {currentBranchName}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={
                                refreshing ||
                                loadingLeads
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#0e0b2e] px-4 py-2.5 text-sm font-medium text-gray-200 transition hover:border-[#5C3FE0]/50 hover:bg-[#15113d] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCw
                                size={16}
                                className={
                                    refreshing
                                        ? 'animate-spin'
                                        : ''
                                }
                            />

                            <span className="hidden sm:inline">
                                Refresh
                            </span>
                        </button>
                    </div>
                </div>


                {/* ====================================================
            METRICS
        ==================================================== */}

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">

                    <MetricCard
                        title="Total Assigned"
                        value={
                            loadingMetrics
                                ? '—'
                                : metrics.callsMade +
                                metrics.pending
                        }
                        icon={
                            <ClipboardList
                                size={18}
                            />
                        }
                        description="All assigned leads"
                    />

                    <MetricCard
                        title="Calls Made"
                        value={
                            loadingMetrics
                                ? '—'
                                : metrics.callsMade
                        }
                        icon={
                            <PhoneCall
                                size={18}
                            />
                        }
                        description="Completed calls"
                    />

                    <MetricCard
                        title="Connected"
                        value={
                            loadingMetrics
                                ? '—'
                                : metrics.connected
                        }
                        icon={
                            <TrendingUp
                                size={18}
                            />
                        }
                        description="All connected outcomes"
                    />

                    <MetricCard
                        title="Pending"
                        value={
                            loadingMetrics
                                ? '—'
                                : metrics.pending
                        }
                        icon={
                            <Clock3
                                size={18}
                            />
                        }
                        description="Waiting for call"
                    />

                    <MetricCard
                        title="Not Connected"
                        value={
                            loadingMetrics
                                ? '—'
                                : metrics.notConnected
                        }
                        icon={
                            <XCircle
                                size={18}
                            />
                        }
                        description="No connection"
                    />
                </div>


                {/* ====================================================
            ASSIGN NEW LEADS
        ==================================================== */}

                <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#09071e] shadow-xl shadow-black/10">

                    <div className="border-b border-white/10 px-5 py-5 sm:px-6">

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                            <div>
                                <div className="flex items-center gap-2">
                                    <UserCheck
                                        size={19}
                                        className="text-[#A78BFA]"
                                    />

                                    <h2 className="text-lg font-semibold">
                                        Assign New Leads
                                    </h2>
                                </div>

                                <p className="mt-1 text-sm text-gray-400">
                                    Select a junior sales staff member
                                    and assign customer phone numbers.
                                </p>
                            </div>

                            <div className="rounded-lg border border-[#5C3FE0]/20 bg-[#5C3FE0]/10 px-3 py-2 text-xs text-[#C4B5FD]">
                                Current branch only
                            </div>
                        </div>
                    </div>


                    <div className="space-y-5 p-5 sm:p-6">

                        {/* Branch + Staff */}

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                            {/* Branch */}

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Branch
                                </label>

                                <div className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-[#0e0b2e] px-4">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5C3FE0]/15">
                                        <Target
                                            size={16}
                                            className="text-[#A78BFA]"
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-white">
                                            {currentBranchName}
                                        </p>

                                        <p className="text-[11px] text-gray-500">
                                            Automatically selected from your
                                            account
                                        </p>
                                    </div>
                                </div>
                            </div>


                            {/* Sales Staff */}

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Junior Sales Staff
                                </label>

                                <div className="relative">
                                    <select
                                        value={
                                            selectedUserId ?? ''
                                        }
                                        onChange={(event) =>
                                            setSelectedUserId(
                                                event.target.value
                                                    ? Number(
                                                        event.target.value
                                                    )
                                                    : null
                                            )
                                        }
                                        disabled={
                                            loadingUsers ||
                                            assigning
                                        }
                                        className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-[#0e0b2e] px-4 pr-10 text-sm text-white outline-none transition focus:border-[#5C3FE0]/70 focus:ring-2 focus:ring-[#5C3FE0]/20 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <option
                                            value=""
                                            className="bg-[#0e0b2e]"
                                        >
                                            {loadingUsers
                                                ? 'Loading sales staff...'
                                                : teamUsers.length === 0
                                                    ? 'No junior staff found'
                                                    : 'Select junior sales staff'}
                                        </option>

                                        {teamUsers.map(
                                            (user) => (
                                                <option
                                                    key={user.id}
                                                    value={user.id}
                                                    className="bg-[#0e0b2e]"
                                                >
                                                    {user.username}
                                                    {user.employeeCode
                                                        ? ` • ${user.employeeCode}`
                                                        : ''}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <ChevronDown
                                        size={17}
                                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                                    />
                                </div>

                                {selectedStaff && (
                                    <p className="mt-2 text-xs text-gray-500">
                                        Assigning to{' '}
                                        <span className="text-gray-300">
                                            {selectedStaff.username}
                                        </span>
                                        {selectedStaff.employeeCode
                                            ? ` (${selectedStaff.employeeCode})`
                                            : ''}
                                    </p>
                                )}
                            </div>
                        </div>


                        {/* Phone Numbers */}

                        <div>
                            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Customer Phone Numbers
                                </label>

                                {parsedNumbers.length > 0 && (
                                    <span className="text-xs font-medium text-[#A78BFA]">
                                        {parsedNumbers.length}{' '}
                                        number
                                        {parsedNumbers.length === 1
                                            ? ''
                                            : 's'}{' '}
                                        ready to assign
                                    </span>
                                )}
                            </div>

                            <textarea
                                value={phoneNumbers}
                                onChange={(event) =>
                                    setPhoneNumbers(
                                        event.target.value
                                    )
                                }
                                disabled={assigning}
                                rows={7}
                                placeholder={`Paste customer numbers here...

Example:
9876543210
9876543211
9876543212

You can also paste comma-separated or semicolon-separated numbers.`}
                                className="w-full resize-y rounded-xl border border-white/10 bg-[#0e0b2e] px-4 py-3 text-sm leading-6 text-white placeholder:text-gray-600 outline-none transition focus:border-[#5C3FE0]/70 focus:ring-2 focus:ring-[#5C3FE0]/20 disabled:cursor-not-allowed disabled:opacity-60"
                            />

                            <div className="mt-2 flex flex-col gap-1 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                                <span>
                                    Duplicate numbers are automatically
                                    removed before assignment.
                                </span>

                                <span>
                                    Supported separators:
                                    newline, comma, semicolon
                                </span>
                            </div>
                        </div>


                        {/* Assignment Preview */}

                        {parsedNumbers.length > 0 && (
                            <div className="rounded-xl border border-[#5C3FE0]/20 bg-[#5C3FE0]/5 p-4">

                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#5C3FE0]/15">
                                        <Phone
                                            size={15}
                                            className="text-[#A78BFA]"
                                        />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-white">
                                            Assignment Preview
                                        </p>

                                        <p className="mt-1 text-xs text-gray-400">
                                            {parsedNumbers.length}{' '}
                                            unique customer number
                                            {parsedNumbers.length === 1
                                                ? ''
                                                : 's'} will be assigned to{' '}
                                            <span className="text-[#C4B5FD]">
                                                {selectedStaff?.username ??
                                                    'the selected junior'}
                                            </span>
                                            .
                                        </p>

                                        <div className="mt-2 flex items-center gap-2 text-xs">
                                            <Clock3
                                                size={14}
                                                className="text-[#A78BFA]"
                                            />

                                            <span className="text-gray-400">
                                                Assignment Date:
                                            </span>

                                            <span className="font-medium text-[#C4B5FD]">
                                                {new Date().toLocaleDateString([], {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {parsedNumbers
                                                .slice(0, 8)
                                                .map((number) => (
                                                    <span
                                                        key={number}
                                                        className="rounded-lg border border-white/10 bg-[#09071e] px-2.5 py-1 text-xs text-gray-300"
                                                    >
                                                        {number}
                                                    </span>
                                                ))}

                                            {parsedNumbers.length > 8 && (
                                                <span className="rounded-lg border border-white/10 bg-[#09071e] px-2.5 py-1 text-xs text-gray-500">
                                                    +{parsedNumbers.length - 8}{' '}
                                                    more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* Assign Button */}

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleAssignLeads}
                                disabled={
                                    assigning ||
                                    loadingUsers ||
                                    !selectedUserId ||
                                    parsedNumbers.length === 0
                                }
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#5C3FE0] px-5 text-sm font-semibold text-white shadow-lg shadow-[#5C3FE0]/20 transition hover:bg-[#6849ef] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {assigning ? (
                                    <>
                                        <Loader2
                                            size={17}
                                            className="animate-spin"
                                        />

                                        Assigning...
                                    </>
                                ) : (
                                    <>
                                        <UserCheck
                                            size={17}
                                        />

                                        Assign Leads
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </section>


                {/* ====================================================
            TEAM LEADS
        ==================================================== */}

                <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#09071e] shadow-xl shadow-black/10">

                    {/* Header */}

                    <div className="border-b border-white/10 px-5 py-5 sm:px-6">

                        <div className="flex flex-col gap-4">

                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                                <div>
                                    <div className="flex items-center gap-2">
                                        <Users
                                            size={19}
                                            className="text-[#A78BFA]"
                                        />

                                        <h2 className="text-lg font-semibold">
                                            Team Lead Activity
                                        </h2>
                                    </div>

                                    <p className="mt-1 text-sm text-gray-400">
                                        Monitor assignments and call
                                        outcomes for your junior sales team.
                                    </p>
                                </div>

                                <div className="text-xs text-gray-500">
                                    {filteredLeads.length}{' '}
                                    {filteredLeads.length === 1
                                        ? 'lead'
                                        : 'leads'}
                                </div>
                            </div>


                            {/* Search + Filters */}

                            <div className="flex flex-col gap-3 lg:flex-row">

                                <div className="relative flex-1">
                                    <Search
                                        size={17}
                                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                                    />

                                    <input
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Search phone, customer, staff or outcome..."
                                        className="h-11 w-full rounded-xl border border-white/10 bg-[#0e0b2e] pl-11 pr-4 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-[#5C3FE0]/70 focus:ring-2 focus:ring-[#5C3FE0]/20"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowFilters(
                                            (value) => !value
                                        )
                                    }
                                    className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${showFilters ||
                                            hasActiveFilters
                                            ? 'border-[#5C3FE0]/50 bg-[#5C3FE0]/10 text-[#C4B5FD]'
                                            : 'border-white/10 bg-[#0e0b2e] text-gray-300 hover:border-white/20'
                                        }`}
                                >
                                    <Filter size={16} />

                                    Filters

                                    {hasActiveFilters && (
                                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#5C3FE0] px-1.5 text-[10px] font-bold text-white">
                                            {[
                                                search.trim() !== '',
                                                staffFilter !== null,
                                                outcomeFilter !== '',
                                                selectedDate !== '',
                                            ].filter(Boolean).length}
                                        </span>
                                    )}

                                    <ChevronDown
                                        size={15}
                                        className={`transition-transform ${showFilters
                                                ? 'rotate-180'
                                                : ''
                                            }`}
                                    />
                                </button>
                            </div>


                            {/* Filters */}

                            {showFilters && (
                                <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-[#0e0b2e] p-4 md:grid-cols-3">

                                    {/* Staff */}

                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-gray-400">
                                            Sales Staff
                                        </label>

                                        <div className="relative">
                                            <select
                                                value={
                                                    staffFilter ?? ''
                                                }
                                                onChange={(event) =>
                                                    setStaffFilter(
                                                        event.target.value
                                                            ? Number(
                                                                event.target
                                                                    .value
                                                            )
                                                            : null
                                                    )
                                                }
                                                className="h-10 w-full appearance-none rounded-lg border border-white/10 bg-[#09071e] px-3 pr-9 text-sm text-white outline-none focus:border-[#5C3FE0]/70"
                                            >
                                                <option
                                                    value=""
                                                    className="bg-[#09071e]"
                                                >
                                                    All Staff
                                                </option>

                                                {teamUsers.map(
                                                    (user) => (
                                                        <option
                                                            key={user.id}
                                                            value={user.id}
                                                            className="bg-[#09071e]"
                                                        >
                                                            {user.username}
                                                        </option>
                                                    )
                                                )}
                                            </select>

                                            <ChevronDown
                                                size={15}
                                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                            />
                                        </div>
                                    </div>


                                    {/* Outcome */}

                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-gray-400">
                                            Outcome
                                        </label>

                                        <div className="relative">
                                            <select
                                                value={
                                                    outcomeFilter
                                                }
                                                onChange={(event) =>
                                                    setOutcomeFilter(
                                                        event.target
                                                            .value as
                                                        | SalesLeadOutcome
                                                        | ''
                                                    )
                                                }
                                                className="h-10 w-full appearance-none rounded-lg border border-white/10 bg-[#09071e] px-3 pr-9 text-sm text-white outline-none focus:border-[#5C3FE0]/70"
                                            >
                                                <option
                                                    value=""
                                                    className="bg-[#09071e]"
                                                >
                                                    All Outcomes
                                                </option>

                                                <option
                                                    value={
                                                        SalesLeadOutcome.Pending
                                                    }
                                                    className="bg-[#09071e]"
                                                >
                                                    Pending
                                                </option>

                                                <option
                                                    value={
                                                        SalesLeadOutcome.Connected
                                                    }
                                                    className="bg-[#09071e]"
                                                >
                                                    Connected
                                                </option>

                                                <option
                                                    value={
                                                        SalesLeadOutcome.RespondedWell
                                                    }
                                                    className="bg-[#09071e]"
                                                >
                                                    Responded Well
                                                </option>

                                                <option
                                                    value={
                                                        SalesLeadOutcome.FollowUp
                                                    }
                                                    className="bg-[#09071e]"
                                                >
                                                    Follow-up
                                                </option>

                                                <option
                                                    value={
                                                        SalesLeadOutcome.NotConnected
                                                    }
                                                    className="bg-[#09071e]"
                                                >
                                                    Not Connected
                                                </option>
                                            </select>

                                            <ChevronDown
                                                size={15}
                                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                            />
                                        </div>
                                    </div>


                                    {/* Date */}

                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-gray-400">
                                            Assigned Date
                                        </label>

                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(event) =>
                                                setSelectedDate(
                                                    event.target.value
                                                )
                                            }
                                            className="h-10 w-full rounded-lg border border-white/10 bg-[#09071e] px-3 text-sm text-white outline-none focus:border-[#5C3FE0]/70"
                                        />
                                    </div>


                                    {/* Clear */}

                                    {hasActiveFilters && (
                                        <div className="md:col-span-3">
                                            <button
                                                type="button"
                                                onClick={
                                                    clearFilters
                                                }
                                                className="inline-flex items-center gap-2 text-xs font-medium text-gray-400 transition hover:text-white"
                                            >
                                                <X size={14} />

                                                Clear all filters
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>


                    {/* ==================================================
              TABLE
          ================================================== */}

                    <div className="overflow-x-auto">

                        {loadingLeads ? (
                            <div className="flex min-h-[320px] items-center justify-center">
                                <div className="flex flex-col items-center gap-3 text-gray-400">
                                    <Loader2
                                        size={26}
                                        className="animate-spin text-[#A78BFA]"
                                    />

                                    <span className="text-sm">
                                        Loading team leads...
                                    </span>
                                </div>
                            </div>
                        ) : filteredLeads.length === 0 ? (
                            <EmptyState
                                hasFilters={
                                    hasActiveFilters
                                }
                                onClear={clearFilters}
                            />
                        ) : (
                            <table className="w-full min-w-[950px] border-collapse">

                                <thead>
                                    <tr className="border-b border-white/10 bg-[#0e0b2e]/70">

                                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                            Customer
                                        </th>

                                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                            Phone
                                        </th>

                                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                            Sales Staff
                                        </th>

                                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                            Assigned
                                        </th>

                                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                            Outcome
                                        </th>

                                        <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                            Details
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredLeads.map(
                                        (lead) => (
                                            <tr
                                                key={
                                                    lead.assignmentId
                                                }
                                                onClick={() =>
                                                    setSelectedLead(
                                                        lead
                                                    )
                                                }
                                                className="cursor-pointer border-b border-white/[0.06] transition hover:bg-[#0e0b2e]/80"
                                            >

                                                {/* Customer */}

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">

                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#5C3FE0]/10">
                                                            <Users
                                                                size={16}
                                                                className="text-[#A78BFA]"
                                                            />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="max-w-[180px] truncate text-sm font-medium text-white">
                                                                {lead.customerName ||
                                                                    'Customer'}
                                                            </p>

                                                            <p className="text-[11px] text-gray-500">
                                                                #{lead.salesLeadId}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>


                                                {/* Phone */}

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Phone
                                                            size={14}
                                                            className="text-gray-500"
                                                        />

                                                        <span className="text-sm text-gray-300">
                                                            {lead.phoneNumber}
                                                        </span>
                                                    </div>
                                                </td>


                                                {/* Staff */}

                                                <td className="px-5 py-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-200">
                                                            {
                                                                lead.assignedToUserName
                                                            }
                                                        </p>

                                                        {lead.assignedToEmployeeCode && (
                                                            <p className="mt-0.5 text-[11px] text-gray-500">
                                                                {
                                                                    lead.assignedToEmployeeCode
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>


                                                {/* Assigned */}

                                                <td className="px-5 py-4">
                                                    <div>
                                                        <p className="text-sm text-gray-300">
                                                            {formatDate(
                                                                lead.assignedAtUtc
                                                            )}
                                                        </p>

                                                        <p className="mt-0.5 text-[11px] text-gray-500">
                                                            {formatDateTime(
                                                                lead.assignedAtUtc
                                                            ).split(', ')[1] ??
                                                                ''}
                                                        </p>
                                                    </div>
                                                </td>


                                                {/* Outcome */}

                                                <td className="px-5 py-4">
                                                    <OutcomeBadge
                                                        outcome={
                                                            lead.outcome
                                                        }
                                                    />
                                                </td>


                                                {/* Details */}

                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={(
                                                            event
                                                        ) => {
                                                            event.stopPropagation();

                                                            setSelectedLead(
                                                                lead
                                                            );
                                                        }}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:border-[#5C3FE0]/40 hover:bg-[#5C3FE0]/10 hover:text-white"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            </div>


            {/* ======================================================
          LEAD DETAIL MODAL
      ====================================================== */}

            {selectedLead && (
                <LeadDetailsModal
                    lead={selectedLead}
                    onClose={() =>
                        setSelectedLead(null)
                    }
                />
            )}
        </div>
    );
};


// ============================================================
// METRIC CARD
// ============================================================

interface MetricCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    description: string;
}

const MetricCard: React.FC<
    MetricCardProps
> = ({
    title,
    value,
    icon,
    description,
}) => {
        return (
            <div className="rounded-2xl border border-white/10 bg-[#09071e] p-4 shadow-lg shadow-black/5 transition hover:border-[#5C3FE0]/30">

                <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-gray-500">
                            {title}
                        </p>

                        <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                            {value}
                        </p>

                        <p className="mt-1 truncate text-[11px] text-gray-600">
                            {description}
                        </p>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5C3FE0]/10 text-[#A78BFA]">
                        {icon}
                    </div>
                </div>
            </div>
        );
    };


// ============================================================
// OUTCOME BADGE
// ============================================================

interface OutcomeBadgeProps {
    outcome: SalesLeadOutcome;
}

const OutcomeBadge: React.FC<
    OutcomeBadgeProps
> = ({
    outcome,
}) => {
        return (
            <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getOutcomeBadgeClass(
                    outcome
                )}`}
            >
                {getOutcomeIcon(outcome)}

                {getSalesLeadOutcomeLabel(
                    outcome
                )}
            </span>
        );
    };


// ============================================================
// EMPTY STATE
// ============================================================

interface EmptyStateProps {
    hasFilters: boolean;
    onClear: () => void;
}

const EmptyState: React.FC<
    EmptyStateProps
> = ({
    hasFilters,
    onClear,
}) => {
        return (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5C3FE0]/10">
                    <ClipboardList
                        size={25}
                        className="text-[#A78BFA]"
                    />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-white">
                    {hasFilters
                        ? 'No leads match your filters'
                        : 'No team leads yet'}
                </h3>

                <p className="mt-1 max-w-md text-xs leading-5 text-gray-500">
                    {hasFilters
                        ? 'Try changing your search or filters to see more team activity.'
                        : 'Assign customer phone numbers to a junior sales staff member to start tracking team activity.'}
                </p>

                {hasFilters && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-[#5C3FE0]/40 hover:bg-[#5C3FE0]/10 hover:text-white"
                    >
                        <X size={14} />

                        Clear filters
                    </button>
                )}
            </div>
        );
    };


// ============================================================
// LEAD DETAILS MODAL
// ============================================================

interface LeadDetailsModalProps {
    lead: SalesLeadResponse;
    onClose: () => void;
}

const LeadDetailsModal: React.FC<
    LeadDetailsModalProps
> = ({
    lead,
    onClose,
}) => {
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                onMouseDown={(event) => {
                    if (
                        event.target ===
                        event.currentTarget
                    ) {
                        onClose();
                    }
                }}
            >

                <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#09071e] shadow-2xl shadow-black/40">

                    {/* Modal Header */}

                    <div className="flex items-start justify-between border-b border-white/10 px-5 py-5">

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#A78BFA]">
                                Lead Details
                            </p>

                            <h3 className="mt-1 text-lg font-semibold text-white">
                                Customer Lead
                            </h3>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white/5 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>


                    {/* Modal Content */}

                    <div className="space-y-5 p-5">

                        {/* Phone */}

                        <div className="rounded-xl border border-white/10 bg-[#0e0b2e] p-4">

                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                Customer Phone
                            </p>

                            <div className="mt-2 flex items-center gap-3">
                                <Phone
                                    size={17}
                                    className="text-[#A78BFA]"
                                />

                                <span className="text-lg font-semibold text-white">
                                    {lead.phoneNumber}
                                </span>
                            </div>

                            {lead.customerName && (
                                <p className="mt-2 text-sm text-gray-400">
                                    {lead.customerName}
                                </p>
                            )}
                        </div>


                        {/* Assignment Information */}

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                            <DetailItem
                                label="Sales Staff"
                                value={
                                    lead.assignedToUserName
                                }
                                secondary={
                                    lead.assignedToEmployeeCode
                                }
                            />

                            <DetailItem
                                label="Branch"
                                value={
                                    lead.branchName
                                }
                            />

                            <DetailItem
                                label="Assigned By"
                                value={
                                    lead.assignedByUserName
                                }
                            />

                            <DetailItem
                                label="Assigned At"
                                value={
                                    formatDateTime(
                                        lead.assignedAtUtc
                                    )
                                }
                            />

                            <DetailItem
                                label="Current Outcome"
                                value={
                                    <OutcomeBadge
                                        outcome={
                                            lead.outcome
                                        }
                                    />
                                }
                            />

                            <DetailItem
                                label="Completed At"
                                value={
                                    lead.completedAtUtc
                                        ? formatDateTime(
                                            lead.completedAtUtc
                                        )
                                        : 'Not completed'
                                }
                            />
                        </div>


                        {/* Notes */}

                        <div className="rounded-xl border border-white/10 bg-[#0e0b2e] p-4">

                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                Notes
                            </p>

                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-300">
                                {lead.notes ||
                                    'No notes added by the sales staff.'}
                            </p>
                        </div>


                        {/* Read Only Notice */}

                        <div className="flex items-start gap-3 rounded-xl border border-[#5C3FE0]/20 bg-[#5C3FE0]/5 p-3.5">

                            <AlertCircle
                                size={17}
                                className="mt-0.5 shrink-0 text-[#A78BFA]"
                            />

                            <p className="text-xs leading-5 text-gray-400">
                                Lead outcomes are updated by the assigned
                                Junior Sales Staff. This screen is
                                read-only for team monitoring.
                            </p>
                        </div>
                    </div>


                    {/* Modal Footer */}

                    <div className="flex justify-end border-t border-white/10 px-5 py-4">

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-white/10 bg-[#0e0b2e] px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };


// ============================================================
// DETAIL ITEM
// ============================================================

interface DetailItemProps {
    label: string;
    value: React.ReactNode;
    secondary?: string | null;
}

const DetailItem: React.FC<
    DetailItemProps
> = ({
    label,
    value,
    secondary,
}) => {
        return (
            <div className="rounded-xl border border-white/10 bg-[#0e0b2e] p-4">

                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {label}
                </p>

                <div className="mt-2 text-sm font-medium text-gray-200">
                    {value}
                </div>

                {secondary && (
                    <p className="mt-1 text-[11px] text-gray-500">
                        {secondary}
                    </p>
                )}
            </div>
        );
    };


export default SeniorSalesLeadsView;