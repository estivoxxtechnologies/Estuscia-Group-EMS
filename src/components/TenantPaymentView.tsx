import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  CreditCard,
  Edit3,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import { getTenants, BackendTenant } from '../api/tenants';

import {
  getTenantPayments,
  getTenantPaymentHistory,
  createTenantPayment,
  updateTenantPayment,
  deleteTenantPayment,
  TenantPaymentListItem,
} from '../api/tenantPayments';

import {
  PaymentMode,
  PaymentStatus,
} from '../types/tenantPayment';

interface TenantPaymentViewProps {
  currentUser?: {
    roleName?: string;
  } | null;
}

type PageMode = 'list' | 'history' | 'details';

interface PaymentForm {
  tenantId: number | null;
  totalBranches: number;
  paymentMode: PaymentMode;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentDateUtc: string;
  validFromUtc: string;
  validUntilUtc: string;
  registrationStatus: boolean;
  notes: string;
}

const paymentModes: PaymentMode[] = [
  'Monthly',
  'Quarterly',
  'HalfYearly',
  'Yearly',
];

const paymentStatuses: PaymentStatus[] = [
  'Pending',
  'Paid'
];

const emptyForm: PaymentForm = {
  tenantId: null,
  totalBranches: 0,
  paymentMode: 'Monthly',
  amount: 0,
  paymentStatus: 'Pending',
  paymentDateUtc: '',
  validFromUtc: '',
  validUntilUtc: '',
  registrationStatus: false,
  notes: '',
};

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const formatAmount = (
  amount: number,
  currency = 'INR'
) => {
  const currencyCode =
    currency?.split(' ')[0]?.toUpperCase() || 'INR';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

function toDateInput(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function statusClass(status: PaymentStatus) {
  switch (status) {
    case 'Paid':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

    case 'Pending':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    default:
      return 'bg-white/5 text-gray-400 border-white/10';
  }
}

export default function TenantPaymentView({
  currentUser,
}: TenantPaymentViewProps) {
  const [pageMode, setPageMode] = useState<PageMode>('list');

  const [tenants, setTenants] = useState<BackendTenant[]>([]);
  const [payments, setPayments] = useState<TenantPaymentListItem[]>([]);
  const [tenantHistory, setTenantHistory] = useState<TenantPaymentListItem[]>(
    []
  );

  const [selectedTenant, setSelectedTenant] =
    useState<BackendTenant | null>(null);

  const [selectedPayment, setSelectedPayment] =
    useState<TenantPaymentListItem | null>(null);

  const [search, setSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyFromYear, setHistoryFromYear] =
    useState<number>(new Date().getFullYear());

  const [historyToYear, setHistoryToYear] =
    useState<number>(new Date().getFullYear());

  const [historyStatus, setHistoryStatus] =
    useState<'All' | PaymentStatus>('All');
  const [fromYear, setFromYear] = useState<number>(new Date().getFullYear());
  const [toYear, setToYear] = useState<number>(new Date().getFullYear());

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [tenantSearch, setTenantSearch] = useState('');
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<'All' | PaymentStatus>('All');

  const [form, setForm] = useState<PaymentForm>(emptyForm);

  /*
   * ------------------------------------------------------------
   * LOAD ALL PAYMENTS
   * ------------------------------------------------------------
   */

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getTenantPayments();

      setPayments(data.items);
    } catch (err) {
      console.error(err);
      setError('Unable to load tenant payment records.');
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const data = await getTenants();
      setTenants(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentUser?.roleName && currentUser.roleName !== 'super_admin') {
      return;
    }

    loadPayments();
    loadTenants();
  }, [currentUser?.roleName]);

  /*
   * ------------------------------------------------------------
   * YEARS
   * ------------------------------------------------------------
   */

  const years = useMemo(
    () =>
      Array.from(
        { length: 2999 - 1900 + 1 },
        (_, index) => 1900 + index
      ),
    []
  );

  /*
   * ------------------------------------------------------------
   * MAIN PAYMENT LIST FILTER
   * ------------------------------------------------------------
   */

  const filteredPayments = useMemo(() => {
    const text = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch =
        !text ||
        payment.tenantName.toLowerCase().includes(text) ||
        payment.tenantCode.toLowerCase().includes(text);

      const matchesStatus =
        paymentStatusFilter === 'All' ||
        payment.paymentStatus === paymentStatusFilter;

      const paymentYear = payment.paymentDateUtc
        ? new Date(payment.paymentDateUtc).getFullYear()
        : payment.validFromUtc
          ? new Date(payment.validFromUtc).getFullYear()
          : null;

      const matchesYear =
        paymentYear !== null &&
        paymentYear >= fromYear &&
        paymentYear <= toYear;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesYear
      );
    });
  }, [
    payments,
    search,
    fromYear,
    toYear,
    paymentStatusFilter,
  ]);
  /*
   * ------------------------------------------------------------
   * OPEN TENANT HISTORY
   * ------------------------------------------------------------
   */

  const openTenantHistory = async (tenantId: number) => {
    try {
      setHistoryLoading(true);
      setError('');

      const tenant =
        tenants.find((item) => item.id === tenantId) ?? null;

      setSelectedTenant(tenant);

      const history = await getTenantPaymentHistory(tenantId);

      setTenantHistory(history);

      setSelectedPayment(null);
      setHistorySearch('');

      setPageMode('history');
    } catch (err) {
      console.error(err);
      setError('Unable to load payment history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * PAYMENT DETAILS
   * ------------------------------------------------------------
   */

  const openPaymentDetails = (payment: TenantPaymentListItem) => {
    setSelectedPayment(payment);
    setPageMode('details');
  };

  /*
   * ------------------------------------------------------------
   * BACK
   * ------------------------------------------------------------
   */

  const goBackToList = () => {
    setPageMode('list');
    setSelectedTenant(null);
    setSelectedPayment(null);
    setTenantHistory([]);
  };

  const goBackToHistory = () => {
    setPageMode('history');
    setSelectedPayment(null);
  };

  /*
   * ------------------------------------------------------------
   * ADD PAYMENT
   * ------------------------------------------------------------
   */

  const openAddModal = () => {
    setForm(emptyForm);
    setTenantSearch('');
    setShowTenantDropdown(false);
    setError('');
    setShowAddModal(true);
  };

  const filteredTenantOptions = useMemo(() => {
    const text = tenantSearch.trim().toLowerCase();

    if (!text) {
      return tenants.slice(0, 8);
    }

    return tenants
      .filter(
        (tenant) =>
          tenant.name.toLowerCase().includes(text) ||
          tenant.code.toLowerCase().includes(text) ||
          tenant.domain.toLowerCase().includes(text)
      )
      .slice(0, 8);
  }, [tenants, tenantSearch]);

  const selectTenantForPayment = (tenant: BackendTenant) => {
    setForm((previous) => ({
      ...previous,
      tenantId: tenant.id,
      totalBranches: 0,
    }));

    setTenantSearch(tenant.name);
    setShowTenantDropdown(false);
  };

  const selectedFormTenant = tenants.find(
    (tenant) => tenant.id === form.tenantId
  );

  const handleAddPayment = async () => {
    if (!form.tenantId) {
      setError('Please select a tenant.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      await createTenantPayment({
        tenantId: form.tenantId,
        totalBranches: Number(form.totalBranches),
        paymentMode: form.paymentMode,
        amount: Number(form.amount),
        paymentStatus: form.paymentStatus,
        paymentDateUtc: form.paymentDateUtc
          ? new Date(form.paymentDateUtc).toISOString()
          : null,
        validFromUtc: form.validFromUtc
          ? new Date(form.validFromUtc).toISOString()
          : null,
        validUntilUtc: form.validUntilUtc
          ? new Date(form.validUntilUtc).toISOString()
          : null,
        registrationStatus: form.registrationStatus,
        notes: form.notes.trim() || null,
      });

      setShowAddModal(false);
      setForm(emptyForm);

      await loadPayments();
    } catch (err) {
      console.error(err);
      setError('Unable to create payment record.');
    } finally {
      setSaving(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * EDIT
   * ------------------------------------------------------------
   */

  const openEditModal = () => {
    if (!selectedPayment) return;

    setForm({
      tenantId: selectedPayment.tenantId,
      totalBranches: selectedPayment.totalBranches ?? 0,
      paymentMode: selectedPayment.paymentMode,
      amount: selectedPayment.amount ?? 0,
      paymentStatus: selectedPayment.paymentStatus,
      paymentDateUtc: toDateInput(selectedPayment.paymentDateUtc),
      validFromUtc: toDateInput(selectedPayment.validFromUtc),
      validUntilUtc: toDateInput(selectedPayment.validUntilUtc),
      registrationStatus:
        selectedPayment.registrationStatus ?? false,
      notes: selectedPayment.notes ?? '',
    });

    const tenant = tenants.find(
      (item) => item.id === selectedPayment.tenantId
    );

    setTenantSearch(tenant?.name ?? selectedPayment.tenantName);

    setError('');
    setShowEditModal(true);
  };

  const handleUpdatePayment = async () => {
    if (!selectedPayment) return;

    try {
      setSaving(true);
      setError('');

      const updated = await updateTenantPayment(selectedPayment.id, {
        totalBranches: Number(form.totalBranches),
        paymentMode: form.paymentMode,
        amount: Number(form.amount),
        paymentStatus: form.paymentStatus,
        paymentDateUtc: form.paymentDateUtc
          ? new Date(form.paymentDateUtc).toISOString()
          : null,
        validFromUtc: form.validFromUtc
          ? new Date(form.validFromUtc).toISOString()
          : null,
        validUntilUtc: form.validUntilUtc
          ? new Date(form.validUntilUtc).toISOString()
          : null,
        registrationStatus: form.registrationStatus,
        notes: form.notes.trim() || null,
      });

      setSelectedPayment(updated);

      setTenantHistory((previous) =>
        previous.map((item) =>
          item.id === updated.id ? updated : item
        )
      );

      setShowEditModal(false);

      await loadPayments();
    } catch (err) {
      console.error(err);
      setError('Unable to update payment record.');
    } finally {
      setSaving(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * DELETE
   * ------------------------------------------------------------
   */

  const canDeleteSelectedPayment = tenantHistory.length > 1;

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;

    if (!canDeleteSelectedPayment) {
      setError(
        'This payment cannot be deleted because the tenant must have at least one payment record.'
      );
      setShowDeleteModal(false);
      return;
    }

    try {
      setDeleting(true);
      setError('');

      await deleteTenantPayment(selectedPayment.id);

      const remainingHistory = tenantHistory.filter(
        (item) => item.id !== selectedPayment.id
      );

      setTenantHistory(remainingHistory);
      setSelectedPayment(null);
      setShowDeleteModal(false);
      setPageMode('history');

      await loadPayments();
    } catch (err) {
      console.error(err);
      setError(
        'Unable to delete payment. The tenant must always have at least one payment record.'
      );
    } finally {
      setDeleting(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * TENANT HISTORY FILTER
   * ------------------------------------------------------------
   */

  const filteredHistory = useMemo(() => {
    const text = historySearch.trim().toLowerCase();

    return tenantHistory.filter((payment) => {
      const paymentYear = payment.paymentDateUtc
        ? new Date(payment.paymentDateUtc).getFullYear()
        : payment.validFromUtc
          ? new Date(payment.validFromUtc).getFullYear()
          : null;

      const matchesSearch =
        !text ||
        payment.paymentStatus.toLowerCase().includes(text) ||
        payment.paymentMode.toLowerCase().includes(text) ||
        String(payment.amount).includes(text) ||
        String(paymentYear ?? '').includes(text);

      const matchesYear =
        paymentYear !== null &&
        paymentYear >= historyFromYear &&
        paymentYear <= historyToYear;

      const matchesStatus =
        historyStatus === 'All' ||
        payment.paymentStatus === historyStatus;

      return (
        matchesSearch &&
        matchesYear &&
        matchesStatus
      );
    });
  }, [
    tenantHistory,
    historySearch,
    historyFromYear,
    historyToYear,
    historyStatus,
  ]);

  /*
   * ------------------------------------------------------------
   * ACCESS
   * ------------------------------------------------------------
   */

  if (
    currentUser?.roleName &&
    currentUser.roleName !== 'super_admin'
  ) {
    return (
      <div className="p-8 text-center text-gray-400">
        You do not have permission to access Tenant Payments.
      </div>
    );
  }

  /*
   * ------------------------------------------------------------
   * MAIN RENDER
   * ------------------------------------------------------------
   */

  return (
    <div className="min-h-full bg-[#09071e] text-white p-6">
      {error && (
        <div className="mb-5 flex items-start justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <span>{error}</span>

          <button
            onClick={() => setError('')}
            className="ml-4 text-red-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {pageMode === 'list' && (
        <PaymentListPage
          payments={filteredPayments}
          years={years}
          fromYear={fromYear}
          toYear={toYear}
          search={search}
          paymentStatusFilter={paymentStatusFilter}
          loading={loading}
          onSearchChange={setSearch}
          onPaymentStatusFilterChange={setPaymentStatusFilter}
          onFromYearChange={(value) => {
            setFromYear(value);

            if (value > toYear) {
              setToYear(value);
            }
          }}
          onToYearChange={(value) => {
            setToYear(value);

            if (value < fromYear) {
              setFromYear(value);
            }
          }}
          onAdd={openAddModal}
          onTenantClick={openTenantHistory}
        />
      )}

      {pageMode === 'history' && selectedTenant && (
        <PaymentHistoryPage
          tenant={selectedTenant}
          payments={filteredHistory}
          totalPayments={filteredHistory.length}
          search={historySearch}
          historyFromYear={historyFromYear}
          historyToYear={historyToYear}
          historyStatus={historyStatus}
          years={years}
          loading={historyLoading}
          onSearchChange={setHistorySearch}
          onHistoryFromYearChange={setHistoryFromYear}
          onHistoryToYearChange={setHistoryToYear}
          onHistoryStatusChange={setHistoryStatus}
          onBack={goBackToList}
          onAdd={openAddModal}
          onPaymentClick={openPaymentDetails}
        />
      )}

      {pageMode === 'details' &&
        selectedTenant &&
        selectedPayment && (
          <PaymentDetailsPage
            tenant={selectedTenant}
            payment={selectedPayment}
            paymentCount={tenantHistory.length}
            onBack={goBackToHistory}
            onEdit={openEditModal}
            onDelete={() => setShowDeleteModal(true)}
          />
        )}

      {showAddModal && (
        <PaymentModal
          mode="add"
          form={form}
          tenants={tenants}
          tenantSearch={tenantSearch}
          tenantOptions={filteredTenantOptions}
          selectedTenant={selectedFormTenant}
          showTenantDropdown={showTenantDropdown}
          saving={saving}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddPayment}
          onTenantSearchChange={(value) => {
            setTenantSearch(value);
            setShowTenantDropdown(true);

            if (!value) {
              setForm((previous) => ({
                ...previous,
                tenantId: null,
              }));
            }
          }}
          onTenantFocus={() => setShowTenantDropdown(true)}
          onSelectTenant={selectTenantForPayment}
          onChange={setForm}
        />
      )}

      {showEditModal && selectedPayment && (
        <PaymentModal
          mode="edit"
          form={form}
          tenants={tenants}
          tenantSearch={tenantSearch}
          tenantOptions={[]}
          selectedTenant={selectedFormTenant}
          showTenantDropdown={false}
          saving={saving}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdatePayment}
          onTenantSearchChange={() => { }}
          onTenantFocus={() => { }}
          onSelectTenant={() => { }}
          onChange={setForm}
        />
      )}

      {showDeleteModal && selectedPayment && (
        <DeleteModal
          payment={selectedPayment}
          canDelete={canDeleteSelectedPayment}
          deleting={deleting}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeletePayment}
        />
      )}
    </div>
  );
}

/* ================================================================
   PAYMENT LIST
================================================================ */

function PaymentListPage({
  payments,
  years,
  fromYear,
  toYear,
  search,
  paymentStatusFilter,
  loading,
  onSearchChange,
  onPaymentStatusFilterChange,
  onFromYearChange,
  onToYearChange,
  onAdd,
  onTenantClick,
}: {
  payments: TenantPaymentListItem[];
  years: number[];
  fromYear: number;
  toYear: number;
  search: string;
  paymentStatusFilter: 'All' | PaymentStatus;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onPaymentStatusFilterChange: (
    value: 'All' | PaymentStatus
  ) => void;
  onFromYearChange: (value: number) => void;
  onToYearChange: (value: number) => void;
  onAdd: () => void;
  onTenantClick: (tenantId: number) => void;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Tenant Payments
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Manage tenant payment records and payment history.
          </p>
        </div>

        <button
          onClick={onAdd}
          className="flex items-center gap-2 rounded-lg bg-[#5C3FE0] px-4 py-2.5 text-sm font-medium transition hover:bg-[#6c50ec]"
        >
          <Plus className="h-4 w-4" />
          Add Payment
        </button>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tenant or code..."
            className="w-full rounded-lg border border-white/10 bg-[#0e0b2e] py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#5C3FE0]"
          />
        </div>

        <span className="text-sm text-gray-500">
          From
        </span>

        <div className="relative">
          <select
            value={fromYear}
            onChange={(e) => onFromYearChange(Number(e.target.value))}
            className="appearance-none rounded-lg border border-white/10 bg-[#0e0b2e] py-2.5 pl-4 pr-10 text-sm outline-none focus:border-[#5C3FE0]"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        </div>

        <span className="text-sm text-gray-500">
          to
        </span>

        <div className="relative">
          <select
            value={toYear}
            onChange={(e) => onToYearChange(Number(e.target.value))}
            className="appearance-none rounded-lg border border-white/10 bg-[#0e0b2e] py-2.5 pl-4 pr-10 text-sm outline-none focus:border-[#5C3FE0]"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        </div>
        <div className="relative">
          <select
            value={paymentStatusFilter}
            onChange={(e) =>
              onPaymentStatusFilterChange(
                e.target.value as 'All' | PaymentStatus
              )
            }
            className="appearance-none rounded-lg border border-white/10 bg-[#0e0b2e] py-2.5 pl-4 pr-10 text-sm outline-none focus:border-[#5C3FE0]"
          >
            <option value="All">All</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>

          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0e0b2e]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-white/10 bg-white/[0.02]">
              <tr className="text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-4">Tenant</th>
                <th className="px-5 py-4">Code</th>
                <th className="px-5 py-4">Payment Date</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Mode</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Valid Until</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex items-center justify-center py-16 text-gray-400">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading payments...
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="py-16 text-center text-gray-500">
                      No payment records found.
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr
                    key={payment.id}
                    onClick={() => onTenantClick(payment.tenantId)}
                    className="cursor-pointer transition hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-white">
                        {payment.tenantName}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-400">
                      {payment.tenantCode}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-300">
                      {formatDate(payment.paymentDateUtc)}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium">
                      {formatAmount(payment.amount)}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-300">
                      {payment.paymentMode}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${statusClass(
                          payment.paymentStatus
                        )}`}
                      >
                        {payment.paymentStatus}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-400">
                      {formatDate(payment.validUntilUtc)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   PAYMENT HISTORY
================================================================ */

function PaymentHistoryPage({
  tenant,
  payments,
  totalPayments,
  search,
  historyFromYear,
  historyToYear,
  historyStatus,
  years,
  loading,
  onSearchChange,
  onHistoryFromYearChange,
  onHistoryToYearChange,
  onHistoryStatusChange,
  onBack,
  onAdd,
  onPaymentClick,
}: {
  tenant: BackendTenant;
  payments: TenantPaymentListItem[];
  totalPayments: number;
  search: string;

  historyFromYear: number;
  historyToYear: number;

  historyStatus: 'All' | PaymentStatus;

  years: number[];
  loading: boolean;

  onSearchChange: (value: string) => void;

  onHistoryFromYearChange: (value: number) => void;
  onHistoryToYearChange: (value: number) => void;

  onHistoryStatusChange: (
    value: 'All' | PaymentStatus
  ) => void;

  onBack: () => void;
  onAdd: () => void;
  onPaymentClick: (payment: TenantPaymentListItem) => void;
}) {
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tenant Payments
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#5C3FE0]/15 text-[#A78BFA]">
              <CreditCard className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold">
                {tenant.name}
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                {tenant.code} · {tenant.plan} · {tenant.currency}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onAdd}
          className="flex items-center gap-2 rounded-lg bg-[#5C3FE0] px-4 py-2.5 text-sm font-medium hover:bg-[#6c50ec]"
        >
          <Plus className="h-4 w-4" />
          Add Payment
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">
            Payment History
          </h2>

          <p className="text-sm text-gray-500">
            {totalPayments} payment record
            {totalPayments === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex items-center gap-3">

          {/* SEARCH */}
          {/* <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search payment history..."
              className="w-full rounded-lg border border-white/10 bg-[#0e0b2e] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#5C3FE0]"
            />
          </div> */}
          <span className="text-sm text-gray-500">
            From
          </span>

          {/* FROM YEAR */}
          <div className="relative">
            <select
              value={historyFromYear}
              onChange={(e) =>
                onHistoryFromYearChange(Number(e.target.value))
              }
              className="appearance-none rounded-lg border border-white/10 bg-[#0e0b2e] py-2.5 pl-4 pr-10 text-sm outline-none focus:border-[#5C3FE0]"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </div>

          {/* TO */}
          <span className="text-sm text-gray-500">
            to
          </span>

          {/* TO YEAR */}
          <div className="relative">
            <select
              value={historyToYear}
              onChange={(e) =>
                onHistoryToYearChange(Number(e.target.value))
              }
              className="appearance-none rounded-lg border border-white/10 bg-[#0e0b2e] py-2.5 pl-4 pr-10 text-sm outline-none focus:border-[#5C3FE0]"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </div>

          {/* STATUS */}
          <div className="relative">
            <select
              value={historyStatus}
              onChange={(e) =>
                onHistoryStatusChange(
                  e.target.value as 'All' | PaymentStatus
                )
              }
              className="appearance-none rounded-lg border border-white/10 bg-[#0e0b2e] py-2.5 pl-4 pr-10 text-sm outline-none focus:border-[#5C3FE0]"
            >
              <option value="All">All</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </div>

        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0e0b2e]">
        <table className="w-full text-left">
          <thead className="border-b border-white/10 bg-white/[0.02]">
            <tr className="text-xs uppercase tracking-wide text-gray-500">
              <th className="px-5 py-4">Year</th>
              <th className="px-5 py-4">Payment Date</th>
              <th className="px-5 py-4">Amount</th>
              <th className="px-5 py-4">Mode</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Valid Until</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <div className="flex justify-center py-14 text-gray-400">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading history...
                  </div>
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="py-14 text-center text-gray-500">
                    No payment history found.
                  </div>
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr
                  key={payment.id}
                  onClick={() => onPaymentClick(payment)}
                  className="cursor-pointer transition hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-4 text-sm text-gray-300">
                    {payment.paymentDateUtc
                      ? new Date(payment.paymentDateUtc).getFullYear()
                      : payment.validFromUtc
                        ? new Date(payment.validFromUtc).getFullYear()
                        : '—'}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-300">
                    {formatDate(payment.paymentDateUtc)}
                  </td>

                  <td className="px-5 py-4 text-sm font-medium">
                    {formatAmount(payment.amount, tenant.currency)}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-300">
                    {payment.paymentMode}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${statusClass(
                        payment.paymentStatus
                      )}`}
                    >
                      {payment.paymentStatus}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-400">
                    {formatDate(payment.validUntilUtc)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================
   PAYMENT DETAILS
================================================================ */

function PaymentDetailsPage({
  tenant,
  payment,
  paymentCount,
  onBack,
  onEdit,
  onDelete,
}: {
  tenant: BackendTenant;
  payment: TenantPaymentListItem;
  paymentCount: number;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-2 text-sm text-gray-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Payment History
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Payment Details
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            {tenant.name} · {tenant.code}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0e0b2e] px-4 py-2.5 text-sm hover:bg-white/5"
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </button>

          <button
            onClick={onDelete}
            disabled={paymentCount <= 1}
            title={
              paymentCount <= 1
                ? 'At least one payment record must remain.'
                : 'Delete payment'
            }
            className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#0e0b2e] p-5 lg:col-span-1">
          <h2 className="mb-5 text-sm font-medium uppercase tracking-wide text-gray-500">
            Tenant
          </h2>

          <div className="space-y-4">
            <DetailItem label="Tenant Name" value={tenant.name} />
            <DetailItem label="Tenant Code" value={tenant.code} />
            <DetailItem label="Domain" value={tenant.domain || '—'} />
            <DetailItem label="Plan" value={tenant.plan} />
            <DetailItem label="Currency" value={tenant.currency} />

            <div>
              <p className="mb-1 text-xs text-gray-500">
                Status
              </p>

              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${tenant.isActive
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-red-500/20 bg-red-500/10 text-red-400'
                  }`}
              >
                {tenant.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0e0b2e] p-5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Payment Information
            </h2>

            <span
              className={`rounded-full border px-2.5 py-1 text-xs ${statusClass(
                payment.paymentStatus
              )}`}
            >
              {payment.paymentStatus}
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <DetailItem
              label="Amount"
              value={formatAmount(
                payment.amount,
                tenant.currency
              )}
            />

            <DetailItem
              label="Payment Mode"
              value={payment.paymentMode}
            />

            <DetailItem
              label="Payment Date"
              value={formatDate(payment.paymentDateUtc)}
            />

            <DetailItem
              label="Valid From"
              value={formatDate(payment.validFromUtc)}
            />

            <DetailItem
              label="Valid Until"
              value={formatDate(payment.validUntilUtc)}
            />

            <DetailItem
              label="Total Branches"
              value={String(payment.totalBranches ?? 0)}
            />

            <DetailItem
              label="Registration"
              value={
                payment.registrationStatus
                  ? 'Completed'
                  : 'Pending'
              }
            />

            <DetailItem
              label="Payment ID"
              value={`#${payment.id}`}
            />
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <DetailItem
              label="Notes"
              value={payment.notes || 'No notes added.'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   DETAIL ITEM
================================================================ */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-200">{value}</p>
    </div>
  );
}

/* ================================================================
   PAYMENT MODAL
================================================================ */

function PaymentModal({
  mode,
  form,
  tenants,
  tenantSearch,
  tenantOptions,
  selectedTenant,
  showTenantDropdown,
  saving,
  onClose,
  onSubmit,
  onTenantSearchChange,
  onTenantFocus,
  onSelectTenant,
  onChange,
}: {
  mode: 'add' | 'edit';
  form: PaymentForm;
  tenants: BackendTenant[];
  tenantSearch: string;
  tenantOptions: BackendTenant[];
  selectedTenant?: BackendTenant;
  showTenantDropdown: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onTenantSearchChange: (value: string) => void;
  onTenantFocus: () => void;
  onSelectTenant: (tenant: BackendTenant) => void;
  onChange: React.Dispatch<React.SetStateAction<PaymentForm>>;
}) {
  const updateField = <K extends keyof PaymentForm>(
    field: K,
    value: PaymentForm[K]
  ) => {
    onChange((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0e0b2e] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">
              {mode === 'add'
                ? 'Add Payment'
                : 'Edit Payment'}
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {mode === 'add'
                ? 'Create a new tenant payment record.'
                : 'Update this payment record.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* TENANT */}

          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Tenant
            </label>

            {mode === 'add' ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

                <input
                  value={tenantSearch}
                  onChange={(e) =>
                    onTenantSearchChange(e.target.value)
                  }
                  onFocus={onTenantFocus}
                  placeholder="Type tenant name..."
                  className="w-full rounded-lg border border-white/10 bg-[#09071e] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#5C3FE0]"
                />

                {showTenantDropdown &&
                  tenantOptions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#17133d] shadow-xl">
                      {tenantOptions.map((tenant) => (
                        <button
                          key={tenant.id}
                          type="button"
                          onClick={() =>
                            onSelectTenant(tenant)
                          }
                          className="block w-full border-b border-white/5 px-4 py-3 text-left last:border-b-0 hover:bg-white/5"
                        >
                          <div className="text-sm font-medium text-white">
                            {tenant.name}
                          </div>

                          <div className="mt-1 text-xs text-gray-500">
                            {tenant.code}
                            {tenant.domain
                              ? ` · ${tenant.domain}`
                              : ''}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-[#09071e] px-4 py-3">
                <div className="font-medium text-white">
                  {selectedTenant?.name ?? tenantSearch}
                </div>

                <div className="mt-1 text-xs text-gray-500">
                  {selectedTenant?.code ?? ''}
                </div>
              </div>
            )}
          </div>

          {/* SELECTED TENANT INFO */}

          {selectedTenant && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-[#5C3FE0]/20 bg-[#5C3FE0]/5 p-4 sm:grid-cols-4">
              <DetailItem
                label="Code"
                value={selectedTenant.code}
              />

              <DetailItem
                label="Domain"
                value={selectedTenant.domain || '—'}
              />

              <DetailItem
                label="Plan"
                value={selectedTenant.plan}
              />

              <DetailItem
                label="Currency"
                value={selectedTenant.currency}
              />
            </div>
          )}

          {/* PAYMENT FIELDS */}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormNumber
              label="Total Branches"
              value={form.totalBranches}
              onChange={(value) =>
                updateField('totalBranches', value)
              }
            />

            <FormNumber
              label="Amount"
              value={form.amount}
              onChange={(value) =>
                updateField('amount', value)
              }
            />

            <FormSelect
              label="Payment Mode"
              value={form.paymentMode}
              options={paymentModes}
              onChange={(value) =>
                updateField(
                  'paymentMode',
                  value as PaymentMode
                )
              }
            />

            <FormSelect
              label="Payment Status"
              value={form.paymentStatus}
              options={paymentStatuses}
              onChange={(value) =>
                updateField(
                  'paymentStatus',
                  value as PaymentStatus
                )
              }
            />

            <FormDate
              label="Payment Date"
              value={form.paymentDateUtc}
              onChange={(value) =>
                updateField('paymentDateUtc', value)
              }
            />

            <FormDate
              label="Valid From"
              value={form.validFromUtc}
              onChange={(value) =>
                updateField('validFromUtc', value)
              }
            />

            <FormDate
              label="Valid Until"
              value={form.validUntilUtc}
              onChange={(value) =>
                updateField('validUntilUtc', value)
              }
            />
          </div>

          {/* REGISTRATION */}

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-[#09071e] p-4">
            <input
              type="checkbox"
              checked={form.registrationStatus}
              onChange={(e) =>
                updateField(
                  'registrationStatus',
                  e.target.checked
                )
              }
              className="h-4 w-4 accent-[#5C3FE0]"
            />

            <div>
              <p className="text-sm text-gray-200">
                Registration completed
              </p>

              <p className="text-xs text-gray-500">
                Mark this tenant payment registration as completed.
              </p>
            </div>
          </label>

          {/* NOTES */}

          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Notes
            </label>

            <textarea
              value={form.notes}
              onChange={(e) =>
                updateField('notes', e.target.value)
              }
              rows={3}
              placeholder="Optional notes..."
              className="w-full resize-none rounded-lg border border-white/10 bg-[#09071e] px-4 py-3 text-sm outline-none focus:border-[#5C3FE0]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
          >
            Cancel
          </button>

          <button
            onClick={onSubmit}
            disabled={saving || (mode === 'add' && !form.tenantId)}
            className="flex items-center gap-2 rounded-lg bg-[#5C3FE0] px-5 py-2.5 text-sm font-medium hover:bg-[#6c50ec] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {mode === 'add'
              ? 'Add Payment'
              : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   FORM COMPONENTS
================================================================ */

function FormNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-gray-300">
        {label}
      </label>

      <input
        type="number"
        value={value}
        onChange={(e) =>
          onChange(Number(e.target.value))
        }
        className="w-full rounded-lg border border-white/10 bg-[#09071e] px-4 py-3 text-sm outline-none focus:border-[#5C3FE0]"
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-gray-300">
        {label}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-white/10 bg-[#09071e] px-4 py-3 pr-10 text-sm outline-none focus:border-[#5C3FE0]"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      </div>
    </div>
  );
}

function FormDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-gray-300">
        {label}
      </label>

      <div className="relative">
        <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#09071e] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#5C3FE0]"
        />
      </div>
    </div>
  );
}

/* ================================================================
   DELETE MODAL
================================================================ */

function DeleteModal({
  payment,
  canDelete,
  deleting,
  onClose,
  onConfirm,
}: {
  payment: TenantPaymentListItem;
  canDelete: boolean;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0e0b2e] p-6 shadow-2xl">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <Trash2 className="h-5 w-5" />
        </div>

        <h2 className="text-lg font-semibold">
          Delete Payment?
        </h2>

        {!canDelete ? (
          <p className="mt-3 text-sm leading-6 text-gray-400">
            This payment cannot be deleted because this tenant
            has only one payment record. Every tenant must always
            have at least one payment detail.
          </p>
        ) : (
          <p className="mt-3 text-sm leading-6 text-gray-400">
            Are you sure you want to delete payment #
            {payment.id}? This action cannot be undone.
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="rounded-lg border border-white/10 px-4 py-2.5 text-sm hover:bg-white/5"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={!canDelete || deleting}
            className="flex items-center gap-2 rounded-lg bg-red-500/15 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            Delete
          </button>
        </div>
      </div>
    </div>
  );
}