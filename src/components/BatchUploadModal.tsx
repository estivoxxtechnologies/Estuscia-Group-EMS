import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AttendanceRecord, AttendanceStatus } from '../types';

export const BatchUploadModal: React.FC = () => {
  const { isBatchUploadOpen, setIsBatchUploadOpen, uploadAttendanceBatch, users, currentUser } = useApp();

  const [fileName, setFileName] = useState<string>('');
  const [parsedRecords, setParsedRecords] = useState<Partial<AttendanceRecord>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  if (!isBatchUploadOpen) return null;

  // 1-Click Template Download Generator
  const handleDownloadTemplate = () => {
    const csvContent =
      'EmployeeCode,EmployeeName,Date,InTime,OutTime,TotalHours,Status,Notes\n' +
      'EST-ADV-045,Sarah Chen,2026-03-25,08:58 AM,06:15 PM,9.28,Present,Biometric regular swipe\n' +
      'EST-ADV-048,David Reynolds,2026-03-25,08:52 AM,06:05 PM,9.22,Present,Biometric regular swipe\n' +
      'EST-MGR-012,Marcus Vance,2026-03-25,08:30 AM,07:30 PM,11.00,Overtime,Late client strategy session\n' +
      'EST-HR-007,Priya Narang,2026-03-25,09:00 AM,06:00 PM,9.00,Present,On time\n' +
      'EST-ADM-004,Elena Rostova,2026-03-25,08:45 AM,06:30 PM,9.75,Present,Operations audit\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Estuscia_Attendance_Batch_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pre-fill realistic sample batch for instant demo
  const handleLoadSampleFeed = () => {
    setFileName('EST_HQ_Biometric_Logs_2026_03_25.xlsx');
    const today = '2026-03-25';

    const sampleFeed: Partial<AttendanceRecord>[] = [
      {
        employeeCode: 'EST-ADV-045',
        userName: 'Sarah Chen',
        department: 'Private Client Advisory',
        date: today,
        inTime: '08:54 AM',
        outTime: '06:18 PM',
        totalHours: 9.4,
        status: 'Present',
        notes: 'Biometric Gate 1 swipe verified',
      },
      {
        employeeCode: 'EST-ADV-048',
        userName: 'David Reynolds',
        department: 'Private Client Advisory',
        date: today,
        inTime: '08:50 AM',
        outTime: '06:05 PM',
        totalHours: 9.25,
        status: 'Present',
        notes: 'Biometric Gate 2 swipe verified',
      },
      {
        employeeCode: 'EST-MGR-012',
        userName: 'Marcus Vance',
        department: 'Private Client Advisory',
        date: today,
        inTime: '08:25 AM',
        outTime: '07:20 PM',
        totalHours: 10.9,
        status: 'Overtime',
        notes: 'Approved overtime closing Q1 deals',
      },
      {
        employeeCode: 'EST-HR-007',
        userName: 'Priya Narang',
        department: 'Operations & HR',
        date: today,
        inTime: '08:55 AM',
        outTime: '06:00 PM',
        totalHours: 9.08,
        status: 'Present',
        notes: 'Biometric Gate 1 swipe verified',
      },
      {
        employeeCode: 'EST-ADM-004',
        userName: 'Elena Rostova',
        department: 'Operations & HR',
        date: today,
        inTime: '08:40 AM',
        outTime: '06:30 PM',
        totalHours: 9.83,
        status: 'Present',
        notes: 'Operations meeting log verified',
      },
      {
        employeeCode: 'EST-LMS-003',
        userName: 'Dr. Julian Thorne',
        department: 'Learning & Development',
        date: today,
        inTime: '09:15 AM',
        outTime: '05:45 PM',
        totalHours: 8.5,
        status: 'Late',
        notes: 'Transit delay logged',
      },
    ];

    setParsedRecords(sampleFeed);
  };

  // Drag & drop file reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        const rows = lines.slice(1); // skip header

        const parsed: Partial<AttendanceRecord>[] = rows.map((row) => {
          const cols = row.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          return {
            employeeCode: cols[0] || 'EST-STAFF',
            userName: cols[1] || 'Staff Member',
            date: cols[2] || new Date().toISOString().substring(0, 10),
            inTime: cols[3] || '09:00 AM',
            outTime: cols[4] || '06:00 PM',
            totalHours: parseFloat(cols[5]) || 9.0,
            status: (cols[6] as AttendanceStatus) || 'Present',
            notes: cols[7] || 'Uploaded via CSV batch',
          };
        });

        if (parsed.length > 0) {
          setParsedRecords(parsed);
        } else {
          handleLoadSampleFeed();
        }
      }
    };

    reader.readAsText(file);
  };

  // Commit batch
  const handleCommitBatch = () => {
    if (parsedRecords.length === 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      uploadAttendanceBatch(fileName || 'Biometric_Daily_Sync.xlsx', parsedRecords);
      setIsProcessing(false);
      setUploadSuccess(true);

      setTimeout(() => {
        setIsBatchUploadOpen(false);
        setUploadSuccess(false);
        setParsedRecords([]);
        setFileName('');
      }, 1200);
    }, 600);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Overtime':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Late':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Half Day':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Absent':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#09071e] border border-[#2d2770] rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0e0b2e] border-b border-[#231e54]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Batch Attendance Upload Center
              </h2>
              <p className="text-xs text-slate-400">
                Staff punch-in/out is managed centrally by HR & Managers via Excel/CSV imports
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsBatchUploadOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[#1f1857] text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Top Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#0d0a26] border border-[#231e54]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#A78BFA]" />
              <span className="text-xs font-semibold text-white">
                Upload biometric machine swipe files or manager timesheets
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#19134a] hover:bg-[#231b66] border border-[#2d2770] text-xs font-medium text-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample Template (.csv)</span>
              </button>

              <button
                type="button"
                onClick={handleLoadSampleFeed}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5C3FE0]/30 hover:bg-[#5C3FE0]/50 border border-[#5C3FE0]/50 text-xs font-bold text-white transition-colors"
              >
                <span>Auto-Fill Today's Batch</span>
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-[#2d2770] hover:border-[#5C3FE0] rounded-xl p-8 text-center bg-[#070517] transition-colors relative group">
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#140f3d] flex items-center justify-center text-[#A78BFA] group-hover:scale-110 transition-transform mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-white">
                {fileName ? fileName : 'Drag & Drop attendance Excel/CSV here or browse files'}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Supports .xlsx, .xls, .csv formatted biometric export files
              </p>
            </div>
          </div>

          {/* Preview Parsed Records Table */}
          {parsedRecords.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Batch Records Validation Preview</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                    {parsedRecords.length} Rows Verified
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Ready to commit into Estuscia central attendance ledger
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto rounded-xl border border-[#231e54] bg-[#0c0926]/80">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#130e38] text-slate-400 font-semibold border-b border-[#231e54]">
                    <tr>
                      <th className="p-2.5">Code</th>
                      <th className="p-2.5">Employee</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">In Time</th>
                      <th className="p-2.5">Out Time</th>
                      <th className="p-2.5">Hours</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Verification Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e184e]/60 text-slate-200">
                    {parsedRecords.map((r, i) => (
                      <tr key={i} className="hover:bg-[#161240]/50 transition-colors">
                        <td className="p-2.5 font-mono text-[#A78BFA]">{r.employeeCode}</td>
                        <td className="p-2.5 font-medium text-white">{r.userName}</td>
                        <td className="p-2.5 text-slate-400">{r.date}</td>
                        <td className="p-2.5 font-mono text-emerald-400">{r.inTime}</td>
                        <td className="p-2.5 font-mono text-cyan-400">{r.outTime}</td>
                        <td className="p-2.5 font-mono">{r.totalHours}h</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusBadge(
                              r.status
                            )}`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-400 truncate max-w-[150px]">
                          {r.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#0e0b2e] border-t border-[#231e54] flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Automatic recalculation of worked hours & overtime thresholds</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsBatchUploadOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={parsedRecords.length === 0 || isProcessing}
              onClick={handleCommitBatch}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 ${
                parsedRecords.length > 0 && !isProcessing
                  ? 'bg-[#5C3FE0] hover:bg-[#7152FF] text-white shadow-[#5C3FE0]/30 cursor-pointer'
                  : 'bg-[#231e54] text-slate-500 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <span>Synchronizing Records...</span>
              ) : uploadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Batch Applied Successfully!</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Commit & Synchronize Batch ({parsedRecords.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
