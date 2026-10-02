import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  X,
  Printer,
  Download,
  Loader2,
} from 'lucide-react';

import {
  useApp,
} from '../context/AppContext';

import {
  Payslip as PayslipType,
} from '../types/payrollCycle';

import {
  apiRequest,
} from '../api/client';

/* =========================================================
   COMPANY PROFILE
========================================================= */

interface TenantCompanyProfile {
  id: number;
  tenantId: number;

  legalName?: string | null;
  displayName?: string | null;

  logoUrl?: string | null;
  logoFileName?: string | null;
  logoContentType?: string | null;

  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;

  phone?: string | null;
  email?: string | null;
  website?: string | null;

  taxRegistrationNumber?: string | null;
  companyRegistrationNumber?: string | null;

  payslipFooterText?: string | null;
}

/* =========================================================
   PAYROLL ADJUSTMENT
========================================================= */

interface PayslipAdjustment {
  id?: number;

  /*
   * ASP.NET can return enums either as:
   *
   * "Bonus"
   * "Deduction"
   *
   * or numeric values.
   */
  type?: string | number | null;

  amount?: number | null;

  reason?: string | null;

  status?: string | number | null;

  approvedByUserId?: number | null;
  approvedAtUtc?: string | null;
}

/* =========================================================
   OPTIONAL PAYSLIP FIELDS
========================================================= */

type ExtendedPayslip =
  PayslipType & {
    dateOfJoining?: string | null;

    payReleaseDate?: string | null;

    paymentMode?: string | null;

    bankAccount?: string | null;

    grossSalary?: number | null;

    earnings?: Array<{
      component: string;
      amount: number;
    }>;

    deductions?: Array<{
      component: string;
      amount: number;
    }>;

    amountInWords?: string | null;

    adjustments?: PayslipAdjustment[];
  };

/* =========================================================
   DISPLAY ROW
========================================================= */

interface PayslipAmountRow {
  label: string;
  amount: number;
}

/* =========================================================
   MODAL
========================================================= */

