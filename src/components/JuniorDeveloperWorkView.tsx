import React, {
  DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Code2,
  GripVertical,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

import { toast } from 'react-toastify';

import { useApp } from '../context/AppContext';

import {
  DeveloperWorkPriority,
  DeveloperWorkResponse,
  DeveloperWorkStatus,
  getDeveloperWorkPriorityLabel,
  getDeveloperWorkStatusLabel,
  getDeveloperWorkTypeLabel,
  getMyDeveloperWork,
  updateDeveloperWorkStatus,
} from '../api/developerWork';

const STATUS_COLUMNS = [
  DeveloperWorkStatus.Pending,
  DeveloperWorkStatus.InProgress,
  DeveloperWorkStatus.OnHold,
  DeveloperWorkStatus.Completed,
];

const JuniorDeveloperWorkView: React.FC = () => {
  const { currentUser } = useApp();

  const [works, setWorks] = useState<DeveloperWorkResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');

  const [selectedWork, setSelectedWork] =
    useState<DeveloperWorkResponse | null>(null);

  const [draggedWorkId, setDraggedWorkId] =
    useState<number | null>(null);

  const [dragOverStatus, setDragOverStatus] =
    useState<DeveloperWorkStatus | null>(null);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [completionNotes, setCompletionNotes] =
    useState('');

  // ============================================================
  // LOAD
  // ============================================================

  const loadWorks = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data = await getMyDeveloperWork();

        setWorks(Array.isArray(data) ? data : []);
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
    []
  );

  useEffect(() => {
    loadWorks();
  }, [loadWorks]);

  // ============================================================
  // FILTER
  // ============================================================

  const filteredWorks = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return works;
    }

    return works.filter(work =>
      [
        work.title,
        work.description,
        work.branchName,
        work.assignedByUserName,
        getDeveloperWorkTypeLabel(work.workType),
        getDeveloperWorkPriorityLabel(work.priority),
      ]
        .filter(Boolean)
        .some(item =>
          item.toLowerCase().includes(value)
        )
    );
  }, [works, search]);

  // ============================================================
  // COUNTS
  // ============================================================

  const counts = useMemo(() => {
    return {
      pending: works.filter(
        x => x.status === DeveloperWorkStatus.Pending
      ).length,

      inProgress: works.filter(
        x => x.status === DeveloperWorkStatus.InProgress
      ).length,

      onHold: works.filter(
        x => x.status === DeveloperWorkStatus.OnHold
      ).length,

      completed: works.filter(
        x => x.status === DeveloperWorkStatus.Completed
      ).length,
    };
  }, [works]);

  // ============================================================
  // STATUS HELPERS
  // ============================================================

  const canMoveToStatus = (
    current: DeveloperWorkStatus,
    next: DeveloperWorkStatus
  ) => {
    if (current === next) {
      return false;
    }

    switch (current) {
      case DeveloperWorkStatus.Pending:
        return next === DeveloperWorkStatus.InProgress;

      case DeveloperWorkStatus.InProgress:
        return (
          next === DeveloperWorkStatus.OnHold ||
          next === DeveloperWorkStatus.Completed
        );

      case DeveloperWorkStatus.OnHold:
        return next === DeveloperWorkStatus.InProgress;

      case DeveloperWorkStatus.Completed:
        return false;

      default:
        return false;
    }
  };

  // ============================================================
  // DRAG START
  // ============================================================

  const handleDragStart = (
    event: DragEvent<HTMLDivElement>,
    workId: number
  ) => {
    setDraggedWorkId(workId);

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(
      'text/plain',
      String(workId)
    );
  };

  // ============================================================
  // DRAG OVER
  // ============================================================

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>,
    status: DeveloperWorkStatus
  ) => {
    event.preventDefault();

    const work = works.find(
      item => item.id === draggedWorkId
    );

    if (!work) {
      return;
    }

    if (
      canMoveToStatus(
        work.status,
        status
      )
    ) {
      event.dataTransfer.dropEffect = 'move';
      setDragOverStatus(status);
    } else {
      event.dataTransfer.dropEffect = 'none';
    }
  };

  // ============================================================
  // DROP
  // ============================================================

  const handleDrop = async (
    event: DragEvent<HTMLDivElement>,
    status: DeveloperWorkStatus
  ) => {
    event.preventDefault();

    setDragOverStatus(null);

    const id = Number(
      event.dataTransfer.getData('text/plain')
    );

    if (!id) {
      return;
    }

    const work = works.find(
      item => item.id === id
    );

    if (!work) {
      return;
    }

    if (
      !canMoveToStatus(
        work.status,
        status
      )
    ) {
      toast.info(
        `Cannot move ${getDeveloperWorkStatusLabel(
          work.status
        )} directly to ${getDeveloperWorkStatusLabel(
          status
        )}.`
      );

      return;
    }

    if (
      status === DeveloperWorkStatus.Completed
    ) {
      setSelectedWork(work);
      setCompletionNotes(
        work.completionNotes ?? ''
      );

      // We don't immediately update.
      // The completion modal asks for notes first.
      return;
    }

    await changeStatus(
      work,
      status
    );
  };

  // ============================================================
  // STATUS UPDATE
  // ============================================================

  const changeStatus = async (
    work: DeveloperWorkResponse,
    status: DeveloperWorkStatus,
    notes?: string | null
  ) => {
    try {
      setUpdatingId(work.id);

      const updated =
        await updateDeveloperWorkStatus(
          work.id,
          {
            status,
            completionNotes:
              notes ?? null,
          }
        );

      setWorks(current =>
        current.map(item =>
          item.id === updated.id
            ? updated
            : item
        )
      );

      setSelectedWork(
        selected =>
          selected?.id === updated.id
            ? updated
            : selected
      );

      toast.success(
        `Work moved to ${getDeveloperWorkStatusLabel(
          status
        )}.`
      );
    } catch (error) {
      console.error(error);

      toast.error(
        'Unable to update work status.'
      );
    } finally {
      setUpdatingId(null);
      setDraggedWorkId(null);
    }
  };

  // ============================================================
  // COMPLETE
  // ============================================================

  const handleComplete = async () => {
    if (!selectedWork) {
      return;
    }

    if (!completionNotes.trim()) {
      toast.error(
        'Please add completion notes.'
      );

      return;
    }

    await changeStatus(
      selectedWork,
      DeveloperWorkStatus.Completed,
      completionNotes.trim()
    );

    setSelectedWork(null);
    setCompletionNotes('');
  };

  // ============================================================
  // OPEN DETAILS
  // ============================================================

  const openDetails = (
    work: DeveloperWorkResponse
  ) => {
    setSelectedWork(work);

    setCompletionNotes(
      work.completionNotes ?? ''
    );
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
    const priorityClass =
      work.priority ===
      DeveloperWorkPriority.Urgent
        ? 'border-red-500/40 bg-red-500/5'
        : work.priority ===
            DeveloperWorkPriority.High
          ? 'border-orange-400/30 bg-orange-400/5'
          : 'border-white/10 bg-[#0b0925]';

    const isUpdating =
      updatingId === work.id;

    return (
      <div
        key={work.id}
        draggable={
          !isUpdating &&
          work.status !==
            DeveloperWorkStatus.Completed
        }
        onDragStart={event =>
          handleDragStart(
            event,
            work.id
          )
        }
        onDragEnd={() => {
          setDraggedWorkId(null);
          setDragOverStatus(null);
        }}
        onClick={() =>
          openDetails(work)
        }
        className={`
          group cursor-pointer rounded-2xl
          border ${priorityClass}
          p-4
          transition-all
          hover:border-[#5C3FE0]/60
          hover:bg-[#110d35]
          hover:-translate-y-0.5
          shadow-lg shadow-black/10
        `}
      >
        <div className="flex items-start gap-2">
          <GripVertical
            size={16}
            className="mt-1 shrink-0 text-gray-600 group-hover:text-[#A78BFA]"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-white line-clamp-2">
                {work.title}
              </h3>

              {isUpdating && (
                <Loader2
                  size={15}
                  className="shrink-0 animate-spin text-[#A78BFA]"
                />
              )}
            </div>

            <p className="mt-2 text-xs leading-5 text-gray-400 line-clamp-3">
              {work.description}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-gray-300">
                {getDeveloperWorkTypeLabel(
                  work.workType
                )}
              </span>

              <span
                className={`
                  rounded-full px-2 py-1 text-[10px] font-medium
                  ${
                    work.priority ===
                    DeveloperWorkPriority.Urgent
                      ? 'bg-red-500/15 text-red-300'
                      : work.priority ===
                          DeveloperWorkPriority.High
                        ? 'bg-orange-500/15 text-orange-300'
                        : work.priority ===
                            DeveloperWorkPriority.Medium
                          ? 'bg-yellow-500/10 text-yellow-300'
                          : 'bg-white/5 text-gray-400'
                  }
                `}
              >
                {getDeveloperWorkPriorityLabel(
                  work.priority
                )}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <Calendar size={13} />

                <span>
                  {work.dueDateUtc
                    ? formatDate(
                        work.dueDateUtc
                      )
                    : 'No due date'}
                </span>
              </div>

              <span className="max-w-[120px] truncate text-[11px] text-gray-500">
                {work.assignedByUserName}
              </span>
            </div>
          </div>
        </div>
      </div>
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

    const isDropTarget =
      dragOverStatus === status;

    const icon =
      status === DeveloperWorkStatus.Pending
        ? <Clock3 size={17} />
        : status ===
            DeveloperWorkStatus.InProgress
          ? <PlayCircle size={17} />
          : status ===
              DeveloperWorkStatus.OnHold
            ? <PauseCircle size={17} />
            : <CheckCircle2 size={17} />;

    return (
      <div
        className={`
          flex min-h-[520px] min-w-[285px] flex-1
          flex-col rounded-2xl
          border
          ${
            isDropTarget
              ? 'border-[#A78BFA]/70 bg-[#5C3FE0]/10'
              : 'border-white/10 bg-[#08061b]'
          }
          transition-colors
        `}
        onDragOver={event =>
          handleDragOver(
            event,
            status
          )
        }
        onDragLeave={() =>
          setDragOverStatus(null)
        }
        onDrop={event =>
          handleDrop(
            event,
            status
          )
        }
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-[#A78BFA]">
              {icon}
            </span>

            <h2 className="text-sm font-semibold text-white">
              {getDeveloperWorkStatusLabel(
                status
              )}
            </h2>

            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-400">
              {count}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3 custom-scrollbar">
          {columnWorks.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/10 p-6 text-center">
              <div>
                <Code2
                  size={24}
                  className="mx-auto text-gray-700"
                />

                <p className="mt-2 text-xs text-gray-600">
                  No work here
                </p>
              </div>
            </div>
          ) : (
            columnWorks.map(renderCard)
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
        <div>
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
                Complete your assigned development work.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            loadWorks(true)
          }
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/10 disabled:opacity-50"
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
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: 'Pending',
            value: counts.pending,
            icon: Clock3,
          },
          {
            label: 'In Progress',
            value: counts.inProgress,
            icon: PlayCircle,
          },
          {
            label: 'On Hold',
            value: counts.onHold,
            icon: PauseCircle,
          },
          {
            label: 'Completed',
            value: counts.completed,
            icon: CheckCircle2,
          },
        ].map(item => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-[#09071e] p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {item.label}
                </span>

                <Icon
                  size={17}
                  className="text-[#A78BFA]"
                />
              </div>

              <p className="mt-2 text-2xl font-semibold text-white">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* SEARCH */}

      <div className="relative">
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
          placeholder="Search developer work..."
          className="w-full rounded-xl border border-white/10 bg-[#09071e] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#5C3FE0]"
        />
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

      {/* DETAILS / COMPLETION MODAL */}

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

                <div className="mt-2 rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-6 text-gray-300 whitespace-pre-wrap">
                  {selectedWork.description}
                </div>
              </div>

              {/* META */}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                    Assigned
                  </p>

                  <p className="mt-1 text-sm text-gray-300">
                    {formatDate(
                      selectedWork.assignedAtUtc
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-[10px] text-gray-600">
                    Due
                  </p>

                  <p className="mt-1 text-sm text-gray-300">
                    {formatDate(
                      selectedWork.dueDateUtc
                    )}
                  </p>
                </div>
              </div>

              {/* STATUS */}

              <div className="rounded-2xl border border-[#5C3FE0]/20 bg-[#5C3FE0]/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Current Status
                  </span>

                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[#C4B5FD]">
                    {getDeveloperWorkStatusLabel(
                      selectedWork.status
                    )}
                  </span>
                </div>
              </div>

              {/* COMPLETION NOTES */}

              {selectedWork.status ===
                DeveloperWorkStatus.InProgress && (
                <div>
                  <label className="text-xs font-medium text-gray-400">
                    Completion Notes
                  </label>

                  <textarea
                    value={completionNotes}
                    onChange={event =>
                      setCompletionNotes(
                        event.target.value
                      )
                    }
                    rows={4}
                    placeholder="Describe what you completed..."
                    className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#5C3FE0]"
                  />
                </div>
              )}

              {/* INFO */}

              <div className="grid gap-2 text-xs text-gray-500">
                <div>
                  Assigned by:{' '}
                  <span className="text-gray-300">
                    {selectedWork.assignedByUserName}
                  </span>
                </div>

                {selectedWork.startedAtUtc && (
                  <div>
                    Started:{' '}
                    <span className="text-gray-300">
                      {formatDateTime(
                        selectedWork.startedAtUtc
                      )}
                    </span>
                  </div>
                )}

                {selectedWork.completedAtUtc && (
                  <div>
                    Completed:{' '}
                    <span className="text-gray-300">
                      {formatDateTime(
                        selectedWork.completedAtUtc
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* ACTION */}

              {selectedWork.status ===
                DeveloperWorkStatus.InProgress && (
                <button
                  type="button"
                  onClick={
                    handleComplete
                  }
                  disabled={
                    updatingId !== null
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5C3FE0] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#6848ec] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingId ===
                  selectedWork.id ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}

                  Mark as Completed
                </button>
              )}

              {selectedWork.status ===
                DeveloperWorkStatus.OnHold && (
                <button
                  type="button"
                  onClick={() =>
                    changeStatus(
                      selectedWork,
                      DeveloperWorkStatus.InProgress
                    )
                  }
                  disabled={
                    updatingId !== null
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5C3FE0] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#6848ec] disabled:opacity-50"
                >
                  <PlayCircle size={17} />

                  Resume Work
                </button>
              )}

              {selectedWork.status ===
                DeveloperWorkStatus.Pending && (
                <button
                  type="button"
                  onClick={() =>
                    changeStatus(
                      selectedWork,
                      DeveloperWorkStatus.InProgress
                    )
                  }
                  disabled={
                    updatingId !== null
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5C3FE0] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#6848ec] disabled:opacity-50"
                >
                  <PlayCircle size={17} />

                  Start Work
                </button>
              )}

              {selectedWork.status ===
                DeveloperWorkStatus.InProgress && (
                <button
                  type="button"
                  onClick={() =>
                    changeStatus(
                      selectedWork,
                      DeveloperWorkStatus.OnHold
                    )
                  }
                  disabled={
                    updatingId !== null
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300 transition hover:bg-white/10 disabled:opacity-50"
                >
                  <PauseCircle size={17} />

                  Put On Hold
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JuniorDeveloperWorkView;