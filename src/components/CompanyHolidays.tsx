
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  CalendarDays,
  CalendarCheck,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
  CheckCircle2,
  Building2,
  Save,
  Clock3,
} from 'lucide-react';

import { useApp } from '../context/AppContext';

import {
  type CompanyHoliday,
  createCompanyHoliday,
  deleteCompanyHoliday,
  getCompanyHolidays,
  updateCompanyHoliday,
} from '../api/companyHolidays';

import {
  type BranchWorkingDay,
  getBranchWorkingDays,
  saveBranchWorkingDays,
} from '../api/branchWorkingDays';

import { getBranches } from '../api/branches';

type HolidayForm = {
  name: string;
  date: string;
  branchId: string;
  description: string;
};

type BranchOption = {
  id: number;
  tenantId?: number | null;
  branchName: string;
};

type HolidayPayload = {
  tenantId?: number;
  branchId: number | null;
  name: string;
  date: string;
  description: string | null;
};

type WeekdayOption = {
  value: number;
  label: string;
  short: string;
};

const ALL_BRANCHES = '';

const EMPTY_FORM: HolidayForm = {
  name: '',
  date: '',
  branchId: ALL_BRANCHES,
  description: '',
};

const WEEKDAYS: WeekdayOption[] = [
  { value: 1, label: 'Monday', short: 'MON' },
  { value: 2, label: 'Tuesday', short: 'TUE' },
  { value: 3, label: 'Wednesday', short: 'WED' },
  { value: 4, label: 'Thursday', short: 'THU' },
  { value: 5, label: 'Friday', short: 'FRI' },
  { value: 6, label: 'Saturday', short: 'SAT' },
  { value: 0, label: 'Sunday', short: 'SUN' },
];