export const PayslipModal: React.FC = () => {

  const {
    selectedPayslipForView,
    setSelectedPayslipForView,
  } = useApp();

  const [companyProfile, setCompanyProfile] =
    useState<TenantCompanyProfile | null>(null);

  const [profileLoading, setProfileLoading] =
    useState(false);

  /*
   * IMPORTANT:
   *
   * slip is nullable because the modal can be closed
   * at any time.
   */
  const slip =
    selectedPayslipForView as
    | ExtendedPayslip
    | null;

  /* =======================================================
     LOAD COMPANY PROFILE
  ======================================================= */

  useEffect(() => {

    if (!slip) {
      return;
    }

    const loadProfile = async () => {

      try {

        setProfileLoading(true);

        /*
         * Backend:
         *
         * TenantCompanyProfileController
         *
         * [Route("api/[controller]")]
         *
         * Therefore:
         *
         * GET /api/TenantCompanyProfile
         */

        const profile =
          await apiRequest<TenantCompanyProfile>(
            '/TenantCompanyProfile'
          );

        setCompanyProfile(profile);

      } catch (error) {

        console.error(
          'Failed to load company profile:',
          error
        );

        setCompanyProfile(null);

      } finally {

        setProfileLoading(false);

      }

    };

    loadProfile();

  }, [slip]);

  /* =======================================================
     PAYSLIP DEBUG
  ======================================================= */

  useEffect(() => {

    if (!slip) {
      return;
    }

    console.log(
      '========== PAYSLIP PREVIEW DATA =========='
    );

    console.log(
      'Full payslip:',
      slip
    );

    console.log(
      'Adjustments:',
      slip.adjustments
    );

    console.log(
      'Adjustments JSON:',
      JSON.stringify(
        slip.adjustments,
        null,
        2
      )
    );

    console.log(
      'First adjustment:',
      slip.adjustments?.[0]
    );

    console.log(
      'First adjustment type:',
      slip.adjustments?.[0]?.type,
      'typeof:',
      typeof slip.adjustments?.[0]?.type
    );

    console.log(
      'First adjustment status:',
      slip.adjustments?.[0]?.status,
      'typeof:',
      typeof slip.adjustments?.[0]?.status
    );

    console.log(
      'First adjustment reason:',
      slip.adjustments?.[0]?.reason
    );

    console.log(
      'First adjustment amount:',
      slip.adjustments?.[0]?.amount
    );

    console.log(
      'Earnings:',
      slip.earnings
    );

    console.log(
      'Deductions:',
      slip.deductions
    );

  }, [slip]);

  /* =======================================================
     ESCAPE
  ======================================================= */

  useEffect(() => {

    if (!slip) {
      return;
    }

    const handleKeyDown =
      (event: KeyboardEvent) => {

        if (event.key === 'Escape') {

          setSelectedPayslipForView(null);

        }

      };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {

      window.removeEventListener(
        'keydown',
        handleKeyDown
      );

    };

  }, [
    slip,
    setSelectedPayslipForView,
  ]);

  /* =======================================================
     PRINT
  ======================================================= */

  const handlePrint = () => {

    window.print();

  };

  /* =======================================================
     DOWNLOAD
  ======================================================= */

  const handleDownload = () => {

    /*
     * Chrome print dialog:
     *
     * Destination -> Save to PDF
     */

    window.print();

  };

  /* =======================================================
     CURRENCY
  ======================================================= */

  const currency = (
    amount: number
  ) => {

    return `${slip?.currencySymbol ?? '₹'
      }${(
        Number(amount) || 0
      ).toLocaleString(
        undefined,
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )
      }`;

  };

  /* =======================================================
     NORMALIZE ENUM / STRING
  ======================================================= */

  const normalizeValue = (
    value: string | number | null | undefined
  ): string => {

    if (
      value === null ||
      value === undefined
    ) {
      return '';
    }

    return String(value)
      .trim()
      .toLowerCase()
      .replace(
        /[\s_-]+/g,
        ''
      );

  };

  /* =======================================================
     ADJUSTMENT TYPE
  ======================================================= */

  const isBonusAdjustment = (
    adjustment: PayslipAdjustment
  ): boolean => {

    const type =
      normalizeValue(
        adjustment.type
      );

    return type === 'bonus';

  };

  const isDeductionAdjustment = (
    adjustment: PayslipAdjustment
  ): boolean => {

    const type =
      normalizeValue(
        adjustment.type
      );

    return type === 'deduction';

  };

  /* =======================================================
     APPROVAL STATUS
  ======================================================= */

  const isApprovedAdjustment = (
    adjustment: PayslipAdjustment
  ): boolean => {

    const status =
      normalizeValue(
        adjustment.status
      );

    /*
     * Expected:
     *
     * ApprovedByCompanyAdmin
     *
     * We also support a few common serialized forms.
     */

    return (
      status === 'approvedbycompanyadmin' ||
      status === 'approvedbycompanyadminuser' ||
      status === 'approved'
    );

  };

  /* =======================================================
     APPROVED ADJUSTMENTS
  ======================================================= */

  /*
   * IMPORTANT:
   *
   * Never use:
   *
   * slip.adjustments
   *
   * directly here.
   *
   * slip can be null when the modal closes.
   *
   * Therefore:
   *
   * slip?.adjustments ?? []
   */

  const allAdjustments =
    slip?.adjustments ?? [];

  /* =======================================================
     BONUS ADJUSTMENTS
  ======================================================= */

  const bonuses =
    allAdjustments.filter(
      adjustment =>
        isBonusAdjustment(adjustment)
    );

  const adjustmentDeductions =
    allAdjustments.filter(
      adjustment =>
        isDeductionAdjustment(adjustment)
    );

  /* =======================================================
     COMPANY ADDRESS
  ======================================================= */

  const companyAddress =
    useMemo(() => {

      if (!companyProfile) {
        return '';
      }

      return [
        companyProfile.addressLine1,
        companyProfile.addressLine2,
        companyProfile.city,
        companyProfile.state,
        companyProfile.postalCode,
        companyProfile.country,
      ]
        .filter(Boolean)
        .join(', ');

    }, [
      companyProfile,
    ]);

  /* =======================================================
     AMOUNT IN WORDS
  ======================================================= */

  const amountInWords =
    slip
      ? (
        slip.amountInWords ||
        numberToIndianWords(
          Math.round(
            Number(
              slip.netSalary || 0
            )
          )
        )
      )
      : '';

  /* =======================================================
     CLOSE IF NO PAYSLIP
  ======================================================= */

  /*
   * IMPORTANT:
   *
   * Keep this AFTER all hooks.
   *
   * This prevents:
   *
   * "Rendered fewer hooks than expected"
   *
   * while also preventing null access.
   */

  if (!slip) {
    return null;
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {/* ===================================================
          SCREEN MODAL
      =================================================== */}

      <div
        className="
          payslip-preview-overlay
          fixed inset-0 z-[100]
          bg-black/90
          backdrop-blur-sm
          overflow-y-auto
          p-4 md:p-8
        "
      >

        <div
          className="
            payslip-preview-shell
            max-w-[950px]
            mx-auto
            bg-[#171717]
            rounded-2xl
            shadow-2xl
            overflow-hidden
          "
        >

          {/* ===============================================
              TOOLBAR
          =============================================== */}

          <div
            className="
              payslip-toolbar
              sticky top-0 z-20
              flex items-center
              justify-between
              gap-3
              px-4 md:px-6
              py-3
              bg-[#0e0b2e]
              border-b border-[#2d2770]
            "
          >

            <div>

              <div className="text-sm font-bold text-white">
                Payslip Preview
              </div>

              <div className="text-[10px] text-slate-500">
                {slip.monthYear}
              </div>

            </div>

            <div className="flex items-center gap-2">

              <button
                onClick={handleDownload}
                className="
                  flex items-center gap-1.5
                  px-3 py-2
                  rounded-lg
                  bg-[#17123d]
                  border border-[#2d2770]
                  text-xs
                  text-slate-200
                  hover:text-white
                "
              >

                <Download
                  className="w-3.5 h-3.5"
                />

                Save PDF

              </button>

              <button
                onClick={handlePrint}
                className="
                  flex items-center gap-1.5
                  px-3 py-2
                  rounded-lg
                  bg-[#5C3FE0]
                  hover:bg-[#7152FF]
                  text-xs
                  font-semibold
                  text-white
                "
              >

                <Printer
                  className="w-3.5 h-3.5"
                />

                Print

              </button>

              <button
                onClick={() =>
                  setSelectedPayslipForView(null)
                }
                className="
                  p-2 rounded-lg
                  text-slate-400
                  hover:text-white
                  hover:bg-[#1f1857]
                "
              >

                <X
                  className="w-4 h-4"
                />

              </button>

            </div>

          </div>

          {/* ===============================================
              LOADING PROFILE
          =============================================== */}

          {profileLoading && (

            <div
              className="
                flex items-center
                justify-center
                py-3
                bg-white
              "
            >

              <Loader2
                className="
                  w-4 h-4
                  animate-spin
                  text-indigo-600
                "
              />

              <span
                className="
                  ml-2
                  text-xs
                  text-slate-500
                "
              >
                Loading company information...
              </span>

            </div>

          )}

          {/* ===============================================
              A4 DOCUMENT
          =============================================== */}

          <div
            id="payslip-print-area"
            className="
              payslip-document
              mx-auto
              bg-white
              text-slate-900
              p-7 md:p-10
            "
          >

            {/* =============================================
                COMPANY HEADER
            ============================================= */}

            <div
              className="
                flex items-start
                justify-between
                gap-6
                pb-5
                border-b-2
                border-slate-900
              "
            >

              <div
                className="
                  flex items-start
                  gap-4
                "
              >

                {/* LOGO */}

                {companyProfile?.logoUrl ? (

                  <img
                    src={companyProfile.logoUrl}
                    alt={
                      companyProfile.displayName ||
                      companyProfile.legalName ||
                      'Company Logo'
                    }
                    className="
                      w-20 h-20
                      object-contain
                    "
                  />

                ) : (

                  <div
                    className="
                      w-20 h-20
                      border
                      border-slate-300
                      flex
                      items-center
                      justify-center
                      text-[9px]
                      font-bold
                      text-slate-400
                    "
                  >
                    LOGO
                  </div>

                )}

                <div>

                  <div
                    className="
                      text-xl
                      font-black
                      tracking-wide
                      uppercase
                    "
                  >
                    {
                      companyProfile?.displayName ||
                      companyProfile?.legalName ||
                      'ESTUSCIA'
                    }
                  </div>

                  {companyProfile?.legalName &&
                    companyProfile.legalName !==
                    companyProfile.displayName && (

                      <div
                        className="
                        text-[10px]
                        text-slate-500
                        mt-0.5
                      "
                      >
                        {companyProfile.legalName}
                      </div>

                    )}

                  {companyProfile?.website && (

                    <div
                      className="
                        text-[10px]
                        text-slate-500
                        mt-1
                      "
                    >
                      {companyProfile.website}
                    </div>

                  )}

                  {companyAddress && (

                    <div
                      className="
                        text-[10px]
                        text-slate-500
                        mt-1
                        max-w-[420px]
                      "
                    >
                      {companyAddress}
                    </div>

                  )}

                  {companyProfile?.phone && (

                    <div
                      className="
                        text-[10px]
                        text-slate-500
                      "
                    >
                      {companyProfile.phone}
                    </div>

                  )}

                </div>

              </div>

              <div className="text-right">

                <div
                  className="
                    text-2xl
                    font-black
                    tracking-[0.18em]
                  "
                >
                  PAYSLIP
                </div>

                <div
                  className="
                    text-[11px]
                    font-semibold
                    text-slate-500
                    uppercase
                  "
                >
                  Pay Period
                </div>

                <div
                  className="
                    text-sm
                    font-bold
                    mt-1
                  "
                >
                  {slip.monthYear}
                </div>

                <div
                  className="
                    text-[9px]
                    text-slate-400
                    mt-2
                  "
                >
                  Payroll Record #{slip.id}
                </div>

              </div>

            </div>

            {/* =============================================
                EMPLOYEE INFORMATION
            ============================================= */}

            <div className="mt-6">

              <div
                className="
                  grid
                  grid-cols-2
                  md:grid-cols-4
                  border
                  border-slate-300
                "
              >

                <InfoCell
                  label="EMPLOYEE NAME"
                  value={slip.employeeName}
                />

                <InfoCell
                  label="EMPLOYEE ID"
                  value={slip.employeeCode}
                />

                <InfoCell
                  label="DEPARTMENT"
                  value={
                    slip.department ||
                    '—'
                  }
                />

                <InfoCell
                  label="DESIGNATION"
                  value={
                    slip.designation ||
                    '—'
                  }
                />

                <InfoCell
                  label="DATE OF JOINING"
                  value={
                    formatDate(
                      slip.dateOfJoining
                    )
                  }
                />

                <InfoCell
                  label="PAY RELEASE DATE"
                  value={
                    formatDate(
                      slip.payReleaseDate
                    )
                  }
                />

                <InfoCell
                  label="PAYMENT MODE"
                  value={
                    slip.paymentMode ||
                    '—'
                  }
                />

                <InfoCell
                  label="BANK ACCOUNT"
                  value={
                    slip.bankAccount ||
                    '—'
                  }
                />

              </div>

            </div>

            {/* =============================================
                EARNINGS / DEDUCTIONS
            ============================================= */}

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                mt-7
                border
                border-slate-300
              "
            >

              {/* ===========================================
                  EARNINGS
              =========================================== */}

              <div
                className="
                  border-b
                  md:border-b-0
                  md:border-r
                  border-slate-300
                "
              >

                <div
                  className="
                    grid
                    grid-cols-2
                    bg-slate-100
                    border-b
                    border-slate-300
                  "
                >

                  <div
                    className="
                      p-3
                      text-[10px]
                      font-black
                      uppercase
                    "
                  >
                    Earnings Component
                  </div>

                  <div
                    className="
                      p-3
                      text-[10px]
                      font-black
                      uppercase
                      text-right
                    "
                  >
                    Amount (₹)
                  </div>

                </div>

                <div>

                  {getEarnings(
                    slip,
                    bonuses
                  ).map(
                    (
                      item,
                      index
                    ) => (

                      <AmountRow
                        key={
                          `earning-${index}`
                        }
                        label={
                          item.label
                        }
                        amount={
                          item.amount
                        }
                      />

                    )
                  )}

                  {/* =====================================
                      GROSS EARNINGS
                  ===================================== */}

                  <AmountRow
                    label="Gross Earnings"
                    amount={
                      slip.grossSalary ??
                      (
                        Number(
                          slip.basicSalary || 0
                        ) +
                        Number(
                          slip.totalBonus || 0
                        )
                      )
                    }
                    bold
                  />

                </div>

              </div>

              {/* ===========================================
                  DEDUCTIONS
              =========================================== */}

              <div>

                <div
                  className="
                    grid
                    grid-cols-2
                    bg-slate-100
                    border-b
                    border-slate-300
                  "
                >

                  <div
                    className="
                      p-3
                      text-[10px]
                      font-black
                      uppercase
                    "
                  >
                    Deductions Component
                  </div>

                  <div
                    className="
                      p-3
                      text-[10px]
                      font-black
                      uppercase
                      text-right
                    "
                  >
                    Amount (₹)
                  </div>

                </div>

                <div>

                  {getDeductions(
                    slip,
                    adjustmentDeductions
                  ).map(
                    (
                      item,
                      index
                    ) => (

                      <AmountRow
                        key={
                          `deduction-${index}`
                        }
                        label={
                          item.label
                        }
                        amount={
                          item.amount
                        }
                      />

                    )
                  )}

                  {/* =====================================
                      TOTAL DEDUCTIONS
                  ===================================== */}

                  <AmountRow
                    label="Total Deductions"
                    amount={
                      Number(
                        slip.totalDeduction || 0
                      )
                    }
                    bold
                  />

                </div>

              </div>

            </div>

            {/* =============================================
                NET PAYABLE
            ============================================= */}

            <div
              className="
                mt-7
                border-2
                border-slate-900
              "
            >

              <div
                className="
                  px-4
                  py-3
                  bg-slate-900
                  text-white
                  text-[11px]
                  font-black
                  uppercase
                  tracking-wider
                "
              >
                Net Payable Amount
              </div>

              <div className="p-5">

                <div
                  className="
                    text-[10px]
                    text-slate-500
                  "
                >
                  Amount in words
                </div>

                <div
                  className="
                    font-semibold
                    text-sm
                    mt-1
                  "
                >
                  {amountInWords}
                </div>

                <div
                  className="
                    text-right
                    text-3xl
                    font-black
                    mt-4
                  "
                >
                  {currency(
                    slip.netSalary
                  )}
                </div>

              </div>

            </div>

            {/* =============================================
                FOOTER
            ============================================= */}

            <div
              className="
                mt-8
                pt-4
                border-t
                border-slate-300
              "
            >

              <div
                className="
                  text-[9px]
                  text-slate-500
                "
              >
                {
                  companyProfile?.payslipFooterText ||
                  'This is a computer-generated document and does not require a physical signature if verified digitally.'
                }
              </div>

              {companyProfile?.taxRegistrationNumber && (

                <div
                  className="
                    text-[9px]
                    text-slate-500
                    mt-1
                  "
                >
                  Tax Registration Number:{' '}
                  {
                    companyProfile.taxRegistrationNumber
                  }
                </div>

              )}

              {companyProfile?.companyRegistrationNumber && (

                <div
                  className="
                    text-[9px]
                    text-slate-500
                  "
                >
                  Company Registration Number:{' '}
                  {
                    companyProfile.companyRegistrationNumber
                  }
                </div>

              )}

              <div
                className="
                  text-[9px]
                  font-semibold
                  text-slate-600
                  mt-2
                "
              >

                {
                  companyProfile?.displayName ||
                  companyProfile?.legalName ||
                  'Estuscia'
                }

                {
                  companyAddress
                    ? ` • ${companyAddress}`
                    : ''
                }

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ===================================================
          PRINT CSS
      =================================================== */}

      <style>
        {`
          @media print {

            @page {
              size: A4;
              margin: 0;
            }

            html,
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }

            body * {
              visibility: hidden !important;
            }

            .payslip-preview-overlay,
            .payslip-preview-overlay * {
              visibility: visible !important;
            }

            .payslip-preview-overlay {
              position: absolute !important;
              inset: 0 !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
              backdrop-filter: none !important;
            }

            .payslip-preview-shell {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              background: white !important;
              overflow: visible !important;
            }

            .payslip-toolbar {
              display: none !important;
            }

            .payslip-document {
              width: 210mm !important;
              min-height: 297mm !important;
              margin: 0 auto !important;
              padding: 12mm 14mm !important;
              box-sizing: border-box !important;
              background: white !important;
              color: #111827 !important;
              box-shadow: none !important;
            }

            .payslip-document * {
              color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

          }

          @media screen {

            .payslip-document {
              width: 210mm;
              min-height: 297mm;
              box-shadow:
                0 25px 70px rgba(0,0,0,.45);
            }

          }
        `}
      </style>
    </>
  );
};

/* =========================================================
   INFO CELL
========================================================= */

const InfoCell: React.FC<{
  label: string;
  value: string;
}> = ({
  label,
  value,
}) => (

    <div
      className="
      p-3
      border-b
      border-r
      border-slate-300
      last:border-r-0
    "
    >

      <div
        className="
        text-[8px]
        font-bold
        text-slate-500
        uppercase
      "
      >
        {label}
      </div>

      <div
        className="
        text-[11px]
        font-semibold
        mt-1
      "
      >
        {value || '—'}
      </div>

    </div>

  );

/* =========================================================
   AMOUNT ROW
========================================================= */

const AmountRow: React.FC<{
  label: string;
  amount: number;
  bold?: boolean;
}> = ({
  label,
  amount,
  bold,
}) => (

    <div
      className={`
      grid
      grid-cols-2
      border-b
      border-slate-200
      ${bold
          ? 'bg-slate-50 font-bold'
          : ''
        }
    `}
    >

      <div
        className="
        px-3
        py-2
        text-[10px]
      "
      >
        {label}
      </div>

      <div
        className="
        px-3
        py-2
        text-[10px]
        text-right
        font-mono
      "
      >

        {Number(
          amount || 0
        ).toLocaleString(
          'en-IN',
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}

      </div>

    </div>

  );

/* =========================================================
   EARNINGS
========================================================= */

function getEarnings(
  slip: ExtendedPayslip,
  bonuses: PayslipAdjustment[]
): PayslipAmountRow[] {

  const rows: PayslipAmountRow[] = [];

  /* =======================================================
     BASIC SALARY
  ======================================================= */

  rows.push({
    label: 'Basic Salary',

    amount:
      Number(
        slip.basicSalary || 0
      ),
  });

  /* =======================================================
     OTHER NORMAL EARNINGS
  ======================================================= */

  if (
    slip.earnings &&
    slip.earnings.length > 0
  ) {

    slip.earnings.forEach(
      (
        earning
      ) => {

        const component =
          earning.component?.trim();

        if (!component) {
          return;
        }

        /*
         * Basic Salary is already displayed.
         */

        if (
          component.toLowerCase() ===
          'basic salary'
        ) {
          return;
        }

        /*
         * Generic Bonus is intentionally
         * excluded.
         *
         * PayrollAdjustment.Reason is
         * displayed instead.
         */

        if (
          component.toLowerCase() ===
          'bonus'
        ) {
          return;
        }

        rows.push({
          label: component,

          amount:
            Number(
              earning.amount || 0
            ),
        });

      }
    );

  }

  /* =======================================================
     APPROVED BONUS ADJUSTMENTS
  ======================================================= */

  bonuses.forEach(
    (
      bonus
    ) => {

      const reason =
        bonus.reason?.trim();

      rows.push({
        /*
         * IMPORTANT:
         *
         * Display the actual PayrollAdjustment
         * Reason instead of "Bonus".
         */

        label:
          reason ||
          'Bonus',

        amount:
          Number(
            bonus.amount || 0
          ),
      });

    }
  );

  return rows;
}

/* =========================================================
   DEDUCTIONS
========================================================= */

function getDeductions(
  slip: ExtendedPayslip,
  deductions: PayslipAdjustment[]
): PayslipAmountRow[] {

  const rows: PayslipAmountRow[] = [];

  /* =======================================================
     NORMAL / STATUTORY DEDUCTIONS
  ======================================================= */

  if (
    slip.deductions &&
    slip.deductions.length > 0
  ) {

    slip.deductions.forEach(
      (
        deduction
      ) => {

        const component =
          deduction.component?.trim();

        if (!component) {
          return;
        }

        rows.push({
          label: component,

          amount:
            Number(
              deduction.amount || 0
            ),
        });

      }
    );

  }

  /* =======================================================
     APPROVED PAYROLL DEDUCTIONS
  ======================================================= */

  deductions.forEach(
    (
      deduction
    ) => {

      const reason =
        deduction.reason?.trim();

      rows.push({
        /*
         * IMPORTANT:
         *
         * Display PayrollAdjustment.Reason
         * instead of generic "Deduction".
         */

        label:
          reason ||
          'Deduction',

        amount:
          Number(
            deduction.amount || 0
          ),
      });

    }
  );

  return rows;
}

/* =========================================================
   DATE
========================================================= */

function formatDate(
  value?: string | null
): string {

  if (!value) {
    return '—';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return value;

  }

  return date.toLocaleDateString(
    'en-GB'
  );
}

/* =========================================================
   INDIAN NUMBER TO WORDS
========================================================= */

function numberToIndianWords(
  amount: number
): string {

  if (amount === 0) {
    return 'Zero Indian Rupees Only';
  }

  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];

  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const belowHundred = (
    n: number
  ): string => {

    if (n < 20) {
      return ones[n];
    }

    return (
      tens[
      Math.floor(n / 10)
      ] +
      (
        n % 10
          ? ` ${ones[n % 10]}`
          : ''
      )
    );

  };

  const belowThousand = (
    n: number
  ): string => {

    if (n < 100) {
      return belowHundred(n);
    }

    return (
      `${ones[
      Math.floor(n / 100)
      ]
      } Hundred` +
      (
        n % 100
          ? ` ${belowHundred(
            n % 100
          )}`
          : ''
      )
    );

  };

  let result = '';

  let remaining =
    Math.floor(amount);

  const crore =
    Math.floor(
      remaining / 10000000
    );

  remaining %=
    10000000;

  const lakh =
    Math.floor(
      remaining / 100000
    );

  remaining %=
    100000;

  const thousand =
    Math.floor(
      remaining / 1000
    );

  remaining %=
    1000;

  if (crore) {

    result +=
      `${belowThousand(
        crore
      )
      } Crore `;

  }

  if (lakh) {

    result +=
      `${belowHundred(
        lakh
      )
      } Lakh `;

  }

  if (thousand) {

    result +=
      `${belowHundred(
        thousand
      )
      } Thousand `;

  }

  if (remaining) {

    result +=
      belowThousand(
        remaining
      );

  }

  return `${result.trim()
    } Indian Rupees Only`;

}