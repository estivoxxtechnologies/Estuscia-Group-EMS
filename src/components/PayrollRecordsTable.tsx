import React from 'react';

import {
  Gift,
  MinusCircle,
  CheckCircle2,
  Clock3,
  Lock,
} from 'lucide-react';

import {
  PayrollRecord,
  PayrollAdjustment,
} from '../types/payrollCycle';

import { StatusBadge } from './PayrollUI';
import PendingAdjustmentBadge from './PendingAdjustmentBadge';

/* =========================================================
   TYPES
========================================================= */

type AdjustmentStatus =
  | 'PendingApproval'
  | 'ApprovedByCompanyAdmin'
  | 'Rejected';

type AdjustmentWithOptionalStatus =
  PayrollAdjustment & {
    status?: AdjustmentStatus | string | number;
  };

type PayrollRecordsTableProps = {
  records: PayrollRecord[];
  adjustments: PayrollAdjustment[];

  canEdit: boolean;
  canApproveAdjustments: boolean;
  canPay: boolean;

  selectedPaymentRecordIds: number[];

  /*
   * IMPORTANT:
   *
   * This MUST match MonthlyPayrollPage.tsx.
   */
  onPaymentSelectionChange: (
    recordId: number,
    checked: boolean
  ) => void;

  onAddBonus: (
    record: PayrollRecord
  ) => void;

  onAddDeduction: (
    record: PayrollRecord
  ) => void;

  onPendingAdjustmentClick: (
    adjustment: PayrollAdjustment
  ) => void;
};

/* =========================================================
   COMPONENT
========================================================= */

const PayrollRecordsTable: React.FC<
  PayrollRecordsTableProps
