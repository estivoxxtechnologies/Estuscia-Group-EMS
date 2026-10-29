
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  UserRound,
  Save,
  Loader2,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  Building2,
  FileText,
  CalendarDays,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Upload,
  Download,
  ShieldCheck,
  Clock,
  XCircle,
  UserCheck,
} from 'lucide-react';

import { useApp } from '../context/AppContext';

import {
  getMyUserDetails,
  updateMyUserDetails,
  getEmployeeUserDetails,
  updateEmployeeUserDetails,
  uploadEmployeeDocument,
  downloadEmployeeDocument,
  reviewEmployeeDocument,
  type EmployeeDocument,
  type EmployeeDocumentType,
  type EmployeeUserDetailsResponse,
  type UpdateUserDetailsRequest,
} from '../api/userDetails';

// ============================================================
// PROPS
// ============================================================

interface UserDetailsViewProps {
  employeeId?: number;
}

// ============================================================
// EMPTY FORM
// ============================================================

const EMPTY_FORM: UpdateUserDetailsRequest = {
  dateOfBirth: '',
  dateOfJoining: '',
  phoneNumber: '',
  officialNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  emergencyContactName: '',
  emergencyContactNumber: '',
  bankName: '',
  accountHolderName: '',
  accountNumber: '',
  ifscCode: '',
  bankBranchName: '',
  notes: '',
};

// ============================================================
// CONSTANTS
// ============================================================

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

const DOCUMENT_TYPE_OPTIONS: {
  value: EmployeeDocumentType;
  label: string;
}[] = [
    { value: 'EducationCertificate', label: 'Education Certificate' },
    { value: 'Aadhaar', label: 'Aadhaar Card' },
    { value: 'PAN', label: 'PAN Card' },
    { value: 'BankDocument', label: 'Bank Document' },
    { value: 'PassportPhoto', label: 'Passport-size Photo' },
    { value: 'Passport', label: 'Passport' },
    { value: 'Other', label: 'Other Document' },
  ];

// ============================================================
// INPUT FIELD
// ============================================================

