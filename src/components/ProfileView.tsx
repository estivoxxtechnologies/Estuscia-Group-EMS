import React, {
    ChangeEvent,
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    ArrowLeft,
    Camera,
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    Lock,
    Mail,
    Save,
    ShieldCheck,
    User,
    UserCircle,
} from 'lucide-react';

import { toast } from 'react-toastify';

import {
    changeMyPassword,
    getMyProfile,
    MyProfile,
    updateMyProfile,
    uploadMyAvatar,
} from '../api/profile';

import { useApp } from '../context/AppContext';

type ProfileTab = 'profile' | 'password';

export const ProfileView: React.FC = () => {
    const {
        currentUser,
        setActiveTab,
    } = useApp();

    // ============================================================
    // STATE
    // ============================================================

    const [profile, setProfile] =
        useState<MyProfile | null>(null);

    const [isLoading, setIsLoading] =
        useState(true);

    const [isSavingProfile, setIsSavingProfile] =
        useState(false);

    const [isChangingPassword, setIsChangingPassword] =
        useState(false);

    const [isUploadingAvatar, setIsUploadingAvatar] =
        useState(false);

    const [profileTab, setProfileTab] =
        useState<ProfileTab>('profile');    
    
    const [fullName, setFullName] =
        useState('');

    const [email, setEmail] =
        useState('');

    const [currentPassword, setCurrentPassword] =
        useState('');

    const [newPassword, setNewPassword] =
        useState('');

    const [confirmPassword, setConfirmPassword] =
        useState('');

    const [showCurrentPassword, setShowCurrentPassword] =
        useState(false);

    const [showNewPassword, setShowNewPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const fileInputRef =
        useRef<HTMLInputElement | null>(null);

    // ============================================================
    // LOAD PROFILE
    // ============================================================

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setIsLoading(true);

                const data = await getMyProfile();

                setProfile(data);
                setFullName(data.fullName);
                setEmail(data.email);
            } catch (error) {
                console.error(
                    'Failed to load profile:',
                    error
                );

                toast.error(
                    'Unable to load your profile.'
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, []);

    // ============================================================
    // AVATAR URL
    // ============================================================

    const getAvatarUrl = (
        avatarUrl?: string | null
    ) => {
        if (!avatarUrl) {
            return null;
        }

        if (
            avatarUrl.startsWith('http://') ||
            avatarUrl.startsWith('https://')
        ) {
            return avatarUrl;
        }

        const apiUrl =
            import.meta.env.VITE_API_URL || '';

        const apiOrigin = apiUrl.replace(
            /\/api\/?$/,
            ''
        );

        return `${apiOrigin}${avatarUrl}`;
    };

    // ============================================================
    // INITIALS
    // ============================================================

    const getInitials = (
        name?: string | null
    ) => {
        if (!name) {
            return 'U';
        }

        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) =>
                part.charAt(0).toUpperCase()
            )
            .join('');
    };

    // ============================================================
    // PROFILE SAVE
    // ============================================================

    const handleSaveProfile = async () => {
        if (!fullName.trim()) {
            toast.error('Full name is required.');
            return;
        }

        if (!email.trim()) {
            toast.error('Email is required.');
            return;
        }

        try {
            setIsSavingProfile(true);

            await updateMyProfile({
                fullName: fullName.trim(),
                email: email.trim(),
            });

            setProfile((previous) =>
                previous
                    ? {
                        ...previous,
                        fullName: fullName.trim(),
                        email: email.trim(),
                    }
                    : previous
            );

            toast.success(
                'Profile updated successfully.'
            );
        } catch (error: any) {
            console.error(
                'Failed to update profile:',
                error
            );

            const message =
                error?.response?.data?.message ||
                'Failed to update profile.';

            toast.error(message);
        } finally {
            setIsSavingProfile(false);
        }
    };

    // ============================================================
    // CHANGE PASSWORD
    // ============================================================

    const handleChangePassword = async () => {
        if (!currentPassword) {
            toast.error(
                'Please enter your current password.'
            );
            return;
        }

        if (!newPassword) {
            toast.error(
                'Please enter a new password.'
            );
            return;
        }

        if (newPassword.length < 8) {
            toast.error(
                'New password must contain at least 8 characters.'
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error(
                'Passwords do not match.'
            );
            return;
        }

        try {
            setIsChangingPassword(true);

            await changeMyPassword({
                currentPassword,
                newPassword,
                confirmPassword,
            });

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            toast.success(
                'Password changed successfully.'
            );
        } catch (error: any) {
            console.error(
                'Failed to change password:',
                error
            );

            const message =
                error?.response?.data?.message ||
                'Failed to change password.';

            toast.error(message);
        } finally {
            setIsChangingPassword(false);
        }
    };

    // ============================================================
    // AVATAR UPLOAD
    // ============================================================

    const handleAvatarChange = async (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
        ];

        if (!allowedTypes.includes(file.type)) {
            toast.error(
                'Only JPG, PNG and WEBP images are allowed.'
            );

            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error(
                'Profile image must be smaller than 5 MB.'
            );

            event.target.value = '';
            return;
        }

        try {
            setIsUploadingAvatar(true);

            const result =
                await uploadMyAvatar(file);

            setProfile((previous) =>
                previous
                    ? {
                        ...previous,
                        avatarUrl:
                            result.avatarUrl,
                    }
                    : previous
            );

            toast.success(
                'Profile photo updated successfully.'
            );
        } catch (error: any) {
            console.error(
                'Failed to upload avatar:',
                error
            );

            const message =
                error?.response?.data?.message ||
                'Failed to upload profile photo.';

            toast.error(message);
        } finally {
            setIsUploadingAvatar(false);

            event.target.value = '';
        }
    };

    // ============================================================
    // LOADING
    // ============================================================

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#A78BFA] animate-spin" />

                    <p className="text-sm text-slate-400">
                        Loading your profile...
                    </p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <UserCircle className="w-12 h-12 mx-auto text-slate-600 mb-3" />

                    <h2 className="text-lg font-semibold text-white">
                        Profile unavailable
                    </h2>

                    <p className="text-sm text-slate-400 mt-1">
                        We could not load your profile.
                    </p>
                </div>
            </div>
        );
    }

    const avatarUrl =
        getAvatarUrl(profile.avatarUrl);

    // ============================================================
    // UI
    // ============================================================

    return (
        <div className="space-y-6 pb-12">

            {/* ========================================================
          HEADER
      ======================================================== */}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                <div className="flex items-center gap-3">

                    <button
                        type="button"
                        onClick={() => setActiveTab('dashboard')}
                        className="
              p-2.5
              rounded-xl
              bg-[#09071e]
              border border-[#2d2770]/70
              text-slate-400
              hover:text-white
              hover:border-[#5C3FE0]/60
              transition
            "
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            My Profile
                        </h1>

                        <p className="text-sm text-slate-400 mt-1">
                            Manage your personal information and account security.
                        </p>
                    </div>

                </div>

            </div>

            {/* ========================================================
          PROFILE HERO
      ======================================================== */}

            <div
                className="
          rounded-2xl
          bg-[#09071e]
          border border-[#2d2770]/70
          p-6
        "
            >

                <div className="flex flex-col md:flex-row md:items-center gap-6">

                    {/* AVATAR */}

                    <div className="relative shrink-0">

                        <div
                            className="
                w-28
                h-28
                rounded-full
                overflow-hidden
                border-4
                border-[#5C3FE0]/40
                bg-[#120d31]
                flex
                items-center
                justify-center
              "
                        >
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={profile.fullName}
                                    className="
                    w-full
                    h-full
                    object-cover
                  "
                                />
                            ) : (
                                <span className="text-3xl font-bold text-[#A78BFA]">
                                    {getInitials(profile.fullName)}
                                </span>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            disabled={isUploadingAvatar}
                            className="
                absolute
                bottom-0
                right-0
                w-9
                h-9
                rounded-full
                bg-[#5C3FE0]
                border-2
                border-[#09071e]
                flex
                items-center
                justify-center
                text-white
                hover:bg-[#6d50ed]
                transition
                disabled:opacity-50
              "
                            title="Change profile photo"
                        >
                            {isUploadingAvatar ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Camera className="w-4 h-4" />
                            )}
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />

                    </div>

                    {/* USER SUMMARY */}

                    <div className="flex-1">

                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                            <div>

                                <h2 className="text-xl font-bold text-white">
                                    {profile.fullName}
                                </h2>

                                <p className="text-sm text-[#A78BFA] mt-1">
                                    {profile.designation}
                                </p>

                                <div className="flex flex-wrap items-center gap-2 mt-3">

                                    <span
                                        className="
                      inline-flex
                      items-center
                      gap-1.5
                      px-2.5
                      py-1
                      rounded-lg
                      bg-[#5C3FE0]/10
                      border border-[#5C3FE0]/30
                      text-xs
                      text-[#C4B5FD]
                    "
                                    >
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        {profile.roleName}
                                    </span>

                                    <span
                                        className="
                      inline-flex
                      items-center
                      gap-1.5
                      px-2.5
                      py-1
                      rounded-lg
                      bg-slate-800/60
                      border border-slate-700
                      text-xs
                      text-slate-300
                    "
                                    >
                                        {profile.employeeCode}
                                    </span>

                                    <span
                                        className={`
                      inline-flex
                      items-center
                      gap-1.5
                      px-2.5
                      py-1
                      rounded-lg
                      text-xs
                      ${profile.isActive
                                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                                : 'bg-red-500/10 border border-red-500/20 text-red-400'
                                            }
                    `}
                                    >
                                        <span
                                            className={`
                        w-1.5
                        h-1.5
                        rounded-full
                        ${profile.isActive
                                                    ? 'bg-emerald-400'
                                                    : 'bg-red-400'
                                                }
                      `}
                                        />

                                        {profile.isActive
                                            ? 'Active'
                                            : 'Inactive'}
                                    </span>

                                </div>

                            </div>

                            <div className="text-left md:text-right">

                                <p className="text-xs text-slate-500 uppercase tracking-wider">
                                    Organization
                                </p>

                                <p className="text-sm font-medium text-slate-200 mt-1">
                                    {profile.tenantName}
                                </p>

                                <p className="text-xs text-slate-500 mt-1">
                                    {profile.branchName || 'No branch assigned'}
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

            {/* ========================================================
          TABS
      ======================================================== */}

            <div
                className="
          flex
          gap-1
          p-1
          rounded-xl
          bg-[#09071e]
          border border-[#2d2770]/70
          w-fit
        "
            >

                <button
                    type="button"
                    onClick={() =>
                        setProfileTab('profile')
                    }
                    className={`
            flex
            items-center
            gap-2
            px-4
            py-2.5
            rounded-lg
            text-sm
            font-medium
            transition
            ${profileTab === 'profile'
                            ? 'bg-[#5C3FE0] text-white shadow-lg shadow-[#5C3FE0]/20'
                            : 'text-slate-400 hover:text-white'
                        }
          `}
                >
                    <User className="w-4 h-4" />
                    Profile
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setProfileTab('password')
                    }
                    className={`
            flex
            items-center
            gap-2
            px-4
            py-2.5
            rounded-lg
            text-sm
            font-medium
            transition
            ${profileTab  === 'password'
                            ? 'bg-[#5C3FE0] text-white shadow-lg shadow-[#5C3FE0]/20'
                            : 'text-slate-400 hover:text-white'
                        }
          `}
                >
                    <KeyRound className="w-4 h-4" />
                    Password & Security
                </button>

            </div>

            {/* ========================================================
          PROFILE TAB
      ======================================================== */}

            {profileTab  === 'profile' && (
                <div className="space-y-6">

                    {/* PERSONAL INFORMATION */}

                    <div
                        className="
              rounded-2xl
              bg-[#09071e]
              border border-[#2d2770]/70
              overflow-hidden
            "
                    >

                        <div className="px-6 py-5 border-b border-[#2d2770]/50">

                            <h3 className="text-base font-semibold text-white">
                                Personal Information
                            </h3>

                            <p className="text-xs text-slate-500 mt-1">
                                Update the personal information associated with your account.
                            </p>

                        </div>

                        <div className="p-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                {/* FULL NAME */}

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">
                                        Full Name
                                    </label>

                                    <div className="relative">

                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />

                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(event) =>
                                                setFullName(
                                                    event.target.value
                                                )
                                            }
                                            className="
                        w-full
                        pl-10
                        pr-4
                        py-3
                        rounded-xl
                        bg-[#0e0b2e]
                        border border-[#2d2770]
                        text-white
                        text-sm
                        outline-none
                        focus:border-[#5C3FE0]
                        transition
                      "
                                        />

                                    </div>
                                </div>

                                {/* EMAIL */}

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">
                                        Email Address
                                    </label>

                                    <div className="relative">

                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />

                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(event) =>
                                                setEmail(
                                                    event.target.value
                                                )
                                            }
                                            className="
                        w-full
                        pl-10
                        pr-4
                        py-3
                        rounded-xl
                        bg-[#0e0b2e]
                        border border-[#2d2770]
                        text-white
                        text-sm
                        outline-none
                        focus:border-[#5C3FE0]
                        transition
                      "
                                        />

                                    </div>
                                </div>

                                {/* EMPLOYEE CODE */}

                                <ReadOnlyField
                                    label="Employee Code"
                                    value={profile.employeeCode}
                                />

                                {/* ROLE */}

                                <ReadOnlyField
                                    label="Role"
                                    value={profile.roleName}
                                />

                                {/* DESIGNATION */}

                                <ReadOnlyField
                                    label="Designation"
                                    value={profile.designation}
                                />

                                {/* DEPARTMENT */}

                                <ReadOnlyField
                                    label="Department"
                                    value={profile.department}
                                />

                                {/* COMPANY */}

                                <ReadOnlyField
                                    label="Company"
                                    value={profile.tenantName}
                                />

                                {/* BRANCH */}

                                <ReadOnlyField
                                    label="Branch"
                                    value={
                                        profile.branchName ||
                                        'No branch assigned'
                                    }
                                />

                            </div>

                            <div className="flex justify-end mt-6 pt-5 border-t border-[#2d2770]/50">

                                <button
                                    type="button"
                                    onClick={handleSaveProfile}
                                    disabled={isSavingProfile}
                                    className="
                    inline-flex
                    items-center
                    gap-2
                    px-5
                    py-2.5
                    rounded-xl
                    bg-[#5C3FE0]
                    hover:bg-[#6d50ed]
                    text-white
                    text-sm
                    font-medium
                    transition
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                                >
                                    {isSavingProfile ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}

                                    {isSavingProfile
                                        ? 'Saving...'
                                        : 'Save Changes'}
                                </button>

                            </div>

                        </div>

                    </div>

                    {/* ACCOUNT INFORMATION */}

                    <div
                        className="
              rounded-2xl
              bg-[#09071e]
              border border-[#2d2770]/70
              p-6
            "
                    >

                        <div className="flex items-start gap-3">

                            <div
                                className="
                  p-2.5
                  rounded-xl
                  bg-[#5C3FE0]/10
                  border border-[#5C3FE0]/20
                  text-[#A78BFA]
                "
                            >
                                <CheckCircle2 className="w-5 h-5" />
                            </div>

                            <div>

                                <h3 className="text-sm font-semibold text-white">
                                    Account Information
                                </h3>

                                <p className="text-xs text-slate-500 mt-1">
                                    Role, department, designation, branch and employee
                                    information are managed by your organization.
                                </p>

                            </div>

                        </div>

                    </div>

                </div>
            )}

            {/* ========================================================
          PASSWORD TAB
      ======================================================== */}

            {profileTab  === 'password' && (
                <div className="space-y-6">

                    <div
                        className="
              rounded-2xl
              bg-[#09071e]
              border border-[#2d2770]/70
              overflow-hidden
            "
                    >

                        <div className="px-6 py-5 border-b border-[#2d2770]/50">

                            <div className="flex items-center gap-3">

                                <div
                                    className="
                    p-2.5
                    rounded-xl
                    bg-[#5C3FE0]/10
                    border border-[#5C3FE0]/20
                    text-[#A78BFA]
                  "
                                >
                                    <Lock className="w-5 h-5" />
                                </div>

                                <div>

                                    <h3 className="text-base font-semibold text-white">
                                        Password & Security
                                    </h3>

                                    <p className="text-xs text-slate-500 mt-1">
                                        Keep your account secure by using a strong password.
                                    </p>

                                </div>

                            </div>

                        </div>

                        <div className="p-6">

                            <div className="max-w-2xl space-y-5">

                                {/* CURRENT PASSWORD */}

                                <PasswordField
                                    label="Current Password"
                                    value={currentPassword}
                                    onChange={setCurrentPassword}
                                    showPassword={showCurrentPassword}
                                    onToggle={() =>
                                        setShowCurrentPassword(
                                            (previous) => !previous
                                        )
                                    }
                                />

                                {/* NEW PASSWORD */}

                                <PasswordField
                                    label="New Password"
                                    value={newPassword}
                                    onChange={setNewPassword}
                                    showPassword={showNewPassword}
                                    onToggle={() =>
                                        setShowNewPassword(
                                            (previous) => !previous
                                        )
                                    }
                                />

                                {/* CONFIRM PASSWORD */}

                                <PasswordField
                                    label="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={setConfirmPassword}
                                    showPassword={showConfirmPassword}
                                    onToggle={() =>
                                        setShowConfirmPassword(
                                            (previous) => !previous
                                        )
                                    }
                                />

                                {/* PASSWORD REQUIREMENTS */}

                                <div
                                    className="
                    rounded-xl
                    bg-[#0e0b2e]
                    border border-[#2d2770]/60
                    p-4
                  "
                                >

                                    <p className="text-xs font-medium text-slate-300 mb-2">
                                        Password requirements
                                    </p>

                                    <ul className="space-y-1.5">

                                        <li className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                                            At least 8 characters
                                        </li>

                                        <li className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                                            Must be different from your current password
                                        </li>

                                    </ul>

                                </div>

                                {/* SAVE */}

                                <div className="flex justify-end pt-2">

                                    <button
                                        type="button"
                                        onClick={handleChangePassword}
                                        disabled={isChangingPassword}
                                        className="
                      inline-flex
                      items-center
                      gap-2
                      px-5
                      py-2.5
                      rounded-xl
                      bg-[#5C3FE0]
                      hover:bg-[#6d50ed]
                      text-white
                      text-sm
                      font-medium
                      transition
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                    "
                                    >

                                        {isChangingPassword ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="w-4 h-4" />
                                        )}

                                        {isChangingPassword
                                            ? 'Changing Password...'
                                            : 'Change Password'}

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                    {/* SECURITY NOTE */}

                    <div
                        className="
              rounded-2xl
              bg-[#09071e]
              border border-[#2d2770]/70
              p-5
            "
                    >

                        <div className="flex items-start gap-3">

                            <KeyRound className="w-5 h-5 text-[#A78BFA] mt-0.5" />

                            <div>

                                <p className="text-sm font-medium text-white">
                                    Password security
                                </p>

                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Your password is securely hashed on the server.
                                    It is never returned to the browser or displayed
                                    in your profile.
                                </p>

                            </div>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
};

// ============================================================
// READ ONLY FIELD
// ============================================================

interface ReadOnlyFieldProps {
    label: string;
    value: string;
}

const ReadOnlyField: React.FC<
    ReadOnlyFieldProps
> = ({
    label,
    value,
}) => {
        return (
            <div>

                <label className="block text-xs font-medium text-slate-400 mb-2">
                    {label}
                </label>

                <input
                    type="text"
                    value={value}
                    readOnly
                    className="
          w-full
          px-4
          py-3
          rounded-xl
          bg-[#08061b]
          border border-[#252052]
          text-slate-500
          text-sm
          outline-none
          cursor-not-allowed
        "
                />

            </div>
        );
    };

// ============================================================
// PASSWORD FIELD
// ============================================================

interface PasswordFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    showPassword: boolean;
    onToggle: () => void;
}

const PasswordField: React.FC<
    PasswordFieldProps
> = ({
    label,
    value,
    onChange,
    showPassword,
    onToggle,
}) => {
        return (
            <div>

                <label className="block text-xs font-medium text-slate-400 mb-2">
                    {label}
                </label>

                <div className="relative">

                    <Lock
                        className="
            absolute
            left-3
            top-1/2
            -translate-y-1/2
            w-4
            h-4
            text-slate-500
          "
                    />

                    <input
                        type={
                            showPassword
                                ? 'text'
                                : 'password'
                        }
                        value={value}
                        onChange={(event) =>
                            onChange(event.target.value)
                        }
                        className="
            w-full
            pl-10
            pr-11
            py-3
            rounded-xl
            bg-[#0e0b2e]
            border border-[#2d2770]
            text-white
            text-sm
            outline-none
            focus:border-[#5C3FE0]
            transition
          "
                    />

                    <button
                        type="button"
                        onClick={onToggle}
                        className="
            absolute
            right-3
            top-1/2
            -translate-y-1/2
            text-slate-500
            hover:text-slate-200
            transition
          "
                    >
                        {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                        ) : (
                            <Eye className="w-4 h-4" />
                        )}
                    </button>

                </div>

            </div>
        );
    };

export default ProfileView;