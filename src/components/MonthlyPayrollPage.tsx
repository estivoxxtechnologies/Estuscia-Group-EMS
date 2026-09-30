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
  Gift,
  MinusCircle,
  AlertTriangle,
  ShieldCheck,
  Clock3,
  CircleCheck,
  CircleX,
} from 'lucide-react';

import { toast } from 'react-toastify';

import { useApp } from '../context/AppContext';

import {
  getPayrollCycles,
  getPayrollRecords,
  generatePayroll,
  approvePayroll,
  rejectPayroll,
  payPayroll,
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
  | 'Approved'
  | 'Rejected';

type AdjustmentWithOptionalStatus =
  PayrollAdjustment & {
    status?: AdjustmentStatus | string | number;
  };

interface AdjustmentRejectTarget {
  adjustment: PayrollAdjustment;
}

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

  const [selectedRecordIds, setSelectedRecordIds] =
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
   *
   * Branch Manager is intentionally excluded because
   * the current backend permission model does not allow
   * them to create payroll adjustments.
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

  const currentMonthCycle =
    useMemo(
      () =>
        payrollCycles.find(
          cycle =>
            isCurrentMonthCycle(cycle)
        ),
      [
        payrollCycles,
        isCurrentMonthCycle,
      ]
    );

  const canGenerateCurrentMonth =
    !currentMonthCycle;

  /* =======================================================
     RECORD SELECTION
  ======================================================= */

  const allRecordsSelected =
    records.length > 0 &&
    records.every(
      record =>
        selectedRecordIds.includes(
          record.id
        )
    );

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

    /*
     * Normal API response.
     */
    if (
      value === 'PendingApproval' ||
      value === 'Approved' ||
      value === 'Rejected'
    ) {
      return value;
    }

    /*
     * Numeric enum compatibility.
     *
     * PayrollAdjustmentStatus:
     * 1 = PendingApproval
     * 2 = Approved
     * 3 = Rejected
     */
    if (value === 1 || value === '1') {
      return 'PendingApproval';
    }

    if (value === 2 || value === '2') {
      return 'Approved';
    }

    if (value === 3 || value === '3') {
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
            ) === 'PendingApproval'
        ),
      [
        adjustments,
      ]
    );

  const pendingAdjustmentCount =
    pendingAdjustments.length;

  const getPendingAdjustmentsForUser = (
    userId: number
  ) =>
    pendingAdjustments.filter(
      adjustment =>
        adjustment.userId === userId
    );

  /* =======================================================
     LOAD CYCLE RECORDS
  ======================================================= */

  const loadCycleRecords = useCallback(
    async (
      cycleId: number
    ) => {
      if (
        !Number.isInteger(cycleId) ||
        cycleId <= 0
      ) {
        setRecords([]);
        setAdjustments([]);
        return;
      }

      const cycleRecords =
        await getPayrollRecords(
          cycleId
        );

      setRecords(
        cycleRecords
      );

      const cycleAdjustments =
        await getPayrollAdjustments(
          cycleId
        );

      setAdjustments(
        cycleAdjustments
      );

      setSelectedRecordIds([]);
    },
    []
  );

  /* =======================================================
     LOAD PAYROLL CYCLES
  ======================================================= */

  const loadPayroll = useCallback(
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
          setSelectedCycleId(null);
          return;
        }

        /*
         * IMPORTANT:
         *
         * Never use undefined as a cycle ID.
         *
         * If the caller gives an invalid ID, ignore it.
         */
        const safePreferredCycleId =
          Number.isInteger(
            preferredCycleId
          ) &&
          Number(preferredCycleId) > 0
            ? Number(preferredCycleId)
            : null;

        const preferredExists =
          safePreferredCycleId !== null &&
          cycles.some(
            cycle =>
              cycle.id ===
              safePreferredCycleId
          );

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

        /*
         * Final safety check.
         */
        if (
          !Number.isInteger(
            cycleId
          ) ||
          cycleId <= 0
        ) {
          setRecords([]);
          setAdjustments([]);
          setSelectedCycleId(null);
          return;
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

        setError(message);

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
     * Do not retain the old branch's cycle ID when
     * All Branches / another branch is selected.
     *
     * This is what prevents stale/undefined cycle requests.
     */
    setSelectedCycleId(null);
    setRecords([]);
    setAdjustments([]);
    setSelectedRecordIds([]);

    void loadPayroll(null);
  }, [
    currentUser,
    effectiveBranchId,
    loadPayroll,
  ]);

  /* =======================================================
     MANUAL CYCLE SELECTION
  ======================================================= */

  const handleSelectCycle = async (
    cycleId: number
  ) => {
    /*
     * Never allow undefined/null/invalid IDs.
     */
    if (
      !Number.isInteger(cycleId) ||
      cycleId <= 0
    ) {
      return;
    }

    const exists =
      payrollCycles.some(
        cycle =>
          cycle.id === cycleId
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

      await loadCycleRecords(
        cycleId
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to load payroll cycle.';

      setError(message);

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
      /*
       * Frontend duplicate protection.
       */
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
        setActionLoading(true);
        setError(null);

        const cycle =
          await generatePayroll(
            now.getFullYear(),
            now.getMonth() + 1,
            effectiveBranchId
          );

        setPayrollCycles(
          prev => [
            cycle,
            ...prev.filter(
              x =>
                x.id !==
                cycle.id
            ),
          ]
        );

        /*
         * Safe ID validation.
         */
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

        setSelectedCycleId(
          cycle.id
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

        setError(message);

        toast.error(
          message
        );
      } finally {
        setActionLoading(false);
      }
    };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const openSubmitModal =
    () => {
      if (!displayedCycle) {
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
        !allRecordsSelected
      ) {
        toast.error(
          'Select all employee payroll records before submitting the payroll.'
        );

        return;
      }

      /*
       * CRITICAL:
       *
       * Pending bonus/deduction adjustments must be
       * approved or rejected before payroll submission.
       */
      if (
        pendingAdjustmentCount > 0
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
      if (!displayedCycle) {
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
        !allRecordsSelected
      ) {
        toast.error(
          'All employee payroll records must be selected before submission.'
        );

        return;
      }

      if (
        pendingAdjustmentCount > 0
      ) {
        toast.error(
          'Pending bonus/deduction adjustments must be approved or rejected before payroll submission.'
        );

        return;
      }

      try {
        setActionLoading(true);
        setError(null);

        const userIds =
          selectedRecordIds
            .map(
              id =>
                records.find(
                  record =>
                    record.id ===
                    id
                )?.userId
            )
            .filter(
              (
                id
              ): id is number =>
                typeof id ===
                'number'
            );

        await apiRequest(
          `/Payroll/${displayedCycle.id}/submit`,
          {
            method: 'POST',
            body: JSON.stringify({
              userIds,
            }),
          }
        );

        setShowSubmitModal(
          false
        );

        setSelectedRecordIds(
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

        setError(message);

        toast.error(
          message
        );
      } finally {
        setActionLoading(false);
      }
    };

  /* =======================================================
     APPROVE PAYROLL
  ======================================================= */

  const handleApprove =
    async () => {
      if (!displayedCycle) {
        return;
      }

      try {
        setActionLoading(true);
        setError(null);

        const updated =
          await approvePayroll(
            displayedCycle.id
          );

        setPayrollCycles(
          prev =>
            prev.map(
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

        setError(message);

        toast.error(
          message
        );
      } finally {
        setActionLoading(false);
      }
    };

  /* =======================================================
     REJECT PAYROLL
  ======================================================= */

  const openRejectModal =
    () => {
      if (!displayedCycle) {
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
      if (!displayedCycle) {
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
        setActionLoading(true);
        setError(null);

        const updated =
          await rejectPayroll(
            displayedCycle.id,
            rejectionReason.trim()
          );

        setPayrollCycles(
          prev =>
            prev.map(
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

        setError(message);

        toast.error(
          message
        );
      } finally {
        setActionLoading(false);
      }
    };

  /* =======================================================
     PAY
  ======================================================= */

  const openPayModal =
    () => {
      if (!displayedCycle) {
        return;
      }

      if (
        displayedCycle.status !==
          'Approved' &&
        displayedCycle.status !==
          'ApprovedByCompanyAdmin'
      ) {
        toast.error(
          'Only approved payroll can be marked as paid.'
        );

        return;
      }

      setShowPayModal(
        true
      );
    };

  const handlePay =
    async () => {
      if (!displayedCycle) {
        return;
      }

      try {
        setActionLoading(true);
        setError(null);

        const updated =
          await payPayroll(
            displayedCycle.id
          );

        setPayrollCycles(
          prev =>
            prev.map(
              cycle =>
                cycle.id ===
                updated.id
                  ? updated
                  : cycle
            )
        );

        setShowPayModal(
          false
        );

        toast.success(
          `${displayedCycle.monthYear} payroll marked as paid and locked.`
        );

        await loadPayroll(
          displayedCycle.id
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to process payment.';

        setError(message);

        toast.error(
          message
        );
      } finally {
        setActionLoading(false);
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

      if (!targetCycle) {
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
      }

      setShowDeleteModal(
        true
      );
    };

  const handleDeletePayroll =
    async () => {
      if (!displayedCycle) {
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
        setActionLoading(true);
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
        setSelectedRecordIds([]);

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

        if (nextCycle) {
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

        setError(message);

        toast.error(
          message
        );
      } finally {
        setActionLoading(false);
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

        setError(message);

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

        setError(message);

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
      if (actionLoading) {
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
        setActionLoading(true);
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

        setError(message);

        toast.error(
          message
        );
      } finally {
        setActionLoading(false);
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
        setActionLoading(true);
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

        setError(message);

        toast.error(
          message
        );
      } finally {
        setActionLoading(false);
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
        setActionLoading(true);
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

        setError(message);

        toast.error(
          message
        );
      } finally {
        setActionLoading(false);
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
        setActionLoading(true);
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

        setError(message);

        toast.error(
          message
        );
      } finally {
        setActionLoading(false);
      }
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading &&
    payrollCycles.length === 0
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

  if (error) {
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
            setError(null);
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
                setError(null);
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

      {payrollCycles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {payrollCycles.map(
            cycle => (
              <div
                key={cycle.id}
                className={`text-left p-5 rounded-2xl border transition-all ${
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

                  <div className="flex justify-between items-center">

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

              {/* COMPANY ADMIN PAYROLL APPROVAL */}

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

              {/* PAY */}

              {isPayrollManager &&
                (
                  displayedCycle.status ===
                    'Approved' ||
                  displayedCycle.status ===
                    'ApprovedByCompanyAdmin'
                ) && (
                  <button
                    onClick={
                      openPayModal
                    }
                    disabled={
                      actionLoading
                    }
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2"
                  >

                    <CheckCircle2 className="w-3.5 h-3.5" />

                    Mark Paid & Lock

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

                  Before submission, select every employee
                  payroll record and make sure all bonus and
                  deduction adjustments have been resolved.

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
        selectedRecordIds={
          selectedRecordIds
        }
        onSelectionChange={
          setSelectedRecordIds
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
                  'Selected',
                value:
                  `${selectedRecordIds.length}`,
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
              'After submission, HR cannot continue editing this payroll unless Company Admin rejects it.'
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
          PAY MODAL
      =================================================== */}

      {showPayModal &&
        displayedCycle && (
          <ConfirmationModal
            title="Mark Payroll as Paid"
            icon={
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            }
            iconClass="bg-emerald-500/10 border-emerald-500/30"
            message={
              `Mark the ${displayedCycle.monthYear} payroll as paid?`
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
                  'Net Payroll',
                value:
                  formatCurrency(
                    displayedCycle.totalNetSalary
                  ),
              },
            ]}
            warning={
              'Once marked as paid, this payroll will be locked and no further payroll changes will be allowed.'
            }
            confirmText="Mark Paid & Lock"
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

/* =========================================================
   PAYROLL RECORD TABLE
========================================================= */

const PayrollRecordsTable: React.FC<{
  records: PayrollRecord[];
  adjustments: PayrollAdjustment[];
  canEdit: boolean;
  canApproveAdjustments: boolean;
  selectedRecordIds: number[];
  onSelectionChange: React.Dispatch<
    React.SetStateAction<number[]>
  >;
  onAddBonus: (
    record: PayrollRecord
  ) => void;
  onAddDeduction: (
    record: PayrollRecord
  ) => void;
  onPendingAdjustmentClick: (
    adjustment: PayrollAdjustment
  ) => void;
}> = ({
  records,
  adjustments,
  canEdit,
  canApproveAdjustments,
  selectedRecordIds,
  onSelectionChange,
  onAddBonus,
  onAddDeduction,
  onPendingAdjustmentClick,
}) => {
  const getAdjustmentStatus = (
    adjustment: PayrollAdjustment
  ): AdjustmentStatus => {
    const value =
      (
        adjustment as AdjustmentWithOptionalStatus
      ).status;

    if (
      value === 'PendingApproval' ||
      value === 'Approved' ||
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
      return 'Approved';
    }

    if (
      value === 3 ||
      value === '3'
    ) {
      return 'Rejected';
    }

    return 'PendingApproval';
  };

  const getPendingForUser = (
    userId: number
  ) =>
    adjustments.filter(
      adjustment =>
        adjustment.userId ===
          userId &&
        getAdjustmentStatus(
          adjustment
        ) ===
          'PendingApproval'
    );

  const allSelected =
    records.length > 0 &&
    records.every(
      record =>
        selectedRecordIds.includes(
          record.id
        )
    );

  const toggleAll =
    () => {
      if (
        allSelected
      ) {
        onSelectionChange(
          []
        );
      } else {
        onSelectionChange(
          records.map(
            record =>
              record.id
          )
        );
      }
    };

  const toggleOne =
    (
      id: number
    ) => {
      onSelectionChange(
        previous =>
          previous.includes(
            id
          )
            ? previous.filter(
                x =>
                  x !== id
              )
            : [
                ...previous,
                id,
              ]
      );
    };

  return (
    <div className="rounded-2xl border border-[#2d2770]/80 bg-[#09071e] overflow-hidden">

      <div className="p-4 border-b border-[#231e54] flex items-center justify-between gap-3">

        <div>

          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Employee Payroll
          </h2>

          <p className="text-[11px] text-slate-400 mt-1">
            Complete every employee record before submitting payroll.
            Pending bonuses and deductions require Company Admin approval.
          </p>

        </div>

        <div className="text-[11px] text-[#A78BFA] font-semibold whitespace-nowrap">
          {selectedRecordIds.length}
          {' / '}
          {records.length}
          {' selected'}
        </div>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-left text-xs">

          <thead className="bg-[#120e38] text-slate-400">

            <tr>

              <th className="p-3.5 w-10">

                <input
                  type="checkbox"
                  checked={
                    allSelected
                  }
                  onChange={
                    toggleAll
                  }
                  disabled={
                    !canEdit ||
                    records.length ===
                      0
                  }
                  className="accent-[#5C3FE0]"
                />

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
                Status
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

                return (
                  <tr
                    key={
                      record.id
                    }
                    className="hover:bg-[#140f3d]/60"
                  >

                    {/* CHECKBOX */}

                    <td className="p-3.5 align-top">

                      <input
                        type="checkbox"
                        checked={
                          selectedRecordIds.includes(
                            record.id
                          )
                        }
                        onChange={() =>
                          toggleOne(
                            record.id
                          )
                        }
                        disabled={
                          !canEdit ||
                          record.isLocked
                        }
                        className="accent-[#5C3FE0]"
                      />

                    </td>

                    {/* EMPLOYEE */}

                    <td className="p-3.5 align-top">

                      <div className="font-bold text-white">
                        {record.employeeName ||
                          '-'}
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono">
                        {record.employeeCode ||
                          '-'}
                      </div>

                    </td>

                    {/* BASE */}

                    <td className="p-3.5 align-top font-mono text-slate-200">

                      ₹
                      {Number(
                        record.basicSalary ??
                          0
                      ).toLocaleString()}

                    </td>

                    {/* BONUS */}

                    <td className="p-3.5 align-top">

                      <div className="font-mono text-emerald-400">
                        ₹
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

                    {/* DEDUCTION */}

                    <td className="p-3.5 align-top">

                      <div className="font-mono text-rose-300">
                        ₹
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

                    {/* NET */}

                    <td className="p-3.5 align-top font-mono font-bold text-white">

                      ₹
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

                    {/* STATUS */}

                    <td className="p-3.5 align-top">

                      <StatusBadge
                        status={
                          record.status
                        }
                      />

                    </td>

                    {/* ACTIONS */}

                    <td className="p-3.5 align-top">

                      {canEdit &&
                      !record.isLocked ? (
                        <div className="flex flex-wrap gap-2">

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

                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">
                          {record.isLocked
                            ? 'Locked'
                            : 'View only'}
                        </span>
                      )}

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

/* =========================================================
   PENDING ADJUSTMENT BADGE
========================================================= */

const PendingAdjustmentBadge: React.FC<{
  adjustment: PayrollAdjustment;
  canApprove: boolean;
  onClick: () => void;
}> = ({
  adjustment,
  canApprove,
  onClick,
}) => {
  const isBonus =
    adjustment.type ===
    'Bonus';

  const content = (
    <div
      className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border ${
        isBonus
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-rose-500/5 border-rose-500/20'
      }`}
    >

      <div className="flex items-center gap-1.5 min-w-0">

        <Clock3
          className={`w-3 h-3 shrink-0 ${
            isBonus
              ? 'text-emerald-400'
              : 'text-rose-400'
          }`}
        />

        <span className="text-[9px] font-bold text-amber-300 whitespace-nowrap">
          Pending Approval
        </span>

      </div>

      <span
        className={`text-[9px] font-mono font-bold ${
          isBonus
            ? 'text-emerald-300'
            : 'text-rose-300'
        }`}
      >
        {isBonus
          ? '+'
          : '-'}
        ₹
        {Number(
          adjustment.amount ??
            0
        ).toLocaleString()}
      </span>

    </div>
  );

  if (
    !canApprove
  ) {
    return (
      <div>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="w-full text-left hover:opacity-80 transition-opacity"
      title="Click to review this adjustment"
    >
      {content}
    </button>
  );
};

/* =========================================================
   ADJUSTMENT APPROVAL MODAL
========================================================= */

const AdjustmentApprovalModal: React.FC<{
  adjustment: PayrollAdjustment;
  employeeName: string;
  loading: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}> = ({
  adjustment,
  employeeName,
  loading,
  onClose,
  onApprove,
  onReject,
}) => {
  const isBonus =
    adjustment.type ===
    'Bonus';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">

      <div className="w-full max-w-lg rounded-2xl bg-[#0b0824] border border-[#2d2770] shadow-2xl">

        <div className="p-5 border-b border-[#231e54] flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div
              className={`p-2 rounded-xl border ${
                isBonus
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              {isBonus ? (
                <Gift className="w-5 h-5 text-emerald-400" />
              ) : (
                <MinusCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>

            <div>

              <h2 className="text-white font-bold">
                Review Adjustment
              </h2>

              <p className="text-[11px] text-slate-400 mt-1">
                Company Admin approval required
              </p>

            </div>

          </div>

          <button
            onClick={
              onClose
            }
            disabled={
              loading
            }
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
          </button>

        </div>

        <div className="p-5 space-y-4">

          <div className="rounded-xl bg-[#120e38] border border-[#231e54] overflow-hidden">

            <DetailRow
              label="Employee"
              value={
                employeeName
              }
            />

            <DetailRow
              label="Type"
              value={
                adjustment.type
              }
            />

            <DetailRow
              label="Amount"
              value={
                `${isBonus ? '+' : '-'}₹${Number(
                  adjustment.amount ??
                    0
                ).toLocaleString()}`
              }
              valueClass={
                isBonus
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }
            />

            <DetailRow
              label="Status"
              value="Pending Approval"
              valueClass="text-amber-300"
            />

            <DetailRow
              label="Reason"
              value={
                adjustment.reason ||
                '-'
              }
            />

          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">

            <div className="flex items-start gap-2">

              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />

              <div className="text-[11px] text-amber-300 leading-5">

                This adjustment is currently excluded from
                the employee's Net Salary. Approving it will
                update the payroll totals.

              </div>

            </div>

          </div>

        </div>

        <div className="p-5 border-t border-[#231e54] flex justify-end gap-2">

          <button
            onClick={
              onClose
            }
            disabled={
              loading
            }
            className="px-4 py-2 rounded-lg bg-[#17123d] border border-[#2d2770] text-slate-300 hover:text-white text-xs font-semibold disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={
              onReject
            }
            disabled={
              loading
            }
            className="px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/15 text-xs font-bold flex items-center gap-2 disabled:opacity-50"
          >

            <XCircle className="w-3.5 h-3.5" />

            Reject

          </button>

          <button
            onClick={
              onApprove
            }
            disabled={
              loading
            }
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"
          >

            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}

            Approve

          </button>

        </div>

      </div>

    </div>
  );
};

/* =========================================================
   ADJUSTMENT REJECT MODAL
========================================================= */

const AdjustmentRejectModal: React.FC<{
  adjustment: PayrollAdjustment;
  employeeName: string;
  reason: string;
  loading: boolean;
  onReasonChange: (
    value: string
  ) => void;
  onClose: () => void;
  onReject: () => void;
}> = ({
  adjustment,
  employeeName,
  reason,
  loading,
  onReasonChange,
  onClose,
  onReject,
}) => (
  <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">

    <div className="w-full max-w-lg rounded-2xl bg-[#0b0824] border border-rose-500/30 shadow-2xl">

      <div className="p-5 border-b border-[#231e54] flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">

            <XCircle className="w-5 h-5 text-rose-400" />

          </div>

          <div>

            <h2 className="text-white font-bold">
              Reject Adjustment
            </h2>

            <p className="text-[11px] text-slate-400 mt-1">
              {employeeName}
              {' • '}
              {adjustment.type}
            </p>

          </div>

        </div>

        <button
          onClick={
            onClose
          }
          disabled={
            loading
          }
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
        </button>

      </div>

      <div className="p-5 space-y-4">

        <div className="rounded-xl bg-[#120e38] border border-[#231e54] overflow-hidden">

          <DetailRow
            label="Employee"
            value={
              employeeName
            }
          />

          <DetailRow
            label="Type"
            value={
              adjustment.type
            }
          />

          <DetailRow
            label="Amount"
            value={
              `${adjustment.type === 'Bonus' ? '+' : '-'}₹${Number(
                adjustment.amount ??
                  0
              ).toLocaleString()}`
            }
          />

          <DetailRow
            label="Original Reason"
            value={
              adjustment.reason ||
              '-'
            }
          />

        </div>

        <div>

          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Rejection Reason
          </label>

          <textarea
            value={
              reason
            }
            onChange={event =>
              onReasonChange(
                event.target.value
              )
            }
            rows={4}
            autoFocus
            placeholder="Enter why this bonus/deduction is being rejected..."
            className="w-full px-3 py-3 rounded-xl bg-[#09071e] border border-[#2d2770] text-white placeholder:text-slate-600 outline-none focus:border-rose-500 resize-none"
          />

        </div>

      </div>

      <div className="p-5 border-t border-[#231e54] flex justify-end gap-2">

        <button
          onClick={
            onClose
          }
          disabled={
            loading
          }
          className="px-4 py-2 rounded-lg bg-[#17123d] border border-[#2d2770] text-slate-300 text-xs font-semibold disabled:opacity-50"
        >
          Back
        </button>

        <button
          onClick={
            onReject
          }
          disabled={
            loading
          }
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2"
        >

          {loading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}

          Reject Adjustment

        </button>

      </div>

    </div>

  </div>
);

/* =========================================================
   DETAIL ROW
========================================================= */

const DetailRow: React.FC<{
  label: string;
  value: string;
  valueClass?: string;
}> = ({
  label,
  value,
  valueClass = 'text-white',
}) => (
  <div className="flex items-start justify-between gap-4 px-4 py-3 border-b last:border-b-0 border-[#231e54]">

    <span className="text-xs text-slate-400">
      {label}
    </span>

    <span
      className={`text-xs font-semibold text-right ${valueClass}`}
    >
      {value}
    </span>

  </div>
);

/* =========================================================
   CONFIRMATION MODAL
========================================================= */

interface ConfirmationModalProps {
  title: string;
  icon: React.ReactNode;
  iconClass: string;
  message: string;
  details?: {
    label: string;
    value: string;
  }[];
  warning?: string;
  confirmText: string;
  cancelText: string;
  loading: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmationModal: React.FC<
  ConfirmationModalProps
> = ({
  title,
  icon,
  iconClass,
  message,
  details,
  warning,
  confirmText,
  cancelText,
  loading,
  danger,
  onCancel,
  onConfirm,
}) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">

    <div className="w-full max-w-lg rounded-2xl bg-[#0b0824] border border-[#2d2770] shadow-2xl">

      <div className="p-5 border-b border-[#231e54] flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div
            className={`p-2 rounded-xl border ${iconClass}`}
          >
            {icon}
          </div>

          <h2 className="text-white font-bold">
            {title}
          </h2>

        </div>

        <button
          onClick={
            onCancel
          }
          disabled={
            loading
          }
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
        </button>

      </div>

      <div className="p-5 space-y-4">

        <div className="text-sm text-slate-200">
          {message}
        </div>

        {details &&
          details.length >
            0 && (
            <div className="rounded-xl bg-[#120e38] border border-[#231e54] overflow-hidden">

              {details.map(
                detail => (
                  <div
                    key={
                      detail.label
                    }
                    className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 border-[#231e54]"
                  >

                    <span className="text-xs text-slate-400">
                      {detail.label}
                    </span>

                    <span className="text-xs font-semibold text-white">
                      {detail.value}
                    </span>

                  </div>
                )
              )}

            </div>
          )}

        {warning && (
          <div
            className={`p-3 rounded-xl border ${
              danger
                ? 'bg-rose-500/10 border-rose-500/30'
                : 'bg-amber-500/10 border-amber-500/30'
            }`}
          >

            <div className="flex items-start gap-2">

              <AlertTriangle
                className={`w-4 h-4 mt-0.5 shrink-0 ${
                  danger
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              />

              <div
                className={`text-[11px] leading-5 ${
                  danger
                    ? 'text-rose-300'
                    : 'text-amber-300'
                }`}
              >
                {warning}
              </div>

            </div>

          </div>
        )}

      </div>

      <div className="p-5 border-t border-[#231e54] flex justify-end gap-2">

        <button
          onClick={
            onCancel
          }
          disabled={
            loading
          }
          className="px-4 py-2 rounded-lg bg-[#17123d] border border-[#2d2770] text-slate-300 hover:text-white text-xs font-semibold disabled:opacity-50"
        >
          {cancelText}
        </button>

        <button
          onClick={
            onConfirm
          }
          disabled={
            loading
          }
          className={`px-4 py-2 rounded-lg text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50 ${
            danger
              ? 'bg-rose-600 hover:bg-rose-500'
              : 'bg-[#5C3FE0] hover:bg-[#7152FF]'
          }`}
        >

          {loading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}

          {confirmText}

        </button>

      </div>

    </div>

  </div>
);

/* =========================================================
   PAYROLL REJECT MODAL
========================================================= */

const RejectModal: React.FC<{
  payrollName: string;
  reason: string;
  loading: boolean;
  onReasonChange: (
    value: string
  ) => void;
  onClose: () => void;
  onReject: () => void;
}> = ({
  payrollName,
  reason,
  loading,
  onReasonChange,
  onClose,
  onReject,
}) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">

    <div className="w-full max-w-lg rounded-2xl bg-[#0b0824] border border-rose-500/30 shadow-2xl">

      <div className="p-5 border-b border-[#231e54] flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <XCircle className="w-5 h-5 text-rose-400" />
          </div>

          <div>

            <h2 className="text-white font-bold">
              Reject Payroll
            </h2>

            <p className="text-[11px] text-slate-400 mt-1">
              {payrollName}
            </p>

          </div>

        </div>

        <button
          onClick={
            onClose
          }
          disabled={
            loading
          }
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
        </button>

      </div>

      <div className="p-5 space-y-4">

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">

          <div className="flex items-start gap-2">

            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />

            <div className="text-[11px] text-amber-300 leading-5">
              The payroll will return to Rejected status.
              HR can correct the payroll and submit it again.
            </div>

          </div>

        </div>

        <div>

          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Rejection Reason
          </label>

          <textarea
            value={
              reason
            }
            onChange={event =>
              onReasonChange(
                event.target.value
              )
            }
            rows={4}
            placeholder="Enter the reason for rejecting this payroll..."
            autoFocus
            className="w-full px-3 py-3 rounded-xl bg-[#09071e] border border-[#2d2770] text-white placeholder:text-slate-600 outline-none focus:border-rose-500 resize-none"
          />

        </div>

      </div>

      <div className="p-5 border-t border-[#231e54] flex justify-end gap-2">

        <button
          onClick={
            onClose
          }
          disabled={
            loading
          }
          className="px-4 py-2 rounded-lg bg-[#17123d] border border-[#2d2770] text-slate-300 text-xs font-semibold disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          onClick={
            onReject
          }
          disabled={
            loading
          }
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2"
        >

          {loading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}

          Reject Payroll

        </button>

      </div>

    </div>

  </div>
);

/* =========================================================
   BONUS MODAL
========================================================= */

const BonusModal: React.FC<{
  record: PayrollRecord;
  adjustments: PayrollAdjustment[];
  amount: string;
  reason: string;
  loading: boolean;
  onAmountChange: (
    value: string
  ) => void;
  onReasonChange: (
    value: string
  ) => void;
  onClose: () => void;
  onSave: () => void;
}> = ({
  record,
  adjustments,
  amount,
  reason,
  loading,
  onAmountChange,
  onReasonChange,
  onClose,
  onSave,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">

    <div className="w-full max-w-lg rounded-2xl bg-[#0b0824] border border-emerald-500/30 shadow-2xl">

      <div className="p-5 border-b border-[#231e54] flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <Gift className="w-5 h-5 text-emerald-400" />
          </div>

          <div>

            <h2 className="text-white font-bold">
              Add Bonus
            </h2>

            <p className="text-[11px] text-slate-400 mt-1">
              {record.employeeName}
              {' • '}
              {record.employeeCode}
            </p>

          </div>

        </div>

        <button
          onClick={
            onClose
          }
          disabled={
            loading
          }
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
        </button>

      </div>

      <div className="p-5 space-y-5">

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">

          <div className="text-[11px] text-amber-300 leading-5">
            This bonus will be submitted for Company Admin approval.
            It will affect the payroll total only after approval.
          </div>

        </div>

        <div>

          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Bonus Amount
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={
              amount
            }
            onChange={event =>
              onAmountChange(
                event.target.value
              )
            }
            placeholder="0.00"
            autoFocus
            className="w-full px-3 py-3 rounded-xl bg-[#09071e] border border-[#2d2770] text-white outline-none focus:border-emerald-500"
          />

        </div>

        <div>

          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Bonus Reason
          </label>

          <textarea
            value={
              reason
            }
            onChange={event =>
              onReasonChange(
                event.target.value
              )
            }
            rows={3}
            placeholder="Example: Performance bonus"
            className="w-full px-3 py-3 rounded-xl bg-[#09071e] border border-[#2d2770] text-white placeholder:text-slate-600 outline-none focus:border-emerald-500 resize-none"
          />

        </div>

        {adjustments.filter(
          adjustment =>
            adjustment.type ===
            'Bonus'
        ).length > 0 && (
          <AdjustmentHistory
            title="Existing Bonuses"
            adjustments={
              adjustments.filter(
                adjustment =>
                  adjustment.type ===
                  'Bonus'
              )
            }
            type="Bonus"
          />
        )}

      </div>

      <div className="p-5 border-t border-[#231e54] flex justify-end gap-2">

        <button
          onClick={
            onClose
          }
          disabled={
            loading
          }
          className="px-4 py-2 rounded-lg bg-[#17123d] border border-[#2d2770] text-slate-300 text-xs font-semibold disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          onClick={
            onSave
          }
          disabled={
            loading
          }
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2"
        >

          {loading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}

          Add Bonus

        </button>

      </div>

    </div>

  </div>
);

/* =========================================================
   DEDUCTION MODAL
========================================================= */

const DeductionModal: React.FC<{
  record: PayrollRecord;
  adjustments: PayrollAdjustment[];
  amount: string;
  reason: string;
  loading: boolean;
  onAmountChange: (
    value: string
  ) => void;
  onReasonChange: (
    value: string
  ) => void;
  onClose: () => void;
  onSave: () => void;
}> = ({
  record,
  adjustments,
  amount,
  reason,
  loading,
  onAmountChange,
  onReasonChange,
  onClose,
  onSave,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">

    <div className="w-full max-w-lg rounded-2xl bg-[#0b0824] border border-rose-500/30 shadow-2xl">

      <div className="p-5 border-b border-[#231e54] flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <MinusCircle className="w-5 h-5 text-rose-400" />
          </div>

          <div>

            <h2 className="text-white font-bold">
              Add Deduction
            </h2>

            <p className="text-[11px] text-slate-400 mt-1">
              {record.employeeName}
              {' • '}
              {record.employeeCode}
            </p>

          </div>

        </div>

        <button
          onClick={
            onClose
          }
          disabled={
            loading
          }
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
        </button>

      </div>

      <div className="p-5 space-y-5">

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">

          <div className="text-[11px] text-amber-300 leading-5">
            This deduction will be submitted for Company Admin approval.
            It will affect the payroll total only after approval.
          </div>

        </div>

        <div>

          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Deduction Amount
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={
              amount
            }
            onChange={event =>
              onAmountChange(
                event.target.value
              )
            }
            placeholder="0.00"
            autoFocus
            className="w-full px-3 py-3 rounded-xl bg-[#09071e] border border-[#2d2770] text-white outline-none focus:border-rose-500"
          />

        </div>

        <div>

          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Deduction Reason
          </label>

          <textarea
            value={
              reason
            }
            onChange={event =>
              onReasonChange(
                event.target.value
              )
            }
            rows={3}
            placeholder="Example: Advance salary deduction"
            className="w-full px-3 py-3 rounded-xl bg-[#09071e] border border-[#2d2770] text-white placeholder:text-slate-600 outline-none focus:border-rose-500 resize-none"
          />

        </div>

        {adjustments.filter(
          adjustment =>
            adjustment.type ===
            'Deduction'
        ).length > 0 && (
          <AdjustmentHistory
            title="Existing Deductions"
            adjustments={
              adjustments.filter(
                adjustment =>
                  adjustment.type ===
                  'Deduction'
              )
            }
            type="Deduction"
          />
        )}

      </div>

      <div className="p-5 border-t border-[#231e54] flex justify-end gap-2">

        <button
          onClick={
            onClose
          }
          disabled={
            loading
          }
          className="px-4 py-2 rounded-lg bg-[#17123d] border border-[#2d2770] text-slate-300 text-xs font-semibold disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          onClick={
            onSave
          }
          disabled={
            loading
          }
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2"
        >

          {loading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}

          Add Deduction

        </button>

      </div>

    </div>

  </div>
);

/* =========================================================
   ADJUSTMENT HISTORY
========================================================= */

const AdjustmentHistory: React.FC<{
  title: string;
  adjustments: PayrollAdjustment[];
  type:
    | 'Bonus'
    | 'Deduction';
}> = ({
  title,
  adjustments,
  type,
}) => (
  <div>

    <div className="text-xs font-semibold text-slate-300 mb-2">
      {title}
    </div>

    <div className="space-y-2 max-h-32 overflow-y-auto">

      {adjustments.map(
        adjustment => (
          <div
            key={
              adjustment.id
            }
            className="flex items-center justify-between p-3 rounded-lg bg-[#120e38] border border-[#231e54]"
          >

            <div>

              <div className="text-xs text-white font-semibold">
                {adjustment.reason}
              </div>

              <div className="text-[10px] text-slate-500">
                {adjustment.type}
              </div>

            </div>

            <div
              className={`text-xs font-bold ${
                type ===
                'Bonus'
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >

              {type ===
              'Bonus'
                ? '+'
                : '-'}

              ₹
              {Number(
                adjustment.amount ??
                  0
              ).toLocaleString()}

            </div>

          </div>
        )
      )}

    </div>

  </div>
);

/* =========================================================
   STATUS
========================================================= */

const StatusBadge: React.FC<{
  status: string;
}> = ({
  status,
}) => {
  const styles: Record<
    string,
    string
  > = {
    Draft:
      'bg-slate-500/10 text-slate-300 border-slate-500/30',

    SubmittedByHR:
      'bg-amber-500/10 text-amber-300 border-amber-500/30',

    ApprovedByCompanyAdmin:
      'bg-blue-500/10 text-blue-300 border-blue-500/30',

    Approved:
      'bg-blue-500/10 text-blue-300 border-blue-500/30',

    Processing:
      'bg-purple-500/10 text-purple-300 border-purple-500/30',

    Paid:
      'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',

    Locked:
      'bg-slate-500/10 text-slate-300 border-slate-500/30',

    Rejected:
      'bg-rose-500/10 text-rose-300 border-rose-500/30',
  };

  return (
    <span
      className={`px-2 py-1 rounded text-[10px] font-bold border ${
        styles[status] ||
        styles.Draft
      }`}
    >
      {status}
    </span>
  );
};

/* =========================================================
   SUMMARY
========================================================= */

const Summary: React.FC<{
  label: string;
  value?: number | null;
}> = ({
  label,
  value,
}) => (
  <div>

    <span className="text-[10px] text-slate-500 block">
      {label}
    </span>

    <span className="text-xs font-mono text-slate-200">
      ₹
      {Number(
        value ??
          0
      ).toLocaleString()}
    </span>

  </div>
);

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (
  value?: number | null
) =>
  `₹${Number(
    value ??
      0
  ).toLocaleString()}`;

const getAdjustmentEmployeeName = (
  adjustment: PayrollAdjustment,
  records: PayrollRecord[]
) =>
  records.find(
    record =>
      record.userId ===
      adjustment.userId
  )?.employeeName ??
  'Employee';

/* =========================================================
   EXPORT
========================================================= */

export default MonthlyPayrollPage;