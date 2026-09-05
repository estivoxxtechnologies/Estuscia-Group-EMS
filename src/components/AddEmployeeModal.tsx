import React, { useEffect, useState } from 'react';
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
  } = useApp();

  // --------------------------------------------------
  // Form state
  // --------------------------------------------------

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');

  const [department, setDepartment] = useState('');
  const [designation, setDesignation] =
    useState('Investment Advisor');

  const [branchId, setBranchId] =
    useState<number | ''>('');

  const [roleNumber, setRoleNumber] =
    useState<number | ''>('');

  const [salaryBase, setSalaryBase] =
    useState<number>(6000);

  // --------------------------------------------------
  // Backend data
  // --------------------------------------------------

  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [roles, setRoles] =
    useState<BackendRole[]>([]);

  // --------------------------------------------------
  // UI state
  // --------------------------------------------------

  const [isLoadingBranches, setIsLoadingBranches] =
    useState(false);

  const [isLoadingRoles, setIsLoadingRoles] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // --------------------------------------------------
  // Load branches + roles when modal opens
  // --------------------------------------------------

  useEffect(() => {
    if (!isAddEmployeeOpen) {
      return;
    }

    const loadData = async () => {
      try {
        setError(null);

        setIsLoadingBranches(true);
        setIsLoadingRoles(true);

        const [branchData, roleData] =
          await Promise.all([
            getBranches(),
            getRoles(),
          ]);

        setBranches(branchData);
        setRoles(roleData);

        // Select first branch automatically
        if (
          branchData.length > 0 &&
          branchId === ''
        ) {
          setBranchId(branchData[0].id);
        }

        // Select first active role automatically
        const activeRoles = roleData.filter(
          (role) => role.isActive
        );

        if (
          activeRoles.length > 0 &&
          roleNumber === ''
        ) {
          setRoleNumber(
            activeRoles[0].roleNumber
          );
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
  }, [isAddEmployeeOpen]);

  // --------------------------------------------------
  // Reset form
  // --------------------------------------------------

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setEmployeeCode('');
    setDepartment('');
    setDesignation('Investment Advisor');
    setBranchId('');
    setRoleNumber('');
    setSalaryBase(6000);
    setError(null);
  };

  // --------------------------------------------------
  // Close modal
  // --------------------------------------------------

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    setIsAddEmployeeOpen(false);
  };

  // --------------------------------------------------
  // Submit
  // --------------------------------------------------

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError(null);

    // Basic validation
    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    if (!password) {
      setError('Temporary password is required.');
      return;
    }

    if (password.length < 8) {
      setError(
        'Password must be at least 8 characters.'
      );
      return;
    }

    if (!employeeCode.trim()) {
      setError('Employee code is required.');
      return;
    }

    if (!department.trim()) {
      setError('Department is required.');
      return;
    }

    if (!designation.trim()) {
      setError('Designation is required.');
      return;
    }

    if (branchId === '') {
      setError('Please select a branch.');
      return;
    }

    if (roleNumber === '') {
      setError('Please select a role.');
      return;
    }

    if (salaryBase < 0) {
      setError(
        'Salary cannot be negative.'
      );
      return;
    }

    const request: CreateUserRequest = {
      fullName: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      employeeCode: employeeCode.trim(),
      roleNumber,
      designation: designation.trim(),
      department: department.trim(),
      salaryBase,
      branchId,
      avatarUrl: '',
    };

    try {
      setIsSubmitting(true);

      await createUser(request);

      // Successfully created
      resetForm();
      setIsAddEmployeeOpen(false);
      toast.success('Employee added successfully.');

      // Notify StaffView to reload if using this event
      window.dispatchEvent(
        new Event('employee-created')
      );

    } catch (err) {
      console.error(
        'Failed to create employee:',
        err
      );
      toast.error('Failed to create employee.');

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create employee.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------
  // Don't render when closed
  // --------------------------------------------------

  if (!isAddEmployeeOpen) {
    return null;
  }

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#09071e] border border-[#2d2770] rounded-2xl shadow-2xl overflow-hidden my-8">

        {/* Header */}
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

        {/* Form */}
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

          {/* Name + Email */}
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

          {/* Password + Employee Code */}
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

          {/* Role + Branch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Role *
              </label>

              <select
                required
                value={roleNumber}
                onChange={(e) =>
                  setRoleNumber(
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

                {roles
                  .filter(
                    (role) => role.isActive
                  )
                  .map((role) => (
                    <option
                      key={role.roleNumber}
                      value={role.roleNumber}
                    >
                      {role.roleName}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Branch *
              </label>

              <select
                required
                value={branchId}
                onChange={(e) =>
                  setBranchId(
                    e.target.value
                      ? Number(e.target.value)
                      : ''
                  )
                }
                disabled={
                  isLoadingBranches ||
                  isSubmitting
                }
                className="w-full px-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0] disabled:opacity-50"
              >
                <option value="">
                  {isLoadingBranches
                    ? 'Loading branches...'
                    : 'Select branch'}
                </option>

                {branches
                  .filter(
                    (branch) =>
                      branch.isActive
                  )
                  .map((branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.branchName}
                      {branch.city
                        ? ` — ${branch.city}`
                        : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Department + Designation */}
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
                Designation *
              </label>

              <input
                type="text"
                required
                placeholder="Senior Wealth Advisor"
                value={designation}
                onChange={(e) =>
                  setDesignation(e.target.value)
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0]"
              />
            </div>
          </div>

          {/* Salary */}
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
                  Tenant currency
                </div>
              </div>

            </div>

            <p className="text-[10px] text-slate-500">
              HRA, special allowances, and target allocation
              are not stored in the current Users table.
            </p>
          </div>

          {/* Footer */}
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
                isLoadingRoles
              }
              className="px-5 py-2.5 rounded-xl bg-[#5C3FE0] hover:bg-[#7152FF] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-[#5C3FE0]/30 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Employee...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Onboarding</span>
                </>
              )}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
};