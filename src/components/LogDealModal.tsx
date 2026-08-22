import React, { useState, useEffect } from 'react';
import { X, Target, DollarSign, TrendingUp, CheckCircle2, Calculator, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LogDealModal: React.FC = () => {
  const { isLogDealOpen, setIsLogDealOpen, activeSlabVersion, currentUser, logIncentiveDeal } = useApp();

  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState<number>(250000);
  const [selectedTierId, setSelectedTierId] = useState<string>('');
  const [depositRef, setDepositRef] = useState('');

  // Auto-detect tier based on amount
  useEffect(() => {
    if (activeSlabVersion) {
      const matched = activeSlabVersion.tiers.find(
        (t) => amount >= t.minAmount && amount <= t.maxAmount
      ) || activeSlabVersion.tiers[0];

      if (matched) {
        setSelectedTierId(matched.id);
      }
    }
  }, [amount, activeSlabVersion]);

  if (!isLogDealOpen) return null;

  const currentTier = activeSlabVersion.tiers.find((t) => t.id === selectedTierId) || activeSlabVersion.tiers[0];
  const calculatedIncentive = Math.round(amount * (currentTier.staffCommissionPercent / 100));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || amount <= 0) return;

    logIncentiveDeal({
      tenantId: activeSlabVersion.tenantId,
      userId: currentUser.id,
      userName: currentUser.name,
      clientName,
      investmentAmount: amount,
      slabTierId: currentTier.id,
      slabTierName: `${currentTier.name} (${currentTier.expectedAnnualYieldPercent}% Yield)`,
      slabVersion: activeSlabVersion.versionCode,
      appliedCommissionRate: currentTier.staffCommissionPercent,
      calculatedIncentive,
      managerNotes: depositRef ? `Deposit Reference: ${depositRef}` : 'Submitted via BLMP Deal Logger',
      payoutCycleMonth: 'March 2026',
    });

    setIsLogDealOpen(false);
    setClientName('');
    setAmount(250000);
    setDepositRef('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#09071e] border border-[#2d2770] rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0e0b2e] border-b border-[#231e54]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Log New Investment Deal & Incentive
              </h2>
              <p className="text-xs text-slate-400">
                Mapped to active slab version <span className="text-[#A78BFA] font-mono">{activeSlabVersion.versionCode}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsLogDealOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[#1f1857] text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-slate-200">
          {/* Client Name Input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Client / Family Trust / Corporate Entity Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Al-Mansoor Family Trust, Geneva Capital Ltd..."
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0]"
            />
          </div>

          {/* Investment Capital Amount Slider / Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Investment Deposit Amount (USD) *
              </label>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                ${amount.toLocaleString()}
              </span>
            </div>
            <input
              type="number"
              min={10000}
              max={10000000}
              step={5000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white font-mono text-sm focus:outline-none focus:border-[#5C3FE0]"
            />
            {/* Quick amount chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[25000, 75000, 200000, 500000, 1500000].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                    amount === val
                      ? 'bg-[#5C3FE0] text-white border-[#5C3FE0]'
                      : 'bg-[#140f3d] text-slate-400 border-[#2d2770] hover:text-white'
                  }`}
                >
                  ${(val / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          {/* Matched Slab Tier Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#120e36] to-[#181247] border border-[#5C3FE0]/50 shadow-inner space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                <span className="font-bold text-white text-sm">{currentTier.name}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {currentTier.expectedAnnualYieldPercent}% Investor Yield
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              {currentTier.description}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#231e54] text-[11px]">
              <div>
                <span className="text-slate-400 block">Staff Commission Rate:</span>
                <span className="font-bold text-purple-300 text-xs">{currentTier.staffCommissionPercent}%</span>
              </div>
              <div>
                <span className="text-slate-400 block">Investor Lock-in:</span>
                <span className="font-bold text-white">{currentTier.lockInMonths} Months ({currentTier.payoutFrequency})</span>
              </div>
            </div>
          </div>

          {/* Computed Staff Incentive Highlight */}
          <div className="p-4 rounded-xl bg-[#09071c] border border-[#231e54] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                Calculated Staff Incentive
              </span>
              <span className="text-[10px] text-slate-400">
                Formula: ${amount.toLocaleString()} × {currentTier.staffCommissionPercent}%
              </span>
            </div>
            <div className="text-right">
              <div className="text-xl font-extrabold text-emerald-400 font-mono">
                +${calculatedIncentive.toLocaleString()}
              </div>
              <div className="text-[9px] text-[#A78BFA] uppercase font-mono">Payable in Payroll Cycle</div>
            </div>
          </div>

          {/* Bank Escrow Reference */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Deposit Slip / Bank Escrow Reference Number
            </label>
            <input
              type="text"
              placeholder="e.g. ENBD-WIRE-88902-DXB"
              value={depositRef}
              onChange={(e) => setDepositRef(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0]"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#231e54] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsLogDealOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#5C3FE0] hover:bg-[#7152FF] text-white text-xs font-bold shadow-lg shadow-[#5C3FE0]/30 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Deal for Manager Verification</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
