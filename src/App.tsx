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

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'daily_work':
        return <DailyWorkView />;
      case 'attendance':
        return <AttendanceView />;
      case 'targets_incentives':
        return <TargetsIncentivesView />;
      case 'receipts_slabs':
      case 'slabs':
        return <ReceiptsSlabsView />;
      case 'payroll':
        return <PayrollView />;
      case 'staff':
        return <StaffView />;
      case 'knowledge_hub':
      case 'lms_academy':
        return <KnowledgeHubView />;
      case 'audit_settings':
        return <AuditTenantView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#040312] text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Navigation (Desktop & Mobile Slide-out) */}
      <Sidebar />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Sticky Header */}
        <Header />

        {/* Dynamic Main View Area */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 pb-20 lg:pb-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            {renderActiveView()}
          </div>
        </main>

        {/* Mobile Bottom Quick Navigation Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#09081E]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-2 z-30">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'dashboard' ? 'text-[#5C3FE0]' : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 font-medium">Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('daily_work')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'daily_work' ? 'text-[#5C3FE0]' : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 font-medium">Work</span>
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'attendance' ? 'text-[#5C3FE0]' : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 font-medium">Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab('receipts_slabs')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'receipts_slabs' || activeTab === 'slabs' ? 'text-[#5C3FE0]' : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            <Receipt className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 font-medium">Slips</span>
          </button>
          <button
            onClick={() => setActiveTab('knowledge_hub')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'knowledge_hub' || activeTab === 'lms_academy' ? 'text-[#5C3FE0]' : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            <Video className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 font-medium">Academy</span>
          </button>
        </div>
      </div>

      {/* Orchestrated Application Modals */}
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

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthView />
          </PublicRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        }
      />

      {/* Any unknown URL goes back to the main route */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}


