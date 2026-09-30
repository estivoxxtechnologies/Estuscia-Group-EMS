import React, { useEffect, useState } from 'react';
import {
  Printer,
  RefreshCw,
  Loader2,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { toast } from 'react-toastify';

import {
  getPayrollPayslips,
  getMyPayslips,
} from '../api/payroll';

import {
  Payslip,
} from '../types/payrollCycle';

/* =========================================================
   PROPS
========================================================= */

interface PayslipsPageProps {
  showEmployee: boolean;
}

/* =========================================================
   PAGE
========================================================= */

const PayslipsPage: React.FC<
  PayslipsPageProps
> = ({
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

  const isEmployee =
    currentUser.roleName === 'staff' ||
    currentUser.roleName === 'sales_staff' ||
    currentUser.roleName === 'developer' ||
    currentUser.roleName === 'support_staff' ||
    currentUser.roleName === 'knowledge_trainer';

  /* =======================================================
     LOAD
  ======================================================= */

  const loadPayslips = async () => {

    try {

      setLoading(true);
      setError(null);

      if (isEmployee) {

        const data =
          await getMyPayslips();

        setPayslips(
          Array.isArray(data)
            ? data
            : []
        );

        return;
      }

      /*
       * Management view:
       * get payslips for all employees.
       *
       * Existing API requires a cycleId,
       * so we get the latest cycle from payroll.
       */
      const {
        getPayrollCycles,
        getPayrollPayslips,
      } = await import(
        '../api/payroll'
      );

      const cycles =
        await getPayrollCycles();

      if (
        !cycles ||
        cycles.length === 0
      ) {
        setPayslips([]);
        return;
      }

      const latestCycle =
        cycles[0];

      const data =
        await getPayrollPayslips({
          cycleId:
            latestCycle.id,
        });

      setPayslips(
        Array.isArray(data)
          ? data
          : []
      );

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

  /* =======================================================
     LOADING
  ======================================================= */

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

  /* =======================================================
     ERROR
  ======================================================= */

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

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/70 flex items-center justify-between">

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
            className={`w-4 h-4 ${
              loading
                ? 'animate-spin'
                : ''
            }`}
          />
        </button>

      </div>

      {/* ===================================================
          TABLE
      =================================================== */}

      <PayslipTable
        payslips={payslips}
        showEmployee={showEmployee}
        onPrint={
          setSelectedPayslipForView
        }
      />

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

        {payslips.map(
          slip => (

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
                  status={
                    slip.status
                  }
                />

              </td>

              <td className="p-3.5">

                <button
                  onClick={() =>
                    onPrint(slip)
                  }
                  disabled={
                    !slip.isLocked
                  }
                  title={
                    !slip.isLocked
                      ? 'Payslip becomes printable after payroll is locked.'
                      : 'Print payslip'
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#1a144b] hover:bg-[#251d68] disabled:opacity-40 disabled:cursor-not-allowed border border-[#2d2770] text-[#A78BFA] hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
                >

                  <Printer className="w-3 h-3" />

                  <span>
                    Print Payslip
                  </span>

                </button>

              </td>

            </tr>

          )
        )}

      </tbody>

    </table>

    {payslips.length === 0 && (

      <div className="p-12 text-center text-sm text-slate-500">
        No payslips available.
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

  const styles: Record<
    string,
    string
  > = {

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
      className={`px-2 py-1 rounded text-[10px] font-bold border ${
        styles[status] ||
        styles.Draft
      }`}
    >
      {status}
    </span>
  );
};

export default PayslipsPage;