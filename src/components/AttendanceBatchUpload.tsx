import React, {
  ChangeEvent,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Upload,
  XCircle,
} from 'lucide-react';

import * as XLSX from 'xlsx';

import {
  submitAttendanceBatch,
  validateAttendanceBatch,
} from '../api/attendanceBatch';

import {
  AttendanceBatchExcelRow,
  AttendanceBatchPreviewRow,
} from '../types/attendanceBatch';

import { useApp } from '../context/AppContext';

// ============================================================
// HELPERS
// ============================================================

const normalizeHeader = (value: unknown): string => {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
};

const normalizeTime = (
  value: unknown,
): string | null => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const text = String(value).trim();

  if (!text) return null;

  // HH:mm
  if (/^\d{1,2}:\d{2}$/.test(text)) {
    const [hour, minute] = text.split(':');

    return `${hour.padStart(2, '0')}:${minute}`;
  }

  // HH:mm:ss
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(text)) {
    return text.slice(0, 5);
  }

  return text;
};

const normalizeDate = (
  value: unknown,
): string | null => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  if (value instanceof Date) {
    const year = value.getFullYear();

    const month = String(
      value.getMonth() + 1,
    ).padStart(2, '0');

    const day = String(
      value.getDate(),
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  const text = String(value).trim();

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  // DD/MM/YYYY
  const slashMatch =
    text.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    );

  if (slashMatch) {
    const [, day, month, year] =
      slashMatch;

    return `${year}-${month.padStart(
      2,
      '0',
    )}-${day.padStart(2, '0')}`;
  }

  // DD-MM-YYYY
  const dashMatch =
    text.match(
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    );

  if (dashMatch) {
    const [, day, month, year] =
      dashMatch;

    return `${year}-${month.padStart(
      2,
      '0',
    )}-${day.padStart(2, '0')}`;
  }

  return null;
};

const getCellValue = (
  row: Record<string, unknown>,
  name: string,
): unknown => {
  const target = normalizeHeader(name);

  const key = Object.keys(row).find(
    key =>
      normalizeHeader(key) === target,
  );

  return key !== undefined
    ? row[key]
    : undefined;
};

// ============================================================
// COMPONENT
// ============================================================

