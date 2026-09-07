import React, { useEffect, useState } from 'react';
import {
    Building2,
    Search,
    Filter,
    ChevronRight,
    Globe,
    ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BackendTenant, getTenants } from '../api/tenants';

export const TenantView: React.FC = () => {
    const { currentUser } = useApp();

    const [tenants, setTenants] = useState<BackendTenant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');

    const [selectedTenant, setSelectedTenant] =
        useState<BackendTenant | null>(null);

    // ---------------------------------------------------------
    // SUPER ADMIN ONLY
    // ---------------------------------------------------------

    const isSuperAdmin =
        currentUser?.roleName?.toLowerCase() === 'super_admin';

    // ---------------------------------------------------------
    // Load tenants
    // ---------------------------------------------------------

    useEffect(() => {
        // Do not call API if the current user is not super admin
        if (!isSuperAdmin) {
            return;
        }

        const loadTenants = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const data = await getTenants();

                setTenants(data);
            } catch (error) {
                console.error('Failed to load tenants:', error);

                setError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load tenants.'
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadTenants();
    }, [isSuperAdmin]);

    // ---------------------------------------------------------
    // Security guard
    // ---------------------------------------------------------

    if (!isSuperAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-full max-w-md p-8 rounded-2xl bg-[#09071e] border border-red-900/50 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-950/40 border border-red-900/50 flex items-center justify-center">
                        <ShieldCheck className="w-7 h-7 text-red-400" />
                    </div>

                    <h2 className="text-lg font-bold text-white">
                        Access Denied
                    </h2>

                    <p className="text-sm text-slate-400 mt-2">
                        Tenant management is available only to Super Administrators.
                    </p>
                </div>
            </div>
        );
    }

    // ---------------------------------------------------------
    // Statistics
    // ---------------------------------------------------------

    const activeTenantCount = tenants.filter(
        (tenant) => tenant.isActive
    ).length;

    const inactiveTenantCount = tenants.filter(
        (tenant) => !tenant.isActive
    ).length;

    // ---------------------------------------------------------
    // Search + status filter
    // ---------------------------------------------------------

    const filteredTenants = tenants.filter((tenant) => {
        const search = searchQuery.toLowerCase().trim();

        const matchesSearch =
            tenant.name.toLowerCase().includes(search) ||
            tenant.code.toLowerCase().includes(search) ||
            tenant.domain.toLowerCase().includes(search) ||
            tenant.plan.toLowerCase().includes(search);

        const matchesStatus =
            selectedStatus === 'all' ||
            (selectedStatus === 'active' && tenant.isActive) ||
            (selectedStatus === 'inactive' && !tenant.isActive);

        return matchesSearch && matchesStatus;
    });

    // ---------------------------------------------------------
    // Format date
    // ---------------------------------------------------------

    const formatDate = (date: string | null) => {
        if (!date) {
            return 'N/A';
        }

        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------

    return (
        <div className="space-y-6 pb-12">

            {/* =====================================================
          HEADER
      ===================================================== */}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">

                <div>
                    <div className="flex items-center gap-3">

                        <div className="p-2.5 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
                            <Building2 className="w-5 h-5" />
                        </div>

                        <div>
                            <h1 className="text-xl font-bold text-white leading-tight">
                                Tenant Management
                            </h1>

                            <p className="text-xs text-slate-400">
                                Manage organizations, plans, domains, and tenant status
                            </p>
                        </div>

                    </div>
                </div>

                <div className="flex items-center gap-2">

                    <div className="px-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#231e54]">
                        <span className="text-[10px] text-slate-500 uppercase block">
                            Total
                        </span>

                        <span className="text-sm font-bold text-white">
                            {tenants.length}
                        </span>
                    </div>

                    <div className="px-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#231e54]">
                        <span className="text-[10px] text-slate-500 uppercase block">
                            Active
                        </span>

                        <span className="text-sm font-bold text-emerald-400">
                            {activeTenantCount}
                        </span>
                    </div>

                    <div className="px-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#231e54]">
                        <span className="text-[10px] text-slate-500 uppercase block">
                            Inactive
                        </span>

                        <span className="text-sm font-bold text-red-400">
                            {inactiveTenantCount}
                        </span>
                    </div>

                </div>

            </div>

            {/* =====================================================
          LOADING
      ===================================================== */}

            {isLoading && (
                <div className="p-6 rounded-2xl bg-[#09071e] border border-[#231e54] text-sm text-slate-400">
                    Loading tenants...
                </div>
            )}

            {/* =====================================================
          ERROR
      ===================================================== */}

            {error && (
                <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/50 text-sm text-red-400">
                    {error}
                </div>
            )}

            {/* =====================================================
          FILTERS
      ===================================================== */}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-[#09071e] border border-[#231e54]">

                {/* Search */}

                <div className="relative w-full sm:w-96">

                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />

                    <input
                        type="text"
                        placeholder="Search by tenant name, code, domain, plan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#5C3FE0]"
                    />

                </div>

                {/* Status */}

                <div className="flex items-center gap-2 w-full sm:w-auto">

                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-slate-200 text-xs w-full sm:w-auto"
                    >
                        <option value="all">
                            All Tenants ({tenants.length})
                        </option>

                        <option value="active">
                            Active ({activeTenantCount})
                        </option>

                        <option value="inactive">
                            Inactive ({inactiveTenantCount})
                        </option>

                    </select>

                </div>

            </div>

            {/* =====================================================
          EMPTY STATE
      ===================================================== */}

            {!isLoading &&
                !error &&
                filteredTenants.length === 0 && (
                    <div className="p-10 rounded-2xl bg-[#09071e] border border-[#231e54] text-center">

                        <Building2 className="w-10 h-10 mx-auto text-slate-500 mb-3" />

                        <h3 className="text-sm font-bold text-white">
                            No tenants found
                        </h3>

                        <p className="text-xs text-slate-400 mt-1">
                            Try changing your search or status filter.
                        </p>

                    </div>
                )}

            {/* =====================================================
          TENANT GRID
      ===================================================== */}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                {filteredTenants.map((tenant) => (

                    <div
                        key={tenant.id}
                        onClick={() => setSelectedTenant(tenant)}
                        className="p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/80 hover:border-[#5C3FE0] transition-all space-y-4 shadow-lg cursor-pointer group"
                    >

                        {/* Tenant Header */}

                        <div className="flex items-start gap-3">

                            <div className="w-12 h-12 rounded-xl bg-[#1a144b] border border-[#2d2770] flex items-center justify-center text-[#A78BFA]">

                                <Building2 className="w-6 h-6" />

                            </div>

                            <div className="flex-1 min-w-0">

                                <div className="flex items-center justify-between gap-2">

                                    <h3 className="text-sm font-bold text-white truncate group-hover:text-[#A78BFA] transition-colors">
                                        {tenant.name}
                                    </h3>

                                    <span
                                        className={
                                            tenant.isActive
                                                ? 'px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-900/50'
                                                : 'px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-950/40 text-red-400 border border-red-900/50'
                                        }
                                    >
                                        {tenant.isActive ? 'Active' : 'Inactive'}
                                    </span>

                                </div>

                                <div className="text-xs text-slate-300 font-medium mt-1">
                                    <span className="font-mono">
                                        {tenant.code}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate mt-0.5">

                                    <Globe className="w-3 h-3 shrink-0" />

                                    <span className="truncate">
                                        {tenant.domain || 'No Domain'}
                                    </span>

                                </div>

                            </div>

                        </div>

                        {/* Tenant Information */}

                        <div className="p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54] space-y-2 text-xs">

                            <div className="flex items-center justify-between">

                                <span className="text-slate-400">
                                    Plan
                                </span>

                                <span className="text-[#A78BFA] font-semibold">
                                    {tenant.plan}
                                </span>

                            </div>

                            <div className="flex items-center justify-between">

                                <span className="text-slate-400">
                                    Currency
                                </span>

                                <span className="text-white font-semibold">
                                    {tenant.currency}
                                </span>

                            </div>

                            <div className="flex items-center justify-between">

                                <span className="text-slate-400">
                                    Created
                                </span>

                                <span className="text-slate-200 font-medium">
                                    {formatDate(tenant.createdAtUtc)}
                                </span>

                            </div>

                        </div>

                        {/* Footer */}

                        <div className="pt-2 border-t border-[#1e1950] flex items-center justify-between text-[11px] text-slate-400">

                            <span>
                                Tenant ID: {tenant.id}
                            </span>

                            <span className="text-[#A78BFA] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">

                                <span>
                                    View Details
                                </span>

                                <ChevronRight className="w-3.5 h-3.5" />

                            </span>

                        </div>

                    </div>

                ))}

            </div>

            {/* =====================================================
          TENANT DETAIL MODAL
      ===================================================== */}

            {selectedTenant && (

                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">

                    <div className="w-full max-w-2xl bg-[#09071e] border border-[#2d2770] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6 text-xs text-slate-200">

                        {/* Header */}

                        <div className="flex items-center justify-between pb-4 border-b border-[#231e54]">

                            <div className="flex items-center gap-3">

                                <div className="w-12 h-12 rounded-xl bg-[#1a144b] border border-[#2d2770] flex items-center justify-center text-[#A78BFA]">

                                    <Building2 className="w-6 h-6" />

                                </div>

                                <div>

                                    <h2 className="text-base font-bold text-white">
                                        {selectedTenant.name}
                                    </h2>

                                    <p className="text-xs text-slate-400">
                                        {selectedTenant.code}
                                        {' • '}
                                        {selectedTenant.plan}
                                    </p>

                                </div>

                            </div>

                            <button
                                onClick={() => setSelectedTenant(null)}
                                className="px-3 py-1 rounded-lg hover:bg-[#1a144b] text-slate-400 hover:text-white"
                            >
                                Close
                            </button>

                        </div>

                        {/* Tenant Details */}

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                            {/* Tenant ID */}

                            <div className="p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54]">

                                <span className="text-[10px] text-slate-400 uppercase block">
                                    Tenant ID
                                </span>

                                <span className="font-mono text-white font-bold">
                                    {selectedTenant.id}
                                </span>

                            </div>

                            {/* Code */}

                            <div className="p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54]">

                                <span className="text-[10px] text-slate-400 uppercase block">
                                    Code
                                </span>

                                <span className="font-mono text-[#A78BFA] font-bold">
                                    {selectedTenant.code}
                                </span>

                            </div>

                            {/* Plan */}

                            <div className="p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54]">

                                <span className="text-[10px] text-slate-400 uppercase block">
                                    Plan
                                </span>

                                <span className="text-white font-bold">
                                    {selectedTenant.plan}
                                </span>

                            </div>

                            {/* Currency */}

                            <div className="p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54]">

                                <span className="text-[10px] text-slate-400 uppercase block">
                                    Currency
                                </span>

                                <span className="text-white font-bold">
                                    {selectedTenant.currency}
                                </span>

                            </div>

                            {/* Status */}

                            <div className="p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54]">

                                <span className="text-[10px] text-slate-400 uppercase block">
                                    Status
                                </span>

                                <span
                                    className={
                                        selectedTenant.isActive
                                            ? 'text-emerald-400 font-bold'
                                            : 'text-red-400 font-bold'
                                    }
                                >
                                    {selectedTenant.isActive
                                        ? 'Active'
                                        : 'Inactive'}
                                </span>

                            </div>

                            {/* Created */}

                            <div className="p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54]">

                                <span className="text-[10px] text-slate-400 uppercase block">
                                    Created
                                </span>

                                <span className="text-white font-bold">
                                    {formatDate(selectedTenant.createdAtUtc)}
                                </span>

                            </div>

                        </div>

                        {/* Organization Information */}

                        <div className="space-y-3">

                            <div className="text-slate-400">

                                <span className="font-semibold text-white">
                                    Organization:
                                </span>{' '}

                                {selectedTenant.name}

                            </div>

                            <div className="text-slate-400 flex items-center gap-2">

                                <Globe className="w-3.5 h-3.5" />

                                <span className="font-semibold text-white">
                                    Domain:
                                </span>

                                <span>
                                    {selectedTenant.domain || 'N/A'}
                                </span>

                            </div>

                            <div className="text-slate-400">

                                <span className="font-semibold text-white">
                                    Last Updated:
                                </span>{' '}

                                {formatDate(selectedTenant.updatedAtUtc)}

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};