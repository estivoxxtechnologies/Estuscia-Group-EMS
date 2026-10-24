
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  CalendarDays,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
  CheckCircle2,
  Building2,
} from 'lucide-react';

import { useApp } from '../context/AppContext';

import {
  CompanyHoliday,
  createCompanyHoliday,
  deleteCompanyHoliday,
  getCompanyHolidays,
  updateCompanyHoliday,
} from '../api/companyHolidays';

import { getBranches } from '../api/branches';

type HolidayForm = {
  name: string;
  date: string;
  branchId: string;
  description: string;
};

type BranchOption = {
  id: number;
  branchName: string;
};

type HolidayPayload = {
  tenantId?: number;
  branchId: number | null;
  name: string;
  date: string;
  description: string | null;
};

const ALL_BRANCHES = '';

const EMPTY_FORM: HolidayForm = {
  name: '',
  date: '',
  branchId: ALL_BRANCHES,
  description: '',
};

const PANEL_CLASS =
  'rounded-2xl border border-white/10 bg-[#0e0b2e]';

const INPUT_CLASS =
  'w-full rounded-lg border border-white/10 bg-[#0e0b2e] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#5C3FE0]/60 disabled:cursor-not-allowed disabled:opacity-60';

const LABEL_CLASS =
  'mb-2 block text-sm font-medium text-slate-300';

