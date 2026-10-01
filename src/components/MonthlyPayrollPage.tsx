import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Plus,
  Send,
  CheckCircle2,
  XCircle,
  Lock,
  RefreshCw,
  Loader2,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Clock3,
} from 'lucide-react';

import { toast } from 'react-toastify';

import { useApp } from '../context/AppContext';

import {
  getPayrollCycles,
  getPayrollRecords,
  generatePayroll,
  approvePayroll,
  rejectPayroll,
  createPayrollAdjustment,
  getPayrollAdjustments,
  deletePayroll,
} from '../api/payroll';

import { apiRequest } from '../api/client';

import {
  PayrollCycle,
  PayrollRecord,
  PayrollAdjustment,
  CreatePayrollAdjustmentRequest,
} from '../types/payrollCycle';

import PayrollRecordsTable from './PayrollRecordsTable';
import ConfirmationModal from './ConfirmationModal';
import RejectModal from './RejectModal';
import BonusModal from './BonusModal';
import DeductionModal from './DeductionModal';
import AdjustmentApprovalModal from './AdjustmentApprovalModal';
import AdjustmentRejectModal from './AdjustmentRejectModal';

import {
  formatCurrency,
  getAdjustmentEmployeeName,
} from '../services/payrollHelpers';

import { StatusBadge, Summary } from './PayrollUI';

/* =========================================================
   PROPS
========================================================= */

interface MonthlyPayrollPageProps {
  /**
   * null = All Branches
   * number = selected/effective branch
   */
  effectiveBranchId: number | null;
}

/* =========================================================
   INTERNAL TYPES
========================================================= */

type AdjustmentStatus =
  | 'PendingApproval'
  | 'ApprovedByCompanyAdmin'
  | 'Rejected';

type AdjustmentWithOptionalStatus =
  PayrollAdjustment & {
    status?: AdjustmentStatus | string | number;
  };

/* =========================================================
   PAGE
========================================================= */

const MonthlyPayrollPage: React.FC<
  MonthlyPayrollPageProps
