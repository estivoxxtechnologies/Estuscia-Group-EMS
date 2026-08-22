import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CustomerPaymentReceipt } from '../types';
import {
  CreditCard,
  Plus,
  Search,
  Printer,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  ArrowUpRight,
  Sparkles,
  Layers,
  Percent,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
} from 'lucide-react';

export const ReceiptsSlabsView: React.FC = () => {
  const {
    customerReceipts,
    setSelectedReceiptForView,
    setIsCreateReceiptModalOpen,
    activeSlabVersion,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'receipts' | 'slabs_calculator'>('receipts');
  const [searchQuery, setSearchQuery] = useState('');
  const [calcAmount, setCalcAmount] = useState<number>(100000);

  const filteredReceipts = customerReceipts.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.customerName.toLowerCase().includes(q) ||
      r.receiptNumber.toLowerCase().includes(q) ||
      r.slabTierName.toLowerCase().includes(q) ||
      r.advisingStaffName.toLowerCase().includes(q)
    );
  });

  const totalReceiptsAmount = customerReceipts.reduce((acc, r) => acc + r.depositAmount, 0);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Customer Payment Receipts & Investment Slabs
            </h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
              Deposit Custody
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Issue official customer deposit slips, print investment certificates, and calculate investment slab yield economics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateReceiptModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Issue Customer Payment Slip</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-400">Total Customer Deposits</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              ${(totalReceiptsAmount / 1000000).toFixed(2)}M
            </h3>
            <span className="text-[10px] text-emerald-400 font-medium">{customerReceipts.length} Issued Certificates</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-400">Active Investment Slab</p>
            <h3 className="text-lg font-bold text-purple-300 mt-1">{activeSlabVersion.versionCode}</h3>
            <span className="text-[10px] text-gray-400">{activeSlabVersion.tiers.length} Slabs Configured</span>
          </div>
          <div className="p-3 rounded-xl bg-[#5C3FE0]/15 text-[#5C3FE0] border border-[#5C3FE0]/20">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-400">Max Slab Annual Return</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">24.0% p.a.</h3>
            <span className="text-[10px] text-emerald-500 font-medium">Sovereign Ultra Tier</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-400">Verification Rate</p>
            <h3 className="text-2xl font-bold text-cyan-400 mt-1">100%</h3>
            <span className="text-[10px] text-cyan-300 font-medium">Cryptographic QR Certified</span>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-black/40 border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab('receipts')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'receipts'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Customer Payment Receipts ({customerReceipts.length})
        </button>
        <button
          onClick={() => setActiveTab('slabs_calculator')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'slabs_calculator'
              ? 'bg-[#5C3FE0] text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Investment Slabs & Yield Calculator
        </button>
      </div>

      {/* View 1: Customer Receipts Table */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="p-3.5 rounded-2xl bg-[#09081E] border border-white/10 flex items-center justify-between gap-4">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer name, receipt #, slab..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-xs text-gray-400 font-medium">
              Showing {filteredReceipts.length} Customer Slips
            </span>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-[#09081E] border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/50 border-b border-white/10 text-gray-400 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Receipt Number</th>
                    <th className="py-3.5 px-4">Customer Name</th>
                    <th className="py-3.5 px-4">Deposit Amount</th>
                    <th className="py-3.5 px-4">Investment Slab</th>
                    <th className="py-3.5 px-4">Yield / Duration</th>
                    <th className="py-3.5 px-4">Advising Staff</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredReceipts.map((rcpt) => (
                    <tr key={rcpt.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-300">
                        {rcpt.receiptNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{rcpt.customerName}</div>
                        <div className="text-[11px] text-gray-400">{rcpt.customerEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white text-sm">
                          ${rcpt.depositAmount.toLocaleString()}
                        </span>
                        <div className="text-[10px] text-gray-500">{rcpt.paymentMode}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#5C3FE0]/20 text-purple-300 border border-[#5C3FE0]/30 font-medium text-[11px]">
                          {rcpt.slabTierName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-emerald-400">
                          {rcpt.annualYieldPercent}% p.a.
                        </span>
                        <div className="text-[10px] text-gray-400">
                          {rcpt.lockInMonths} Mo (Matures {rcpt.maturityDate})
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-300">
                        <div>{rcpt.advisingStaffName}</div>
                        <span className="text-[10px] text-gray-500 font-mono">{rcpt.advisingStaffCode}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            rcpt.status === 'Confirmed'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                          }`}
                        >
                          {rcpt.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedReceiptForView(rcpt)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#5C3FE0]/20 hover:border-[#5C3FE0]/40 text-white border border-white/10 font-medium transition-all inline-flex items-center gap-1.5 text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-purple-300" />
                          <span>View / Print Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Investment Slabs & Calculator */}
      {activeTab === 'slabs_calculator' && (
        <div className="space-y-6">
          {/* Interactive Calculator */}
          <div className="p-6 rounded-2xl bg-[#09081E] border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Interactive Investment Slab Calculator</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Simulate principal investment return, maturity timeline, and advisor incentive commission across slabs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-300 font-semibold">Test Principal ($):</label>
                <input
                  type="number"
                  step="5000"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-white font-bold text-sm w-36 focus:outline-none focus:border-[#5C3FE0]"
                />
              </div>
            </div>

            {/* Slabs Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {activeSlabVersion.tiers.map((tier) => {
                const projectedReturn = Math.round(calcAmount * (1 + (tier.annualYieldPercent / 100) * (tier.lockInMonths / 12)));
                const netProfit = projectedReturn - calcAmount;
                const advisorIncentive = Math.round(calcAmount * (tier.staffIncentivePercent / 100));

                return (
                  <div
                    key={tier.id}
                    className="p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-[#5C3FE0]/50 transition-all space-y-4 relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                          Tier {tier.tierOrder}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-0.5">{tier.name}</h4>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        {tier.annualYieldPercent}% p.a.
                      </span>
                    </div>

                    <div className="space-y-2 text-xs border-t border-b border-white/5 py-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Lock-in Duration:</span>
                        <span className="font-semibold text-white">{tier.lockInMonths} Months</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Min Investment:</span>
                        <span className="font-semibold text-white">${tier.minAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Net Investor Profit:</span>
                        <span className="font-bold text-emerald-400">+${netProfit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Maturity Value:</span>
                        <span className="font-bold text-white">${projectedReturn.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#5C3FE0]/15 border border-[#5C3FE0]/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-purple-300 block">Staff Incentive ({tier.staffIncentivePercent}%):</span>
                        <span className="font-bold text-white">${advisorIncentive.toLocaleString()} USD</span>
                      </div>
                      <button
                        onClick={() => setIsCreateReceiptModalOpen(true)}
                        className="p-1.5 rounded-lg bg-[#5C3FE0] text-white hover:bg-[#6A4DF4] transition-colors"
                        title="Issue receipt for this slab"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
