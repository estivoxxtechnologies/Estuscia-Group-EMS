import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import {
  loginUser,
  getCurrentUser,
  BackendUser,
} from '../api/auth';
import {
  Tenant,
  User,
  Role,
  SlabVersion,
  AttendanceRecord,
  AttendanceBatch,
  LeaveRequest,
  TargetCycle,
  StaffTarget,
  IncentiveTransaction,
  PayrollCycle,
  Payslip,
  Course,
  Certificate,
  UserCourseProgress,
  NotificationItem,
  AuditEntry,
  DailyWorkLog,
  CustomerPaymentReceipt,
  DesignationPermission,
} from '../types';
import {
  saveTokens,
  clearTokens,
  getAccessToken,
  getJwtPayload,
  isTokenExpired,
} from '../api/authStorage';
import { CurrentUser } from '../types/currentUser';
import {
  getBranches,
} from '../api/branches';

import {
  Branch,
} from '../types/branch';


export type AppTab =
  | 'dashboard'
  | 'daily_work'
  | 'attendance'
  | 'targets_incentives'
  | 'receipts_slabs'
  | 'staff'
  | 'payroll'
  | 'knowledge_hub'
  | 'audit_settings'
  | 'slabs'
  | 'lms_academy';

export type ViewMode = 'portal' | 'public_web';



interface AppContextType {
  // Navigation & Platform Mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isTabAllowed: (tab: AppTab) => boolean;

  // Auth & Session
  isAuthenticated: boolean;
  authLoading: boolean;
  setAuthenticated: (authenticated: boolean) => void;
  login: (
    email: string,
    password?: string,
    targetRole?: Role
  ) => Promise<boolean>;
  signup: (userData: Partial<User>, companyData?: Partial<Tenant>) => boolean;
  logout: () => void;

  // Multi-Tenant & Role Session
  tenants: Tenant[];
  addNewTenant: (tenant: Omit<Tenant, 'id'>) => Tenant;

  users: User[];

  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;

  branches: Branch[];
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
  loadBranches: () => Promise<void>;

  switchRole: (role: Role) => void;
  switchUserById: (userId: string) => void;

  // Daily Work & Call Submissions
  dailyWorkLogs: DailyWorkLog[];
  submitDailyWorkLog: (log: Omit<DailyWorkLog, 'id' | 'submittedAt' | 'status'>) => void;
  reviewDailyWorkLog: (id: string, feedback: string, status: 'Reviewed' | 'Acknowledged') => void;
  isWorkLogModalOpen: boolean;
  setIsWorkLogModalOpen: (open: boolean) => void;

  // Customer Payment Receipts & Investment Deposit Slips
  customerReceipts: CustomerPaymentReceipt[];
  generateCustomerReceipt: (receipt: Omit<CustomerPaymentReceipt, 'id' | 'receiptNumber'>) => CustomerPaymentReceipt;
  selectedReceiptForView: CustomerPaymentReceipt | null;
  setSelectedReceiptForView: (receipt: CustomerPaymentReceipt | null) => void;
  isCreateReceiptModalOpen: boolean;
  setIsCreateReceiptModalOpen: (open: boolean) => void;

  // Designation Permissions & Access Control Matrix
  designationPermissions: DesignationPermission[];
  updateDesignationPermission: (id: string, updates: Partial<DesignationPermission>) => void;

  // Investment Slabs
  slabVersions: SlabVersion[];
  activeSlabVersion: SlabVersion;
  addNewSlabVersion: (newVersion: Omit<SlabVersion, 'id' | 'createdAt'>) => void;

