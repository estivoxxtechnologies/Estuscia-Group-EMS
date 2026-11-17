
import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Users,
  UserRound,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import type { Branch } from '../types/branch';

import {
  getEmployeesByBranch,
  type EmployeeBasicInfo,
} from '../api/userDetails';

import UserDetailsView from './UserDetailsView';

const AddUserDetailsView: React.FC = () => {
  const {
    currentUser,
    branches,
    isBranchesLoading,
  } = useApp();

  const [selectedBranchId, setSelectedBranchId] =
    useState<number | ''>('');

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState<number | null>(null);

  const [employees, setEmployees] =
    useState<EmployeeBasicInfo[]>([]);

  const [employeesLoading, setEmployeesLoading] =
    useState(false);

  const [error, setError] = useState<string | null>(null);

  const role =
    currentUser?.roleName?.trim().toLowerCase() ?? '';

  const canManageEmployeeDetails = [
    'company_admin',
    'hr_ops',
    'branch_manager',
  ].includes(role);

  // Branch Managers can access only their assigned branch.
  const availableBranches = useMemo(() => {
    if (role === 'branch_manager') {
      return branches.filter(
        (branch: Branch) =>
          branch.id === currentUser?.branchId,
      );
    }

    return branches;
  }, [branches, currentUser?.branchId, role]);

  // Automatically select the assigned branch for Branch Managers.
  useEffect(() => {
    if (
      role === 'branch_manager' &&
      currentUser?.branchId != null
    ) {
      setSelectedBranchId(currentUser.branchId);
    }
  }, [role, currentUser?.branchId]);

  // Load employees whenever the selected branch changes.
  useEffect(() => {
    if (selectedBranchId === '') {
      setEmployees([]);
      setSelectedEmployeeId(null);
      setEmployeesLoading(false);
      setError(null);
      return;
    }

    let isActive = true;

    const loadEmployees = async () => {
      setEmployeesLoading(true);
      setError(null);
      setEmployees([]);
      setSelectedEmployeeId(null);

      try {
        const result = await getEmployeesByBranch(
          Number(selectedBranchId),
        );

        if (isActive) {
          setEmployees(result);
        }
      } catch (err) {
        console.error(
          'Failed to load branch employees:',
          err,
        );

        if (isActive) {
          setEmployees([]);
          setError(
            'Unable to load employees for this branch. Please try again.',
          );
        }
      } finally {
        if (isActive) {
          setEmployeesLoading(false);
        }
      }
    };

    void loadEmployees();

    return () => {
      isActive = false;
    };
  }, [selectedBranchId]);

  const selectedEmployee = employees.find(
    (employee) => employee.id === selectedEmployeeId,
  );

  const handleBranchChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = event.target.value;

    setSelectedBranchId(value ? Number(value) : '');
    setSelectedEmployeeId(null);
    setEmployees([]);
    setError(null);
  };

  const handleEmployeeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = event.target.value;

    setSelectedEmployeeId(
      value ? Number(value) : null,
    );
  };

  if (!currentUser || !canManageEmployeeDetails) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/40 dark:bg-red-950/20">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />

          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Access restricted
            </h2>

            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Only Company Admin, HR and Branch Manager can
              manage employee details from this section.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Page heading */}
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-100 p-3 dark:bg-indigo-500/10">
            <UserRound className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Add / Update Employee Details
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select a branch and employee to add or update
              their personal and employment details.
            </p>
          </div>
        </div>
      </div>

      {/* Branch and employee selection */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Select Employee
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Choose the branch first. The employee list will
            then be filtered automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          {/* Branch selector */}
          <div>
            <label
              htmlFor="employee-details-branch"
              className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <Building2 className="h-4 w-4" />
              Branch
            </label>

            <select
              id="employee-details-branch"
              value={selectedBranchId}
              onChange={handleBranchChange}
              disabled={
                isBranchesLoading ||
                role === 'branch_manager'
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-800"
            >
              <option value="">
                {isBranchesLoading
                  ? 'Loading branches...'
                  : 'Select a branch'}
              </option>

              {availableBranches.map((branch) => (
                <option
                  key={branch.id}
                  value={branch.id}
                >
                  {branch.branchName}
                </option>
              ))}
            </select>
          </div>

          {/* Employee selector */}
          <div>
            <label
              htmlFor="employee-details-employee"
              className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <Users className="h-4 w-4" />
              Employee
            </label>

            <select
              id="employee-details-employee"
              value={selectedEmployeeId ?? ''}
              onChange={handleEmployeeChange}
              disabled={
                selectedBranchId === '' ||
                employeesLoading ||
                employees.length === 0
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-800"
            >
              <option value="">
                {selectedBranchId === ''
                  ? 'Select a branch first'
                  : employeesLoading
                    ? 'Loading employees...'
                    : employees.length === 0
                      ? 'No employees found'
                      : 'Select an employee'}
              </option>

              {employees.map((employee) => (
                <option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.fullName}
                  {employee.employeeCode
                    ? ` (${employee.employeeCode})`
                    : ''}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Loading indicator */}
        {employeesLoading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading employees...
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

      </div>

      {/* Selected employee summary */}
      {selectedEmployee && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">

          <div className="flex flex-wrap items-center justify-between gap-3">

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                Selected employee
              </p>

              <h2 className="mt-1 font-semibold text-gray-900 dark:text-white">
                {selectedEmployee.fullName}
              </h2>

              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {selectedEmployee.employeeCode || 'No employee code'}

                {selectedEmployee.designation
                  ? ` · ${selectedEmployee.designation}`
                  : ''}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedEmployeeId(null)}
              className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-gray-900 dark:text-indigo-300 dark:hover:bg-indigo-950"
            >
              Change employee
            </button>

          </div>
        </div>
      )}

      {/* Existing employee details form */}
      {selectedEmployeeId !== null && (
        <div key={selectedEmployeeId}>
          <UserDetailsView
            employeeId={selectedEmployeeId}
          />
        </div>
      )}

    </div>
  );
};

export default AddUserDetailsView;