const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[#5C3FE0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6d4ff0] disabled:cursor-not-allowed disabled:opacity-50';

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50';

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

function localDateString(): string {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

function normalizeDate(value: string | null | undefined): string {
  return String(value ?? '').substring(0, 10);
}

function formatDate(value: string): string {
  const dateOnly = normalizeDate(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return dateOnly || '—';
  }

  const date = new Date(`${dateOnly}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateOnly;
  }

  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function mapBranch(branch: any): BranchOption {
  const id = Number(branch.id ?? branch.Id);

  return {
    id,
    branchName: String(
      branch.branchName ??
        branch.name ??
        branch.BranchName ??
        branch.Name ??
        `Branch ${id}`,
    ),
  };
}

function getHolidayBranchId(
  holiday: CompanyHoliday,
): number | null {
  const value = (
    holiday as CompanyHoliday & {
      branchId?: number | string | null;
    }
  ).branchId;

  if (value == null ) {
    return null;
  }

  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

export default function CompanyHolidays() {
  const { currentUser } = useApp();

  const role = currentUser?.roleName?.trim().toLowerCase();

  const isSuperAdmin = role === 'super_admin';
  const isBranchManager = role === 'branch_manager';

  const canManage = [
    'super_admin',
    'company_admin',
    'hr_ops',
    'branch_manager',
  ].includes(role ?? '');

  const currentTenantId =
    currentUser?.tenantId != null
      ? Number(currentUser.tenantId)
      : null;

  const currentBranchId =
    currentUser?.branchId != null
      ? Number(currentUser.branchId)
      : null;

  const [holidays, setHolidays] = useState<CompanyHoliday[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);

  const [branchFilter, setBranchFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [form, setForm] = useState<HolidayForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<CompanyHoliday | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Do not send a branch filter to the API. Company-wide holidays
  // must remain available when viewing an individual branch.
  const filters = useMemo(() => ({
    ...(isSuperAdmin && currentTenantId != null
      ? { tenantId: currentTenantId }
      : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
  }), [
    isSuperAdmin,
    currentTenantId,
    fromDate,
    toDate,
  ]);

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getCompanyHolidays(filters);

      setHolidays(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadHolidays();
  }, [loadHolidays]);

  useEffect(() => {
    let cancelled = false;

    async function loadBranches() {
      setBranchesLoading(true);

      try {
        const data = await getBranches();

        if (cancelled) return;

        setBranches(
          (Array.isArray(data) ? data : [])
            .map(mapBranch)
            .filter(
              branch =>
                Number.isInteger(branch.id) &&
                branch.id > 0,
            ),
        );
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load branches:', err);
        }
      } finally {
        if (!cancelled) {
          setBranchesLoading(false);
        }
      }
    }

    void loadBranches();

    return () => {
      cancelled = true;
    };
  }, []);

  const availableBranches = useMemo(() => {
    if (isBranchManager && currentBranchId != null) {
      return branches.filter(
        branch => branch.id === currentBranchId,
      );
    }

    return branches;
  }, [branches, isBranchManager, currentBranchId]);

  /*
   * All branches selected:
   *   Show all holidays returned by the authorized API.
   *
   * One branch selected:
   *   Show holidays for that branch plus company-wide holidays.
   *
   * Branch manager:
   *   Show their own branch plus company-wide holidays.
   */
  const filteredHolidays = useMemo(() => {
    const selectedBranchId = isBranchManager
      ? currentBranchId
      : branchFilter
        ? Number(branchFilter)
        : null;

    return holidays.filter(holiday => {
      const date = normalizeDate(holiday.date);

      if (fromDate && date < fromDate) return false;
      if (toDate && date > toDate) return false;

      if (selectedBranchId == null) {
        return true;
      }

      const holidayBranchId = getHolidayBranchId(holiday);

      return (
        holidayBranchId == null ||
        holidayBranchId === selectedBranchId
      );
    });
  }, [
    holidays,
    isBranchManager,
    currentBranchId,
    branchFilter,
    fromDate,
    toDate,
  ]);

  // Count unique dates so that a company-wide holiday and a
  // branch-specific holiday on the same date do not inflate totals.
  const uniqueHolidayDates = useMemo(
    () =>
      new Set(
        filteredHolidays
          .map(holiday => normalizeDate(holiday.date))
          .filter(Boolean),
      ),
    [filteredHolidays],
  );

  const upcomingCount = useMemo(() => {
    const today = localDateString();

    return new Set(
      filteredHolidays
        .filter(holiday => normalizeDate(holiday.date) >= today)
        .map(holiday => normalizeDate(holiday.date))
        .filter(Boolean),
    ).size;
  }, [filteredHolidays]);

  const openAdd = () => {
    if (!canManage) return;

    setEditing(null);

    setForm({
      ...EMPTY_FORM,
      branchId:
        isBranchManager && currentBranchId != null
          ? String(currentBranchId)
          : ALL_BRANCHES,
    });

    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const openEdit = (holiday: CompanyHoliday) => {
    if (!canManage) return;

    const holidayBranchId = getHolidayBranchId(holiday);

    // Branch managers cannot edit company-wide holidays or
    // holidays assigned to another branch.
    if (
      isBranchManager &&
      (
        holidayBranchId == null ||
        holidayBranchId !== currentBranchId
      )
    ) {
      setError(
        'Branch managers can edit only holidays assigned to their own branch.',
      );
      return;
    }

    setEditing(holiday);

    setForm({
      name: holiday.name ?? '',
      date: normalizeDate(holiday.date),
      branchId:
        holidayBranchId == null
          ? ALL_BRANCHES
          : String(holidayBranchId),
      description: holiday.description ?? '',
    });

    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!canManage) {
      setError('You do not have permission to manage holidays.');
      return;
    }

    if (!form.name.trim() || !form.date) {
      setError('Holiday name and date are required.');
      return;
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(form.date) ||
      Number.isNaN(new Date(`${form.date}T00:00:00`).getTime())
    ) {
      setError('Please enter a valid holiday date.');
      return;
    }

    if (fromDate && toDate && fromDate > toDate) {
      setError('The start date must not be after the end date.');
      return;
    }

    // Branch managers must always use their assigned branch.
    if (isBranchManager) {
      if (
        currentBranchId == null ||
        !Number.isInteger(currentBranchId) ||
        Number(form.branchId) !== currentBranchId
      ) {
        setError(
          'Branch managers can manage holidays only for their own branch.',
        );
        return;
      }
    }

    const selectedBranchId =
      form.branchId === ALL_BRANCHES
        ? null
        : Number(form.branchId);

    if (
      selectedBranchId !== null &&
      (
        !Number.isInteger(selectedBranchId) ||
        selectedBranchId <= 0 ||
        !availableBranches.some(
          branch => branch.id === selectedBranchId,
        )
      )
    ) {
      setError('Please select a valid branch.');
      return;
    }

    const payload: HolidayPayload = {
      ...(isSuperAdmin && currentTenantId != null
        ? { tenantId: currentTenantId }
        : {}),
      branchId: selectedBranchId,
      name: form.name.trim(),
      date: form.date,
      description: form.description.trim() || null,
    };

    setSaving(true);

    try {
      if (editing) {
        await updateCompanyHoliday(editing.id, payload);
        setSuccess('Holiday updated successfully.');
      } else {
        await createCompanyHoliday(payload);
        setSuccess('Holiday added successfully.');
      }

      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);

      await loadHolidays();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (holiday: CompanyHoliday) => {
    if (!canManage) return;

    const holidayBranchId = getHolidayBranchId(holiday);

    if (
      isBranchManager &&
      (
        holidayBranchId == null ||
        holidayBranchId !== currentBranchId
      )
    ) {
      setError(
        'Branch managers can delete only holidays assigned to their own branch.',
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete "${holiday.name}" on ${formatDate(holiday.date)}?`,
    );

    if (!confirmed) return;

    setDeletingId(holiday.id);
    setError('');
    setSuccess('');

    try {
      await deleteCompanyHoliday(holiday.id);
      setSuccess('Holiday deleted successfully.');
      await loadHolidays();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setBranchFilter('');
    setFromDate('');
    setToDate('');
  };

  const getBranchLabel = (holiday: CompanyHoliday) => {
    const branchId = getHolidayBranchId(holiday);

    if (branchId == null) {
      return 'All Branches';
    }

    return (
      (holiday as CompanyHoliday & {
        branchName?: string | null;
      }).branchName ??
      branches.find(branch => branch.id === branchId)?.branchName ??
      `Branch ${branchId}`
    );
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5C3FE0]/15 text-[#A78BFA]">
            <CalendarDays size={22} />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-white">
              Company Holidays
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage holidays for individual branches or your entire company.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadHolidays()}
            disabled={loading}
            className={SECONDARY_BUTTON_CLASS}
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          {canManage && (
            <button
              type="button"
              onClick={openAdd}
              className={PRIMARY_BUTTON_CLASS}
            >
              <Plus size={17} />
              Add Holiday
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="whitespace-pre-wrap">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={`${PANEL_CLASS} p-5`}>
          <p className="text-sm text-slate-400">
            Holiday records
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {filteredHolidays.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {uniqueHolidayDates.size} unique holiday date
            {uniqueHolidayDates.size === 1 ? '' : 's'}
          </p>
        </div>

        <div className={`${PANEL_CLASS} p-5`}>
          <p className="text-sm text-slate-400">
            Upcoming holidays
          </p>
          <p className="mt-2 text-3xl font-bold text-[#A78BFA]">
            {upcomingCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Unique dates from today onward
          </p>
        </div>

        <div className={`${PANEL_CLASS} p-5`}>
          <p className="text-sm text-slate-400">
            Management access
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {canManage ? 'Enabled' : 'View only'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <section className={`${PANEL_CLASS} p-5`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={LABEL_CLASS}>
              Branch
            </label>

            <select
              value={
                isBranchManager
                  ? String(currentBranchId ?? '')
                  : branchFilter
              }
              onChange={event => setBranchFilter(event.target.value)}
              disabled={isBranchManager}
              className={INPUT_CLASS}
            >
              {!isBranchManager && (
                <option value="">All branches</option>
              )}

              {availableBranches.map(branch => (
                <option key={branch.id} value={String(branch.id)}>
                  {branch.branchName}
                </option>
              ))}

              {isBranchManager &&
                currentBranchId != null &&
                !availableBranches.some(
                  branch => branch.id === currentBranchId,
                ) && (
                  <option value={String(currentBranchId)}>
                    My branch
                  </option>
                )}
            </select>

            <p className="mt-1.5 text-xs text-slate-500">
              Branch views also include company-wide holidays.
            </p>
          </div>

          <div>
            <label className={LABEL_CLASS}>
              From date
            </label>

            <input
              type="date"
              value={fromDate}
              onChange={event => setFromDate(event.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>
              To date
            </label>

            <input
              type="date"
              min={fromDate || undefined}
              value={toDate}
              onChange={event => setToDate(event.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              className={`${SECONDARY_BUTTON_CLASS} w-full`}
            >
              Clear filters
            </button>
          </div>
        </div>
      </section>

      {/* Holiday table */}
      <section className={`${PANEL_CLASS} overflow-hidden`}>
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold text-white">
            Holiday calendar
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {filteredHolidays.length} record
            {filteredHolidays.length === 1 ? '' : 's'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-400">
            <Loader2 size={20} className="animate-spin text-[#A78BFA]" />
            Loading holidays...
          </div>
        ) : filteredHolidays.length === 0 ? (
          <div className="flex flex-col items-center p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5C3FE0]/10 text-[#A78BFA]">
              <CalendarDays size={28} />
            </div>

            <p className="mt-4 font-medium text-white">
              No holidays found
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Add a holiday or change the filters.
            </p>

            {canManage && (
              <button
                type="button"
                onClick={openAdd}
                className={`${PRIMARY_BUTTON_CLASS} mt-4`}
              >
                <Plus size={16} />
                Add Holiday
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Holiday</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Applicable branches</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  {canManage && (
                    <th className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {filteredHolidays.map(holiday => {
                  const allBranches =
                    getHolidayBranchId(holiday) == null;

                  const canEditThisHoliday =
                    !isBranchManager ||
                    (
                      !allBranches &&
                      getHolidayBranchId(holiday) === currentBranchId
                    );

                  return (
                    <tr
                      key={holiday.id}
                      className="transition hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-4 font-medium text-white">
                        {holiday.name}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-300">
                        {formatDate(holiday.date)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            allBranches
                              ? 'inline-flex items-center gap-1.5 rounded-full border border-[#5C3FE0]/40 bg-[#5C3FE0]/15 px-3 py-1 text-xs font-medium text-[#C4B5FD]'
                              : 'inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300'
                          }
                        >
                          {allBranches && <Building2 size={13} />}
                          {getBranchLabel(holiday)}
                        </span>
                      </td>

                      <td className="max-w-xs px-5 py-4 text-slate-400">
                        {holiday.description || '—'}
                      </td>

                      {canManage && (
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {canEditThisHoliday && (
                              <button
                                type="button"
                                onClick={() => openEdit(holiday)}
                                title="Edit holiday"
                                aria-label={`Edit ${holiday.name}`}
                                className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-[#5C3FE0]/15 hover:text-[#A78BFA]"
                              >
                                <Pencil size={16} />
                              </button>
                            )}

                            {canEditThisHoliday && (
                              <button
                                type="button"
                                onClick={() => void handleDelete(holiday)}
                                disabled={deletingId === holiday.id}
                                title="Delete holiday"
                                aria-label={`Delete ${holiday.name}`}
                                className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
                              >
                                {deletingId === holiday.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add / Edit modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <div className="my-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#0e0b2e] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {editing ? 'Edit Holiday' : 'Add Company Holiday'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Choose one branch or apply the holiday across all branches.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close holiday form"
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 p-6">
              <div>
                <label className={LABEL_CLASS}>
                  Holiday name *
                </label>

                <input
                  required
                  maxLength={200}
                  value={form.name}
                  onChange={event =>
                    setForm(old => ({
                      ...old,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Independence Day"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL_CLASS}>
                    Holiday date *
                  </label>

                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={event =>
                      setForm(old => ({
                        ...old,
                        date: event.target.value,
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Applicable branch *
                  </label>

                  <select
                    // Do not require a branch selection for authorized
                    // users: an empty value represents All Branches.
                    required={isBranchManager}
                    value={form.branchId}
                    disabled={isBranchManager || branchesLoading}
                    onChange={event =>
                      setForm(old => ({
                        ...old,
                        branchId: event.target.value,
                      }))
                    }
                    className={INPUT_CLASS}
                  >
                    {!isBranchManager && (
                      <option value="">
                        All Branches
                      </option>
                    )}

                    {availableBranches.map(branch => (
                      <option
                        key={branch.id}
                        value={String(branch.id)}
                      >
                        {branch.branchName}
                      </option>
                    ))}

                    {isBranchManager &&
                      currentBranchId != null &&
                      !availableBranches.some(
                        branch => branch.id === currentBranchId,
                      ) && (
                        <option value={String(currentBranchId)}>
                          My branch
                        </option>
                      )}
                  </select>

                  <p className="mt-2 text-xs text-slate-500">
                    {branchesLoading
                      ? 'Loading available branches...'
                      : isBranchManager
                        ? 'Branch managers can assign holidays only to their own branch.'
                        : form.branchId === ALL_BRANCHES
                          ? 'This holiday will apply to every branch in the tenant.'
                          : 'This holiday will apply only to the selected branch.'}
                  </p>
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  Description
                </label>

                <textarea
                  rows={3}
                  maxLength={1000}
                  value={form.description}
                  onChange={event =>
                    setForm(old => ({
                      ...old,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Optional holiday details"
                  className={`${INPUT_CLASS} resize-y`}
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className={SECONDARY_BUTTON_CLASS}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || branchesLoading}
                  className={PRIMARY_BUTTON_CLASS}
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : editing ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Plus size={16} />
                  )}

                  {saving
                    ? 'Saving...'
                    : editing
                      ? 'Save Changes'
                      : 'Add Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
