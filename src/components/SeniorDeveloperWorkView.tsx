import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    Calendar,
    CheckCircle2,
    ChevronDown,
    Clock3,
    Code2,
    Loader2,
    PauseCircle,
    PlayCircle,
    Plus,
    RefreshCw,
    Search,
    User,
    X,
    Edit3,
    Save
} from 'lucide-react';

import { toast } from 'react-toastify';

import { useApp } from '../context/AppContext';

import {
    DeveloperWorkPriority,
    DeveloperWorkResponse,
    DeveloperWorkStatus,
    DeveloperWorkType,
    createDeveloperWork,
    getDeveloperTeamWork,
    getDeveloperWorkPriorityLabel,
    getDeveloperWorkStatusLabel,
    getDeveloperWorkTypeLabel,
    updateDeveloperWork,
    updateDeveloperWorkStatus,
} from '../api/developerWork';

import { apiRequest } from '../api/client';

interface DeveloperUser {
    id: number;
    username?: string;
    email?: string;
    employeeCode?: string | null;
    roleName?: string;
    designation?: string;
    branchId?: number | null;
    isActive?: boolean;
}

const STATUS_COLUMNS = [
    DeveloperWorkStatus.Pending,
    DeveloperWorkStatus.InProgress,
    DeveloperWorkStatus.OnHold,
    DeveloperWorkStatus.Completed,
];

