import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  GitBranch,
  ShieldCheck,
  Video,
  Users,
  Activity,
  ArrowUpRight,
  ChevronRight,
  Plus,
  Settings2,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { getTenants } from '../api/tenants';
import { getBranchesByTenant } from '../api/branches';
import type { BackendTenant } from '../api/tenants';
import type { Branch } from '../types/branch';

export const SuperAdminDashboard: React.FC = () => {
  const {
    currentUser,
    setActiveTab,
  } = useApp();

  const [tenants, setTenants] = useState<BackendTenant[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin =
    currentUser?.roleName?.toLowerCase() === 'super_admin';

  useEffect(() => {
    if (!isSuperAdmin) return;

    const loadOverview = async () => {
      try {
        setLoading(true);

        const tenantData = await getTenants();
        setTenants(tenantData);

        const branchResults = await Promise.all(
          tenantData.map((tenant) =>
            getBranchesByTenant(tenant.id).catch(() => [])
          )
        );

        setBranches(branchResults.flat());
      } catch (error) {
        console.error(
          'Failed to load super admin dashboard:',
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, [isSuperAdmin]);

  const activeTenants = useMemo(
    () =>
      tenants.filter(
        (tenant: any) =>
          tenant.isActive === undefined || tenant.isActive
      ).length,
    [tenants]
  );

  const activeBranches = useMemo(
    () => branches.filter((branch) => branch.isActive).length,
    [branches]
  );

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-6 text-sm text-red-400">
        You do not have permission to access this dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">
              Super Admin Dashboard
            </h1>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              SUPER ADMIN
            </span>
          </div>

          <p className="text-xs text-gray-400 mt-1">
            Global platform overview, tenant governance, branch
            management, permissions and executive knowledge.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('tenants')}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Tenant
          </button>

          <button
            onClick={() => setActiveTab('branch_management')}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <GitBranch className="w-3.5 h-3.5" />
            Manage Branches
          </button>
        </div>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Tenants */}
        <div className="p-5 rounded-2xl bg-[#09081E] border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-400">
                Total Tenants
              </p>

              <h3 className="text-3xl font-bold text-white mt-1">
                {loading ? '—' : tenants.length}
              </h3>
            </div>

            <div className="p-3 rounded-xl bg-purple-500/15 text-purple-300">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center gap-1 mt-3 text-[10px] text-emerald-400 font-medium">
            <Activity className="w-3 h-3" />
            {activeTenants} active tenants
          </div>
        </div>

        {/* Branches */}
        <div className="p-5 rounded-2xl bg-[#09081E] border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-400">
                Total Branches
              </p>

              <h3 className="text-3xl font-bold text-white mt-1">
                {loading ? '—' : branches.length}
              </h3>
            </div>

            <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-300">
              <GitBranch className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center gap-1 mt-3 text-[10px] text-cyan-300 font-medium">
            <Activity className="w-3 h-3" />
            {activeBranches} active branches
          </div>
        </div>

        {/* Access Matrix */}
        {/* <div className="p-5 rounded-2xl bg-[#09081E] border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-400">
                Access Governance
              </p>

              <h3 className="text-lg font-bold text-white mt-2">
                Access Matrix
              </h3>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/15 text-amber-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <button
            onClick={() => setActiveTab('access_matrix')}
            className="flex items-center gap-1 mt-3 text-[10px] text-amber-300 font-semibold hover:text-amber-200"
          >
            Manage permissions
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div> */}

        {/* CEO Knowledge */}
        <div className="p-5 rounded-2xl bg-[#09081E] border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-400">
                Executive Learning
              </p>

              <h3 className="text-lg font-bold text-white mt-2">
                CEO Knowledge Hub
              </h3>
            </div>

            <div className="p-3 rounded-xl bg-purple-500/15 text-purple-300">
              <Video className="w-5 h-5" />
            </div>
          </div>

          <button
            onClick={() => setActiveTab('knowledge_hub')}
            className="flex items-center gap-1 mt-3 text-[10px] text-purple-300 font-semibold hover:text-purple-200"
          >
            Manage knowledge hub
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Tenant Overview */}
      <div className="p-5 rounded-2xl bg-[#09081E] border border-white/10">

        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />

              <h3 className="text-sm font-bold text-white">
                Tenant Overview
              </h3>
            </div>

            <p className="text-[10px] text-gray-500 mt-1">
              Global tenant and branch status
            </p>
          </div>

          <button
            onClick={() => setActiveTab('tenants')}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
          >
            View All
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-xs text-gray-500">
            Loading tenant overview...
          </div>
        ) : tenants.length === 0 ? (
          <div className="py-10 text-center">
            <Building2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500">
              No tenants found.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {tenants.slice(0, 8).map((tenant: any) => {
              const tenantBranches = branches.filter(
                (branch) => branch.tenantId === tenant.id
              );

              const activeTenantBranches =
                tenantBranches.filter(
                  (branch) => branch.isActive
                ).length;

              return (
                <div
                  key={tenant.id}
                  className="py-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-300">
                      <Building2 className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {tenant.name}
                      </p>

                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {tenant.code || 'No tenant code'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">

                    <div className="hidden sm:block text-right">
                      <p className="text-[10px] text-gray-500">
                        Branches
                      </p>

                      <p className="text-xs font-bold text-white">
                        {tenantBranches.length}
                      </p>
                    </div>

                    <div className="hidden sm:block text-right">
                      <p className="text-[10px] text-gray-500">
                        Active
                      </p>

                      <p className="text-xs font-bold text-emerald-400">
                        {activeTenantBranches}
                      </p>
                    </div>

                    {/* <button
                      onClick={() =>
                        setActiveTab('branch_management')
                      }
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                      title="Manage branches"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                    </button> */}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Governance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Platform Governance */}
        {/* <div className="p-5 rounded-2xl bg-gradient-to-br from-[#120e3a] to-[#09081E] border border-purple-500/20">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-purple-300" />

            <h3 className="text-sm font-bold text-white">
              Platform Governance
            </h3>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Control tenant access, branch structure, role permissions
            and platform-wide governance from the Super Admin console.
          </p>

          <button
            onClick={() => setActiveTab('access_matrix')}
            className="mt-4 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Open Access Matrix
          </button>
        </div> */}

        {/* Knowledge Hub */}
        {/* <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0d1d25] to-[#09081E] border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Video className="w-4 h-4 text-cyan-300" />

            <h3 className="text-sm font-bold text-white">
              CEO Knowledge Hub
            </h3>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Manage executive masterclasses, investment education and
            leadership content available across the organization.
          </p>

          <button
            onClick={() => setActiveTab('knowledge_hub')}
            className="mt-4 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold flex items-center gap-1.5"
          >
            <Video className="w-3.5 h-3.5" />
            Open Knowledge Hub
          </button>
        </div> */}

      </div>
    </div>
  );
};