import React from 'react';
import {
  X,
  Printer,
  Download,
  CreditCard,
  ShieldCheck,
  Lock,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { EstusciaLogo } from './EstusciaLogo';
import { Payslip as PayslipType } from '../types/payrollCycle';

export const PayslipModal: React.FC = () => {
  const {
    selectedPayslipForView,
    setSelectedPayslipForView,
    currentTenant,
  } = useApp();

  if (!selectedPayslipForView) {
    return null;
  }

  const slip =
    selectedPayslipForView as PayslipType;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print();
  };

  const currency = (
    amount: number
  ) => {
    return `${slip.currencySymbol}${amount.toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const bonuses =
    slip.adjustments?.filter(
      x =>
        x.type === 'Bonus' &&
        x.status === 'ApprovedByCompanyAdmin'
    ) || [];

  const deductions =
    slip.adjustments?.filter(
      x =>
        x.type === 'Deduction' &&
        x.status === 'ApprovedByCompanyAdmin'
    ) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">

      <div className="relative w-full max-w-3xl bg-[#09071e] border border-[#2d2770] rounded-2xl shadow-2xl overflow-hidden my-8">

        {/* HEADER */}

        <div className="flex items-center justify-between px-6 py-3.5 bg-[#0e0b2e] border-b border-[#231e54]">

          <div className="flex items-center gap-2">

            <CreditCard className="w-5 h-5 text-emerald-400" />

            <span className="text-sm font-bold text-white">
              Official Salary Payslip
            </span>

            <span className="px-2 py-0.5 text-[10px] font-mono bg-[#5C3FE0]/30 text-[#A78BFA] border border-[#5C3FE0]/40 rounded">
              {slip.monthYear}
            </span>

          </div>

          <div className="flex items-center gap-2">

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a144b] hover:bg-[#251d68] border border-[#2d2770] text-xs font-medium text-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              Download / PDF
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5C3FE0] hover:bg-[#7152FF] text-xs font-semibold text-white"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>

            <button
              onClick={() =>
                setSelectedPayslipForView(null)
              }
              className="p-1.5 rounded-lg hover:bg-[#1f1857] text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

          </div>
        </div>

        {/* DOCUMENT */}

        <div
          id="payslip-print-area"
          className="p-6 md:p-8 space-y-6 text-slate-200 bg-[#09071e]"
        >

          {/* COMPANY */}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-[#231e54] gap-4">

            <div>

              <EstusciaLogo
                size="md"
                showSubtitle={true}
              />

              <div className="text-xs text-slate-400 mt-2">
                {currentTenant.name}
              </div>

              {slip.branchName && (
                <div className="text-[11px] text-slate-500">
                  {slip.branchName}
                </div>
              )}

            </div>

            <div className="sm:text-right">

              <div className="text-lg font-bold text-white uppercase tracking-wider">
                PAYSLIP
              </div>

              <div className="text-xs text-[#A78BFA] font-semibold">
                {slip.monthYear}
              </div>

              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Payroll Record #{slip.id}
              </div>

              <div className="flex items-center justify-end gap-1 mt-2 text-emerald-400 text-[10px] font-bold uppercase">
                <Lock className="w-3 h-3" />
                Locked Payroll
              </div>

            </div>
          </div>

          {/* EMPLOYEE */}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#0e0b2e]/80 border border-[#231e54]">

            <Info
              label="Employee"
              value={slip.employeeName}
            />

            <Info
              label="Employee Code"
              value={slip.employeeCode}
              accent
            />

            <Info
              label="Designation"
              value={slip.designation || '—'}
            />

            <Info
              label="Department"
              value={slip.department || '—'}
            />

            <Info
              label="Payroll Period"
              value={slip.monthYear}
            />

            <Info
              label="Currency"
              value={`${slip.currencyCode} (${slip.currencySymbol})`}
            />

            <Info
              label="Payroll Status"
              value={slip.status}
              accent
            />

            <Info
              label="Record"
              value={`#${slip.id}`}
            />

          </div>

          {/* EARNINGS / DEDUCTIONS */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* EARNINGS */}

            <div className="rounded-xl border border-[#231e54] overflow-hidden bg-[#0c0926]/60">

              <div className="px-4 py-2.5 bg-[#140f3d] border-b border-[#231e54] text-xs font-bold text-[#A78BFA] uppercase tracking-wider flex justify-between">

                <span>
                  Earnings
                </span>

                <span>
                  Amount
                </span>

              </div>

              <div className="p-4 space-y-2 text-xs">

                <Line
                  label="Basic Salary"
                  amount={currency(slip.basicSalary)}
                />

                {bonuses.map(
                  bonus => (
                    <Line
                      key={bonus.id}
                      label={bonus.reason}
                      amount={`+${currency(
                        bonus.amount
                      )}`}
                      positive
                    />
                  )
                )}

                {bonuses.length === 0 && (
                  <div className="text-[11px] text-slate-500 py-2">
                    No approved bonuses.
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t border-[#231e54] font-bold text-sm">

                  <span>
                    Total Earnings
                  </span>

                  <span className="text-emerald-400 font-mono">
                    {currency(
                      slip.basicSalary +
                      slip.totalBonus
                    )}
                  </span>

                </div>

              </div>

            </div>

            {/* DEDUCTIONS */}

            <div className="rounded-xl border border-[#231e54] overflow-hidden bg-[#0c0926]/60">

              <div className="px-4 py-2.5 bg-[#140f3d] border-b border-[#231e54] text-xs font-bold text-rose-300 uppercase tracking-wider flex justify-between">

                <span>
                  Deductions
                </span>

                <span>
                  Amount
                </span>

              </div>

              <div className="p-4 space-y-2 text-xs">

                {deductions.map(
                  deduction => (
                    <Line
                      key={deduction.id}
                      label={deduction.reason}
                      amount={`-${currency(
                        deduction.amount
                      )}`}
                      negative
                    />
                  )
                )}

                {deductions.length === 0 && (
                  <div className="text-[11px] text-slate-500 py-2">
                    No approved deductions.
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t border-[#231e54] font-bold text-sm">

                  <span>
                    Total Deductions
                  </span>

                  <span className="text-rose-400 font-mono">
                    -{currency(
                      slip.totalDeduction
                    )}
                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* NET */}

          <div className="p-5 rounded-xl bg-gradient-to-r from-[#140f3d] via-[#1b1352] to-[#0e0b2e] border border-[#5C3FE0]/50 flex flex-col sm:flex-row items-center justify-between gap-4">

            <div>

              <div className="text-[11px] text-[#A78BFA] uppercase tracking-wider font-semibold">
                Net Payable Salary
              </div>

              <div className="text-xs text-slate-400 mt-1">
                Basic Salary + Approved Bonuses − Approved Deductions
              </div>

            </div>

            <div className="text-right">

              <div className="text-2xl md:text-3xl font-black text-emerald-400 font-mono">
                {currency(slip.netSalary)}
              </div>

              <div className="text-[10px] text-slate-400 uppercase font-mono">
                {slip.currencyCode} NET PAYABLE
              </div>

            </div>

          </div>

          {/* SECURITY */}

          <div className="pt-4 border-t border-[#231e54] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">

            <div className="flex items-center gap-2">

              <ShieldCheck className="w-4 h-4 text-emerald-400" />

              <span>
                System Generated • Payroll Locked
              </span>

            </div>

            <div className="text-right font-mono text-[10px]">
              Generated:{' '}
              {new Date(
                slip.generatedAtUtc
              ).toLocaleString()}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

const Info: React.FC<{
  label: string;
  value: string;
  accent?: boolean;
}> = ({
  label,
  value,
  accent,
}) => (
  <div>

    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
      {label}
    </span>

    <span
      className={`font-medium ${
        accent
          ? 'text-[#A78BFA]'
          : 'text-slate-200'
      }`}
    >
      {value}
    </span>

  </div>
);

const Line: React.FC<{
  label: string;
  amount: string;
  positive?: boolean;
  negative?: boolean;
}> = ({
  label,
  amount,
  positive,
  negative,
}) => (
  <div className="flex justify-between py-1.5 border-b border-[#1b154a] gap-4">

    <span className="text-slate-300">
      {label}
    </span>

    <span
      className={`font-mono font-semibold ${
        positive
          ? 'text-emerald-400'
          : negative
            ? 'text-rose-400'
            : 'text-white'
      }`}
    >
      {amount}
    </span>

  </div>
);