const SeniorDeveloperWorkView: React.FC = () => {
    const { currentUser } = useApp();

    const [works, setWorks] =
        useState<DeveloperWorkResponse[]>([]);

    const [developers, setDevelopers] =
        useState<DeveloperUser[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [showCreate, setShowCreate] =
        useState(false);

    const [selectedWork, setSelectedWork] =
        useState<DeveloperWorkResponse | null>(null);

    const [search, setSearch] =
        useState('');

    const [developerFilter, setDeveloperFilter] =
        useState<number | undefined>();

    const [statusFilter, setStatusFilter] =
        useState<DeveloperWorkStatus | undefined>();

    const [creating, setCreating] =
        useState(false);

    const [editing, setEditing] =
        useState(false);

    const [savingEdit, setSavingEdit] =
        useState(false);

    const [changingStatus, setChangingStatus] =
        useState(false);

    const [editTitle, setEditTitle] =
        useState('');

    const [editDescription, setEditDescription] =
        useState('');

    const [editWorkType, setEditWorkType] =
        useState<DeveloperWorkType>(
            DeveloperWorkType.Other
        );

    const [editPriority, setEditPriority] =
        useState<DeveloperWorkPriority>(
            DeveloperWorkPriority.Medium
        );

    const [editDueDate, setEditDueDate] =
        useState('');



    const [completionNotes, setCompletionNotes] =
        useState('');
    // ============================================================
    // FORM
    // ============================================================

    const [title, setTitle] =
        useState('');

    const [description, setDescription] =
        useState('');

    const [assignedToUserId, setAssignedToUserId] =
        useState<number | ''>('');

    const [workType, setWorkType] =
        useState<DeveloperWorkType>(
            DeveloperWorkType.Other
        );

    const [priority, setPriority] =
        useState<DeveloperWorkPriority>(
            DeveloperWorkPriority.Medium
        );

    const [dueDate, setDueDate] =
        useState('');

    // ============================================================
    // LOAD DEVELOPERS
    // ============================================================

    const loadDevelopers =
        useCallback(async () => {
            try {
                const users =
                    await apiRequest<DeveloperUser[]>(
                        '/Users',
                        {
                            method: 'GET',
                        }
                    );

                const normalized =
                    Array.isArray(users)
                        ? users.filter(user => {
                            const role =
                                user.roleName
                                    ?.toLowerCase();

                            const designation =
                                user.designation
                                    ?.toLowerCase();

                            return (
                                user.isActive !== false &&
                                role === 'developer' &&
                                designation === 'junior' &&
                                (
                                    currentUser?.roleName
                                        ?.toLowerCase() ===
                                    'company_admin' ||
                                    currentUser?.roleName
                                        ?.toLowerCase() ===
                                    'hr_ops' ||
                                    user.branchId ===
                                    currentUser?.branchId
                                )
                            );
                        })
                        : [];

                setDevelopers(normalized);
            } catch (error) {
                console.error(error);

                toast.error(
                    'Unable to load developers.'
                );
            }
        }, [currentUser]);

    // ============================================================
    // LOAD WORK
    // ============================================================

    const loadWorks = useCallback(
        async (showRefresh = false) => {
            try {
                if (showRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                const data =
                    await getDeveloperTeamWork(
                        currentUser?.branchId ?? undefined
                    );

                setWorks(
                    Array.isArray(data)
                        ? data
                        : []
                );
            } catch (error) {
                console.error(error);

                toast.error(
                    'Unable to load developer work.'
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [currentUser]
    );

    useEffect(() => {
        loadDevelopers();
    }, [loadDevelopers]);

    useEffect(() => {
        loadWorks();
    }, [loadWorks]);

    // ============================================================
    // FILTER
    // ============================================================

    const filteredWorks =
        useMemo(() => {
            const value =
                search
                    .trim()
                    .toLowerCase();

            return works.filter(work => {
                if (
                    developerFilter !== undefined &&
                    work.assignedToUserId !==
                    developerFilter
                ) {
                    return false;
                }

                if (
                    statusFilter !== undefined &&
                    work.status !== statusFilter
                ) {
                    return false;
                }

                if (!value) {
                    return true;
                }

                return [
                    work.title,
                    work.description,
                    work.assignedToUserName,
                    work.assignedByUserName,
                    work.branchName,
                    getDeveloperWorkTypeLabel(
                        work.workType
                    ),
                ]
                    .filter(Boolean)
                    .some(item =>
                        item
                            .toLowerCase()
                            .includes(value)
                    );
            });
        }, [
            works,
            search,
            developerFilter,
            statusFilter,
        ]);

    // ============================================================
    // COUNTS
    // ============================================================

    const counts = useMemo(() => ({
        pending:
            works.filter(
                x =>
                    x.status ===
                    DeveloperWorkStatus.Pending
            ).length,

        inProgress:
            works.filter(
                x =>
                    x.status ===
                    DeveloperWorkStatus.InProgress
            ).length,

        onHold:
            works.filter(
                x =>
                    x.status ===
                    DeveloperWorkStatus.OnHold
            ).length,

        completed:
            works.filter(
                x =>
                    x.status ===
                    DeveloperWorkStatus.Completed
            ).length,
    }), [works]);

    // ============================================================
    // CREATE
    // ============================================================

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setAssignedToUserId('');
        setWorkType(
            DeveloperWorkType.Other
        );
        setPriority(
            DeveloperWorkPriority.Medium
        );
        setDueDate('');
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            toast.error(
                'Please enter a work title.'
            );

            return;
        }

        if (!description.trim()) {
            toast.error(
                'Please enter a work description.'
            );

            return;
        }

        if (!assignedToUserId) {
            toast.error(
                'Please select a developer.'
            );

            return;
        }

        if (!currentUser?.branchId) {
            toast.error(
                'Your branch could not be determined.'
            );

            return;
        }

        try {
            setCreating(true);

            const created =
                await createDeveloperWork({
                    branchId:
                        currentUser.branchId,

                    assignedToUserId:
                        Number(assignedToUserId),

                    title:
                        title.trim(),

                    description:
                        description.trim(),

                    workType,

                    priority,

                    dueDateUtc:
                        dueDate
                            ? new Date(
                                `${dueDate}T23:59:59`
                            ).toISOString()
                            : null,
                });

            setWorks(current => [
                created,
                ...current,
            ]);

            toast.success(
                'Developer work assigned successfully.'
            );

            setShowCreate(false);
            resetForm();
        } catch (error) {
            console.error(error);

            toast.error(
                'Unable to assign developer work.'
            );
        } finally {
            setCreating(false);
        }
    };

    // ============================================================
    // EDIT / STATUS
    // ============================================================

    const toDateInputValue = (
        value?: string | null
    ) => {
        if (!value) {
            return '';
        }

        return new Date(value)
            .toISOString()
            .slice(0, 10);
    };

    const openEditModal = (
        work: DeveloperWorkResponse
    ) => {
        setEditTitle(work.title);
        setEditDescription(work.description);
        setEditWorkType(work.workType);
        setEditPriority(work.priority);
        setEditDueDate(
            toDateInputValue(work.dueDateUtc)
        );

        setEditing(true);
    };

    const handleEditWork = async () => {
        if (!selectedWork) {
            return;
        }

        if (!editTitle.trim()) {
            toast.error('Please enter a work title.');
            return;
        }

        if (!editDescription.trim()) {
            toast.error(
                'Please enter a work description.'
            );
            return;
        }

        try {
            setSavingEdit(true);

            const updated =
                await updateDeveloperWork(
                    selectedWork.id,
                    {
                        title: editTitle.trim(),
                        description:
                            editDescription.trim(),
                        workType: editWorkType,
                        priority: editPriority,
                        dueDateUtc: editDueDate
                            ? new Date(
                                `${editDueDate}T23:59:59`
                            ).toISOString()
                            : null,
                    }
                );

            setWorks(current =>
                current.map(work =>
                    work.id === updated.id
                        ? updated
                        : work
                )
            );

            setSelectedWork(updated);
            setEditing(false);

            toast.success(
                'Developer work updated successfully.'
            );
        } catch (error) {
            console.error(error);

            toast.error(
                'Unable to update developer work.'
            );
        } finally {
            setSavingEdit(false);
        }
    };

    const handleStatusChange = async (
        nextStatus: DeveloperWorkStatus
    ) => {
        if (!selectedWork) {
            return;
        }

        if (
            nextStatus ===
            selectedWork.status
        ) {
            return;
        }

        if (
            selectedWork.status ===
            DeveloperWorkStatus.Completed
        ) {
            toast.info(
                'Completed work cannot be reopened.'
            );

            return;
        }

        if (
            nextStatus ===
            DeveloperWorkStatus.Completed &&
            !completionNotes.trim()
        ) {
            toast.error(
                'Please enter completion notes before completing the work.'
            );

            return;
        }

        try {
            setChangingStatus(true);

            const updated =
                await updateDeveloperWorkStatus(
                    selectedWork.id,
                    {
                        status: nextStatus,
                        completionNotes:
                            nextStatus ===
                                DeveloperWorkStatus.Completed
                                ? completionNotes.trim()
                                : null,
                    }
                );

            setWorks(current =>
                current.map(work =>
                    work.id === updated.id
                        ? updated
                        : work
                )
            );

            setSelectedWork(updated);

            setCompletionNotes(
                updated.completionNotes ?? ''
            );

            toast.success(
                `Work moved to ${getDeveloperWorkStatusLabel(
                    updated.status
                )}.`
            );
        } catch (error) {
            console.error(error);

            toast.error(
                'Unable to change work status.'
            );
        } finally {
            setChangingStatus(false);
        }
    };

    // ============================================================
    // FORMAT
    // ============================================================

    const formatDate = (
        value?: string | null
    ) => {
        if (!value) {
            return '—';
        }

        return new Date(value).toLocaleDateString(
            [],
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }
        );
    };

    const formatDateTime = (
        value?: string | null
    ) => {
        if (!value) {
            return '—';
        }

        return new Date(value).toLocaleString(
            [],
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }
        );
    };

    // ============================================================
    // CARD
    // ============================================================

    const renderCard = (
        work: DeveloperWorkResponse
    ) => {
        return (
            <button
                key={work.id}
                type="button"
                onClick={() =>
                    setSelectedWork(work)
                }
                className="w-full rounded-2xl border border-white/10 bg-[#0b0925] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#5C3FE0]/60 hover:bg-[#110d35]"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-[#A78BFA]">
                            #{work.id}
                        </p>

                        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-white">
                            {work.title}
                        </h3>
                    </div>

                    <span
                        className={`
              shrink-0 rounded-full px-2 py-1 text-[10px]
              ${work.priority ===
                                DeveloperWorkPriority.Urgent
                                ? 'bg-red-500/15 text-red-300'
                                : work.priority ===
                                    DeveloperWorkPriority.High
                                    ? 'bg-orange-500/15 text-orange-300'
                                    : 'bg-white/5 text-gray-400'
                            }
            `}
                    >
                        {getDeveloperWorkPriorityLabel(
                            work.priority
                        )}
                    </span>
                </div>

                <p className="mt-3 line-clamp-3 text-xs leading-5 text-gray-400">
                    {work.description}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <User
                            size={13}
                            className="shrink-0 text-gray-600"
                        />

                        <span className="truncate text-[11px] text-gray-400">
                            {work.assignedToUserName}
                        </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-gray-600">
                        <Calendar size={12} />

                        {formatDate(
                            work.dueDateUtc
                        )}
                    </div>
                </div>
            </button>
        );
    };

    // ============================================================
    // COLUMN
    // ============================================================

    const renderColumn = (
        status: DeveloperWorkStatus,
        count: number
    ) => {
        const columnWorks =
            filteredWorks.filter(
                work => work.status === status
            );

        const icon =
            status ===
                DeveloperWorkStatus.Pending
                ? <Clock3 size={17} />
                : status ===
                    DeveloperWorkStatus.InProgress
                    ? <PlayCircle size={17} />
                    : status ===
                        DeveloperWorkStatus.OnHold
                        ? <PauseCircle size={17} />
                        : <CheckCircle2 size={17} />;

        return (
            <div className="flex min-h-[520px] min-w-[285px] flex-1 flex-col rounded-2xl border border-white/10 bg-[#08061b]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[#A78BFA]">
                            {icon}
                        </span>

                        <span className="text-sm font-semibold text-white">
                            {getDeveloperWorkStatusLabel(
                                status
                            )}
                        </span>

                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-500">
                            {count}
                        </span>
                    </div>
                </div>

                <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3 custom-scrollbar">
                    {columnWorks.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/10">
                            <p className="text-xs text-gray-600">
                                No work here
                            </p>
                        </div>
                    ) : (
                        columnWorks.map(
                            renderCard
                        )
                    )}
                </div>
            </div>
        );
    };

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {
        return (
            <div className="flex min-h-[500px] items-center justify-center">
                <Loader2
                    size={30}
                    className="animate-spin text-[#A78BFA]"
                />
            </div>
        );
    }

    // ============================================================
    // VIEW
    // ============================================================

    return (
        <div className="space-y-5">
            {/* HEADER */}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-[#5C3FE0]/15 p-2.5">
                        <Code2
                            size={22}
                            className="text-[#A78BFA]"
                        />
                    </div>

                    <div>
                        <h1 className="text-xl font-semibold text-white">
                            Developer Work
                        </h1>

                        <p className="text-sm text-gray-500">
                            Assign and monitor your development team's work.
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            loadWorks(true)
                        }
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={
                                refreshing
                                    ? 'animate-spin'
                                    : ''
                            }
                        />

                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setShowCreate(true)
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-[#5C3FE0] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#6848ec]"
                    >
                        <Plus size={17} />

                        Assign Work
                    </button>
                </div>
            </div>

            {/* COUNTS */}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                    ['Pending', counts.pending],
                    ['In Progress', counts.inProgress],
                    ['On Hold', counts.onHold],
                    ['Completed', counts.completed],
                ].map(([label, value]) => (
                    <div
                        key={String(label)}
                        className="rounded-2xl border border-white/10 bg-[#09071e] p-4"
                    >
                        <p className="text-xs text-gray-500">
                            {label}
                        </p>

                        <p className="mt-2 text-2xl font-semibold text-white">
                            {value}
                        </p>
                    </div>
                ))}
            </div>

            {/* FILTERS */}

            <div className="flex flex-col gap-3 xl:flex-row">
                <div className="relative flex-1">
                    <Search
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                    />

                    <input
                        value={search}
                        onChange={event =>
                            setSearch(
                                event.target.value
                            )
                        }
                        placeholder="Search work..."
                        className="w-full rounded-xl border border-white/10 bg-[#09071e] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#5C3FE0]"
                    />
                </div>

                <select
                    value={
                        developerFilter ?? ''
                    }
                    onChange={event =>
                        setDeveloperFilter(
                            event.target.value
                                ? Number(
                                    event.target.value
                                )
                                : undefined
                        )
                    }
                    className="rounded-xl border border-white/10 bg-[#09071e] px-4 py-3 text-sm text-gray-300 outline-none"
                >
                    <option value="">
                        All Developers
                    </option>

                    {developers.map(
                        developer => (
                            <option
                                key={developer.id}
                                value={developer.id}
                            >
                                {developer.username ??
                                    developer.email}
                            </option>
                        )
                    )}
                </select>

                <select
                    value={
                        statusFilter ?? ''
                    }
                    onChange={event =>
                        setStatusFilter(
                            event.target.value
                                ? event.target
                                    .value as DeveloperWorkStatus
                                : undefined
                        )
                    }
                    className="rounded-xl border border-white/10 bg-[#09071e] px-4 py-3 text-sm text-gray-300 outline-none"
                >
                    <option value="">
                        All Status
                    </option>

                    {STATUS_COLUMNS.map(
                        status => (
                            <option
                                key={status}
                                value={status}
                            >
                                {getDeveloperWorkStatusLabel(
                                    status
                                )}
                            </option>
                        )
                    )}
                </select>
            </div>

            {/* KANBAN */}

            <div className="flex gap-4 overflow-x-auto pb-3 custom-scrollbar">
                {renderColumn(
                    DeveloperWorkStatus.Pending,
                    counts.pending
                )}

                {renderColumn(
                    DeveloperWorkStatus.InProgress,
                    counts.inProgress
                )}

                {renderColumn(
                    DeveloperWorkStatus.OnHold,
                    counts.onHold
                )}

                {renderColumn(
                    DeveloperWorkStatus.Completed,
                    counts.completed
                )}
            </div>

            {/* CREATE MODAL */}

            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#09071e] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    Assign Developer Work
                                </h2>

                                <p className="mt-1 text-xs text-gray-500">
                                    Create a task for a junior developer.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowCreate(false)
                                }
                                className="rounded-xl p-2 text-gray-500 hover:bg-white/5 hover:text-white"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <div className="space-y-5 p-6">
                            {/* TITLE */}

                            <div>
                                <label className="text-xs font-medium text-gray-400">
                                    Work Title *
                                </label>

                                <input
                                    value={title}
                                    onChange={event =>
                                        setTitle(
                                            event.target.value
                                        )
                                    }
                                    placeholder="e.g. Implement Sales Lead Metrics API"
                                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#5C3FE0]"
                                />
                            </div>

                            {/* DEVELOPER */}

                            <div>
                                <label className="text-xs font-medium text-gray-400">
                                    Assign To *
                                </label>

                                <div className="relative mt-2">
                                    <select
                                        value={assignedToUserId}
                                        onChange={event =>
                                            setAssignedToUserId(
                                                event.target.value
                                                    ? Number(event.target.value)
                                                    : ''
                                            )
                                        }
                                        style={{ colorScheme: 'dark' }}
                                        className="
            w-full appearance-none
            rounded-xl border border-white/10
            bg-[#0e0b2e]
            px-4 py-3 pr-10
            text-sm text-gray-200
            outline-none transition
            focus:border-[#5C3FE0]
            focus:ring-1 focus:ring-[#5C3FE0]/40
        "
                                    >
                                        <option
                                            value=""
                                            className="bg-[#0e0b2e] text-gray-400"
                                        >
                                            Select junior developer
                                        </option>

                                        {developers.map(developer => (
                                            <option
                                                key={developer.id}
                                                value={developer.id}
                                                className="bg-[#0e0b2e] text-gray-200"
                                            >
                                                {developer.username ?? developer.email}
                                                {developer.employeeCode
                                                    ? ` (${developer.employeeCode})`
                                                    : ''}
                                            </option>
                                        ))}
                                    </select>

                                    <ChevronDown
                                        size={17}
                                        className="
            pointer-events-none
            absolute right-3 top-1/2
            -translate-y-1/2
            text-gray-400
        "
                                    />
                                </div>
                            </div>

                            {/* TYPE / PRIORITY */}

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs font-medium text-gray-400">
                                        Work Type
                                    </label>

                                    <div className="relative mt-2">
                                        <select
                                            value={workType}
                                            onChange={event =>
                                                setWorkType(
                                                    event.target.value as DeveloperWorkType
                                                )
                                            }
                                            style={{ colorScheme: 'dark' }}
                                            className="
            w-full appearance-none
            rounded-xl border border-white/10
            bg-[#0e0b2e]
            px-4 py-3 pr-10
            text-sm text-gray-200
            outline-none transition
            focus:border-[#5C3FE0]
            focus:ring-1 focus:ring-[#5C3FE0]/40
        "
                                        >
                                            {Object.values(DeveloperWorkType).map(type => (
                                                <option
                                                    key={type}
                                                    value={type}
                                                    className="bg-[#0e0b2e] text-gray-200"
                                                >
                                                    {getDeveloperWorkTypeLabel(type)}
                                                </option>
                                            ))}
                                        </select>

                                        <ChevronDown
                                            size={17}
                                            className="
            pointer-events-none
            absolute right-3 top-1/2
            -translate-y-1/2
            text-gray-400
        "
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-400">
                                        Priority
                                    </label>

                                    <div className="relative mt-2">
                                        <select
                                            value={priority}
                                            onChange={event =>
                                                setPriority(
                                                    event.target.value as DeveloperWorkPriority
                                                )
                                            }
                                            style={{ colorScheme: 'dark' }}
                                            className="
            w-full appearance-none
            rounded-xl border border-white/10
            bg-[#0e0b2e]
            px-4 py-3 pr-10
            text-sm text-gray-200
            outline-none transition
            focus:border-[#5C3FE0]
            focus:ring-1 focus:ring-[#5C3FE0]/40
        "
                                        >
                                            {Object.values(DeveloperWorkPriority).map(item => (
                                                <option
                                                    key={item}
                                                    value={item}
                                                    className="bg-[#0e0b2e] text-gray-200"
                                                >
                                                    {getDeveloperWorkPriorityLabel(item)}
                                                </option>
                                            ))}
                                        </select>

                                        <ChevronDown
                                            size={17}
                                            className="
            pointer-events-none
            absolute right-3 top-1/2
            -translate-y-1/2
            text-gray-400
        "
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* DUE DATE */}

                            <div>
                                <label className="text-xs font-medium text-gray-400">
                                    Due Date
                                </label>

                                <div className="relative mt-2">
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={event =>
                                            setDueDate(event.target.value)
                                        }
                                        style={{ colorScheme: 'dark' }}
                                        className="
                w-full
                rounded-xl
                border border-white/10
                bg-black/20
                px-4 py-3 pr-11
                text-sm text-gray-300
                outline-none
                transition
                focus:border-[#5C3FE0]
                focus:ring-1
                focus:ring-[#5C3FE0]/40
            "
                                    />

                                    {/* <Calendar
                                        size={17}
                                        className="
                pointer-events-none
                absolute right-3 top-1/2
                -translate-y-1/2
                text-gray-400
            "
                                    /> */}
                                </div>
                            </div>

                            {/* DESCRIPTION */}

                            <div>
                                <label className="text-xs font-medium text-gray-400">
                                    Description *
                                </label>

                                <textarea
                                    value={description}
                                    onChange={event =>
                                        setDescription(
                                            event.target.value
                                        )
                                    }
                                    rows={7}
                                    placeholder="Describe exactly what needs to be done, requirements, expected behavior, API details, UI requirements, etc."
                                    className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-gray-600 focus:border-[#5C3FE0]"
                                />
                            </div>

                            {/* PREVIEW */}

                            <div className="rounded-2xl border border-[#5C3FE0]/20 bg-[#5C3FE0]/5 p-4">
                                <p className="text-xs font-medium text-[#A78BFA]">
                                    Assignment Preview
                                </p>

                                <div className="mt-3 space-y-2 text-xs text-gray-400">
                                    <p>
                                        Developer:{' '}
                                        <span className="text-gray-200">
                                            {developers.find(
                                                x =>
                                                    x.id ===
                                                    assignedToUserId
                                            )?.username ??
                                                'Not selected'}
                                        </span>
                                    </p>

                                    <p>
                                        Type:{' '}
                                        <span className="text-gray-200">
                                            {getDeveloperWorkTypeLabel(
                                                workType
                                            )}
                                        </span>
                                    </p>

                                    <p>
                                        Priority:{' '}
                                        <span className="text-gray-200">
                                            {getDeveloperWorkPriorityLabel(
                                                priority
                                            )}
                                        </span>
                                    </p>

                                    <p>
                                        Due:{' '}
                                        <span className="text-gray-200">
                                            {dueDate ||
                                                'No due date'}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* ACTIONS */}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCreate(false)
                                    }
                                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300 hover:bg-white/10"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    disabled={creating}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#5C3FE0] px-4 py-3 text-sm font-medium text-white hover:bg-[#6848ec] disabled:opacity-50"
                                >
                                    {creating ? (
                                        <Loader2
                                            size={17}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Plus size={17} />
                                    )}

                                    Assign Work
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAIL MODAL */}

            {selectedWork && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                    onMouseDown={event => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setSelectedWork(null);
                        }
                    }}
                >
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#09071e] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                            <div>
                                <p className="text-xs text-[#A78BFA]">
                                    Developer Work #{selectedWork.id}
                                </p>

                                <h2 className="mt-1 text-lg font-semibold text-white">
                                    {selectedWork.title}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedWork(null)
                                }
                                className="rounded-xl p-2 text-gray-500 hover:bg-white/5 hover:text-white"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <div className="space-y-5 p-6">

                            {/* DESCRIPTION */}

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Description
                                </p>

                                <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-6 text-gray-300">
                                    {selectedWork.description}
                                </div>
                            </div>

                            {/* DETAILS */}

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                                    <p className="text-[10px] text-gray-600">
                                        Assigned To
                                    </p>

                                    <p className="mt-1 truncate text-sm text-gray-300">
                                        {selectedWork.assignedToUserName}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                                    <p className="text-[10px] text-gray-600">
                                        Type
                                    </p>

                                    <p className="mt-1 text-sm text-gray-300">
                                        {getDeveloperWorkTypeLabel(
                                            selectedWork.workType
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                                    <p className="text-[10px] text-gray-600">
                                        Priority
                                    </p>

                                    <p className="mt-1 text-sm text-gray-300">
                                        {getDeveloperWorkPriorityLabel(
                                            selectedWork.priority
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                                    <p className="text-[10px] text-gray-600">
                                        Status
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-[#C4B5FD]">
                                        {getDeveloperWorkStatusLabel(
                                            selectedWork.status
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* STATUS CONTROL */}

                            <div className="rounded-2xl border border-[#5C3FE0]/20 bg-[#5C3FE0]/5 p-4">

                                <div className="flex items-center justify-between gap-3">

                                    <div>
                                        <p className="text-xs font-medium text-[#A78BFA]">
                                            Change Work Status
                                        </p>

                                        <p className="mt-1 text-[11px] text-gray-500">
                                            Senior developers can manage the assigned work status.
                                        </p>
                                    </div>

                                    <div className="relative w-48">
                                        <select
                                            value={selectedWork.status}
                                            disabled={
                                                changingStatus ||
                                                selectedWork.status ===
                                                DeveloperWorkStatus.Completed
                                            }
                                            onChange={event =>
                                                handleStatusChange(
                                                    event.target.value as DeveloperWorkStatus
                                                )
                                            }
                                            style={{
                                                colorScheme: 'dark',
                                            }}
                                            className="
                        w-full appearance-none
                        rounded-xl
                        border border-white/10
                        bg-[#0e0b2e]
                        px-3 py-2.5 pr-9
                        text-xs text-gray-200
                        outline-none
                        transition
                        focus:border-[#5C3FE0]
                        focus:ring-1
                        focus:ring-[#5C3FE0]/40
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
                                        >
                                            {STATUS_COLUMNS.map(status => (
                                                <option
                                                    key={status}
                                                    value={status}
                                                    className="bg-[#0e0b2e] text-gray-200"
                                                >
                                                    {getDeveloperWorkStatusLabel(
                                                        status
                                                    )}
                                                </option>
                                            ))}
                                        </select>

                                        {changingStatus ? (
                                            <Loader2
                                                size={15}
                                                className="
                            absolute right-3 top-1/2
                            -translate-y-1/2
                            animate-spin
                            text-[#A78BFA]
                        "
                                            />
                                        ) : (
                                            <ChevronDown
                                                size={15}
                                                className="
                            pointer-events-none
                            absolute right-3 top-1/2
                            -translate-y-1/2
                            text-gray-400
                        "
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* COMPLETION NOTES */}

                                {selectedWork.status ===
                                    DeveloperWorkStatus.InProgress && (
                                        <div className="mt-4">

                                            <label className="text-xs font-medium text-gray-400">
                                                Completion Notes
                                                <span className="ml-1 text-gray-600">
                                                    required when completing
                                                </span>
                                            </label>

                                            <textarea
                                                value={completionNotes}
                                                onChange={event =>
                                                    setCompletionNotes(
                                                        event.target.value
                                                    )
                                                }
                                                rows={3}
                                                placeholder="Describe what was completed..."
                                                className="
                        mt-2 w-full resize-none
                        rounded-xl
                        border border-white/10
                        bg-black/20
                        px-4 py-3
                        text-sm leading-6
                        text-white
                        outline-none
                        placeholder:text-gray-600
                        focus:border-[#5C3FE0]
                    "
                                            />
                                        </div>
                                    )}

                                {selectedWork.status ===
                                    DeveloperWorkStatus.Completed && (
                                        <div className="mt-4 rounded-xl border border-green-500/10 bg-green-500/5 p-3">
                                            <p className="text-xs text-green-300">
                                                This work has been completed and cannot be reopened.
                                            </p>
                                        </div>
                                    )}
                            </div>

                            {/* TIMELINE */}

                            <div className="space-y-2 text-xs text-gray-500">

                                <p>
                                    Assigned:{' '}
                                    <span className="text-gray-300">
                                        {formatDateTime(
                                            selectedWork.assignedAtUtc
                                        )}
                                    </span>
                                </p>

                                <p>
                                    Due:{' '}
                                    <span className="text-gray-300">
                                        {formatDate(
                                            selectedWork.dueDateUtc
                                        )}
                                    </span>
                                </p>

                                {selectedWork.startedAtUtc && (
                                    <p>
                                        Started:{' '}
                                        <span className="text-gray-300">
                                            {formatDateTime(
                                                selectedWork.startedAtUtc
                                            )}
                                        </span>
                                    </p>
                                )}

                                {selectedWork.completedAtUtc && (
                                    <p>
                                        Completed:{' '}
                                        <span className="text-gray-300">
                                            {formatDateTime(
                                                selectedWork.completedAtUtc
                                            )}
                                        </span>
                                    </p>
                                )}
                            </div>

                            {/* COMPLETION NOTES DISPLAY */}

                            {selectedWork.completionNotes && (
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Completion Notes
                                    </p>

                                    <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-6 text-gray-300">
                                        {selectedWork.completionNotes}
                                    </div>
                                </div>
                            )}

                            {/* ACTIONS */}

                            <div className="flex gap-3 border-t border-white/10 pt-5">

                                <button
                                    type="button"
                                    onClick={() =>
                                        openEditModal(selectedWork)
                                    }
                                    disabled={
                                        selectedWork.status ===
                                        DeveloperWorkStatus.Completed
                                    }
                                    className="
                inline-flex flex-1
                items-center justify-center
                gap-2 rounded-xl
                border border-white/10
                bg-white/5
                px-4 py-3
                text-sm text-gray-300
                transition
                hover:bg-white/10
                hover:text-white
                disabled:cursor-not-allowed
                disabled:opacity-40
            "
                                >
                                    <Edit3 size={16} />

                                    Edit Work
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedWork(null)
                                    }
                                    className="
                rounded-xl
                border border-white/10
                bg-white/5
                px-4 py-3
                text-sm text-gray-300
                hover:bg-white/10
            "
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}

            {editing && selectedWork && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">

                    <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#09071e] shadow-2xl">

                        {/* HEADER */}

                        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

                            <div>
                                <p className="text-xs text-[#A78BFA]">
                                    Edit Developer Work #{selectedWork.id}
                                </p>

                                <h2 className="mt-1 text-lg font-semibold text-white">
                                    Edit Work
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setEditing(false)
                                }
                                className="rounded-xl p-2 text-gray-500 hover:bg-white/5 hover:text-white"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <div className="space-y-5 p-6">

                            {/* TITLE */}

                            <div>
                                <label className="text-xs font-medium text-gray-400">
                                    Work Title *
                                </label>

                                <input
                                    value={editTitle}
                                    onChange={event =>
                                        setEditTitle(
                                            event.target.value
                                        )
                                    }
                                    className="
                            mt-2 w-full
                            rounded-xl
                            border border-white/10
                            bg-black/20
                            px-4 py-3
                            text-sm text-white
                            outline-none
                            placeholder:text-gray-600
                            focus:border-[#5C3FE0]
                        "
                                />
                            </div>

                            {/* TYPE / PRIORITY */}

                            <div className="grid gap-4 sm:grid-cols-2">

                                <div>
                                    <label className="text-xs font-medium text-gray-400">
                                        Work Type
                                    </label>

                                    <div className="relative mt-2">
                                        <select
                                            value={editWorkType}
                                            onChange={event =>
                                                setEditWorkType(
                                                    event.target.value as DeveloperWorkType
                                                )
                                            }
                                            style={{
                                                colorScheme: 'dark',
                                            }}
                                            className="
                                    w-full appearance-none
                                    rounded-xl
                                    border border-white/10
                                    bg-[#0e0b2e]
                                    px-4 py-3 pr-10
                                    text-sm text-gray-200
                                    outline-none
                                    focus:border-[#5C3FE0]
                                "
                                        >
                                            {Object.values(
                                                DeveloperWorkType
                                            ).map(type => (
                                                <option
                                                    key={type}
                                                    value={type}
                                                    className="bg-[#0e0b2e] text-gray-200"
                                                >
                                                    {getDeveloperWorkTypeLabel(
                                                        type
                                                    )}
                                                </option>
                                            ))}
                                        </select>

                                        <ChevronDown
                                            size={17}
                                            className="
                                    pointer-events-none
                                    absolute right-3 top-1/2
                                    -translate-y-1/2
                                    text-gray-400
                                "
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-400">
                                        Priority
                                    </label>

                                    <div className="relative mt-2">
                                        <select
                                            value={editPriority}
                                            onChange={event =>
                                                setEditPriority(
                                                    event.target.value as DeveloperWorkPriority
                                                )
                                            }
                                            style={{
                                                colorScheme: 'dark',
                                            }}
                                            className="
                                    w-full appearance-none
                                    rounded-xl
                                    border border-white/10
                                    bg-[#0e0b2e]
                                    px-4 py-3 pr-10
                                    text-sm text-gray-200
                                    outline-none
                                    focus:border-[#5C3FE0]
                                "
                                        >
                                            {Object.values(
                                                DeveloperWorkPriority
                                            ).map(item => (
                                                <option
                                                    key={item}
                                                    value={item}
                                                    className="bg-[#0e0b2e] text-gray-200"
                                                >
                                                    {getDeveloperWorkPriorityLabel(
                                                        item
                                                    )}
                                                </option>
                                            ))}
                                        </select>

                                        <ChevronDown
                                            size={17}
                                            className="
                                    pointer-events-none
                                    absolute right-3 top-1/2
                                    -translate-y-1/2
                                    text-gray-400
                                "
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* DUE DATE */}

                            <div>
                                <label className="text-xs font-medium text-gray-400">
                                    Due Date
                                </label>

                                <div className="relative mt-2">
                                    <input
                                        type="date"
                                        value={editDueDate}
                                        onChange={event =>
                                            setEditDueDate(
                                                event.target.value
                                            )
                                        }
                                        style={{
                                            colorScheme: 'dark',
                                        }}
                                        className="
                                w-full
                                rounded-xl
                                border border-white/10
                                bg-black/20
                                px-4 py-3 pr-11
                                text-sm text-gray-300
                                outline-none
                                focus:border-[#5C3FE0]
                            "
                                    />

                                    <Calendar
                                        size={17}
                                        className="
                                pointer-events-none
                                absolute right-3 top-1/2
                                -translate-y-1/2
                                text-gray-400
                            "
                                    />
                                </div>
                            </div>

                            {/* DESCRIPTION */}

                            <div>
                                <label className="text-xs font-medium text-gray-400">
                                    Description *
                                </label>

                                <textarea
                                    value={editDescription}
                                    onChange={event =>
                                        setEditDescription(
                                            event.target.value
                                        )
                                    }
                                    rows={7}
                                    className="
                            mt-2 w-full resize-none
                            rounded-xl
                            border border-white/10
                            bg-black/20
                            px-4 py-3
                            text-sm leading-6
                            text-white
                            outline-none
                            focus:border-[#5C3FE0]
                        "
                                />
                            </div>

                            {/* ACTIONS */}

                            <div className="flex gap-3 border-t border-white/10 pt-5">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setEditing(false)
                                    }
                                    className="
                            flex-1 rounded-xl
                            border border-white/10
                            bg-white/5
                            px-4 py-3
                            text-sm text-gray-300
                            hover:bg-white/10
                        "
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleEditWork}
                                    disabled={savingEdit}
                                    className="
                            flex flex-1
                            items-center justify-center
                            gap-2 rounded-xl
                            bg-[#5C3FE0]
                            px-4 py-3
                            text-sm font-medium
                            text-white
                            hover:bg-[#6848ec]
                            disabled:opacity-50
                        "
                                >
                                    {savingEdit ? (
                                        <Loader2
                                            size={17}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Save size={17} />
                                    )}

                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeniorDeveloperWorkView;