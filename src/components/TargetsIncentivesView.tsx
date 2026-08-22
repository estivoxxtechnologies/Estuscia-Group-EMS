import React, { useState } from 'react';
import {
  Target,
  Plus,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
  Filter,
  ArrowRight,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { IncentiveStatus } from '../types';

export const TargetsIncentivesView: React.FC = () => {
  const {
    targetCycles,
    staffTargets,
    incentiveTransactions,
    currentUser,
    setIsLogDealOpen,
    updateIncentiveStatus,
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const activeCycle = targetCycles[0];

  const filteredDeals = incentiveTransactions.filter((deal) => {
    if (currentUser.role === 'staff') {
      return deal.userId === currentUser.id && (filterStatus === 'all' || deal.status === filterStatus);
    }
    return filterStatus === 'all' || deal.status === filterStatus;
  });

  const getStatusBadge = (status: IncentiveStatus) => {
    switch (status) {
      case 'Pending_Manager':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Verified_Manager':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Approved_HR':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Paid_Payroll':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Rejected':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">
                Target Allocation & Slab Incentives Pipeline
              </h1>
              <p className="text-xs text-slate-400">
                Track volume targets, slab-based deal bookings, and multi-tier approval disbursements
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsLogDealOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#5C3FE0] hover:bg-[#7152FF] text-white text-xs font-bold shadow-lg shadow-[#5C3FE0]/30 transition-all flex items-center gap-2 cursor-pointer"
          id="log-deal-primary-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Log Client Investment Deal</span>
        </button>
      </div>

      {/* Active Target Cycle Overview Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#110d3b] via-[#18124b] to-[#0c0828] border border-[#2d2770] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#A78BFA] bg-[#1a144b] px-2.5 py-0.5 rounded border border-[#2d2770]">
              {activeCycle.period} CYCLE
            </span>
            <h2 className="text-lg font-extrabold text-white mt-1">{activeCycle.name}</h2>
            <p className="text-xs text-slate-300">
              Period: {activeCycle.startDate} to {activeCycle.endDate}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-2xl font-black text-emerald-400 font-mono">
              ${activeCycle.totalAchievedFund.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400">
              Total Target Goal: ${activeCycle.totalTargetFund.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-[#161240] h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#5C3FE0] via-purple-400 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.round((activeCycle.totalAchievedFund / activeCycle.totalTargetFund) * 100))}%`,
            }}
          />
        </div>
      </div>

      {/* 4-Stage Approval Workflow Blueprint */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { step: '1. Staff Deal Entry', desc: 'Advisor enters investment amount & slab tier matches automatically.', color: 'border-cyan-500/40 text-cyan-300' },
          { step: '2. Manager Verification', desc: 'Branch Manager inspects client bank guarantee & escrow receipts.', color: 'border-blue-500/40 text-blue-300' },
          { step: '3. HR & Finance Approval', desc: 'Operations verifies historical slab rate & unlocks for monthly payroll.', color: 'border-purple-500/40 text-purple-300' },
          { step: '4. Payroll Disburse', desc: 'Incentive is merged onto employee salary payslip with zero errors.', color: 'border-emerald-500/40 text-emerald-300' },
        ].map((item, idx) => (
          <div key={idx} className={`p-4 rounded-xl bg-[#09071e] border ${item.color} space-y-1.5`}>
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>{item.step}</span>
              <CheckCircle2 className="w-4 h-4 opacity-70" />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Deals & Slab Incentive Table */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#09071e] border border-[#231e54] text-xs">
          <div className="text-xs font-bold text-white uppercase tracking-wider">
            Incentive Transaction Ledger ({filteredDeals.length})
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#0e0b2e] border border-[#2d2770] text-slate-200 text-xs"
            >
              <option value="all">All Approval States</option>
              <option value="Pending_Manager">Pending Manager</option>
              <option value="Verified_Manager">Verified by Manager</option>
              <option value="Approved_HR">Approved by HR</option>
              <option value="Paid_Payroll">Paid in Payroll</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#2d2770]/80 bg-[#09071e]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#120e38] text-slate-400 font-semibold border-b border-[#231e54]">
              <tr>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Staff Advisor</th>
                <th className="p-3.5">Client Entity</th>
                <th className="p-3.5">Investment ($)</th>
                <th className="p-3.5">Matched Slab Tier</th>
                <th className="p-3.5">Rate</th>
                <th className="p-3.5">Incentive ($)</th>
                <th className="p-3.5">Workflow Status</th>
                <th className="p-3.5">Approval Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c164a]/60 text-slate-200">
              {filteredDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-[#140f3d]/60 transition-colors">
                  <td className="p-3.5 text-slate-400 font-mono">{deal.date}</td>
                  <td className="p-3.5 font-bold text-white">{deal.userName}</td>
                  <td className="p-3.5 text-slate-200">{deal.clientName}</td>
                  <td className="p-3.5 font-mono text-white font-bold">${deal.investmentAmount.toLocaleString()}</td>
                  <td className="p-3.5 font-medium text-[#A78BFA]">{deal.slabTierName}</td>
                  <td className="p-3.5 font-mono text-purple-300 font-bold">{deal.appliedCommissionRate}%</td>
                  <td className="p-3.5 font-mono text-emerald-400 font-black">
                    +${deal.calculatedIncentive.toLocaleString()}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(deal.status)}`}>
                      {deal.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3.5">
                    {/* Action button based on Role */}
                    {currentUser.role === 'manager' && deal.status === 'Pending_Manager' && (
                      <button
                        onClick={() => updateIncentiveStatus(deal.id, 'Verified_Manager', 'Escrow funds verified by manager')}
                        className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[11px] font-semibold transition-colors"
                      >
                        Verify Deal
                      </button>
                    )}

                    {(currentUser.role === 'hr_ops' || currentUser.role === 'company_admin') &&
                      deal.status === 'Verified_Manager' && (
                        <button
                          onClick={() => updateIncentiveStatus(deal.id, 'Approved_HR', 'Authorized for March payroll')}
                          className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[11px] font-semibold transition-colors"
                        >
                          Approve for Payroll
                        </button>
                      )}

                    {deal.status === 'Approved_HR' && (
                      <span className="text-[11px] text-purple-300 font-mono">Queued in March Cycle</span>
                    )}

                    {deal.status === 'Paid_Payroll' && (
                      <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Disbursed</span>
                      </span>
                    )}
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
