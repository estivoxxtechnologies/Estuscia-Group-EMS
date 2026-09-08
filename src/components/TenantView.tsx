import React, { useEffect, useState } from 'react';
import {
    Building2,
    Search,
    Filter,
    ChevronRight,
    Globe,
    ShieldCheck,
    Plus,
    Pencil,
    X,
    Save,
    Loader2,
} from 'lucide-react';

import { useApp } from '../context/AppContext';

import {
    BackendTenant,
    getTenants,
    createTenant,
    updateTenant,
} from '../api/tenants';

import { toast } from 'react-toastify';

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
    // Add / Edit tenant state
    // ---------------------------------------------------------

    const [isTenantFormOpen, setIsTenantFormOpen] =
        useState(false);

    const [isEditingTenant, setIsEditingTenant] =
        useState(false);

    const [isSavingTenant, setIsSavingTenant] =
        useState(false);

    const [tenantName, setTenantName] =
        useState('');

    const [tenantCode, setTenantCode] =
        useState('');

    const [tenantDomain, setTenantDomain] =
        useState('');

    const [tenantPlan, setTenantPlan] =
        useState('Enterprise Pro');

    const [tenantCurrency, setTenantCurrency] =
        useState('INR');

    const [tenantIsActive, setTenantIsActive] =
        useState(true);

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
    // Open Add Tenant
    // ---------------------------------------------------------

    const handleAddTenant = () => {
        setIsEditingTenant(false);
        setSelectedTenant(null);

        setTenantName('');
        setTenantCode('');
        setTenantDomain('');
        setTenantPlan('Enterprise Pro');
        setTenantCurrency('INR');
        setTenantIsActive(true);

        setIsTenantFormOpen(true);
    };

    // ---------------------------------------------------------
    // Open Edit Tenant
    // ---------------------------------------------------------

    const handleEditTenant = (tenant: BackendTenant) => {
        setIsEditingTenant(true);

        setTenantName(tenant.name);
        setTenantCode(tenant.code);
        setTenantDomain(tenant.domain);
        setTenantPlan(tenant.plan);
        setTenantCurrency(tenant.currency);
        setTenantIsActive(tenant.isActive);

        setIsTenantFormOpen(true);
    };

    // ---------------------------------------------------------
    // Close Tenant Form
    // ---------------------------------------------------------

    const handleCloseTenantForm = () => {
        if (isSavingTenant) {
            return;
        }

        setIsTenantFormOpen(false);
    };

    // ---------------------------------------------------------
    // Save Tenant
    // ---------------------------------------------------------

    const handleSaveTenant = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        if (!tenantName.trim()) {
            toast.error('Tenant name is required.');
            return;
        }

        if (!tenantCode.trim()) {
            toast.error('Tenant code is required.');
            return;
        }

        if (!tenantPlan.trim()) {
            toast.error('Tenant plan is required.');
            return;
        }

        if (!tenantCurrency.trim()) {
            toast.error('Currency is required.');
            return;
        }

        try {
            setIsSavingTenant(true);

            if (isEditingTenant && selectedTenant) {
                const updated = await updateTenant(
                    selectedTenant.id,
                    {
                        name: tenantName.trim(),
                        code: tenantCode.trim(),
                        domain: tenantDomain.trim(),
                        plan: tenantPlan.trim(),
                        currency: tenantCurrency.trim(),
                        isActive: tenantIsActive,
                    }
                );

                setTenants((previous) =>
                    previous.map((tenant) =>
                        tenant.id === updated.id
                            ? updated
                            : tenant
                    )
                );

                setSelectedTenant(updated);

                toast.success(
                    'Tenant updated successfully.'
                );
            } else {
                const created = await createTenant({
                    name: tenantName.trim(),
                    code: tenantCode.trim(),
                    domain: tenantDomain.trim(),
                    plan: tenantPlan.trim(),
                    currency: tenantCurrency.trim(),
                });

                setTenants((previous) =>
                    [...previous, created].sort(
                        (a, b) =>
                            a.name.localeCompare(b.name)
                    )
                );

                toast.success(
                    'Tenant created successfully.'
                );
            }

            setIsTenantFormOpen(false);

        } catch (error) {
            console.error(
                'Failed to save tenant:',
                error
            );

            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to save tenant.'
            );
        } finally {
            setIsSavingTenant(false);
        }
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

                <div className="flex items-center gap-2 flex-wrap">

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

                    <button
                        type="button"
                        onClick={handleAddTenant}
                        className="px-4 py-2.5 rounded-xl bg-[#5C3FE0] hover:bg-[#7152FF] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#5C3FE0]/20 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Add Tenant
                    </button>

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

                            <div className="flex items-center gap-2">

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleEditTenant(selectedTenant)
                                    }
                                    className="px-3 py-1.5 rounded-lg bg-[#5C3FE0]/20 border border-[#5C3FE0]/40 text-[#A78BFA] hover:bg-[#5C3FE0]/30 flex items-center gap-1.5"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedTenant(null)
                                    }
                                    className="px-3 py-1.5 rounded-lg hover:bg-[#1a144b] text-slate-400 hover:text-white"
                                >
                                    Close
                                </button>

                            </div>

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

            {/* =====================================================
    ADD / EDIT TENANT MODAL
===================================================== */}

            {isTenantFormOpen && (

                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">

                    <div className="w-full max-w-xl bg-[#09071e] border border-[#2d2770] rounded-2xl shadow-2xl overflow-hidden">

                        {/* Header */}

                        <div className="flex items-center justify-between px-6 py-4 bg-[#0e0b2e] border-b border-[#231e54]">

                            <div className="flex items-center gap-3">

                                <div className="p-2 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
                                    {isEditingTenant ? (
                                        <Pencil className="w-5 h-5" />
                                    ) : (
                                        <Plus className="w-5 h-5" />
                                    )}
                                </div>

                                <div>

                                    <h2 className="text-base font-bold text-white">
                                        {isEditingTenant
                                            ? 'Edit Tenant'
                                            : 'Add Tenant'}
                                    </h2>

                                    <p className="text-xs text-slate-400">
                                        {isEditingTenant
                                            ? 'Update tenant organization details'
                                            : 'Create a new organization tenant'}
                                    </p>

                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={handleCloseTenantForm}
                                disabled={isSavingTenant}
                                className="p-1.5 rounded-lg hover:bg-[#1f1857] text-slate-400 hover:text-white disabled:opacity-50"
                            >
                                <X className="w-4 h-4" />
                            </button>

                        </div>

                        {/* Form */}

                        <form
                            onSubmit={handleSaveTenant}
                            className="p-6 space-y-4 text-xs"
                        >

                            {/* Name + Code */}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div>

                                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                        Tenant Name *
                                    </label>

                                    <input
                                        type="text"
                                        required
                                        value={tenantName}
                                        onChange={(e) =>
                                            setTenantName(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Estuscia Group"
                                        disabled={isSavingTenant}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white placeholder-slate-500 focus:outline-none focus:border-[#5C3FE0] disabled:opacity-50"
                                    />

                                </div>

                                <div>

                                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                        Tenant Code *
                                    </label>

                                    <input
                                        type="text"
                                        required
                                        value={tenantCode}
                                        onChange={(e) =>
                                            setTenantCode(
                                                e.target.value
                                            )
                                        }
                                        placeholder="ESTUSCIA"
                                        disabled={isSavingTenant}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-[#A78BFA] font-mono uppercase focus:outline-none focus:border-[#5C3FE0] disabled:opacity-50"
                                    />

                                </div>

                            </div>

                            {/* Domain */}

                            <div>

                                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                    Domain
                                </label>

                                <div className="relative">

                                    <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-500" />

                                    <input
                                        type="text"
                                        value={tenantDomain}
                                        onChange={(e) =>
                                            setTenantDomain(
                                                e.target.value
                                            )
                                        }
                                        placeholder="estusciagroup.com"
                                        disabled={isSavingTenant}
                                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white placeholder-slate-500 focus:outline-none focus:border-[#5C3FE0] disabled:opacity-50"
                                    />

                                </div>

                            </div>

                            {/* Plan + Currency */}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div>

                                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                        Plan *
                                    </label>

                                    <select
                                        required
                                        value={tenantPlan}
                                        onChange={(e) =>
                                            setTenantPlan(
                                                e.target.value
                                            )
                                        }
                                        disabled={isSavingTenant}
                                        className="w-full px-3 py-2.5 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0] disabled:opacity-50"
                                    >
                                        <option value="Enterprise Pro">
                                            Enterprise Pro
                                        </option>

                                        <option value="Enterprise">
                                            Enterprise
                                        </option>

                                        <option value="Professional">
                                            Professional
                                        </option>

                                        <option value="Basic">
                                            Basic
                                        </option>

                                    </select>

                                </div>

                                <div>

                                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                        Currency *
                                    </label>

                                    <select
                                        required
                                        value={tenantCurrency}
                                        onChange={(e) =>
                                            setTenantCurrency(
                                                e.target.value
                                            )
                                        }
                                        disabled={isSavingTenant}
                                        className="w-full px-3 py-2.5 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white focus:outline-none focus:border-[#5C3FE0] disabled:opacity-50"
                                    >
                                        <option value="INR">
                                            INR — Indian Rupee
                                        </option>

                                        <option value="USD">
                                            USD — US Dollar
                                        </option>

                                        <option value="AED">
                                            AED — UAE Dirham
                                        </option>

                                        <option value="GBP">
                                            GBP — British Pound
                                        </option>

                                        <option value="EUR">
                                            EUR — Euro
                                        </option>

                                    </select>

                                </div>

                            </div>

                            {/* Status - Edit only */}

                            {isEditingTenant && (

                                <div className="p-4 rounded-xl bg-[#0e0b2e] border border-[#231e54]">

                                    <div className="flex items-center justify-between">

                                        <div>

                                            <p className="text-xs font-semibold text-white">
                                                Tenant Status
                                            </p>

                                            <p className="text-[10px] text-slate-500 mt-1">
                                                Inactive tenants cannot be used normally.
                                            </p>

                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setTenantIsActive(
                                                    !tenantIsActive
                                                )
                                            }
                                            className={
                                                tenantIsActive
                                                    ? 'px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-xs font-semibold'
                                                    : 'px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 text-xs font-semibold'
                                            }
                                        >
                                            {tenantIsActive
                                                ? 'Active'
                                                : 'Inactive'}
                                        </button>

                                    </div>

                                </div>

                            )}

                            {/* Footer */}

                            <div className="pt-4 border-t border-[#231e54] flex items-center justify-end gap-3">

                                <button
                                    type="button"
                                    onClick={handleCloseTenantForm}
                                    disabled={isSavingTenant}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSavingTenant}
                                    className="px-5 py-2.5 rounded-xl bg-[#5C3FE0] hover:bg-[#7152FF] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#5C3FE0]/20"
                                >

                                    {isSavingTenant ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            {isEditingTenant
                                                ? 'Save Changes'
                                                : 'Create Tenant'}
                                        </>
                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
};