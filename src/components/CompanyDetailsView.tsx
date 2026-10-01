import React, {
  useEffect,
  useState,
} from 'react';

import {
  Building2,
  Save,
  Loader2,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  Hash,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import { toast } from 'react-toastify';

import { useApp } from '../context/AppContext';

import {
  getTenantCompanyProfile,
  updateTenantCompanyProfile,
} from '../api/tenantCompanyProfile';

import {
  TenantCompanyProfile,
  UpdateTenantCompanyProfileRequest,
} from '../types/tenantCompanyProfile';

/* =========================================================
   EMPTY FORM
========================================================= */

const EMPTY_FORM: UpdateTenantCompanyProfileRequest = {
  legalName: '',
  displayName: '',

  addressLine1: '',
  addressLine2: '',

  city: '',
  state: '',
  postalCode: '',
  country: '',

  phone: '',
  email: '',
  website: '',

  taxRegistrationNumber: '',
  companyRegistrationNumber: '',

  payslipFooterText: '',
};

/* =========================================================
   PAGE
========================================================= */

const CompanyDetailsView: React.FC = () => {
  const {
    currentUser,
  } = useApp();

  const [profile, setProfile] =
    useState<TenantCompanyProfile | null>(
      null
    );

  const [form, setForm] =
    useState<UpdateTenantCompanyProfileRequest>(
      EMPTY_FORM
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /* =======================================================
     SECURITY
  ======================================================= */

  const isCompanyAdmin =
    currentUser?.roleName === 'company_admin';

  /* =======================================================
     LOAD
  ======================================================= */

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const data =
        await getTenantCompanyProfile();

      setProfile(data);

      setForm({
        legalName:
          data.legalName ?? '',

        displayName:
          data.displayName ?? '',

        addressLine1:
          data.addressLine1 ?? '',

        addressLine2:
          data.addressLine2 ?? '',

        city:
          data.city ?? '',

        state:
          data.state ?? '',

        postalCode:
          data.postalCode ?? '',

        country:
          data.country ?? '',

        phone:
          data.phone ?? '',

        email:
          data.email ?? '',

        website:
          data.website ?? '',

        taxRegistrationNumber:
          data.taxRegistrationNumber ?? '',

        companyRegistrationNumber:
          data.companyRegistrationNumber ?? '',

        payslipFooterText:
          data.payslipFooterText ?? '',
      });

    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to load company details.';

      setError(message);

      toast.error(message);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCompanyAdmin) {
      void loadProfile();
    } else {
      setLoading(false);
    }
  }, [isCompanyAdmin]);

  /* =======================================================
     CHANGE
  ======================================================= */

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm(previous => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave = async () => {
    if (!isCompanyAdmin) {
      return;
    }

    if (
      !form.displayName?.trim() &&
      !form.legalName?.trim()
    ) {
      toast.error(
        'Enter at least a company display name or legal name.'
      );

      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updated =
        await updateTenantCompanyProfile({
          legalName:
            form.legalName?.trim() || null,

          displayName:
            form.displayName?.trim() || null,

          addressLine1:
            form.addressLine1?.trim() || null,

          addressLine2:
            form.addressLine2?.trim() || null,

          city:
            form.city?.trim() || null,

          state:
            form.state?.trim() || null,

          postalCode:
            form.postalCode?.trim() || null,

          country:
            form.country?.trim() || null,

          phone:
            form.phone?.trim() || null,

          email:
            form.email?.trim() || null,

          website:
            form.website?.trim() || null,

          taxRegistrationNumber:
            form.taxRegistrationNumber?.trim() ||
            null,

          companyRegistrationNumber:
            form.companyRegistrationNumber?.trim() ||
            null,

          payslipFooterText:
            form.payslipFooterText?.trim() ||
            null,
        });

      setProfile(updated);

      toast.success(
        'Company details saved successfully.'
      );

    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to save company details.';

      setError(message);

      toast.error(message);

    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     ACCESS
  ======================================================= */

  if (!isCompanyAdmin) {
    return null;
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 text-[#A78BFA] animate-spin" />
      </div>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="space-y-5">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="p-5 rounded-2xl bg-[#09071e] border border-[#2d2770]/70">

        <div className="flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-[#17123d] border border-[#2d2770] flex items-center justify-center">

              <Building2
                className="w-5 h-5 text-[#A78BFA]"
              />

            </div>

            <div>

              <h2 className="text-sm font-bold text-white">
                Company Details
              </h2>

              <p className="text-[11px] text-slate-400 mt-1">
                Manage the official company information
                used throughout your EMS.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() => void loadProfile()}
            disabled={loading || saving}
            className="p-2 rounded-lg bg-[#17123d] border border-[#2d2770] text-slate-300 hover:text-white disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loading
                  ? 'animate-spin'
                  : ''
              }`}
            />
          </button>

        </div>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-3">

          <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5" />

          <div>
            <div className="text-xs font-bold text-rose-300">
              Error
            </div>

            <div className="text-[11px] text-rose-300/80 mt-1">
              {error}
            </div>
          </div>

        </div>
      )}

      {/* =================================================
          COMPANY INFORMATION
      ================================================= */}

      <Section
        icon={
          <Building2 className="w-4 h-4" />
        }
        title="Company Information"
        description="Official company identity information."
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <FormInput
            label="Display Name"
            name="displayName"
            value={
              form.displayName ?? ''
            }
            onChange={handleChange}
            placeholder="Company display name"
            icon={
              <Building2 className="w-3.5 h-3.5" />
            }
          />

          <FormInput
            label="Legal Name"
            name="legalName"
            value={
              form.legalName ?? ''
            }
            onChange={handleChange}
            placeholder="Legal company name"
            icon={
              <FileText className="w-3.5 h-3.5" />
            }
          />

          <FormInput
            label="Company Registration Number"
            name="companyRegistrationNumber"
            value={
              form.companyRegistrationNumber ?? ''
            }
            onChange={handleChange}
            placeholder="Registration number"
            icon={
              <Hash className="w-3.5 h-3.5" />
            }
          />

          <FormInput
            label="Tax / GST Registration Number"
            name="taxRegistrationNumber"
            value={
              form.taxRegistrationNumber ?? ''
            }
            onChange={handleChange}
            placeholder="Tax / GST number"
            icon={
              <FileText className="w-3.5 h-3.5" />
            }
          />

        </div>

      </Section>

      {/* =================================================
          ADDRESS
      ================================================= */}

      <Section
        icon={
          <MapPin className="w-4 h-4" />
        }
        title="Company Address"
        description="Official registered/company address."
      >

        <div className="space-y-5">

          <FormInput
            label="Address Line 1"
            name="addressLine1"
            value={
              form.addressLine1 ?? ''
            }
            onChange={handleChange}
            placeholder="Building, street, area"
          />

          <FormInput
            label="Address Line 2"
            name="addressLine2"
            value={
              form.addressLine2 ?? ''
            }
            onChange={handleChange}
            placeholder="Apartment, landmark, additional address"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <FormInput
              label="City"
              name="city"
              value={
                form.city ?? ''
              }
              onChange={handleChange}
              placeholder="City"
            />

            <FormInput
              label="State"
              name="state"
              value={
                form.state ?? ''
              }
              onChange={handleChange}
              placeholder="State"
            />

            <FormInput
              label="Postal Code"
              name="postalCode"
              value={
                form.postalCode ?? ''
              }
              onChange={handleChange}
              placeholder="Postal / PIN"
            />

          </div>

          <FormInput
            label="Country"
            name="country"
            value={
              form.country ?? ''
            }
            onChange={handleChange}
            placeholder="Country"
          />

        </div>

      </Section>

      {/* =================================================
          CONTACT
      ================================================= */}

      <Section
        icon={
          <Phone className="w-4 h-4" />
        }
        title="Contact Information"
        description="Official company contact details."
      >

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <FormInput
            label="Phone"
            name="phone"
            value={
              form.phone ?? ''
            }
            onChange={handleChange}
            placeholder="Company phone"
            icon={
              <Phone className="w-3.5 h-3.5" />
            }
          />

          <FormInput
            label="Email"
            name="email"
            value={
              form.email ?? ''
            }
            onChange={handleChange}
            placeholder="Company email"
            type="email"
            icon={
              <Mail className="w-3.5 h-3.5" />
            }
          />

          <FormInput
            label="Website"
            name="website"
            value={
              form.website ?? ''
            }
            onChange={handleChange}
            placeholder="https://example.com"
            icon={
              <Globe className="w-3.5 h-3.5" />
            }
          />

        </div>

      </Section>

      {/* =================================================
          PAYSLIP FOOTER
      ================================================= */}

      <Section
        icon={
          <FileText className="w-4 h-4" />
        }
        title="Payslip Information"
        description="Information that can appear on generated payslips."
      >

        <div>

          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Payslip Footer Text
          </label>

          <textarea
            name="payslipFooterText"
            value={
              form.payslipFooterText ?? ''
            }
            onChange={handleChange}
            rows={4}
            placeholder="Example: This is a computer-generated salary statement."
            className="w-full px-3 py-2.5 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white text-xs outline-none focus:border-[#5C3FE0] focus:ring-1 focus:ring-[#5C3FE0]/30 placeholder:text-slate-600 resize-none"
          />

        </div>

      </Section>

      {/* =================================================
          SAVE
      ================================================= */}

      <div className="flex items-center justify-between gap-4">

        <div className="text-[10px] text-slate-500">

          {profile?.updatedAtUtc
            ? `Last updated ${new Date(
                profile.updatedAtUtc
              ).toLocaleString()}`
            : 'Company details have not been saved yet.'}

        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5C3FE0] hover:bg-[#6d50f0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors"
        >

          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}

          {saving
            ? 'Saving...'
            : 'Save Company Details'}

        </button>

      </div>

    </div>
  );
};

/* =========================================================
   SECTION
========================================================= */

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({
  icon,
  title,
  description,
  children,
}) => {
  return (
    <section className="rounded-2xl border border-[#2d2770]/70 bg-[#09071e] overflow-hidden">

      <div className="px-5 py-4 border-b border-[#231e54] bg-[#0e0b2e]">

        <div className="flex items-center gap-2">

          <span className="text-[#A78BFA]">
            {icon}
          </span>

          <div>

            <h3 className="text-xs font-bold text-white">
              {title}
            </h3>

            <p className="text-[10px] text-slate-500 mt-0.5">
              {description}
            </p>

          </div>

        </div>

      </div>

      <div className="p-5">
        {children}
      </div>

    </section>
  );
};

/* =========================================================
   INPUT
========================================================= */

interface FormInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
}) => {
  return (
    <div>

      <label
        htmlFor={name}
        className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2"
      >
        {label}
      </label>

      <div className="relative">

        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </span>
        )}

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${
            icon ? 'pl-9' : 'px-3'
          } pr-3 py-2.5 rounded-xl bg-[#0e0b2e] border border-[#2d2770] text-white text-xs outline-none focus:border-[#5C3FE0] focus:ring-1 focus:ring-[#5C3FE0]/30 placeholder:text-slate-600 transition-colors`}
        />

      </div>

    </div>
  );
};

export default CompanyDetailsView;