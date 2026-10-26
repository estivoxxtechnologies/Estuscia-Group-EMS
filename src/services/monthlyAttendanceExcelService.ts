
import * as XLSX from 'xlsx-js-style';
import type {
    MonthlyAttendanceReport,
    MonthlyAttendanceReportDetails,
    MonthlyAttendanceEmployee,
} from '../api/monthlyAttendance';

const MONTHS = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
];

type ExcelValue = string | number | boolean | null;

function numberValue(value: number | null | undefined): number {
    const result = Number(value ?? 0);
    return Number.isFinite(result) ? result : 0;
}

function statusLabel(status: number | string): string {
    const value = String(status ?? '').trim().toLowerCase();
    const number = Number(status);

    if (number === 1 || value === 'draft') return 'Draft';

    if (
        number === 2 ||
        value === 'submitted' ||
        value === 'awaiting approval'
    ) {
        return 'Awaiting Approval';
    }

    if (
        number === 3 ||
        value === 'approved' ||
        value === 'approved - locked' ||
        value === 'approved · locked'
    ) {
        return 'Approved - Locked';
    }

    if (number === 4 || value === 'returned') return 'Returned';

    return String(status ?? 'Unknown');
}

function safeFilePart(value: string): string {
    return value
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80) || 'Branch';
}

function createStyledSheet(
    title: string,
    subtitle: string,
    headers: string[],
    rows: ExcelValue[][],
    widths: number[],
): XLSX.WorkSheet {
    const worksheet = XLSX.utils.aoa_to_sheet([
        [title],
        [subtitle],
        [],
        headers,
        ...rows,
    ]);

    const lastColumn = Math.max(headers.length - 1, 0);
    const lastRow = Math.max(rows.length + 3, 3);

    worksheet['!merges'] = [
        {
            s: { r: 0, c: 0 },
            e: { r: 0, c: lastColumn },
        },
        {
            s: { r: 1, c: 0 },
            e: { r: 1, c: lastColumn },
        },
    ];

    worksheet['!cols'] = widths.map((wch) => ({ wch }));

    worksheet['!rows'] = [
        { hpt: 34 },
        { hpt: 23 },
        { hpt: 8 },
        { hpt: 32 },
    ];

    worksheet['!views'] = [
        {
            state: 'frozen',
            ySplit: 4,
            topLeftCell: 'A5',
            activePane: 'bottomLeft',
        },
    ];

    if (rows.length > 0) {
        worksheet['!autofilter'] = {
            ref: XLSX.utils.encode_range({
                s: { r: 3, c: 0 },
                e: { r: lastRow, c: lastColumn },
            }),
        };
    }

    if (worksheet.A1) {
        worksheet.A1.s = {
            font: {
                bold: true,
                sz: 18,
                color: { rgb: 'FFFFFF' },
            },
            fill: {
                fgColor: { rgb: '24165C' },
            },
            alignment: {
                vertical: 'center',
            },
        };
    }

    if (worksheet.A2) {
        worksheet.A2.s = {
            font: {
                italic: true,
                sz: 10,
                color: { rgb: 'E5E0FF' },
            },
            fill: {
                fgColor: { rgb: '332477' },
            },
            alignment: {
                vertical: 'center',
                wrapText: true,
            },
        };
    }

    for (let column = 0; column < headers.length; column += 1) {
        const address = XLSX.utils.encode_cell({
            r: 3,
            c: column,
        });

        const cell = worksheet[address];

        if (cell) {
            cell.s = {
                font: {
                    bold: true,
                    sz: 10,
                    color: { rgb: 'FFFFFF' },
                },
                fill: {
                    fgColor: { rgb: '4936A3' },
                },
                alignment: {
                    vertical: 'center',
                    horizontal: 'center',
                    wrapText: true,
                },
                border: {
                    bottom: {
                        style: 'medium',
                        color: { rgb: '24165C' },
                    },
                },
            };
        }
    }

    for (let row = 4; row <= lastRow; row += 1) {
        for (let column = 0; column < headers.length; column += 1) {
            const address = XLSX.utils.encode_cell({
                r: row,
                c: column,
            });

            const cell = worksheet[address];

            if (!cell) continue;

            cell.s = {
                font: {
                    sz: 10,
                    color: { rgb: '202033' },
                },
                fill: {
                    fgColor: {
                        rgb: row % 2 === 0 ? 'F2F0FA' : 'FFFFFF',
                    },
                },
                alignment: {
                    vertical: 'top',
                    wrapText: true,
                },
                border: {
                    bottom: {
                        style: 'thin',
                        color: { rgb: 'DDD9EE' },
                    },
                },
            };
        }
    }

    return worksheet;
}

