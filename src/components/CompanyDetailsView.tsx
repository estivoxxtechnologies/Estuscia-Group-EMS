import React, {
  ChangeEvent,
  useEffect,
  useRef,
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
  Image as ImageIcon,
  Upload,
  Trash2,
} from 'lucide-react';

import { useApp } from '../context/AppContext';

import {
  getTenantCompanyProfile,
  updateTenantCompanyProfile,
  uploadTenantCompanyLogo,
  deleteTenantCompanyLogo,
} from '../api/tenantCompanyProfile';

import {
  TenantCompanyProfile,
  UpdateTenantCompanyProfileRequest,
} from '../types/tenantCompanyProfile';


// ============================================================
// EMPTY FORM
// ============================================================

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


// ============================================================
// CONSTANTS
// ============================================================

const MAX_LOGO_SIZE = 2 * 1024 * 1024;

const ALLOWED_LOGO_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
];


// ============================================================
// INPUT COMPONENT
// IMPORTANT:
// This component MUST remain outside CompanyDetailsView.
// Otherwise React recreates it on every form update and
// the input loses focus after every typed character.
// ============================================================

interface InputFieldProps {
  label: string;
  name: keyof UpdateTenantCompanyProfileRequest;
  placeholder?: string;
  icon?: React.ReactNode;
  type?: string;

