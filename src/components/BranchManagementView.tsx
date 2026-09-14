import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  GitBranch,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Pencil,
  Power,
  X,
  Save,
  Loader2,
  Coins,
} from 'lucide-react';

import { useApp } from '../context/AppContext';

import {
  getTenants,
  BackendTenant,
} from '../api/tenants';

import {
  getBranchesByTenant,
  createBranch,
  updateBranch,
  toggleBranchStatus,
} from '../api/branches';

import {
  getCurrencies,
  BackendCurrency,
} from '../api/currencies';

import { Branch } from '../types/branch';

import { toast } from 'react-toastify';


export const BranchManagementView: React.FC = () => {
  const { currentUser } = useApp();

  // =========================================================
  // SECURITY
  // =========================================================

  const isSuperAdmin =
    currentUser?.roleName?.trim().toLowerCase() ===
    'super_admin';

  // =========================================================
  // TENANTS
  // =========================================================

  const [tenants, setTenants] =
    useState<BackendTenant[]>([]);

  const [isLoadingTenants, setIsLoadingTenants] =
    useState(false);

  const [tenantError, setTenantError] =
    useState<string | null>(null);

  const [tenantSearch, setTenantSearch] =
    useState('');

  // =========================================================
  // SELECTED TENANT
  // =========================================================

  const [selectedTenant, setSelectedTenant] =
    useState<BackendTenant | null>(null);

  // =========================================================
  // CURRENCIES
  // =========================================================

  const [currencies, setCurrencies] =
    useState<BackendCurrency[]>([]);

  const [isLoadingCurrencies, setIsLoadingCurrencies] =
    useState(false);

  const [currencyError, setCurrencyError] =
    useState<string | null>(null);

  // =========================================================
  // BRANCHES
  // =========================================================

  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [isLoadingBranches, setIsLoadingBranches] =
    useState(false);

  const [branchError, setBranchError] =
    useState<string | null>(null);

  const [branchSearch, setBranchSearch] =
    useState('');

  // =========================================================
  // MODAL
  // =========================================================

  const [isBranchModalOpen, setIsBranchModalOpen] =
    useState(false);

  const [editingBranch, setEditingBranch] =
    useState<Branch | null>(null);

  const [branchName, setBranchName] =
    useState('');

  const [city, setCity] =
    useState('');

  const [isActive, setIsActive] =
    useState(true);

  const [currencyId, setCurrencyId] =
    useState<number | null>(null);

  const [useTenantDefaultCurrency, setUseTenantDefaultCurrency] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [formError, setFormError] =
    useState<string | null>(null);

  // =========================================================
  // STATUS TOGGLE
  // =========================================================

  const [branchToToggle, setBranchToToggle] =
    useState<Branch | null>(null);

  const [isTogglingStatus, setIsTogglingStatus] =
    useState(false);

  // =========================================================
  // TENANT DEFAULT CURRENCY
  // =========================================================

  const tenantDefaultCurrency =
    selectedTenant?.defaultCurrency;

  // =========================================================
  // LOAD TENANTS
  // =========================================================

  useEffect(() => {
    if (!isSuperAdmin) {
      return;
    }

    const loadTenants = async () => {
      try {
        setIsLoadingTenants(true);
        setTenantError(null);

        const data = await getTenants();

        setTenants(data);
      } catch (error) {
        console.error(
          'Failed to load tenants:',
          error
        );

        setTenantError(
          error instanceof Error
            ? error.message
            : 'Failed to load tenants.'
        );
      } finally {
        setIsLoadingTenants(false);
      }
    };

    loadTenants();
  }, [isSuperAdmin]);

  // =========================================================
  // LOAD CURRENCIES
  // =========================================================

  useEffect(() => {
    if (!isSuperAdmin) {
      return;
    }

    const loadCurrencies = async () => {
      try {
        setIsLoadingCurrencies(true);
        setCurrencyError(null);

        const data = await getCurrencies();

        const activeCurrencies =
          data.filter(
            (currency) => currency.isActive
          );

        setCurrencies(activeCurrencies);
      } catch (error) {
        console.error(
          'Failed to load currencies:',
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : 'Failed to load currencies.';

        setCurrencyError(message);

        toast.error(message);
      } finally {
        setIsLoadingCurrencies(false);
      }
    };

    loadCurrencies();
  }, [isSuperAdmin]);

  // =========================================================
  // LOAD BRANCHES FOR SELECTED TENANT
  // =========================================================

  useEffect(() => {
    if (!selectedTenant) {
      setBranches([]);
      return;
    }

    const loadBranches = async () => {
      try {
        setIsLoadingBranches(true);
        setBranchError(null);

        const data =
          await getBranchesByTenant(
            selectedTenant.id
          );

        setBranches(data);
      } catch (error) {
        console.error(
          'Failed to load branches:',
          error
        );

        setBranchError(
          error instanceof Error
            ? error.message
            : 'Failed to load branches.'
        );
      } finally {
        setIsLoadingBranches(false);
      }
    };

    loadBranches();
  }, [selectedTenant]);

  // =========================================================
  // FILTER TENANTS
  // =========================================================

  const filteredTenants = useMemo(() => {
    const search =
      tenantSearch.toLowerCase().trim();

    if (!search) {
      return tenants;
    }

    return tenants.filter((tenant) =>
      tenant.name
        .toLowerCase()
        .includes(search) ||
      tenant.code
        .toLowerCase()
        .includes(search) ||
      tenant.domain
        .toLowerCase()
        .includes(search)
    );
  }, [tenants, tenantSearch]);

  // =========================================================
  // FILTER BRANCHES
  // =========================================================

  const filteredBranches = useMemo(() => {
    const search =
      branchSearch.toLowerCase().trim();

    if (!search) {
      return branches;
    }

    return branches.filter((branch) =>
      branch.branchName
        .toLowerCase()
        .includes(search) ||
      (branch.city ?? '')
        .toLowerCase()
        .includes(search) ||
      (branch.currency?.code ?? '')
        .toLowerCase()
        .includes(search) ||
      (branch.currency?.name ?? '')
        .toLowerCase()
        .includes(search)
    );
  }, [branches, branchSearch]);

  // =========================================================
  // OPEN ADD
  // =========================================================

  const handleAddBranch = () => {
    setEditingBranch(null);

    setBranchName('');
    setCity('');
    setIsActive(true);

    // New branches use tenant default currency
    // by default.
    setUseTenantDefaultCurrency(true);

    setCurrencyId(
      selectedTenant?.defaultCurrencyId ?? null
    );

    setFormError(null);

    setIsBranchModalOpen(true);
  };

  // =========================================================
  // OPEN EDIT
  // =========================================================

  const handleEditBranch = (
    branch: Branch
  ) => {
    setEditingBranch(branch);

    setBranchName(
      branch.branchName
    );

    setCity(
      branch.city ?? ''
    );

    setIsActive(
      branch.isActive
    );

    // Compare the actual branch currency
    // with the selected tenant's default currency.
    const isTenantDefault =
      branch.currencyId ===
      selectedTenant?.defaultCurrencyId;

    setUseTenantDefaultCurrency(
      isTenantDefault
    );

    setCurrencyId(
      branch.currencyId
    );

    setFormError(null);

    setIsBranchModalOpen(true);
  };

  // =========================================================
  // TENANT DEFAULT CURRENCY CHECKBOX
  // =========================================================

  const handleTenantDefaultCurrencyChange = (
    checked: boolean
  ) => {
    setUseTenantDefaultCurrency(
      checked
    );

    if (checked) {
      setCurrencyId(
        selectedTenant?.defaultCurrencyId ?? null
      );
    }
  };

  // =========================================================
  // CLOSE BRANCH MODAL
  // =========================================================

  const closeBranchModal = () => {
    if (isSaving) {
      return;
    }

    setIsBranchModalOpen(false);
    setEditingBranch(null);
    setFormError(null);
  };

  // =========================================================
  // SAVE BRANCH
  // =========================================================

  const handleSaveBranch = async () => {
    if (!selectedTenant) {
      return;
    }

    const trimmedName =
      branchName.trim();

    const trimmedCity =
      city.trim();

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    if (!trimmedName) {
      setFormError(
        'Branch name is required.'
      );
      return;
    }

    if (!currencyId) {
      setFormError(
        'Please select a branch currency.'
      );
      return;
    }

    try {
      setIsSaving(true);
      setFormError(null);

      // -----------------------------------------------------
      // UPDATE
      // -----------------------------------------------------

      if (editingBranch) {
        const updated =
          await updateBranch(
            editingBranch.id,
            {
              branchName:
                trimmedName,

              city:
                trimmedCity || null,

              currencyId,

              isActive,
            }
          );

        setBranches((current) =>
          current.map((branch) =>
            branch.id ===
              editingBranch.id
              ? updated
              : branch
          )
        );

        toast.success(
          `Branch "${updated.branchName}" updated successfully.`
        );
      }

      // -----------------------------------------------------
      // CREATE
      // -----------------------------------------------------

      else {
        const created =
          await createBranch(
            selectedTenant.id,
            {
              branchName:
                trimmedName,

              city:
                trimmedCity || null,

              currencyId,
            }
          );

        setBranches((current) => [
          ...current,
          created,
        ]);

        toast.success(
          `Branch "${created.branchName}" created successfully.`
        );
      }

      closeBranchModal();

    } catch (error) {
      console.error(
        'Failed to save branch:',
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Failed to save branch.';

      setFormError(message);

      toast.error(message);

    } finally {
      setIsSaving(false);
    }
  };

  // =========================================================
  // REQUEST STATUS CHANGE
  // =========================================================

  const handleToggleStatus = (
    branch: Branch
  ) => {
    setBranchToToggle(branch);
  };

  // =========================================================
  // CONFIRM STATUS CHANGE
  // =========================================================

  const confirmToggleStatus = async () => {
    if (!branchToToggle) {
      return;
    }

    try {
      setIsTogglingStatus(true);
      setBranchError(null);

      const newStatus =
        !branchToToggle.isActive;

      const updated =
        await toggleBranchStatus(
          branchToToggle.id,
          newStatus
        );

      setBranches((current) =>
        current.map((item) =>
          item.id ===
            branchToToggle.id
            ? updated
            : item
        )
      );

      toast.success(
        `Branch "${updated.branchName}" ${newStatus
          ? 'enabled'
          : 'disabled'
        } successfully.`
      );

      setBranchToToggle(null);

    } catch (error) {
      console.error(
        'Failed to update branch status:',
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Failed to update branch status.';

      setBranchError(message);

      toast.error(message);

    } finally {
      setIsTogglingStatus(false);
    }
  };

  // =========================================================
  // ACCESS DENIED
  // =========================================================

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
            Branch management is available only
            to Super Administrators.
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // TENANT SELECTION SCREEN
  // =========================================================

  if (!selectedTenant) {
    return (
      <div className="space-y-6 pb-12">

        {/* Header */}

        <div className="p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="p-2.5 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">

                <GitBranch className="w-5 h-5" />

              </div>

              <div>

                <h1 className="text-xl font-bold text-white">
                  Branch Management
                </h1>

                <p className="text-xs text-slate-400 mt-1">
                  Select an organization to manage
                  its branches.
                </p>

              </div>

            </div>

            <div className="px-4 py-2 rounded-xl bg-[#0e0b2e] border border-[#231e54]">

              <span className="text-[10px] text-slate-500 uppercase block">
                Organizations
              </span>

              <span className="text-sm font-bold text-white">
                {tenants.length}
              </span>

            </div>

          </div>

        </div>

        {/* Search */}

        <div className="p-4 rounded-2xl bg-[#09071e] border border-[#231e54]">

          <div className="relative">

            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />

            <input
              value={tenantSearch}
              onChange={(e) =>
                setTenantSearch(
                  e.target.value
                )
              }
              placeholder="Search organization..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#5C3FE0]"
            />

          </div>

        </div>

        {/* Loading */}

        {isLoadingTenants && (
          <div className="p-8 rounded-2xl bg-[#09071e] border border-[#231e54] flex items-center justify-center gap-2 text-sm text-slate-400">

            <Loader2 className="w-4 h-4 animate-spin" />

            Loading organizations...

          </div>
        )}

        {/* Error */}

        {tenantError && (
          <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/50 text-sm text-red-400">
            {tenantError}
          </div>
        )}

        {/* Tenant Cards */}

        {!isLoadingTenants &&
          !tenantError && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

              {filteredTenants.map(
                (tenant) => (
                  <button
                    key={tenant.id}
                    type="button"
                    onClick={() =>
                      setSelectedTenant(
                        tenant
                      )
                    }
                    className="text-left p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/80 hover:border-[#5C3FE0] hover:bg-[#0c0925] transition-all shadow-lg group cursor-pointer"
                  >

                    <div className="flex items-start gap-3">

                      <div className="w-12 h-12 rounded-xl bg-[#1a144b] border border-[#2d2770] flex items-center justify-center text-[#A78BFA] shrink-0">

                        <Building2 className="w-6 h-6" />

                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center justify-between gap-2">

                          <h3 className="text-sm font-bold text-white truncate group-hover:text-[#A78BFA]">
                            {tenant.name}
                          </h3>

                          <span className="text-[9px] text-[#A78BFA]">
                            OPEN
                          </span>

                        </div>

                        <p className="text-xs text-slate-400 mt-1 font-mono">
                          {tenant.code}
                        </p>

                        <div className="flex items-center gap-1 mt-2 text-[11px] text-slate-500 truncate">

                          <MapPin className="w-3 h-3 shrink-0" />

                          <span className="truncate">
                            {tenant.domain ||
                              'No domain'}
                          </span>

                        </div>

                        {/* Tenant Currency */}

                        {tenant.defaultCurrency && (
                          <div className="flex items-center gap-1.5 mt-2 text-[11px]">

                            <Coins className="w-3 h-3 text-[#A78BFA]" />

                            <span className="text-slate-500">
                              Default:
                            </span>

                            <span className="text-[#A78BFA] font-semibold">
                              {tenant.defaultCurrency.symbol}{' '}
                              {tenant.defaultCurrency.code}
                            </span>

                          </div>
                        )}

                      </div>

                    </div>

                    <div className="mt-4 pt-3 border-t border-[#1e1950] flex items-center justify-between">

                      <span className="text-[10px] text-slate-500">
                        Manage branches
                      </span>

                      <span className="text-[11px] text-[#A78BFA] font-semibold">
                        View →
                      </span>

                    </div>

                  </button>
                )
              )}

            </div>
          )}

        {!isLoadingTenants &&
          !tenantError &&
          filteredTenants.length === 0 && (
            <div className="p-10 rounded-2xl bg-[#09071e] border border-[#231e54] text-center">

              <Building2 className="w-10 h-10 mx-auto text-slate-500 mb-3" />

              <h3 className="text-sm font-bold text-white">
                No organizations found
              </h3>

            </div>
          )}

      </div>
    );
  }

  // =========================================================
  // BRANCH MANAGEMENT SCREEN
  // =========================================================

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}

      <div className="p-6 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          <div>

            <button
              type="button"
              onClick={() => {
                setSelectedTenant(null);
                setBranches([]);
                setBranchSearch('');
              }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-4 transition-colors"
            >

              <ArrowLeft className="w-3.5 h-3.5" />

              Back to Organizations

            </button>

            <div className="flex items-center gap-3">

              <div className="p-2.5 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">

                <Building2 className="w-5 h-5" />

              </div>

              <div>

                <h1 className="text-xl font-bold text-white">
                  {selectedTenant.name}
                </h1>

                <p className="text-xs text-slate-400 mt-1">

                  Branch Management

                  <span className="mx-2">
                    •
                  </span>

                  <span className="font-mono">
                    {selectedTenant.code}
                  </span>

                </p>

              </div>

            </div>

          </div>

          <button
            type="button"
            onClick={handleAddBranch}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5C3FE0] hover:bg-[#6d51ec] text-white text-xs font-bold shadow-lg shadow-[#5C3FE0]/20 transition-all"
          >

            <Plus className="w-4 h-4" />

            Add Branch

          </button>

        </div>

      </div>

      {/* Tenant Currency Information */}

      {tenantDefaultCurrency && (
        <div className="p-4 rounded-2xl bg-[#09071e] border border-[#231e54]">

          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="w-9 h-9 rounded-lg bg-[#5C3FE0]/20 border border-[#5C3FE0]/30 flex items-center justify-center">

                <Coins className="w-4 h-4 text-[#A78BFA]" />

              </div>

              <div>

                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  Tenant Default Currency
                </p>

                <p className="text-xs text-white font-semibold mt-0.5">
                  {tenantDefaultCurrency.symbol}{' '}
                  {tenantDefaultCurrency.code}
                  <span className="text-slate-500 font-normal">
                    {' — '}
                    {tenantDefaultCurrency.name}
                  </span>
                </p>

              </div>

            </div>

            <span className="text-[10px] text-slate-500">
              New branches use this by default
            </span>

          </div>

        </div>
      )}

      {/* Statistics */}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

        <div className="p-4 rounded-2xl bg-[#09071e] border border-[#231e54]">

          <span className="text-[10px] text-slate-500 uppercase block">
            Total Branches
          </span>

          <span className="text-xl font-bold text-white">
            {branches.length}
          </span>

        </div>

        <div className="p-4 rounded-2xl bg-[#09071e] border border-[#231e54]">

          <span className="text-[10px] text-slate-500 uppercase block">
            Active
          </span>

          <span className="text-xl font-bold text-emerald-400">
            {
              branches.filter(
                (b) => b.isActive
              ).length
            }
          </span>

        </div>

        <div className="p-4 rounded-2xl bg-[#09071e] border border-[#231e54]">

          <span className="text-[10px] text-slate-500 uppercase block">
            Inactive
          </span>

          <span className="text-xl font-bold text-red-400">
            {
              branches.filter(
                (b) => !b.isActive
              ).length
            }
          </span>

        </div>

      </div>

      {/* Search */}

      <div className="p-4 rounded-2xl bg-[#09071e] border border-[#231e54]">

        <div className="relative">

          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />

          <input
            value={branchSearch}
            onChange={(e) =>
              setBranchSearch(
                e.target.value
              )
            }
            placeholder="Search branch, city or currency..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#5C3FE0]"
          />

        </div>

      </div>

      {/* Error */}

      {branchError && (
        <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/50 text-sm text-red-400">
          {branchError}
        </div>
      )}

      {/* Currency Error */}

      {currencyError && (
        <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/50 text-sm text-red-400">
          {currencyError}
        </div>
      )}

      {/* Loading */}

      {isLoadingBranches && (
        <div className="p-8 rounded-2xl bg-[#09071e] border border-[#231e54] flex items-center justify-center gap-2 text-sm text-slate-400">

          <Loader2 className="w-4 h-4 animate-spin" />

          Loading branches...

        </div>
      )}

      {/* Branches */}

      {!isLoadingBranches && (
        <>
          {filteredBranches.length === 0 ? (

            <div className="p-10 rounded-2xl bg-[#09071e] border border-[#231e54] text-center">

              <GitBranch className="w-10 h-10 mx-auto text-slate-500 mb-3" />

              <h3 className="text-sm font-bold text-white">
                No branches found
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Create the first branch for this
                organization.
              </p>

              <button
                type="button"
                onClick={handleAddBranch}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5C3FE0] text-white text-xs font-bold"
              >

                <Plus className="w-4 h-4" />

                Add Branch

              </button>

            </div>

          ) : (

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

              {filteredBranches.map(
                (branch) => (

                  <div
                    key={branch.id}
                    className="p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/80 hover:border-[#5C3FE0]/70 transition-all"
                  >

                    {/* Branch Header */}

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex items-center gap-3 min-w-0">

                        <div className="w-11 h-11 rounded-xl bg-[#1a144b] border border-[#2d2770] flex items-center justify-center text-[#A78BFA] shrink-0">

                          <GitBranch className="w-5 h-5" />

                        </div>

                        <div className="min-w-0">

                          <h3 className="text-sm font-bold text-white truncate">
                            {branch.branchName}
                          </h3>

                          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">

                            <MapPin className="w-3 h-3" />

                            {branch.city ||
                              'No city'}

                          </div>

                        </div>

                      </div>

                      <span
                        className={
                          branch.isActive
                            ? 'px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/50'
                            : 'px-2 py-0.5 rounded text-[9px] font-bold bg-red-950/40 text-red-400 border border-red-900/50'
                        }
                      >

                        {branch.isActive
                          ? 'ACTIVE'
                          : 'INACTIVE'}

                      </span>

                    </div>

                    {/* Branch Information */}

                    <div className="mt-4 p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54] space-y-2.5">

                      {/* Branch ID */}

                      <div className="flex items-center justify-between text-xs">

                        <span className="text-slate-500">
                          Branch ID
                        </span>

                        <span className="font-mono text-white">
                          #{branch.id}
                        </span>

                      </div>

                      {/* Currency */}

                      <div className="flex items-center justify-between text-xs">

                        <span className="text-slate-500">
                          Currency
                        </span>

                        <span className="flex items-center gap-1.5 text-white font-semibold">

                          {branch.currency ? (
                            <>
                              <span className="text-[#A78BFA]">
                                {branch.currency.symbol}
                              </span>

                              <span>
                                {branch.currency.code}
                              </span>

                              {branch.currencyId ===
                                selectedTenant.defaultCurrencyId && (
                                  <span className="ml-1 text-[8px] px-1.5 py-0.5 rounded bg-[#5C3FE0]/20 text-[#A78BFA] border border-[#5C3FE0]/30">
                                    DEFAULT
                                  </span>
                                )}
                            </>
                          ) : (
                            <span className="text-red-400">
                              Not configured
                            </span>
                          )}

                        </span>

                      </div>

                      {/* Currency Name */}

                      {branch.currency && (
                        <div className="flex items-center justify-between text-[10px]">

                          <span className="text-slate-500">
                            Currency Name
                          </span>

                          <span className="text-slate-300">
                            {branch.currency.name}
                          </span>

                        </div>
                      )}

                    </div>

                    {/* Actions */}

                    <div className="mt-4 pt-3 border-t border-[#1e1950] flex items-center gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          handleEditBranch(
                            branch
                          )
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-[#5C3FE0]/20 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors"
                      >

                        <Pencil className="w-3.5 h-3.5" />

                        Edit

                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleStatus(
                            branch
                          )
                        }
                        className={
                          branch.isActive
                            ? 'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-semibold'
                            : 'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs font-semibold'
                        }
                      >

                        <Power className="w-3.5 h-3.5" />

                        {branch.isActive
                          ? 'Disable'
                          : 'Enable'}

                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          )}
        </>
      )}

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">

          <div className="w-full max-w-lg bg-[#09071e] border border-[#2d2770] rounded-2xl shadow-2xl overflow-hidden">

            {/* Modal Header */}

            <div className="flex items-center justify-between px-6 py-4 border-b border-[#231e54]">

              <div className="flex items-center gap-3">

                <div className="p-2 rounded-lg bg-[#5C3FE0]/20 text-[#A78BFA]">

                  <GitBranch className="w-5 h-5" />

                </div>

                <div>

                  <h2 className="text-base font-bold text-white">

                    {editingBranch
                      ? 'Edit Branch'
                      : 'Add Branch'}

                  </h2>

                  <p className="text-[11px] text-slate-400">
                    {selectedTenant.name}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={closeBranchModal}
                disabled={isSaving}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-50"
              >

                <X className="w-5 h-5" />

              </button>

            </div>

            {/* Form */}

            <div className="p-6 space-y-4">

              {/* Tenant */}

              <div>

                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Organization
                </label>

                <div className="mt-1.5 px-3 py-2.5 rounded-xl bg-[#0e0b2e] border border-[#231e54] text-xs text-slate-300 flex items-center justify-between">

                  <span>
                    {selectedTenant.name}
                  </span>

                  {tenantDefaultCurrency && (
                    <span className="flex items-center gap-1 text-[#A78BFA]">

                      <Coins className="w-3 h-3" />

                      {tenantDefaultCurrency.symbol}{' '}
                      {tenantDefaultCurrency.code}

                    </span>
                  )}

                </div>

              </div>

              {/* Branch Name */}

              <div>

                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Branch Name
                </label>

                <input
                  value={branchName}
                  onChange={(e) =>
                    setBranchName(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Kochi Branch"
                  disabled={isSaving}
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#5C3FE0] disabled:opacity-50"
                />

              </div>

              {/* City */}

              <div>

                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  City
                </label>

                <input
                  value={city}
                  onChange={(e) =>
                    setCity(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Kochi"
                  disabled={isSaving}
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#5C3FE0] disabled:opacity-50"
                />

              </div>

              {/* =================================================
                  BRANCH CURRENCY
              ================================================= */}

              <div>

                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Branch Currency
                </label>

                {/* Tenant Default Checkbox */}

                <label
                  className={`mt-2 flex items-center gap-3 p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54] ${isSaving
                    ? 'opacity-60 cursor-not-allowed'
                    : 'cursor-pointer'
                    }`}
                >

                  <input
                    type="checkbox"
                    checked={useTenantDefaultCurrency}
                    onChange={(e) =>
                      handleTenantDefaultCurrencyChange(
                        e.target.checked
                      )
                    }
                    disabled={
                      isSaving ||
                      selectedTenant?.defaultCurrencyId == null
                    }
                    className="w-4 h-4 accent-[#5C3FE0]"
                  />

                  <div className="flex-1">

                    <div className="text-xs font-semibold text-white">

                      Use Tenant Default Currency

                    </div>

                    <div className="text-[10px] text-slate-500 mt-0.5">

                      Automatically use the currency
                      configured for this organization.

                    </div>

                  </div>

                  {tenantDefaultCurrency && (
                    <span className="text-[10px] text-[#A78BFA] font-semibold">

                      {tenantDefaultCurrency.symbol}{' '}
                      {tenantDefaultCurrency.code}

                    </span>
                  )}

                </label>

                {/* Currency Dropdown */}

                <div className="relative mt-2">

                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A78BFA] pointer-events-none z-10" />

                  <select
                    value={
                      currencyId ?? ''
                    }
                    onChange={(e) =>
                      setCurrencyId(
                        e.target.value
                          ? Number(
                            e.target.value
                          )
                          : null
                      )
                    }
                    disabled={
                      useTenantDefaultCurrency ||
                      isLoadingCurrencies ||
                      isSaving
                    }
                    className={`
                      w-full
                      pl-9
                      pr-3
                      py-2.5
                      rounded-xl
                      bg-[#0e0b2e]
                      border
                      border-[#2d2770]
                      text-xs
                      focus:outline-none
                      focus:border-[#5C3FE0]
                      appearance-none
                      ${useTenantDefaultCurrency
                        ? 'text-slate-400 cursor-not-allowed opacity-70'
                        : 'text-white'
                      }
                    `}
                  >

                    <option value="">

                      {isLoadingCurrencies
                        ? 'Loading currencies...'
                        : 'Select currency'}

                    </option>

                    {currencies.map(
                      (currency) => (
                        <option
                          key={currency.id}
                          value={currency.id}
                        >
                          {currency.code} —{' '}
                          {currency.name} (
                          {currency.symbol})
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* Selected Currency Information */}

                {currencyId && (
                  <div className="mt-2 flex items-center justify-between text-[10px]">

                    <span className="text-slate-500">
                      Selected Currency
                    </span>

                    {(() => {
                      const selectedCurrency =
                        currencies.find(
                          (currency) =>
                            currency.id ===
                            currencyId
                        ) ??
                        (
                          tenantDefaultCurrency?.id ===
                            currencyId
                            ? tenantDefaultCurrency
                            : null
                        );

                      if (!selectedCurrency) {
                        return (
                          <span className="text-slate-400">
                            Currency #{currencyId}
                          </span>
                        );
                      }

                      return (
                        <span className="text-[#A78BFA] font-semibold">

                          {selectedCurrency.symbol}{' '}
                          {selectedCurrency.code}
                          {' — '}
                          {selectedCurrency.name}

                        </span>
                      );
                    })()}

                  </div>
                )}

              </div>

              {/* Status */}

              {editingBranch && (
                <label className="flex items-center justify-between p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54] cursor-pointer">

                  <div>

                    <div className="text-xs font-semibold text-white">
                      Branch Active
                    </div>

                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Inactive branches cannot be
                      assigned to employees.
                    </div>

                  </div>

                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) =>
                      setIsActive(
                        e.target.checked
                      )
                    }
                    disabled={isSaving}
                    className="w-4 h-4 accent-[#5C3FE0]"
                  />

                </label>
              )}

              {/* Error */}

              {formError && (
                <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/50 text-xs text-red-400">
                  {formError}
                </div>
              )}

            </div>

            {/* Footer */}

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#231e54]">

              <button
                type="button"
                onClick={closeBranchModal}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveBranch}
                disabled={
                  isSaving ||
                  isLoadingCurrencies ||
                  !currencyId
                }
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5C3FE0] hover:bg-[#6d51ec] disabled:opacity-50 text-white text-xs font-bold"
              >

                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}

                {editingBranch
                  ? 'Save Changes'
                  : 'Create Branch'}

              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          STATUS CONFIRMATION MODAL
      ===================================================== */}

      {branchToToggle && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">

          <div className="w-full max-w-md bg-[#09071e] border border-[#2d2770] rounded-2xl shadow-2xl overflow-hidden">

            {/* Header */}

            <div className="px-6 py-5 border-b border-[#231e54]">

              <div className="flex items-center gap-3">

                <div
                  className={
                    branchToToggle.isActive
                      ? 'w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center'
                      : 'w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center'
                  }
                >

                  <Power
                    className={
                      branchToToggle.isActive
                        ? 'w-5 h-5 text-red-400'
                        : 'w-5 h-5 text-emerald-400'
                    }
                  />

                </div>

                <div>

                  <h2 className="text-base font-bold text-white">

                    {branchToToggle.isActive
                      ? 'Disable Branch'
                      : 'Enable Branch'}

                  </h2>

                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Confirm branch status change
                  </p>

                </div>

              </div>

            </div>

            {/* Content */}

            <div className="px-6 py-5">

              <p className="text-sm text-slate-300 leading-relaxed">

                Are you sure you want to{' '}

                <span
                  className={
                    branchToToggle.isActive
                      ? 'font-bold text-red-400'
                      : 'font-bold text-emerald-400'
                  }
                >

                  {branchToToggle.isActive
                    ? 'disable'
                    : 'enable'}

                </span>{' '}

                the branch{' '}

                <span className="font-bold text-white">

                  "{branchToToggle.branchName}"

                </span>

                ?

              </p>

              {/* Branch Information */}

              <div className="mt-4 p-3 rounded-xl bg-[#0e0b2e] border border-[#231e54]">

                {/* Organization */}

                <div className="flex items-center justify-between text-xs">

                  <span className="text-slate-500">
                    Organization
                  </span>

                  <span className="text-slate-300 font-medium">
                    {selectedTenant.name}
                  </span>

                </div>

                {/* Branch */}

                <div className="flex items-center justify-between text-xs mt-2">

                  <span className="text-slate-500">
                    Branch
                  </span>

                  <span className="text-white font-medium">
                    {branchToToggle.branchName}
                  </span>

                </div>

                {/* Currency */}

                {branchToToggle.currency && (
                  <div className="flex items-center justify-between text-xs mt-2">

                    <span className="text-slate-500">
                      Currency
                    </span>

                    <span className="text-[#A78BFA] font-semibold">

                      {branchToToggle.currency.symbol}{' '}
                      {branchToToggle.currency.code}

                    </span>

                  </div>
                )}

                {/* Current Status */}

                <div className="flex items-center justify-between text-xs mt-2">

                  <span className="text-slate-500">
                    Current Status
                  </span>

                  <span
                    className={
                      branchToToggle.isActive
                        ? 'text-emerald-400 font-semibold'
                        : 'text-red-400 font-semibold'
                    }
                  >

                    {branchToToggle.isActive
                      ? 'Active'
                      : 'Inactive'}

                  </span>

                </div>

                {/* New Status */}

                <div className="flex items-center justify-between text-xs mt-2">

                  <span className="text-slate-500">
                    New Status
                  </span>

                  <span
                    className={
                      branchToToggle.isActive
                        ? 'text-red-400 font-semibold'
                        : 'text-emerald-400 font-semibold'
                    }
                  >

                    {branchToToggle.isActive
                      ? 'Inactive'
                      : 'Active'}

                  </span>

                </div>

              </div>

              {/* Warning */}

              {branchToToggle.isActive && (
                <p className="mt-4 text-[11px] text-slate-500 leading-relaxed">

                  Disabling this branch will prevent it from
                  being assigned to employees until it is
                  enabled again.

                </p>
              )}

            </div>

            {/* Footer */}

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#231e54]">

              {/* Cancel */}

              <button
                type="button"
                onClick={() => {
                  if (!isTogglingStatus) {
                    setBranchToToggle(null);
                  }
                }}
                disabled={isTogglingStatus}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 disabled:opacity-50 transition-colors"
              >

                Cancel

              </button>

              {/* Confirm */}

              <button
                type="button"
                onClick={confirmToggleStatus}
                disabled={isTogglingStatus}
                className={
                  branchToToggle.isActive
                    ? 'flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold transition-colors'
                    : 'flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-colors'
                }
              >

                {isTogglingStatus ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Power className="w-4 h-4" />
                )}

                {isTogglingStatus
                  ? 'Updating...'
                  : branchToToggle.isActive
                    ? 'Disable Branch'
                    : 'Enable Branch'}

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};