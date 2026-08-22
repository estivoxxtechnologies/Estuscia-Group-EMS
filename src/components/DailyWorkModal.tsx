import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  PhoneCall,
  UserCheck,
  Calendar,
  DollarSign,
  FileText,
  Send,
  Code2,
  GitPullRequest,
  Clock,
  AlertCircle,
  Sparkles,
  Building2,
} from 'lucide-react';

export const DailyWorkModal: React.FC = () => {
  const { isWorkLogModalOpen, setIsWorkLogModalOpen, currentUser, currentTenant, submitDailyWorkLog } = useApp();

  const isDeveloper = currentUser.role === 'developer' || currentUser.designation.toLowerCase().includes('developer') || currentUser.designation.toLowerCase().includes('engineer');
  const isSales = currentUser.role === 'staff' || currentUser.designation.toLowerCase().includes('advisor') || currentUser.designation.toLowerCase().includes('sales') || currentUser.designation.toLowerCase().includes('manager');
  const isOperations = currentUser.role === 'support' || currentUser.role === 'hr_ops' || currentUser.designation.toLowerCase().includes('operations');

  // Form State
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  
  // Sales specific fields
  const [callsMade, setCallsMade] = useState<number>(35);
  const [callsConnected, setCallsConnected] = useState<number>(24);
  const [leadsRespondedWell, setLeadsRespondedWell] = useState<number>(8);
  const [followUpsScheduled, setFollowUpsScheduled] = useState<number>(5);
  const [dealsPitched, setDealsPitched] = useState<number>(3);
  const [closingInvestmentAmount, setClosingInvestmentAmount] = useState<number>(100000);

  // Developer specific fields
  const [featuresShipped, setFeaturesShipped] = useState<string>('');
  const [bugFixes, setBugFixes] = useState<string>('');
  const [pullRequests, setPullRequests] = useState<string>('');
  const [hoursSpent, setHoursSpent] = useState<number>(8);
  const [blockers, setBlockers] = useState<string>('');

  // Common Narration
  const [narration, setNarration] = useState<string>('');

  if (!isWorkLogModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let workType: 'sales' | 'developer' | 'operations' | 'general' = 'general';
    if (isDeveloper) workType = 'developer';
    else if (isSales) workType = 'sales';
    else if (isOperations) workType = 'operations';

    submitDailyWorkLog({
      tenantId: currentTenant.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      employeeCode: currentUser.employeeCode,
      designation: currentUser.designation,
      department: currentUser.department,
      date,
      workType,
      callsMade: isSales ? Number(callsMade) : undefined,
      callsConnected: isSales ? Number(callsConnected) : undefined,
      leadsRespondedWell: isSales ? Number(leadsRespondedWell) : undefined,
      followUpsScheduled: isSales ? Number(followUpsScheduled) : undefined,
      dealsPitched: isSales ? Number(dealsPitched) : undefined,
      closingInvestmentAmount: isSales ? Number(closingInvestmentAmount) : undefined,
      featuresShipped: isDeveloper ? featuresShipped : undefined,
      bugFixes: isDeveloper ? bugFixes : undefined,
      pullRequests: isDeveloper ? pullRequests : undefined,
      hoursSpent: isDeveloper ? Number(hoursSpent) : undefined,
      blockers: blockers || undefined,
      narration: narration || (isDeveloper ? 'Completed designated sprint items and architecture refactoring.' : 'Completed daily client outreach and investment consultation.'),
    });

    setIsWorkLogModalOpen(false);
    // Reset form
    setNarration('');
    setFeaturesShipped('');
    setBugFixes('');
    setPullRequests('');
    setBlockers('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#09081E] border border-white/15 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#5C3FE0]/20 text-[#5C3FE0] border border-[#5C3FE0]/30">
              {isDeveloper ? <Code2 className="w-5 h-5" /> : <PhoneCall className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Daily Work & Activity Logger</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5C3FE0]/20 text-[#5C3FE0] border border-[#5C3FE0]/30 font-medium">
                  {currentUser.designation}
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Log your daily accomplishments, calls, client follow-ups, or code deliverables for review.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsWorkLogModalOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Top Info Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-black/40 border border-white/5 text-xs">
            <div>
              <span className="text-gray-400 block text-[11px]">Reporting Employee:</span>
              <span className="font-semibold text-white">{currentUser.name} ({currentUser.employeeCode})</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">Log Date:</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-0.5 px-2 py-1 rounded bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
              />
            </div>
          </div>

          {/* Conditional Fields for Sales Staff / Advisors */}
          {isSales && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Daily Call Metrics & Outreach Volume</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <label className="block text-[11px] font-medium text-gray-400 mb-1">
                    Calls Completed
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={callsMade}
                    onChange={(e) => setCallsMade(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-[#5C3FE0]"
                  />
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <label className="block text-[11px] font-medium text-gray-400 mb-1">
                    Connected / Spoken
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={callsConnected}
                    onChange={(e) => setCallsConnected(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-[#5C3FE0]"
                  />
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 bg-emerald-500/5">
                  <label className="block text-[11px] font-medium text-emerald-400 mb-1">
                    Responded Well (Hot)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={leadsRespondedWell}
                    onChange={(e) => setLeadsRespondedWell(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <label className="block text-[11px] font-medium text-gray-400 mb-1">
                    Follow-ups Scheduled
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={followUpsScheduled}
                    onChange={(e) => setFollowUpsScheduled(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-[#5C3FE0]"
                  />
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <label className="block text-[11px] font-medium text-gray-400 mb-1">
                    Deals / Slabs Pitched
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={dealsPitched}
                    onChange={(e) => setDealsPitched(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-[#5C3FE0]"
                  />
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-[#5C3FE0]/30 bg-[#5C3FE0]/5">
                  <label className="block text-[11px] font-medium text-purple-300 mb-1">
                    Closing Investment ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={closingInvestmentAmount}
                    onChange={(e) => setClosingInvestmentAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-[#5C3FE0]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Conditional Fields for Developers */}
          {isDeveloper && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                <Code2 className="w-3.5 h-3.5" />
                <span>Developer Engineering Deliverables</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <label className="block text-[11px] font-medium text-gray-400 mb-1">
                    Features Developed / Shipped
                  </label>
                  <input
                    type="text"
                    value={featuresShipped}
                    onChange={(e) => setFeaturesShipped(e.target.value)}
                    placeholder="e.g. Biometric Excel parser, Customer slip generator"
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <label className="block text-[11px] font-medium text-gray-400 mb-1">
                    Bug Fixes / PR Links
                  </label>
                  <input
                    type="text"
                    value={pullRequests}
                    onChange={(e) => setPullRequests(e.target.value)}
                    placeholder="e.g. PR #409 (Yield rounding fix), PR #410"
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <label className="block text-[11px] font-medium text-gray-400 mb-1">
                    Hours Logged Today
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    step="0.5"
                    value={hoursSpent}
                    onChange={(e) => setHoursSpent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2 p-3 rounded-xl bg-black/40 border border-white/10">
                  <label className="block text-[11px] font-medium text-gray-400 mb-1">
                    Blockers / Dependencies (Optional)
                  </label>
                  <input
                    type="text"
                    value={blockers}
                    onChange={(e) => setBlockers(e.target.value)}
                    placeholder="e.g. Awaiting sandbox payment API credentials from gateway"
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Detailed Narration / Work Summary (For All) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-200">
              {isDeveloper
                ? 'Daily Work Narration (What was done today in detail)'
                : isSales
                ? 'Detailed Call Remarks & Client Discussion Notes'
                : 'Daily Operations & Task Notes'}
            </label>
            <textarea
              required
              rows={4}
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder={
                isDeveloper
                  ? "Describe the tasks completed, refactored components, and code architecture done today..."
                  : isSales
                  ? "Describe which HNI / corporate clients you contacted, responses received, interest in sovereign investment slabs, and scheduled meetings..."
                  : "Detail the operations, tickets closed, or onboarding actions executed today..."
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0] focus:ring-1 focus:ring-[#5C3FE0] leading-relaxed"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsWorkLogModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5C3FE0] to-[#7C3AED] hover:from-[#6A4DF4] hover:to-[#8B5CF6] text-white text-xs font-bold shadow-lg shadow-[#5C3FE0]/30 transition-all flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Daily Work Report</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
