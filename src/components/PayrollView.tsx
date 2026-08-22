import React, { useState } from 'react';
import {
  CreditCard,
  Building2,
  DollarSign,
  CheckCircle2,
  Printer,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PayrollCycle, Payslip } from '../types';

export const PayrollView: React.FC = () => {
  const {
    payrollCycles,
    payslips,
    currentUser,
    generateMonthlyPayroll,
    disbursePayroll,
    setSelectedPayslipForView,
  } = useApp();

  const [selectedCycleId, setSelectedCycleId] = useState<string>(payrollCycles[0]?.id || '');

  const displayedCycle = payrollCycles.find((c) => c.id === selectedCycleId) || payrollCycles[0];

  const filteredPayslips = payslips.filter((slip) => {
    if (currentUser.role === 'staff') {
      return slip.userId === currentUser.id;
    }
    return !displayedCycle || slip.payrollCycleId === displayedCycle.id;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">
                Salary & Payroll Operations
              </h1>
              <p className="text-xs text-slate-400">
                Consolidated earnings, attendance deductions, approved slab commissions, and digital payslips
              </p>
            </div>
          </div>
        </div>

        {/* HR Controls */}
        {(currentUser.role === 'hr_ops' || currentUser.role === 'company_admin' || currentUser.role === 'super_admin') && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => generateMonthlyPayroll('April 2026')}
              className="px-3.5 py-2 rounded-xl bg-[#140f3d] hover:bg-[#1f175a] border border-[#2d2770] text-slate-200 text-xs font-semibold transition-colors"
            >
              Generate Next Cycle (April 2026)
            </button>

            {displayedCycle && displayedCycle.status === 'Draft' && (
              <button
                onClick={() => disbursePayroll(displayedCycle.id)}
                className="px-4 py-2 rounded-xl bg-[#5C3FE0] hover:bg-[#7152FF] text-white text-xs font-bold shadow-lg shadow-[#5C3FE0]/30 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Disburse & Lock ({displayedCycle.monthYear})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Cycle Selector Cards (if HR/Admin) */}
      {currentUser.role !== 'staff' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {payrollCycles.map((cycle) => (
            <div
              key={cycle.id}
              onClick={() => setSelectedCycleId(cycle.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                selectedCycleId === cycle.id
                  ? 'bg-gradient-to-r from-[#120e3b] to-[#18124b] border-[#5C3FE0] shadow-lg shadow-[#5C3FE0]/20'
                  : 'bg-[#09071e] border-[#2d2770]/70 hover:border-[#5C3FE0]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{cycle.monthYear}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                    cycle.status === 'Disbursed'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {cycle.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Net Payout</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    ${cycle.totalNetPayout.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Incentives Included</span>
                  <span className="font-mono text-[#A78BFA] font-bold text-sm">
                    +${cycle.totalIncentivesPaid.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payslips Table */}
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-[#09071e] border border-[#231e54] flex items-center justify-between text-xs">
          <span className="font-bold text-white uppercase tracking-wider">
            {currentUser.role === 'staff' ? 'My Salary Payslips History' : `Generated Payslips for ${displayedCycle.monthYear}`} ({filteredPayslips.length})
          </span>
          <span className="text-slate-400">Direct wire transfer via corporate treasury</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#2d2770]/80 bg-[#09071e]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#120e38] text-slate-400 font-semibold border-b border-[#231e54]">
              <tr>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Period</th>
                <th className="p-3.5">Days</th>
                <th className="p-3.5">Basic + Allowances</th>
                <th className="p-3.5">Slab Incentives</th>
                <th className="p-3.5">Deductions (PF/Tax)</th>
                <th className="p-3.5">Net Payable</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c164a]/60 text-slate-200">
              {filteredPayslips.map((slip) => (
                <tr key={slip.id} className="hover:bg-[#140f3d]/60 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-white">{slip.userName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{slip.employeeCode} • {slip.designation}</div>
                  </td>
                  <td className="p-3.5 font-mono text-slate-300">{slip.monthYear}</td>
                  <td className="p-3.5 font-mono text-slate-300">{slip.workedDays}d</td>
                  <td className="p-3.5 font-mono text-white">
                    ${(slip.basicPay + slip.hra + slip.specialAllowance).toLocaleString()}
                  </td>
                  <td className="p-3.5 font-mono text-emerald-400 font-bold">
                    +${slip.performanceIncentive.toLocaleString()}
                  </td>
                  <td className="p-3.5 font-mono text-rose-400">
                    -${slip.deductionsTotal.toLocaleString()}
                  </td>
                  <td className="p-3.5 font-mono text-emerald-400 font-black text-sm">
                    ${slip.netPayable.toLocaleString()}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {slip.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <button
                      onClick={() => setSelectedPayslipForView(slip)}
                      className="px-3 py-1.5 rounded-lg bg-[#1a144b] hover:bg-[#251d68] border border-[#2d2770] text-[#A78BFA] hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print Slip</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