interface InputFieldProps {
  label: string;
  name: keyof UpdateUserDetailsRequest;
  placeholder?: string;
  icon?: React.ReactNode;
  type?: string;
  form: UpdateUserDetailsRequest;
  disabled?: boolean;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  placeholder,
  icon,
  type = 'text',
  form,
  disabled = false,
  onChange,
}) => (
  <div>
    <label
      htmlFor={name}
      className="mb-2 block text-sm font-medium text-slate-300"
    >
      {label}
    </label>

    <div className="relative">
      {icon && (
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          {icon}
        </div>
      )}

      <input
        id={name}
        type={type}
        name={name}
        value={form[name] ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-lg border border-white/10 bg-[#0e0b2e] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#5C3FE0]/60 disabled:cursor-not-allowed disabled:opacity-60 ${icon ? 'pl-10' : ''
          }`}
      />
    </div>
  </div>
);

// ============================================================
// SECTION HEADER
// ============================================================

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  description,
}) => (
  <div className="mb-6 flex items-center gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5C3FE0]/15 text-[#A78BFA]">
      {icon}
    </div>

    <div>
      <h2 className="font-semibold text-white">{title}</h2>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

const UserDetailsView: React.FC<UserDetailsViewProps> = ({
  employeeId,
}) => {
  const { currentUser } = useApp();

  const [profile, setProfile] =
    useState<EmployeeUserDetailsResponse | null>(null);

  const [form, setForm] =
    useState<UpdateUserDetailsRequest>({ ...EMPTY_FORM });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [downloadingId, setDownloadingId] =
    useState<number | null>(null);

  const [reviewingId, setReviewingId] =
    useState<number | null>(null);

  const [documentType, setDocumentType] =
    useState<EmployeeDocumentType>('EducationCertificate');

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const role = (
    currentUser?.roleName ??
    currentUser?.role ??
    ''
  ).trim().toLowerCase();

  // These roles can view permitted information but cannot modify records.
  // Keep this UI restriction in sync with backend authorization policies.
  const isReadOnlyRole = [
    'developer',
    'sales_staff',
    'support_staff',
    'knowledge_trainer',
  ].includes(role);

  const isManagement = [
    'super_admin',
    'company_admin',
    'hr_ops',
    'branch_manager',
  ].includes(role);

  const isViewingEmployee = employeeId != null;

  const targetUserId = employeeId ?? profile?.employee.id;

  // Users may edit their own profile unless their role is read-only.
  // Management may edit another employee's profile unless read-only.
  const canManageEmployee =
    !isReadOnlyRole && (!isViewingEmployee || isManagement);

  const canUploadDocuments = canManageEmployee;
  const canReviewDocuments = isManagement && !isReadOnlyRole;

  // ----------------------------------------------------------
  // LOAD PROFILE
  // ----------------------------------------------------------

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data =
        isViewingEmployee && employeeId != null
          ? await getEmployeeUserDetails(employeeId)
          : await getMyUserDetails();

      setProfile(data);

      const details = data.details;

      setForm({
        dateOfBirth: details?.dateOfBirth?.slice(0, 10) ?? '',
        dateOfJoining: details?.dateOfJoining?.slice(0, 10) ?? '',

        phoneNumber: details?.phoneNumber ?? '',
        officialNumber: details?.officialNumber ?? '',

        addressLine1: details?.addressLine1 ?? '',
        addressLine2: details?.addressLine2 ?? '',
        city: details?.city ?? '',
        state: details?.state ?? '',
        postalCode: details?.postalCode ?? '',
        country: details?.country ?? '',

        emergencyContactName:
          details?.emergencyContactName ?? '',

        emergencyContactNumber:
          details?.emergencyContactNumber ?? '',

        bankName: details?.bankName ?? '',
        accountHolderName: details?.accountHolderName ?? '',

        // Plain-text account number returned by the API.
        // Keep it as a string to preserve leading zeros.
        accountNumber: details?.accountNumber ?? '',

        ifscCode: details?.ifscCode ?? '',
        bankBranchName: details?.bankBranchName ?? '',

        notes: details?.notes ?? '',
      });
    } catch (err) {
      console.error('Failed to load employee details:', err);

      setError(
        'Unable to load employee details. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [employeeId, isViewingEmployee]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  // ----------------------------------------------------------
  // INPUT HANDLER
  // ----------------------------------------------------------

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ----------------------------------------------------------
  // SAVE PROFILE
  // ----------------------------------------------------------

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      if (!canManageEmployee) {
        setError('Your role has read-only access to employee details.');
        return;
      }

      if (
        form.dateOfBirth &&
        form.dateOfJoining &&
        form.dateOfJoining < form.dateOfBirth
      ) {
        setError(
          'Date of joining cannot be earlier than date of birth.',
        );
        return;
      }

      const accountNumber = form.accountNumber?.trim() ?? '';

      // Validate only when a number is supplied.
      // Preserve leading zeros by treating the number as a string.
      if (
        accountNumber &&
        !/^[a-zA-Z0-9]{4,34}$/.test(accountNumber)
      ) {
        setError(
          'Enter a valid account number using 4–34 letters or digits.',
        );
        return;
      }

      const request: UpdateUserDetailsRequest = {
        ...form,
        dateOfBirth: form.dateOfBirth || null,
        dateOfJoining: form.dateOfJoining || null,

        // Empty means preserve the existing number on the backend.
        accountNumber: accountNumber || null,
      };

      if (isViewingEmployee && employeeId != null) {
        await updateEmployeeUserDetails(employeeId, request);
      } else {
        await updateMyUserDetails(request);
      }

      await loadProfile();

      setMessage('Employee details saved successfully.');
    } catch (err) {
      console.error('Failed to save employee details:', err);

      setError(
        'Unable to save employee details. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------------
  // DOCUMENT FILE SELECTION
  // ----------------------------------------------------------

  const handleFileSelection = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;

    // Allow the same file to be selected again.
    event.target.value = '';

    setError(null);
    setMessage(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      setSelectedFile(null);

      setError(
        'Invalid file format. Upload a PDF, JPG, JPEG or PNG file.',
      );

      return;
    }

    if (file.size > MAX_DOCUMENT_SIZE) {
      setSelectedFile(null);

      setError('Document size cannot exceed 10 MB.');

      return;
    }

    setSelectedFile(file);
  };

  // ----------------------------------------------------------
  // UPLOAD DOCUMENT
  // ----------------------------------------------------------

  const handleUploadDocument = async () => {
    if (!canUploadDocuments) {
      setError('Your role has read-only access and cannot upload documents.');
      return;
    }

    if (targetUserId == null) {
      setError('Employee information is not available.');
      return;
    }

    if (!selectedFile) {
      setError('Please select a document first.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setMessage(null);

      await uploadEmployeeDocument(
        targetUserId,
        selectedFile,
        documentType,
      );

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      await loadProfile();

      setMessage(
        'Document uploaded successfully and is pending review.',
      );
    } catch (err) {
      console.error('Failed to upload employee document:', err);

      setError(
        'Unable to upload document. Please try again.',
      );
    } finally {
      setUploading(false);
    }
  };

  // ----------------------------------------------------------
  // DOWNLOAD DOCUMENT
  // ----------------------------------------------------------

  const handleDownloadDocument = async (
    document: EmployeeDocument,
  ) => {
    try {
      setDownloadingId(document.id);
      setError(null);
      setMessage(null);

      const blob = await downloadEmployeeDocument(document.id);

      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement('a');

      link.href = objectUrl;
      link.download =
        document.originalFileName || 'employee-document';

      window.document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1000);
    } catch (err) {
      console.error('Failed to download document:', err);

      setError(
        'Unable to download document. Please try again.',
      );
    } finally {
      setDownloadingId(null);
    }
  };

  // ----------------------------------------------------------
  // REVIEW DOCUMENT
  // ----------------------------------------------------------

  const handleReviewDocument = async (
    document: EmployeeDocument,
    status: 'Verified' | 'Rejected',
  ) => {
    if (!canReviewDocuments) {
      setError('You are not authorized to review documents.');
      return;
    }

    let rejectionReason: string | null = null;

    if (status === 'Rejected') {
      rejectionReason = window.prompt(
        'Enter the reason for rejecting this document:',
      );

      if (!rejectionReason?.trim()) {
        return;
      }

      rejectionReason = rejectionReason.trim();
    }

    try {
      setReviewingId(document.id);
      setError(null);
      setMessage(null);

      await reviewEmployeeDocument(document.id, {
        verificationStatus: status,
        rejectionReason,
      });

      await loadProfile();

      setMessage(
        status === 'Verified'
          ? 'Document verified successfully.'
          : 'Document rejected successfully.',
      );
    } catch (err) {
      console.error('Failed to review document:', err);

      setError(
        'Unable to review document. Please try again.',
      );
    } finally {
      setReviewingId(null);
    }
  };

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 size={22} className="animate-spin" />
          <span>Loading employee details...</span>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // ERROR / EMPTY STATE
  // ----------------------------------------------------------

  if (!profile) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle size={22} />

          <div>
            <div className="font-semibold">
              Unable to Load Profile
            </div>

            <div className="mt-1 text-sm text-slate-400">
              {error ??
                'Employee information is unavailable.'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadProfile()}
          className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
        >
          <RefreshCw size={15} />
          Try Again
        </button>
      </div>
    );
  }

  const employee = profile.employee;
  const documents = profile.documents ?? [];

  const savedAccountNumber =
    profile.details?.accountNumber ?? null;

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5C3FE0]/15 text-[#A78BFA]">
            <UserRound size={22} />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-white">
              Employee Details
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              View employee information, bank details and supporting documents.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadProfile()}
          disabled={loading || saving || uploading}
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* MESSAGES */}

      {/* ACCESS PERMISSION NOTICE */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <ShieldCheck
          size={20}
          className="mt-0.5 shrink-0 text-amber-400"
        />

        <div>
          <p className="text-sm font-semibold text-amber-300">
            Company Authorisation Required
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Only authorised Company Admin users can add or edit
            employee details and documents. Other roles have
            read-only access and cannot make changes.
          </p>
        </div>
      </div>

      {/* MESSAGES */}

      {message && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* EMPLOYEE SUMMARY */}

      <section className="rounded-2xl border border-white/10 bg-[#0e0b2e] p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#5C3FE0]/15 text-[#A78BFA]">
            <UserRound size={30} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-white">
              {employee.fullName}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {employee.designation || 'Designation not specified'}
              {employee.department
                ? ` · ${employee.department}`
                : ''}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {employee.employeeCode && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  ID: {employee.employeeCode}
                </span>
              )}

              <span className="rounded-full border border-[#5C3FE0]/20 bg-[#5C3FE0]/10 px-3 py-1 text-xs text-[#C4B5FD]">
                {isViewingEmployee
                  ? 'Employee Profile'
                  : 'My Profile'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* PERSONAL INFORMATION */}

      <section className="rounded-2xl border border-white/10 bg-[#0e0b2e] p-6">
        <SectionHeader
          icon={<UserRound size={20} />}
          title="Personal Information"
          description="Employee identity and joining details."
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <InputField
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            form={form}
            onChange={handleChange}
            disabled={!canManageEmployee}
          />

          <InputField
            label="Date of Joining"
            name="dateOfJoining"
            type="date"
            form={form}
            onChange={handleChange}
            disabled={!canManageEmployee}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Employee Name
            </label>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
              {employee.fullName}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Official Email
            </label>

            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
              <Mail size={16} className="shrink-0 text-slate-500" />
              <span className="break-all">
                {employee.email || 'Not provided'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT INFORMATION */}

      <section className="rounded-2xl border border-white/10 bg-[#0e0b2e] p-6">
        <SectionHeader
          icon={<Phone size={20} />}
          title="Contact Information"
          description="Personal phone number and official contact details."
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <InputField
            label="Personal Phone Number"
            name="phoneNumber"
            placeholder="+91 XXXXX XXXXX"
            icon={<Phone size={16} />}
            form={form}
            onChange={handleChange}
            disabled={!canManageEmployee}
          />

          <InputField
            label="Official Contact Number"
            name="officialNumber"
            placeholder="Official phone number"
            icon={<Phone size={16} />}
            form={form}
            onChange={handleChange}
            disabled={!canManageEmployee}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <InputField
            label="Emergency Contact Name"
            name="emergencyContactName"
            placeholder="Emergency contact person's name"
            form={form}
            onChange={handleChange}
            disabled={!canManageEmployee}
          />

          <InputField
            label="Emergency Contact Number"
            name="emergencyContactNumber"
            placeholder="Emergency contact phone number"
            icon={<Phone size={16} />}
            form={form}
            onChange={handleChange}
            disabled={!canManageEmployee}
          />
        </div>
      </section>

      {/* ADDRESS */}

      <section className="rounded-2xl border border-white/10 bg-[#0e0b2e] p-6">
        <SectionHeader
          icon={<MapPin size={20} />}
          title="Residential Address"
          description="Employee's current residential address."
        />

        <div className="space-y-5">
          <InputField
            label="Address Line 1"
            name="addressLine1"
            placeholder="House number, street, area"
            form={form}
            onChange={handleChange}
            disabled={!canManageEmployee}
          />

          <InputField
            label="Address Line 2"
            name="addressLine2"
            placeholder="Landmark or additional address"
            form={form}
            onChange={handleChange}
            disabled={!canManageEmployee}
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            <InputField
              label="City"
              name="city"
              placeholder="City"
              form={form}
              onChange={handleChange}
              disabled={!canManageEmployee}
            />

            <InputField
              label="State"
              name="state"
              placeholder="State"
              form={form}
              onChange={handleChange}
              disabled={!canManageEmployee}
            />

            <InputField
              label="Postal Code"
              name="postalCode"
              placeholder="Postal code"
              form={form}
              onChange={handleChange}
              disabled={!canManageEmployee}
            />

            <InputField
              label="Country"
              name="country"
              placeholder="Country"
              form={form}
              onChange={handleChange}
              disabled={!canManageEmployee}
            />
          </div>
        </div>
      </section>

      {/* BANK DETAILS */}

      <section className="rounded-2xl border border-white/10 bg-[#0e0b2e] p-6">
        <SectionHeader
          icon={<CreditCard size={20} />}
          title="Bank Details"
          description="Bank information for authorized payroll processing."
        />

        {savedAccountNumber && (
          <div className="mb-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <p className="text-xs text-slate-400">
              Currently saved account number
            </p>

            <p className="mt-1 break-all font-mono text-sm text-emerald-300">
              {savedAccountNumber}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <InputField
            label="Bank Name"
            name="bankName"
            placeholder="Enter bank name"
            icon={<Building2 size={16} />}
            form={form}
            onChange={handleChange}
            disabled={!canManageEmployee}
          />

          <InputField
            label="Account Holder Name"
            name="accountHolderName"
            placeholder="Name registered with the bank"
            form={form}
            onChange={handleChange}
            disabled={!canManageEmployee}
          />

          <div>
            <label
              htmlFor="accountNumber"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Bank Account Number
            </label>

            <input
              id="accountNumber"
              name="accountNumber"
              type="text"
              autoComplete="off"
              inputMode="text"
              maxLength={34}
              value={form.accountNumber ?? ''}
              onChange={handleChange}
              disabled={!canManageEmployee}
              placeholder="Enter bank account number"
              className="w-full rounded-lg border border-white/10 bg-[#0e0b2e] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#5C3FE0]/60 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <p className="mt-1.5 text-xs text-slate-500">
              Use 4–34 letters or digits. Leading zeros are preserved.
              Keep the existing value to retain the saved number.
            </p>
          </div>

          <InputField
            label="IFSC Code"
            name="ifscCode"
            placeholder="Enter IFSC code"
            form={form}
            onChange={handleChange}
            disabled={!canManageEmployee}
          />

          <InputField
            label="Bank Branch"
            name="bankBranchName"
            placeholder="Bank branch name"
            form={form}
            onChange={handleChange}
            disabled={!canManageEmployee}
          />
        </div>
      </section>

      {/* ADDITIONAL NOTES */}

      <section className="rounded-2xl border border-white/10 bg-[#0e0b2e] p-6">
        <SectionHeader
          icon={<FileText size={20} />}
          title="Additional Notes"
          description="Other relevant employee information."
        />

        <textarea
          name="notes"
          value={form.notes ?? ''}
          onChange={handleChange}
          disabled={!canManageEmployee}
          rows={4}
          placeholder="Enter any additional information..."
          className="w-full resize-y rounded-lg border border-white/10 bg-[#0e0b2e] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#5C3FE0]/60 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </section>

      {/* SAVE PROFILE */}

      {canManageEmployee && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || uploading || !canManageEmployee}
            className="flex items-center gap-2 rounded-lg bg-[#5C3FE0] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#5C3FE0]/20 transition hover:bg-[#6d4ff0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}

            {saving ? 'Saving...' : 'Save Employee Details'}
          </button>
        </div>
      )}

      {/* DOCUMENT UPLOAD */}

      <section className="rounded-2xl border border-white/10 bg-[#0e0b2e] p-6">
        <SectionHeader
          icon={<Upload size={20} />}
          title="Employee Documents"
          description="Upload certificates, identity documents, bank documents and photographs."
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <label
              htmlFor="documentType"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Document Type
            </label>

            <select
              id="documentType"
              value={documentType}
              onChange={(event) =>
                setDocumentType(
                  event.target.value as EmployeeDocumentType,
                )
              }
              disabled={!canUploadDocuments}
              className="w-full rounded-lg border border-white/10 bg-[#0e0b2e] px-4 py-3 text-sm text-white outline-none focus:border-[#5C3FE0]/60"
            >
              {DOCUMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="employeeDocument"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Select Document
            </label>

            <input
              ref={fileInputRef}
              id="employeeDocument"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={handleFileSelection}
              disabled={!canUploadDocuments}
              className="block w-full disabled:cursor-not-allowed disabled:opacity-50 rounded-lg border border-white/10 bg-[#0e0b2e] p-2.5 text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-[#5C3FE0]/20 file:px-3 file:py-2 file:text-xs file:font-medium file:text-[#C4B5FD] hover:file:bg-[#5C3FE0]/30"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            PDF, JPG, JPEG or PNG. Maximum file size: 10 MB.
          </p>

          <button
            type="button"
            onClick={() => void handleUploadDocument()}
            disabled={
              uploading ||
              !canUploadDocuments ||
              !selectedFile ||
              targetUserId == null
            }
            className="flex items-center justify-center gap-2 rounded-lg bg-[#5C3FE0] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#6d4ff0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}

            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>

        {selectedFile && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-[#5C3FE0]/20 bg-[#5C3FE0]/5 p-3">
            <FileText
              size={20}
              className="shrink-0 text-[#A78BFA]"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">
                {selectedFile.name}
              </p>

              <p className="text-xs text-slate-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);

                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
              aria-label="Remove selected file"
            >
              <XCircle size={18} />
            </button>
          </div>
        )}
      </section>

      {/* DOCUMENT LIST */}

      <section className="rounded-2xl border border-white/10 bg-[#0e0b2e] p-6">
        <SectionHeader
          icon={<FileText size={20} />}
          title="Uploaded Documents"
          description="Track document status and review employee submissions."
        />

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-4 py-12 text-center">
            <FileText size={30} className="text-slate-600" />

            <p className="mt-3 text-sm font-medium text-slate-300">
              No documents uploaded
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Uploaded employee documents will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => {
              const status =
                document.verificationStatus.toLowerCase();

              const verified = status === 'verified';
              const rejected = status === 'rejected';

              return (
                <div
                  key={document.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5C3FE0]/10 text-[#A78BFA]">
                        <FileText size={20} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-medium text-white">
                          {document.originalFileName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {DOCUMENT_TYPE_OPTIONS.find(
                            (item) =>
                              item.value === document.documentType,
                          )?.label ?? document.documentType}
                          {' · '}
                          {(
                            document.fileSizeBytes /
                            1024 /
                            1024
                          ).toFixed(2)}{' '}
                          MB
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <CalendarDays size={13} />

                          Uploaded{' '}
                          {document.uploadedAtUtc
                            ? new Date(
                              document.uploadedAtUtc,
                            ).toLocaleDateString()
                            : 'date unavailable'}
                        </p>

                        {rejected && document.rejectionReason && (
                          <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300">
                            <strong>Rejection reason:</strong>{' '}
                            {document.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${verified
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                            : rejected
                              ? 'border-red-500/20 bg-red-500/10 text-red-300'
                              : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                          }`}
                      >
                        {verified ? (
                          <ShieldCheck size={14} />
                        ) : rejected ? (
                          <XCircle size={14} />
                        ) : (
                          <Clock size={14} />
                        )}

                        {document.verificationStatus}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          void handleDownloadDocument(document)
                        }
                        disabled={downloadingId === document.id}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
                      >
                        {downloadingId === document.id ? (
                          <Loader2
                            size={14}
                            className="animate-spin"
                          />
                        ) : (
                          <Download size={14} />
                        )}

                        Download
                      </button>

                      {canReviewDocuments && !verified && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              void handleReviewDocument(
                                document,
                                'Verified',
                              )
                            }
                            disabled={
                              reviewingId === document.id
                            }
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/15 disabled:opacity-50"
                          >
                            {reviewingId === document.id ? (
                              <Loader2
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <UserCheck size={14} />
                            )}

                            Verify
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleReviewDocument(
                                document,
                                'Rejected',
                              )
                            }
                            disabled={
                              reviewingId === document.id
                            }
                            className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default UserDetailsView;