const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5];

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
  const tenantValue = branch.tenantId ?? branch.TenantId;

  return {
    id,
    tenantId:
      tenantValue == null ? null : Number(tenantValue),
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

  if (value == null) return null;

  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function getDayNumber(day: BranchWorkingDay): number {
  const raw = (
    day as BranchWorkingDay & { DayOfWeek?: number }
  );

  return Number(raw.dayOfWeek ?? raw.DayOfWeek);
}

function getDayWorking(day: BranchWorkingDay): boolean {
  const raw = (
    day as BranchWorkingDay & { IsWorkingDay?: boolean }
  );

  return Boolean(raw.isWorkingDay ?? raw.IsWorkingDay);
}

export default function CompanyHolidays() {
  const {
    currentUser,
    selectedBranchId,
    branches: contextBranches,
  } = useApp();

  const role = (
    currentUser?.roleName ??
    currentUser?.role ??
    ''
  ).trim().toLowerCase();

  const isSuperAdmin = role === 'super_admin';
  const isBranchManager = role === 'branch_manager';

  const canManage = [
    'super_admin',
    'company_admin',
    'hr_ops',
    'branch_manager',
  ].includes(role);

  const currentTenantId =
    currentUser?.tenantId != null
      ? Number(currentUser.tenantId)
      : null;

  const currentBranchId =
    currentUser?.branchId != null
      ? Number(currentUser.branchId)
      : null;

  // A branch manager always stays on their assigned branch.
  // Other users follow the branch selected in the dashboard header.
  const effectiveBranchId = isBranchManager
    ? currentBranchId
    : selectedBranchId != null
      ? Number(selectedBranchId)
      : null;

  const [holidays, setHolidays] = useState<CompanyHoliday[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);

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

  // Working schedule state.
  const [scheduleBranchId, setScheduleBranchId] = useState('');
  const [workingDays, setWorkingDays] = useState<number[]>(
    DEFAULT_WORKING_DAYS,
  );
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState('');
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [holidayBranchFilterId, setHolidayBranchFilterId] = useState('');

  const filters = useMemo(
    () => ({
      ...(isSuperAdmin && currentTenantId != null
        ? { tenantId: currentTenantId }
        : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
    }),
    [isSuperAdmin, currentTenantId, fromDate, toDate],
  );

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getCompanyHolidays(filters);
      setHolidays(Array.isArray(result) ? result : []);
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
    setHolidayBranchFilterId(
      effectiveBranchId != null ? String(effectiveBranchId) : ''
    );
  }, [effectiveBranchId]);

  // Use the shared branch collection when available, and load the API
  // collection as a fallback for this page's branch labels.
  useEffect(() => {
    let cancelled = false;

    async function loadBranches() {
      setBranchesLoading(true);

      try {
        const result = await getBranches();

        if (cancelled) return;

        setBranches(
          (Array.isArray(result) ? result : [])
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

          const shared = Array.isArray(contextBranches)
            ? contextBranches.map(mapBranch)
            : [];

          setBranches(
            shared.filter(
              branch =>
                Number.isInteger(branch.id) &&
                branch.id > 0,
            ),
          );
        }
      } finally {
        if (!cancelled) setBranchesLoading(false);
      }
    }

    void loadBranches();

    return () => {
      cancelled = true;
    };
  }, [contextBranches]);

  const availableBranches = useMemo(() => {
    const source =
      branches.length > 0
        ? branches
        : Array.isArray(contextBranches)
          ? contextBranches.map(mapBranch)
          : [];

    const unique = source.filter(
      (branch, index, all) =>
        Number.isInteger(branch.id) &&
        branch.id > 0 &&
        all.findIndex(item => item.id === branch.id) === index,
    );

    // Keep the list scoped to the signed-in tenant where the tenant
    // identifier is available on both the user and branch.
    const tenantScoped = unique.filter(branch => {
      if (
        currentTenantId == null ||
        branch.tenantId == null
      ) {
        return true;
      }

      return branch.tenantId === currentTenantId;
    });

    if (isBranchManager && currentBranchId != null) {
      return tenantScoped.filter(
        branch => branch.id === currentBranchId,
      );
    }

    return tenantScoped;
  }, [
    branches,
    contextBranches,
    currentTenantId,
    isBranchManager,
    currentBranchId,
  ]);

  const currentBranchName = useMemo(() => {
    if (effectiveBranchId == null) return null;

    return (
      availableBranches.find(
        branch => branch.id === effectiveBranchId,
      )?.branchName ??
      `Branch ${effectiveBranchId}`
    );
  }, [availableBranches, effectiveBranchId]);

  const holidayFilterBranchId =
    effectiveBranchId != null
      ? effectiveBranchId
      : holidayBranchFilterId !== ''
        ? Number(holidayBranchFilterId)
        : null;

  // Keep the working schedule synchronized with the branch chosen
  // in the dashboard header. Only allow local branch selection if
  // there is no active header selection and the user is not a manager.
  useEffect(() => {
    if (effectiveBranchId != null) {
      setScheduleBranchId(String(effectiveBranchId));
      return;
    }

    if (
      scheduleBranchId &&
      availableBranches.some(
        branch => String(branch.id) === scheduleBranchId,
      )
    ) {
      return;
    }

    setScheduleBranchId(
      availableBranches.length > 0
        ? String(availableBranches[0].id)
        : '',
    );
  }, [
    effectiveBranchId,
    availableBranches,
    scheduleBranchId,
  ]);

  // Load the schedule for the currently selected branch.
  useEffect(() => {
    let cancelled = false;

    async function loadSchedule() {
      if (!scheduleBranchId || !canManage) {
        setWorkingDays(DEFAULT_WORKING_DAYS);
        setScheduleLoaded(false);
        setScheduleLoading(false);
        setScheduleError('');
        setScheduleSuccess('');
        return;
      }

      setScheduleLoading(true);
      setScheduleLoaded(false);
      setScheduleError('');
      setScheduleSuccess('');

      try {
        const result = await getBranchWorkingDays(
          Number(scheduleBranchId),
          isSuperAdmin && currentTenantId != null
            ? currentTenantId
            : undefined,
        );

        if (cancelled) return;

        if (!Array.isArray(result) || result.length === 0) {
          setWorkingDays(DEFAULT_WORKING_DAYS);
        } else {
          setWorkingDays(
            result
              .filter(getDayWorking)
              .map(getDayNumber)
              .filter(day =>
                WEEKDAYS.some(option => option.value === day),
              ),
          );
        }

        setScheduleLoaded(true);
      } catch (err) {
        if (!cancelled) {
          setScheduleError(errorMessage(err));
          setScheduleLoaded(false);
        }
      } finally {
        if (!cancelled) setScheduleLoading(false);
      }
    }

    void loadSchedule();

    return () => {
      cancelled = true;
    };
  }, [
    scheduleBranchId,
    canManage,
    isSuperAdmin,
    currentTenantId,
  ]);

  const handleToggleWorkingDay = (day: number) => {
    if (!canManage || scheduleLoading || scheduleSaving) return;

    setWorkingDays(previous =>
      previous.includes(day)
        ? previous.filter(item => item !== day)
        : [...previous, day],
    );

    setScheduleSuccess('');
    setScheduleError('');
  };

  const handleSaveSchedule = async () => {
    if (!canManage) {
      setScheduleError(
        'You do not have permission to manage working days.',
      );
      return;
    }

    const branchId = Number(scheduleBranchId);

    if (
      !scheduleBranchId ||
      !Number.isInteger(branchId) ||
      branchId <= 0 ||
      !availableBranches.some(branch => branch.id === branchId)
    ) {
      setScheduleError('Please select a valid branch.');
      return;
    }

    if (
      effectiveBranchId != null &&
      branchId !== effectiveBranchId
    ) {
      setScheduleError(
        'The schedule must match the branch selected in the dashboard header.',
      );
      return;
    }

    if (isBranchManager && branchId !== currentBranchId) {
      setScheduleError(
        'Branch managers can configure only their assigned branch.',
      );
      return;
    }

    setScheduleSaving(true);
    setScheduleError('');
    setScheduleSuccess('');

    try {
      await saveBranchWorkingDays(branchId, {
        ...(isSuperAdmin && currentTenantId != null
          ? { tenantId: currentTenantId }
          : {}),
        days: WEEKDAYS.map(day => ({
          dayOfWeek: day.value,
          isWorkingDay: workingDays.includes(day.value),
        })),
      });

      setScheduleSuccess(
        `Working schedule saved for ${currentBranchName ?? `Branch ${branchId}`}.`,
      );
      setScheduleLoaded(true);
    } catch (err) {
      setScheduleError(errorMessage(err));
    } finally {
      setScheduleSaving(false);
    }
  };

  // Show only the active branch's holidays plus company-wide holidays.
  // With no active branch selected, show all authorized holidays.
  const filteredHolidays = useMemo(() => {
    return holidays.filter((holiday) => {
      const date = normalizeDate(holiday.date);

      if (fromDate && date < fromDate) return false;
      if (toDate && date > toDate) return false;

      // Use the branch selected in Holiday Filters.
      if (holidayFilterBranchId == null) return true;

      const holidayBranchId = getHolidayBranchId(holiday);

      // Include company-wide holidays for every branch.
      return (
        holidayBranchId == null ||
        holidayBranchId === holidayFilterBranchId
      );
    });
  }, [
    holidays,
    fromDate,
    toDate,
    holidayFilterBranchId,
  ]);

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
        effectiveBranchId != null
          ? String(effectiveBranchId)
          : ALL_BRANCHES,
    });

    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const openEdit = (holiday: CompanyHoliday) => {
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
        'Branch managers can edit only holidays assigned to their own branch.',
      );
      return;
    }

    if (
      effectiveBranchId != null &&
      holidayBranchId != null &&
      holidayBranchId !== effectiveBranchId
    ) {
      setError(
        'You can edit only holidays applicable to the selected branch.',
      );
      return;
    }

    // A company-wide holiday is visible in a branch view, but changing
    // it must not silently turn it into a branch-specific holiday.
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

    const selectedBranchId =
      form.branchId === ALL_BRANCHES
        ? null
        : Number(form.branchId);

    if (
      isBranchManager &&
      (
        currentBranchId == null ||
        selectedBranchId !== currentBranchId
      )
    ) {
      setError(
        'Branch managers can manage holidays only for their own branch.',
      );
      return;
    }

    // When a header branch is selected, do not allow a holiday to be
    // created or edited for a different branch from this page.
    if (
      effectiveBranchId != null &&
      selectedBranchId !== effectiveBranchId
    ) {
      setError(
        'Select the applicable branch in the dashboard header before managing its holidays.',
      );
      return;
    }

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

    if (
      effectiveBranchId != null &&
      holidayBranchId !== effectiveBranchId
    ) {
      setError(
        'Company-wide holidays cannot be deleted from a branch-specific view. Select All Branches to manage them.',
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
    setFromDate('');
    setToDate('');
  };

  const getBranchLabel = (holiday: CompanyHoliday) => {
    const branchId = getHolidayBranchId(holiday);

    if (branchId == null) return 'All Branches';

    return (
      (holiday as CompanyHoliday & {
        branchName?: string | null;
      }).branchName ??
      availableBranches.find(branch => branch.id === branchId)?.branchName ??
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
              Manage holidays and working days for the selected branch.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              void loadHolidays();
              setScheduleSuccess('');
              if (scheduleBranchId) {
                setScheduleBranchId(scheduleBranchId);
              }
            }}
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

      {/* Holiday notifications */}
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
          <p className="text-sm text-slate-400">Holiday records</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {filteredHolidays.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {uniqueHolidayDates.size} unique holiday date
            {uniqueHolidayDates.size === 1 ? '' : 's'}
          </p>
        </div>

        <div className={`${PANEL_CLASS} p-5`}>
          <p className="text-sm text-slate-400">Upcoming holidays</p>
          <p className="mt-2 text-3xl font-bold text-[#A78BFA]">
            {upcomingCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Unique dates from today onward
          </p>
        </div>

        {/* Replaces Management access with Current Branch */}
        <div className={`${PANEL_CLASS} p-5`}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-400">Current Branch</p>
            <Building2 size={18} className="text-[#A78BFA]" />
          </div>

          <p className="mt-2 break-words text-lg font-semibold text-white">
            {currentBranchName ??
              (effectiveBranchId == null ? 'All Branches' : `Branch ${effectiveBranchId}`)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {effectiveBranchId == null
              ? 'Showing holidays across your authorized scope'
              : `Branch ID: ${effectiveBranchId}`}
          </p>
        </div>
      </div>

      {/* Branch Working Schedule */}
      <section className={`${PANEL_CLASS} overflow-hidden`}>
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
              <CalendarCheck size={22} />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                Branch Working Schedule
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Configure the regular workweek used for attendance calculations.
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
            <Clock3 size={14} />
            {workingDays.length} of 7 working days
          </span>
        </div>

        <div className="space-y-5 p-5">
          {scheduleError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span className="whitespace-pre-wrap">{scheduleError}</span>
            </div>
          )}

          {scheduleSuccess && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
              <span>{scheduleSuccess}</span>
            </div>
          )}

          <div className="max-w-xl">
            <label className={LABEL_CLASS}>Branch</label>

            <select
              value={scheduleBranchId}
              onChange={event => setScheduleBranchId(event.target.value)}
              disabled={
                branchesLoading ||
                scheduleLoading ||
                effectiveBranchId != null ||
                isBranchManager ||
                !canManage
              }
              className={INPUT_CLASS}
            >
              {/* <option value="">
                {branchesLoading ? 'Loading branches...' : 'Select a branch'}
              </option> */}

              {availableBranches.map(branch => (
                <option key={branch.id} value={String(branch.id)}>
                  {branch.branchName}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-slate-500">
              {effectiveBranchId != null
                ? 'Linked to the branch selected in the dashboard header.'
                : 'Select a branch in the dashboard header to lock this schedule to that branch.'}
            </p>
          </div>

          {!canManage ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
              You have view-only access to branch working schedules.
            </div>
          ) : branchesLoading ? (
            <div className="flex items-center gap-3 py-8 text-sm text-slate-400">
              <Loader2 size={19} className="animate-spin text-[#A78BFA]" />
              Loading available branches...
            </div>
          ) : !scheduleBranchId ? (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
              Select a branch in the dashboard header to configure its schedule.
            </div>
          ) : scheduleLoading ? (
            <div className="flex items-center justify-center gap-3 py-10 text-sm text-slate-400">
              <Loader2 size={20} className="animate-spin text-[#A78BFA]" />
              Loading saved working schedule...
            </div>
          ) : (
            <>
              <div>
                <div className="mb-3 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                  <p className="text-sm font-medium text-slate-200">
                    Select working days
                  </p>
                  <p className="text-xs text-slate-500">
                    Selected days count as scheduled working days.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {WEEKDAYS.map(day => {
                    const isWorking = workingDays.includes(day.value);

                    return (
                      <button
                        key={day.value}
                        type="button"
                        aria-pressed={isWorking}
                        onClick={() => handleToggleWorkingDay(day.value)}
                        disabled={scheduleSaving || !scheduleLoaded}
                        className={[
                          'rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60',
                          isWorking
                            ? 'border-emerald-400/40 bg-emerald-400/[0.08] hover:bg-emerald-400/[0.13]'
                            : 'border-white/10 bg-white/[0.025] hover:bg-white/[0.06]',
                        ].join(' ')}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={[
                              'text-xs font-semibold tracking-wide',
                              isWorking ? 'text-emerald-300' : 'text-slate-400',
                            ].join(' ')}
                          >
                            {day.short}
                          </span>

                          <span
                            className={[
                              'h-2.5 w-2.5 rounded-full',
                              isWorking ? 'bg-emerald-400' : 'bg-slate-600',
                            ].join(' ')}
                          />
                        </div>

                        <p className="mt-3 text-sm font-medium text-white">
                          {day.label}
                        </p>

                        <p
                          className={[
                            'mt-1 text-xs',
                            isWorking ? 'text-emerald-300' : 'text-slate-500',
                          ].join(' ')}
                        >
                          {isWorking ? 'Working day' : 'Day off'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-slate-500">
                  The schedule defines regular working days. Public holidays,
                  approved leave, and attendance records must also be considered
                  by monthly attendance calculations.
                </p>

                <button
                  type="button"
                  onClick={() => void handleSaveSchedule()}
                  disabled={
                    scheduleSaving ||
                    scheduleLoading ||
                    !scheduleLoaded ||
                    !scheduleBranchId
                  }
                  className={`${PRIMARY_BUTTON_CLASS} shrink-0`}
                >
                  {scheduleSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {scheduleSaving ? 'Saving schedule...' : 'Save Schedule'}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Holiday filters: branch is controlled by the dashboard header */}
      <section className={`${PANEL_CLASS} p-5`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={LABEL_CLASS}>Filter holidays by branch</label>

            <select
              value={
                effectiveBranchId != null
                  ? String(effectiveBranchId)
                  : holidayBranchFilterId
              }
              onChange={(e) => setHolidayBranchFilterId(e.target.value)}
              disabled={
                branchesLoading ||
                effectiveBranchId != null ||
                isBranchManager
              }
              className={INPUT_CLASS}
            >
              <option value="">All Branches</option>

              {availableBranches.map((branch) => (
                <option key={branch.id} value={String(branch.id)}>
                  {branch.branchName}
                </option>
              ))}
            </select>

            <p className="mt-1 text-xs text-gray-500">
              {effectiveBranchId != null
                ? 'Following the branch selected in the dashboard header.'
                : 'Choose a branch to filter holidays without changing the dashboard header.'}
            </p>
          </div>

          <div>
            <label className={LABEL_CLASS}>From date</label>
            <input
              type="date"
              value={fromDate}
              onChange={event => setFromDate(event.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>To date</label>
            <input
              type="date"
              min={fromDate || undefined}
              value={toDate}
              onChange={event => setToDate(event.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {(fromDate || toDate) && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className={SECONDARY_BUTTON_CLASS}
            >
              Clear date filters
            </button>
          </div>
        )}
      </section>

      {/* Holiday table */}
      <section className={`${PANEL_CLASS} overflow-hidden`}>
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold text-white">Holiday calendar</h2>
          <p className="mt-1 text-xs text-slate-500">
            {filteredHolidays.length} record
            {filteredHolidays.length === 1 ? '' : 's'}
            {effectiveBranchId != null
              ? ` for ${currentBranchName ?? 'the selected branch'}, including company-wide holidays`
              : ' across your authorized branches'}
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

            <p className="mt-4 font-medium text-white">No holidays found</p>
            <p className="mt-1 text-sm text-slate-400">
              Add a holiday or change the date filters.
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
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {filteredHolidays.map(holiday => {
                  const holidayBranchId = getHolidayBranchId(holiday);
                  const allBranches = holidayBranchId == null;

                  const canEditThisHoliday =
                    !isBranchManager &&
                      (
                        effectiveBranchId == null ||
                        holidayBranchId === effectiveBranchId
                      )
                      ? true
                      : (
                        !allBranches &&
                        holidayBranchId === currentBranchId &&
                        isBranchManager
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

      {/* Add / Edit holiday modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm"
          onMouseDown={event => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div className="my-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#0e0b2e] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {editing ? 'Edit Holiday' : 'Add Company Holiday'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {effectiveBranchId != null
                    ? `This holiday will be managed for ${currentBranchName ?? 'the selected branch'}.`
                    : 'Choose a branch or apply the holiday across all branches.'}
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
                <label className={LABEL_CLASS}>Holiday name *</label>
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
                  <label className={LABEL_CLASS}>Holiday date *</label>
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
                  <label className={LABEL_CLASS}>Applicable branch *</label>

                  {effectiveBranchId != null ? (
                    <div className={`${INPUT_CLASS} flex items-center gap-2`}>
                      <Building2 size={16} className="shrink-0 text-[#A78BFA]" />
                      <span className="truncate">
                        {currentBranchName ?? `Branch ${effectiveBranchId}`}
                      </span>
                    </div>
                  ) : (
                    <select
                      value={form.branchId}
                      disabled={branchesLoading}
                      onChange={event =>
                        setForm(old => ({
                          ...old,
                          branchId: event.target.value,
                        }))
                      }
                      className={INPUT_CLASS}
                    >
                      <option value="">All Branches</option>

                      {availableBranches.map(branch => (
                        <option
                          key={branch.id}
                          value={String(branch.id)}
                        >
                          {branch.branchName}
                        </option>
                      ))}
                    </select>
                  )}

                  <p className="mt-2 text-xs text-slate-500">
                    {effectiveBranchId != null
                      ? 'The branch is locked to the selection in the dashboard header.'
                      : form.branchId === ALL_BRANCHES
                        ? 'This holiday will apply to every branch in the authorized tenant.'
                        : 'This holiday will apply only to the selected branch.'}
                  </p>
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>Description</label>
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