> = ({
  effectiveBranchId,
}) => {
  const { currentUser } = useApp();

  /* =======================================================
     PAYROLL STATE
  ======================================================= */

  const [payrollCycles, setPayrollCycles] =
    useState<PayrollCycle[]>([]);

  const [records, setRecords] =
    useState<PayrollRecord[]>([]);

  const [selectedCycleId, setSelectedCycleId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * YEAR FILTER
   *
   * Current year is selected by default.
   *
   * Example:
   * 2026
   * 2025
   * 2024
   */
  const currentYear =
    new Date().getFullYear();

  const [selectedPayrollYear, setSelectedPayrollYear] =
    useState<number>(currentYear);

  /*
   * IMPORTANT:
   *
   * This selection is ONLY for choosing which employees
   * should be paid in the current payment batch.
   *
   * It is NOT used for payroll submission.
   */
  const [selectedPaymentRecordIds, setSelectedPaymentRecordIds] =
    useState<number[]>([]);

  /* =======================================================
     ADJUSTMENT STATE
  ======================================================= */

  const [adjustments, setAdjustments] =
    useState<PayrollAdjustment[]>([]);

  const [adjustmentRecord, setAdjustmentRecord] =
    useState<PayrollRecord | null>(null);

  const [adjustmentAmount, setAdjustmentAmount] =
    useState('');

  const [adjustmentReason, setAdjustmentReason] =
    useState('');

  const [showBonusModal, setShowBonusModal] =
    useState(false);

  const [showDeductionModal, setShowDeductionModal] =
    useState(false);

  /* =======================================================
     ADJUSTMENT APPROVAL
  ======================================================= */

  const [selectedPendingAdjustment, setSelectedPendingAdjustment] =
    useState<PayrollAdjustment | null>(null);

  const [showAdjustmentApprovalModal, setShowAdjustmentApprovalModal] =
    useState(false);

  const [showAdjustmentRejectModal, setShowAdjustmentRejectModal] =
    useState(false);

  const [adjustmentRejectionReason, setAdjustmentRejectionReason] =
    useState('');

  /* =======================================================
     PAYROLL MODALS
  ======================================================= */

  const [showSubmitModal, setShowSubmitModal] =
    useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [showPayModal, setShowPayModal] =
    useState(false);

  const [showRejectModal, setShowRejectModal] =
    useState(false);

  const [rejectionReason, setRejectionReason] =
    useState('');

  /* =======================================================
     ROLES
  ======================================================= */

  const role =
    currentUser?.roleName ?? '';

  const isPayrollManager =
    role === 'hr_ops' ||
    role === 'branch_manager';

  const isCompanyAdmin =
    role === 'company_admin';

  const isSuperAdmin =
    role === 'super_admin';

  /*
   * HR, Company Admin and Super Admin can create
   * payroll adjustments.
   */
  const canManageAdjustments =
    role === 'hr_ops' ||
    role === 'company_admin' ||
    role === 'super_admin';

  /*
   * Company Admin is the approval authority for
   * pending bonus/deduction adjustments.
   */
  const canApproveAdjustments =
    isCompanyAdmin;

  /*
   * Payroll deletion.
   */
  const canDeletePayroll =
    role === 'hr_ops' ||
    role === 'company_admin' ||
    role === 'super_admin';

  /* =======================================================
     BRANCH
  ======================================================= */

  const branchScopeLabel =
    effectiveBranchId === null
      ? 'All Branches'
      : `Branch #${effectiveBranchId}`;

  /* =======================================================
     CURRENT MONTH
  ======================================================= */

  const currentMonthLabel =
    useMemo(
      () =>
        new Intl.DateTimeFormat(
          'en-US',
          {
            month: 'long',
            year: 'numeric',
          }
        ).format(new Date()),
      []
    );

  const isCurrentMonthCycle = useCallback(
    (
      cycle: PayrollCycle
    ) => {
      if (!cycle.monthYear) {
        return false;
      }

      return (
        cycle.monthYear
          .trim()
          .toLowerCase() ===
        currentMonthLabel
          .trim()
          .toLowerCase()
      );
    },
    [
      currentMonthLabel,
    ]
  );

  /*
   * =======================================================
   * AVAILABLE YEARS
   * =======================================================
   *
   * Always include the current year.
   *
   * Other years come from the payroll data returned
   * by the backend.
   */
  const availablePayrollYears =
    useMemo(() => {
      const years = new Set<number>();

      years.add(currentYear);

      payrollCycles.forEach(
        cycle => {
          if (
            Number.isInteger(
              cycle.year
            )
          ) {
            years.add(
              cycle.year
            );

            return;
          }

          /*
           * Fallback in case the DTO does not expose
           * a numeric year property.
           *
           * Example:
           * "September 2026"
           */
          if (
            cycle.monthYear
          ) {
            const match =
              cycle.monthYear.match(
                /\b(20\d{2})\b/
              );

            if (
              match
            ) {
              years.add(
                Number(
                  match[1]
                )
              );
            }
          }
        }
      );

      return Array.from(
        years
      ).sort(
        (a, b) =>
          b - a
      );
    }, [
      payrollCycles,
      currentYear,
    ]);

  /*
   * =======================================================
   * YEAR-FILTERED PAYROLL CYCLES
   * =======================================================
   *
   * Only the selected year's months are shown.
   */
  const filteredPayrollCycles =
    useMemo(() => {
      return payrollCycles
        .filter(
          cycle => {
            if (
              Number.isInteger(
                cycle.year
              )
            ) {
              return (
                cycle.year ===
                selectedPayrollYear
              );
            }

            if (
              cycle.monthYear
            ) {
              const match =
                cycle.monthYear.match(
                  /\b(20\d{2})\b/
                );

              return (
                match &&
                Number(
                  match[1]
                ) ===
                  selectedPayrollYear
              );
            }

            return false;
          }
        )
        .sort(
          (a, b) => {
            /*
             * Prefer month number if the API provides it.
             */
            if (
              Number.isInteger(
                a.month
              ) &&
              Number.isInteger(
                b.month
              )
            ) {
              return (
                b.month -
                a.month
              );
            }

            /*
             * Otherwise sort using the month/year text.
             */
            return (
              String(
                b.monthYear ?? ''
              ).localeCompare(
                String(
                  a.monthYear ?? ''
                )
              )
            );
          }
        );
    }, [
      payrollCycles,
      selectedPayrollYear,
    ]);

  /*
   * Current month cycle from ALL loaded cycles.
   *
   * This is intentionally not restricted by the selected
   * year because Generate Payroll always concerns the
   * current month.
   */
  const currentMonthCycle =
    useMemo(
      () =>
        payrollCycles.find(
          cycle =>
            isCurrentMonthCycle(
              cycle
            )
        ),
      [
        payrollCycles,
        isCurrentMonthCycle,
      ]
    );

  const canGenerateCurrentMonth =
    !currentMonthCycle;

  /* =======================================================
     PAYMENT SELECTION
  ======================================================= */

  const unpaidRecords = useMemo(
    () =>
      records.filter(
        record =>
          record.paymentStatus !== 'Paid'
      ),
    [
      records,
    ]
  );

  const paidRecords = useMemo(
    () =>
      records.filter(
        record =>
          record.paymentStatus === 'Paid'
      ),
    [
      records,
    ]
  );

  const selectedPaymentRecords =
    useMemo(
      () =>
        records.filter(
          record =>
            selectedPaymentRecordIds.includes(
              record.id
            ) &&
            record.paymentStatus !== 'Paid'
        ),
      [
        records,
        selectedPaymentRecordIds,
      ]
    );

  const selectedPaymentCount =
    selectedPaymentRecords.length;

  const paymentProgress =
    records.length > 0
      ? Math.round(
          (paidRecords.length /
            records.length) *
            100
        )
      : 0;

  /*
   * Only records that can actually be paid are considered
   * for "Select All".
   *
   * This prevents selecting records that are not approved
   * or are locked.
   */
  const payableRecords =
    useMemo(
      () =>
        records.filter(
          record =>
            record.paymentStatus !==
              'Paid' &&
            !record.isLocked &&
            record.status ===
              'ApprovedByCompanyAdmin'
        ),
      [
        records,
      ]
    );

  const allUnpaidSelected =
    payableRecords.length > 0 &&
    payableRecords.every(
      record =>
        selectedPaymentRecordIds.includes(
          record.id
        )
    );

  /*
   * Checkbox selection is only for payment.
   *
   * Paid employees can never be selected again.
   */
  const handlePaymentSelectionChange =
    (
      recordId: number,
      checked: boolean
    ) => {
      setSelectedPaymentRecordIds(
        previous => {
          if (checked) {
            if (
              previous.includes(
                recordId
              )
            ) {
              return previous;
            }

            return [
              ...previous,
              recordId,
            ];
          }

          return previous.filter(
            id =>
              id !== recordId
          );
        }
      );
    };

  const handleSelectAllUnpaid =
    () => {
      if (
        payableRecords.length ===
        0
      ) {
        return;
      }

      if (allUnpaidSelected) {
        setSelectedPaymentRecordIds(
          []
        );

        return;
      }

      setSelectedPaymentRecordIds(
        payableRecords.map(
          record =>
            record.id
        )
      );
    };

  /* =======================================================
     ADJUSTMENT STATUS HELPERS
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

  const pendingAdjustments =
    useMemo(
      () =>
        adjustments.filter(
          adjustment =>
            getAdjustmentStatus(
              adjustment
            ) ===
            'PendingApproval'
        ),
      [
        adjustments,
      ]
    );

  const pendingAdjustmentCount =
    pendingAdjustments.length;

  /* =======================================================
     LOAD CYCLE RECORDS
  ======================================================= */

  const loadCycleRecords =
    useCallback(
      async (
        cycleId: number
      ) => {
        if (
          !Number.isInteger(
            cycleId
          ) ||
          cycleId <= 0
        ) {
          setRecords([]);
          setAdjustments([]);
          setSelectedPaymentRecordIds(
            []
          );

          return;
        }

        const cycleRecords =
          await getPayrollRecords(
            cycleId
          );

        setRecords(
          cycleRecords
        );

        /*
         * Remove any previously selected IDs
         * that are now paid or no longer exist.
         */
        const validUnpaidIds =
          new Set(
            cycleRecords
              .filter(
                record =>
                  record.paymentStatus !==
                  'Paid'
              )
              .map(
                record =>
                  record.id
              )
          );

        setSelectedPaymentRecordIds(
          previous =>
            previous.filter(
              id =>
                validUnpaidIds.has(
                  id
                )
            )
        );

        const cycleAdjustments =
          await getPayrollAdjustments(
            cycleId
          );

        setAdjustments(
          cycleAdjustments
        );
      },
      []
    );

  /* =======================================================
     LOAD PAYROLL CYCLES
  ======================================================= */

  const loadPayroll =
    useCallback(
      async (
        preferredCycleId?: number | null
      ) => {
        try {
          setLoading(true);
          setError(null);

          const cycles =
            await getPayrollCycles();

          setPayrollCycles(
            cycles
          );

          if (
            cycles.length === 0
          ) {
            setRecords([]);
            setAdjustments([]);
            setSelectedCycleId(
              null
            );
            setSelectedPaymentRecordIds(
              []
            );

            return;
          }

          const safePreferredCycleId =
            Number.isInteger(
              preferredCycleId
            ) &&
            Number(
              preferredCycleId
            ) > 0
              ? Number(
                  preferredCycleId
                )
              : null;

          const preferredExists =
            safePreferredCycleId !==
              null &&
            cycles.some(
              cycle =>
                cycle.id ===
                safePreferredCycleId
            );

          /*
           * First preference:
           * explicitly requested cycle.
           *
           * Second preference:
           * current month.
           *
           * Third preference:
           * first cycle returned.
           */
          const cycleId =
            preferredExists
              ? safePreferredCycleId!
              : (
                  cycles.find(
                    cycle =>
                      isCurrentMonthCycle(
                        cycle
                      )
                  )?.id ??
                  cycles[0].id
                );

          if (
            !Number.isInteger(
              cycleId
            ) ||
            cycleId <= 0
          ) {
            setRecords([]);
            setAdjustments([]);
            setSelectedCycleId(
              null
            );
            setSelectedPaymentRecordIds(
              []
            );

            return;
          }

          /*
           * Make sure the selected year follows the
           * cycle that we selected.
           */
          const selectedCycle =
            cycles.find(
              cycle =>
                cycle.id ===
                cycleId
            );

          if (
            selectedCycle
          ) {
            let cycleYear:
              number | null =
              null;

            if (
              Number.isInteger(
                selectedCycle.year
              )
            ) {
              cycleYear =
                selectedCycle.year;
            } else if (
              selectedCycle.monthYear
            ) {
              const match =
                selectedCycle.monthYear.match(
                  /\b(20\d{2})\b/
                );

              if (
                match
              ) {
                cycleYear =
                  Number(
                    match[1]
                  );
              }
            }

            if (
              cycleYear
            ) {
              setSelectedPayrollYear(
                cycleYear
              );
            }
          }

          setSelectedCycleId(
            cycleId
          );

          await loadCycleRecords(
            cycleId
          );
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : 'Failed to load payroll.';

          setError(
            message
          );

          toast.error(
            message
          );
        } finally {
          setLoading(false);
        }
      },
      [
        isCurrentMonthCycle,
        loadCycleRecords,
      ]
    );

  /* =======================================================
     INITIAL / BRANCH CHANGE
  ======================================================= */

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    /*
     * Always return to the current year when:
     *
     * - user changes
     * - branch changes
     */
    setSelectedPayrollYear(
      currentYear
    );

    setSelectedCycleId(
      null
    );

    setRecords([]);

    setAdjustments([]);

    setSelectedPaymentRecordIds(
      []
    );

    void loadPayroll(
      null
    );
  }, [
    currentUser,
    effectiveBranchId,
    loadPayroll,
    currentYear,
  ]);

  /* =======================================================
     YEAR CHANGE
  ======================================================= */

  const handleYearChange =
    async (
      year: number
    ) => {
      if (
        !Number.isInteger(
          year
        )
      ) {
        return;
      }

      setSelectedPayrollYear(
        year
      );

      setSelectedPaymentRecordIds(
        []
      );

      /*
       * Find the newest/most recent cycle
       * belonging to the selected year.
       */
      const yearCycles =
        payrollCycles
          .filter(
            cycle => {
              if (
                Number.isInteger(
                  cycle.year
                )
              ) {
                return (
                  cycle.year ===
                  year
                );
              }

              if (
                cycle.monthYear
              ) {
                const match =
                  cycle.monthYear.match(
                    /\b(20\d{2})\b/
                  );

                return (
                  match &&
                  Number(
                    match[1]
                  ) ===
                    year
                );
              }

              return false;
            }
          )
          .sort(
            (a, b) => {
              if (
                Number.isInteger(
                  a.month
                ) &&
                Number.isInteger(
                  b.month
                )
              ) {
                return (
                  b.month -
                  a.month
                );
              }

              return String(
                b.monthYear ?? ''
              ).localeCompare(
                String(
                  a.monthYear ?? ''
                )
              );
            }
          );

      const nextCycle =
        yearCycles[0];

      if (
        nextCycle
      ) {
        setSelectedCycleId(
          nextCycle.id
        );

        setRecords([]);

        setAdjustments([]);

        try {
          setLoading(true);

          await loadCycleRecords(
            nextCycle.id
          );
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : 'Failed to load payroll cycle.';

          setError(
            message
          );

          toast.error(
            message
          );
        } finally {
          setLoading(false);
        }
      } else {
        /*
         * No payroll exists for this year.
         */
        setSelectedCycleId(
          null
        );

        setRecords([]);

        setAdjustments([]);
      }
    };

  /* =======================================================
     MANUAL CYCLE SELECTION
  ======================================================= */

  const handleSelectCycle =
    async (
      cycleId: number
    ) => {
      if (
        !Number.isInteger(
          cycleId
        ) ||
        cycleId <= 0
      ) {
        return;
      }

      const exists =
        filteredPayrollCycles.some(
          cycle =>
            cycle.id ===
            cycleId
        );

      if (!exists) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        setSelectedCycleId(
          cycleId
        );

        setSelectedPaymentRecordIds(
          []
        );

        await loadCycleRecords(
          cycleId
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load payroll cycle.';

        setError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     DISPLAYED CYCLE
  ======================================================= */

  const displayedCycle =
    useMemo(
      () =>
        payrollCycles.find(
          cycle =>
            cycle.id ===
            selectedCycleId
        ),
      [
        payrollCycles,
        selectedCycleId,
      ]
    );

  /* =======================================================
     GENERATE PAYROLL
  ======================================================= */

  const handleGeneratePayroll =
    async () => {
      if (
        !canGenerateCurrentMonth
      ) {
        toast.info(
          `${currentMonthLabel} payroll has already been generated. Please complete the existing payroll.`
        );

        return;
      }

      const now =
        new Date();

      try {
        setActionLoading(
          true
        );

        setError(null);

        const cycle =
          await generatePayroll(
            now.getFullYear(),
            now.getMonth() + 1,
            effectiveBranchId
          );

        setPayrollCycles(
          previous => [
            cycle,
            ...previous.filter(
              item =>
                item.id !==
                cycle.id
            ),
          ]
        );

        if (
          !Number.isInteger(
            cycle.id
          ) ||
          cycle.id <= 0
        ) {
          throw new Error(
            'Payroll was generated but the server returned an invalid payroll cycle ID.'
          );
        }

        /*
         * After generating the current payroll,
         * automatically move the year selector to
         * the current year.
         */
        setSelectedPayrollYear(
          now.getFullYear()
        );

        setSelectedCycleId(
          cycle.id
        );

        setSelectedPaymentRecordIds(
          []
        );

        await loadCycleRecords(
          cycle.id
        );

        toast.success(
          `${cycle.monthYear} payroll generated successfully.`
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to generate payroll.';

        setError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const openSubmitModal =
    () => {
      if (
        !displayedCycle
      ) {
        return;
      }

      if (
        displayedCycle.status !==
        'Draft'
      ) {
        toast.error(
          'Only Draft payroll can be submitted.'
        );

        return;
      }

      if (
        records.length === 0
      ) {
        toast.error(
          'There are no employee payroll records to submit.'
        );

        return;
      }

      if (
        pendingAdjustmentCount >
        0
      ) {
        toast.error(
          `${pendingAdjustmentCount} bonus/deduction adjustment${pendingAdjustmentCount === 1 ? '' : 's'} still require Company Admin approval.`
        );

        return;
      }

      setShowSubmitModal(
        true
      );
    };

  const handleSubmit =
    async () => {
      if (
        !displayedCycle
      ) {
        return;
      }

      if (
        displayedCycle.status !==
        'Draft'
      ) {
        toast.error(
          'Only Draft payroll can be submitted.'
        );

        return;
      }

      if (
        records.length === 0
      ) {
        toast.error(
          'There are no employee records to submit.'
        );

        return;
      }

      if (
        pendingAdjustmentCount >
        0
      ) {
        toast.error(
          'Pending bonus/deduction adjustments must be approved or rejected before payroll submission.'
        );

        return;
      }

      try {
        setActionLoading(
          true
        );

        setError(null);

        /*
         * IMPORTANT:
         *
         * There is NO employee selection here.
         *
         * Submitting the payroll submits the complete
         * payroll cycle automatically.
         */
        await apiRequest(
          `/Payroll/${displayedCycle.id}/submit`,
          {
            method: 'POST',
            body: JSON.stringify({
              userIds: records.map(
                record =>
                  record.userId
              ),
            }),
          }
        );

        setShowSubmitModal(
          false
        );

        setSelectedPaymentRecordIds(
          []
        );

        toast.success(
          `${displayedCycle.monthYear} payroll submitted for Company Admin approval.`
        );

        await loadPayroll(
          displayedCycle.id
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to submit payroll.';

        setError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  /* =======================================================
     APPROVE PAYROLL
  ======================================================= */

  const handleApprove =
    async () => {
      if (
        !displayedCycle
      ) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        setError(null);

        const updated =
          await approvePayroll(
            displayedCycle.id
          );

        setPayrollCycles(
          previous =>
            previous.map(
              cycle =>
                cycle.id ===
                updated.id
                  ? updated
                  : cycle
            )
        );

        toast.success(
          `${displayedCycle.monthYear} payroll approved successfully.`
        );

        await loadPayroll(
          displayedCycle.id
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to approve payroll.';

        setError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  /* =======================================================
     REJECT PAYROLL
  ======================================================= */

  const openRejectModal =
    () => {
      if (
        !displayedCycle
      ) {
        return;
      }

      setRejectionReason(
        ''
      );

      setShowRejectModal(
        true
      );
    };

  const handleReject =
    async () => {
      if (
        !displayedCycle
      ) {
        return;
      }

      if (
        !rejectionReason.trim()
      ) {
        toast.error(
          'Enter a rejection reason.'
        );

        return;
      }

      try {
        setActionLoading(
          true
        );

        setError(null);

        const updated =
          await rejectPayroll(
            displayedCycle.id,
            rejectionReason.trim()
          );

        setPayrollCycles(
          previous =>
            previous.map(
              cycle =>
                cycle.id ===
                updated.id
                  ? updated
                  : cycle
            )
        );

        setShowRejectModal(
          false
        );

        setRejectionReason(
          ''
        );

        toast.success(
          `${displayedCycle.monthYear} payroll rejected.`
        );

        await loadPayroll(
          displayedCycle.id
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to reject payroll.';

        setError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  /* =======================================================
     PAY SELECTED EMPLOYEES
  ======================================================= */

  const openPayModal =
    () => {
      if (
        !displayedCycle
      ) {
        return;
      }

      if (
        displayedCycle.status !==
          'ApprovedByCompanyAdmin' &&
        displayedCycle.status !==
          'PartiallyPaid'
      ) {
        toast.error(
          'Only approved payroll can be paid.'
        );

        return;
      }

      if (
        selectedPaymentCount ===
        0
      ) {
        toast.error(
          'Select at least one unpaid employee to mark as paid.'
        );

        return;
      }

      setShowPayModal(
        true
      );
    };

  const handlePay =
    async () => {
      if (
        !displayedCycle
      ) {
        return;
      }

      if (
        selectedPaymentCount ===
        0
      ) {
        toast.error(
          'Select at least one unpaid employee.'
        );

        return;
      }

      try {
        setActionLoading(
          true
        );

        setError(null);

        /*
         * IMPORTANT:
         *
         * Only the selected employee IDs are sent.
         *
         * Employees already paid are never included.
         */
        await apiRequest(
          `/Payroll/${displayedCycle.id}/pay`,
          {
            method: 'POST',
            body: JSON.stringify({
              payrollRecordIds:
                selectedPaymentRecords.map(
                  record =>
                    record.id
                ),
            }),
          }
        );

        const paidCount =
          selectedPaymentCount;

        setSelectedPaymentRecordIds(
          []
        );

        setShowPayModal(
          false
        );

        toast.success(
          `${paidCount} employee${paidCount === 1 ? '' : 's'} marked as paid.`
        );

        /*
         * Reload the cycle so:
         *
         * - paid employees show Paid
         * - unpaid employees remain Unpaid
         * - cycle status becomes PartiallyPaid or Paid
         * - cycle becomes locked only when everybody is paid
         */
        await loadPayroll(
          displayedCycle.id
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to process payment.';

        setError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  /* =======================================================
     DELETE PAYROLL
  ======================================================= */

  const openDeleteModal =
    (
      cycle?: PayrollCycle
    ) => {
      const targetCycle =
        cycle ??
        displayedCycle;

      if (
        !targetCycle
      ) {
        return;
      }

      if (
        !Number.isInteger(
          targetCycle.id
        ) ||
        targetCycle.id <= 0
      ) {
        toast.error(
          'Invalid payroll cycle.'
        );

        return;
      }

      if (
        targetCycle.isLocked
      ) {
        toast.error(
          'Locked payroll cannot be deleted.'
        );

        return;
      }

      if (
        targetCycle.status !==
          'Draft' &&
        targetCycle.status !==
          'Rejected'
      ) {
        toast.error(
          'Only Draft or Rejected payroll can be deleted.'
        );

        return;
      }

      if (
        cycle &&
        cycle.id !==
          selectedCycleId
      ) {
        setSelectedCycleId(
          cycle.id
        );

        setRecords([]);

        setAdjustments([]);

        setSelectedPaymentRecordIds(
          []
        );
      }

      setShowDeleteModal(
        true
      );
    };

  const handleDeletePayroll =
    async () => {
      if (
        !displayedCycle
      ) {
        return;
      }

      if (
        !Number.isInteger(
          displayedCycle.id
        ) ||
        displayedCycle.id <= 0
      ) {
        toast.error(
          'Invalid payroll cycle.'
        );

        return;
      }

      if (
        displayedCycle.isLocked
      ) {
        toast.error(
          'Locked payroll cannot be deleted.'
        );

        return;
      }

      if (
        displayedCycle.status !==
          'Draft' &&
        displayedCycle.status !==
          'Rejected'
      ) {
        toast.error(
          'Only Draft or Rejected payroll can be deleted.'
        );

        return;
      }

      try {
        setActionLoading(
          true
        );

        setError(null);

        await deletePayroll(
          displayedCycle.id
        );

        const remainingCycles =
          payrollCycles.filter(
            cycle =>
              cycle.id !==
              displayedCycle.id
          );

        setPayrollCycles(
          remainingCycles
        );

        setRecords([]);

        setAdjustments([]);

        setSelectedPaymentRecordIds(
          []
        );

        setShowDeleteModal(
          false
        );

        const nextCycle =
          remainingCycles.find(
            cycle =>
              isCurrentMonthCycle(
                cycle
              )
          ) ??
          remainingCycles[0];

        if (
          nextCycle
        ) {
          setSelectedCycleId(
            nextCycle.id
          );

          await loadCycleRecords(
            nextCycle.id
          );
        } else {
          setSelectedCycleId(
            null
          );
        }

        toast.success(
          `${displayedCycle.monthYear} payroll deleted successfully.`
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to delete payroll.';

        setError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  /* =======================================================
     OPEN BONUS
  ======================================================= */

  const handleOpenBonus =
    async (
      record: PayrollRecord
    ) => {
      if (
        !displayedCycle ||
        displayedCycle.isLocked ||
        !canManageAdjustments
      ) {
        return;
      }

      if (
        displayedCycle.status !==
          'Draft' &&
        displayedCycle.status !==
          'Rejected'
      ) {
        toast.info(
          'Bonuses can only be added while payroll is in Draft or Rejected status.'
        );

        return;
      }

      try {
        setAdjustmentRecord(
          record
        );

        setAdjustmentAmount(
          ''
        );

        setAdjustmentReason(
          ''
        );

        const existing =
          await getPayrollAdjustments(
            displayedCycle.id
          );

        setAdjustments(
          existing
        );

        setShowBonusModal(
          true
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load payroll adjustments.';

        setError(
          message
        );

        toast.error(
          message
        );
      }
    };

  /* =======================================================
     OPEN DEDUCTION
  ======================================================= */

  const handleOpenDeduction =
    async (
      record: PayrollRecord
    ) => {
      if (
        !displayedCycle ||
        displayedCycle.isLocked ||
        !canManageAdjustments
      ) {
        return;
      }

      if (
        displayedCycle.status !==
          'Draft' &&
        displayedCycle.status !==
          'Rejected'
      ) {
        toast.info(
          'Deductions can only be added while payroll is in Draft or Rejected status.'
        );

        return;
      }

      try {
        setAdjustmentRecord(
          record
        );

        setAdjustmentAmount(
          ''
        );

        setAdjustmentReason(
          ''
        );

        const existing =
          await getPayrollAdjustments(
            displayedCycle.id
          );

        setAdjustments(
          existing
        );

        setShowDeductionModal(
          true
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load payroll adjustments.';

        setError(
          message
        );

        toast.error(
          message
        );
      }
    };

  /* =======================================================
     CLOSE ADJUSTMENT MODALS
  ======================================================= */

  const closeAdjustmentModals =
    () => {
      if (
        actionLoading
      ) {
        return;
      }

      setShowBonusModal(
        false
      );

      setShowDeductionModal(
        false
      );

      setAdjustmentRecord(
        null
      );

      setAdjustmentAmount(
        ''
      );

      setAdjustmentReason(
        ''
      );
    };

  /* =======================================================
     ADD BONUS
  ======================================================= */

  const handleAddBonus =
    async () => {
      if (
        !displayedCycle ||
        !adjustmentRecord
      ) {
        return;
      }

      const amount =
        Number(
          adjustmentAmount
        );

      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {
        toast.error(
          'Enter a valid bonus amount.'
        );

        return;
      }

      if (
        !adjustmentReason.trim()
      ) {
        toast.error(
          'Enter a reason for the bonus.'
        );

        return;
      }

      try {
        setActionLoading(
          true
        );

        setError(null);

        const request:
          CreatePayrollAdjustmentRequest = {
          userId:
            adjustmentRecord.userId,
          type:
            'Bonus',
          amount,
          reason:
            adjustmentReason.trim(),
        };

        await createPayrollAdjustment(
          displayedCycle.id,
          request
        );

        closeAdjustmentModals();

        toast.success(
          'Bonus added and sent for Company Admin approval.'
        );

        await loadPayroll(
          displayedCycle.id
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to add bonus.';

        setError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  /* =======================================================
     ADD DEDUCTION
  ======================================================= */

  const handleAddDeduction =
    async () => {
      if (
        !displayedCycle ||
        !adjustmentRecord
      ) {
        return;
      }

      const amount =
        Number(
          adjustmentAmount
        );

      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {
        toast.error(
          'Enter a valid deduction amount.'
        );

        return;
      }

      if (
        !adjustmentReason.trim()
      ) {
        toast.error(
          'Enter a reason for the deduction.'
        );

        return;
      }

      try {
        setActionLoading(
          true
        );

        setError(null);

        const request:
          CreatePayrollAdjustmentRequest = {
          userId:
            adjustmentRecord.userId,
          type:
            'Deduction',
          amount,
          reason:
            adjustmentReason.trim(),
        };

        await createPayrollAdjustment(
          displayedCycle.id,
          request
        );

        closeAdjustmentModals();

        toast.success(
          'Deduction added and sent for Company Admin approval.'
        );

        await loadPayroll(
          displayedCycle.id
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to add deduction.';

        setError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  /* =======================================================
     OPEN PENDING ADJUSTMENT
  ======================================================= */

  const handleOpenPendingAdjustment =
    (
      adjustment: PayrollAdjustment
    ) => {
      if (
        !canApproveAdjustments
      ) {
        return;
      }

      if (
        getAdjustmentStatus(
          adjustment
        ) !==
        'PendingApproval'
      ) {
        return;
      }

      setSelectedPendingAdjustment(
        adjustment
      );

      setShowAdjustmentApprovalModal(
        true
      );
    };

  /* =======================================================
     APPROVE ADJUSTMENT
  ======================================================= */

  const handleApproveAdjustment =
    async () => {
      if (
        !selectedPendingAdjustment
      ) {
        return;
      }

      if (
        getAdjustmentStatus(
          selectedPendingAdjustment
        ) !==
        'PendingApproval'
      ) {
        toast.info(
          'This adjustment is no longer pending approval.'
        );

        return;
      }

      try {
        setActionLoading(
          true
        );

        setError(null);

        await apiRequest(
          `/Payroll/adjustments/${selectedPendingAdjustment.id}/approve`,
          {
            method: 'POST',
          }
        );

        const employeeName =
          getAdjustmentEmployeeName(
            selectedPendingAdjustment,
            records
          );

        setShowAdjustmentApprovalModal(
          false
        );

        setSelectedPendingAdjustment(
          null
        );

        toast.success(
          `${selectedPendingAdjustment.type} for ${employeeName} approved successfully.`
        );

        if (
          displayedCycle
        ) {
          await loadPayroll(
            displayedCycle.id
          );
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to approve adjustment.';

        setError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  /* =======================================================
     OPEN ADJUSTMENT REJECTION
  ======================================================= */

  const openAdjustmentRejectModal =
    () => {
      if (
        !selectedPendingAdjustment
      ) {
        return;
      }

      setAdjustmentRejectionReason(
        ''
      );

      setShowAdjustmentApprovalModal(
        false
      );

      setShowAdjustmentRejectModal(
        true
      );
    };

  /* =======================================================
     REJECT ADJUSTMENT
  ======================================================= */

  const handleRejectAdjustment =
    async () => {
      if (
        !selectedPendingAdjustment
      ) {
        return;
      }

      if (
        !adjustmentRejectionReason.trim()
      ) {
        toast.error(
          'Enter a rejection reason.'
        );

        return;
      }

      try {
        setActionLoading(
          true
        );

        setError(null);

        await apiRequest(
          `/Payroll/adjustments/${selectedPendingAdjustment.id}/reject`,
          {
            method: 'POST',
            body: JSON.stringify({
              reason:
                adjustmentRejectionReason.trim(),
            }),
          }
        );

        const employeeName =
          getAdjustmentEmployeeName(
            selectedPendingAdjustment,
            records
          );

        setShowAdjustmentRejectModal(
          false
        );

        setSelectedPendingAdjustment(
          null
        );

        setAdjustmentRejectionReason(
          ''
        );

        toast.success(
          `${selectedPendingAdjustment.type} for ${employeeName} rejected.`
        );

        if (
          displayedCycle
        ) {
          await loadPayroll(
            displayedCycle.id
          );
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to reject adjustment.';

        setError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading &&
    payrollCycles.length ===
      0
  ) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 text-[#A78BFA] animate-spin" />
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error
  ) {
    return (
      <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300">

        <div className="font-semibold">
          Payroll Error
        </div>

        <div className="text-sm mt-1">
          {error}
        </div>

        <button
          onClick={() => {
            setError(
              null
            );

            void loadPayroll(
              selectedCycleId
            );
          }}
          className="mt-4 px-4 py-2 rounded-lg bg-[#5C3FE0] text-white text-xs font-semibold"
        >
          Retry
        </button>

      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ===================================================
          TOP BAR
      =================================================== */}

      <div className="p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          <div>

            <div className="flex items-center gap-2 flex-wrap">

              <h2 className="text-sm font-bold text-white">
                Monthly Payroll
              </h2>

              <span className="px-2 py-1 rounded-md bg-[#17123d] border border-[#2d2770] text-[10px] font-semibold text-[#A78BFA]">
                {branchScopeLabel}
              </span>

            </div>

            <p className="text-[11px] text-slate-400 mt-1">
              Generate, review, approve and process monthly employee payroll.
            </p>

          </div>

          <div className="flex gap-2">

            <button
              onClick={
                handleGeneratePayroll
              }
              disabled={
                actionLoading ||
                !canGenerateCurrentMonth
              }
              className="px-4 py-2 rounded-xl bg-[#5C3FE0] hover:bg-[#7152FF] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2"
            >

              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}

              {currentMonthCycle
                ? `${currentMonthLabel} Generated`
                : 'Generate Payroll'}

            </button>

            <button
              onClick={() => {
                setError(
                  null
                );

                void loadPayroll(
                  selectedCycleId
                );
              }}
              disabled={
                loading ||
                actionLoading
              }
              className="p-2 rounded-lg bg-[#17123d] border border-[#2d2770] text-slate-300 hover:text-white disabled:opacity-50"
              title="Refresh"
            >

              <RefreshCw
                className={`w-4 h-4 ${
                  loading
                    ? 'animate-spin'
                    : ''
                }`}
              />

            </button>

          </div>

        </div>

      </div>

      {/* ===================================================
          YEAR FILTER
      =================================================== */}

      <div className="p-4 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

          <div>

            <div className="text-sm font-bold text-white">
              Payroll History
            </div>

            <div className="text-[11px] text-slate-400 mt-1">
              Select a year to view its monthly payroll cycles.
            </div>

          </div>

          <div className="flex items-center gap-2">

            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
              Year
            </span>

            <select
              value={
                selectedPayrollYear
              }
              onChange={event =>
                void handleYearChange(
                  Number(
                    event.target.value
                  )
                )
              }
              disabled={
                actionLoading ||
                loading
              }
              className="
                min-w-[110px]
                px-3
                py-2
                rounded-xl
                bg-[#17123d]
                border
                border-[#2d2770]
                text-white
                text-xs
                font-bold
                outline-none
                cursor-pointer
                focus:border-[#5C3FE0]
                disabled:opacity-50
              "
            >

              {availablePayrollYears.map(
                year => (
                  <option
                    key={year}
                    value={year}
                    className="bg-[#120e38] text-white"
                  >
                    {year}
                  </option>
                )
              )}

            </select>

          </div>

        </div>

      </div>

      {/* ===================================================
          MONTHLY RULE
      =================================================== */}

      <div className="p-4 rounded-2xl bg-[#120e3b] border border-[#5C3FE0]/30">

        <div className="flex items-start gap-3">

          <div className="p-2 rounded-lg bg-[#5C3FE0]/20 shrink-0">

            <ShieldCheck className="w-4 h-4 text-[#A78BFA]" />

          </div>

          <div className="min-w-0">

            <div className="text-sm font-bold text-white">
              Monthly Payroll Rule
            </div>

            <div className="text-xs text-slate-400 mt-1 leading-5">
              Only one payroll can be generated for each month.
              Complete all employee payroll details and resolve
              every bonus/deduction approval before submitting.
              Employee payments can be processed in multiple batches.
            </div>

            {currentMonthCycle ? (
              <div className="mt-2 flex items-center gap-2 text-xs text-emerald-300 font-semibold">

                <CheckCircle2 className="w-3.5 h-3.5" />

                {currentMonthLabel} payroll has already been generated.
                Continue working on the existing payroll.

              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2 text-xs text-[#A78BFA] font-semibold">

                <Plus className="w-3.5 h-3.5" />

                {currentMonthLabel} payroll has not been generated yet.

              </div>
            )}

          </div>

        </div>

      </div>

      {/* ===================================================
          CYCLES
      =================================================== */}

      {filteredPayrollCycles.length > 0 ? (
        <div className="relative">

          <div className="flex items-center justify-between mb-3">

            <div>

              <div className="text-xs font-bold text-white">
                {selectedPayrollYear} Payroll
              </div>

              <div className="text-[10px] text-slate-500 mt-1">
                {filteredPayrollCycles.length}{' '}
                payroll month
                {filteredPayrollCycles.length === 1
                  ? ''
                  : 's'}
              </div>

            </div>

            <div className="text-[10px] text-slate-500">
              Scroll horizontally to view months →
            </div>

          </div>

          <div
            className="
              flex
              gap-4
              overflow-x-auto
              pb-4
              snap-x
              snap-mandatory
              [scrollbar-width:thin]
              [scrollbar-color:#3b327d_#120e38]
            "
          >

            {filteredPayrollCycles.map(
              cycle => (
                <div
                  key={cycle.id}
                  className={`flex-none w-[300px] snap-start text-left p-5 rounded-2xl border transition-all ${
                    selectedCycleId ===
                    cycle.id
                      ? 'bg-gradient-to-r from-[#120e3b] to-[#18124b] border-[#5C3FE0] shadow-lg shadow-[#5C3FE0]/20'
                      : 'bg-[#09071e] border-[#2d2770]/70 hover:border-[#5C3FE0]/50'
                  }`}
                >

                  <button
                    onClick={() =>
                      handleSelectCycle(
                        cycle.id
                      )
                    }
                    className="w-full text-left"
                  >

                    <div className="flex justify-between items-center gap-3">

                      <span className="text-sm font-bold text-white">
                        {cycle.monthYear}
                      </span>

                      <StatusBadge
                        status={
                          cycle.status
                        }
                      />

                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-5">

                      <Summary
                        label="Basic"
                        value={
                          Number(
                            cycle.totalBasicSalary ??
                            0
                          )
                        }
                      />

                      <Summary
                        label="Bonus"
                        value={
                          Number(
                            cycle.totalBonus ??
                            0
                          )
                        }
                      />

                      <Summary
                        label="Deductions"
                        value={
                          Number(
                            cycle.totalDeduction ??
                            0
                          )
                        }
                      />

                    </div>

                    <div className="mt-4 pt-4 border-t border-[#231e54]">

                      <span className="text-[10px] text-slate-400 block">
                        NET PAYROLL
                      </span>

                      <span className="text-xl font-black text-emerald-400">
                        ₹
                        {Number(
                          cycle.totalNetSalary ??
                          0
                        ).toLocaleString()}
                      </span>

                    </div>

                  </button>

                  {canDeletePayroll &&
                    !cycle.isLocked &&
                    (
                      cycle.status ===
                        'Draft' ||
                      cycle.status ===
                        'Rejected'
                    ) && (
                      <div className="mt-4 pt-4 border-t border-[#231e54]">

                        <button
                          onClick={event => {
                            event.stopPropagation();

                            openDeleteModal(
                              cycle
                            );
                          }}
                          disabled={
                            actionLoading
                          }
                          className="w-full px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/15 disabled:opacity-50 text-xs font-semibold flex items-center justify-center gap-2"
                        >

                          <Trash2 className="w-3.5 h-3.5" />

                          Delete Payroll

                        </button>

                      </div>
                    )}

                </div>
              )
            )}

          </div>

        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/70 text-center">

          <div className="text-sm font-bold text-white">
            No Payroll for {selectedPayrollYear}
          </div>

          <div className="text-[11px] text-slate-500 mt-1">
            No payroll cycle has been generated for this year.
          </div>

          {selectedPayrollYear ===
            currentYear &&
            !currentMonthCycle && isPayrollManager && (
              <button
                onClick={
                  handleGeneratePayroll
                }
                disabled={
                  actionLoading
                }
                className="mt-4 px-4 py-2 rounded-xl bg-[#5C3FE0] hover:bg-[#7152FF] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-2"
              >

                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}

                Generate {currentMonthLabel}

              </button>
            )}

        </div>
      )}

      {/* ===================================================
          WORKFLOW
      =================================================== */}

      {displayedCycle && (
        <div className="p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

            <div>

              <div className="text-white font-bold">
                {displayedCycle.monthYear}
              </div>

              <div className="text-xs text-slate-400 mt-1">
                Payroll workflow
              </div>

            </div>

            <div className="flex flex-wrap gap-2">

              {/* SUBMIT */}

              {isPayrollManager &&
                displayedCycle.status ===
                  'Draft' && (

                  <button
                    onClick={
                      openSubmitModal
                    }
                    disabled={
                      actionLoading ||
                      records.length ===
                        0 ||
                      pendingAdjustmentCount >
                        0
                    }
                    className="px-4 py-2 rounded-lg bg-[#5C3FE0] hover:bg-[#7152FF] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-2"
                  >

                    <Send className="w-3.5 h-3.5" />

                    Submit for Approval

                  </button>
                )}

              {/* COMPANY ADMIN APPROVAL */}

              {isCompanyAdmin &&
                displayedCycle.status ===
                  'SubmittedByHR' && (
                  <>

                    <button
                      onClick={
                        openRejectModal
                      }
                      disabled={
                        actionLoading
                      }
                      className="px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2"
                    >

                      <XCircle className="w-3.5 h-3.5" />

                      Reject

                    </button>

                    <button
                      onClick={
                        handleApprove
                      }
                      disabled={
                        actionLoading ||
                        pendingAdjustmentCount >
                          0
                      }
                      className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2"
                    >

                      {actionLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}

                      Approve Payroll

                    </button>

                  </>
                )}

              {/* PAYMENT */}

              {isPayrollManager &&
                (
                  displayedCycle.status ===
                    'ApprovedByCompanyAdmin' ||
                  displayedCycle.status ===
                    'PartiallyPaid'
                ) &&
                !displayedCycle.isLocked &&
                unpaidRecords.length >
                  0 && (

                  <button
                    onClick={
                      openPayModal
                    }
                    disabled={
                      actionLoading ||
                      selectedPaymentCount ===
                        0
                    }
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2"
                  >

                    <CheckCircle2 className="w-3.5 h-3.5" />

                    {selectedPaymentCount >
                    0
                      ? `Mark ${selectedPaymentCount} Selected as Paid`
                      : 'Mark Selected as Paid'}

                  </button>
                )}

              {/* LOCKED */}

              {displayedCycle.isLocked && (
                <div className="px-4 py-2 rounded-lg bg-slate-500/10 border border-slate-500/30 text-slate-300 text-xs flex items-center gap-2">

                  <Lock className="w-3.5 h-3.5" />

                  Locked

                </div>
              )}

            </div>

          </div>

          {/* PAYMENT PROGRESS */}

          {(
            (
              isPayrollManager &&
              displayedCycle.status ===
                'ApprovedByCompanyAdmin'
            ) ||
            displayedCycle.status ===
              'PartiallyPaid' ||
            displayedCycle.status ===
              'Paid'
          ) &&
            records.length >
              0 && (

            <div className="mt-5 p-4 rounded-xl bg-[#120e38] border border-[#231e54]">

              <div className="flex items-center justify-between gap-3">

                <div>

                  <div className="text-xs font-bold text-white">
                    Employee Payment Progress
                  </div>

                  <div className="text-[10px] text-slate-500 mt-1">
                    Paid employees remain paid. Only unpaid employees
                    can be selected for the next payment batch.
                  </div>

                </div>

                <div className="text-right">

                  <div className="text-lg font-black text-emerald-400">
                    {paidRecords.length}/{records.length}
                  </div>

                  <div className="text-[9px] text-slate-500">
                    {paymentProgress}% paid
                  </div>

                </div>

              </div>

              <div className="mt-3 h-2 rounded-full bg-[#09071e] overflow-hidden">

                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{
                    width: `${paymentProgress}%`,
                  }}
                />

              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">

                <div className="flex gap-4 text-[10px]">

                  <span className="text-emerald-400">
                    Paid: {paidRecords.length}
                  </span>

                  <span className="text-amber-400">
                    Unpaid: {unpaidRecords.length}
                  </span>

                  <span className="text-[#A78BFA]">
                    Selected: {selectedPaymentCount}
                  </span>

                </div>

                {payableRecords.length >
                  0 &&
                  !displayedCycle.isLocked && (
                    <button
                      type="button"
                      onClick={
                        handleSelectAllUnpaid
                      }
                      className="text-[10px] font-semibold text-[#A78BFA] hover:text-white"
                    >
                      {allUnpaidSelected
                        ? 'Clear Selection'
                        : 'Select All Unpaid'}
                    </button>
                  )}

              </div>

            </div>
          )}

          {/* PENDING ADJUSTMENT BLOCKER */}

          {pendingAdjustmentCount >
            0 && (
            <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">

              <div className="flex items-start gap-3">

                <Clock3 className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />

                <div>

                  <div className="text-sm font-bold text-amber-300">
                    Pending Adjustment Approval
                  </div>

                  <div className="text-xs text-amber-200/80 mt-1 leading-5">

                    {pendingAdjustmentCount}{' '}
                    bonus/deduction adjustment
                    {pendingAdjustmentCount ===
                    1
                      ? ''
                      : 's'}{' '}
                    are waiting for Company Admin approval.

                    Payroll submission is blocked until
                    every pending adjustment is approved
                    or rejected.

                  </div>

                </div>

              </div>

            </div>
          )}

          {/* DRAFT INFORMATION */}

          {displayedCycle.status ===
            'Draft' && (
            <div className="mt-4 p-3 rounded-xl bg-[#120e38] border border-[#231e54]">

              <div className="flex items-start gap-2">

                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />

                <div className="text-[11px] text-slate-400 leading-5">

                  All employee payroll records are submitted
                  automatically. There is no employee selection
                  during payroll submission.

                  {pendingAdjustmentCount >
                    0 && (
                    <>
                      {' '}
                      There are currently{' '}
                      <span className="text-amber-300 font-bold">
                        {pendingAdjustmentCount}
                      </span>{' '}
                      pending adjustment
                      {pendingAdjustmentCount ===
                      1
                        ? ''
                        : 's'}.
                    </>
                  )}

                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* ===================================================
          RECORDS
      =================================================== */}

      <PayrollRecordsTable
        records={
          records
        }
        adjustments={
          adjustments
        }
        canEdit={
          canManageAdjustments &&
          !displayedCycle?.isLocked &&
          (
            displayedCycle?.status ===
              'Draft' ||
            displayedCycle?.status ===
              'Rejected'
          )
        }
        canApproveAdjustments={
          canApproveAdjustments
        }
        canPay={
          isPayrollManager &&
          !displayedCycle?.isLocked &&
          (
            displayedCycle?.status ===
              'ApprovedByCompanyAdmin' ||
            displayedCycle?.status ===
              'PartiallyPaid'
          )
        }
        selectedPaymentRecordIds={
          selectedPaymentRecordIds
        }
        onPaymentSelectionChange={
          handlePaymentSelectionChange
        }
        onAddBonus={
          handleOpenBonus
        }
        onAddDeduction={
          handleOpenDeduction
        }
        onPendingAdjustmentClick={
          handleOpenPendingAdjustment
        }
      />

      {/* ===================================================
          SUBMIT MODAL
      =================================================== */}

      {showSubmitModal &&
        displayedCycle && (
          <ConfirmationModal
            title="Submit Payroll for Approval"
            icon={
              <Send className="w-5 h-5 text-[#A78BFA]" />
            }
            iconClass="bg-[#5C3FE0]/15 border-[#5C3FE0]/30"
            message={
              `You are about to submit the ${displayedCycle.monthYear} payroll for Company Admin approval.`
            }
            details={[
              {
                label:
                  'Employees',
                value:
                  `${records.length}`,
              },
              {
                label:
                  'Payment Selection',
                value:
                  'Not applicable',
              },
              {
                label:
                  'Pending Adjustments',
                value:
                  `${pendingAdjustmentCount}`,
              },
              {
                label:
                  'Basic Salary',
                value:
                  formatCurrency(
                    displayedCycle.totalBasicSalary
                  ),
              },
              {
                label:
                  'Bonus',
                value:
                  formatCurrency(
                    displayedCycle.totalBonus
                  ),
              },
              {
                label:
                  'Deductions',
                value:
                  formatCurrency(
                    displayedCycle.totalDeduction
                  ),
              },
              {
                label:
                  'Net Payroll',
                value:
                  formatCurrency(
                    displayedCycle.totalNetSalary
                  ),
              },
            ]}
            warning={
              'All employee payroll records in this cycle will be submitted automatically. Employee payment is handled separately after approval.'
            }
            confirmText="Submit for Approval"
            cancelText="Cancel"
            loading={
              actionLoading
            }
            onCancel={() =>
              setShowSubmitModal(
                false
              )
            }
            onConfirm={
              handleSubmit
            }
          />
        )}

      {/* ===================================================
          DELETE MODAL
      =================================================== */}

      {showDeleteModal &&
        displayedCycle && (
          <ConfirmationModal
            title="Delete Payroll"
            icon={
              <Trash2 className="w-5 h-5 text-rose-400" />
            }
            iconClass="bg-rose-500/10 border-rose-500/30"
            message={
              `Delete the ${displayedCycle.monthYear} payroll?`
            }
            details={[
              {
                label:
                  'Payroll',
                value:
                  displayedCycle.monthYear,
              },
              {
                label:
                  'Status',
                value:
                  displayedCycle.status,
              },
              {
                label:
                  'Employees',
                value:
                  `${records.length}`,
              },
              {
                label:
                  'Net Payroll',
                value:
                  formatCurrency(
                    displayedCycle.totalNetSalary
                  ),
              },
            ]}
            warning={
              'This will permanently remove the payroll cycle, employee payroll records, bonuses and deductions. This action cannot be undone.'
            }
            confirmText="Delete Payroll"
            cancelText="Cancel"
            loading={
              actionLoading
            }
            danger
            onCancel={() =>
              setShowDeleteModal(
                false
              )
            }
            onConfirm={
              handleDeletePayroll
            }
          />
        )}

      {/* ===================================================
          PAY SELECTED MODAL
      =================================================== */}

      {showPayModal &&
        displayedCycle && (
          <ConfirmationModal
            title="Mark Selected Employees as Paid"
            icon={
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            }
            iconClass="bg-emerald-500/10 border-emerald-500/30"
            message={
              `Mark ${selectedPaymentCount} selected employee${selectedPaymentCount === 1 ? '' : 's'} as paid for ${displayedCycle.monthYear}?`
            }
            details={[
              {
                label:
                  'Total Employees',
                value:
                  `${records.length}`,
              },
              {
                label:
                  'Already Paid',
                value:
                  `${paidRecords.length}`,
              },
              {
                label:
                  'Selected Now',
                value:
                  `${selectedPaymentCount}`,
              },
              {
                label:
                  'Remaining Unpaid',
                value:
                  `${Math.max(
                    unpaidRecords.length -
                      selectedPaymentCount,
                    0
                  )}`,
              },
            ]}
            warning={
              'Only the selected employees will be marked as paid. Other unpaid employees will remain unpaid and can be selected in a later payment batch. The payroll will be locked only after every employee has been paid.'
            }
            confirmText="Mark Selected as Paid"
            cancelText="Cancel"
            loading={
              actionLoading
            }
            onCancel={() =>
              setShowPayModal(
                false
              )
            }
            onConfirm={
              handlePay
            }
          />
        )}

      {/* ===================================================
          PAYROLL REJECT MODAL
      =================================================== */}

      {showRejectModal &&
        displayedCycle && (
          <RejectModal
            payrollName={
              displayedCycle.monthYear
            }
            reason={
              rejectionReason
            }
            loading={
              actionLoading
            }
            onReasonChange={
              setRejectionReason
            }
            onClose={() => {
              if (
                actionLoading
              ) {
                return;
              }

              setShowRejectModal(
                false
              );

              setRejectionReason(
                ''
              );
            }}
            onReject={
              handleReject
            }
          />
        )}

      {/* ===================================================
          BONUS MODAL
      =================================================== */}

      {showBonusModal &&
        adjustmentRecord && (
          <BonusModal
            record={
              adjustmentRecord
            }
            adjustments={
              adjustments.filter(
                adjustment =>
                  adjustment.userId ===
                  adjustmentRecord.userId
              )
            }
            amount={
              adjustmentAmount
            }
            reason={
              adjustmentReason
            }
            loading={
              actionLoading
            }
            onAmountChange={
              setAdjustmentAmount
            }
            onReasonChange={
              setAdjustmentReason
            }
            onClose={
              closeAdjustmentModals
            }
            onSave={
              handleAddBonus
            }
          />
        )}

      {/* ===================================================
          DEDUCTION MODAL
      =================================================== */}

      {showDeductionModal &&
        adjustmentRecord && (
          <DeductionModal
            record={
              adjustmentRecord
            }
            adjustments={
              adjustments.filter(
                adjustment =>
                  adjustment.userId ===
                  adjustmentRecord.userId
              )
            }
            amount={
              adjustmentAmount
            }
            reason={
              adjustmentReason
            }
            loading={
              actionLoading
            }
            onAmountChange={
              setAdjustmentAmount
            }
            onReasonChange={
              setAdjustmentReason
            }
            onClose={
              closeAdjustmentModals
            }
            onSave={
              handleAddDeduction
            }
          />
        )}

      {/* ===================================================
          ADJUSTMENT APPROVAL MODAL
      =================================================== */}

      {showAdjustmentApprovalModal &&
        selectedPendingAdjustment && (
          <AdjustmentApprovalModal
            adjustment={
              selectedPendingAdjustment
            }
            employeeName={
              getAdjustmentEmployeeName(
                selectedPendingAdjustment,
                records
              )
            }
            loading={
              actionLoading
            }
            onClose={() => {
              if (
                actionLoading
              ) {
                return;
              }

              setShowAdjustmentApprovalModal(
                false
              );

              setSelectedPendingAdjustment(
                null
              );
            }}
            onApprove={
              handleApproveAdjustment
            }
            onReject={
              openAdjustmentRejectModal
            }
          />
        )}

      {/* ===================================================
          ADJUSTMENT REJECTION MODAL
      =================================================== */}

      {showAdjustmentRejectModal &&
        selectedPendingAdjustment && (
          <AdjustmentRejectModal
            adjustment={
              selectedPendingAdjustment
            }
            employeeName={
              getAdjustmentEmployeeName(
                selectedPendingAdjustment,
                records
              )
            }
            reason={
              adjustmentRejectionReason
            }
            loading={
              actionLoading
            }
            onReasonChange={
              setAdjustmentRejectionReason
            }
            onClose={() => {
              if (
                actionLoading
              ) {
                return;
              }

              setShowAdjustmentRejectModal(
                false
              );

              setAdjustmentRejectionReason(
                ''
              );

              setShowAdjustmentApprovalModal(
                true
              );
            }}
            onReject={
              handleRejectAdjustment
            }
          />
        )}

    </div>
  );
};

export default MonthlyPayrollPage;