const AttendanceBatchUpload: React.FC = () => {
  const { currentUser } = useApp();

  const [fileName, setFileName] =
    useState<string | null>(null);

  const [rows, setRows] =
    useState<AttendanceBatchPreviewRow[]>(
      [],
    );

  const [rawRows, setRawRows] =
    useState<AttendanceBatchExcelRow[]>(
      [],
    );

  const [loading, setLoading] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [submitResult, setSubmitResult] =
    useState<{
      insertedCount: number;
      skippedCount: number;
    } | null>(null);

  const validRows = useMemo(
    () =>
      rows.filter(
        row => row.isValid,
      ),
    [rows],
  );

  const invalidRows = useMemo(
    () =>
      rows.filter(
        row => !row.isValid,
      ),
    [rows],
  );

  // ==========================================================
  // FILE PROCESSING
  // ==========================================================

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setError(null);
    setSubmitResult(null);
    setRows([]);
    setRawRows([]);
    setFileName(file.name);
    setLoading(true);

    try {
      const buffer =
        await file.arrayBuffer();

      const workbook =
        XLSX.read(buffer, {
          type: 'array',
          cellDates: true,
        });

      const firstSheetName =
        workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error(
          'Excel file does not contain a worksheet.',
        );
      }

      const worksheet =
        workbook.Sheets[
          firstSheetName
        ];

      const json =
        XLSX.utils.sheet_to_json<
          Record<string, unknown>
        >(worksheet, {
          defval: '',
        });

      if (json.length === 0) {
        throw new Error(
          'The selected Excel file contains no attendance rows.',
        );
      }

      const firstRow = json[0];

      const headers =
        Object.keys(firstRow).map(
          normalizeHeader,
        );

      if (
        !headers.includes(
          'employeecode',
        )
      ) {
        throw new Error(
          'EmployeeCode column is missing.',
        );
      }

      if (
        !headers.includes('date')
      ) {
        throw new Error(
          'Date column is missing.',
        );
      }

      const parsedRows =
        json.map(
          (
            row,
          ): AttendanceBatchExcelRow => ({
            employeeCode: String(
              getCellValue(
                row,
                'EmployeeCode',
              ) ?? '',
            ).trim(),

            date:
              normalizeDate(
                getCellValue(
                  row,
                  'Date',
                ),
              ) ?? '',

            checkInTime:
              normalizeTime(
                getCellValue(
                  row,
                  'CheckInTime',
                ),
              ),

            checkOutTime:
              normalizeTime(
                getCellValue(
                  row,
                  'CheckOutTime',
                ),
              ),

            biometricDeviceId:
              String(
                getCellValue(
                  row,
                  'BiometricDeviceId',
                ) ?? '',
              ).trim() || null,
          }),
        );

      setRawRows(parsedRows);

      // ======================================================
      // SEND ONLY PARSED DATA TO BACKEND
      //
      // Excel file itself is NEVER uploaded.
      // ======================================================

      const validation =
        await validateAttendanceBatch(
          parsedRows,
        );

      setRows(
        validation.rows,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to read attendance Excel file.',
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async () => {
    if (
      rawRows.length === 0 ||
      validRows.length === 0
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Submit ${validRows.length} valid attendance record(s)?`,
      );

    if (!confirmed) return;

    try {
      setSubmitting(true);
      setError(null);

      // Only valid rows are submitted.
      const validRawRows =
        validRows.map(
          row => ({
            employeeCode:
              row.employeeCode,

            date:
              row.date,

            checkInTime:
              row.checkInTime,

            checkOutTime:
              row.checkOutTime,

            biometricDeviceId:
              row.biometricDeviceId,
          }),
        );

      const result =
        await submitAttendanceBatch(
          validRawRows,
        );

      setSubmitResult({
        insertedCount:
          result.insertedCount,

        skippedCount:
          result.skippedCount,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to submit attendance batch.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // RESET
  // ==========================================================

  const handleReset = () => {
    setFileName(null);
    setRows([]);
    setRawRows([]);
    setError(null);
    setSubmitResult(null);
  };

  // ==========================================================
  // ROLE
  // ==========================================================

  const role =
    currentUser?.roleName
      ?.trim()
      .toLowerCase();

  const canUpload =
    role === 'company_admin' ||
    role === 'hr_ops' ||
    role === 'branch_manager';

  if (!canUpload) {
    return (
      <div className="p-8 rounded-2xl bg-[#09071e] border border-[#2d2770]/80 text-center">
        <XCircle className="w-8 h-8 mx-auto text-rose-400 mb-3" />

        <h3 className="text-sm font-bold text-white">
          Access Restricted
        </h3>

        <p className="text-xs text-slate-400 mt-1">
          You do not have permission to upload
          attendance batches.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/80">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div className="flex items-start gap-3">

            <div className="p-2.5 rounded-xl bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                Attendance Batch Upload
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Select an Excel file, verify the
                attendance records, then submit them
                to the system.
              </p>
            </div>

          </div>

          {fileName && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-xl bg-[#140f3d] border border-[#2d2770] text-xs text-slate-300 hover:text-white flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Start Over
            </button>
          )}

        </div>

        {/* ==================================================
            FORMAT INFORMATION
            ================================================== */}

        <div className="mt-5 p-4 rounded-xl bg-[#0d0a29] border border-[#2d2770]/60">

          <p className="text-xs font-bold text-white">
            Expected Excel columns
          </p>

          <div className="flex flex-wrap gap-2 mt-3">

            {[
              'EmployeeCode',
              'Date',
              'CheckInTime',
              'CheckOutTime',
              'BiometricDeviceId',
            ].map(column => (
              <span
                key={column}
                className="px-2.5 py-1 rounded-lg bg-[#17113e] border border-[#30286f] text-[10px] text-slate-300"
              >
                {column}
              </span>
            ))}

          </div>

          <p className="text-[10px] text-slate-500 mt-3">
            Worked hours, overtime, late/early status
            and attendance status are calculated by
            the backend and cannot be supplied by Excel.
          </p>

        </div>

        {/* ==================================================
            FILE PICKER
            ================================================== */}

        <label className="mt-5 flex flex-col items-center justify-center min-h-[170px] rounded-2xl border border-dashed border-[#4a3fa0] bg-[#0d0a29] hover:bg-[#110d35] cursor-pointer transition-colors">

          <Upload className="w-8 h-8 text-[#A78BFA] mb-3" />

          <span className="text-sm font-semibold text-white">
            {fileName
              ? fileName
              : 'Select attendance Excel file'}
          </span>

          <span className="text-[11px] text-slate-500 mt-1">
            .xlsx, .xls or .csv
          </span>

          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={
              handleFileChange
            }
            disabled={loading}
          />

        </label>

      </div>

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading && (
        <div className="p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/80 flex items-center justify-center gap-3">

          <Loader2 className="w-5 h-5 text-[#A78BFA] animate-spin" />

          <span className="text-xs text-slate-300">
            Reading Excel and validating attendance...
          </span>

        </div>
      )}

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">

          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

          <span>{error}</span>

        </div>
      )}

      {/* ======================================================
          RESULT
      ====================================================== */}

      {submitResult && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">

          <div className="flex items-center gap-2 font-bold">

            <CheckCircle2 className="w-4 h-4" />

            Attendance batch processed successfully.
          </div>

          <div className="mt-2 text-slate-300">
            Inserted:{' '}
            <span className="font-bold text-white">
              {submitResult.insertedCount}
            </span>

            {' · '}

            Skipped:{' '}
            <span className="font-bold text-white">
              {submitResult.skippedCount}
            </span>
          </div>

        </div>
      )}

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      {rows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          <SummaryCard
            label="Total Rows"
            value={rows.length}
          />

          <SummaryCard
            label="Valid"
            value={validRows.length}
            positive
          />

          <SummaryCard
            label="Invalid"
            value={invalidRows.length}
            negative
          />

          <SummaryCard
            label="Ready to Submit"
            value={validRows.length}
          />

        </div>
      )}

      {/* ======================================================
          PREVIEW TABLE
      ====================================================== */}

      {rows.length > 0 && (
        <div className="rounded-2xl bg-[#09071e] border border-[#2d2770]/80 overflow-hidden">

          <div className="p-5 border-b border-[#2d2770]/60 flex items-center justify-between">

            <div>
              <h3 className="text-sm font-bold text-white">
                Attendance Verification
              </h3>

              <p className="text-[11px] text-slate-500 mt-1">
                Review the calculated values before
                inserting them into attendance records.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                submitting ||
                validRows.length === 0
              }
              className="px-4 py-2 rounded-xl bg-[#5C3FE0] hover:bg-[#6b4ff0] text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}

              Submit Valid Rows
            </button>

          </div>

          <div className="overflow-x-auto">

            <table className="min-w-[1500px] w-full text-xs">

              <thead className="bg-[#0e0b2e]">

                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">

                  <th className="px-4 py-3">
                    #
                  </th>

                  <th className="px-4 py-3">
                    Employee
                  </th>

                  <th className="px-4 py-3">
                    Branch
                  </th>

                  <th className="px-4 py-3">
                    Date
                  </th>

                  <th className="px-4 py-3">
                    Check In
                  </th>

                  <th className="px-4 py-3">
                    Check Out
                  </th>

                  <th className="px-4 py-3">
                    Required
                  </th>

                  <th className="px-4 py-3">
                    Worked
                  </th>

                  <th className="px-4 py-3">
                    Balance
                  </th>

                  <th className="px-4 py-3">
                    Late
                  </th>

                  <th className="px-4 py-3">
                    Early
                  </th>

                  <th className="px-4 py-3">
                    Status
                  </th>

                  <th className="px-4 py-3">
                    Validation
                  </th>

                </tr>

              </thead>

              <tbody>

                {rows.map(row => (

                  <tr
                    key={`${row.rowNumber}-${row.employeeCode}-${row.date}`}
                    className={`border-t border-[#1f1a4b] ${
                      row.isValid
                        ? ''
                        : 'bg-rose-500/5'
                    }`}
                  >

                    <td className="px-4 py-3 text-slate-500">
                      {row.rowNumber}
                    </td>

                    <td className="px-4 py-3">

                      <div className="font-semibold text-white">
                        {row.userName ??
                          'Unknown employee'}
                      </div>

                      <div className="text-[10px] text-slate-500">
                        {row.employeeCode}
                      </div>

                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {row.branchName ??
                        '—'}
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {row.date}
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {row.checkInTime ??
                        '—'}
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {row.checkOutTime ??
                        '—'}
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {row.requiredHours ??
                        '—'}
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {row.workedHours.toFixed(
                        2,
                      )}
                    </td>

                    <td
                      className={`px-4 py-3 ${
                        row.workingHoursBalance <
                        0
                          ? 'text-rose-300'
                          : 'text-emerald-300'
                      }`}
                    >
                      {row.workingHoursBalance.toFixed(
                        2,
                      )}
                    </td>

                    <td className="px-4 py-3">

                      {row.isLate ? (
                        <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-300">
                          Late
                        </span>
                      ) : (
                        <span className="text-slate-600">
                          No
                        </span>
                      )}

                    </td>

                    <td className="px-4 py-3">

                      {row.isEarlyLeaving ? (
                        <span className="px-2 py-1 rounded-lg bg-orange-500/10 text-orange-300">
                          Early
                        </span>
                      ) : (
                        <span className="text-slate-600">
                          No
                        </span>
                      )}

                    </td>

                    <td className="px-4 py-3">

                      {row.status && (
                        <span
                          className={`px-2 py-1 rounded-lg ${
                            row.status ===
                            'Present'
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : row.status ===
                                'Late'
                                ? 'bg-amber-500/10 text-amber-300'
                                : row.status ===
                                  'HalfDay'
                                  ? 'bg-orange-500/10 text-orange-300'
                                  : 'bg-slate-500/10 text-slate-300'
                          }`}
                        >
                          {row.status}
                        </span>
                      )}

                    </td>

                    <td className="px-4 py-3">

                      {row.isValid ? (
                        <div className="flex items-center gap-1.5 text-emerald-300">

                          <CheckCircle2 className="w-3.5 h-3.5" />

                          Valid

                        </div>
                      ) : (
                        <div className="space-y-1">

                          <div className="flex items-center gap-1.5 text-rose-300">

                            <XCircle className="w-3.5 h-3.5" />

                            Invalid

                          </div>

                          {row.errors.map(
                            (
                              message,
                              index,
                            ) => (
                              <div
                                key={index}
                                className="text-[10px] text-rose-400"
                              >
                                {message}
                              </div>
                            ),
                          )}

                        </div>
                      )}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>
      )}

    </div>
  );
};

// ============================================================
// SUMMARY CARD
// ============================================================

interface SummaryCardProps {
  label: string;
  value: number;
  positive?: boolean;
  negative?: boolean;
}

const SummaryCard: React.FC<
  SummaryCardProps
> = ({
  label,
  value,
  positive,
  negative,
}) => (
  <div className="p-4 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">

    <p className="text-[10px] uppercase tracking-wider text-slate-500">
      {label}
    </p>

    <p
      className={`text-xl font-bold mt-1 ${
        positive
          ? 'text-emerald-300'
          : negative
            ? 'text-rose-300'
            : 'text-white'
      }`}
    >
      {value}
    </p>

  </div>
);

export default AttendanceBatchUpload;