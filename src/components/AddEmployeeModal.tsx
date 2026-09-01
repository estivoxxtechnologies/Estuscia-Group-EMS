import React, { useEffect, useState } from 'react';
import { X, UserPlus, Building2, Briefcase, DollarSign, Shield, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Role, User } from '../types';

export const AddEmployeeModal: React.FC = () => {
  const { isAddEmployeeOpen, setIsAddEmployeeOpen, currentTenant, users, logAuditEvent } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [department, setDepartment] = useState('');
  const [branch, setBranch] = useState('');
  const [designation, setDesignation] = useState('Investment Advisor');
  const [role, setRole] = useState<Role>('staff');
  const [salaryBase, setSalaryBase] = useState(6000);
  const [salaryHra, setSalaryHra] = useState(1800);
  const [salaryAllowances, setSalaryAllowances] = useState(1000);
  const [assignedTarget, setAssignedTarget] = useState(600000);

  useEffect(() => {
    if (!currentTenant) {
      return;
    }

    setEmployeeCode((current) =>
      current || `EST-ADV-0${users.length + 10}`
    );

    setDepartment((current) =>
      current || currentTenant.departments[0] || 'Private Client Advisory'
    );

    setBranch((current) =>
      current || currentTenant.branches[0] || 'Dubai Financial Centre (HQ)'
    );
  }, [currentTenant, users.length]);

  if (!isAddEmployeeOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    logAuditEvent('ONBOARD_NEW_STAFF', `Added ${name} (${employeeCode}) to ${department} - ${branch}`);
    setIsAddEmployeeOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#09071e] border border-[#2d2770] rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0e0b2e] border-b border-[#231e54]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Onboard Employee & Assign Quota
              </h2>
              <p className="text-xs text-slate-400">
                Setup employment grade, salary baseline, and target cycle
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddEmployeeOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[#1f1857] text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jonathan Hayes"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Corporate Email *
              </label>
              <input
                type="email"
                required
                placeholder="jonathan.hayes@estusciagroup.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Employee Code
              </label>
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-[#A78BFA] font-mono focus:outline-none focus:border-[#5C3FE0]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Role Persona
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0]"
              >
                <option value="staff">Staff / Advisor</option>
                <option value="manager">Branch Manager</option>
                <option value="hr_ops">HR & Operations</option>
                <option value="company_admin">Company Admin</option>
                <option value="trainer">Content Trainer</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Branch Location
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0]"
              >
                {currentTenant.branches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0]"
              >
                {currentTenant.departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Designation Title
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Senior Wealth Advisor"
                className="w-full px-3.5 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0]"
              />
            </div>
          </div>

          {/* Salary & Target Configuration */}
          <div className="p-4 rounded-xl bg-[#0d0926] border border-[#231e54] space-y-3">
            <div className="text-[11px] font-bold text-[#A78BFA] uppercase tracking-wider">
              Compensation & Quarterly Target Allocation
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Basic Salary ($)</label>
                <input
                  type="number"
                  value={salaryBase}
                  onChange={(e) => setSalaryBase(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#140f3d] border border-[#2d2770] text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">HRA Allowance ($)</label>
                <input
                  type="number"
                  value={salaryHra}
                  onChange={(e) => setSalaryHra(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#140f3d] border border-[#2d2770] text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Special Allow. ($)</label>
                <input
                  type="number"
                  value={salaryAllowances}
                  onChange={(e) => setSalaryAllowances(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#140f3d] border border-[#2d2770] text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Q1 Target Quota ($)</label>
                <input
                  type="number"
                  value={assignedTarget}
                  onChange={(e) => setAssignedTarget(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#140f3d] border border-[#2d2770] text-emerald-400 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#231e54] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddEmployeeOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#5C3FE0] hover:bg-[#7152FF] text-white text-xs font-bold shadow-lg shadow-[#5C3FE0]/30 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Onboarding</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
