import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Printer,
  RefreshCw,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
} from 'lucide-react';

import { useApp } from '../context/AppContext';

import {
  getPayrollPayslips,
  getMyPayslips,
  getPayrollCycles,
} from '../api/payroll';

import {
  Payslip,
} from '../types/payrollCycle';

interface PayslipsPageProps {
  showEmployee: boolean;
}

const ROWS_PER_PAGE = 12;

const PayslipsPage: React.FC<PayslipsPageProps> = ({
  showEmployee,
}) => {
  const {
    currentUser,
    setSelectedPayslipForView,
  } = useApp();

  const [payslips, setPayslips] =
    useState<Payslip[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState('');

  const [selectedYear, setSelectedYear] =
    useState<string>('all');

  const [currentPage, setCurrentPage] =
    useState(1);

  const isEmployee =
    currentUser.roleName === 'staff' ||
    currentUser.roleName === 'sales_staff' ||
    currentUser.roleName === 'developer' ||
    currentUser.roleName === 'support_staff' ||
    currentUser.roleName === 'knowledge_trainer';

  /* =========================================================
     LOAD
  ========================================================= */

  const loadPayslips = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isEmployee) {
        const data = await getMyPayslips();

        setPayslips(
          Array.isArray(data)
            ? data
            : []
        );

        setCurrentPage(1);

        return;
      }

      const cycles =
        await getPayrollCycles();

      if (
        !cycles ||
        cycles.length === 0
      ) {
        setPayslips([]);
        setCurrentPage(1);
        return;
      }

      /*
       * Load payslips from the latest cycle.
       *
       * If your backend later exposes a
       * "get all payslips" endpoint, this
       * can be changed to load all historical
       * payslips in one request.
       */
      const latestCycle = cycles[0];

      const data =
        await getPayrollPayslips({
          cycleId: latestCycle.id,
        });

      setPayslips(
        Array.isArray(data)
          ? data
          : []
      );

      setCurrentPage(1);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load payslips.'
      );

      setPayslips([]);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayslips();
  }, []);

  const handlePreviewPayslip = (payslip: Payslip) => {
    console.log('Opening payslip preview:', payslip);
    setSelectedPayslipForView(payslip);
  };

  /* =========================================================
     YEARS
  ========================================================= */

  const years = useMemo(() => {
    const values = new Set<string>();

    payslips.forEach((slip) => {
      const year =
        extractYear(slip.monthYear);

      if (year) {
        values.add(year);
      }
    });

    return Array.from(values)
      .sort((a, b) =>
        Number(b) - Number(a)
      );
  }, [payslips]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredPayslips =
    useMemo(() => {

      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return payslips.filter(
        (slip) => {

          const employeeMatch =
            !normalizedSearch ||
            !showEmployee ||
            [
              slip.employeeName,
              slip.employeeCode,
              slip.designation,
              slip.department,
            ]
              .filter(Boolean)
              .some(value =>
                String(value)
                  .toLowerCase()
                  .includes(
                    normalizedSearch
                  )
              );

          const year =
            extractYear(
              slip.monthYear
            );

          const yearMatch =
            selectedYear === 'all' ||
            year === selectedYear;

          return (
            employeeMatch &&
            yearMatch
          );
        }
      );

    }, [
      payslips,
      search,
      selectedYear,
      showEmployee,
    ]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredPayslips.length /
        ROWS_PER_PAGE
      )
    );

  const safePage =
    Math.min(
      currentPage,
      totalPages
    );

  const paginatedPayslips =
    filteredPayslips.slice(
      (safePage - 1) *
      ROWS_PER_PAGE,
      safePage *
      ROWS_PER_PAGE
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    selectedYear,
  ]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (
    loading &&
    payslips.length === 0
  ) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 text-[#A78BFA] animate-spin" />
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300">

        <div className="font-semibold">
          Failed to load payslips
        </div>

        <div className="text-sm mt-1">
          {error}
        </div>

        <button
          onClick={loadPayslips}
          className="mt-4 px-4 py-2 rounded-lg bg-[#5C3FE0] text-white text-xs font-semibold"
        >
          Retry
        </button>

      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">

        <div className="flex items-start justify-between gap-4">

          <div>

            <h2 className="text-sm font-bold text-white">
              {showEmployee
                ? 'Employee Payslips'
                : 'My Payslips'}
            </h2>

            <p className="text-[11px] text-slate-400 mt-1">
              Payslips can be printed after payroll is approved,
              paid and locked.
            </p>

          </div>

          <button
            onClick={loadPayslips}
            disabled={loading}
            className="p-2 rounded-lg bg-[#17123d] border border-[#2d2770] text-slate-300 hover:text-white"
            title="Refresh payslips"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading
                  ? 'animate-spin'
                  : ''
                }`}
            />
          </button>

        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="mt-5 flex flex-col lg:flex-row gap-3">

          {/* SEARCH */}

          {showEmployee && (
            <div className="relative flex-1">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search employee, ID, designation or department..."
                className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-xs text-white placeholder:text-slate-600 outline-none focus:border-[#5C3FE0]"
              />

              {search && (
                <button
                  onClick={() =>
                    setSearch('')
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

            </div>
          )}

          {/* YEAR */}

          <div className="relative min-w-[170px]">

            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />

            <select
              value={selectedYear}
              onChange={(e) =>
                setSelectedYear(
                  e.target.value
                )
              }
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-xs text-white outline-none focus:border-[#5C3FE0] appearance-none"
            >

              <option value="all">
                All Years
              </option>

              {years.map(year => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              ))}

            </select>

          </div>

        </div>

        {/* RESULTS */}

        <div className="mt-3 text-[10px] text-slate-500">

          Showing{' '}
          <span className="text-slate-300 font-semibold">
            {filteredPayslips.length}
          </span>{' '}
          payslip
          {filteredPayslips.length !== 1
            ? 's'
            : ''}

          {search && (
            <>
              {' '}matching{' '}
              <span className="text-[#A78BFA]">
                "{search}"
              </span>
            </>
          )}

        </div>

      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <PayslipTable
        payslips={paginatedPayslips}
        showEmployee={showEmployee}
        onPrint={handlePreviewPayslip}
      />

      {/* =====================================================
          PAGINATION
      ===================================================== */}

      {filteredPayslips.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">

          <div className="text-[10px] text-slate-500">
            Page{' '}
            <span className="text-white font-semibold">
              {safePage}
            </span>{' '}
            of{' '}
            <span className="text-white font-semibold">
              {totalPages}
            </span>

            <span className="ml-2">
              • 12 rows per page
            </span>
          </div>

          <div className="flex items-center gap-1">

            <button
              disabled={safePage <= 1}
              onClick={() =>
                setCurrentPage(
                  page => Math.max(
                    1,
                    page - 1
                  )
                )
              }
              className="p-2 rounded-lg border border-[#2d2770] bg-[#120e38] text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {buildPageNumbers(
              safePage,
              totalPages
            ).map(page => (

              page === '...' ? (
                <span
                  key={`ellipsis-${Math.random()}`}
                  className="px-2 text-slate-600 text-xs"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() =>
                    setCurrentPage(
                      Number(page)
                    )
                  }
                  className={`min-w-8 h-8 px-2 rounded-lg text-xs font-semibold border ${safePage === page
                      ? 'bg-[#5C3FE0] border-[#5C3FE0] text-white'
                      : 'bg-[#120e38] border-[#2d2770] text-slate-400 hover:text-white'
                    }`}
                >
                  {page}
                </button>
              )

            ))}

            <button
              disabled={
                safePage >= totalPages
              }
              onClick={() =>
                setCurrentPage(
                  page => Math.min(
                    totalPages,
                    page + 1
                  )
                )
              }
              className="p-2 rounded-lg border border-[#2d2770] bg-[#120e38] text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

          </div>

        </div>
      )}

    </div>
  );
};

/* =========================================================
   TABLE
========================================================= */

const PayslipTable: React.FC<{
  payslips: Payslip[];
  showEmployee: boolean;
  onPrint: (
    payslip: Payslip
  ) => void;
}> = ({
  payslips,
  showEmployee,
  onPrint,
}) => (

    <div className="overflow-x-auto rounded-2xl border border-[#2d2770]/80 bg-[#09071e]">

      <table className="w-full text-left text-xs">

        <thead className="bg-[#120e38] text-slate-400 font-semibold border-b border-[#231e54]">

          <tr>

            {showEmployee && (
              <th className="p-3.5">
                Employee
              </th>
            )}

            <th className="p-3.5">
              Period
            </th>

            <th className="p-3.5">
              Basic Salary
            </th>

            <th className="p-3.5">
              Bonus
            </th>

            <th className="p-3.5">
              Deductions
            </th>

            <th className="p-3.5">
              Net Payable
            </th>

            <th className="p-3.5">
              Status
            </th>

            <th className="p-3.5">
              Action
            </th>

          </tr>

        </thead>

        <tbody className="divide-y divide-[#1c164a]/60">

          {payslips.map(slip => (

            <tr
              key={slip.id}
              className="hover:bg-[#140f3d]/60"
            >

              {showEmployee && (
                <td className="p-3.5">

                  <div className="font-bold text-white">
                    {slip.employeeName}
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    {slip.employeeCode}

                    {slip.designation
                      ? ` • ${slip.designation}`
                      : ''}
                  </div>

                </td>
              )}

              <td className="p-3.5 font-mono text-slate-300">
                {slip.monthYear}
              </td>

              <td className="p-3.5 font-mono text-white">
                {slip.currencySymbol}
                {slip.basicSalary.toLocaleString()}
              </td>

              <td className="p-3.5 font-mono text-emerald-400 font-semibold">
                +
                {slip.currencySymbol}
                {slip.totalBonus.toLocaleString()}
              </td>

              <td className="p-3.5 font-mono text-rose-400">
                -
                {slip.currencySymbol}
                {slip.totalDeduction.toLocaleString()}
              </td>

              <td className="p-3.5 font-mono text-emerald-400 font-black text-sm">
                {slip.currencySymbol}
                {slip.netSalary.toLocaleString()}
              </td>

              <td className="p-3.5">
                <StatusBadge
                  status={slip.status}
                />
              </td>

              <td className="p-3.5">

                <button
                  onClick={() =>
                    onPrint(slip)
                  }
                  disabled={!slip.isLocked}
                  title={
                    !slip.isLocked
                      ? 'Payslip becomes printable after payroll is locked.'
                      : 'Preview payslip'
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#1a144b] hover:bg-[#251d68] disabled:opacity-40 disabled:cursor-not-allowed border border-[#2d2770] text-[#A78BFA] hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
                >

                  <Printer className="w-3 h-3" />

                  <span>
                    Preview
                  </span>

                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

      {payslips.length === 0 && (
        <div className="p-12 text-center text-sm text-slate-500">
          No payslips found.
        </div>
      )}

    </div>
  );

/* =========================================================
   STATUS
========================================================= */

const StatusBadge: React.FC<{
  status: string;
}> = ({
  status,
}) => {

    const styles: Record<string, string> = {

      Draft:
        'bg-slate-500/10 text-slate-300 border-slate-500/30',

      SubmittedByHR:
        'bg-amber-500/10 text-amber-300 border-amber-500/30',

      ApprovedByCompanyAdmin:
        'bg-blue-500/10 text-blue-300 border-blue-500/30',

      Approved:
        'bg-blue-500/10 text-blue-300 border-blue-500/30',

      Processing:
        'bg-purple-500/10 text-purple-300 border-purple-500/30',

      Paid:
        'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',

      Locked:
        'bg-slate-500/10 text-slate-300 border-slate-500/30',

      Rejected:
        'bg-rose-500/10 text-rose-300 border-rose-500/30',
    };

    return (
      <span
        className={`px-2 py-1 rounded text-[10px] font-bold border ${styles[status] || styles.Draft
          }`}
      >
        {status}
      </span>
    );
  };

/* =========================================================
   HELPERS
========================================================= */

function extractYear(
  monthYear: string | undefined
): string | null {

  if (!monthYear) {
    return null;
  }

  const match =
    monthYear.match(
      /(19|20)\d{2}/
    );

  return match
    ? match[0]
    : null;
}

function buildPageNumbers(
  current: number,
  total: number
): Array<number | '...'> {

  if (total <= 7) {
    return Array.from(
      { length: total },
      (_, index) => index + 1
    );
  }

  const pages: Array<
    number | '...'
  > = [1];

  if (current > 4) {
    pages.push('...');
  }

  const start =
    Math.max(2, current - 1);

  const end =
    Math.min(
      total - 1,
      current + 1
    );

  for (
    let page = start;
    page <= end;
    page++
  ) {
    pages.push(page);
  }

  if (current < total - 3) {
    pages.push('...');
  }

  pages.push(total);

  return pages;
}

export default PayslipsPage;