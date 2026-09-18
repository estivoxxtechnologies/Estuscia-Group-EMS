import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    Clock3,
    Loader2,
    Phone,
    PhoneCall,
    RefreshCw,
    Search,
    User,
    XCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';

import {
    getMySalesLeads,
    getSalesLeadOutcomeLabel,
    SalesLeadOutcome,
    SalesLeadResponse,
    updateSalesLeadOutcome,
} from '../api/salesLeads';

/* ============================================================
   TYPES
============================================================ */

type OutcomeFilter = 'all' | SalesLeadOutcome;

interface MySalesLeadsViewProps {
    currentUser?: {
        userId?: number;
        branchId?: number | null;
        roleName?: string;
        designation?: string | null;
    } | null;
}

/* ============================================================
   COMPONENT
============================================================ */

const MySalesLeadsView: React.FC<MySalesLeadsViewProps> = ({
    currentUser,
}) => {
    const [leads, setLeads] = useState<SalesLeadResponse[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState('');
    const [outcomeFilter, setOutcomeFilter] =
        useState<OutcomeFilter>('all');

    const [selectedDate, setSelectedDate] = useState('');

    const [selectedLead, setSelectedLead] =
        useState<SalesLeadResponse | null>(null);

    const [updatingId, setUpdatingId] =
        useState<number | null>(null);

    const [newOutcome, setNewOutcome] =
        useState<SalesLeadOutcome>(SalesLeadOutcome.Pending);

    const [notes, setNotes] = useState('');

    /* ============================================================
       LOAD DATA
    ============================================================ */

    const loadLeads = useCallback(
        async (showRefresh = false) => {
            try {
                if (showRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                const result = await getMySalesLeads(
                    outcomeFilter === 'all'
                        ? undefined
                        : outcomeFilter,
                    selectedDate || undefined
                );

                setLeads(result ?? []);
            } catch (error) {
                console.error('Failed to load sales leads:', error);

                toast.error(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load sales leads.'
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [outcomeFilter, selectedDate]
    );

    useEffect(() => {
        loadLeads();
    }, [loadLeads]);

    /* ============================================================
       FILTER SEARCH
    ============================================================ */

    const filteredLeads = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) {
            return leads;
        }

        return leads.filter((lead) => {
            return (
                lead.phoneNumber
                    ?.toLowerCase()
                    .includes(value) ||
                lead.customerName
                    ?.toLowerCase()
                    .includes(value) ||
                lead.branchName
                    ?.toLowerCase()
                    .includes(value)
            );
        });
    }, [leads, search]);

    /* ============================================================
       METRICS
    ============================================================ */

    const metrics = useMemo(() => {
        const callsMade = leads.length;

        const notConnected = leads.filter(
            (x) => x.outcome === SalesLeadOutcome.NotConnected
        ).length;

        const respondedWell = leads.filter(
            (x) => x.outcome === SalesLeadOutcome.RespondedWell
        ).length;

        const followUp = leads.filter(
            (x) => x.outcome === SalesLeadOutcome.FollowUp
        ).length;

        const connected = leads.filter(
            (x) =>
                x.outcome === SalesLeadOutcome.Connected ||
                x.outcome === SalesLeadOutcome.RespondedWell ||
                x.outcome === SalesLeadOutcome.FollowUp
        ).length;

        const pending = leads.filter(
            (x) => x.outcome === SalesLeadOutcome.Pending
        ).length;

        return {
            callsMade,
            connected,
            notConnected,
            respondedWell,
            followUp,
            pending,
        };
    }, [leads]);

    /* ============================================================
       OPEN OUTCOME MODAL
    ============================================================ */

    const openOutcomeModal = (lead: SalesLeadResponse) => {
        setSelectedLead(lead);
        setNewOutcome(lead.outcome);
        setNotes(lead.notes ?? '');
    };

    /* ============================================================
       CLOSE OUTCOME MODAL
    ============================================================ */

    const closeOutcomeModal = () => {
        if (updatingId !== null) {
            return;
        }

        setSelectedLead(null);
        setNotes('');
        setNewOutcome(SalesLeadOutcome.Pending);
    };

    /* ============================================================
       UPDATE OUTCOME
    ============================================================ */

    const handleUpdateOutcome = async () => {
        if (!selectedLead) {
            return;
        }

        try {
            setUpdatingId(selectedLead.assignmentId);

            const updated = await updateSalesLeadOutcome(
                selectedLead.assignmentId,
                {
                    outcome: newOutcome,
                    notes: notes.trim() || null,
                }
            );

            console.log('Updated lead:', updated);

            setLeads((current) =>
                current.map((lead) =>
                    lead.assignmentId === updated.assignmentId
                        ? updated
                        : lead
                )
            );

            toast.success('Lead outcome updated successfully.');

            setSelectedLead(null);
            setNotes('');
            setNewOutcome(SalesLeadOutcome.Pending);
        } catch (error) {
            console.error(
                'Failed to update sales lead outcome:',
                error
            );

            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to update lead outcome.'
            );
        } finally {
            setUpdatingId(null);
        }
    };

    /* ============================================================
       DATE FORMAT
    ============================================================ */

    const formatDateTime = (value: string) => {
        if (!value) {
            return '-';
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    /* ============================================================
       OUTCOME BADGE
    ============================================================ */

    const getOutcomeClass = (
        outcome: SalesLeadOutcome
    ) => {
        switch (outcome) {
            case SalesLeadOutcome.RespondedWell:
                return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';

            case SalesLeadOutcome.FollowUp:
                return 'bg-amber-500/15 text-amber-300 border-amber-500/20';

            case SalesLeadOutcome.Connected:
                return 'bg-blue-500/15 text-blue-300 border-blue-500/20';

            case SalesLeadOutcome.NotConnected:
                return 'bg-red-500/15 text-red-300 border-red-500/20';

            case SalesLeadOutcome.Pending:
            default:
                return 'bg-slate-500/15 text-slate-300 border-slate-500/20';
        }
    };

    /* ============================================================
       RENDER
    ============================================================ */

    return (
        <div className="min-h-full bg-[#07051a] text-white p-4 md:p-6">
            <div className="mx-auto max-w-7xl space-y-6">

                {/* ======================================================
            HEADER
        ====================================================== */}

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5C3FE0]/15 border border-[#5C3FE0]/20">
                                <PhoneCall
                                    size={22}
                                    className="text-[#A78BFA]"
                                />
                            </div>

                            <div>
                                <h1 className="text-xl font-semibold">
                                    My Sales Leads
                                </h1>

                                <p className="text-sm text-slate-400">
                                    Manage your assigned customer numbers and
                                    call outcomes.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => loadLeads(true)}
                        disabled={refreshing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {refreshing ? (
                            <Loader2
                                size={17}
                                className="animate-spin"
                            />
                        ) : (
                            <RefreshCw size={17} />
                        )}

                        Refresh
                    </button>
                </div>

                {/* ======================================================
            METRICS
        ====================================================== */}

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">

                    <MetricCard
                        icon={<PhoneCall size={18} />}
                        label="Calls Made"
                        value={metrics.callsMade}
                    />

                    <MetricCard
                        icon={<CheckCircle2 size={18} />}
                        label="Connected"
                        value={metrics.connected}
                    />

                    <MetricCard
                        icon={<CheckCircle2 size={18} />}
                        label="Responded Well"
                        value={metrics.respondedWell}
                    />

                    <MetricCard
                        icon={<Clock3 size={18} />}
                        label="Follow-up"
                        value={metrics.followUp}
                    />

                    <MetricCard
                        icon={<XCircle size={18} />}
                        label="Not Connected"
                        value={metrics.notConnected}
                    />

                    <MetricCard
                        icon={<Clock3 size={18} />}
                        label="Pending"
                        value={metrics.pending}
                    />

                </div>

                {/* ======================================================
            FILTERS
        ====================================================== */}

                <div className="rounded-2xl border border-white/10 bg-[#0b0924] p-4">

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

                        {/* SEARCH */}

                        <div className="relative flex-1">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                placeholder="Search phone number or customer name..."
                                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#5C3FE0]/60"
                            />
                        </div>

                        {/* OUTCOME */}

                        <div className="relative">
                            <select
                                value={String(outcomeFilter)}
                                onChange={(e) => {
                                    const value = e.target.value;

                                    if (value === 'all') {
                                        setOutcomeFilter('all');
                                    } else {
                                        setOutcomeFilter(value as SalesLeadOutcome);
                                    }
                                }}
                                className="appearance-none rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-4 pr-10 text-sm text-white outline-none focus:border-[#5C3FE0]/60"
                            >
                                <option
                                    value="all"
                                    className="bg-[#0b0924]"
                                >
                                    All Outcomes
                                </option>

                                <option
                                    value={SalesLeadOutcome.Pending}
                                    className="bg-[#0b0924]"
                                >
                                    Pending
                                </option>

                                <option
                                    value={SalesLeadOutcome.Connected}
                                    className="bg-[#0b0924]"
                                >
                                    Connected
                                </option>

                                <option
                                    value={SalesLeadOutcome.RespondedWell}
                                    className="bg-[#0b0924]"
                                >
                                    Responded Well
                                </option>

                                <option
                                    value={SalesLeadOutcome.FollowUp}
                                    className="bg-[#0b0924]"
                                >
                                    Follow-up
                                </option>

                                <option
                                    value={SalesLeadOutcome.NotConnected}
                                    className="bg-[#0b0924]"
                                >
                                    Not Connected
                                </option>
                            </select>

                            <ChevronDown
                                size={16}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                            />
                        </div>

                        {/* DATE */}

                        <div className="relative">
                            <CalendarDays
                                size={17}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                            />

                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) =>
                                    setSelectedDate(e.target.value)
                                }
                                className="rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-[#5C3FE0]/60"
                            />
                        </div>

                        {/* CLEAR */}

                        {(search ||
                            selectedDate ||
                            outcomeFilter !== 'all') && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        setSelectedDate('');
                                        setOutcomeFilter('all');
                                    }}
                                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.08]"
                                >
                                    Clear
                                </button>
                            )}

                    </div>
                </div>

                {/* ======================================================
            CONTENT
        ====================================================== */}

                {loading ? (
                    <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-white/10 bg-[#0b0924]">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                            <Loader2
                                size={30}
                                className="animate-spin text-[#A78BFA]"
                            />

                            <span className="text-sm">
                                Loading your sales leads...
                            </span>
                        </div>
                    </div>
                ) : filteredLeads.length === 0 ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0b0924] px-6 text-center">

                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
                            <Phone
                                size={25}
                                className="text-slate-500"
                            />
                        </div>

                        <h3 className="text-base font-medium text-slate-200">
                            No sales leads found
                        </h3>

                        <p className="mt-1 max-w-md text-sm text-slate-500">
                            {leads.length === 0
                                ? 'You currently have no assigned sales leads.'
                                : 'No leads match your current search or filters.'}
                        </p>

                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0924]">

                        {/* TABLE HEADER */}

                        <div className="hidden border-b border-white/10 bg-white/[0.02] px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[60px_1.5fr_1fr_1fr_1.2fr_130px] md:gap-4">

                            <div>#</div>

                            <div>Customer</div>

                            <div>Phone</div>

                            <div>Branch</div>

                            <div>Assigned</div>

                            <div>Outcome</div>

                        </div>

                        {/* ROWS */}

                        <div className="divide-y divide-white/5">

                            {filteredLeads.map((lead, index) => (
                                <button
                                    key={lead.assignmentId}
                                    type="button"
                                    onClick={() =>
                                        openOutcomeModal(lead)
                                    }
                                    className="group w-full text-left transition hover:bg-white/[0.035]"
                                >

                                    <div className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-[60px_1.5fr_1fr_1fr_1.2fr_130px] md:items-center md:gap-4">

                                        {/* NUMBER */}

                                        <div className="hidden text-sm text-slate-500 md:block">
                                            {index + 1}
                                        </div>

                                        {/* CUSTOMER */}

                                        <div className="min-w-0">

                                            <div className="flex items-center gap-2">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#5C3FE0]/10">
                                                    <User
                                                        size={16}
                                                        className="text-[#A78BFA]"
                                                    />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-slate-200">
                                                        {lead.customerName ||
                                                            'Unknown Customer'}
                                                    </p>

                                                    <p className="text-xs text-slate-500">
                                                        Assignment #{lead.assignmentId}
                                                    </p>
                                                </div>
                                            </div>

                                        </div>

                                        {/* PHONE */}

                                        <div>
                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                <Phone
                                                    size={15}
                                                    className="text-slate-500"
                                                />

                                                {lead.phoneNumber}
                                            </div>
                                        </div>

                                        {/* BRANCH */}

                                        <div>
                                            <p className="text-sm text-slate-300">
                                                {lead.branchName || '-'}
                                            </p>
                                        </div>

                                        {/* ASSIGNED */}

                                        <div>
                                            <p className="text-sm text-slate-300">
                                                {formatDateTime(
                                                    lead.assignedAtUtc
                                                )}
                                            </p>

                                            <p className="mt-0.5 text-xs text-slate-500">
                                                By {lead.assignedByUserName}
                                            </p>
                                        </div>

                                        {/* OUTCOME */}

                                        <div>
                                            <span
                                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getOutcomeClass(
                                                    lead.outcome
                                                )}`}
                                            >
                                                {getSalesLeadOutcomeLabel(
                                                    lead.outcome
                                                )}
                                            </span>
                                        </div>

                                    </div>

                                    {/* MOBILE DETAILS */}

                                    <div className="border-t border-white/5 px-5 py-3 md:hidden">

                                        <div className="flex items-center justify-between gap-3">

                                            <div className="text-xs text-slate-500">
                                                {lead.branchName}
                                            </div>

                                            <span
                                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getOutcomeClass(
                                                    lead.outcome
                                                )}`}
                                            >
                                                {getSalesLeadOutcomeLabel(
                                                    lead.outcome
                                                )}
                                            </span>

                                        </div>

                                    </div>

                                </button>
                            ))}

                        </div>
                    </div>
                )}

                {/* ======================================================
            FOOTER COUNT
        ====================================================== */}

                {!loading && leads.length > 0 && (
                    <div className="flex items-center justify-between px-1 text-xs text-slate-500">
                        <span>
                            Showing {filteredLeads.length} of {leads.length}{' '}
                            leads
                        </span>

                        {currentUser?.designation && (
                            <span>
                                {currentUser.designation}
                            </span>
                        )}
                    </div>
                )}

            </div>

            {/* ========================================================
          OUTCOME MODAL
      ======================================================== */}

            {selectedLead && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            closeOutcomeModal();
                        }
                    }}
                >

                    <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0e0b2e] shadow-2xl">

                        {/* MODAL HEADER */}

                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

                            <div>
                                <h2 className="text-base font-semibold text-white">
                                    Update Call Outcome
                                </h2>

                                <p className="mt-0.5 text-xs text-slate-500">
                                    Assignment #{selectedLead.assignmentId}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeOutcomeModal}
                                disabled={updatingId !== null}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                            >
                                <XCircle size={19} />
                            </button>

                        </div>

                        {/* MODAL BODY */}

                        <div className="space-y-5 p-5">

                            {/* CUSTOMER */}

                            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">

                                <div className="flex items-start gap-3">

                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5C3FE0]/15">
                                        <User
                                            size={18}
                                            className="text-[#A78BFA]"
                                        />
                                    </div>

                                    <div className="min-w-0 flex-1">

                                        <p className="font-medium text-slate-200">
                                            {selectedLead.customerName ||
                                                'Unknown Customer'}
                                        </p>

                                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                                            <Phone size={14} />

                                            {selectedLead.phoneNumber}
                                        </div>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {selectedLead.branchName}
                                        </p>

                                    </div>

                                </div>

                            </div>

                            {/* OUTCOME */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Call Outcome
                                </label>

                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                                    <OutcomeButton
                                        selected={
                                            newOutcome ===
                                            SalesLeadOutcome.Pending
                                        }
                                        outcome={
                                            SalesLeadOutcome.Pending
                                        }
                                        onClick={setNewOutcome}
                                    />

                                    <OutcomeButton
                                        selected={
                                            newOutcome ===
                                            SalesLeadOutcome.Connected
                                        }
                                        outcome={
                                            SalesLeadOutcome.Connected
                                        }
                                        onClick={setNewOutcome}
                                    />

                                    <OutcomeButton
                                        selected={
                                            newOutcome ===
                                            SalesLeadOutcome.RespondedWell
                                        }
                                        outcome={
                                            SalesLeadOutcome.RespondedWell
                                        }
                                        onClick={setNewOutcome}
                                    />

                                    <OutcomeButton
                                        selected={
                                            newOutcome ===
                                            SalesLeadOutcome.FollowUp
                                        }
                                        outcome={
                                            SalesLeadOutcome.FollowUp
                                        }
                                        onClick={setNewOutcome}
                                    />

                                    <OutcomeButton
                                        selected={
                                            newOutcome ===
                                            SalesLeadOutcome.NotConnected
                                        }
                                        outcome={
                                            SalesLeadOutcome.NotConnected
                                        }
                                        onClick={setNewOutcome}
                                    />

                                </div>

                            </div>

                            {/* NOTES */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Notes
                                    <span className="ml-1 text-slate-500">
                                        (optional)
                                    </span>
                                </label>

                                <textarea
                                    value={notes}
                                    onChange={(e) =>
                                        setNotes(e.target.value)
                                    }
                                    rows={4}
                                    placeholder="Add notes about the conversation..."
                                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#5C3FE0]/60"
                                />

                            </div>

                        </div>

                        {/* MODAL FOOTER */}

                        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-5 py-4">

                            <button
                                type="button"
                                onClick={closeOutcomeModal}
                                disabled={updatingId !== null}
                                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleUpdateOutcome}
                                disabled={
                                    updatingId !== null
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-[#5C3FE0] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#6849ef] disabled:cursor-not-allowed disabled:opacity-50"
                            >

                                {updatingId !== null ? (
                                    <>
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />

                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={16} />

                                        Save Outcome
                                    </>
                                )}

                            </button>

                        </div>

                    </div>

                </div>
            )}
        </div>
    );
};

