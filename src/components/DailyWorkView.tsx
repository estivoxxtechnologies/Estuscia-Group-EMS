import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DailyWorkLog } from '../types';
import {
  PhoneCall,
  UserCheck,
  Calendar,
  DollarSign,
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  Download,
  Code2,
  GitPullRequest,
  Check,
  Send,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

export const DailyWorkView: React.FC = () => {
  const {
    dailyWorkLogs,
    setIsWorkLogModalOpen,
    currentUser,
    reviewDailyWorkLog,
  } = useApp();

  const isManagement = currentUser.role === 'super_admin' || currentUser.role === 'company_admin' || currentUser.role === 'manager' || currentUser.role === 'hr_ops';
  const isDeveloper = currentUser.role === 'developer';

  const [activeFilter, setActiveFilter] = useState<'all' | 'sales' | 'developer' | 'operations'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Manager Feedback State
  const [feedbackLogId, setFeedbackLogId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  // Filter logs
  const filteredLogs = dailyWorkLogs.filter((log) => {
    // If not management, staff/dev can view all team logs or only their own? Let's show team logs with their own highlighted
    if (activeFilter !== 'all' && log.workType !== activeFilter) return false;
    if (selectedDate && log.date !== selectedDate) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = log.userName.toLowerCase().includes(q);
      const matchDesignation = log.designation.toLowerCase().includes(q);
      const matchNarration = log.narration.toLowerCase().includes(q);
      const matchFeatures = log.featuresShipped?.toLowerCase().includes(q);
      return matchName || matchDesignation || matchNarration || matchFeatures;
    }
    return true;
  });

  // Calculate aggregates
  const totalCalls = dailyWorkLogs.reduce((acc, log) => acc + (log.callsMade || 0), 0);
  const totalHotLeads = dailyWorkLogs.reduce((acc, log) => acc + (log.leadsRespondedWell || 0), 0);
  const totalClosedDeals = dailyWorkLogs.reduce((acc, log) => acc + (log.closingInvestmentAmount || 0), 0);
  const totalDevHours = dailyWorkLogs.reduce((acc, log) => acc + (log.hoursSpent || 0), 0);

  const handleFeedbackSubmit = (logId: string) => {
    if (!feedbackText.trim()) return;
    reviewDailyWorkLog(logId, feedbackText, 'Reviewed');
    setFeedbackLogId(null);
    setFeedbackText('');
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Employee', 'Designation', 'Department', 'Type', 'Calls Made', 'Responded Well', 'Closed Amount', 'Narration', 'Status'];
    const rows = filteredLogs.map((l) => [
      l.date,
      `"${l.userName}"`,
      `"${l.designation}"`,
      `"${l.department}"`,
      l.workType,
      l.callsMade || 0,
      l.leadsRespondedWell || 0,
      l.closingInvestmentAmount || 0,
      `"${l.narration.replace(/"/g, '""')}"`,
      l.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Estuscia_Daily_Work_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Daily Work, Call Logs & Activity Submissions
            </h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#5C3FE0]/20 text-[#5C3FE0] border border-[#5C3FE0]/30 font-semibold">
              EMS Operations
            </span>
          </div>
          <p className="text-xs text-gray-400">
            {isManagement
              ? 'Review daily staff call logs, customer lead follow-ups, developer narrations, and provide managerial feedback.'
              : 'Submit your daily work narrations, calls completed, customer responses, and closing investments.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold transition-all flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsWorkLogModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#5C3FE0] to-[#7C3AED] hover:from-[#6A4DF4] hover:to-[#8B5CF6] text-white text-xs font-bold shadow-lg shadow-[#5C3FE0]/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Submit Daily Work Report</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-400">Total Calls Logged</p>
            <h3 className="text-2xl font-bold text-white mt-1">{totalCalls}</h3>
            <span className="text-[10px] text-purple-400 font-medium">Outreach volume today</span>
          </div>
          <div className="p-3 rounded-xl bg-[#5C3FE0]/15 text-[#5C3FE0] border border-[#5C3FE0]/20">
            <PhoneCall className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-400">Responded Well (Hot Leads)</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{totalHotLeads}</h3>
            <span className="text-[10px] text-emerald-500 font-medium">High conversion interest</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-400">Closing Deals Reported</p>
            <h3 className="text-2xl font-bold text-white mt-1">${(totalClosedDeals / 1000).toFixed(0)}k</h3>
            <span className="text-[10px] text-cyan-400 font-medium">Active investment pipeline</span>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-400">Developer Hours & Deliverables</p>
            <h3 className="text-2xl font-bold text-blue-400 mt-1">{totalDevHours} hrs</h3>
            <span className="text-[10px] text-blue-300 font-medium">Engineering sprint items</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20">
            <Code2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#09081E] border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Work Type Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 overflow-x-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === 'all'
                  ? 'bg-[#5C3FE0] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Reports ({dailyWorkLogs.length})
            </button>
            <button
              onClick={() => setActiveFilter('sales')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === 'sales'
                  ? 'bg-[#5C3FE0] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sales & Calls
            </button>
            <button
              onClick={() => setActiveFilter('developer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === 'developer'
                  ? 'bg-[#5C3FE0] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Developer Narrations
            </button>
            <button
              onClick={() => setActiveFilter('operations')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === 'operations'
                  ? 'bg-[#5C3FE0] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Operations & Support
            </button>
          </div>

          {/* Search & Date input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff, code, narration..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#5C3FE0]"
              />
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-[11px] text-[#5C3FE0] hover:underline px-1"
              >
                Clear
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Submissions Feed List */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#09081E] border border-white/10 text-center space-y-3">
            <FileText className="w-10 h-10 text-gray-500 mx-auto" />
            <h4 className="text-sm font-semibold text-white">No Work Reports Found</h4>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              No daily reports match the selected criteria. Staff can click "+ Submit Daily Work Report" to log today's accomplishments.
            </p>
            <button
              onClick={() => setIsWorkLogModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#5C3FE0] text-white text-xs font-bold shadow-lg"
            >
              + Submit Report Now
            </button>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isSalesLog = log.workType === 'sales';
            const isDevLog = log.workType === 'developer';

            return (
              <div
                key={log.id}
                className={`p-5 rounded-2xl bg-[#09081E] border transition-all ${
                  log.userId === currentUser.id
                    ? 'border-[#5C3FE0]/40 bg-[#0c092a]'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Log Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <img
                      src={log.userAvatar}
                      alt={log.userName}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{log.userName}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10 font-mono">
                          {log.employeeCode}
                        </span>
                        {log.userId === currentUser.id && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#5C3FE0]/20 text-purple-300 font-semibold border border-[#5C3FE0]/30">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {log.designation} • <span className="text-gray-300">{log.department}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs">
                      <div className="flex items-center gap-1.5 text-gray-300 font-medium justify-end">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{log.date}</span>
                      </div>
                      <span className="text-[11px] text-gray-500">Submitted at {log.submittedAt.split(' ')[1] || '18:30'}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        log.status === 'Reviewed' || log.status === 'Acknowledged'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>

                {/* Log Metrics Body */}
                <div className="py-3.5 space-y-3">
                  {/* Sales Metrics Chips */}
                  {isSalesLog && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-[10px] text-gray-400 block">Calls Made</span>
                        <span className="text-base font-bold text-white">{log.callsMade}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-[10px] text-gray-400 block">Connected</span>
                        <span className="text-base font-bold text-purple-300">{log.callsConnected}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[10px] text-emerald-400 block">Responded Well</span>
                        <span className="text-base font-bold text-emerald-400">{log.leadsRespondedWell} Hot</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-[10px] text-gray-400 block">Follow-ups</span>
                        <span className="text-base font-bold text-cyan-300">{log.followUpsScheduled}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-[10px] text-gray-400 block">Deals Pitched</span>
                        <span className="text-base font-bold text-white">{log.dealsPitched}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#5C3FE0]/15 border border-[#5C3FE0]/30">
                        <span className="text-[10px] text-purple-300 block">Closing Value</span>
                        <span className="text-base font-bold text-white">
                          ${(log.closingInvestmentAmount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Developer Metrics Chips */}
                  {isDevLog && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {log.featuresShipped && (
                        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 sm:col-span-2">
                          <span className="text-[10px] text-blue-300 block font-semibold">Features Shipped</span>
                          <span className="text-xs text-white font-medium">{log.featuresShipped}</span>
                        </div>
                      )}
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-[10px] text-gray-400 block">Hours Logged</span>
                        <span className="text-base font-bold text-blue-300">{log.hoursSpent || 8} hrs</span>
                      </div>
                      {log.pullRequests && (
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 sm:col-span-3 flex items-center gap-2">
                          <GitPullRequest className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-[11px] text-gray-400 font-mono">{log.pullRequests}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detailed Narration Box */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <p className="text-[11px] font-semibold text-gray-400">
                      {isDevLog ? 'Developer Daily Work Narration:' : 'Detailed Call & Activity Remarks:'}
                    </p>
                    <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-line font-sans">
                      {log.narration}
                    </p>
                    {log.blockers && (
                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2 text-xs text-amber-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Blocker: {log.blockers}</span>
                      </div>
                    )}
                  </div>

                  {/* Manager Feedback Section */}
                  {log.managerFeedback ? (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-semibold text-emerald-300">Manager Review: </span>
                        <span className="text-gray-200">{log.managerFeedback}</span>
                      </div>
                    </div>
                  ) : null}

                  {/* Manager Action Trigger */}
                  {isManagement && !log.managerFeedback && (
                    <div className="pt-2">
                      {feedbackLogId === log.id ? (
                        <div className="space-y-2 p-3 rounded-xl bg-black/60 border border-[#5C3FE0]/40">
                          <label className="block text-[11px] font-semibold text-purple-300">
                            Provide Feedback & Acknowledge Report
                          </label>
                          <textarea
                            rows={2}
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="e.g. Great outreach volume! Follow up with Mr. Al-Nuaimi on the Tier 3 sovereign slab."
                            className="w-full px-3 py-2 rounded-lg bg-black/80 border border-white/15 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setFeedbackLogId(null)}
                              className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleFeedbackSubmit(log.id)}
                              className="px-4 py-1.5 rounded-lg bg-[#5C3FE0] text-white text-xs font-bold shadow flex items-center gap-1.5"
                            >
                              <Send className="w-3 h-3" />
                              <span>Submit Review</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs pt-1">
                          <button
                            onClick={() => {
                              reviewDailyWorkLog(log.id, 'Report acknowledged and reviewed by leadership.', 'Acknowledged');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-semibold transition-all flex items-center gap-1.5 text-[11px]"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Quick Acknowledge</span>
                          </button>
                          <button
                            onClick={() => {
                              setFeedbackLogId(log.id);
                              setFeedbackText('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#5C3FE0]/20 hover:bg-[#5C3FE0]/30 text-[#5C3FE0] border border-[#5C3FE0]/40 font-semibold transition-all flex items-center gap-1.5 text-[11px]"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Add Management Feedback</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
