import React, { useState, useEffect } from 'react';
import { Search, X, TrendingUp, Users, GraduationCap, CreditCard, ChevronRight, FileText } from 'lucide-react';
import { useApp, AppTab } from '../context/AppContext';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    setActiveTab,
    users,
    activeSlabVersion,
    courses,
    payslips,
    setSelectedCourseForPlayer,
    setSelectedPayslipForView,
  } = useApp();

  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.employeeCode.toLowerCase().includes(query.toLowerCase()) ||
      u.department.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTiers = activeSlabVersion.tiers.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectTab = (tab: AppTab) => {
    setActiveTab(tab);
    setIsSearchOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#0d0b26] border border-[#2d2770] rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Header Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#231e54]">
          <Search className="w-5 h-5 text-[#A78BFA] mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search employees, slab tiers, courses, payslips..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none"
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 rounded-lg hover:bg-[#1c1652] text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results Area */}
        <div className="p-3 max-h-96 overflow-y-auto space-y-4 divide-y divide-[#231e54]/50">
          {/* Quick Modules */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
              Quick Navigation
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { label: 'Investment Slabs', tab: 'slabs' as AppTab, icon: <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> },
                { label: 'Staff Directory', tab: 'staff' as AppTab, icon: <Users className="w-3.5 h-3.5 text-cyan-400" /> },
                { label: 'LMS Academy', tab: 'lms_academy' as AppTab, icon: <GraduationCap className="w-3.5 h-3.5 text-purple-400" /> },
                { label: 'Salary Ledger', tab: 'payroll' as AppTab, icon: <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> },
              ].map((item) => (
                <button
                  key={item.tab}
                  onClick={() => handleSelectTab(item.tab)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-[#14103a] hover:bg-[#1e1757] border border-[#2d2770]/60 text-xs text-slate-200 text-left transition-colors"
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Slabs Tiers */}
          {filteredTiers.length > 0 && (
            <div className="pt-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center justify-between">
                <span>Active Investment Tiers ({activeSlabVersion.versionCode})</span>
                <span className="text-[10px] text-[#A78BFA]">Slabs Engine</span>
              </div>
              <div className="space-y-1">
                {filteredTiers.slice(0, 3).map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => handleSelectTab('slabs')}
                    className="w-full p-2 rounded-lg hover:bg-[#161240] text-left flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{tier.name}</div>
                      <div className="text-[11px] text-slate-400">
                        Yield: <span className="text-emerald-400 font-semibold">{tier.expectedAnnualYieldPercent}%</span> • Commission: <span className="text-purple-300">{tier.staffCommissionPercent}%</span> • Min: ${tier.minAmount.toLocaleString()}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Staff Directory Matches */}
          {filteredUsers.length > 0 && (
            <div className="pt-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                Staff Members
              </div>
              <div className="space-y-1">
                {filteredUsers.slice(0, 3).map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectTab('staff')}
                    className="w-full p-2 rounded-lg hover:bg-[#161240] text-left flex items-center gap-3 transition-colors"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-[#5C3FE0]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>{user.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">[{user.employeeCode}]</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {user.designation} • {user.department}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LMS Courses Matches */}
          {filteredCourses.length > 0 && (
            <div className="pt-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                LMS Courses & Training Paths
              </div>
              <div className="space-y-1">
                {filteredCourses.slice(0, 2).map((course) => (
                  <button
                    key={course.id}
                    onClick={() => {
                      setSelectedCourseForPlayer(course);
                      handleSelectTab('lms_academy');
                    }}
                    className="w-full p-2 rounded-lg hover:bg-[#161240] text-left flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <GraduationCap className="w-4 h-4 text-[#A78BFA] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{course.title}</div>
                        <div className="text-[11px] text-slate-400">{course.category} • {course.totalDuration}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#08061a] border-t border-[#231e54] text-[11px] text-slate-400 flex items-center justify-between">
          <span>Navigate with ⌘K or ESC to close</span>
          <span className="text-[#A78BFA]">Estuscia Sovereign Platform</span>
        </div>
      </div>
    </div>
  );
};
