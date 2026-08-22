import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  Lock,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  ArrowRight,
  Database,
  Key,
  Sliders,
  Plus,
  Globe,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useApp, AppTab } from '../context/AppContext';
import { Tenant } from '../types';

export const AuditTenantView: React.FC = () => {
  const {
    tenants,
    currentTenant,
    setCurrentTenant,
    addNewTenant,
    auditLogs,
    currentUser,
    designationPermissions,
    updateDesignationPermission,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'tenants' | 'audit'>('matrix');
  const [logSearch, setLogSearch] = useState('');

  // New Tenant Modal / Form state
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyDomain, setNewCompanyDomain] = useState('');
  const [newCompanyPlan, setNewCompanyPlan] = useState<'Growth' | 'Enterprise Pro'>('Enterprise Pro');
  const [newCompanyCurrency, setNewCompanyCurrency] = useState('USD ($)');
  const [newCompanyBranches, setNewCompanyBranches] = useState('Dubai HQ, Singapore Branch');

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.actorName.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.target.toLowerCase().includes(logSearch.toLowerCase())
  );

  const availableTabs: { id: AppTab; label: string }[] = [
    { id: 'dashboard', label: 'Portal Overview' },
    { id: 'daily_work', label: 'Daily Work & Calls' },
    { id: 'attendance', label: 'Biometric Attendance' },
    { id: 'targets_incentives', label: 'Targets & Incentives' },
    { id: 'receipts_slabs', label: 'Customer Receipts & Slabs' },
    { id: 'payroll', label: 'Salary & Payslips' },
    { id: 'staff', label: 'Staff & Team Directory' },
    { id: 'knowledge_hub', label: 'CEO Knowledge Hub' },
    { id: 'audit_settings', label: 'Access Control & Tenants' },
  ];

  const handleToggleTab = (permId: string, currentAllowed: string[], tabId: string) => {
    const isCurrentlyAllowed = currentAllowed.includes(tabId);
    const updated = isCurrentlyAllowed
      ? currentAllowed.filter((t) => t !== tabId)
      : [...currentAllowed, tabId];
    updateDesignationPermission(permId, { allowedTabs: updated });
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    addNewTenant({
      name: newCompanyName,
      code: newCompanyName.substring(0, 4).toUpperCase(),
      logoText: newCompanyName.substring(0, 3).toUpperCase(),
      domain: newCompanyDomain || `${newCompanyName.toLowerCase().replace(/\s+/g, '')}.com`,
      plan: newCompanyPlan,
      branches: newCompanyBranches.split(',').map((b) => b.trim()),
      departments: ['Private Client Advisory', 'Engineering & Tech', 'Operations & HR'],
      currency: newCompanyCurrency,
      activeSlabVersion: 'v2026.1',
      primaryColor: '#5C3FE0',
      supportEmail: `admin@${newCompanyDomain || 'company.com'}`,
    });
    setIsOnboardModalOpen(false);
    setNewCompanyName('');
    setNewCompanyDomain('');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#09081E] border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#5C3FE0]/20 text-[#5C3FE0] border border-[#5C3FE0]/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">
              Designation Module Control & Multi-Tenant Sovereign Governance
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Control which system modules each employee designation can access, onboard client companies, and audit compliance trails.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-emerald-400">
          <Database className="w-4 h-4" />
          <span>Tenant Partition: {currentTenant.id}</span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-black/40 border border-white/10 w-fit">
        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'matrix'
              ? 'bg-[#5C3FE0] text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Designation Module Permissions Matrix
        </button>
        <button
          onClick={() => setActiveSubTab('tenants')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'tenants'
              ? 'bg-[#5C3FE0] text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Client Tenant Partitions ({tenants.length})
        </button>
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'audit'
              ? 'bg-[#5C3FE0] text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Immutable Compliance Audit Ledger
        </button>
      </div>

      {/* 1. Designation Module Permissions Matrix */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#5C3FE0]" />
                <span>Role & Designation Access Control Matrix</span>
              </h3>
              <p className="text-xs text-gray-400">
                Staff only see daily calls, attendance, personal targets, and customer deposit slips. Company financial progression is restricted to Executive Leadership.
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
              Live Policy Enforced
            </span>
          </div>

          <div className="space-y-4">
            {designationPermissions.map((perm) => (
              <div
                key={perm.id}
                className="p-5 rounded-2xl bg-[#09081E] border border-white/10 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
                  <div>
                    <h4 className="text-sm font-bold text-white">{perm.designation}</h4>
                    <span className="text-[11px] text-gray-400">Department: {perm.department}</span>
                  </div>
                  <span className="text-xs text-purple-300 font-semibold font-mono">
                    {perm.allowedTabs.length} of {availableTabs.length} Modules Allowed
                  </span>
                </div>

                {/* Module Checkbox Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
                  {availableTabs.map((tab) => {
                    const isAllowed = perm.allowedTabs.includes(tab.id);
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleToggleTab(perm.id, perm.allowedTabs, tab.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                          isAllowed
                            ? 'bg-[#5C3FE0]/20 border-[#5C3FE0]/50 text-white'
                            : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/15'
                        }`}
                      >
                        <span className="text-xs font-semibold truncate">{tab.label}</span>
                        {isAllowed ? (
                          <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Client Tenants List & Onboarding */}
      {activeSubTab === 'tenants' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Registered Multi-Tenant Client Companies
            </span>
            <button
              onClick={() => setIsOnboardModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#5C3FE0] to-[#7C3AED] text-white text-xs font-bold shadow transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Onboard New Client Company</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tenants.map((t) => (
              <div
                key={t.id}
                onClick={() => setCurrentTenant(t)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  currentTenant.id === t.id
                    ? 'bg-gradient-to-r from-[#120e3b] to-[#18124b] border-[#5C3FE0] shadow-lg shadow-[#5C3FE0]/20'
                    : 'bg-[#09081E] border-white/10 hover:border-[#5C3FE0]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{t.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {t.plan.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-gray-300">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-300" />
                    <span>{t.branches.length} Branches ({t.branches.join(', ')})</span>
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Domain: <span className="font-mono text-gray-300">{t.domain}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Currency: {t.currency}</span>
                  <span className="text-purple-300 font-semibold flex items-center gap-1">
                    <span>{currentTenant.id === t.id ? 'Active Tenant' : 'Switch Partition'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Immutable Compliance Audit Ledger */}
      {activeSubTab === 'audit' && (
        <div className="p-6 rounded-2xl bg-[#09081E] border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-white">Immutable Compliance & Action Log</span>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#5C3FE0]"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/50 text-gray-400 font-semibold border-b border-white/10 text-[10px] uppercase">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor & Persona</th>
                  <th className="p-3">Security Action</th>
                  <th className="p-3">Target Details</th>
                  <th className="p-3">Origin IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-200 font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 text-gray-400 text-[11px] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="p-3 text-white font-sans font-medium">
                      {log.actorName} <span className="text-gray-500 font-mono text-[10px]">({log.actorRole})</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#5C3FE0]/20 text-purple-300 border border-[#5C3FE0]/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-gray-300 text-[11px]">
                      {log.target}
                    </td>
                    <td className="p-3 text-gray-400 text-[11px]">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onboard Client Modal */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#09081E] border border-white/15 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Onboard New Client Company</h3>
            <form onSubmit={handleCreateTenant} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="e.g. Zenith Private Wealth LLC"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">Custom Domain</label>
                  <input
                    type="text"
                    value={newCompanyDomain}
                    onChange={(e) => setNewCompanyDomain(e.target.value)}
                    placeholder="zenithwealth.com"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">Currency</label>
                  <select
                    value={newCompanyCurrency}
                    onChange={(e) => setNewCompanyCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs"
                  >
                    <option value="USD ($)">USD ($)</option>
                    <option value="AED (AED)">AED (AED)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="GBP (£)">GBP (£)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">Branches (comma separated)</label>
                <input
                  type="text"
                  value={newCompanyBranches}
                  onChange={(e) => setNewCompanyBranches(e.target.value)}
                  placeholder="Dubai HQ, Riyadh Office, London"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs"
                />
              </div>
              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOnboardModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5C3FE0] text-white text-xs font-bold"
                >
                  Onboard Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
