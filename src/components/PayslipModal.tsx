import React from 'react';
import { X, Printer, Download, CreditCard, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EstusciaLogo } from './EstusciaLogo';

export const PayslipModal: React.FC = () => {
  const { selectedPayslipForView, setSelectedPayslipForView, currentTenant } = useApp();

  if (!selectedPayslipForView) return null;

  const slip = selectedPayslipForView;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#09071e] border border-[#2d2770] rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#0e0b2e] border-b border-[#231e54]">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-white">Official Salary Payslip</span>
            <span className="px-2 py-0.5 text-[10px] font-mono bg-[#5C3FE0]/30 text-[#A78BFA] border border-[#5C3FE0]/40 rounded">
              {slip.monthYear}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a144b] hover:bg-[#251d68] border border-[#2d2770] text-xs font-medium text-slate-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={() => setSelectedPayslipForView(null)}
              className="p-1.5 rounded-lg hover:bg-[#1f1857] text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Payslip Document Canvas */}
        <div className="p-6 md:p-8 space-y-6 text-slate-200">
          {/* Company & Document Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-[#231e54] gap-4">
            <div>
              <EstusciaLogo size="md" showSubtitle={true} />
              <div className="text-xs text-slate-400 mt-2">
                {currentTenant.name} • {currentTenant.branches[0]}
              </div>
            </div>
            <div className="sm:text-right">
              <div className="text-lg font-bold text-white uppercase tracking-wider font-mono">
                PAYSLIP
              </div>
              <div className="text-xs text-[#A78BFA] font-semibold">{slip.monthYear}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {slip.id}</div>
            </div>
          </div>

          {/* Employee Metadata Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#0e0b2e]/80 border border-[#231e54] text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Employee Name</span>
              <span className="font-bold text-white">{slip.userName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Employee Code</span>
              <span className="font-mono text-[#A78BFA] font-semibold">{slip.employeeCode}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Designation</span>
              <span className="text-slate-300 font-medium">{slip.designation}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Department</span>
              <span className="text-slate-300 font-medium">{slip.department}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Worked Days</span>
              <span className="text-emerald-400 font-bold">{slip.workedDays} Days</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Paid Leaves</span>
              <span className="text-slate-300">{slip.paidLeaves} Days</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Payment Mode</span>
              <span className="text-slate-300 font-mono">{slip.paymentMode}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Disburse Status</span>
              <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block font-mono">
                {slip.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Earnings vs Deductions Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Earnings Table */}
            <div className="rounded-xl border border-[#231e54] overflow-hidden bg-[#0c0926]/60">
              <div className="px-4 py-2.5 bg-[#140f3d] border-b border-[#231e54] text-xs font-bold text-[#A78BFA] uppercase tracking-wider flex justify-between">
                <span>Earnings Breakdown</span>
                <span>Amount (USD)</span>
              </div>
              <div className="p-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#1b154a]">
                  <span className="text-slate-300">Basic Salary</span>
                  <span className="font-mono text-white">${slip.basicPay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1b154a]">
                  <span className="text-slate-300">House Rent Allowance (HRA)</span>
                  <span className="font-mono text-white">${slip.hra.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1b154a]">
                  <span className="text-slate-300">Special & Travel Allowance</span>
                  <span className="font-mono text-white">${slip.specialAllowance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1b154a] bg-[#1a144b]/40 px-2 rounded">
                  <span className="text-emerald-300 font-semibold">Slab Performance Incentives</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    +${slip.performanceIncentive.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-3 font-bold text-sm text-white">
                  <span>Gross Earnings</span>
                  <span className="font-mono text-emerald-400">${slip.grossSalary.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Deductions Table */}
            <div className="rounded-xl border border-[#231e54] overflow-hidden bg-[#0c0926]/60">
              <div className="px-4 py-2.5 bg-[#140f3d] border-b border-[#231e54] text-xs font-bold text-rose-300 uppercase tracking-wider flex justify-between">
                <span>Statutory Deductions</span>
                <span>Amount (USD)</span>
              </div>
              <div className="p-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#1b154a]">
                  <span className="text-slate-300">Provident Fund (PF - 10%)</span>
                  <span className="font-mono text-white">${slip.providentFund.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1b154a]">
                  <span className="text-slate-300">Withholding Tax / TDS</span>
                  <span className="font-mono text-white">${slip.taxDeduction.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1b154a]">
                  <span className="text-slate-300">Attendance / Unpaid Deduction</span>
                  <span className="font-mono text-white">${slip.attendanceDeduction.toLocaleString()}</span>
                </div>
                <div className="py-2.5" />
                <div className="flex justify-between pt-3 font-bold text-sm text-white">
                  <span>Total Deductions</span>
                  <span className="font-mono text-rose-400">-${slip.deductionsTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Payable Highlight Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#140f3d] via-[#1b1352] to-[#0e0b2e] border border-[#5C3FE0]/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="text-[11px] text-[#A78BFA] uppercase tracking-wider font-semibold">
                Net Disbursed Take-Home Salary
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Direct wire transfer credited to registered account
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl md:text-3xl font-black text-emerald-400 font-mono">
                ${slip.netPayable.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">USD NET PAYOUT</div>
            </div>
          </div>

          {/* Security & Authentication Signoff */}
          <div className="pt-4 border-t border-[#231e54] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>System Generated Payslip • Authorized by Estuscia Human Capital Operations</span>
            </div>
            <div className="text-right font-mono text-[10px] text-slate-400">
              Timestamp: {slip.generatedAt}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
