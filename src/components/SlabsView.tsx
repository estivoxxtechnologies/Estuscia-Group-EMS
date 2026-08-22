import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Calculator,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  History,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SlabTier, SlabVersion } from '../types';

export const SlabsView: React.FC = () => {
  const { slabVersions, activeSlabVersion, addNewSlabVersion, currentUser } = useApp();

  const [selectedVersionId, setSelectedVersionId] = useState<string>(activeSlabVersion.id);
  const [calculatorAmount, setCalculatorAmount] = useState<number>(350000);
  const [calculatorMonths, setCalculatorMonths] = useState<number>(24);
  const [isAddVersionModalOpen, setIsAddVersionModalOpen] = useState(false);

  const displayedVersion = slabVersions.find((sv) => sv.id === selectedVersionId) || activeSlabVersion;

  // Simulator matched tier
  const matchedTier =
    displayedVersion.tiers.find(
      (t) => calculatorAmount >= t.minAmount && calculatorAmount <= t.maxAmount
    ) || displayedVersion.tiers[0];

  // Financial calculations
  const annualYieldDollar = Math.round(calculatorAmount * (matchedTier.expectedAnnualYieldPercent / 100));
  const totalInvestorReturn = Math.round(
    calculatorAmount + (annualYieldDollar * (calculatorMonths / 12))
  );
  const staffCommissionEarned = Math.round(
    calculatorAmount * (matchedTier.staffCommissionPercent / 100)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">
                Time-Dependent Investment Slabs Engine
              </h1>
              <p className="text-xs text-slate-400">
                Effective-dated yield architectures, commission rates & version history control
              </p>
            </div>
          </div>
        </div>

        {/* Version Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {slabVersions.map((sv) => (
            <button
              key={sv.id}
              onClick={() => setSelectedVersionId(sv.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedVersionId === sv.id
                  ? 'bg-[#5C3FE0] text-white shadow-lg shadow-[#5C3FE0]/30'
                  : 'bg-[#140f3d] text-slate-300 hover:bg-[#1f175a] border border-[#2d2770]'
              }`}
            >
              <span className="font-mono">{sv.versionCode}</span>
              {sv.status === 'active' ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              ) : (
                <span className="text-[10px] text-slate-400 font-normal">({sv.status})</span>
              )}
            </button>
          ))}

          {(currentUser.role === 'super_admin' || currentUser.role === 'company_admin') && (
            <button
              onClick={() => setIsAddVersionModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#1d1654] hover:bg-[#281f72] border border-[#5C3FE0]/50 text-xs font-bold text-[#A78BFA] transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Version</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Version Metadata Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#100c36] via-[#161048] to-[#0c0828] border border-[#2d2770] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white">{displayedVersion.title}</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                displayedVersion.status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-700 text-slate-300 border-slate-600'
              }`}
            >
              {displayedVersion.status}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-300 font-mono">
            <div>
              <span className="text-slate-400">Effective From: </span>
              <span className="text-white font-bold">{displayedVersion.effectiveFrom}</span>
            </div>
            <div>
              <span className="text-slate-400">Effective To: </span>
              <span className="text-white font-bold">
                {displayedVersion.effectiveTo || 'Active & Present'}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          <span className="text-slate-400 font-semibold">Governance Notes: </span>
          {displayedVersion.changeNotes}
        </p>

        <div className="text-[11px] text-[#A78BFA] flex items-center gap-1.5 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Approved: {displayedVersion.approvedBy}</span>
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Slab Tiers ({displayedVersion.tiers.length} Tiers Defined)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedVersion.tiers.map((tier) => (
            <div
              key={tier.id}
              className="p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/80 hover:border-[#5C3FE0] transition-all space-y-4 shadow-lg group relative overflow-hidden"
            >
              {/* Top Tier Title & Yield */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-white">{tier.name}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Range: <span className="font-mono text-slate-200 font-semibold">${tier.minAmount.toLocaleString()} - ${tier.maxAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {tier.expectedAnnualYieldPercent}%
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Annual Yield</div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed min-h-[3rem]">
                {tier.description}
              </p>

              {/* Tier Specs Grid */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54] text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Lock-in Period</span>
                  <span className="font-semibold text-white">{tier.lockInMonths} Months</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Payout Frequency</span>
                  <span className="font-semibold text-white">{tier.payoutFrequency}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Staff Commission</span>
                  <span className="font-mono text-purple-300 font-bold">{tier.staffCommissionPercent}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Risk Categorization</span>
                  <span className="font-semibold text-amber-300">{tier.riskLevel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Slab & Commission Simulator Sandbox */}
      <div className="p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/80 space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#231e54]">
          <div className="p-2 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white leading-tight">
              Interactive Slab & Staff Commission Simulator
            </h2>
            <p className="text-xs text-slate-400">
              Simulate investment yields and staff payouts for any deal size against {displayedVersion.versionCode}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Controls Form (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="font-semibold text-slate-300 uppercase tracking-wider">
                  Investor Capital Amount (USD)
                </label>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  ${calculatorAmount.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={10000}
                max={5000000}
                step={25000}
                value={calculatorAmount}
                onChange={(e) => setCalculatorAmount(Number(e.target.value))}
                className="w-full accent-[#5C3FE0] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>$10k</span>
                <span>$1M</span>
                <span>$2.5M</span>
                <span>$5M+</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="font-semibold text-slate-300 uppercase tracking-wider">
                  Tenure Commitment (Months)
                </label>
                <span className="font-mono text-white font-bold">{calculatorMonths} Months</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[6, 12, 24, 36].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCalculatorMonths(m)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      calculatorMonths === m
                        ? 'bg-[#5C3FE0] text-white border-[#5C3FE0]'
                        : 'bg-[#120e36] text-slate-400 border-[#2d2770] hover:text-white'
                    }`}
                  >
                    {m} Mos
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Calculation Result Card (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-gradient-to-br from-[#120e38] to-[#0a0724] border border-[#5C3FE0]/50 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                <span>Tier Match: {matchedTier.name}</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {matchedTier.expectedAnnualYieldPercent}% Yield
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3 rounded-xl bg-[#09071c] border border-[#231e54]">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Annual Investor Yield
                </span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  ${annualYieldDollar.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">per annum</span>
              </div>

              <div className="p-3 rounded-xl bg-[#09071c] border border-[#231e54]">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Total Return at Maturity
                </span>
                <span className="text-lg font-black text-white font-mono">
                  ${totalInvestorReturn.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Principal + Yield</span>
              </div>

              <div className="p-3 rounded-xl bg-[#1b1452] border border-[#5C3FE0]/60">
                <span className="text-[10px] text-purple-300 uppercase tracking-wider block font-semibold">
                  Staff Commission ({matchedTier.staffCommissionPercent}%)
                </span>
                <span className="text-lg font-black text-[#C4B5FD] font-mono">
                  ${staffCommissionEarned.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-0.5 font-mono">Incentive Credit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
