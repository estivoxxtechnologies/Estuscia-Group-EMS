import React, { useEffect, useState } from 'react';
import {
    X,
    UserCog,
    CheckCircle2,
    Loader2,
    AlertCircle,
} from 'lucide-react';

import {
    BackendUser,
    updateUser,
} from '../api/users';

import {
    getBranches,
} from '../api/branches';

import {
    Branch,
} from '../types/branch';

import {
    getRoles,
    BackendRole,
} from '../api/roles';

interface EditEmployeeModalProps {
    user: BackendUser | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdated: (user: BackendUser) => void;
}

export const EditEmployeeModal: React.FC<
    EditEmployeeModalProps
> = ({
    user,
    isOpen,
    onClose,
    onUpdated,
}) => {

        const [name, setName] = useState('');
        const [email, setEmail] = useState('');
        const [employeeCode, setEmployeeCode] = useState('');

        const [department, setDepartment] = useState('');
        const [designation, setDesignation] = useState('');

        const [branchId, setBranchId] =
            useState<number | ''>('');

        const [roleNumber, setRoleNumber] =
            useState<number | ''>('');

        const [salaryBase, setSalaryBase] =
            useState<number>(0);

        const [isActive, setIsActive] =
            useState(true);

        const [branches, setBranches] =
            useState<Branch[]>([]);

        const [roles, setRoles] =
            useState<BackendRole[]>([]);

        const [isLoading, setIsLoading] =
            useState(false);

        const [isSubmitting, setIsSubmitting] =
            useState(false);

        const [error, setError] =
            useState<string | null>(null);

        /*
         * Populate form from selected BackendUser
         */
        useEffect(() => {
            if (!isOpen || !user) {
                return;
            }

            setName(user.fullName);
            setEmail(user.email);
            setEmployeeCode(user.employeeCode);

            setDepartment(user.department);
            setDesignation(user.designation);

            setBranchId(
                user.branchId ?? ''
            );

            setRoleNumber(
                user.roleId
            );

            setSalaryBase(
                user.salaryBase
            );

            setIsActive(
                user.isActive
            );

            setError(null);

        }, [isOpen, user]);

        /*
         * Load branches and roles
         */
        useEffect(() => {
            if (!isOpen) {
                return;
            }

            const loadData = async () => {
                try {
                    setIsLoading(true);
                    setError(null);

                    const [
                        branchData,
                        roleData,
                    ] = await Promise.all([
                        getBranches(),
                        getRoles(),
                    ]);

                    setBranches(branchData);
                    setRoles(roleData);

                } catch (err) {
                    console.error(
                        'Failed to load edit employee data:',
                        err
                    );

                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Failed to load employee data.'
                    );

                } finally {
                    setIsLoading(false);
                }
            };

            loadData();

        }, [isOpen]);

        /*
         * Submit update
         */
        const handleSubmit = async (
            e: React.FormEvent
        ) => {
            e.preventDefault();

            if (!user) {
                return;
            }

            setError(null);

            if (!name.trim()) {
                setError(
                    'Full name is required.'
                );
                return;
            }

            if (!email.trim()) {
                setError(
                    'Email is required.'
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

            if (branchId === '') {
                setError(
                    'Please select a branch.'
                );
                return;
            }

            if (roleNumber === '') {
                setError(
                    'Please select a role.'
                );
                return;
            }

            if (salaryBase < 0) {
                setError(
                    'Salary cannot be negative.'
                );
                return;
            }

            try {
                setIsSubmitting(true);

                const updatedUser =
                    await updateUser(
                        user.id,
                        {
                            fullName: name.trim(),

                            email: email
                                .trim()
                                .toLowerCase(),

                            employeeCode:
                                employeeCode.trim(),

                            roleNumber,

                            designation:
                                designation.trim(),

                            department:
                                department.trim(),

                            salaryBase,

                            branchId,

                            avatarUrl:
                                user.avatarUrl,

                            isActive,
                        }
                    );

                onUpdated(updatedUser);

                onClose();

            } catch (err) {
                console.error(
                    'Failed to update employee:',
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to update employee.'
                );

            } finally {
                setIsSubmitting(false);
            }
        };

        if (!isOpen || !user) {
            return null;
        }

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">

                <div className="relative w-full max-w-2xl bg-[#09071e] border border-[#2d2770] rounded-2xl shadow-2xl overflow-hidden my-8">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-[#0e0b2e] border-b border-[#231e54]">

                        <div className="flex items-center gap-2.5">

                            <div className="p-2 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
                                <UserCog className="w-5 h-5" />
                            </div>

                            <div>
                                <h2 className="text-base font-bold text-white">
                                    Edit Employee
                                </h2>

                                <p className="text-xs text-slate-400">
                                    Update employee information and account status
                                </p>
                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={onClose}
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

                        {/* Full Name + Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                    Full Name *
                                </label>

                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) =>
                                        setName(
                                            e.target.value
                                        )
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
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                    className="w-full px-3.5 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0]"
                                />
                            </div>

                        </div>

                        {/* Employee Code + Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                    Employee Code *
                                </label>

                                <input
                                    type="text"
                                    required
                                    value={employeeCode}
                                    onChange={(e) =>
                                        setEmployeeCode(
                                            e.target.value
                                        )
                                    }
                                    className="w-full px-3.5 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-[#A78BFA] font-mono focus:outline-none focus:border-[#5C3FE0]"
                                />
                            </div>

                            {/* Active / Inactive */}
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                    Account Status
                                </label>

                                <button
                                    type="button"
                                    onClick={() => setIsActive((current) => !current)}
                                    disabled={isSubmitting}
                                    className={`w-full h-[40px] px-3 rounded-xl border flex items-center justify-between transition-all ${isActive
                                            ? 'bg-emerald-500/10 border-emerald-500/30'
                                            : 'bg-red-500/10 border-red-500/30'
                                        }`}
                                >
                                    <span
                                        className={
                                            isActive
                                                ? 'text-emerald-400 font-medium'
                                                : 'text-red-400 font-medium'
                                        }
                                    >
                                        {isActive ? 'Active' : 'Inactive'}
                                    </span>

                                    {/* Toggle */}
                                    <span
                                        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${isActive
                                                ? 'bg-emerald-500'
                                                : 'bg-slate-600'
                                            }`}
                                    >
                                        <span
                                            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${isActive
                                                    ? 'translate-x-5'
                                                    : 'translate-x-0'
                                                }`}
                                        />
                                    </span>
                                </button>
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
                                                ? Number(
                                                    e.target.value
                                                )
                                                : ''
                                        )
                                    }
                                    disabled={
                                        isLoading ||
                                        isSubmitting
                                    }
                                    className="w-full px-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0] disabled:opacity-50"
                                >
                                    <option value="">
                                        Select role
                                    </option>

                                    {roles
                                        .filter(
                                            role =>
                                                role.isActive ||
                                                role.roleNumber ===
                                                user.roleId
                                        )
                                        .map(role => (
                                            <option
                                                key={
                                                    role.roleNumber
                                                }
                                                value={
                                                    role.roleNumber
                                                }
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
                                                ? Number(
                                                    e.target.value
                                                )
                                                : ''
                                        )
                                    }
                                    disabled={
                                        isLoading ||
                                        isSubmitting
                                    }
                                    className="w-full px-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0] disabled:opacity-50"
                                >
                                    <option value="">
                                        Select branch
                                    </option>

                                    {branches
                                        .filter(
                                            branch =>
                                                branch.isActive ||
                                                branch.id ===
                                                user.branchId
                                        )
                                        .map(branch => (
                                            <option
                                                key={
                                                    branch.id
                                                }
                                                value={
                                                    branch.id
                                                }
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
                                    value={department}
                                    onChange={(e) =>
                                        setDepartment(
                                            e.target.value
                                        )
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
                                    value={designation}
                                    onChange={(e) =>
                                        setDesignation(
                                            e.target.value
                                        )
                                    }
                                    className="w-full px-3.5 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0]"
                                />
                            </div>

                        </div>

                        {/* Salary */}
                        <div className="p-4 rounded-xl bg-[#0d0926] border border-[#231e54]">

                            <div className="text-[11px] font-bold text-[#A78BFA] uppercase tracking-wider mb-3">
                                Compensation
                            </div>

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
                                            Number(
                                                e.target.value
                                            )
                                        )
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#140f3d] border border-[#2d2770] text-white font-mono"
                                />
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="pt-3 border-t border-[#231e54] flex items-center justify-end gap-3">

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={
                                    isSubmitting
                                }
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={
                                    isSubmitting ||
                                    isLoading
                                }
                                className="px-5 py-2.5 rounded-xl bg-[#5C3FE0] hover:bg-[#7152FF] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-[#5C3FE0]/30 flex items-center gap-2"
                            >

                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}

                            </button>

                        </div>

                    </form>
                </div>
            </div>
        );
    };