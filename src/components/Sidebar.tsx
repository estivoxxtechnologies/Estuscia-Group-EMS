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
  Building2,
  Code2,
  GitBranch,
  ClipboardCheck,
  X,
  CalendarDays,
  UserRound,
} from 'lucide-react';

import { useApp, AppTab } from '../context/AppContext';
import { getFileUrl } from '../utils/fileUrl';
import estusciaLogo from '../images/estuscia-logo.png';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isTabAllowed,
    currentUser,
    leaveRequests,
    incentiveTransactions,
    dailyWorkLogs,
    logout,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  } = useApp();

  if (!currentUser) {
    return null;
  }

  // ---------------------------------------------------------
  // CURRENT USER ROLE
  // ---------------------------------------------------------

  const normalizedRole =
    currentUser.roleName?.toLowerCase() ||
    currentUser.role?.toLowerCase() ||
    '';

  const isSuperAdmin = normalizedRole === 'super_admin';
  const isCompanyAdmin = normalizedRole === 'company_admin';
  const avatarUrl = getFileUrl(currentUser.avatarUrl);

  // Super Admin has a separate sidebar.
  const superAdminAllowedTabs: AppTab[] = [
    'dashboard',
    'tenants',
    'branch_management',
    'tenant_payment',
    'company_admin_management',
    'knowledge_hub',
  ];

  // ---------------------------------------------------------
  // BADGES / COUNTS
  // ---------------------------------------------------------

  // const pendingLeavesCount = leaveRequests.filter(
  //   (l) => l.status === 'Pending'
  // ).length;

  // const pendingDealsCount = incentiveTransactions.filter(
  //   (t) =>
  //     t.status === 'Pending_Manager' ||
  //     t.status === 'Verified_Manager'
  // ).length;

  const todayLogsCount = dailyWorkLogs.filter(
    (d) =>
      d.date === new Date().toISOString().substring(0, 10)
  ).length;

  // ---------------------------------------------------------
  // NAVIGATION SECTIONS
  // ---------------------------------------------------------

  type NavSection =
    | 'workspace'
    | 'people_finance'
    | 'company_admin';

  // ---------------------------------------------------------
  // ALL AVAILABLE NAVIGATION ITEMS
  // Commented-out items are intentionally preserved.
  // ---------------------------------------------------------

  const allNavItems: {
    id: AppTab;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeColor?: string;
    section: NavSection;
    superAdminOnly?: boolean;
  }[] = [
    // =======================================================
    // 1. WORKSPACE
    // =======================================================

    {
      id: 'dashboard',
      label: 'Portal Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      section: 'workspace',
    },

    // {
    //   id: 'daily_work',
    //   label:
    //     currentUser.roleName === 'developer'
    //       ? 'Daily Code & Tasks'
    //       : 'Daily Work & Calls',
    //   icon:
    //     currentUser.roleName === 'developer'
    //       ? <Code2 className="w-4 h-4" />
    //       : <PhoneCall className="w-4 h-4" />,
    //   badge:
    //     todayLogsCount > 0
    //       ? `${todayLogsCount} Logged`
    //       : 'Action Req',
    //   badgeColor:
    //     todayLogsCount > 0
    //       ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    //       : 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    //   section: 'workspace',
    // },

    {
      id: 'attendance',
      label: 'Biometric & Attendance',
      icon: <CalendarCheck className="w-4 h-4" />,
      // badge:
      //   pendingLeavesCount > 0
      //     ? `${pendingLeavesCount} Leaves`
      //     : undefined,
      badgeColor:
        'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      section: 'workspace',
    },

    {
      id: 'monthly_attendance',
      label: 'Monthly Attendance Verification',
      icon: <ClipboardCheck className="w-4 h-4" />,
      section: 'workspace',
    },

    {
      id: 'company_holidays',
      label: 'Holiday Management',
      icon: <CalendarDays className="w-4 h-4" />,
      section: 'workspace',
    },

    // =======================================================
    // 2. PEOPLE & FINANCE
    // =======================================================

    // {
    //   id: 'targets_incentives',
    //   label: 'Targets & Incentives',
    //   icon: <Target className="w-4 h-4" />,
    //   badge:
    //     pendingDealsCount > 0
    //       ? `${pendingDealsCount} Deals`
    //       : undefined,
    //   badgeColor:
    //     'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    //   section: 'people_finance',
    // },

    // {
    //   id: 'sales_leads',
    //   label: 'Sales Leads',
    //   icon: <Target className="w-4 h-4" />,
    //   section: 'people_finance',
    // },

    // {
    //   id: 'developer_work',
    //   label: 'Developer Work',
    //   icon: <Code2 className="w-4 h-4" />,
    //   section: 'people_finance',
    // },

    // {
    //   id: 'receipts_slabs',
    //   label: 'Customer Receipts & Slabs',
    //   icon: <Receipt className="w-4 h-4" />,
    //   badge: 'Official Slips',
    //   badgeColor:
    //     'bg-teal-500/20 text-teal-300 border border-teal-500/30',
    //   section: 'people_finance',
    // },

    {
      id: 'staff',
      label: 'Staff & Team Directory',
      icon: <Users className="w-4 h-4" />,
      section: 'people_finance',
    },

    {
      id: 'user_details',
      label: 'User Details & Documents',
      icon: <UserRound className="w-4 h-4" />,
      section: 'people_finance',
    },

    {
      id: 'payroll',
      label: 'Salary & Payslips',
      icon: <CreditCard className="w-4 h-4" />,
      section: 'people_finance',
    },

    // =======================================================
    // 3. COMPANY & ADMINISTRATION
    // =======================================================

    {
      id: 'company_details',
      label: 'Company Details',
      icon: <Building2 className="w-4 h-4" />,
      section: 'company_admin',
    },

    // {
    //   id: 'audit_settings',
    //   label: 'Access Matrix',
    //   icon: <ShieldCheck className="w-4 h-4" />,
    //   section: 'company_admin',
    // },

    {
      id: 'knowledge_hub',
      label: 'CEO Knowledge Hub',
      icon: <Video className="w-4 h-4" />,
      badge: 'Videos',
      badgeColor:
        'bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30',
      section: 'company_admin',
    },

    // =======================================================
    // SUPER ADMIN ONLY
    // =======================================================

    {
      id: 'tenants',
      label: 'Tenant Management',
      icon: <Building2 className="w-4 h-4" />,
      section: 'company_admin',
      superAdminOnly: true,
    },

    {
      id: 'branch_management',
      label: 'Branch Management',
      icon: <GitBranch className="w-4 h-4" />,
      section: 'company_admin',
      superAdminOnly: true,
    },

    {
      id: 'tenant_payment',
      label: 'Tenant Payment',
      icon: <CreditCard className="w-4 h-4" />,
      section: 'company_admin',
      superAdminOnly: true,
    },

    {
      id: 'company_admin_management',
      label: 'Company Admin Management',
      icon: <Users className="w-4 h-4" />,
      section: 'company_admin',
      superAdminOnly: true,
    },
  ];

  // ---------------------------------------------------------
  // FILTER NAVIGATION
  // ---------------------------------------------------------

  const allowedNavItems = allNavItems.filter((item) => {
    // Super Admin has a separate navigation.
    if (isSuperAdmin) {
      return superAdminAllowedTabs.includes(item.id);
    }

    // Company Details is restricted to Company Admin.
    if (item.id === 'company_details') {
      return isCompanyAdmin;
    }

    // Tenant administration is restricted to Super Admin.
    if (item.superAdminOnly) {
      return false;
    }

    // Standard role-based permissions.
    return isTabAllowed(item.id);
  });

  // ---------------------------------------------------------
  // GROUP NAVIGATION ITEMS
  // ---------------------------------------------------------

  const workspaceItems = allowedNavItems.filter(
    (item) => item.section === 'workspace'
  );

  const peopleFinanceItems = allowedNavItems.filter(
    (item) => item.section === 'people_finance'
  );

  const companyAdminItems = allowedNavItems.filter(
    (item) => item.section === 'company_admin'
  );

  // ---------------------------------------------------------
  // TAB CLICK
  // ---------------------------------------------------------

  const handleTabClick = (tabId: AppTab) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  // ---------------------------------------------------------
  // RENDER NAVIGATION GROUP
  // ---------------------------------------------------------

  const renderNavGroup = (
    title: string,
    items: typeof allNavItems
  ) => {
    if (items.length === 0) {
      return null;
    }

    return (
      <div className="mb-4 space-y-1">
        <div className="mb-2 ml-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          {title}
        </div>

        {items.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <div
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              id={`nav-tab-${item.id}`}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleTabClick(item.id);
                }
              }}
              className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#5C3FE0] text-white shadow-lg shadow-[#5C3FE0]/25'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {/* Left side */}
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={
                    isActive ? 'text-white' : 'text-gray-400'
                  }
                >
                  {item.icon}
                </span>

                <span className="truncate">{item.label}</span>
              </div>

              {/* Badge */}
              {item.badge && (
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badgeColor ||
                        'bg-white/10 text-gray-300'
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

  // ---------------------------------------------------------
  // SIDEBAR CONTENT
  // ---------------------------------------------------------

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between">
      {/* TOP SECTION */}
      <div>
        {/* BRAND */}
        <div className="flex h-[64px] items-center justify-between border-b border-white/10 bg-[#080617] px-4 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center">
            <img
              src={estusciaLogo}
              alt="Estuscia — Building a Trusted Ecosystem"
              className="block h-auto w-[210px] max-w-full object-contain object-left"
            />
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="ml-2 shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="custom-scrollbar max-h-[calc(100vh-210px)] space-y-2 overflow-y-auto p-3.5">
          {isSuperAdmin ? (
            renderNavGroup(
              'Super Admin Workspace',
              allowedNavItems
            )
          ) : (
            <>
              {renderNavGroup('Workspace', workspaceItems)}

              {renderNavGroup(
                'People & Finance',
                peopleFinanceItems
              )}

              {renderNavGroup(
                'Company & Administration',
                companyAdminItems
              )}
            </>
          )}
        </nav>
      </div>

      {/* USER SESSION */}
      <div className="space-y-3 border-t border-white/10 bg-[#09081E] p-4">
        <div className="flex items-center gap-2.5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={currentUser.username}
              className="h-9 w-9 shrink-0 rounded-full border border-white/15 object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#5C3FE0] text-xs font-bold text-white">
              {currentUser.username?.charAt(0)?.toUpperCase() ||
                'U'}
            </div>
          )}

          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="truncate text-xs font-bold text-white">
              {currentUser.username}
            </p>

            <p className="truncate text-[10px] text-gray-400">
              {currentUser.designation}
            </p>
          </div>
        </div>

        {/* LOGOUT - PRESERVED AS COMMENTED CODE */}

        {/* <button
          onClick={() => {
            setIsMobileMenuOpen(false);
            logout();
          }}
          className="w-full py-1.5 px-3 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/30 text-gray-300 hover:text-rose-300 border border-white/10 text-xs font-semibold transition-all flex items-center justify-center gap-2 group cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Sign Out / Switch User</span>
        </button> */}
      </div>
    </div>
  );

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden h-screen w-64 shrink-0 select-none flex-col border-r border-white/10 bg-[#07051A] lg:flex">
        {sidebarContent}
      </aside>

      {/* MOBILE SIDEBAR */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* BACKDROP */}
          <div
            className="fixed inset-0 animate-in fade-in bg-black/80 backdrop-blur-sm duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* DRAWER */}
          <div className="relative z-10 flex h-full w-72 max-w-[85vw] animate-in slide-in-from-left flex-col border-r border-white/15 bg-[#07051A] shadow-2xl duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
