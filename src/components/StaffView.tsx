import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BackendUser, getUsers } from '../api/users';

export const StaffView: React.FC = () => {
  const {
    setIsAddEmployeeOpen,
  } = useApp();

  const [users, setUsers] = useState<BackendUser[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedUserForDetail, setSelectedUserForDetail] =
    useState<BackendUser | null>(null);

  // Load users from backend
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsUsersLoading(true);
        setUsersError(null);

        const data = await getUsers();

        setUsers(data);
      } catch (error) {
        console.error('Failed to load users:', error);

        setUsersError(
          error instanceof Error
            ? error.message
            : 'Failed to load users.'
        );
      } finally {
        setIsUsersLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Count unique branches represented by users
  const branchCount = new Set(
    users
      .map((user) => user.branchId)
      .filter((id): id is number => id !== null)
  ).size;

  // Get departments from backend users
  const departments = Array.from(
    new Set(
      users
        .map((user) => user.department)
        .filter(
          (department): department is string =>
            Boolean(department)
        )
    )
  ).sort();

  // Search + department filter
  const filteredUsers = users.filter((user) => {
    const search = searchQuery.toLowerCase();

    const matchesSearch =
      user.fullName.toLowerCase().includes(search) ||
      user.employeeCode.toLowerCase().includes(search) ||
      user.designation.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search);

    const matchesDept =
      selectedDept === 'all' ||
      user.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 pb-12">

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
              <Users className="w-5 h-5" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-white leading-tight">
                Staff & Workforce Directory
              </h1>

              <p className="text-xs text-slate-400">
                Manage employees, roles, salary information, and workforce
                across {branchCount} branches
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddEmployeeOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#5C3FE0] hover:bg-[#7152FF] text-white text-xs font-bold shadow-lg shadow-[#5C3FE0]/30 transition-all flex items-center gap-2 cursor-pointer"
          id="onboard-employee-btn"
        >
          <UserPlus className="w-4 h-4" />
          <span>Onboard New Employee</span>
        </button>
      </div>

      {/* Loading */}
      {isUsersLoading && (
        <div className="p-6 rounded-2xl bg-[#09071e] border border-[#231e54] text-sm text-slate-400">
          Loading employees...
        </div>
      )}

      {/* Error */}
      {usersError && (
        <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/50 text-sm text-red-400">
          {usersError}
        </div>
      )}

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-[#09071e] border border-[#231e54] text-xs">

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />

          <input
            type="text"
            placeholder="Search by name, code, designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#5C3FE0]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-slate-200 text-xs w-full sm:w-auto"
          >
            <option value="all">
              All Departments ({users.length})
            </option>

            {departments.map((department) => (
              <option
                key={department}
                value={department}
              >
                {department}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State */}
      {!isUsersLoading && !usersError && filteredUsers.length === 0 && (
        <div className="p-10 rounded-2xl bg-[#09071e] border border-[#231e54] text-center">
          <Users className="w-10 h-10 mx-auto text-slate-500 mb-3" />

          <h3 className="text-sm font-bold text-white">
            No employees found
          </h3>

          <p className="text-xs text-slate-400 mt-1">
            Try changing your search or department filter.
          </p>
        </div>
      )}

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {filteredUsers.map((user) => (
          <div
            key={user.id}
            onClick={() => setSelectedUserForDetail(user)}
            className="p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/80 hover:border-[#5C3FE0] transition-all space-y-4 shadow-lg cursor-pointer group"
          >

            {/* Profile Header */}
            <div className="flex items-start gap-3">

              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-[#5C3FE0]/50 group-hover:ring-[#5C3FE0] transition-all"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#1a144b] border border-[#2d2770] flex items-center justify-center text-[#A78BFA] font-bold">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">

                <div className="flex items-center justify-between gap-2">

                  <h3 className="text-sm font-bold text-white truncate group-hover:text-[#A78BFA] transition-colors">
                    {user.fullName}
                  </h3>

                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1a144b] text-[#A78BFA] border border-[#2d2770] shrink-0">
                    {user.employeeCode}
                  </span>

                </div>

                <div className="text-xs text-slate-300 font-medium truncate mt-0.5">
                  {user.designation}
                </div>

                <div className="text-[11px] text-slate-400 truncate">
                  {user.department}
                  {' • '}
                  {user.branchName ?? 'No Branch'}
                </div>

              </div>
            </div>

            {/* Employee Information */}
            <div className="p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54] space-y-2 text-xs">

              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  Role
                </span>

                <span className="text-[#A78BFA] font-semibold">
                  {user.roleName.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  Salary
                </span>

                <span className="font-mono text-white font-semibold">
                  {user.salaryBase.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  Status
                </span>

                <span className="text-emerald-400 font-semibold">
                  Active
                </span>
              </div>

            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-[#1e1950] flex items-center justify-between text-[11px] text-slate-400">

              <span>
                {user.email}
              </span>

              <span className="text-[#A78BFA] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>

            </div>

          </div>
        ))}

      </div>

      {/* User Detail Modal */}
      {selectedUserForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">

          <div className="w-full max-w-2xl bg-[#09071e] border border-[#2d2770] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6 text-xs text-slate-200">

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#231e54]">

              <div className="flex items-center gap-3">

                {selectedUserForDetail.avatarUrl ? (
                  <img
                    src={selectedUserForDetail.avatarUrl}
                    alt={selectedUserForDetail.fullName}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-[#5C3FE0]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#1a144b] border border-[#2d2770] flex items-center justify-center text-[#A78BFA] font-bold">
                    {selectedUserForDetail.fullName
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div>
                  <h2 className="text-base font-bold text-white">
                    {selectedUserForDetail.fullName}
                  </h2>

                  <p className="text-xs text-slate-400">
                    {selectedUserForDetail.designation}
                    {' • '}
                    {selectedUserForDetail.employeeCode}
                  </p>
                </div>

              </div>

              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="px-3 py-1 rounded-lg hover:bg-[#1a144b] text-slate-400 hover:text-white"
              >
                Close
              </button>

            </div>

            {/* Employee Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

              <div className="p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54]">
                <span className="text-[10px] text-slate-400 uppercase block">
                  Employee Code
                </span>

                <span className="font-mono text-white font-bold">
                  {selectedUserForDetail.employeeCode}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54]">
                <span className="text-[10px] text-slate-400 uppercase block">
                  Role
                </span>

                <span className="text-[#A78BFA] font-bold capitalize">
                  {selectedUserForDetail.roleName.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54]">
                <span className="text-[10px] text-slate-400 uppercase block">
                  Department
                </span>

                <span className="text-white font-bold">
                  {selectedUserForDetail.department}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54]">
                <span className="text-[10px] text-slate-400 uppercase block">
                  Branch
                </span>

                <span className="text-white font-bold">
                  {selectedUserForDetail.branchName ?? 'No Branch'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54]">
                <span className="text-[10px] text-slate-400 uppercase block">
                  Basic Salary
                </span>

                <span className="font-mono text-white font-bold">
                  {selectedUserForDetail.salaryBase.toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54]">
                <span className="text-[10px] text-slate-400 uppercase block">
                  Status
                </span>

                <span className="text-emerald-400 font-bold">
                  {selectedUserForDetail.isActive
                    ? 'Active'
                    : 'Inactive'}
                </span>
              </div>

            </div>

            {/* Contact / Organization */}
            <div className="space-y-3">

              <div className="text-slate-400">
                <span className="font-semibold text-white">
                  Email:
                </span>{' '}
                {selectedUserForDetail.email}
              </div>

              <div className="text-slate-400">
                <span className="font-semibold text-white">
                  Organization:
                </span>{' '}
                {selectedUserForDetail.tenantName}
              </div>

              <div className="text-slate-400">
                <span className="font-semibold text-white">
                  Tenant ID:
                </span>{' '}
                <span className="font-mono">
                  {selectedUserForDetail.tenantId}
                </span>
              </div>

              <div className="text-slate-400">
                <span className="font-semibold text-white">
                  Branch ID:
                </span>{' '}
                <span className="font-mono">
                  {selectedUserForDetail.branchId ?? 'N/A'}
                </span>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};