> = ({
  records,
  adjustments,
  canEdit,
  canApproveAdjustments,
  canPay,
  selectedPaymentRecordIds,
  onPaymentSelectionChange,
  onAddBonus,
  onAddDeduction,
  onPendingAdjustmentClick,
}) => {

  /* =======================================================
     ADJUSTMENT STATUS
  ======================================================= */

  const getAdjustmentStatus = (
    adjustment: PayrollAdjustment
  ): AdjustmentStatus => {
    const value =
      (
        adjustment as AdjustmentWithOptionalStatus
      ).status;

    if (
      value === 'PendingApproval' ||
      value === 'ApprovedByCompanyAdmin' ||
      value === 'Rejected'
    ) {
      return value;
    }

    if (
      value === 1 ||
      value === '1'
    ) {
      return 'PendingApproval';
    }

    if (
      value === 2 ||
      value === '2'
    ) {
      return 'ApprovedByCompanyAdmin';
    }

    if (
      value === 3 ||
      value === '3'
    ) {
      return 'Rejected';
    }

    return 'PendingApproval';
  };

  /* =======================================================
     PENDING ADJUSTMENTS
  ======================================================= */

  const getPendingForUser = (
    userId: number
  ) =>
    adjustments.filter(
      adjustment =>
        adjustment.userId === userId &&
        getAdjustmentStatus(
          adjustment
        ) === 'PendingApproval'
    );

  /* =======================================================
     PAYABLE RECORDS
  ======================================================= */

  /*
   * IMPORTANT:
   *
   * Only these employees can be selected for payment:
   *
   * 1. Payroll approved
   * 2. Payment is not Paid
   * 3. Record is not locked
   *
   * The backend's actual approval status is:
   *
   * ApprovedByCompanyAdmin
   */
  const payableRecords =
    records.filter(
      record =>
        record.paymentStatus !== 'Paid' &&
        !record.isLocked &&
        record.status ===
          'ApprovedByCompanyAdmin'
    );

  const payableRecordIds =
    new Set(
      payableRecords.map(
        record => record.id
      )
    );

  /* =======================================================
     SELECTED COUNT
  ======================================================= */

  const selectedCount =
    selectedPaymentRecordIds.filter(
      id =>
        payableRecordIds.has(id)
    ).length;

  /* =======================================================
     TOGGLE ONE EMPLOYEE
  ======================================================= */

  const togglePaymentSelection = (
    record: PayrollRecord
  ) => {
    /*
     * Do not allow selection if:
     *
     * - payment control is unavailable
     * - already paid
     * - locked
     * - payroll not approved
     */
    if (
      !canPay ||
      record.paymentStatus === 'Paid' ||
      record.isLocked ||
      record.status !==
        'ApprovedByCompanyAdmin'
    ) {
      return;
    }

    const isSelected =
      selectedPaymentRecordIds.includes(
        record.id
      );

    /*
     * IMPORTANT:
     *
     * The parent owns the selection state.
     *
     * We pass:
     *
     * record.id
     * checked
     */
    onPaymentSelectionChange(
      record.id,
      !isSelected
    );
  };

  /* =======================================================
     SELECT ALL
  ======================================================= */

  const allPayableSelected =
    payableRecords.length > 0 &&
    payableRecords.every(
      record =>
        selectedPaymentRecordIds.includes(
          record.id
        )
    );

  const toggleSelectAllUnpaid = () => {
    if (
      !canPay ||
      payableRecords.length === 0
    ) {
      return;
    }

    /*
     * IMPORTANT:
     *
     * Because the parent owns the selection state,
     * select-all is handled by calling the parent
     * for each payable record.
     */
    if (allPayableSelected) {
      payableRecords.forEach(
        record => {
          if (
            selectedPaymentRecordIds.includes(
              record.id
            )
          ) {
            onPaymentSelectionChange(
              record.id,
              false
            );
          }
        }
      );

      return;
    }

    payableRecords.forEach(
      record => {
        if (
          !selectedPaymentRecordIds.includes(
            record.id
          )
        ) {
          onPaymentSelectionChange(
            record.id,
            true
          );
        }
      }
    );
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="rounded-2xl border border-[#2d2770]/80 bg-[#09071e] overflow-hidden">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="p-4 border-b border-[#231e54] flex items-center justify-between gap-3">

        <div>

          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Employee Payroll
          </h2>

          <p className="text-[11px] text-slate-400 mt-1">
            All employee payroll records are included automatically.
            Select approved unpaid employees to mark their salary as paid.
          </p>

        </div>

        <div className="flex items-center gap-3">

          {selectedCount > 0 && (
            <span className="text-[11px] text-emerald-300 font-semibold">
              {selectedCount} selected for payment
            </span>
          )}

          <div className="text-[11px] text-[#A78BFA] font-semibold whitespace-nowrap">
            {records.length} Employees
          </div>

        </div>

      </div>

      {/* ===================================================
          TABLE
      =================================================== */}

      <div className="overflow-x-auto">

        <table className="w-full text-left text-xs">

          <thead className="bg-[#120e38] text-slate-400">

            <tr>

              {/* PAYMENT SELECTION */}

              <th className="p-3.5 w-12 text-center">

                {canPay &&
                payableRecords.length > 0 ? (

                  <input
                    type="checkbox"
                    checked={
                      allPayableSelected
                    }
                    onChange={
                      toggleSelectAllUnpaid
                    }
                    className="h-4 w-4 rounded border-slate-600 bg-[#09071e] text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    title="Select all unpaid approved employees"
                  />

                ) : (

                  <span className="text-slate-600">
                    #
                  </span>

                )}

              </th>

              <th className="p-3.5">
                Employee
              </th>

              <th className="p-3.5">
                Base Salary
              </th>

              <th className="p-3.5">
                Bonus
              </th>

              <th className="p-3.5">
                Deduction
              </th>

              <th className="p-3.5">
                Net Salary
              </th>

              <th className="p-3.5">
                Payroll Status
              </th>

              <th className="p-3.5">
                Payment
              </th>

              <th className="p-3.5">
                Actions
              </th>

            </tr>

          </thead>

          <tbody className="divide-y divide-[#1c164a]/60">

            {records.map(
              record => {

                const pending =
                  getPendingForUser(
                    record.userId
                  );

                const pendingBonus =
                  pending.filter(
                    adjustment =>
                      adjustment.type ===
                      'Bonus'
                  );

                const pendingDeduction =
                  pending.filter(
                    adjustment =>
                      adjustment.type ===
                      'Deduction'
                  );

                const isPaid =
                  record.paymentStatus ===
                  'Paid';

                /*
                 * THIS IS THE IMPORTANT CHECK.
                 */
                const isPayable =
                  canPay &&
                  !isPaid &&
                  !record.isLocked &&
                  record.status ===
                    'ApprovedByCompanyAdmin';

                const isSelected =
                  selectedPaymentRecordIds.includes(
                    record.id
                  );

                return (
                  <tr
                    key={record.id}
                    className={`hover:bg-[#140f3d]/60 ${
                      isSelected
                        ? 'bg-emerald-500/[0.04]'
                        : ''
                    }`}
                  >

                    {/* =================================
                        PAYMENT CHECKBOX
                    ================================= */}

                    <td className="p-3.5 align-top text-center">

                      {isPaid ? (

                        <div className="flex justify-center">

                          <CheckCircle2
                            className="w-4 h-4 text-emerald-400"
                            title="Already paid"
                          />

                        </div>

                      ) : isPayable ? (

                        <input
                          type="checkbox"
                          checked={
                            isSelected
                          }
                          onChange={
                            event =>
                              onPaymentSelectionChange(
                                record.id,
                                event.target
                                  .checked
                              )
                          }
                          className="h-4 w-4 rounded border-slate-600 bg-[#09071e] text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                          title="Select employee for payment"
                        />

                      ) : (

                        <span className="text-slate-600">
                          —
                        </span>

                      )}

                    </td>

                    {/* =================================
                        EMPLOYEE
                    ================================= */}

                    <td className="p-3.5 align-top">

                      <div className="font-bold text-white">
                        {record.employeeName ||
                          '-'}
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono">
                        {record.employeeCode ||
                          '-'}
                      </div>

                      {record.designation && (
                        <div className="text-[10px] text-slate-500 mt-1">
                          {
                            record.designation
                          }
                        </div>
                      )}

                    </td>

                    {/* =================================
                        BASE
                    ================================= */}

                    <td className="p-3.5 align-top font-mono text-slate-200">

                      {record.currencySymbol ||
                        '₹'}

                      {Number(
                        record.basicSalary ??
                          0
                      ).toLocaleString()}

                    </td>

                    {/* =================================
                        BONUS
                    ================================= */}

                    <td className="p-3.5 align-top">

                      <div className="font-mono text-emerald-400">

                        {record.currencySymbol ||
                          '₹'}

                        {Number(
                          record.totalBonus ??
                            0
                        ).toLocaleString()}

                      </div>

                      {pendingBonus.length >
                        0 && (
                        <div className="mt-2 space-y-1">

                          {pendingBonus.map(
                            adjustment => (
                              <PendingAdjustmentBadge
                                key={
                                  adjustment.id
                                }
                                adjustment={
                                  adjustment
                                }
                                canApprove={
                                  canApproveAdjustments
                                }
                                onClick={() =>
                                  onPendingAdjustmentClick(
                                    adjustment
                                  )
                                }
                              />
                            )
                          )}

                        </div>
                      )}

                    </td>

                    {/* =================================
                        DEDUCTION
                    ================================= */}

                    <td className="p-3.5 align-top">

                      <div className="font-mono text-rose-300">

                        {record.currencySymbol ||
                          '₹'}

                        {Number(
                          record.totalDeduction ??
                            0
                        ).toLocaleString()}

                      </div>

                      {pendingDeduction.length >
                        0 && (
                        <div className="mt-2 space-y-1">

                          {pendingDeduction.map(
                            adjustment => (
                              <PendingAdjustmentBadge
                                key={
                                  adjustment.id
                                }
                                adjustment={
                                  adjustment
                                }
                                canApprove={
                                  canApproveAdjustments
                                }
                                onClick={() =>
                                  onPendingAdjustmentClick(
                                    adjustment
                                  )
                                }
                              />
                            )
                          )}

                        </div>
                      )}

                    </td>

                    {/* =================================
                        NET
                    ================================= */}

                    <td className="p-3.5 align-top font-mono font-bold text-white">

                      {record.currencySymbol ||
                        '₹'}

                      {Number(
                        record.netSalary ??
                          0
                      ).toLocaleString()}

                      {pending.length >
                        0 && (
                        <div className="mt-1 text-[9px] text-amber-400 font-sans">
                          Pending adjustments excluded
                        </div>
                      )}

                    </td>

                    {/* =================================
                        PAYROLL STATUS
                    ================================= */}

                    <td className="p-3.5 align-top">

                      <StatusBadge
                        status={
                          record.status
                        }
                      />

                    </td>

                    {/* =================================
                        PAYMENT
                    ================================= */}

                    <td className="p-3.5 align-top">

                      {isPaid ? (

                        <div className="flex flex-col gap-1">

                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">

                            <CheckCircle2 className="w-3.5 h-3.5" />

                            Paid

                          </span>

                          {record.paidAtUtc && (
                            <span className="text-[9px] text-slate-500">
                              {new Date(
                                record.paidAtUtc
                              ).toLocaleString()}
                            </span>
                          )}

                        </div>

                      ) : isSelected ? (

                        <span className="inline-flex items-center gap-1.5 text-cyan-300 font-semibold">

                          <Clock3 className="w-3.5 h-3.5" />

                          Selected

                        </span>

                      ) : (

                        <span className="inline-flex items-center gap-1.5 text-amber-400 font-semibold">

                          <Clock3 className="w-3.5 h-3.5" />

                          Unpaid

                        </span>

                      )}

                    </td>

                    {/* =================================
                        ACTIONS
                    ================================= */}

                    <td className="p-3.5 align-top">

                      <div className="flex flex-wrap gap-2">

                        {canEdit &&
                          !record.isLocked &&
                          !isPaid && (

                            <>

                              <button
                                onClick={() =>
                                  onAddBonus(
                                    record
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/15 text-xs font-semibold flex items-center gap-1.5"
                              >

                                <Gift className="w-3.5 h-3.5" />

                                Bonus

                              </button>

                              <button
                                onClick={() =>
                                  onAddDeduction(
                                    record
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/15 text-xs font-semibold flex items-center gap-1.5"
                              >

                                <MinusCircle className="w-3.5 h-3.5" />

                                Deduction

                              </button>

                            </>

                          )}

                        {record.isLocked && (

                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">

                            <Lock className="w-3 h-3" />

                            Locked

                          </span>

                        )}

                      </div>

                    </td>

                  </tr>
                );
              }
            )}

          </tbody>

        </table>

        {records.length ===
          0 && (
          <div className="p-12 text-center text-sm text-slate-500">
            Select or generate a payroll cycle to load employees.
          </div>
        )}

      </div>

    </div>
  );
};

export default PayrollRecordsTable;