import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  UserPlus,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { getBranches } from '../api/branches';
import { Branch } from '../types/branch';
import {
  createUser,
  CreateUserRequest,
} from '../api/users';
import {
  getRoles,
  BackendRole,
} from '../api/roles';
import { toast } from 'react-toastify';

export const AddEmployeeModal: React.FC = () => {
  const {
    isAddEmployeeOpen,
    setIsAddEmployeeOpen,
    currentUser,
  } = useApp();

  // ============================================================
  // CURRENT USER / PERMISSIONS
  // ============================================================

  const currentUserRole =
    currentUser?.roleName?.trim().toLowerCase() ?? '';

  const isCurrentUserCompanyAdmin =
    currentUserRole === 'company_admin';

  const isCurrentUserHrOps =
    currentUserRole === 'hr_ops';

  const currentHrHasFixedBranch =
    isCurrentUserHrOps &&
    currentUser?.branchId !== null &&
    currentUser?.branchId !== undefined;

  // ============================================================
  // FORM STATE
  // ============================================================

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');

  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('Senior');

  /*
    branchId meanings:

    ''     = nothing selected yet
    null   = Full Access
    number = specific branch
  */
  const [branchId, setBranchId] =
    useState<number | null | ''>('');

  const [roleNumber, setRoleNumber] =
    useState<number | ''>('');

  const [salaryBase, setSalaryBase] =
    useState<number>(6000);

  // ============================================================
  // BACKEND DATA
  // ============================================================

  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [roles, setRoles] =
    useState<BackendRole[]>([]);

  // ============================================================
  // UI STATE
  // ============================================================

  const [isLoadingBranches, setIsLoadingBranches] =
    useState(false);

  const [isLoadingRoles, setIsLoadingRoles] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // ============================================================
  // ROLE RULES
  // ============================================================

  /*
    Role 1 = super_admin
    Role 2 = company_admin
    Role 3 = hr_ops

    Only CompanyAdmin and HR Ops roles support Full Access.
  */
  const selectedRoleHasFullAccessOption =
    roleNumber === 2 ||
    roleNumber === 3;

  /*
    Full Access is allowed when:

    - logged-in user is CompanyAdmin
    OR
    - logged-in user is HR Ops with no fixed branch

    Fixed-branch HR is NEVER allowed Full Access.
  */
  const canAssignFullAccess =
    selectedRoleHasFullAccessOption &&
    (
      isCurrentUserCompanyAdmin ||
      (
        isCurrentUserHrOps &&
        !currentHrHasFixedBranch
      )
    );

  // ============================================================
  // ACTIVE BRANCHES AVAILABLE TO CURRENT USER
  // ============================================================

  const availableBranches = useMemo(() => {
    const activeBranches = branches.filter(
      (branch) => branch.isActive
    );

    // CompanyAdmin -> all active branches
    if (isCurrentUserCompanyAdmin) {
      return activeBranches;
    }

    // HR Ops without a fixed branch -> all active branches
    if (
      isCurrentUserHrOps &&
      !currentHrHasFixedBranch
    ) {
      return activeBranches;
    }

    // HR Ops with fixed branch -> ONLY own branch
    if (
      isCurrentUserHrOps &&
      currentHrHasFixedBranch
    ) {
      return activeBranches.filter(
        (branch) =>
          branch.id === currentUser?.branchId
      );
    }

    return activeBranches;
  }, [
    branches,
    isCurrentUserCompanyAdmin,
    isCurrentUserHrOps,
    currentHrHasFixedBranch,
    currentUser?.branchId,
  ]);

  // ============================================================
  // ACTIVE ROLES
  // ============================================================

  const availableRoles = useMemo(() => {
    return roles.filter(
      (role) =>
        role.isActive &&
        role.roleNumber !== 1
    );
  }, [roles]);

  // ============================================================
  // LOAD BRANCHES + ROLES
  // ============================================================

  useEffect(() => {
    if (!isAddEmployeeOpen) {
      return;
    }

    const loadData = async () => {
      try {
        setError(null);
        setIsLoadingBranches(true);
        setIsLoadingRoles(true);

        const [
          branchData,
          roleData,
        ] = await Promise.all([
          getBranches(),
          getRoles(),
        ]);

        const activeBranches =
          branchData.filter(
            (branch) => branch.isActive
          );

        const activeNonSuperAdminRoles =
          roleData.filter(
            (role) =>
              role.isActive &&
              role.roleNumber !== 1
          );

        setBranches(branchData);
        setRoles(roleData);

        // --------------------------------------------------------
        // Select first role
        // --------------------------------------------------------

        if (
          roleNumber === '' &&
          activeNonSuperAdminRoles.length > 0
        ) {
          const firstRole =
            activeNonSuperAdminRoles[0];

          const firstRoleNumber =
            firstRole.roleNumber;

          setRoleNumber(firstRoleNumber);

          /*
            IMPORTANT:

            Fixed-branch HR ALWAYS gets their own branch.

            This must happen BEFORE Full Access logic.
          */
          if (currentHrHasFixedBranch) {
            setBranchId(
              currentUser?.branchId ?? ''
            );
          }
          else if (
            firstRoleNumber === 2 ||
            firstRoleNumber === 3
          ) {
            // CompanyAdmin / unrestricted HR
            // defaults to Full Access.
            setBranchId(null);
          }
          else if (activeBranches.length > 0) {
            // Other roles require a branch.
            setBranchId(
              activeBranches[0].id
            );
          }
          else {
            setBranchId('');
          }
        }

        // --------------------------------------------------------
        // If role already exists, synchronize branch
        // --------------------------------------------------------

        if (roleNumber !== '') {

          if (currentHrHasFixedBranch) {
            setBranchId(
              currentUser?.branchId ?? ''
            );
          }
          else if (
            roleNumber === 2 ||
            roleNumber === 3
          ) {
            /*
              CompanyAdmin / unrestricted HR:
              preserve current branch if valid,
              otherwise Full Access.
            */

            if (
              branchId !== null &&
              branchId !== '' &&
              !activeBranches.some(
                (branch) =>
                  branch.id === branchId
              )
            ) {
              setBranchId(null);
            }
          }
          else {

            /*
              All other roles require an actual branch.
            */

            if (
              branchId === null ||
              branchId === ''
            ) {
              if (activeBranches.length > 0) {
                setBranchId(
                  activeBranches[0].id
                );
              }
            }
          }
        }

      } catch (err) {
        console.error(
          'Failed to load employee form data:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load branches and roles.'
        );
      } finally {
        setIsLoadingBranches(false);
        setIsLoadingRoles(false);
      }
    };

    loadData();

    // We intentionally load when modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddEmployeeOpen]);

  // ============================================================
  // ROLE CHANGE
  // ============================================================

  const handleRoleChange = (
    newRoleNumber: number | ''
  ) => {
    setRoleNumber(newRoleNumber);
    setError(null);

    if (newRoleNumber === '') {
      setBranchId('');
      return;
    }

    /*
      FIXED HR:

      No matter which employee role is selected,
      the employee must belong to the HR's branch.
    */
    if (currentHrHasFixedBranch) {
      setBranchId(
        currentUser?.branchId ?? ''
      );
      return;
    }

    /*
      CompanyAdmin / unrestricted HR:

      Roles 2 and 3 support Full Access.
    */
    if (
      newRoleNumber === 2 ||
      newRoleNumber === 3
    ) {
      setBranchId(null);
      return;
    }

    /*
      All other roles require an actual branch.
    */
    setBranchId('');
  };

  // ============================================================
  // BRANCH CHANGE
  // ============================================================

  const handleBranchChange = (
    value: string
  ) => {
    setError(null);

    /*
      Fixed HR cannot change their branch.
    */
    if (currentHrHasFixedBranch) {
      setBranchId(
        currentUser?.branchId ?? ''
      );
      return;
    }

    /*
      Full Access
    */
    if (
      value === 'full-access' &&
      canAssignFullAccess
    ) {
      setBranchId(null);
      return;
    }

    /*
      Nothing selected
    */
    if (!value) {
      setBranchId('');
      return;
    }

    const selectedId = Number(value);

    /*
      Make sure selected branch actually exists
      in the allowed branch list.
    */
    const selectedBranch =
      availableBranches.find(
        (branch) =>
          branch.id === selectedId
      );

    if (!selectedBranch) {
      setBranchId('');
      return;
    }

    setBranchId(selectedId);
  };

  // ============================================================
  // RESET
  // ============================================================

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setEmployeeCode('');
    setDepartment('');
    setDesignation('Senior');

    setBranchId('');
    setRoleNumber('');

    setSalaryBase(6000);

    setError(null);
  };

  // ============================================================
  // CLOSE
  // ============================================================

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    setIsAddEmployeeOpen(false);
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError(null);

    // ----------------------------------------------------------
    // Basic validation
    // ----------------------------------------------------------

    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    if (!password) {
      setError(
        'Temporary password is required.'
      );
      return;
    }

    if (password.length < 8) {
      setError(
        'Password must be at least 8 characters.'
      );
      return;
    }

    if (!employeeCode.trim()) {
      setError(
        'Employee code is required.'
      );
      return;
    }

    if (!department.trim()) {
      setError(
        'Department is required.'
      );
      return;
    }

    if (!designation.trim()) {
      setError(
        'Designation is required.'
      );
      return;
    }

    if (roleNumber === '') {
      setError(
        'Please select a role.'
      );
      return;
    }

    // ----------------------------------------------------------
    // NEVER allow SuperAdmin
    // ----------------------------------------------------------

    if (roleNumber === 1) {
      setError(
        'SuperAdmin cannot be created from the employee management system.'
      );
      return;
    }

    // ----------------------------------------------------------
    // FIXED HR VALIDATION
    // ----------------------------------------------------------

    if (currentHrHasFixedBranch) {

      const assignedBranchId =
        currentUser?.branchId;

      if (
        assignedBranchId === null ||
        assignedBranchId === undefined
      ) {
        setError(
          'Your HR account does not have a valid assigned branch.'
        );
        return;
      }

      if (
        branchId !== assignedBranchId
      ) {
        setError(
          'You can only assign employees to your assigned branch.'
        );
        return;
      }
    }

    // ----------------------------------------------------------
    // FULL ACCESS / BRANCH VALIDATION
    // ----------------------------------------------------------

    if (
      selectedRoleHasFullAccessOption
    ) {

      /*
        Role 2 / 3:

        null = Full Access
        number = specific branch
      */

      if (
        branchId === ''
      ) {
        setError(
          'Please select a branch or Full Access.'
        );
        return;
      }

      /*
        Only CompanyAdmin and unrestricted HR
        can actually use Full Access.
      */
      if (
        branchId === null &&
        !canAssignFullAccess
      ) {
        setError(
          'You are not allowed to assign Full Access.'
        );
        return;
      }

    } else {

      /*
        All other roles MUST have a real branch.
      */

      if (
        branchId === '' ||
        branchId === null
      ) {
        setError(
          'Please select a branch.'
        );
        return;
      }
    }

    // ----------------------------------------------------------
    // Validate actual branch against allowed branches
    // ----------------------------------------------------------

    if (
      typeof branchId === 'number'
    ) {
      const branchExists =
        availableBranches.some(
          (branch) =>
            branch.id === branchId
        );

      if (!branchExists) {
        setError(
          'The selected branch is not available for your account.'
        );
        return;
      }
    }

    // ----------------------------------------------------------
    // Salary
    // ----------------------------------------------------------

    if (salaryBase < 0) {
      setError(
        'Salary cannot be negative.'
      );
      return;
    }

    // ----------------------------------------------------------
    // Build request
    // ----------------------------------------------------------

    const request: CreateUserRequest = {
      fullName: name.trim(),

      email:
        email.trim().toLowerCase(),

      password,

      employeeCode:
        employeeCode.trim(),

      roleNumber,

      designation:
        designation.trim(),

      department:
        department.trim(),

      salaryBase,

      /*
        '' should never reach backend.
        null = Full Access.
        number = selected branch.
      */
      branchId:
        branchId === ''
          ? null
          : branchId,

      avatarUrl: '',
    };

    // ----------------------------------------------------------
    // Submit
    // ----------------------------------------------------------

    try {
      setIsSubmitting(true);

      await createUser(request);

      resetForm();
      setIsAddEmployeeOpen(false);

      toast.success(
        'Employee added successfully.'
      );

      window.dispatchEvent(
        new Event('employee-created')
      );

    } catch (err) {
      console.error(
        'Failed to create employee:',
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : 'Failed to create employee.';

      setError(message);

      toast.error(message);

    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // CLOSED
  // ============================================================

  if (!isAddEmployeeOpen) {
    return null;
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">

      <div className="relative w-full max-w-2xl bg-[#09071e] border border-[#2d2770] rounded-2xl shadow-2xl overflow-hidden my-8">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex items-center justify-between px-6 py-4 bg-[#0e0b2e] border-b border-[#231e54]">

          <div className="flex items-center gap-2.5">

            <div className="p-2 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
              <UserPlus className="w-5 h-5" />
            </div>

            <div>

              <h2 className="text-base font-bold text-white leading-tight">
                Add Employee
              </h2>

              <p className="text-xs text-slate-400">
                Create a new employee account and assign access
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg hover:bg-[#1f1857] text-slate-400 hover:text-white disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>

        </div>

        {/* =====================================================
            FORM
        ====================================================== */}

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 text-xs text-slate-200"
        >

          {/* Error */}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300">

              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />

              <span>
                {error}
              </span>

            </div>
          )}

          {/* ===================================================
              NAME + EMAIL
          ==================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>

              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Full Name *
              </label>

              <input
                type="text"
                required
                placeholder="e.g. Jonathan Hayes"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0]"
              />

            </div>

            <div>

              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Corporate Email *
              </label>

              <input
                type="email"
                required
                placeholder="jonathan.hayes@estusciagroup.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0]"
              />

            </div>

          </div>

          {/* ===================================================
              PASSWORD + EMPLOYEE CODE
          ==================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>

              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Temporary Password *
              </label>

              <input
                type="password"
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0]"
              />

              <p className="mt-1 text-[10px] text-slate-500">
                The backend will securely hash this password.
              </p>

            </div>

            <div>

              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Employee Code *
              </label>

              <input
                type="text"
                required
                placeholder="EST-ADV-001"
                value={employeeCode}
                onChange={(e) =>
                  setEmployeeCode(e.target.value)
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-[#A78BFA] font-mono focus:outline-none focus:border-[#5C3FE0]"
              />

            </div>

          </div>

          {/* ===================================================
              ROLE + BRANCH
          ==================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ROLE */}

            <div>

              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Role *
              </label>

              <select
                required
                value={roleNumber}
                onChange={(e) =>
                  handleRoleChange(
                    e.target.value
                      ? Number(e.target.value)
                      : ''
                  )
                }
                disabled={
                  isLoadingRoles ||
                  isSubmitting
                }
                className="w-full px-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0] disabled:opacity-50"
              >

                <option value="">
                  {isLoadingRoles
                    ? 'Loading roles...'
                    : 'Select role'}
                </option>

                {availableRoles.map(
                  (role) => (
                    <option
                      key={role.roleNumber}
                      value={role.roleNumber}
                    >
                      {role.displayName}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* BRANCH */}

            <div>

              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Branch *
              </label>

              <select
                required
                value={
                  currentHrHasFixedBranch
                    ? String(
                        currentUser?.branchId ?? ''
                      )
                    : branchId === null
                      ? 'full-access'
                      : branchId === ''
                        ? ''
                        : String(branchId)
                }
                onChange={(e) =>
                  handleBranchChange(
                    e.target.value
                  )
                }
                disabled={
                  isLoadingBranches ||
                  isSubmitting ||
                  roleNumber === '' ||
                  currentHrHasFixedBranch
                }
                className="w-full px-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0] disabled:opacity-50"
              >

                {/* Select */}

                <option value="">
                  {isLoadingBranches
                    ? 'Loading branches...'
                    : 'Select branch'}
                </option>

                {/* Full Access */}

                {canAssignFullAccess && (
                  <option value="full-access">
                    Full Access
                  </option>
                )}

                {/* Actual branches */}

                {availableBranches.map(
                  (branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.branchName}
                      {branch.city
                        ? ` — ${branch.city}`
                        : ''}
                    </option>
                  )
                )}

              </select>

              {/* =================================================
                  FIXED HR INFORMATION
              ================================================== */}

              {currentHrHasFixedBranch && (
                <p className="mt-1 text-[10px] text-amber-400">
                  You can only assign employees to your assigned branch.
                </p>
              )}

              {/* =================================================
                  FULL ACCESS INFORMATION
              ================================================== */}

              {selectedRoleHasFullAccessOption &&
                branchId === null &&
                canAssignFullAccess && (
                  <p className="mt-1 text-[10px] text-cyan-400">
                    This employee will have access across all branches.
                  </p>
                )}

            </div>

          </div>

          {/* ===================================================
              DEPARTMENT + DESIGNATION
          ==================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>

              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Department *
              </label>

              <input
                type="text"
                required
                placeholder="Private Client Advisory"
                value={department}
                onChange={(e) =>
                  setDepartment(e.target.value)
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0]"
              />

            </div>

            <div>

              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Employee Level *
              </label>

              <select
                required
                value={designation}
                onChange={(e) =>
                  setDesignation(e.target.value)
                }
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0] disabled:opacity-50"
              >

                <option value="Senior">
                  Senior
                </option>

                <option value="Junior">
                  Junior
                </option>

              </select>

            </div>

          </div>

          {/* ===================================================
              SALARY
          ==================================================== */}

          <div className="p-4 rounded-xl bg-[#0d0926] border border-[#231e54] space-y-3">

            <div className="text-[11px] font-bold text-[#A78BFA] uppercase tracking-wider">
              Compensation
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <div>

                <label className="block text-[10px] text-slate-400 mb-1">
                  Basic Salary
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={salaryBase}
                  onChange={(e) =>
                    setSalaryBase(
                      Number(e.target.value)
                    )
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#140f3d] border border-[#2d2770] text-white font-mono"
                />

              </div>

              <div>

                <label className="block text-[10px] text-slate-400 mb-1">
                  Currency
                </label>

                <div className="px-2.5 py-1.5 rounded-lg bg-[#140f3d] border border-[#2d2770] text-slate-400">
                  {currentUser?.currency
                    ? `${currentUser.currency.symbol} ${currentUser.currency.code}`
                    : 'Branch currency'}
                </div>

              </div>

            </div>

            <p className="text-[10px] text-slate-500">
              HRA, special allowances, and target allocation
              are not stored in the current Users table.
            </p>

          </div>

          {/* ===================================================
              FOOTER
          ==================================================== */}

          <div className="pt-3 border-t border-[#231e54] flex items-center justify-end gap-3">

            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingBranches ||
                isLoadingRoles ||
                roleNumber === ''
              }
              className="px-5 py-2.5 rounded-xl bg-[#5C3FE0] hover:bg-[#7152FF] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-[#5C3FE0]/30 transition-all flex items-center gap-2"
            >

              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />

                  <span>
                    Creating Employee...
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />

                  <span>
                    Complete Onboarding
                  </span>
                </>
              )}

            </button>

          </div>

        </form>
      </div>
    </div>
  );
};