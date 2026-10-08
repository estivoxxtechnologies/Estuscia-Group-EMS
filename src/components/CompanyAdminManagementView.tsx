import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ArrowLeft,
  Banknote,
  Building2,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  Globe,
  Hash,
  Loader2,
  LockKeyhole,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  X,
  AlertCircle,
} from 'lucide-react';

import { useApp } from '../context/AppContext';

import {
  getTenants,
  BackendTenant,
} from '../api/tenants';

import {
  getCompanyAdmins,
  createCompanyAdmin,
  CompanyAdmin,
  CreateCompanyAdminRequest,
} from '../api/users';


// ============================================================
// FORM
// ============================================================

const emptyForm: CreateCompanyAdminRequest = {
  fullName: '',
  email: '',
  password: '',
  employeeCode: '',
  designation: '',
  department: '',
  salaryBase: 0,
  avatarUrl: '',
};


// ============================================================
// COMPONENT
// ============================================================

export const CompanyAdminManagementView: React.FC = () => {
  const { currentUser } = useApp();

  // ==========================================================
  // SECURITY
  // ==========================================================

  const isSuperAdmin =
    currentUser?.roleName
      ?.trim()
      .toLowerCase() === 'super_admin';


  // ==========================================================
  // TENANTS
  // ==========================================================

  const [tenants, setTenants] =
    useState<BackendTenant[]>([]);

  const [isLoadingTenants, setIsLoadingTenants] =
    useState(false);

  const [tenantError, setTenantError] =
    useState<string | null>(null);

  const [tenantSearch, setTenantSearch] =
    useState('');


  // ==========================================================
  // SELECTED TENANT
  // ==========================================================

  const [selectedTenant, setSelectedTenant] =
    useState<BackendTenant | null>(null);


  // ==========================================================
  // ADMINS FOR SELECTED TENANT ONLY
  // ==========================================================

  const [admins, setAdmins] =
    useState<CompanyAdmin[]>([]);

  const [isLoadingAdmins, setIsLoadingAdmins] =
    useState(false);

  const [adminError, setAdminError] =
    useState<string | null>(null);


  // ==========================================================
  // ADD MODAL
  // ==========================================================

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [formData, setFormData] =
    useState<CreateCompanyAdminRequest>({
      ...emptyForm,
    });

  const [submitting, setSubmitting] =
    useState(false);

  const [formError, setFormError] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');


  // ==========================================================
  // DETAILS MODAL
  // ==========================================================

  const [selectedAdmin, setSelectedAdmin] =
    useState<CompanyAdmin | null>(null);

  const [showDetailsModal, setShowDetailsModal] =
    useState(false);


  // ==========================================================
  // LOAD TENANTS
  //
  // IMPORTANT:
  // This ONLY loads tenants.
  //
  // It DOES NOT load company admins.
  // ==========================================================

  useEffect(() => {
    if (!isSuperAdmin) {
      return;
    }

    let cancelled = false;

    const loadTenants = async () => {
      try {
        setIsLoadingTenants(true);
        setTenantError(null);

        const data = await getTenants();

        if (!cancelled) {
          setTenants(
            Array.isArray(data)
              ? data
              : []
          );
        }
      } catch (error) {
        console.error(
          'Failed to load tenants:',
          error
        );

        if (!cancelled) {
          setTenantError(
            error instanceof Error
              ? error.message
              : 'Failed to load tenants.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTenants(false);
        }
      }
    };

    loadTenants();

    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);


  // ==========================================================
  // FILTER TENANTS
  // ==========================================================

  const filteredTenants = useMemo(() => {
    const search =
      tenantSearch
        .trim()
        .toLowerCase();

    if (!search) {
      return tenants;
    }

    return tenants.filter(
      (tenant) => {
        const values = [
          tenant.name,
          tenant.code,
          tenant.domain,
          tenant.plan,
        ];

        return values
          .filter(
            (
              value
            ): value is string =>
              Boolean(value)
          )
          .some(
            (value) =>
              value
                .toLowerCase()
                .includes(search)
          );
      }
    );
  }, [
    tenants,
    tenantSearch,
  ]);


  // ==========================================================
  // LOAD ADMINS FOR SELECTED TENANT
  //
  // THIS API IS CALLED ONLY AFTER A TENANT IS CLICKED.
  // ==========================================================

  useEffect(() => {
    if (!selectedTenant) {
      setAdmins([]);
      setAdminError(null);
      return;
    }

    let cancelled = false;

    const loadAdmins = async () => {
      try {
        setIsLoadingAdmins(true);
        setAdminError(null);

        const data =
          await getCompanyAdmins(
            selectedTenant.id
          );

        if (!cancelled) {
          setAdmins(
            Array.isArray(data)
              ? data
              : []
          );
        }
      } catch (error) {
        console.error(
          `Failed to load Company Admins for tenant ${selectedTenant.id}:`,
          error
        );

        if (!cancelled) {
          setAdmins([]);

          setAdminError(
            error instanceof Error
              ? error.message
              : 'Failed to load Company Admins.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAdmins(false);
        }
      }
    };

    loadAdmins();

    return () => {
      cancelled = true;
    };
  }, [selectedTenant]);


  // ==========================================================
  // OPEN TENANT
  // ==========================================================

  const openTenant = (
    tenant: BackendTenant
  ) => {
    setSelectedTenant(tenant);
    setAdmins([]);
    setAdminError(null);
  };


  // ==========================================================
  // BACK TO TENANTS
  // ==========================================================

  const backToTenants = () => {
    setSelectedTenant(null);
    setAdmins([]);
    setAdminError(null);
    setShowAddModal(false);
    setSelectedAdmin(null);
    setShowDetailsModal(false);
  };


  // ==========================================================
  // OPEN ADD MODAL
  // ==========================================================

  const openAddModal = () => {
    if (!selectedTenant) {
      return;
    }

    setFormData({
      ...emptyForm,
    });

    setFormError('');
    setSuccessMessage('');

    setShowAddModal(true);
  };


  // ==========================================================
  // CLOSE ADD MODAL
  // ==========================================================

  const closeAddModal = () => {
    if (submitting) {
      return;
    }

    setShowAddModal(false);

    setFormData({
      ...emptyForm,
    });

    setFormError('');
    setSuccessMessage('');
  };


  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previous) => ({
        ...previous,

        [name]:
          name === 'salaryBase'
            ? Number(value)
            : value,
      })
    );

    if (formError) {
      setFormError('');
    }
  };


  // ==========================================================
  // VALIDATE FORM
  // ==========================================================

  const validateForm =
    (): string | null => {
      if (!formData.fullName.trim()) {
        return 'Full name is required.';
      }

      if (!formData.email.trim()) {
        return 'Email is required.';
      }

      if (!formData.password.trim()) {
        return 'Password is required.';
      }

      if (
        formData.password.length < 6
      ) {
        return 'Password must contain at least 6 characters.';
      }

      if (
        !formData.employeeCode.trim()
      ) {
        return 'Employee code is required.';
      }

      if (
        !formData.designation.trim()
      ) {
        return 'Designation is required.';
      }

      if (
        !formData.department.trim()
      ) {
        return 'Department is required.';
      }

      if (
        Number.isNaN(
          formData.salaryBase
        ) ||
        formData.salaryBase < 0
      ) {
        return 'Salary must be a valid non-negative amount.';
      }

      return null;
    };


  // ==========================================================
  // CREATE COMPANY ADMIN
  // ==========================================================

  const handleCreateAdmin = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!selectedTenant) {
      setFormError(
        'No tenant has been selected.'
      );
      return;
    }

    const validationError =
      validateForm();

    if (validationError) {
      setFormError(
        validationError
      );
      return;
    }

    setSubmitting(true);
    setFormError('');
    setSuccessMessage('');

    try {
      const request:
        CreateCompanyAdminRequest = {
        fullName:
          formData.fullName.trim(),

        email:
          formData.email.trim(),

        password:
          formData.password,

        employeeCode:
          formData.employeeCode.trim(),

        designation:
          formData.designation.trim(),

        department:
          formData.department.trim(),

        salaryBase:
          Number(
            formData.salaryBase
          ),

        avatarUrl:
          formData.avatarUrl
            ?.trim() || '',
      };

      const createdAdmin =
        await createCompanyAdmin(
          selectedTenant.id,
          request
        );

      setAdmins(
        (previous) => [
          ...previous,
          createdAdmin,
        ]
      );

      // Update tenant count immediately.
      setTenants(
        (previous) =>
          previous.map(
            (tenant) =>
              tenant.id ===
              selectedTenant.id
                ? {
                    ...tenant,
                    companyAdminCount:
                      (tenant.companyAdminCount ??
                        0) + 1,
                  }
                : tenant
          )
      );

      setSelectedTenant(
        (previous) =>
          previous
            ? {
                ...previous,
                companyAdminCount:
                  (previous.companyAdminCount ??
                    0) + 1,
              }
            : previous
      );

      setSuccessMessage(
        'Company Admin created successfully.'
      );

      // Close after successful creation.
      window.setTimeout(() => {
        setShowAddModal(false);

        setFormData({
          ...emptyForm,
        });

        setSuccessMessage('');
      }, 900);
    } catch (error: any) {
      console.error(
        'Failed to create Company Admin:',
        error
      );

      const responseData =
        error?.response?.data;

      const responseMessage =
        responseData?.message ||
        responseData?.title ||
        (
          typeof responseData ===
          'string'
            ? responseData
            : null
        );

      const errorMessage =
        typeof responseMessage ===
        'string'
          ? responseMessage
          : error?.message;

      setFormError(
        errorMessage ||
          'Failed to create Company Admin.'
      );
    } finally {
      setSubmitting(false);
    }
  };


  // ==========================================================
  // VIEW DETAILS
  // ==========================================================

  const openDetails = (
    admin: CompanyAdmin
  ) => {
    setSelectedAdmin(admin);
    setShowDetailsModal(true);
  };


  // ==========================================================
  // CLOSE DETAILS
  // ==========================================================

  const closeDetails = () => {
    setShowDetailsModal(false);
    setSelectedAdmin(null);
  };


  // ==========================================================
  // ACCESS DENIED
  // ==========================================================

  if (!isSuperAdmin) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <div className="flex items-center gap-3 text-red-300">
          <AlertCircle size={20} />

          <div>
            <h2 className="font-semibold">
              Access Denied
            </h2>

            <p className="mt-1 text-sm text-red-200/80">
              Only Super Admin can manage
              Company Administrators.
            </p>
          </div>
        </div>
      </div>
    );
  }


  // ==========================================================
  // LOADING TENANTS
  // ==========================================================

  if (
    isLoadingTenants &&
    tenants.length === 0
  ) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2
            size={32}
            className="animate-spin text-[#A78BFA]"
          />

          <p className="text-sm">
            Loading tenants...
          </p>
        </div>
      </div>
    );
  }


  // ==========================================================
  // TENANT DETAIL PAGE
  // ==========================================================

  if (selectedTenant) {
    return (
      <div className="space-y-6">

        {/* HEADER */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={backToTenants}
              className="
                inline-flex
                items-center
                justify-center
                rounded-xl
                border border-[#2d2770]
                bg-[#09071e]
                p-2.5
                text-slate-300
                transition
                hover:border-[#6C4AFF]
                hover:bg-[#0e0b2e]
                hover:text-white
              "
            >
              <ArrowLeft size={18} />
            </button>

            <div
              className="
                flex h-11 w-11
                items-center
                justify-center
                rounded-xl
                border border-[#2d2770]
                bg-[#0e0b2e]
              "
            >
              <Building2
                size={22}
                className="text-[#A78BFA]"
              />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-white">
                {selectedTenant.name}
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Company Administrators
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-[#5C3FE0]
              px-4 py-2.5
              text-sm font-semibold
              text-white
              shadow-lg
              shadow-[#5C3FE0]/20
              transition
              hover:bg-[#6d51ec]
            "
          >
            <UserPlus size={16} />

            Add Company Admin
          </button>
        </div>


        {/* TENANT SUMMARY */}

        <div
          className="
            grid grid-cols-1
            gap-4
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >

          <div
            className="
              rounded-2xl
              border border-[#2d2770]
              bg-[#09071e]
              p-5
            "
          >
            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              Tenant
            </p>

            <p className="mt-2 truncate text-sm font-semibold text-white">
              {selectedTenant.name}
            </p>

            <p className="mt-1 font-mono text-[10px] text-slate-500">
              {selectedTenant.code}
            </p>
          </div>


          <div
            className="
              rounded-2xl
              border border-[#2d2770]
              bg-[#09071e]
              p-5
            "
          >
            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              Company Admins
            </p>

            <div className="mt-2 flex items-center gap-2">
              <Users
                size={18}
                className="text-[#A78BFA]"
              />

              <p className="text-xl font-bold text-white">
                {admins.length}
              </p>
            </div>
          </div>


          <div
            className="
              rounded-2xl
              border border-[#2d2770]
              bg-[#09071e]
              p-5
            "
          >
            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              Domain
            </p>

            <p className="mt-2 truncate text-sm text-slate-300">
              {selectedTenant.domain ||
                '—'}
            </p>
          </div>


          <div
            className="
              rounded-2xl
              border border-[#2d2770]
              bg-[#09071e]
              p-5
            "
          >
            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              Status
            </p>

            <p
              className={`mt-2 text-sm font-medium ${
                selectedTenant.isActive
                  ? 'text-emerald-300'
                  : 'text-red-300'
              }`}
            >
              {selectedTenant.isActive
                ? 'Active'
                : 'Inactive'}
            </p>
          </div>
        </div>


        {/* ERROR */}

        {adminError && (
          <div
            className="
              flex items-center gap-3
              rounded-xl
              border border-red-500/30
              bg-red-500/10
              p-4
              text-sm text-red-300
            "
          >
            <AlertCircle size={18} />

            <span className="flex-1">
              {adminError}
            </span>

            <button
              type="button"
              onClick={() => {
                setSelectedTenant(
                  (previous) =>
                    previous
                      ? {
                          ...previous,
                        }
                      : null
                );
              }}
              className="
                rounded-lg
                border border-red-400/30
                px-3 py-1.5
                text-xs
                hover:bg-red-500/10
              "
            >
              Retry
            </button>
          </div>
        )}


        {/* ADMIN LIST */}

        <div
          className="
            rounded-2xl
            border border-[#2d2770]
            bg-[#09071e]
            p-5
          "
        >

          <div className="mb-5 flex items-center justify-between">

            <div>
              <h2 className="text-sm font-semibold text-white">
                Company Administrators
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Tenant-level administrators with
                access to all branches.
              </p>
            </div>

            {isLoadingAdmins && (
              <Loader2
                size={18}
                className="animate-spin text-[#A78BFA]"
              />
            )}
          </div>


          {isLoadingAdmins ? (
            <div
              className="
                flex
                items-center
                justify-center
                rounded-xl
                border border-[#231e54]
                bg-[#0e0b2e]
                py-14
              "
            >
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2
                  size={16}
                  className="animate-spin"
                />

                Loading Company Administrators...
              </div>
            </div>
          ) : admins.length === 0 ? (
            <div
              className="
                rounded-xl
                border border-dashed
                border-[#2d2770]
                bg-[#0e0b2e]
                px-5 py-14
                text-center
              "
            >
              <ShieldCheck
                size={38}
                className="mx-auto mb-4 text-slate-600"
              />

              <h3 className="text-sm font-semibold text-white">
                No Company Admins
              </h3>

              <p className="mt-2 text-xs text-slate-500">
                This tenant does not have a
                Company Administrator yet.
              </p>

              <button
                type="button"
                onClick={openAddModal}
                className="
                  mt-5
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-[#5C3FE0]
                  px-4 py-2.5
                  text-xs font-semibold
                  text-white
                  hover:bg-[#6d51ec]
                "
              >
                <UserPlus size={15} />

                Add Company Admin
              </button>
            </div>
          ) : (
            <div className="space-y-3">

              {admins.map(
                (admin) => (
                  <div
                    key={admin.id}
                    className="
                      rounded-xl
                      border border-[#231e54]
                      bg-[#0e0b2e]
                      p-4
                      transition
                      hover:border-[#3b3280]
                    "
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                      <div className="flex min-w-0 items-start gap-3">

                        <div
                          className="
                            flex h-11 w-11
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-[#5C3FE0]/20
                            text-sm
                            font-semibold
                            text-[#A78BFA]
                          "
                        >
                          {admin.fullName
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            'A'}
                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="truncate text-sm font-semibold text-white">
                              {admin.fullName}
                            </h3>

                            <span
                              className="
                                rounded-md
                                border
                                border-[#3b3280]
                                bg-[#17123d]
                                px-2 py-0.5
                                text-[9px]
                                font-medium
                                text-[#A78BFA]
                              "
                            >
                              Company Admin
                            </span>
                          </div>

                          <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                            <Mail size={12} />

                            {admin.email}
                          </p>
                        </div>
                      </div>


                      <button
                        type="button"
                        onClick={() =>
                          openDetails(admin)
                        }
                        className="
                          inline-flex
                          shrink-0
                          items-center
                          justify-center
                          gap-2
                          rounded-lg
                          border
                          border-[#2d2770]
                          px-3 py-2
                          text-xs
                          font-medium
                          text-slate-300
                          transition
                          hover:border-[#6C4AFF]
                          hover:bg-[#5C3FE0]/10
                          hover:text-white
                        "
                      >
                        <Eye size={14} />

                        View Details
                      </button>
                    </div>


                    <div
                      className="
                        mt-4
                        grid
                        grid-cols-1
                        gap-3
                        sm:grid-cols-3
                      "
                    >

                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-slate-600">
                          Employee Code
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
                          <Hash
                            size={12}
                            className="text-slate-600"
                          />

                          {admin.employeeCode ||
                            '—'}
                        </p>
                      </div>


                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-slate-600">
                          Designation
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-300">
                          <BriefcaseBusiness
                            size={12}
                            className="text-slate-600"
                          />

                          {admin.designation ||
                            '—'}
                        </p>
                      </div>


                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-slate-600">
                          Status
                        </p>

                        <p
                          className={`mt-1 text-xs ${
                            admin.isActive
                              ? 'text-emerald-300'
                              : 'text-red-300'
                          }`}
                        >
                          {admin.isActive
                            ? 'Active'
                            : 'Inactive'}
                        </p>
                      </div>

                    </div>
                  </div>
                )
              )}

            </div>
          )}

        </div>


        {/* ADD MODAL */}

        {showAddModal && (
          <AddCompanyAdminModal
            tenant={selectedTenant}
            formData={formData}
            submitting={submitting}
            formError={formError}
            successMessage={successMessage}
            onChange={handleChange}
            onSubmit={handleCreateAdmin}
            onClose={closeAddModal}
          />
        )}


        {/* DETAILS MODAL */}

        {showDetailsModal &&
          selectedAdmin && (
            <CompanyAdminDetailsModal
              admin={selectedAdmin}
              tenant={selectedTenant}
              onClose={closeDetails}
            />
          )}

      </div>
    );
  }


  // ==========================================================
  // TENANT LIST PAGE
  // ==========================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex items-center gap-3">

          <div
            className="
              flex h-11 w-11
              items-center
              justify-center
              rounded-xl
              border border-[#2d2770]
              bg-[#0e0b2e]
            "
          >
            <ShieldCheck
              size={23}
              className="text-[#A78BFA]"
            />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-white">
              Company Admin Management
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Select a tenant to manage its
              Company Administrators
            </p>
          </div>
        </div>


        <div
          className="
            inline-flex
            items-center
            gap-2
            self-start
            rounded-xl
            border border-[#2d2770]
            bg-[#09071e]
            px-4 py-2.5
          "
        >
          <Building2
            size={16}
            className="text-[#A78BFA]"
          />

          <span className="text-sm text-slate-300">
            {tenants.length} Tenant
            {tenants.length === 1
              ? ''
              : 's'}
          </span>
        </div>
      </div>


      {/* SEARCH */}

      <div
        className="
          rounded-2xl
          border border-[#2d2770]
          bg-[#09071e]
          p-4
        "
      >
        <div className="relative">

          <Search
            size={18}
            className="
              absolute left-4 top-1/2
              -translate-y-1/2
              text-slate-500
            "
          />

          <input
            type="text"
            value={tenantSearch}
            onChange={(event) =>
              setTenantSearch(
                event.target.value
              )
            }
            placeholder="Search tenants by name, code or domain..."
            className="
              w-full
              rounded-xl
              border border-[#2d2770]
              bg-[#0e0b2e]
              py-3 pl-11 pr-4
              text-sm text-white
              outline-none
              placeholder:text-slate-500
              focus:border-[#6C4AFF]
            "
          />
        </div>

        <div className="mt-3 flex items-center justify-between">

          <p className="text-xs text-slate-500">
            Showing{' '}
            {filteredTenants.length}{' '}
            of {tenants.length}{' '}
            tenants
          </p>

          {tenantSearch && (
            <button
              type="button"
              onClick={() =>
                setTenantSearch('')
              }
              className="
                text-xs
                text-[#A78BFA]
                hover:text-white
              "
            >
              Clear search
            </button>
          )}

        </div>
      </div>


      {/* TENANT ERROR */}

      {tenantError && (
        <div
          className="
            flex items-center gap-3
            rounded-xl
            border border-red-500/30
            bg-red-500/10
            p-4
            text-sm text-red-300
          "
        >
          <AlertCircle size={18} />

          <span className="flex-1">
            {tenantError}
          </span>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="
              rounded-lg
              border border-red-400/30
              px-3 py-1.5
              text-xs
              hover:bg-red-500/10
            "
          >
            Retry
          </button>
        </div>
      )}


      {/* NO TENANTS */}

      {!isLoadingTenants &&
        filteredTenants.length === 0 && (
          <div
            className="
              rounded-2xl
              border border-[#2d2770]
              bg-[#09071e]
              px-6 py-16
              text-center
            "
          >
            <Building2
              size={42}
              className="mx-auto mb-4 text-slate-600"
            />

            <h3 className="text-sm font-semibold text-white">
              {tenantSearch
                ? 'No tenants found'
                : 'No tenants available'}
            </h3>

            <p className="mt-2 text-xs text-slate-500">
              {tenantSearch
                ? 'Try another tenant name, code or domain.'
                : 'Create a tenant first before adding Company Administrators.'}
            </p>
          </div>
        )}


      {/* TENANT CARDS */}

      {filteredTenants.length > 0 && (
        <div
          className="
            grid
            grid-cols-1
            gap-5
            xl:grid-cols-2
          "
        >

          {filteredTenants.map(
            (tenant) => (
              <div
                key={tenant.id}
                className="
                  overflow-hidden
                  rounded-2xl
                  border border-[#2d2770]
                  bg-[#09071e]
                  shadow-xl
                "
              >

                {/* CARD */}

                <div className="p-5">

                  <div className="flex items-start gap-4">

                    <div
                      className="
                        flex h-12 w-12
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        border border-[#3b3280]
                        bg-[#17123d]
                      "
                    >
                      <Building2
                        size={23}
                        className="text-[#A78BFA]"
                      />
                    </div>


                    <div className="min-w-0 flex-1">

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <h2 className="truncate text-base font-semibold text-white">
                            {tenant.name}
                          </h2>

                          <div className="mt-2 flex flex-wrap gap-2">

                            <span
                              className="
                                rounded-md
                                border border-[#2d2770]
                                bg-[#0e0b2e]
                                px-2 py-1
                                font-mono
                                text-[10px]
                                text-slate-400
                              "
                            >
                              {tenant.code}
                            </span>

                            {tenant.plan && (
                              <span
                                className="
                                  rounded-md
                                  border border-[#2d2770]
                                  bg-[#0e0b2e]
                                  px-2 py-1
                                  text-[10px]
                                  text-slate-400
                                "
                              >
                                {tenant.plan}
                              </span>
                            )}

                            <span
                              className={`rounded-md border px-2 py-1 text-[10px] ${
                                tenant.isActive
                                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                                  : 'border-red-500/20 bg-red-500/10 text-red-300'
                              }`}
                            >
                              {tenant.isActive
                                ? 'Active'
                                : 'Inactive'}
                            </span>

                          </div>
                        </div>

                      </div>


                      {tenant.domain && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                          <Globe size={13} />

                          <span className="truncate">
                            {tenant.domain}
                          </span>
                        </div>
                      )}

                    </div>

                  </div>


                  {/* ADMIN COUNT */}

                  <div
                    className="
                      mt-5
                      rounded-xl
                      border border-[#231e54]
                      bg-[#0e0b2e]
                      p-4
                    "
                  >

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-3">

                        <div
                          className="
                            flex h-10 w-10
                            items-center
                            justify-center
                            rounded-lg
                            bg-[#5C3FE0]/20
                          "
                        >
                          <Users
                            size={18}
                            className="text-[#A78BFA]"
                          />
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Company Admins
                          </p>

                          <p className="mt-0.5 text-lg font-bold text-white">
                            {tenant.companyAdminCount ??
                              0}
                          </p>
                        </div>

                      </div>


                      <div className="text-right">

                        <p className="text-[10px] text-slate-600">
                          Access Level
                        </p>

                        <p className="mt-1 text-xs font-medium text-[#A78BFA]">
                          Tenant Level
                        </p>

                      </div>

                    </div>

                  </div>


                  {/* ACTIONS */}

                  <div
                    className="
                      mt-4
                      flex
                      flex-col
                      gap-2
                      sm:flex-row
                    "
                  >

                    <button
                      type="button"
                      onClick={() =>
                        openTenant(
                          tenant
                        )
                      }
                      className="
                        inline-flex
                        flex-1
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        border border-[#3b3280]
                        bg-[#17123d]
                        px-4 py-2.5
                        text-xs
                        font-semibold
                        text-[#A78BFA]
                        transition
                        hover:border-[#6C4AFF]
                        hover:bg-[#5C3FE0]/10
                        hover:text-white
                      "
                    >
                      <Users size={15} />

                      View Company Admins
                    </button>


                    <button
                      type="button"
                      onClick={() => {
                        openTenant(
                          tenant
                        );
                        setShowAddModal(true);
                      }}
                      className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-[#5C3FE0]
                        px-4 py-2.5
                        text-xs
                        font-semibold
                        text-white
                        shadow-lg
                        shadow-[#5C3FE0]/20
                        transition
                        hover:bg-[#6d51ec]
                      "
                    >
                      <UserPlus size={15} />

                      Add Admin
                    </button>

                  </div>

                </div>

              </div>
            )
          )}

        </div>
      )}


      {/* ======================================================
          ADD MODAL
      ====================================================== */}

      {showAddModal &&
        selectedTenant && (
          <AddCompanyAdminModal
            tenant={selectedTenant}
            formData={formData}
            submitting={submitting}
            formError={formError}
            successMessage={successMessage}
            onChange={handleChange}
            onSubmit={handleCreateAdmin}
            onClose={closeAddModal}
          />
        )}

    </div>
  );
};


// ============================================================
// ADD COMPANY ADMIN MODAL
// ============================================================

interface AddCompanyAdminModalProps {
  tenant: BackendTenant;
  formData: CreateCompanyAdminRequest;
  submitting: boolean;
  formError: string;
  successMessage: string;

  onChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;

  onSubmit: (
    event: React.FormEvent
  ) => void;

  onClose: () => void;
}

const AddCompanyAdminModal: React.FC<
  AddCompanyAdminModalProps
> = ({
  tenant,
  formData,
  submitting,
  formError,
  successMessage,
  onChange,
  onSubmit,
  onClose,
}) => {
  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center
        justify-center
        bg-black/70
        p-4
        backdrop-blur-sm
      "
    >

      <div
        className="
          max-h-[92vh]
          w-full max-w-2xl
          overflow-y-auto
          rounded-2xl
          border border-[#2d2770]
          bg-[#09071e]
          shadow-2xl
        "
      >

        {/* HEADER */}

        <div
          className="
            sticky top-0 z-10
            flex items-start
            justify-between
            border-b border-[#2d2770]
            bg-[#09071e]
            px-6 py-5
          "
        >

          <div>

            <div className="flex items-center gap-2">

              <ShieldCheck
                size={18}
                className="text-[#A78BFA]"
              />

              <h2 className="text-lg font-semibold text-white">
                Add Company Admin
              </h2>

            </div>

            <p className="mt-2 text-xs text-slate-500">
              Tenant:{' '}
              <span className="font-medium text-[#A78BFA]">
                {tenant.name}
              </span>
            </p>

            <p className="mt-1 text-[11px] text-slate-600">
              Company Admin is tenant-level and
              does not require a branch.
            </p>

          </div>


          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="
              rounded-lg
              p-2
              text-slate-400
              hover:bg-white/5
              hover:text-white
              disabled:opacity-50
            "
          >
            <X size={20} />
          </button>

        </div>


        {/* FORM */}

        <form
          onSubmit={onSubmit}
          className="space-y-5 p-6"
        >

          {/* ERROR */}

          {formError && (
            <div
              className="
                flex items-start gap-3
                rounded-xl
                border border-red-500/30
                bg-red-500/10
                p-4
                text-sm text-red-300
              "
            >
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>
                {formError}
              </span>
            </div>
          )}


          {/* SUCCESS */}

          {successMessage && (
            <div
              className="
                flex items-center gap-3
                rounded-xl
                border border-emerald-500/30
                bg-emerald-500/10
                p-4
                text-sm text-emerald-300
              "
            >
              <CheckCircle2 size={18} />

              {successMessage}
            </div>
          )}


          {/* TENANT */}

          <div
            className="
              rounded-xl
              border border-[#2d2770]
              bg-[#0e0b2e]
              p-4
            "
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  flex h-9 w-9
                  items-center
                  justify-center
                  rounded-lg
                  bg-[#5C3FE0]/20
                "
              >
                <Building2
                  size={17}
                  className="text-[#A78BFA]"
                />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-600">
                  Selected Tenant
                </p>

                <p className="mt-0.5 text-sm font-semibold text-white">
                  {tenant.name}
                </p>

                <p className="mt-0.5 text-[10px] text-slate-500">
                  {tenant.code}
                </p>
              </div>

            </div>

          </div>


          {/* BASIC INFORMATION */}

          <div>

            <div className="mb-3 flex items-center gap-2">

              <Users
                size={15}
                className="text-[#A78BFA]"
              />

              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Basic Information
              </h3>

            </div>


            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {/* FULL NAME */}

              <div className="md:col-span-2">

                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Full Name
                  <span className="text-red-400">
                    {' '}*
                  </span>
                </label>

                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={onChange}
                  disabled={submitting}
                  placeholder="Enter full name"
                  className="
                    w-full
                    rounded-xl
                    border border-[#2d2770]
                    bg-[#0e0b2e]
                    px-4 py-3
                    text-sm text-white
                    outline-none
                    placeholder:text-slate-600
                    focus:border-[#6C4AFF]
                    disabled:opacity-50
                  "
                />

              </div>


              {/* EMAIL */}

              <div>

                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Email
                  <span className="text-red-400">
                    {' '}*
                  </span>
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={onChange}
                  disabled={submitting}
                  placeholder="admin@company.com"
                  autoComplete="off"
                  className="
                    w-full
                    rounded-xl
                    border border-[#2d2770]
                    bg-[#0e0b2e]
                    px-4 py-3
                    text-sm text-white
                    outline-none
                    placeholder:text-slate-600
                    focus:border-[#6C4AFF]
                    disabled:opacity-50
                  "
                />

              </div>


              {/* PASSWORD */}

              <div>

                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Password
                  <span className="text-red-400">
                    {' '}*
                  </span>
                </label>

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={onChange}
                  disabled={submitting}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  className="
                    w-full
                    rounded-xl
                    border border-[#2d2770]
                    bg-[#0e0b2e]
                    px-4 py-3
                    text-sm text-white
                    outline-none
                    placeholder:text-slate-600
                    focus:border-[#6C4AFF]
                    disabled:opacity-50
                  "
                />

              </div>


              {/* EMPLOYEE CODE */}

              <div>

                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Employee Code
                  <span className="text-red-400">
                    {' '}*
                  </span>
                </label>

                <input
                  type="text"
                  name="employeeCode"
                  value={formData.employeeCode}
                  onChange={onChange}
                  disabled={submitting}
                  placeholder="CA-001-001"
                  className="
                    w-full
                    rounded-xl
                    border border-[#2d2770]
                    bg-[#0e0b2e]
                    px-4 py-3
                    text-sm text-white
                    outline-none
                    placeholder:text-slate-600
                    focus:border-[#6C4AFF]
                    disabled:opacity-50
                  "
                />

              </div>


              {/* DESIGNATION */}

              <div>

                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Designation
                  <span className="text-red-400">
                    {' '}*
                  </span>
                </label>

                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={onChange}
                  disabled={submitting}
                  placeholder="Company Administrator"
                  className="
                    w-full
                    rounded-xl
                    border border-[#2d2770]
                    bg-[#0e0b2e]
                    px-4 py-3
                    text-sm text-white
                    outline-none
                    placeholder:text-slate-600
                    focus:border-[#6C4AFF]
                    disabled:opacity-50
                  "
                />

              </div>


              {/* DEPARTMENT */}

              <div>

                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Department
                  <span className="text-red-400">
                    {' '}*
                  </span>
                </label>

                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={onChange}
                  disabled={submitting}
                  placeholder="Management"
                  className="
                    w-full
                    rounded-xl
                    border border-[#2d2770]
                    bg-[#0e0b2e]
                    px-4 py-3
                    text-sm text-white
                    outline-none
                    placeholder:text-slate-600
                    focus:border-[#6C4AFF]
                    disabled:opacity-50
                  "
                />

              </div>


              {/* SALARY */}

              <div>

                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Salary Base
                </label>

                <div className="relative">

                  <Banknote
                    size={15}
                    className="
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-slate-600
                    "
                  />

                  <input
                    type="number"
                    name="salaryBase"
                    value={formData.salaryBase}
                    onChange={onChange}
                    disabled={submitting}
                    min="0"
                    step="0.01"
                    className="
                      w-full
                      rounded-xl
                      border border-[#2d2770]
                      bg-[#0e0b2e]
                      py-3 pl-10 pr-4
                      text-sm text-white
                      outline-none
                      focus:border-[#6C4AFF]
                      disabled:opacity-50
                    "
                  />

                </div>

              </div>


              {/* AVATAR */}

              <div className="md:col-span-2">

                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Avatar URL
                </label>

                <input
                  type="url"
                  name="avatarUrl"
                  value={
                    formData.avatarUrl || ''
                  }
                  onChange={onChange}
                  disabled={submitting}
                  placeholder="https://..."
                  className="
                    w-full
                    rounded-xl
                    border border-[#2d2770]
                    bg-[#0e0b2e]
                    px-4 py-3
                    text-sm text-white
                    outline-none
                    placeholder:text-slate-600
                    focus:border-[#6C4AFF]
                    disabled:opacity-50
                  "
                />

              </div>

            </div>

          </div>


          {/* TENANT LEVEL NOTICE */}

          <div
            className="
              flex items-start gap-3
              rounded-xl
              border border-[#3b3280]
              bg-[#17123d]/50
              p-4
            "
          >

            <LockKeyhole
              size={17}
              className="mt-0.5 shrink-0 text-[#A78BFA]"
            />

            <div>

              <p className="text-xs font-semibold text-white">
                Tenant-level administrator
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                This Company Admin will manage
                the complete tenant and all of
                its branches. No branch assignment
                is required.
              </p>

            </div>

          </div>


          {/* ACTIONS */}

          <div
            className="
              flex
              flex-col-reverse
              gap-3
              border-t
              border-[#2d2770]
              pt-5
              sm:flex-row
              sm:justify-end
            "
          >

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="
                rounded-xl
                border border-[#2d2770]
                px-5 py-2.5
                text-sm
                font-medium
                text-slate-300
                hover:bg-white/5
                hover:text-white
                disabled:opacity-50
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#5C3FE0]
                px-5 py-2.5
                text-sm
                font-semibold
                text-white
                shadow-lg
                shadow-[#5C3FE0]/20
                hover:bg-[#6d51ec]
                disabled:opacity-50
              "
            >

              {submitting ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  Creating...
                </>
              ) : (
                <>
                  <UserPlus size={16} />

                  Create Company Admin
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
};


// ============================================================
// DETAILS MODAL
// ============================================================

interface CompanyAdminDetailsModalProps {
  admin: CompanyAdmin;
  tenant: BackendTenant;
  onClose: () => void;
}

const CompanyAdminDetailsModal: React.FC<
  CompanyAdminDetailsModalProps
> = ({
  admin,
  tenant,
  onClose,
}) => {
  return (
    <div
      className="
        fixed inset-0 z-[60]
        flex items-center
        justify-center
        bg-black/70
        p-4
        backdrop-blur-sm
      "
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div
        className="
          max-h-[90vh]
          w-full max-w-xl
          overflow-y-auto
          rounded-2xl
          border border-[#2d2770]
          bg-[#09071e]
          shadow-2xl
        "
      >

        {/* HEADER */}

        <div
          className="
            flex items-center
            justify-between
            border-b border-[#2d2770]
            px-6 py-5
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                flex h-11 w-11
                items-center
                justify-center
                rounded-full
                bg-[#5C3FE0]/20
                text-[#A78BFA]
              "
            >
              {admin.fullName
                ?.charAt(0)
                ?.toUpperCase() ||
                'A'}
            </div>

            <div>

              <h2 className="text-lg font-semibold text-white">
                Admin Details
              </h2>

              <p className="text-xs text-slate-500">
                Company Administrator
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-lg
              p-2
              text-slate-400
              hover:bg-white/5
              hover:text-white
            "
          >
            <X size={20} />
          </button>

        </div>


        {/* BODY */}

        <div className="space-y-5 p-6">

          {/* TENANT */}

          <div
            className="
              rounded-xl
              border border-[#2d2770]
              bg-[#0e0b2e]
              p-4
            "
          >

            <div className="flex items-center gap-3">

              <Building2
                size={18}
                className="text-[#A78BFA]"
              />

              <div>

                <p className="text-[10px] uppercase tracking-wider text-slate-600">
                  Tenant
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {tenant.name}
                </p>

                <p className="mt-1 font-mono text-[10px] text-slate-500">
                  {tenant.code}
                </p>

              </div>

            </div>

          </div>


          {/* DETAILS */}

          <div
            className="
              grid
              grid-cols-1
              gap-4
              sm:grid-cols-2
            "
          >

            <DetailItem
              label="Full Name"
              value={admin.fullName}
              icon={
                <Users size={14} />
              }
            />

            <DetailItem
              label="Email"
              value={admin.email}
              icon={
                <Mail size={14} />
              }
            />

            <DetailItem
              label="Employee Code"
              value={
                admin.employeeCode ||
                '—'
              }
              icon={
                <Hash size={14} />
              }
            />

            <DetailItem
              label="Role"
              value="Company Admin"
              icon={
                <ShieldCheck size={14} />
              }
            />

            <DetailItem
              label="Designation"
              value={
                admin.designation ||
                '—'
              }
              icon={
                <BriefcaseBusiness
                  size={14}
                />
              }
            />

            <DetailItem
              label="Department"
              value={
                admin.department ||
                '—'
              }
              icon={
                <BriefcaseBusiness
                  size={14}
                />
              }
            />

            <DetailItem
              label="Salary Base"
              value={
                admin.salaryBase != null
                  ? String(
                      admin.salaryBase
                    )
                  : '—'
              }
              icon={
                <Banknote size={14} />
              }
            />

            <DetailItem
              label="Branch"
              value="All Branches / Tenant Level"
              icon={
                <Building2 size={14} />
              }
            />

          </div>


          {/* STATUS */}

          <div
            className={`
              rounded-xl
              border p-4
              ${
                admin.isActive
                  ? 'border-emerald-500/20 bg-emerald-500/10'
                  : 'border-red-500/20 bg-red-500/10'
              }
            `}
          >

            <div className="flex items-center gap-3">

              <div
                className={`
                  h-2.5 w-2.5
                  rounded-full
                  ${
                    admin.isActive
                      ? 'bg-emerald-400'
                      : 'bg-red-400'
                  }
                `}
              />

              <div>

                <p
                  className={`
                    text-sm font-semibold
                    ${
                      admin.isActive
                        ? 'text-emerald-300'
                        : 'text-red-300'
                    }
                  `}
                >
                  {admin.isActive
                    ? 'Active'
                    : 'Inactive'}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Company Admin account status
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};


// ============================================================
// DETAIL ITEM
// ============================================================

interface DetailItemProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

const DetailItem: React.FC<
  DetailItemProps
> = ({
  label,
  value,
  icon,
}) => {
  return (
    <div
      className="
        rounded-xl
        border border-[#231e54]
        bg-[#0e0b2e]
        p-4
      "
    >

      <p className="text-[9px] uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-2 flex items-center gap-2 text-xs text-slate-300">
        <span className="text-slate-600">
          {icon}
        </span>

        <span className="break-words">
          {value}
        </span>
      </p>

    </div>
  );
};