  form: UpdateTenantCompanyProfileRequest;

  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  placeholder,
  icon,
  type = 'text',
  form,
  onChange,
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </div>
        )}

        <input
          type={type}
          name={name}
          value={form[name] ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-white/10 bg-[#0e0b2e] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#5C3FE0]/60 ${
            icon ? 'pl-10' : ''
          }`}
        />
      </div>
    </div>
  );
};


// ============================================================
// COMPONENT
// ============================================================

const CompanyDetailsView: React.FC = () => {
  const { currentUser } = useApp();

  const [profile, setProfile] =
    useState<TenantCompanyProfile | null>(null);

  const [form, setForm] =
    useState<UpdateTenantCompanyProfileRequest>(
      EMPTY_FORM
    );

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [uploadingLogo, setUploadingLogo] =
    useState(false);

  const [removingLogo, setRemovingLogo] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const logoInputRef =
    useRef<HTMLInputElement | null>(null);


  // ============================================================
  // ACCESS CHECK
  // ============================================================

  const isCompanyAdmin =
    currentUser?.roleName?.toLowerCase() ===
    'company_admin';


  // ============================================================
  // LOAD PROFILE
  // ============================================================

  const loadProfile = async () => {
    if (!isCompanyAdmin) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data =
        await getTenantCompanyProfile();

      setProfile(data);

      setForm({
        legalName: data.legalName ?? '',
        displayName: data.displayName ?? '',

        addressLine1: data.addressLine1 ?? '',
        addressLine2: data.addressLine2 ?? '',
        city: data.city ?? '',
        state: data.state ?? '',
        postalCode: data.postalCode ?? '',
        country: data.country ?? '',

        phone: data.phone ?? '',
        email: data.email ?? '',
        website: data.website ?? '',

        taxRegistrationNumber:
          data.taxRegistrationNumber ?? '',

        companyRegistrationNumber:
          data.companyRegistrationNumber ?? '',

        payslipFooterText:
          data.payslipFooterText ?? '',
      });
    } catch (err) {
      console.error(
        'Failed to load company profile:',
        err
      );

      setError(
        'Unable to load company details.'
      );
    } finally {
      setLoading(false);
    }
  };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadProfile();
  }, [isCompanyAdmin]);


  // ============================================================
  // INPUT HANDLER
  // ============================================================

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  // ============================================================
  // SAVE COMPANY DETAILS
  // ============================================================

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const updated =
        await updateTenantCompanyProfile(form);

      setProfile(updated);

      setForm({
        legalName: updated.legalName ?? '',
        displayName: updated.displayName ?? '',

        addressLine1: updated.addressLine1 ?? '',
        addressLine2: updated.addressLine2 ?? '',
        city: updated.city ?? '',
        state: updated.state ?? '',
        postalCode: updated.postalCode ?? '',
        country: updated.country ?? '',

        phone: updated.phone ?? '',
        email: updated.email ?? '',
        website: updated.website ?? '',

        taxRegistrationNumber:
          updated.taxRegistrationNumber ?? '',

        companyRegistrationNumber:
          updated.companyRegistrationNumber ?? '',

        payslipFooterText:
          updated.payslipFooterText ?? '',
      });

      setMessage(
        'Company details saved successfully.'
      );
    } catch (err) {
      console.error(
        'Failed to save company profile:',
        err
      );

      setError(
        'Unable to save company details.'
      );
    } finally {
      setSaving(false);
    }
  };


  // ============================================================
  // LOGO UPLOAD
  // ============================================================

  const handleLogoUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    // Reset input so selecting the same file again works.
    event.target.value = '';

    if (!file) {
      return;
    }

    setError(null);
    setMessage(null);

    // ----------------------------------------------------------
    // Validate file type
    // ----------------------------------------------------------

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setError(
        'Invalid logo format. Please upload PNG, JPG, JPEG or WEBP.'
      );

      return;
    }

    // ----------------------------------------------------------
    // Validate file size
    // ----------------------------------------------------------

    if (file.size > MAX_LOGO_SIZE) {
      setError(
        'Logo size cannot exceed 2 MB.'
      );

      return;
    }

    try {
      setUploadingLogo(true);

      const updated =
        await uploadTenantCompanyLogo(file);

      setProfile(updated);

      setMessage(
        'Company logo uploaded successfully.'
      );
    } catch (err) {
      console.error(
        'Failed to upload company logo:',
        err
      );

      setError(
        'Unable to upload company logo.'
      );
    } finally {
      setUploadingLogo(false);
    }
  };


  // ============================================================
  // REMOVE LOGO
  // ============================================================

  const handleRemoveLogo = async () => {
    if (!profile?.logoUrl) {
      return;
    }

    const confirmed =
      window.confirm(
        'Are you sure you want to remove the company logo?'
      );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingLogo(true);
      setError(null);
      setMessage(null);

      const updated =
        await deleteTenantCompanyLogo();

      setProfile(updated);

      setMessage(
        'Company logo removed successfully.'
      );
    } catch (err) {
      console.error(
        'Failed to remove company logo:',
        err
      );

      setError(
        'Unable to remove company logo.'
      );
    } finally {
      setRemovingLogo(false);
    }
  };


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2
            size={22}
            className="animate-spin"
          />

          <span>
            Loading company details...
          </span>
        </div>
      </div>
    );
  }


  // ============================================================
  // ACCESS DENIED
  // ============================================================

  if (!isCompanyAdmin) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle size={22} />

          <div>
            <div className="font-semibold">
              Access Restricted
            </div>

            <div className="mt-1 text-sm text-slate-400">
              Only Company Admin can manage company
              details.
            </div>
          </div>
        </div>
      </div>
    );
  }


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6 pb-10">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

        <div>
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5C3FE0]/15 text-[#A78BFA]">
              <Building2 size={22} />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-white">
                Company Details
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Manage company information used across
                the EMS and employee payslips.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={loadProfile}
          disabled={loading || saving}
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={16} />

          Refresh
        </button>

      </div>


      {/* ======================================================
          SUCCESS MESSAGE
      ======================================================= */}

      {message && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">

          <CheckCircle2 size={18} />

          <span>{message}</span>

        </div>
      )}


      {/* ======================================================
          ERROR MESSAGE
      ======================================================= */}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">

          <AlertCircle size={18} />

          <span>{error}</span>

        </div>
      )}


      {/* ======================================================
          COMPANY INFORMATION
      ======================================================= */}

      <section className="rounded-2xl border border-white/10 bg-[#0e0b2e] p-6">

        <div className="mb-6 flex items-center gap-3">

          <Building2
            size={20}
            className="text-[#A78BFA]"
          />

          <div>
            <h2 className="font-semibold text-white">
              Company Information
            </h2>

            <p className="text-xs text-slate-500">
              Basic legal and display information.
            </p>
          </div>

        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <InputField
            label="Legal Name"
            name="legalName"
            placeholder="Enter legal company name"
            form={form}
            onChange={handleChange}
          />

          <InputField
            label="Display Name"
            name="displayName"
            placeholder="Enter company display name"
            form={form}
            onChange={handleChange}
          />

        </div>

      </section>


      {/* ======================================================
          COMPANY LOGO
      ======================================================= */}

      <section className="rounded-2xl border border-white/10 bg-[#0e0b2e] p-6">

        <div className="mb-6 flex items-center gap-3">

          <ImageIcon
            size={20}
            className="text-[#A78BFA]"
          />

          <div>
            <h2 className="font-semibold text-white">
              Company Logo
            </h2>

            <p className="text-xs text-slate-500">
              This logo will appear on employee payslips.
            </p>
          </div>

        </div>


        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">

          {/* --------------------------------------------------
              LOGO PREVIEW
          --------------------------------------------------- */}

          <div className="flex h-[120px] w-[220px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white p-3">

            {profile?.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt={
                  profile.displayName ||
                  profile.legalName ||
                  'Company Logo'
                }
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400">

                <ImageIcon size={30} />

                <span className="mt-2 text-xs">
                  No logo uploaded
                </span>

              </div>
            )}

          </div>


          {/* --------------------------------------------------
              LOGO ACTIONS
          --------------------------------------------------- */}

          <div className="space-y-3">

            <div className="flex flex-wrap gap-3">

              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() =>
                  logoInputRef.current?.click()
                }
                disabled={
                  uploadingLogo ||
                  removingLogo
                }
                className="flex items-center gap-2 rounded-lg bg-[#5C3FE0] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#6d4ff0] disabled:cursor-not-allowed disabled:opacity-50"
              >

                {uploadingLogo ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Upload size={16} />
                )}

                {uploadingLogo
                  ? 'Uploading...'
                  : profile?.logoUrl
                    ? 'Replace Logo'
                    : 'Upload Logo'}

              </button>


              {profile?.logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={
                    uploadingLogo ||
                    removingLogo
                  }
                  className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {removingLogo ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={16} />
                  )}

                  {removingLogo
                    ? 'Removing...'
                    : 'Remove Logo'}

                </button>
              )}

            </div>


            <div className="text-xs leading-5 text-slate-500">

              <div>
                Maximum size: 2 MB
              </div>

              <div>
                Supported formats: PNG, JPG, JPEG, WEBP
              </div>

              <div>
                The logo will automatically be fitted
                without distortion on payslips.
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ======================================================
          COMPANY ADDRESS
      ======================================================= */}

      <section className="rounded-2xl border border-white/10 bg-[#0e0b2e] p-6">

        <div className="mb-6 flex items-center gap-3">

          <MapPin
            size={20}
            className="text-[#A78BFA]"
          />

          <div>
            <h2 className="font-semibold text-white">
              Company Address
            </h2>

            <p className="text-xs text-slate-500">
              Registered and mailing address.
            </p>
          </div>

        </div>

        <div className="space-y-5">

          <InputField
            label="Address Line 1"
            name="addressLine1"
            placeholder="Building / street / area"
            form={form}
            onChange={handleChange}
          />

          <InputField
            label="Address Line 2"
            name="addressLine2"
            placeholder="Apartment / landmark / additional address"
            form={form}
            onChange={handleChange}
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

            <InputField
              label="City"
              name="city"
              placeholder="City"
              form={form}
              onChange={handleChange}
            />

            <InputField
              label="State"
              name="state"
              placeholder="State"
              form={form}
              onChange={handleChange}
            />

            <InputField
              label="Postal Code"
              name="postalCode"
              placeholder="Postal code"
              form={form}
              onChange={handleChange}
            />

            <InputField
              label="Country"
              name="country"
              placeholder="Country"
              form={form}
              onChange={handleChange}
            />

          </div>

        </div>

      </section>


      {/* ======================================================
          CONTACT INFORMATION
      ======================================================= */}

      <section className="rounded-2xl border border-white/10 bg-[#0e0b2e] p-6">

        <div className="mb-6 flex items-center gap-3">

          <Phone
            size={20}
            className="text-[#A78BFA]"
          />

          <div>
            <h2 className="font-semibold text-white">
              Contact Information
            </h2>

            <p className="text-xs text-slate-500">
              Company contact and online information.
            </p>
          </div>

        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <InputField
            label="Phone"
            name="phone"
            placeholder="+91 XXXXX XXXXX"
            icon={<Phone size={16} />}
            form={form}
            onChange={handleChange}
          />

          <InputField
            label="Email"
            name="email"
            placeholder="company@example.com"
            type="email"
            icon={<Mail size={16} />}
            form={form}
            onChange={handleChange}
          />

          <InputField
            label="Website"
            name="website"
            placeholder="https://example.com"
            icon={<Globe size={16} />}
            form={form}
            onChange={handleChange}
          />

        </div>

      </section>


      {/* ======================================================
          REGISTRATION INFORMATION
      ======================================================= */}

      <section className="rounded-2xl border border-white/10 bg-[#0e0b2e] p-6">

        <div className="mb-6 flex items-center gap-3">

          <Hash
            size={20}
            className="text-[#A78BFA]"
          />

          <div>
            <h2 className="font-semibold text-white">
              Registration Information
            </h2>

            <p className="text-xs text-slate-500">
              Tax and company registration details.
            </p>
          </div>

        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <InputField
            label="Tax Registration Number"
            name="taxRegistrationNumber"
            placeholder="GST / VAT / Tax registration number"
            form={form}
            onChange={handleChange}
          />

          <InputField
            label="Company Registration Number"
            name="companyRegistrationNumber"
            placeholder="Company registration number"
            form={form}
            onChange={handleChange}
          />

        </div>

      </section>


      {/* ======================================================
          PAYSLIP INFORMATION
      ======================================================= */}

      <section className="rounded-2xl border border-white/10 bg-[#0e0b2e] p-6">

        <div className="mb-6 flex items-center gap-3">

          <FileText
            size={20}
            className="text-[#A78BFA]"
          />

          <div>
            <h2 className="font-semibold text-white">
              Payslip Information
            </h2>

            <p className="text-xs text-slate-500">
              Information displayed on employee payslips.
            </p>
          </div>

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-300">
            Payslip Footer Text
          </label>

          <textarea
            name="payslipFooterText"
            value={
              form.payslipFooterText ?? ''
            }
            onChange={handleChange}
            rows={4}
            placeholder="Example: This is a computer-generated payslip and does not require a signature."
            className="w-full resize-none rounded-lg border border-white/10 bg-[#0e0b2e] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#5C3FE0]/60"
          />

        </div>

      </section>


      {/* ======================================================
          SAVE
      ======================================================= */}

      <div className="flex justify-end">

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#5C3FE0] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#5C3FE0]/20 transition hover:bg-[#6d4ff0] disabled:cursor-not-allowed disabled:opacity-50"
        >

          {saving ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <Save size={18} />
          )}

          {saving
            ? 'Saving...'
            : 'Save Company Details'}

        </button>

      </div>

    </div>
  );
};

export default CompanyDetailsView;