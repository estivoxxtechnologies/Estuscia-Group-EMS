import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  ChevronDown,
  Search,
  Bell,
  Globe,
  Sparkles,
  Shield,
  UserCheck,
  Briefcase,
  Video,
  Users,
  CheckCircle2,
  Layers,
  LogOut,
  Plus,
  PhoneCall,
  CreditCard,
  Upload,
  Code2,
  Receipt,
  Menu,
  X,
  MapPin,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EstusciaLogo } from './EstusciaLogo';
import { Role } from '../types';

export const Header: React.FC = () => {
  const {
    currentTenant,
    setCurrentTenant,
    tenants,
    currentUser,
    switchRole,
    notifications,
    setIsSearchOpen,
    setIsWorkLogModalOpen,
    setIsCreateReceiptModalOpen,
    setIsBatchUploadOpen,
    setActiveTab,
    logout,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    selectedBranchFilter,
    setSelectedBranchFilter,
  } = useApp();
  if (!currentUser) {
    return null;
  }

  const [isTenantOpen, setIsTenantOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const tenantRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = currentUser.role === 'super_admin';
  const unreadNotifs = notifications.filter((n) => !n.isRead);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tenantRef.current && !tenantRef.current.contains(e.target as Node)) {
        setIsTenantOpen(false);
      }
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setIsBranchOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setIsRoleOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifsOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleLabels: Record<Role, { title: string; icon: React.ReactNode; color: string; desc: string }> = {
    super_admin: {
      title: 'Super Admin',
      icon: <Shield className="w-4 h-4 text-amber-400" />,
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      desc: 'All Companies, Full Financials & Governance',
    },
    company_admin: {
      title: 'Company Admin / COO',
      icon: <Building2 className="w-4 h-4 text-indigo-400" />,
      color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      desc: 'Operations, Designation Modules & Slabs',
    },
    hr_ops: {
      title: 'HR & Operations',
      icon: <Users className="w-4 h-4 text-emerald-400" />,
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      desc: 'Biometric Excel Upload, Staff & Payroll',
    },
    branch_manager: {
      title: 'Branch Manager',
      icon: <Briefcase className="w-4 h-4 text-cyan-400" />,
      color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      desc: 'Review Team Calls, Targets & Deal Approvals',
    },
    sales_staff: {
      title: 'Sales Advisor / Staff',
      icon: <UserCheck className="w-4 h-4 text-purple-400" />,
      color: 'bg-[#5C3FE0]/20 text-purple-300 border-[#5C3FE0]/30',
      desc: 'Daily Calls, Customer Slips & Incentives',
    },
    developer: {
      title: 'Software Developer',
      icon: <Code2 className="w-4 h-4 text-blue-400" />,
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      desc: 'Daily Code Narrations, Tasks & Attendance',
    },
    support_staff: {
      title: 'Operations & Support',
      icon: <Receipt className="w-4 h-4 text-teal-400" />,
      color: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      desc: 'Customer Slips, Operations & Logs',
    },
    knowledge_trainer: {
      title: 'Knowledge Trainer',
      icon: <Video className="w-4 h-4 text-pink-400" />,
      color: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      desc: 'CEO Masterclasses & Video Training',
    },
  };

  const isHR = currentUser.role === 'hr_ops' || currentUser.role === 'company_admin' || currentUser.role === 'super_admin';

  return (
    <header className="h-16 border-b border-white/10 bg-[#040312]/80 backdrop-blur-md flex items-center justify-between px-3 sm:px-4 lg:px-8 select-none shrink-0 sticky top-0 z-40">

      {/* Left: Mobile Menu Trigger & Tenant/Branch Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl bg-[#09081E] hover:bg-white/5 border border-white/10 text-gray-300 hover:text-white transition-colors"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Tenant Scope Control */}
        {isSuperAdmin ? (
          // Super Admin can switch across all customer tenants
          <div className="relative" ref={tenantRef}>
            <button
              onClick={() => setIsTenantOpen(!isTenantOpen)}
              className="bg-[#09081E] px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-500/40 flex items-center gap-1.5 sm:gap-2 hover:border-amber-500/70 transition-colors shadow-sm cursor-pointer"
              id="tenant-switcher-btn"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="text-left">
                <div className="text-[9px] text-amber-400 font-bold uppercase tracking-wider hidden sm:block">
                  Superadmin Scope
                </div>
                <div className="text-xs font-bold text-white max-w-[110px] sm:max-w-[160px] md:max-w-[200px] truncate">
                  {currentTenant?.name ?? 'No Tenant Selected'}
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isTenantOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTenantOpen && (
              <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-[#09081E] border border-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold tracking-widest text-amber-400 uppercase flex items-center justify-between">
                  <span>Customer Tenants List</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                    {tenants.length} Tenants
                  </span>
                </div>
                <div className="space-y-1 mt-1">
                  {tenants.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setCurrentTenant(t);
                        setSelectedBranchFilter('All Branches');
                        setIsTenantOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${t.id === currentTenant.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'hover:bg-white/5 text-gray-300'
                        }`}
                    >
                      <div>
                        <div className="text-xs font-semibold text-white">{t.name}</div>
                        <div className="text-[10px] text-gray-400">{t.domain} • {t.branches.length} Branches</div>
                      </div>
                      {t.id === currentTenant.id && (
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Non-superadmin: Tenant is locked, Branch selector is available
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="bg-[#09081E] px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#5C3FE0] shrink-0" />
              <div className="text-left">
                <div className="text-[9px] text-[#A78BFA] font-bold uppercase tracking-wider hidden sm:block">
                  Company Tenant
                </div>
                <div className="text-xs font-bold text-white max-w-[100px] sm:max-w-[140px] truncate">
                  {currentTenant?.name ?? 'No Tenant Selected'}
                </div>
              </div>
            </div>

            {/* Branch Selector for Company Managers / Admins */}
            <div className="relative" ref={branchRef}>
              <button
                onClick={() => setIsBranchOpen(!isBranchOpen)}
                className="bg-[#09081E] px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 hover:border-[#5C3FE0]/50 transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-xs font-medium text-gray-200 max-w-[90px] sm:max-w-[130px] truncate">
                  {selectedBranchFilter}
                </span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isBranchOpen ? 'rotate-180' : ''}`} />
              </button>

              {isBranchOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-[#09081E] border border-white/15 rounded-xl shadow-2xl p-2 z-50">
                  <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                    Select Branch Scope
                  </div>
                  <div className="space-y-1 mt-1">
                    <button
                      onClick={() => {
                        setSelectedBranchFilter('All Branches');
                        setIsBranchOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${selectedBranchFilter === 'All Branches'
                        ? 'bg-[#5C3FE0]/20 text-[#5C3FE0] font-semibold'
                        : 'text-gray-300 hover:bg-white/5'
                        }`}
                    >
                      <span>All Branches</span>
                      {selectedBranchFilter === 'All Branches' && <CheckCircle2 className="w-3.5 h-3.5 text-[#5C3FE0]" />}
                    </button>
                    {currentTenant?.branches?.map((b) => () => (
                      <button
                        key={b}
                        onClick={() => {
                          setSelectedBranchFilter(b);
                          setIsBranchOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${selectedBranchFilter === b
                          ? 'bg-[#5C3FE0]/20 text-[#5C3FE0] font-semibold'
                          : 'text-gray-300 hover:bg-white/5'
                          }`}
                      >
                        <span className="truncate">{b}</span>
                        {selectedBranchFilter === b && <CheckCircle2 className="w-3.5 h-3.5 text-[#5C3FE0]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Center/Right Action Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3">

        {/* Quick Action: Log Work */}
        <button
          onClick={() => setIsWorkLogModalOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 text-xs font-semibold transition-all cursor-pointer"
        >
          <PhoneCall className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden md:inline">+ Log Today's Work</span>
          <span className="md:hidden">Log Work</span>
        </button>

        {/* Quick Action: Customer Deposit Slip */}
        <button
          onClick={() => setIsCreateReceiptModalOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-200 text-xs font-semibold transition-all cursor-pointer"
        >
          <Receipt className="w-3.5 h-3.5 text-emerald-400" />
          <span>+ Customer Deposit Slip</span>
        </button>

        {/* HR Quick Action: Biometric Excel */}
        {isHR && (
          <button
            onClick={() => setIsBatchUploadOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload Biometric Excel</span>
          </button>
        )}

        {/* Global Search */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#09081E] hover:bg-white/5 border border-white/10 text-xs text-gray-400 transition-colors flex items-center gap-2 cursor-pointer"
          aria-label="Search"
        >
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <span className="hidden xl:inline text-xs">Search staff, slips, slabs...</span>
        </button>

        {/* Role Switcher Pill */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setIsRoleOpen(!isRoleOpen)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${roleLabels[currentUser.role]?.color || 'bg-white/10 text-white'}`}
          >
            {roleLabels[currentUser.role]?.icon}
            <span className="hidden md:inline">{roleLabels[currentUser.role]?.title || currentUser.role}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isRoleOpen ? 'rotate-180' : ''}`} />
          </button>

          {isRoleOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#09081E] border border-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-bold tracking-widest text-gray-400 uppercase flex items-center justify-between">
                <span>Switch Role Perspective</span>
                <span className="text-[10px] text-[#5C3FE0] font-normal">EMS Roles</span>
              </div>
              <div className="space-y-1 mt-1">
                {(Object.keys(roleLabels) as Role[]).map((r) => {
                  const info = roleLabels[r];
                  const isActive = currentUser.role === r;
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        switchRole(r);
                        setIsRoleOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-start gap-2.5 transition-colors cursor-pointer ${isActive
                        ? 'bg-[#5C3FE0]/20 text-[#5C3FE0] border border-[#5C3FE0]/40'
                        : 'hover:bg-white/5 text-gray-300'
                        }`}
                    >
                      <div className="p-1.5 rounded-lg bg-black/40 shrink-0 mt-0.5 border border-white/5">
                        {info.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white flex items-center justify-between">
                          <span>{info.title}</span>
                          {isActive && <span className="text-[9px] text-emerald-400 font-mono">ACTIVE</span>}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate">{info.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifsOpen(!isNotifsOpen)}
            className="relative p-2 rounded-xl bg-[#09081E] hover:bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#5C3FE0] ring-2 ring-[#040312]" />
            )}
          </button>

          {isNotifsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#09081E] border border-white/15 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Notifications</span>
                  <span className="px-1.5 py-0.5 text-[10px] bg-[#5C3FE0]/20 text-purple-300 rounded-full font-bold">
                    {unreadNotifs.length} new
                  </span>
                </div>
              </div>
              <div className="divide-y divide-white/5 max-h-80 overflow-y-auto mt-2 space-y-1 custom-scrollbar">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl transition-colors ${!n.isRead ? 'bg-[#5C3FE0]/10 text-white' : 'text-gray-300 hover:bg-white/5'
                      }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#5C3FE0] font-bold">{n.title}</span>
                      <span className="text-[10px] text-gray-500">{n.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-gray-300 mt-1">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Logout Dropdown */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="User profile menu"
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover border border-white/15 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#5C3FE0]/20 border border-[#5C3FE0]/30 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {currentUser.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
            )}
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#09081E] border border-white/15 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-9 h-9 rounded-full object-cover border border-white/15 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#5C3FE0]/20 border border-[#5C3FE0]/30 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {currentUser.name?.charAt(0)?.toUpperCase() ?? 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-gray-400 truncate">{currentUser.designation}</div>
                  <div className="text-[10px] text-purple-300 font-mono mt-0.5">{currentUser.employeeCode}</div>
                </div>
              </div>

              <div className="py-2 space-y-1 text-xs">
                <button
                  onClick={() => {
                    setActiveTab('daily_work');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-gray-300 hover:bg-white/5 flex items-center justify-between cursor-pointer"
                >
                  <span>My Daily Work Submissions</span>
                  <PhoneCall className="w-3.5 h-3.5 text-purple-400" />
                </button>
                <button
                  onClick={() => {
                    setActiveTab('receipts_slabs');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-gray-300 hover:bg-white/5 flex items-center justify-between cursor-pointer"
                >
                  <span>Customer Deposit Slips</span>
                  <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                </button>
                <button
                  onClick={() => {
                    setActiveTab('payroll');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-gray-300 hover:bg-white/5 flex items-center justify-between cursor-pointer"
                >
                  <span>My Salary & Payslips</span>
                  <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>

              <div className="pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 text-xs font-semibold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
