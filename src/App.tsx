import React from 'react';

import { AppProvider, useApp } from './context/AppContext';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { DailyWorkView } from './components/DailyWorkView';
import { AttendanceView } from './components/AttendanceView';
import { StaffView } from './components/StaffView';
import { TargetsIncentivesView } from './components/TargetsIncentivesView';
import { ReceiptsSlabsView } from './components/ReceiptsSlabsView';
import { PayrollView } from './components/PayrollView';
import { KnowledgeHubView } from './components/KnowledgeHubView';
import { AuditTenantView } from './components/AuditTenantView';
import { DailyWorkModal } from './components/DailyWorkModal';
import { CustomerReceiptModal } from './components/CustomerReceiptModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { CertificateModal } from './components/CertificateModal';
import { PayslipModal } from './components/PayslipModal';
import { BatchUploadModal } from './components/BatchUploadModal';
import { LogDealModal } from './components/LogDealModal';
import { AddEmployeeModal } from './components/AddEmployeeModal';

import { BranchManagementView } from './components/BranchManagementView';
import { TenantView } from './components/TenantView';
import { CompanyAdminManagementView } from './components/CompanyAdminManagementView';

import {
  LayoutDashboard,
  PhoneCall,
  CalendarCheck,
  Receipt,
  Video,
} from 'lucide-react';

import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import TenantPaymentView from './components/TenantPaymentView';
import ProfileView from './components/ProfileView';
import MySalesLeadsView from './components/MySalesLeadsView';
import SeniorSalesLeadsView from './components/SeniorSalesLeadsView';
import SeniorDeveloperWorkView from './components/SeniorDeveloperWorkView';
import JuniorDeveloperWorkView from './components/JuniorDeveloperWorkView';
import CompanyDetailsView from './components/CompanyDetailsView';


// ============================================================
// APP CONTENT
// ============================================================