function appendSheet(
    workbook: XLSX.WorkBook,
    name: string,
    worksheet: XLSX.WorkSheet,
): void {
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
}

function downloadWorkbook(
    workbook: XLSX.WorkBook,
    filename: string,
): void {
    XLSX.writeFile(workbook, filename, {
        bookType: 'xlsx',
        compression: true,
    });
}

function sumEmployees(
    employees: MonthlyAttendanceEmployee[],
    selector: (employee: MonthlyAttendanceEmployee) => number | null | undefined,
): number {
    return employees.reduce(
        (total, employee) => total + numberValue(selector(employee)),
        0,
    );
}

/**
 * Exports one report into exactly three worksheets:
 * 1. Report Summary
 * 2. Employee Attendance
 * 3. Overall Statistics
 *
 * No duplicate employee worksheet and no TOTAL row are added.
 */
export function exportMonthlyAttendanceReport(
    report: MonthlyAttendanceReportDetails,
): void {
    const employees: MonthlyAttendanceEmployee[] = report.employees ?? [];
    const branchName = report.branchName || `Branch ${report.branchId}`;
    const period =
        `${MONTHS[report.month - 1] ?? 'Unknown'} ${report.year}`;

    const workbook = XLSX.utils.book_new();

    const exportedAt = new Date().toLocaleString('en-IN');

    const totalEmployees =
        report.employeeCount ?? employees.length;

    const reviewCount = employees.filter(
        (employee) => employee.needsHrReview,
    ).length;

    const workingDays = sumEmployees(employees, (e) => e.workingDays);
    const presentDays = sumEmployees(employees, (e) => e.presentDays);
    const leaveDays = sumEmployees(employees, (e) => e.approvedLeaveDays);
    const halfDays = sumEmployees(employees, (e) => e.halfDays);
    const lateArrivals = sumEmployees(employees, (e) => e.lateArrivals);

    const missingAttendance = sumEmployees(
        employees,
        (e) => e.missingAttendanceDays,
    );

    const missingCheckIns = sumEmployees(
        employees,
        (e) => e.missingCheckIns,
    );

    const missingCheckOuts = sumEmployees(
        employees,
        (e) => e.missingCheckOuts,
    );

    const workedHours = sumEmployees(
        employees,
        (e) => e.totalWorkedHours,
    );

    const shortageHours = sumEmployees(
        employees,
        (e) => e.totalShortageHours,
    );

    const attendanceRate =
        workingDays > 0 ? (presentDays / workingDays) * 100 : 0;

    // SHEET 1: REPORT SUMMARY
    const summaryRows: ExcelValue[][] = [
        ['Report ID', report.id],
        ['Reporting Period', period],
        ['Reporting Year', report.year],
        ['Reporting Month Number', report.month],
        ['Branch Name', branchName],
        ['Branch ID', report.branchId],
        ['Status', statusLabel(report.status)],
        ['Employees Reported by API', totalEmployees],
        ['Employee Detail Rows Included', employees.length],
        ['Employees Needing HR Review', reviewCount],
        ['Return Reason', report.returnReason || 'Not applicable'],
        ['Exported At', exportedAt],
    ];

    appendSheet(
        workbook,
        'Report Summary',
        createStyledSheet(
            'MONTHLY ATTENDANCE REPORT',
            `${branchName} | ${period} | Report #${report.id}`,
            ['Report Information', 'Details'],
            summaryRows,
            [36, 62],
        ),
    );

    // SHEET 2: EMPLOYEE ATTENDANCE
    const employeeHeaders = [
        'Employee Name',
        'User ID',
        'Employee Record ID',
        'Working Days',
        'Present Days',
        'Approved Leave Days',
        'Half Days',
        'Late Arrivals',
        'Missing Attendance Days',
        'Missing Check-Ins',
        'Missing Check-Outs',
        'Total Worked Hours',
        'Total Shortage Hours',
        'HR Review Required',
        'HR Review Notes',
    ];

    const employeeRows: ExcelValue[][] = employees.map((employee) => [
        employee.employeeName || `User ${employee.userId}`,
        numberValue(employee.userId),
        numberValue(employee.id),
        numberValue(employee.workingDays),
        numberValue(employee.presentDays),
        numberValue(employee.approvedLeaveDays),
        numberValue(employee.halfDays),
        numberValue(employee.lateArrivals),
        numberValue(employee.missingAttendanceDays),
        numberValue(employee.missingCheckIns),
        numberValue(employee.missingCheckOuts),
        numberValue(employee.totalWorkedHours),
        numberValue(employee.totalShortageHours),
        employee.needsHrReview ? 'Yes' : 'No',
        employee.hrReviewNotes || '',
    ]);

    appendSheet(
        workbook,
        'Employee Attendance',
        createStyledSheet(
            'EMPLOYEE ATTENDANCE DETAILS',
            `${branchName} | ${period} | ${employees.length} employee record(s)`,
            employeeHeaders,
            employeeRows,
            [
                28, 12, 18, 14, 14, 22, 12, 15,
                23, 18, 20, 20, 21, 19, 55,
            ],
        ),
    );

    // SHEET 3: OVERALL STATISTICS
    const statisticsRows: ExcelValue[][] = [
        ['Report ID', report.id],
        ['Branch', branchName],
        ['Reporting Period', period],
        ['Report Status', statusLabel(report.status)],
        ['Employees Reported by API', totalEmployees],
        ['Employee Detail Rows Included', employees.length],
        ['Employees Needing HR Review', reviewCount],
        ['Total Working Days', workingDays],
        ['Total Present Days', presentDays],
        ['Total Approved Leave Days', leaveDays],
        ['Total Half Days', halfDays],
        ['Total Late Arrivals', lateArrivals],
        ['Total Missing Attendance Days', missingAttendance],
        ['Total Missing Check-Ins', missingCheckIns],
        ['Total Missing Check-Outs', missingCheckOuts],
        ['Total Worked Hours', Number(workedHours.toFixed(2))],
        ['Total Shortage Hours', Number(shortageHours.toFixed(2))],
        ['Present Days / Working Days (%)', Number(attendanceRate.toFixed(2))],
        [
            'Statistics Note',
            'Statistics are calculated from the employee detail rows included in this export.',
        ],
    ];

    appendSheet(
        workbook,
        'Overall Statistics',
        createStyledSheet(
            'OVERALL ATTENDANCE STATISTICS',
            `${branchName} | ${period} | Calculated from included employee records`,
            ['Metric', 'Value'],
            statisticsRows,
            [43, 68],
        ),
    );

    const filename =
        `Monthly-Attendance-${safeFilePart(branchName)}-` +
        `${report.year}-${String(report.month).padStart(2, '0')}.xlsx`;

    downloadWorkbook(workbook, filename);
}