  // Attendance & Batch Upload
  attendanceRecords: AttendanceRecord[];
  attendanceBatches: AttendanceBatch[];
  leaveRequests: LeaveRequest[];
  uploadAttendanceBatch: (fileName: string, records: Partial<AttendanceRecord>[]) => void;
  updateAttendanceRecord: (recordId: string, updates: Partial<AttendanceRecord>) => void;
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => void;
  submitLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'appliedOn' | 'status'>) => void;
  reviewLeaveRequest: (id: string, status: 'Approved' | 'Rejected', reviewNotes?: string) => void;

  // Targets & Slab Incentives
  targetCycles: TargetCycle[];
  staffTargets: StaffTarget[];
  incentiveTransactions: IncentiveTransaction[];
  logIncentiveDeal: (deal: Omit<IncentiveTransaction, 'id' | 'date' | 'status'>) => void;
  updateIncentiveStatus: (
    id: string,
    status: 'Verified_Manager' | 'Approved_HR' | 'Paid_Payroll' | 'Rejected',
    notes?: string
  ) => void;

  // Payroll & Payslips
  payrollCycles: PayrollCycle[];
  payslips: Payslip[];
  generateMonthlyPayroll: (monthYear: string) => void;
  disbursePayroll: (cycleId: string) => void;

  // LMS & Knowledge Hub
  courses: Course[];
  userProgress: Record<string, UserCourseProgress>;
  certificates: Certificate[];
  addNewCourse: (course: Omit<Course, 'id' | 'enrolledCount' | 'rating'>) => void;
  uploadVideoLesson: (courseId: string, lesson: { title: string; duration: string; contentUrl: string; description: string; speakerName: string; speakerTitle: string }) => void;
  completeLesson: (userId: string, courseId: string, lessonId: string) => void;
  recordQuizScore: (userId: string, courseId: string, lessonId: string, score: number) => void;
  claimCertificate: (userId: string, courseId: string, score: number) => Certificate;

  // System & Notifications
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  auditLogs: AuditEntry[];
  logAuditEvent: (action: string, target: string) => void;

  // Quick Action Modals
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isAddEmployeeOpen: boolean;
  setIsAddEmployeeOpen: (open: boolean) => void;
  isBatchUploadOpen: boolean;
  setIsBatchUploadOpen: (open: boolean) => void;
  isLogDealOpen: boolean;
  setIsLogDealOpen: (open: boolean) => void;
  selectedCourseForPlayer: Course | null;
  setSelectedCourseForPlayer: (course: Course | null) => void;
  selectedCertificateForView: Certificate | null;
  setSelectedCertificateForView: (cert: Certificate | null) => void;
  selectedPayslipForView: Payslip | null;
  setSelectedPayslipForView: (slip: Payslip | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State
  const [viewMode, setViewMode] = useState<ViewMode>('portal');
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [authLoading, setAuthLoading] = useState(true);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Multi-Tenant and User State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] =
    useState<Branch | null>(null);


  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Daily Work & Call Submissions
  const [dailyWorkLogs, setDailyWorkLogs] = useState<DailyWorkLog[]>([]);
  const [isWorkLogModalOpen, setIsWorkLogModalOpen] = useState<boolean>(false);

  // Customer Payment Receipts
  const [selectedReceiptForView, setSelectedReceiptForView] = useState<CustomerPaymentReceipt | null>(null);
  const [isCreateReceiptModalOpen, setIsCreateReceiptModalOpen] = useState<boolean>(false);

  // Desconst [dailyWorkLogs, setDailyWorkLogs] = useState<DailyWorkLog[]>([]);

  const [customerReceipts, setCustomerReceipts] =
    useState<CustomerPaymentReceipt[]>([]);

  const [designationPermissions, setDesignationPermissions] =
    useState<DesignationPermission[]>([]);

  const [slabVersions, setSlabVersions] =
    useState<SlabVersion[]>([]);

  const [attendanceRecords, setAttendanceRecords] =
    useState<AttendanceRecord[]>([]);

  const [attendanceBatches, setAttendanceBatches] =
    useState<AttendanceBatch[]>([]);

  const [leaveRequests, setLeaveRequests] =
    useState<LeaveRequest[]>([]);

  const [targetCycles, setTargetCycles] =
    useState<TargetCycle[]>([]);

  const [staffTargets, setStaffTargets] =
    useState<StaffTarget[]>([]);

  const [incentiveTransactions, setIncentiveTransactions] =
    useState<IncentiveTransaction[]>([]);

  const [payrollCycles, setPayrollCycles] =
    useState<PayrollCycle[]>([]);

  const [payslips, setPayslips] =
    useState<Payslip[]>([]);

  const [courses, setCourses] =
    useState<Course[]>([]);

  const [userProgress, setUserProgress] =
    useState<Record<string, UserCourseProgress>>({});

  const [certificates, setCertificates] =
    useState<Certificate[]>([]);

  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [auditLogs, setAuditLogs] =
    useState<AuditEntry[]>([]);

  // Modals & Active View state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false);
  const [isLogDealOpen, setIsLogDealOpen] = useState(false);
  const [selectedCourseForPlayer, setSelectedCourseForPlayer] = useState<Course | null>(null);
  const [selectedCertificateForView, setSelectedCertificateForView] = useState<Certificate | null>(null);
  const [selectedPayslipForView, setSelectedPayslipForView] = useState<Payslip | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        setAuthLoading(true);

        const token = getAccessToken();

        console.log(
          'RESTORE SESSION - access token:',
          !!token
        );

        if (!token) {
          setCurrentUser(null);
          setIsAuthenticated(false);
          return;
        }

        // Let the backend validate the access token.
        const user = await loadCurrentUser();

        console.log(
          'SESSION RESTORED:',
          user
        );

        setCurrentUser(user);
        setIsAuthenticated(true);

      } catch (error) {
        console.error(
          'Session restore failed:',
          error
        );

        clearTokens();

        setCurrentUser(null);
        setIsAuthenticated(false);

      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  const mapBackendUserToCurrentUser = (
    backendUser: BackendUser
  ): CurrentUser => {
    return {
      userId: backendUser.userId,
      username: backendUser.username,
      email: backendUser.email,

      roleId: backendUser.roleId,
      roleName: backendUser.roleName,

      designation: backendUser.designation,

      tenantId: backendUser.tenantId,
      tenantName: backendUser.tenantName,

      branchId: backendUser.branchId,
      branchName: backendUser.branchName,

      avatarUrl: backendUser.avatarUrl,
    };
  };

  const loadCurrentUser = async (): Promise<CurrentUser> => {
    const backendUser = await getCurrentUser();

    console.log('BACKEND /Auth/me:', backendUser);

    const currentUser = mapBackendUserToCurrentUser(backendUser);

    console.log('MAPPED CURRENT USER:', currentUser);

    return currentUser;
  };

  // Active Slab Version derived helper
  const activeSlabVersion = slabVersions.find((sv) => sv.status === 'active') || slabVersions[0];

  // Role tab authorization check
  const isTabAllowed = (tab: AppTab): boolean => {
    if (!currentUser) {
      return false;
    }

    // Super admin and company admin have universal access
    if (
      currentUser.roleName === 'super_admin' ||
      currentUser.roleName === 'company_admin'
    ) {
      return true;
    }

    // Check designation permission configuration if defined
    const matchedPerm = designationPermissions.find(
      (p) =>
        p.designation.toLowerCase() ===
        currentUser.designation.toLowerCase()
    );

    if (matchedPerm) {
      if (
        tab === 'slabs' &&
        matchedPerm.allowedTabs.includes('receipts_slabs')
      ) {
        return true;
      }

      if (
        tab === 'lms_academy' &&
        matchedPerm.allowedTabs.includes('knowledge_hub')
      ) {
        return true;
      }

      return matchedPerm.allowedTabs.includes(tab);
    }

    // Role defaults
    if (currentUser.roleName === 'hr_ops') {
      return [
        'dashboard',
        'staff',
        'daily_work',
        'attendance',
        'payroll',
        'receipts_slabs',
        'knowledge_hub',
      ].includes(tab);
    }

    if (currentUser.roleName === 'branch_manager') {
      return [
        'dashboard',
        'staff',
        'daily_work',
        'attendance',
        'targets_incentives',
        'receipts_slabs',
        'payroll',
        'knowledge_hub',
      ].includes(tab);
    }

    if (currentUser.roleName === 'developer') {
      return [
        'dashboard',
        'daily_work',
        'attendance',
        'knowledge_hub',
        'payroll',
      ].includes(tab);
    }

    if (currentUser.roleName === 'support_staff') {
      return [
        'dashboard',
        'daily_work',
        'attendance',
        'receipts_slabs',
        'knowledge_hub',
        'payroll',
      ].includes(tab);
    }

    // Sales / Staff default
    return [
      'dashboard',
      'daily_work',
      'attendance',
      'targets_incentives',
      'receipts_slabs',
      'knowledge_hub',
      'payroll',
    ].includes(tab);
  };

  // Auth methods
  const login = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await loginUser(
        email,
        password
      );

      saveTokens(
        response.accessToken,
        response.refreshToken
      );

      localStorage.setItem(
        'isAuthenticated',
        'true'
      );

      const user = await loadCurrentUser();

      setCurrentUser(user);
      setIsAuthenticated(true);

      setActiveTab('dashboard');

      return true;

    } catch (error) {
      console.error(
        'Login failed:',
        error
      );

      clearTokens();

      localStorage.removeItem(
        'isAuthenticated'
      );

      setCurrentUser(null);
      setIsAuthenticated(false);

      return false;
    }
  };

  const signup = (userData: Partial<User>, companyData?: Partial<Tenant>): boolean => {
    let tenantId = currentUser?.tenantId;

    if (companyData && companyData.name) {
      const newTenant: Tenant = {
        id: `tenant-${Date.now()}`,
        name: companyData.name,
        code: companyData.name.substring(0, 4).toUpperCase(),
        logoText: companyData.name.split(' ')[0].toUpperCase(),
        domain: companyData.domain || `${companyData.name.toLowerCase().replace(/\s+/g, '')}.estuscia.com`,
        plan: companyData.plan || 'Growth',
        branches: companyData.branches || ['Head Office'],
        departments: companyData.departments || ['Operations', 'Sales', 'Technology'],
        currency: companyData.currency || 'USD ($)',
        activeSlabVersion: 'v2026.1',
        primaryColor: '#5C3FE0',
        supportEmail: companyData.supportEmail || `admin@${companyData.domain || 'company.com'}`,
      };
      setTenants((prev) => [...prev, newTenant]);
      // setCurrentTenant(newTenant);
      tenantId = newTenant.id;
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      tenantId,
      tenantName: currentUser.tenantName,
      employeeCode: `EST-EMP-${Math.floor(100 + Math.random() * 900)}`,
      name: userData.name || 'New Team Member',
      email: userData.email || 'user@estusciagroup.com',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: userData.role || 'support_staff',
      department: userData.department || 'Private Client Advisory',
      branch: userData.branch || 'Dubai Financial Centre (HQ)',
      branchId: userData.branchId || '',
      designation: userData.designation || 'Investment Advisor',
      joinDate: new Date().toISOString().substring(0, 10),
      phone: userData.phone || '+971 50 000 0000',
      status: 'active',
      salaryBase: userData.salaryBase || 6000,
      salaryHra: userData.salaryHra || 1800,
      salaryAllowances: userData.salaryAllowances || 1000,
      assignedTarget: userData.assignedTarget || 500000,
      currentAchievement: 0,
      bankAccount: userData.bankAccount || 'AE89 0330 0000 9999 8888 77',
      panOrTaxId: userData.panOrTaxId || 'TAX-UAE-112233',
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
    logAuditEvent('USER_SIGNUP', `Registered account for ${newUser.name} (${newUser.email})`);
    return true;
  };

  const logout = () => {
    clearTokens();

    setIsAuthenticated(false);
    setCurrentUser(null);

    setUsers([]);
    setTenants([]);

    setActiveTab('dashboard');
  };

  // Helper to switch user role seamlessly
  const switchRole = (targetRole: Role) => {
    const matchedUser = users.find((u) => u.role === targetRole);

    if (matchedUser) {
      setCurrentUser(matchedUser);
      logAuditEvent(
        'SWITCH_USER_SESSION',
        `Switched view context to ${matchedUser.name} (${targetRole})`
      );
    }
  };

  const switchUserById = (userId: string) => {
    const matchedUser = users.find((u) => u.id === userId);

    if (matchedUser) {
      setCurrentUser(matchedUser);

      logAuditEvent(
        'SWITCH_USER_SESSION',
        `Switched view context to ${matchedUser.name} (${matchedUser.role})`
      );
    }
  };

  const logAuditEvent = (action: string, target: string) => {
    if (!currentUser) {
      return;
    }

    const newLog: AuditEntry = {
      id: `aud-${Date.now()}`,
      tenantId: currentUser.tenantId,
      actorName: currentUser.username,
      actorRole: currentUser.roleName,
      action,
      target,
      timestamp: new Date()
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19),
      ipAddress: 'Client',
    };

    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Daily Work & Call Submissions
  const submitDailyWorkLog = (logData: Omit<DailyWorkLog, 'id' | 'submittedAt' | 'status'>) => {
    const newLog: DailyWorkLog = {
      ...logData,
      id: `work-log-${Date.now()}`,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Submitted',
    };

    setDailyWorkLogs((prev) => [newLog, ...prev]);
    logAuditEvent('SUBMIT_DAILY_WORK_LOG', `Submitted daily work record for ${logData.userName} (${logData.workType})`);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Daily Work Report Submitted',
        message: `Your daily summary for ${logData.date} has been submitted for management review.`,
        type: 'success',
        timestamp: 'Just now',
        isRead: false,
        tag: 'Work Log',
      },
      ...prev,
    ]);
  };

  const reviewDailyWorkLog = (id: string, feedback: string, status: 'Reviewed' | 'Acknowledged') => {
    setDailyWorkLogs((prev) =>
      prev.map((log) => (log.id === id ? { ...log, managerFeedback: feedback, status } : log))
    );
    logAuditEvent('REVIEW_DAILY_WORK_LOG', `Manager feedback added to work log #${id}`);
  };

  // Customer Payment Receipts
  const generateCustomerReceipt = (receiptData: Omit<CustomerPaymentReceipt, 'id' | 'receiptNumber'>): CustomerPaymentReceipt => {
    const receiptNum = `EST-REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReceipt: CustomerPaymentReceipt = {
      ...receiptData,
      id: `rcpt-${Date.now()}`,
      receiptNumber: receiptNum,
      certificateQrCode: `https://estuscia.com/receipt/verify/${receiptNum}`,
    };

    setCustomerReceipts((prev) => [newReceipt, ...prev]);
    logAuditEvent('GENERATE_CUSTOMER_RECEIPT', `Generated official deposit receipt ${receiptNum} for ${receiptData.customerName} ($${receiptData.depositAmount.toLocaleString()})`);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Payment Receipt Issued',
        message: `Official deposit certificate ${receiptNum} generated for ${receiptData.customerName}.`,
        type: 'success',
        timestamp: 'Just now',
        isRead: false,
        tag: 'Receipts',
      },
      ...prev,
    ]);

    return newReceipt;
  };

  // Designation Permissions
  const updateDesignationPermission = (id: string, updates: Partial<DesignationPermission>) => {
    setDesignationPermissions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    logAuditEvent('UPDATE_DESIGNATION_PERMISSIONS', `Updated module access controls for permission set #${id}`);
  };

  // Client Company Tenant Onboarding
  const addNewTenant = (tenantData: Omit<Tenant, 'id'>): Tenant => {
    const newTenant: Tenant = {
      ...tenantData,
      id: `tenant-${Date.now()}`,
    };
    setTenants((prev) => [...prev, newTenant]);
    logAuditEvent('ONBOARD_CLIENT_TENANT', `Onboarded new client company: ${newTenant.name} (${newTenant.plan})`);
    return newTenant;
  };

  // Add new Slab Version
  const addNewSlabVersion = (newVersionData: Omit<SlabVersion, 'id' | 'createdAt'>) => {
    const newId = `slab-ver-${Date.now()}`;
    const newVer: SlabVersion = {
      ...newVersionData,
      id: newId,
      createdAt: new Date().toISOString().substring(0, 10),
    };

    setSlabVersions((prev) => {
      if (newVer.status === 'active') {
        return [newVer, ...prev.map((v) => ({ ...v, status: (v.status === 'active' ? 'archived' : v.status) as any }))];
      }
      return [newVer, ...prev];
    });

    logAuditEvent('CREATE_SLAB_VERSION', `Created ${newVer.versionCode} (${newVer.title}) with ${newVer.tiers.length} tiers`);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'New Investment Slab Published',
        message: `Slab version ${newVer.versionCode} has been added to the registry.`,
        type: 'info',
        timestamp: 'Just now',
        isRead: false,
        tag: 'Slabs',
      },
      ...prev,
    ]);
  };

  // Batch Attendance Upload Handler (Excel/CSV parse commitment)
  const uploadAttendanceBatch = (fileName: string, records: Partial<AttendanceRecord>[]) => {
    const batchId = `batch-${Date.now()}`;
    const today = new Date().toISOString().substring(0, 10);

    const newBatch: AttendanceBatch = {
      id: batchId,
      tenantId: currentUser.tenantId,
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.username,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      fileName,
      totalRows: records.length,
      validRows: records.length,
      errorRows: 0,
      status: 'completed',
      previewRecords: records,
    };

    const newRecords: AttendanceRecord[] = records.map((r, idx) => ({
      id: `att-${Date.now()}-${idx}`,
      tenantId: currentUser.tenantId,
      userId: r.userId || users[idx % users.length].id,
      userName: r.userName || users[idx % users.length].name,
      employeeCode: r.employeeCode || users[idx % users.length].employeeCode,
      department: r.department || users[idx % users.length].department,
      date: r.date || today,
      inTime: r.inTime || '09:00 AM',
      outTime: r.outTime || '06:00 PM',
      totalHours: r.totalHours || 8.5,
      status: (r.status as any) || 'Present',
      uploadBatchId: batchId,
      uploadedBy: currentUser.username,
      notes: r.notes || 'Imported via biometric Excel batch',
    }));

    setAttendanceBatches((prev) => [newBatch, ...prev]);
    setAttendanceRecords((prev) => [...newRecords, ...prev]);
    logAuditEvent('UPLOAD_BATCH_ATTENDANCE', `Uploaded ${fileName} containing ${records.length} records`);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Attendance Batch Processed',
        message: `Successfully processed ${records.length} biometric records from "${fileName}".`,
        type: 'success',
        timestamp: 'Just now',
        isRead: false,
        tag: 'Attendance',
      },
      ...prev,
    ]);
  };

  const updateAttendanceRecord = (recordId: string, updates: Partial<AttendanceRecord>) => {
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, ...updates } : r))
    );
    logAuditEvent('UPDATE_ATTENDANCE_RECORD', `Modified attendance record #${recordId}`);
  };

  const addAttendanceRecord = (recordData: Omit<AttendanceRecord, 'id'>) => {
    const newRecord: AttendanceRecord = {
      ...recordData,
      id: `att-${Date.now()}`,
    };
    setAttendanceRecords((prev) => [newRecord, ...prev]);
    logAuditEvent('ADD_ATTENDANCE_RECORD', `Logged attendance for ${recordData.userName} on ${recordData.date}`);
  };

  const submitLeaveRequest = (reqData: Omit<LeaveRequest, 'id' | 'appliedOn' | 'status'>) => {
    const newReq: LeaveRequest = {
      ...reqData,
      id: `leave-${Date.now()}`,
      appliedOn: new Date().toISOString().substring(0, 10),
      status: 'Pending',
    };
    setLeaveRequests((prev) => [newReq, ...prev]);
    logAuditEvent('SUBMIT_LEAVE_REQUEST', `Submitted ${reqData.type} leave for ${reqData.days} days`);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Leave Request Submitted',
        message: `Your ${reqData.days}-day ${reqData.type} leave application has been routed to HR.`,
        type: 'info',
        timestamp: 'Just now',
        isRead: false,
        tag: 'Attendance',
      },
      ...prev,
    ]);
  };

  const reviewLeaveRequest = (id: string, status: 'Approved' | 'Rejected', reviewNotes?: string) => {
    setLeaveRequests((prev) =>
      prev.map((req) =>
        req.id === id
          ? {
            ...req,
            status,
            reviewedBy: currentUser.username,
            reviewNotes,
          }
          : req
      )
    );
    logAuditEvent('REVIEW_LEAVE_REQUEST', `Leave request #${id} marked as ${status}`);
  };

  // Log Incentive Deal
  const logIncentiveDeal = (deal: Omit<IncentiveTransaction, 'id' | 'date' | 'status'>) => {
    const newDeal: IncentiveTransaction = {
      ...deal,
      id: `inc-tx-${Date.now()}`,
      date: new Date().toISOString().substring(0, 10),
      status: 'Pending_Manager',
    };

    setIncentiveTransactions((prev) => [newDeal, ...prev]);
    logAuditEvent(
      'LOG_INCENTIVE_DEAL',
      `Logged deal of $${deal.investmentAmount.toLocaleString()} with incentive $${deal.calculatedIncentive.toLocaleString()}`
    );

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'New Deal Submitted for Verification',
        message: `Client ${deal.clientName} deal ($${deal.investmentAmount.toLocaleString()}) logged. Manager verification pending.`,
        type: 'info',
        timestamp: 'Just now',
        isRead: false,
        tag: 'Incentives',
      },
      ...prev,
    ]);
  };

  const updateIncentiveStatus = (
    id: string,
    status: 'Verified_Manager' | 'Approved_HR' | 'Paid_Payroll' | 'Rejected',
    notes?: string
  ) => {
    setIncentiveTransactions((prev) =>
      prev.map((deal) => {
        if (deal.id === id) {
          return {
            ...deal,
            status,
            ...(currentUser.roleName === 'branch_manager' ? { managerNotes: notes } : { hrNotes: notes }),
          };
        }
        return deal;
      })
    );
    logAuditEvent('UPDATE_INCENTIVE_STATUS', `Incentive deal #${id} moved to ${status}`);
  };

  // Payroll Processing
  const generateMonthlyPayroll = (monthYear: string) => {
    const cycleId = `pay-cycle-${Date.now()}`;
    const newCycle: PayrollCycle = {
      id: cycleId,
      tenantId: currentUser.tenantId,
      monthYear,
      processedDate: new Date().toISOString().substring(0, 10),
      totalEmployees: users.length,
      totalGrossPayout: 542000,
      totalIncentivesPaid: 82400,
      totalNetPayout: 479000,
      status: 'Draft',
    };

    const newPayslips: Payslip[] = users.map((u) => {
      const userApprovedIncentives = incentiveTransactions
        .filter((t) => t.userId === u.id && (t.status === 'Approved_HR' || t.status === 'Paid_Payroll'))
        .reduce((sum, t) => sum + t.calculatedIncentive, 0);

      const gross = u.salaryBase + u.salaryHra + u.salaryAllowances + (userApprovedIncentives || 2500);
      const pf = Math.round(u.salaryBase * 0.1);
      const tax = Math.round(gross * 0.08);
      const totalDeductions = pf + tax;
      const net = gross - totalDeductions;

      return {
        id: `slip-${u.id}-${Date.now()}`,
        tenantId: currentUser.tenantId,
        payrollCycleId: cycleId,
        userId: u.id,
        userName: u.name,
        employeeCode: u.employeeCode,
        designation: u.designation,
        department: u.department,
        monthYear,
        workedDays: 22,
        paidLeaves: 1,
        unpaidLeaves: 0,
        grossSalary: gross,
        basicPay: u.salaryBase,
        hra: u.salaryHra,
        specialAllowance: u.salaryAllowances,
        performanceIncentive: userApprovedIncentives || 2500,
        deductionsTotal: totalDeductions,
        providentFund: pf,
        taxDeduction: tax,
        attendanceDeduction: 0,
        netPayable: net,
        generatedAt: new Date().toISOString().substring(0, 10),
        status: 'Generated',
        paymentMode: 'Direct Bank Wire',
      };
    });

    setPayrollCycles((prev) => [newCycle, ...prev]);
    setPayslips((prev) => [...newPayslips, ...prev]);
    logAuditEvent('GENERATE_PAYROLL_CYCLE', `Generated draft payroll for ${monthYear} (${users.length} payslips)`);
  };

  const disbursePayroll = (cycleId: string) => {
    setPayrollCycles((prev) =>
      prev.map((c) => (c.id === cycleId ? { ...c, status: 'Disbursed' } : c))
    );
    setPayslips((prev) =>
      prev.map((p) => (p.payrollCycleId === cycleId ? { ...p, status: 'Paid' } : p))
    );
    logAuditEvent('DISBURSE_PAYROLL', `Disbursed and locked payroll cycle #${cycleId}`);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Payroll Disbursed',
        message: 'Monthly payroll has been executed and bank transfers initiated.',
        type: 'success',
        timestamp: 'Just now',
        isRead: false,
        tag: 'Payroll',
      },
      ...prev,
    ]);
  };

  // Video & Course Knowledge Hub
  const addNewCourse = (newCourseData: Omit<Course, 'id' | 'enrolledCount' | 'rating'>) => {
    const newId = `course-est-${Date.now()}`;
    const newCourse: Course = {
      ...newCourseData,
      id: newId,
      enrolledCount: 1,
      rating: 5.0,
    };
    setCourses((prev) => [newCourse, ...prev]);
    logAuditEvent('CREATE_KNOWLEDGE_MODULE', `Created new knowledge module "${newCourse.title}"`);
  };

  const uploadVideoLesson = (courseId: string, videoLesson: { title: string; duration: string; contentUrl: string; description: string; speakerName: string; speakerTitle: string }) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId || c.modules.length > 0) {
          const updatedModules = [...c.modules];
          if (updatedModules.length === 0) {
            updatedModules.push({
              id: `mod-${Date.now()}`,
              title: 'Executive Video Masterclasses',
              description: 'Direct teachings from leadership and product architects.',
              order: 1,
              lessons: [],
            });
          }
          updatedModules[0].lessons.push({
            id: `les-${Date.now()}`,
            title: videoLesson.title,
            type: 'video',
            duration: videoLesson.duration || '15 min',
            contentUrl: videoLesson.contentUrl,
            textContent: videoLesson.description,
            order: updatedModules[0].lessons.length + 1,
          });
          return { ...c, modules: updatedModules, totalLessons: c.totalLessons + 1 };
        }
        return c;
      })
    );

    logAuditEvent('UPLOAD_CEO_VIDEO', `Uploaded leadership video: "${videoLesson.title}" by ${videoLesson.speakerName}`);
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'New Video Masterclass Published',
        message: `"${videoLesson.title}" taught by ${videoLesson.speakerName} is now available in Knowledge Hub.`,
        type: 'info',
        timestamp: 'Just now',
        isRead: false,
        tag: 'Knowledge Hub',
      },
      ...prev,
    ]);
  };

  const completeLesson = (userId: string, courseId: string, lessonId: string) => {
    const key = `${userId}_${courseId}`;
    const existing = userProgress[key] || {
      id: `prog-${Date.now()}`,
      userId,
      courseId,
      completedLessonIds: [],
      quizScores: {},
      isCompleted: false,
      lastActiveLessonId: lessonId,
    };

    if (!existing.completedLessonIds.includes(lessonId)) {
      const updatedLessons = [...existing.completedLessonIds, lessonId];
      const course = courses.find((c) => c.id === courseId);
      const totalLessons = course ? course.modules.reduce((acc, m) => acc + m.lessons.length, 0) : 6;
      const isNowCompleted = updatedLessons.length >= totalLessons;

      let certId = existing.certificateId;
      if (isNowCompleted && !certId) {
        const cert = claimCertificate(userId, courseId, 95);
        certId = cert.id;
      }

      setUserProgress((prev) => ({
        ...prev,
        [key]: {
          ...existing,
          completedLessonIds: updatedLessons,
          isCompleted: isNowCompleted,
          completedAt: isNowCompleted ? new Date().toISOString().substring(0, 10) : undefined,
          certificateId: certId,
          lastActiveLessonId: lessonId,
        },
      }));
    }
  };

  const recordQuizScore = (userId: string, courseId: string, lessonId: string, score: number) => {
    const key = `${userId}_${courseId}`;
    const existing = userProgress[key] || {
      id: `prog-${Date.now()}`,
      userId,
      courseId,
      completedLessonIds: [],
      quizScores: {},
      isCompleted: false,
      lastActiveLessonId: lessonId,
    };

    setUserProgress((prev) => ({
      ...prev,
      [key]: {
        ...existing,
        quizScores: {
          ...existing.quizScores,
          [lessonId]: score,
        },
      },
    }));

    if (score >= 80) {
      completeLesson(userId, courseId, lessonId);
    }
  };

  const claimCertificate = (userId: string, courseId: string, score: number): Certificate => {
    const course = courses.find((c) => c.id === courseId) || courses[0];
    const user = users.find((u) => u.id === userId) || currentUser;
    const certNum = `EST-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCert: Certificate = {
      id: `cert-${Date.now()}`,
      certificateNumber: certNum,
      tenantId: currentUser.tenantId,
      tenantName: currentUser.tenantName,
      userId: user.id,
      userName: user.name,
      courseId: course.id,
      courseTitle: course.title,
      issuedDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      score: score || 100,
      instructorName: course.instructor.name,
      instructorTitle: course.instructor.title,
      grade: score >= 90 ? 'Distinction' : score >= 80 ? 'Merit' : 'Pass',
      verificationQrCode: `https://estuscia.com/verify/${certNum}`,
    };

    setCertificates((prev) => [newCert, ...prev]);
    logAuditEvent('AWARD_LMS_CERTIFICATE', `Awarded certificate ${certNum} to ${user.name} for "${course.title}"`);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Course Completed & Certified!',
        message: `You earned your official accreditation for "${course.title}".`,
        type: 'success',
        timestamp: 'Just now',
        isRead: false,
        tag: 'Knowledge Hub',
      },
      ...prev,
    ]);

    return newCert;
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <AppContext.Provider
      value={{
        viewMode,
        setViewMode,
        activeTab,
        setActiveTab,
        isTabAllowed,
        isAuthenticated,
        authLoading,
        setAuthenticated: setIsAuthenticated,
        login,
        signup,
        logout,
        tenants,
        // currentTenant,
        // setCurrentTenant,
        addNewTenant,
        users,
        currentUser,
        setCurrentUser,
        switchRole,
        switchUserById,
        dailyWorkLogs,
        submitDailyWorkLog,
        reviewDailyWorkLog,
        isWorkLogModalOpen,
        setIsWorkLogModalOpen,
        customerReceipts,
        generateCustomerReceipt,
        selectedReceiptForView,
        setSelectedReceiptForView,
        isCreateReceiptModalOpen,
        setIsCreateReceiptModalOpen,
        designationPermissions,
        updateDesignationPermission,
        slabVersions,
        activeSlabVersion,
        addNewSlabVersion,
        attendanceRecords,
        attendanceBatches,
        leaveRequests,
        uploadAttendanceBatch,
        updateAttendanceRecord,
        addAttendanceRecord,
        submitLeaveRequest,
        reviewLeaveRequest,
        targetCycles,
        staffTargets,
        incentiveTransactions,
        logIncentiveDeal,
        updateIncentiveStatus,
        payrollCycles,
        payslips,
        generateMonthlyPayroll,
        disbursePayroll,
        courses,
        userProgress,
        certificates,
        addNewCourse,
        uploadVideoLesson,
        completeLesson,
        recordQuizScore,
        claimCertificate,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        auditLogs,
        logAuditEvent,
        isSearchOpen,
        setIsSearchOpen,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isAddEmployeeOpen,
        setIsAddEmployeeOpen,
        isBatchUploadOpen,
        setIsBatchUploadOpen,
        isLogDealOpen,
        setIsLogDealOpen,
        selectedCourseForPlayer,
        setSelectedCourseForPlayer,
        selectedCertificateForView,
        setSelectedCertificateForView,
        selectedPayslipForView,
        setSelectedPayslipForView,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