/* ============================================================
   METRIC CARD
============================================================ */

interface MetricCardProps {
    icon: React.ReactNode;
    label: string;
    value: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
    icon,
    label,
    value,
}) => {
    return (
        <div className="rounded-2xl border border-white/10 bg-[#0b0924] p-4">

            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#5C3FE0]/10 text-[#A78BFA]">
                {icon}
            </div>

            <p className="text-xs text-slate-500">
                {label}
            </p>

            <p className="mt-1 text-2xl font-semibold text-white">
                {value}
            </p>

        </div>
    );
};

/* ============================================================
   OUTCOME BUTTON
============================================================ */

interface OutcomeButtonProps {
    outcome: SalesLeadOutcome;
    selected: boolean;
    onClick: (outcome: SalesLeadOutcome) => void;
}

const OutcomeButton: React.FC<OutcomeButtonProps> = ({
    outcome,
    selected,
    onClick,
}) => {
    const label = getSalesLeadOutcomeLabel(outcome);

    return (
        <button
            type="button"
            onClick={() => onClick(outcome)}
            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${selected
                ? 'border-[#5C3FE0] bg-[#5C3FE0]/15 text-[#C4B5FD]'
                : 'border-white/10 bg-white/[0.025] text-slate-300 hover:bg-white/[0.06]'
                }`}
        >
            <div className="flex items-center justify-between">

                <span>{label}</span>

                {selected && (
                    <CheckCircle2
                        size={17}
                        className="text-[#A78BFA]"
                    />
                )}

            </div>
        </button>
    );
};

export default MySalesLeadsView;