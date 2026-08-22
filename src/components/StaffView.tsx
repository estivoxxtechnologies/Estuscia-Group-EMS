import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Building2,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Target,
  CreditCard,
  GraduationCap,
  ChevronRight,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { User } from '../types';

export const StaffView: React.FC = () => {
  const { users, currentTenant, setIsAddEmployeeOpen, staffTargets, setSelectedPayslipForView, payslips } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<User | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.designation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'all' || u.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">
                Staff & Workforce Directory
              </h1>
              <p className="text-xs text-slate-400">
                Manage roles, salary structures, target quotas, and hierarchy across {currentTenant.branches.length} branches
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddEmployeeOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#5C3FE0] hover:bg-[#7152FF] text-white text-xs font-bold shadow-lg shadow-[#5C3FE0]/30 transition-all flex items-center gap-2 cursor-pointer"
          id="onboard-employee-btn"
        >
          <UserPlus className="w-4 h-4" />
          <span>Onboard New Employee</span>
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-[#09071e] border border-[#231e54] text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, code, designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#5C3FE0]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-slate-200 text-xs w-full sm:w-auto"
          >
            <option value="all">All Departments ({users.length})</option>
            {currentTenant.departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const userTarget = staffTargets.find((st) => st.userId === user.id) || {
            targetAmount: user.assignedTarget || 600000,
            achievedAmount: user.currentAchievement || 500000,
          };
          const targetPct = Math.round((userTarget.achievedAmount / userTarget.targetAmount) * 100);

          return (
            <div
              key={user.id}
              onClick={() => setSelectedUserForDetail(user)}
              className="p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/80 hover:border-[#5C3FE0] transition-all space-y-4 shadow-lg cursor-pointer group"
            >
              {/* Top Profile Header */}
              <div className="flex items-start gap-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-[#5C3FE0]/50 group-hover:ring-[#5C3FE0] transition-all"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-[#A78BFA] transition-colors">
                      {user.name}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1a144b] text-[#A78BFA] border border-[#2d2770]">
                      {user.employeeCode}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium truncate mt-0.5">
                    {user.designation}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {user.department} • {user.branch}
                  </div>
                </div>
              </div>

              {/* Target & Compensation Snapshot */}
              <div className="p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Q1 Quota Attainment
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">{targetPct}%</span>
                </div>
                <div className="w-full bg-[#161240] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#5C3FE0] to-emerald-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, targetPct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>${userTarget.achievedAmount.toLocaleString()} achieved</span>
                  <span>Goal: ${userTarget.targetAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-[#1e1950] flex items-center justify-between text-[11px] text-slate-400">
                <span className="capitalize">{user.role.replace('_', ' ')}</span>
                <span className="text-[#A78BFA] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Detail Drawer / Modal */}
      {selectedUserForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[#09071e] border border-[#2d2770] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6 text-xs text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#231e54]">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUserForDetail.avatar}
                  alt={selectedUserForDetail.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-[#5C3FE0]"
                />
                <div>
                  <h2 className="text-base font-bold text-white">{selectedUserForDetail.name}</h2>
                  <p className="text-xs text-slate-400">
                    {selectedUserForDetail.designation} • {selectedUserForDetail.employeeCode}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="px-3 py-1 rounded-lg hover:bg-[#1a144b] text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            {/* Detailed Salary & Bank Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#0e0b2e] border border-[#231e54]">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Basic Salary</span>
                <span className="font-mono text-white font-bold">${selectedUserForDetail.salaryBase.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">HRA Allowance</span>
                <span className="font-mono text-white font-bold">${selectedUserForDetail.salaryHra.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Special Allow.</span>
                <span className="font-mono text-white font-bold">${selectedUserForDetail.salaryAllowances.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Assigned Target</span>
                <span className="font-mono text-emerald-400 font-bold">${selectedUserForDetail.assignedTarget.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-slate-400">
                <span className="font-semibold text-white">Bank Account / IBAN: </span>
                <span className="font-mono text-slate-200">{selectedUserForDetail.bankAccount}</span>
              </div>
              <div className="text-slate-400">
                <span className="font-semibold text-white">Tax ID: </span>
                <span className="font-mono text-slate-200">{selectedUserForDetail.panOrTaxId}</span>
              </div>
              <div className="text-slate-400">
                <span className="font-semibold text-white">Reporting Manager: </span>
                <span className="text-slate-200">{selectedUserForDetail.reportingManagerName || 'Executive Committee'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
