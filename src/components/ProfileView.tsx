import React, {
    ChangeEvent,
    useEffect,
    useRef,
    useState,
} from 'react';
import Cropper, { Area } from 'react-easy-crop';

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
    X,
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
import { getFileUrl } from '../utils/fileUrl';

type ProfileTab = 'profile' | 'password';

export const ProfileView: React.FC = () => {
    const {
        currentUser,
        setCurrentUser,
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

    const [selectedAvatar, setSelectedAvatar] =
        useState<File | null>(null);

    const [avatarPreview, setAvatarPreview] =
        useState<string | null>(null);

    const fileInputRef =
        useRef<HTMLInputElement | null>(null);

    const [isCropModalOpen, setIsCropModalOpen] = useState(false);

    const [cropSource, setCropSource] = useState<string | null>(null);

    const [crop, setCrop] = useState({
        x: 0,
        y: 0,
    });

    const [zoom, setZoom] = useState(1);

    const [croppedAreaPixels, setCroppedAreaPixels] =
        useState<Area | null>(null);

    const [isCropping, setIsCropping] = useState(false);

    const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);

    const [selectedAvatarType, setSelectedAvatarType] =
        useState<string>('image/jpeg');

    //=================================================================================================//

    const createCroppedImage = (
        imageSrc: string,
        pixelCrop: Area,
        outputType: string = 'image/jpeg'
    ): Promise<File> => {
        return new Promise((resolve, reject) => {
            const image = new Image();

            image.onload = () => {
                const canvas = document.createElement('canvas');

                // Standard profile avatar size.
                // This prevents users from uploading unnecessarily huge images.
                const outputSize = 800;

                canvas.width = outputSize;
                canvas.height = outputSize;

                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject(new Error('Unable to create image canvas.'));
                    return;
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                ctx.drawImage(
                    image,
                    pixelCrop.x,
                    pixelCrop.y,
                    pixelCrop.width,
                    pixelCrop.height,
                    0,
                    0,
                    outputSize,
                    outputSize
                );

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Unable to create cropped image.'));
                            return;
                        }

                        const extension =
                            outputType === 'image/png'
                                ? 'png'
                                : outputType === 'image/webp'
                                    ? 'webp'
                                    : 'jpg';

                        const file = new File(
                            [blob],
                            `profile-avatar-${Date.now()}.${extension}`,
                            {
                                type: outputType,
                                lastModified: Date.now(),
                            }
                        );

                        resolve(file);
                    },
                    outputType,
                    0.9
                );
            };

            image.onerror = () => {
                reject(new Error('Unable to load image.'));
            };

            image.src = imageSrc;
        });
    };

    useEffect(() => {
        return () => {
            if (avatarPreview?.startsWith('blob:')) {
                URL.revokeObjectURL(avatarPreview);
            }

            if (cropSource?.startsWith('blob:')) {
                URL.revokeObjectURL(cropSource);
            }
        };
    }, [avatarPreview, cropSource]);
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

    const avatarUrl = avatarPreview || getFileUrl(profile?.avatarUrl);

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

            // --------------------------------------------------------
            // SAVE PROFILE INFORMATION
            // --------------------------------------------------------

            const updatedProfile =
                await updateMyProfile({
                    fullName: fullName.trim(),
                    email: email.trim(),
                });

            // --------------------------------------------------------
            // UPLOAD AVATAR ONLY IF A NEW ONE WAS SELECTED
            // --------------------------------------------------------

            let finalAvatarUrl =
                profile?.avatarUrl || '';

            if (selectedAvatar) {
                const avatarResult =
                    await uploadMyAvatar(selectedAvatar);

                finalAvatarUrl =
                    avatarResult.avatarUrl;

                setCurrentUser((previous) =>
                    previous
                        ? {
                            ...previous,
                            avatarUrl: finalAvatarUrl,
                        }
                        : previous
                );
            }

            // --------------------------------------------------------
            // UPDATE LOCAL PROFILE
            // --------------------------------------------------------

            setProfile((previous) =>
                previous
                    ? {
                        ...previous,
                        ...updatedProfile,
                        fullName: fullName.trim(),
                        email: email.trim(),
                        avatarUrl: finalAvatarUrl,
                    }
                    : previous
            );

            setAvatarPreview(null);
            setSelectedAvatar(null);

            toast.success(
                'Profile updated successfully.'
            );

        } catch (error: any) {
            console.error(
                'Failed to update profile:',
                error
            );

            toast.error(
                error?.message ||
                'Failed to update profile.'
            );
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

    const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
        ];

        if (!allowedTypes.includes(file.type)) {
            toast.error('Please select a JPG, PNG, or WEBP image.');
            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5 MB.');
            event.target.value = '';
            return;
        }

        const sourceUrl = URL.createObjectURL(file);

        setCropSource(sourceUrl);
        setSelectedAvatarType(
            file.type === 'image/png'
                ? 'image/png'
                : file.type === 'image/webp'
                    ? 'image/webp'
                    : 'image/jpeg'
        );

        setCrop({
            x: 0,
            y: 0,
        });

        setZoom(1);

        setCroppedAreaPixels(null);

        setIsCropModalOpen(true);

        // Allows selecting the same file again later.
        event.target.value = '';
    };

    const handleCropComplete = (
        _croppedArea: Area,
        croppedAreaPixels: Area
    ) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCropConfirm = async () => {
        if (!cropSource || !croppedAreaPixels) {
            toast.error('Please select a crop area.');
            return;
        }

        try {
            setIsCropping(true);

            const croppedFile = await createCroppedImage(
                cropSource,
                croppedAreaPixels,
                selectedAvatarType
            );

            const previewUrl = URL.createObjectURL(croppedFile);

            setSelectedAvatar(croppedFile);
            setAvatarPreview(previewUrl);

            setIsCropModalOpen(false);
            setCropSource(null);

            toast.success('Image cropped successfully.');
        } catch (error) {
            console.error('Avatar crop error:', error);
            toast.error('Unable to crop image.');
        } finally {
            setIsCropping(false);
        }
    };

    const handleCropCancel = () => {
        setIsCropModalOpen(false);
        setCropSource(null);
        setCroppedAreaPixels(null);
        setZoom(1);
        setCrop({
            x: 0,
            y: 0,
        });
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

                        {avatarUrl ? (
                            <button
                                type="button"
                                onClick={() => setIsAvatarPreviewOpen(true)}
                                className="
            group
            relative
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
            cursor-pointer
            focus:outline-none
            focus:ring-2
            focus:ring-[#A78BFA]/60
            focus:ring-offset-2
            focus:ring-offset-[#09071e]
        "
                                aria-label="View profile picture"
                            >
                                <img
                                    src={avatarUrl}
                                    alt={profile.fullName}
                                    className="
                w-full
                h-full
                object-cover
                transition-transform
                duration-300
                group-hover:scale-105
            "
                                />

                                {/* Hover overlay */}
                                <div
                                    className="
                absolute
                inset-0
                flex
                items-center
                justify-center
                bg-black/0
                group-hover:bg-black/40
                transition
            "
                                >
                                    <Eye
                                        className="
                    w-6
                    h-6
                    text-white
                    opacity-0
                    group-hover:opacity-100
                    transition
                "
                                    />
                                </div>
                            </button>
                        ) : (
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
                                <span className="text-3xl font-bold text-[#A78BFA]">
                                    {getInitials(profile.fullName)}
                                </span>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            disabled={isSavingProfile}
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
                            {/* {isSavingProfile ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : ( */}
                            <Camera className="w-4 h-4" />
                            {/* )} */}
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
            ${profileTab === 'password'
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

            {profileTab === 'profile' && (
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

            {profileTab === 'password' && (
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


            {/* ========================================================
    AVATAR CROP MODAL
======================================================== */}

            {isCropModalOpen && cropSource && (
                <div
                    className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/80
            backdrop-blur-sm
            p-4
        "
                >
                    <div
                        className="
                w-full
                max-w-2xl
                overflow-hidden
                rounded-2xl
                border
                border-white/10
                bg-[#09071e]
                shadow-2xl
            "
                    >

                        {/* HEADER */}

                        <div
                            className="
                    flex
                    items-center
                    justify-between
                    px-5
                    py-4
                    border-b
                    border-white/10
                "
                        >
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    Crop Profile Picture
                                </h2>

                                <p className="text-sm text-slate-500 mt-1">
                                    Adjust your photo inside the square.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleCropCancel}
                                disabled={isCropping}
                                className="
                        w-9
                        h-9
                        rounded-lg
                        flex
                        items-center
                        justify-center
                        text-slate-400
                        hover:text-white
                        hover:bg-white/10
                        transition
                        disabled:opacity-50
                    "
                                aria-label="Close crop modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* CROPPER */}

                        <div
                            className="
                    relative
                    w-full
                    h-[420px]
                    bg-black
                "
                        >
                            <Cropper
                                image={cropSource}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="rect"
                                showGrid={true}
                                restrictPosition={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={handleCropComplete}
                            />
                        </div>

                        {/* ZOOM */}

                        <div className="px-6 py-5">

                            <div className="flex items-center justify-between mb-2">

                                <span className="text-sm font-medium text-slate-300">
                                    Zoom
                                </span>

                                <span className="text-xs text-slate-500">
                                    {zoom.toFixed(1)}x
                                </span>

                            </div>

                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(event) =>
                                    setZoom(
                                        Number(event.target.value)
                                    )
                                }
                                className="
                        w-full
                        accent-[#5C3FE0]
                        cursor-pointer
                    "
                            />

                        </div>

                        {/* FOOTER */}

                        <div
                            className="
                    flex
                    justify-end
                    gap-3
                    px-5
                    py-4
                    border-t
                    border-white/10
                "
                        >

                            <button
                                type="button"
                                onClick={handleCropCancel}
                                disabled={isCropping}
                                className="
                        px-4
                        py-2.5
                        rounded-xl
                        border
                        border-white/10
                        text-sm
                        font-medium
                        text-slate-300
                        hover:bg-white/5
                        transition
                        disabled:opacity-50
                    "
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleCropConfirm}
                                disabled={
                                    isCropping ||
                                    !croppedAreaPixels
                                }
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
                                {isCropping ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Cropping...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Crop & Continue
                                    </>
                                )}
                            </button>

                        </div>

                    </div>
                </div>
            )}

            {/* ========================================================
    AVATAR IMAGE PREVIEW MODAL
======================================================== */}

            {isAvatarPreviewOpen && avatarUrl && (
                <div
                    className="
            fixed
            inset-0
            z-[110]
            flex
            items-center
            justify-center
            bg-black/85
            backdrop-blur-sm
            p-4
        "
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setIsAvatarPreviewOpen(false);
                        }
                    }}
                >

                    <div
                        className="
                relative
                max-w-4xl
                max-h-[90vh]
            "
                    >

                        {/* CLOSE BUTTON */}

                        <button
                            type="button"
                            onClick={() =>
                                setIsAvatarPreviewOpen(false)
                            }
                            className="
                    absolute
                    -right-3
                    -top-3
                    z-10
                    w-10
                    h-10
                    rounded-full
                    bg-[#0e0b2e]
                    border
                    border-white/10
                    flex
                    items-center
                    justify-center
                    text-slate-300
                    hover:bg-[#5C3FE0]
                    hover:text-white
                    transition
                    shadow-xl
                "
                            aria-label="Close image preview"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* IMAGE */}

                        <div
                            className="
                    rounded-2xl
                    bg-[#09071e]
                    border
                    border-white/10
                    p-2
                    shadow-2xl
                    overflow-hidden
                "
                        >
                            <img
                                src={avatarUrl}
                                alt={profile.fullName}
                                className="
                        max-h-[80vh]
                        max-w-[80vw]
                        rounded-xl
                        object-contain
                    "
                            />
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