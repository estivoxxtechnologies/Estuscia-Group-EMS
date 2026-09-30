import React, { useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Printer,
  Users,
  WalletCards,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import EmployeeSalariesPage from './EmployeeSalariesPage';
import MonthlyPayrollPage from './MonthlyPayrollPage';
import PayslipsPage from './PayslipsPage';

type PayrollSection =
  | 'salaries'
  | 'payroll'
  | 'payslips';

export const PayrollView: React.FC = () => {
  const {
    currentUser,
    selectedBranch,
    selectedBranchId,
  } = useApp();

  /*
   * ------------------------------------------------------------
   * USER ROLE
   * ------------------------------------------------------------
   */

  const role =
    currentUser?.roleName?.trim().toLowerCase() ?? '';

  const isEmployee =
    role === 'staff' ||
    role === 'sales_staff' ||
    role === 'developer' ||
    role === 'support_staff' ||
    role === 'knowledge_trainer';

  const isPayrollManager =
    role === 'hr_ops' ||
    role === 'branch_manager';

  const isCompanyAdmin =
    role === 'company_admin';

  const isSuperAdmin =
    role === 'super_admin';

  /*
   * ------------------------------------------------------------
   * COMMON BRANCH ACCESS
   *
   * This follows the same logic used by StaffView.
   *
   * Company Admin:
   *   Header branch selector controls the branch.
   *
   * HR:
   *   If HR has an assigned branch, they are locked to it.
   *   If HR has no assigned branch, header selection controls it.
   *
   * Branch Manager:
   *   Always locked to assigned branch.
   *
   * Super Admin:
   *   Header branch selector controls the branch.
   *
   * Employee:
   *   Own assigned branch.
   * ------------------------------------------------------------
   */

  const hasFixedHrBranch =
    role === 'hr_ops' &&
    currentUser?.branchId !== null &&
    currentUser?.branchId !== undefined;

  const effectiveBranchId = useMemo(() => {
    if (isCompanyAdmin) {
      return selectedBranchId;
    }

    if (role === 'hr_ops') {
      return currentUser?.branchId ?? selectedBranchId;
    }

    if (role === 'branch_manager') {
      return currentUser?.branchId ?? null;
    }

    if (isSuperAdmin) {
      return selectedBranchId;
    }

    return currentUser?.branchId ?? null;
  }, [
    currentUser?.branchId,
    isCompanyAdmin,
    isSuperAdmin,
    role,
    selectedBranchId,
  ]);

  /*
   * ------------------------------------------------------------
   * DISPLAYED BRANCH
   * ------------------------------------------------------------
   */

  const displayedBranchName =
    hasFixedHrBranch
      ? currentUser?.branchName ?? 'Assigned Branch'
      : selectedBranch?.branchName ?? 'All Branches';

  /*
   * ------------------------------------------------------------
   * PAYROLL ACCESS
   * ------------------------------------------------------------
   */

  const canManagePayroll =
    isPayrollManager ||
    isCompanyAdmin ||
    isSuperAdmin;

  /*
   * ------------------------------------------------------------
   * DEFAULT SECTION
   *
   * Employees should directly see Payslips.
   * Management users start on Payroll.
   * ------------------------------------------------------------
   */

  const [activeSection, setActiveSection] =
    useState<PayrollSection>(() => {
      if (
        role === 'sales_staff' ||
        role === 'developer' ||
        role === 'support_staff' ||
        role === 'knowledge_trainer' ||
        role === 'staff'
      ) {
        return 'payslips';
      }

      return 'payroll';
    });

  /*
   * ------------------------------------------------------------
   * KEEP EMPLOYEE SECTION SAFE
   *
   * If the role changes after the component has mounted,
   * employees should not remain on Salary/Payroll sections.
   * ------------------------------------------------------------
   */

  useEffect(() => {
    if (isEmployee) {
      setActiveSection('payslips');
    }
  }, [isEmployee]);

  /*
   * ------------------------------------------------------------
   * EMPLOYEE VIEW
   *
   * Employees only see their payslips.
   * ------------------------------------------------------------
   */

  if (isEmployee) {
    return (
      <div className="space-y-6 pb-12">

        {/* Payroll Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">

          <div>
            <div className="flex items-center gap-2">

              <div className="p-2 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
                <WalletCards className="w-5 h-5" />
              </div>

              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">
                  Payroll & Payslips
                </h1>

                <span className="px-2 py-0.5 rounded-md bg-[#5C3FE0]/15 border border-[#5C3FE0]/30 text-[10px] font-semibold text-[#A78BFA]">
                  {displayedBranchName}
                </span>
              </div>

            </div>

            <p className="text-xs text-slate-400 mt-2">
              View your salary and payroll information
            </p>
          </div>

        </div>

        <PayslipsPage showEmployee={true} />
      </div>
    );
  }

  /*
   * ------------------------------------------------------------
   * MANAGEMENT PAYROLL VIEW
   * ------------------------------------------------------------
   */

  if (!canManagePayroll) {
    return (
      <div className="space-y-6 pb-12">

        <div className="p-8 rounded-2xl bg-[#09071e] border border-[#231e54] text-center">

          <WalletCards className="w-10 h-10 mx-auto text-slate-500 mb-3" />

          <h2 className="text-sm font-bold text-white">
            Payroll Access Restricted
          </h2>

          <p className="text-xs text-slate-400 mt-2">
            You do not have permission to manage payroll.
          </p>

        </div>

      </div>
    );
  }

  /*
   * ------------------------------------------------------------
   * MANAGEMENT PAYROLL UI
   * ------------------------------------------------------------
   */

  return (
    <div className="space-y-6 pb-12">

      {/* ======================================================
          PAYROLL HEADER
          ====================================================== */}

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">

        <div>

          <div className="flex items-center gap-2">

            <div className="p-2 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
              <WalletCards className="w-5 h-5" />
            </div>

            <div className="flex items-center gap-2">

              <h1 className="text-xl font-bold text-white">
                Payroll Management
              </h1>

              {/* Common branch context */}
              <span className="px-2 py-0.5 rounded-md bg-[#5C3FE0]/15 border border-[#5C3FE0]/30 text-[10px] font-semibold text-[#A78BFA]">
                {displayedBranchName}
              </span>

            </div>

          </div>

          <p className="text-xs text-slate-400 mt-2">
            Manage employee salaries, monthly payroll, approvals,
            and payslips
            {effectiveBranchId !== null &&
              effectiveBranchId !== undefined
              ? ` for ${displayedBranchName}`
              : ' across all branches'}
          </p>

        </div>

      </div>

      {/* ======================================================
          PAYROLL NAVIGATION
          ====================================================== */}

      <div className="flex flex-col sm:flex-row gap-2 p-2 rounded-2xl bg-[#09071e] border border-[#231e54]">

        {/* Salary Details */}
        <button
          type="button"
          onClick={() => setActiveSection('salaries')}
          className={`
            flex-1
            flex
            items-center
            justify-center
            gap-2
            px-4
            py-3
            rounded-xl
            text-xs
            font-bold
            transition-all
            ${activeSection === 'salaries'
              ? 'bg-[#5C3FE0] text-white shadow-lg shadow-[#5C3FE0]/20'
              : 'text-slate-400 hover:text-white hover:bg-[#0e0b2e]'
            }
          `}
        >
          <Users className="w-4 h-4" />
          <span>Employee Salaries</span>
        </button>

        {/* Monthly Payroll */}
        <button
          type="button"
          onClick={() => setActiveSection('payroll')}
          className={`
            flex-1
            flex
            items-center
            justify-center
            gap-2
            px-4
            py-3
            rounded-xl
            text-xs
            font-bold
            transition-all
            ${activeSection === 'payroll'
              ? 'bg-[#5C3FE0] text-white shadow-lg shadow-[#5C3FE0]/20'
              : 'text-slate-400 hover:text-white hover:bg-[#0e0b2e]'
            }
          `}
        >
          <CreditCard className="w-4 h-4" />
          <span>Monthly Payroll</span>
        </button>

        {/* Payslips */}
        <button
          type="button"
          onClick={() => setActiveSection('payslips')}
          className={`
            flex-1
            flex
            items-center
            justify-center
            gap-2
            px-4
            py-3
            rounded-xl
            text-xs
            font-bold
            transition-all
            ${activeSection === 'payslips'
              ? 'bg-[#5C3FE0] text-white shadow-lg shadow-[#5C3FE0]/20'
              : 'text-slate-400 hover:text-white hover:bg-[#0e0b2e]'
            }
          `}
        >
          <Printer className="w-4 h-4" />
          <span>Payslips</span>
        </button>

      </div>

      {/* ======================================================
          ACTIVE PAYROLL SECTION
          ====================================================== */}

      <div className="min-h-[400px]">

        {activeSection === 'salaries' && (
          <EmployeeSalariesPage
            key={`salary-${effectiveBranchId ?? 'all'}`}
            effectiveBranchId={effectiveBranchId}
          />
        )}

        {activeSection === 'payroll' && (
          <MonthlyPayrollPage
            key={`monthly-payroll-${effectiveBranchId ?? 'all'}`}
            effectiveBranchId={effectiveBranchId}
          />
        )}

        {activeSection === 'payslips' && (
          <PayslipsPage
            key={`payslips-${effectiveBranchId ?? 'all'}`}
            effectiveBranchId={effectiveBranchId}
            showEmployee={true}
          />
        )}

      </div>

    </div>
  );
};

export default PayrollView;