/**
 * Exports the currently filtered report register into a separate workbook.
 */
export function exportMonthlyAttendanceReportList(
    reports: MonthlyAttendanceReport[],
    year: number,
    month: number,
): void {
    if (reports.length === 0) {
        throw new Error(
            'There are no reports to export for the current filters.',
        );
    }

    const workbook = XLSX.utils.book_new();

    const headers = [
        'Report ID',
        'Reporting Month',
        'Year',
        'Month Number',
        'Branch',
        'Branch ID',
        'Employees',
        'Employees Needing HR Review',
        'Approval Status',
    ];

    const rows: ExcelValue[][] = reports.map((report) => [
        numberValue(report.id),
        `${MONTHS[report.month - 1] ?? 'Unknown'} ${report.year}`,
        numberValue(report.year),
        numberValue(report.month),
        report.branchName || `Branch ${report.branchId}`,
        numberValue(report.branchId),
        numberValue(report.employeeCount),
        numberValue(report.employeesNeedingReview),
        statusLabel(report.status),
    ]);

    appendSheet(
        workbook,
        'Attendance Reports',
        createStyledSheet(
            'MONTHLY ATTENDANCE REPORT REGISTER',
            `Filtered reports | ${MONTHS[month - 1] ?? 'Unknown'} ${year} | Exported ${new Date().toLocaleString('en-IN')}`,
            headers,
            rows,
            [13, 24, 12, 14, 30, 13, 14, 27, 24],
        ),
    );

    downloadWorkbook(
        workbook,
        `Monthly-Attendance-Reports-${year}-${String(month).padStart(2, '0')}.xlsx`,
    );
}
