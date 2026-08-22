import React from 'react';
import {
  LayoutDashboard,
  PhoneCall,
  CalendarCheck,
  Target,
  CreditCard,
  Video,
  Users,
  ShieldCheck,
  Receipt,
  LogOut,
  Sparkles,
  Building2,
  Code2,
  X,
} from 'lucide-react';
import { useApp, AppTab } from '../context/AppContext';
import { EstusciaLogo } from './EstusciaLogo';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isTabAllowed,
    currentUser,
    currentTenant,
    leaveRequests,
    incentiveTransactions,
    dailyWorkLogs,
    logout,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  } = useApp();

  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'Pending').length;
  const pendingDealsCount = incentiveTransactions.filter(
    (t) => t.status === 'Pending_Manager' || t.status === 'Verified_Manager'
  ).length;
  const todayLogsCount = dailyWorkLogs.filter((d) => d.date === new Date().toISOString().substring(0, 10)).length;

  // All available navigation items
  const allNavItems: {
    id: AppTab;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeColor?: string;
    section: 'daily_ops' | 'finance_slabs' | 'leadership_gov';
  }[] = [
    {
      id: 'dashboard',
      label: 'Portal Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      section: 'daily_ops',
    },
    {
      id: 'daily_work',
      label: currentUser.role === 'developer' ? 'Daily Code & Tasks' : 'Daily Work & Calls',
      icon: currentUser.role === 'developer' ? <Code2 className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />,
      badge: todayLogsCount > 0 ? `${todayLogsCount} Logged` : 'Action Req',
      badgeColor: todayLogsCount > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      section: 'daily_ops',
    },
    {
      id: 'attendance',
      label: 'Biometric & Attendance',
      icon: <CalendarCheck className="w-4 h-4" />,
      badge: pendingLeavesCount > 0 ? `${pendingLeavesCount} Leaves` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      section: 'daily_ops',
    },
    {
      id: 'targets_incentives',
      label: 'Targets & Incentives',
      icon: <Target className="w-4 h-4" />,
      badge: pendingDealsCount > 0 ? `${pendingDealsCount} Deals` : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      section: 'finance_slabs',
    },
    {
      id: 'receipts_slabs',
      label: 'Customer Receipts & Slabs',
      icon: <Receipt className="w-4 h-4" />,
      badge: 'Official Slips',
      badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
      section: 'finance_slabs',
    },
    {
      id: 'payroll',
      label: 'Salary & Payslips',
      icon: <CreditCard className="w-4 h-4" />,
      section: 'finance_slabs',
    },
    {
      id: 'staff',
      label: 'Staff & Team Directory',
      icon: <Users className="w-4 h-4" />,
      section: 'finance_slabs',
    },
    {
      id: 'knowledge_hub',
      label: 'CEO Knowledge Hub',
      icon: <Video className="w-4 h-4" />,
      badge: 'Videos',
      badgeColor: 'bg-[#5C3FE0]/20 text-[#5C3FE0] border border-[#5C3FE0]/30',
      section: 'leadership_gov',
    },
    {
      id: 'audit_settings',
      label: 'Access Matrix & Tenants',
      icon: <ShieldCheck className="w-4 h-4" />,
      section: 'leadership_gov',
    },
  ];

  // Filter items based on designation & role permission
  const allowedNavItems = allNavItems.filter((item) => isTabAllowed(item.id));

  const dailyOpsItems = allowedNavItems.filter((i) => i.section === 'daily_ops');
  const financeItems = allowedNavItems.filter((i) => i.section === 'finance_slabs');
  const leadershipItems = allowedNavItems.filter((i) => i.section === 'leadership_gov');

  const handleTabClick = (tabId: AppTab) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const renderNavGroup = (title: string, items: typeof allNavItems) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1 mb-4">
        <div className="text-[10px] uppercase text-gray-500 font-bold mb-2 ml-2 tracking-widest">
          {title}
        </div>
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <div
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              id={`nav-tab-${item.id}`}
              className={`flex items-center justify-between px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer rounded-xl ${
                isActive
                  ? 'bg-[#5C3FE0] text-white shadow-lg shadow-[#5C3FE0]/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={isActive ? 'text-white' : 'text-gray-400'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-white/10 text-gray-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full">
      {/* Top Brand Block */}
      <div>
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <EstusciaLogo size="sm" />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-white truncate">
                  {currentTenant.name.split(' ')[0]} EMS
                </span>
              </div>
              <span className="text-[10px] text-[#5C3FE0] font-semibold uppercase tracking-wider truncate">
                {currentTenant.plan} • {currentTenant.currency.split(' ')[0]}
              </span>
            </div>
          </div>

          {/* Close button inside mobile menu */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Navigation */}
        <nav className="p-3.5 space-y-2 overflow-y-auto max-h-[calc(100vh-210px)] custom-scrollbar">
          {renderNavGroup('Daily Operations', dailyOpsItems)}
          {renderNavGroup('Business & Compensation', financeItems)}
          {renderNavGroup('Governance & Masterclasses', leadershipItems)}
        </nav>
      </div>

      {/* User Session and Logout Box */}
      <div className="p-4 bg-[#09081E] border-t border-white/10 space-y-3">
        <div className="flex items-center gap-2.5">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-9 h-9 rounded-full object-cover border border-white/15 shrink-0"
          />
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
            <p className="text-[10px] text-gray-400 truncate">
              {currentUser.designation}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsMobileMenuOpen(false);
            logout();
          }}
          className="w-full py-1.5 px-3 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/30 text-gray-300 hover:text-rose-300 border border-white/10 text-xs font-semibold transition-all flex items-center justify-center gap-2 group cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Sign Out / Switch User</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#07051A] border-r border-white/10 flex-col shrink-0 select-none h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Out Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] bg-[#07051A] border-r border-white/15 h-full z-10 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

