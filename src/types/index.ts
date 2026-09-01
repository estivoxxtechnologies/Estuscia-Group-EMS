export type Role =
  | 'super_admin'
  | 'company_admin'
  | 'hr_ops'
  | 'branch_manager'
  | 'sales_staff'
  | 'developer'
  | 'support_staff'
  | 'knowledge_trainer';

export interface Tenant {
  id: string;
  name: string;
  code: string;
  logoText: string;
  domain: string;
  plan: 'Enterprise Pro' | 'Growth' | 'Starter';
  branches: string[];
  departments: string[];
  currency: string;
  activeSlabVersion: string;
  primaryColor: string;
  supportEmail: string;
}

export interface User {
  id: string;
  tenantId: string;
  employeeCode: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  department: string;
  branch: string;
  designation: string;
  reportingManagerId?: string;
  reportingManagerName?: string;
  joinDate: string;
  phone: string;
  status: 'active' | 'on_probation' | 'inactive';
  salaryBase: number;
  salaryHra: number;
  salaryAllowances: number;
  assignedTarget: number;
  currentAchievement: number;
  bankAccount: string;
  panOrTaxId: string;
}

export interface DesignationPermission {
  id: string;
  designation: string;
  department: string;
  allowedTabs: string[];
  canViewCompanyProgression: boolean;
  canUploadBatchAttendance: boolean;
  canUploadVideos: boolean;
  canManageClients: boolean;
  canProcessPayroll: boolean;
  canManageStaff: boolean;
}

export interface DailyWorkLog {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  employeeCode: string;
  designation: string;
  department: string;
  date: string;
  workType: 'sales' | 'developer' | 'operations' | 'general';

  // Sales specific
  callsMade?: number;
  callsConnected?: number;
  leadsRespondedWell?: number;
  followUpsScheduled?: number;
  dealsPitched?: number;
  closingInvestmentAmount?: number;

  // Developer specific
  tasksCompleted?: string[];
  featuresShipped?: string;
  bugFixes?: string;
  pullRequests?: string;
  hoursSpent?: number;

  // Common notes / narration
  narration: string;
  blockers?: string;
  submittedAt: string;
  managerFeedback?: string;
  status: 'Submitted' | 'Reviewed' | 'Acknowledged';
}

export interface CustomerPaymentReceipt {
  id: string;
  receiptNumber: string;
  tenantId: string;
  tenantName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  depositAmount: number;
  currency: string;
  slabTierName: string;
  annualYieldPercent: number;
  lockInMonths: number;
  maturityDate: string;
  depositDate: string;
  paymentMode: 'Bank Wire / RTGS' | 'Online Transfer' | 'Escrow Deposit' | 'Cheque';
  transactionReference: string;
  advisingStaffName: string;
  advisingStaffCode: string;
  status: 'Confirmed' | 'Pending_Clearing';
  authorizedSignatory: string;
  certificateQrCode?: string;
  notes?: string;
}

export interface SlabTier {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  expectedAnnualYieldPercent: number;
  lockInMonths: number;
  payoutFrequency: 'Monthly' | 'Quarterly' | 'Annual' | 'Maturity';
  staffCommissionPercent: number;
  description: string;
  badgeColor: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Institutional';
}

export interface SlabVersion {
  id: string;
  tenantId: string;
  versionCode: string;
  title: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: 'active' | 'scheduled' | 'archived';
  tiers: SlabTier[];
  approvedBy: string;
  changeNotes: string;
  createdAt: string;
}

export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Half Day'
  | 'Late'
  | 'On Leave'
  | 'Overtime';

export interface AttendanceRecord {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  employeeCode: string;
  department: string;
  date: string;
  inTime: string;
  outTime: string;
  totalHours: number;
  status: AttendanceStatus;
  uploadBatchId?: string;
  uploadedBy: string;
  notes?: string;
}

