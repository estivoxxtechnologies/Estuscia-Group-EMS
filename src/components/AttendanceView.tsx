import React, { useState } from 'react';
import {
  CalendarCheck,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  Clock,
  UserCheck,
  Plus,
  Filter,
  Download,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus, LeaveRequest } from '../types';

export const AttendanceView: React.FC = () => {
  const {
    attendanceRecords,
    attendanceBatches,
    leaveRequests,
    currentUser,
    users,
    setIsBatchUploadOpen,
    submitLeaveRequest,
    reviewLeaveRequest,
    updateAttendanceRecord,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'records' | 'batches' | 'leaves'>('records');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Leave Form State
  const [leaveType, setLeaveType] = useState<'Casual' | 'Sick' | 'Earned'>('Earned');
  const [leaveStart, setLeaveStart] = useState('2026-04-10');
  const [leaveEnd, setLeaveEnd] = useState('2026-04-14');
  const [leaveReason, setLeaveReason] = useState('');

  // Filtered records
  const filteredRecords = attendanceRecords.filter((rec) => {
    if (currentUser.role === 'staff') {
      return rec.userId === currentUser.id;
    }
    const matchDept = filterDepartment === 'all' || rec.department === filterDepartment;
    const matchStatus = filterStatus === 'all' || rec.status === filterStatus;
    return matchDept && matchStatus;
  });

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) return;

    submitLeaveRequest({
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      userName: currentUser.name,
      department: currentUser.department,
      type: leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      days: 4,
      reason: leaveReason,
    });

    setIsLeaveModalOpen(false);
    setLeaveReason('');
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Overtime':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Late':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Half Day':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'On Leave':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'Absent':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">
                Attendance & Batch Timesheet Center
              </h1>
              <p className="text-xs text-slate-400">
                Staff punch logs are imported centrally via biometric Excel/CSV batches by HR & Managers
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {(currentUser.role === 'hr_ops' || currentUser.role === 'company_admin' || currentUser.role === 'manager') && (
            <button
              onClick={() => setIsBatchUploadOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#5C3FE0] hover:bg-[#7152FF] text-white text-xs font-bold shadow-lg shadow-[#5C3FE0]/30 transition-all flex items-center gap-1.5 cursor-pointer"
              id="attendance-upload-batch-btn"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Upload Attendance Batch (.xlsx)</span>
            </button>
          )}

          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#140f3d] hover:bg-[#1f175a] border border-[#2d2770] text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
            id="apply-leave-btn"
          >
            <Calendar className="w-4 h-4 text-[#A78BFA]" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Protocol Banner Highlighting Non-Punchout Architecture */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#120e3b] via-[#1a144e] to-[#0c0828] border border-[#5C3FE0]/40 flex items-start gap-3 text-xs text-slate-300">
        <div className="p-1.5 rounded-lg bg-[#5C3FE0]/30 text-[#A78BFA] shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-white block">Estuscia Centralized Attendance Architecture:</span>
          Staff members do not manually punch out. All biometric gate swipes, in/out timestamps, and overtime allocations are batch-uploaded via authenticated Excel/CSV feeds by HR Operations or Branch Managers.
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-[#231e54] pb-2 text-xs">
        <button
          onClick={() => setActiveSubTab('records')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors ${
            activeSubTab === 'records'
              ? 'bg-[#5C3FE0] text-white'
              : 'text-slate-400 hover:text-white hover:bg-[#120e38]'
          }`}
        >
          {currentUser.role === 'staff' ? 'My Timesheet Records' : 'All Employee Timesheets'} ({filteredRecords.length})
        </button>

        <button
          onClick={() => setActiveSubTab('batches')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors ${
            activeSubTab === 'batches'
              ? 'bg-[#5C3FE0] text-white'
              : 'text-slate-400 hover:text-white hover:bg-[#120e38]'
          }`}
        >
          Batch Upload History ({attendanceBatches.length})
        </button>

        <button
          onClick={() => setActiveSubTab('leaves')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors ${
            activeSubTab === 'leaves'
              ? 'bg-[#5C3FE0] text-white'
              : 'text-slate-400 hover:text-white hover:bg-[#120e38]'
          }`}
        >
          Leave Applications ({leaveRequests.length})
        </button>
      </div>

      {/* SUB-TAB 1: Records Table */}
      {activeSubTab === 'records' && (
        <div className="space-y-4">
          {/* Filter Bar (if manager or HR) */}
          {currentUser.role !== 'staff' && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#09071e] border border-[#231e54] text-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-white">Filter Timesheet:</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0e0b2e] border border-[#2d2770] text-slate-200 text-xs"
                >
                  <option value="all">All Departments</option>
                  <option value="Private Client Advisory">Private Client Advisory</option>
                  <option value="Investment & Wealth">Investment & Wealth</option>
                  <option value="Operations & HR">Operations & HR</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0e0b2e] border border-[#2d2770] text-slate-200 text-xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="Present">Present</option>
                  <option value="Overtime">Overtime</option>
                  <option value="Late">Late</option>
                  <option value="Half Day">Half Day</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#2d2770]/80 bg-[#09071e]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#120e38] text-slate-400 font-semibold border-b border-[#231e54]">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Employee Name</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">In Punch</th>
                  <th className="p-3.5">Out Punch</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Batch Source</th>
                  <th className="p-3.5">Manager Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c164a]/60 text-slate-200">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#140f3d]/60 transition-colors">
                    <td className="p-3.5 font-mono text-[#A78BFA]">{rec.employeeCode}</td>
                    <td className="p-3.5 font-bold text-white">{rec.userName}</td>
                    <td className="p-3.5 text-slate-300 font-mono">{rec.date}</td>
                    <td className="p-3.5 font-mono text-emerald-400">{rec.inTime}</td>
                    <td className="p-3.5 font-mono text-cyan-400">{rec.outTime}</td>
                    <td className="p-3.5 font-mono">{rec.totalHours} hrs</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(rec.status)}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-[11px] text-slate-400 truncate max-w-[140px]">
                      {rec.uploadedBy}
                    </td>
                    <td className="p-3.5 text-[11px] text-slate-400">
                      {rec.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Batches Upload History */}
      {activeSubTab === 'batches' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attendanceBatches.map((batch) => (
              <div
                key={batch.id}
                className="p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/80 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold text-white truncate max-w-[200px]">
                      {batch.fileName}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {batch.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54] text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Records</span>
                    <span className="font-mono text-white font-bold">{batch.totalRows} Rows</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Valid Swipes</span>
                    <span className="font-mono text-emerald-400 font-bold">{batch.validRows}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Errors</span>
                    <span className="font-mono text-slate-400">{batch.errorRows}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                  <span>Uploaded by: {batch.uploadedByName}</span>
                  <span className="font-mono">{batch.uploadedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Leave Applications */}
      {activeSubTab === 'leaves' && (
        <div className="space-y-4">
          <div className="divide-y divide-[#1e1950] rounded-2xl border border-[#2d2770]/80 bg-[#09071e] overflow-hidden">
            {leaveRequests.map((leave) => (
              <div key={leave.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{leave.userName}</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#1c1652] text-[#A78BFA] border border-[#2d2770]">
                      {leave.type} Leave ({leave.days} Days)
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                        leave.status === 'Approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : leave.status === 'Pending'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {leave.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{leave.reason}</p>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Schedule: {leave.startDate} to {leave.endDate} • Applied on {leave.appliedOn}
                  </div>
                </div>

                {/* Manager / HR Review actions */}
                {currentUser.role !== 'staff' && leave.status === 'Pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => reviewLeaveRequest(leave.id, 'Approved', 'Approved by reporting authority')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-colors"
                    >
                      Approve Leave
                    </button>
                    <button
                      onClick={() => reviewLeaveRequest(leave.id, 'Rejected', 'Rejected due to high client volume')}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#09071e] border border-[#2d2770] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 text-xs text-slate-200">
            <h2 className="text-base font-bold text-white">Apply for Leave</h2>
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white"
                >
                  <option value="Earned">Earned Leave</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Sick">Sick / Medical Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Reason for Leave *</label>
                <textarea
                  required
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Specify details for manager review..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5C3FE0] hover:bg-[#7152FF] text-white font-bold"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