const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
  } = useApp();


  // ==========================================================
  // RENDER ACTIVE VIEW
  // ==========================================================

  const renderActiveView = () => {
    switch (activeTab) {

      // ------------------------------------------------------
      // DASHBOARD
      // ------------------------------------------------------

      case 'dashboard':
        if (
          currentUser?.roleName?.toLowerCase() ===
          'super_admin'
        ) {
          return <SuperAdminDashboard />;
        }

        return <DashboardView />;


      // ------------------------------------------------------
      // DAILY WORK
      // ------------------------------------------------------

      // case 'daily_work':
      //   return <DailyWorkView />;


      // ------------------------------------------------------
      // ATTENDANCE
      // ------------------------------------------------------

      case 'attendance':
        return <AttendanceView />;


      // ------------------------------------------------------
      // TARGETS & INCENTIVES
      // ------------------------------------------------------

      // case 'targets_incentives':
      //   return <TargetsIncentivesView />;


      // ------------------------------------------------------
      // RECEIPTS / SLABS
      // ------------------------------------------------------

      case 'receipts_slabs':
      case 'slabs':
        return <ReceiptsSlabsView />;


      // ------------------------------------------------------
      // PAYROLL
      // ------------------------------------------------------

      case 'payroll':
        return <PayrollView />;


      // ------------------------------------------------------
      // STAFF
      // ------------------------------------------------------

      case 'staff':
        return <StaffView />;


      // ------------------------------------------------------
      // KNOWLEDGE HUB
      // ------------------------------------------------------

      case 'knowledge_hub':
      case 'lms_academy':
        return <KnowledgeHubView />;


      // ------------------------------------------------------
      // AUDIT / SETTINGS
      // ------------------------------------------------------

      case 'audit_settings':
        return <AuditTenantView />;


      // ------------------------------------------------------
      // TENANTS
      // ------------------------------------------------------

      case 'tenants':
        return <TenantView />;


      // ------------------------------------------------------
      // BRANCH MANAGEMENT
      // ------------------------------------------------------

      case 'branch_management':
        return <BranchManagementView />;


      // ------------------------------------------------------
      // COMPANY ADMIN MANAGEMENT
      //
      // IMPORTANT:
      // CompanyAdminManagementView loads its own tenants.
      // We do NOT pass tenants from AppContent.
      //
      // This allows the page to:
      // - Load all tenants
      // - Search tenants
      // - Show each tenant as a card
      // - Load company admins inside each tenant
      // - Add a company admin directly to that tenant
      // ------------------------------------------------------

      case 'company_admin_management':
        return <CompanyAdminManagementView />;


      // ------------------------------------------------------
      // TENANT PAYMENT
      // ------------------------------------------------------

      case 'tenant_payment':
        return <TenantPaymentView />;


      // ------------------------------------------------------
      // PROFILE
      // ------------------------------------------------------

      case 'profile':
        return <ProfileView />;


      // ------------------------------------------------------
      // COMPANY DETAILS
      // ------------------------------------------------------

      case 'company_details':
        return <CompanyDetailsView />;


      // ------------------------------------------------------
      // SALES LEADS
      // ------------------------------------------------------

      // case 'sales_leads': {
      //   const isSeniorSales =
      //     currentUser?.roleName?.toLowerCase() ===
      //       'sales_staff' &&
      //     currentUser?.designation?.toLowerCase() ===
      //       'senior';

      //   return isSeniorSales
      //     ? <SeniorSalesLeadsView />
      //     : <MySalesLeadsView currentUser={currentUser} />;
      // }


      // ------------------------------------------------------
      // DEVELOPER WORK
      // ------------------------------------------------------

      // case 'developer_work': {
      //   const isSeniorDeveloper =
      //     currentUser?.roleName?.toLowerCase() ===
      //       'developer' &&
      //     currentUser?.designation?.toLowerCase() ===
      //       'senior';

      //   return isSeniorDeveloper
      //     ? <SeniorDeveloperWorkView />
      //     : <JuniorDeveloperWorkView />;
      // }


      // ------------------------------------------------------
      // DEFAULT
      // ------------------------------------------------------

      default:
        return <DashboardView />;
    }
  };


  // ==========================================================
  // MAIN APPLICATION LAYOUT
  // ==========================================================

  return (
    <div className="flex h-screen w-full bg-[#040312] text-slate-100 font-sans overflow-hidden">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <Sidebar />


      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* ----------------------------------------------------
            HEADER
        ---------------------------------------------------- */}

        <Header />


        {/* ----------------------------------------------------
            MAIN VIEW AREA
        ---------------------------------------------------- */}

        <main className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 pb-20 lg:pb-6 custom-scrollbar">

          <div className="max-w-7xl mx-auto w-full">
            {renderActiveView()}
          </div>

        </main>


        {/* ====================================================
            MOBILE BOTTOM NAVIGATION
        ==================================================== */}

        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#09081E]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-2 z-30">

          {/* --------------------------------------------------
              DASHBOARD
          -------------------------------------------------- */}

          <button
            onClick={() =>
              setActiveTab('dashboard')
            }
            className={`
              flex flex-col items-center justify-center
              py-1 px-2.5 rounded-lg
              transition-colors cursor-pointer
              ${
                activeTab === 'dashboard'
                  ? 'text-[#5C3FE0]'
                  : 'text-gray-400 hover:text-gray-200'
              }
            `}
          >
            <LayoutDashboard className="w-4 h-4" />

            <span className="text-[10px] mt-0.5 font-medium">
              Overview
            </span>
          </button>


          {/* --------------------------------------------------
              DAILY WORK
          -------------------------------------------------- */}

          <button
            onClick={() =>
              setActiveTab('daily_work')
            }
            className={`
              flex flex-col items-center justify-center
              py-1 px-2.5 rounded-lg
              transition-colors cursor-pointer
              ${
                activeTab === 'daily_work'
                  ? 'text-[#5C3FE0]'
                  : 'text-gray-400 hover:text-gray-200'
              }
            `}
          >
            <PhoneCall className="w-4 h-4" />

            <span className="text-[10px] mt-0.5 font-medium">
              Work
            </span>
          </button>


          {/* --------------------------------------------------
              ATTENDANCE
          -------------------------------------------------- */}

          <button
            onClick={() =>
              setActiveTab('attendance')
            }
            className={`
              flex flex-col items-center justify-center
              py-1 px-2.5 rounded-lg
              transition-colors cursor-pointer
              ${
                activeTab === 'attendance'
                  ? 'text-[#5C3FE0]'
                  : 'text-gray-400 hover:text-gray-200'
              }
            `}
          >
            <CalendarCheck className="w-4 h-4" />

            <span className="text-[10px] mt-0.5 font-medium">
              Attendance
            </span>
          </button>


          {/* --------------------------------------------------
              RECEIPTS / SLABS
          -------------------------------------------------- */}

          <button
            onClick={() =>
              setActiveTab('receipts_slabs')
            }
            className={`
              flex flex-col items-center justify-center
              py-1 px-2.5 rounded-lg
              transition-colors cursor-pointer
              ${
                activeTab === 'receipts_slabs' ||
                activeTab === 'slabs'
                  ? 'text-[#5C3FE0]'
                  : 'text-gray-400 hover:text-gray-200'
              }
            `}
          >
            <Receipt className="w-4 h-4" />

            <span className="text-[10px] mt-0.5 font-medium">
              Slips
            </span>
          </button>


          {/* --------------------------------------------------
              KNOWLEDGE HUB
          -------------------------------------------------- */}

          <button
            onClick={() =>
              setActiveTab('knowledge_hub')
            }
            className={`
              flex flex-col items-center justify-center
              py-1 px-2.5 rounded-lg
              transition-colors cursor-pointer
              ${
                activeTab === 'knowledge_hub' ||
                activeTab === 'lms_academy'
                  ? 'text-[#5C3FE0]'
                  : 'text-gray-400 hover:text-gray-200'
              }
            `}
          >
            <Video className="w-4 h-4" />

            <span className="text-[10px] mt-0.5 font-medium">
              Academy
            </span>
          </button>

        </div>
      </div>


      {/* ======================================================
          GLOBAL MODALS
      ====================================================== */}

      <DailyWorkModal />

      <CustomerReceiptModal />

      <GlobalSearchModal />

      <CertificateModal />

      <PayslipModal />

      <BatchUploadModal />

      <LogDealModal />

      <AddEmployeeModal />

    </div>
  );
};


// ============================================================
// ROOT APP
// ============================================================

export default function App() {
  return (
    <Routes>

      {/* ======================================================
          LOGIN
      ====================================================== */}

      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthView />
          </PublicRoute>
        }
      />


      {/* ======================================================
          PROTECTED APPLICATION
      ====================================================== */}

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        }
      />


      {/* ======================================================
          UNKNOWN ROUTE
      ====================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}