export interface AttendanceBatch {
  id: string;
  tenantId: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  status: 'completed' | 'processing' | 'review_needed';
  previewRecords: Partial<AttendanceRecord>[];
}

export interface LeaveRequest {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  department: string;
  type: 'Casual' | 'Sick' | 'Earned' | 'Maternity/Paternity';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface TargetCycle {
  id: string;
  tenantId: string;
  name: string;
  period: 'Monthly' | 'Quarterly' | 'Annual';
  startDate: string;
  endDate: string;
  status: 'active' | 'closed';
  totalTargetFund: number;
  totalAchievedFund: number;
}

export interface StaffTarget {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  department: string;
  cycleId: string;
  cycleName: string;
  targetAmount: number;
  achievedAmount: number;
  dealsCount: number;
  status: 'in_progress' | 'met' | 'exceeded';
}

export type IncentiveStatus =
  | 'Pending_Manager'
  | 'Verified_Manager'
  | 'Approved_HR'
  | 'Paid_Payroll'
  | 'Rejected';

export interface IncentiveTransaction {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  clientName: string;
  investmentAmount: number;
  slabTierId: string;
  slabTierName: string;
  slabVersion: string;
  appliedCommissionRate: number;
  calculatedIncentive: number;
  date: string;
  status: IncentiveStatus;
  managerNotes?: string;
  hrNotes?: string;
  payoutCycleMonth: string;
}

export interface PayrollCycle {
  id: string;
  tenantId: string;
  monthYear: string;
  processedDate: string;
  totalEmployees: number;
  totalGrossPayout: number;
  totalIncentivesPaid: number;
  totalNetPayout: number;
  status: 'Draft' | 'Approved' | 'Disbursed';
}

export interface Payslip {
  id: string;
  tenantId: string;
  payrollCycleId: string;
  userId: string;
  userName: string;
  employeeCode: string;
  designation: string;
  department: string;
  monthYear: string;
  workedDays: number;
  paidLeaves: number;
  unpaidLeaves: number;
  grossSalary: number;
  basicPay: number;
  hra: number;
  specialAllowance: number;
  performanceIncentive: number;
  deductionsTotal: number;
  providentFund: number;
  taxDeduction: number;
  attendanceDeduction: number;
  netPayable: number;
  generatedAt: string;
  status: 'Generated' | 'Paid';
  paymentMode: 'Direct Bank Wire' | 'NEFT / RTGS';
}

export type LessonType = 'video' | 'pdf' | 'document' | 'presentation' | 'quiz';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  duration: string;
  contentUrl?: string;
  textContent?: string;
  pdfTitle?: string;
  pdfPages?: number;
  quiz?: QuizQuestion[];
  resources?: { name: string; url: string; size: string }[];
  order: number;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
}

export interface Course {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  thumbnail: string;
  badgeIcon: string;
  description: string;
  instructor: {
    name: string;
    title: string;
    avatar: string;
    bio: string;
  };
  modules: Module[];
  totalDuration: string;
  totalLessons: number;
  enrolledCount: number;
  rating: number;
  passingScorePercent: number;
  skillsCovered: string[];
  targetDepartments: string[];
  mandatoryForNewHires: boolean;
}

export interface UserCourseProgress {
  id: string;
  userId: string;
  courseId: string;
  completedLessonIds: string[];
  quizScores: Record<string, number>;
  isCompleted: boolean;
  completedAt?: string;
  certificateId?: string;
  lastActiveLessonId?: string;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  tenantId: string;
  tenantName: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  issuedDate: string;
  score: number;
  instructorName: string;
  instructorTitle: string;
  grade: 'Distinction' | 'Merit' | 'Pass';
  verificationQrCode: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  timestamp: string;
  isRead: boolean;
  tag: string;
}

export interface AuditEntry {
  id: string;
  tenantId: string;
  actorName: string;
  actorRole: string;
  action: string;
  target: string;
  timestamp: string;
  ipAddress: string;
}
