import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EstusciaLogo } from './EstusciaLogo';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  User,
  Calendar,
  Building,
  CreditCard,
  QrCode,
  Sparkles,
  Lock,
} from 'lucide-react';

export const CustomerReceiptModal: React.FC = () => {
  const {
    selectedReceiptForView,
    setSelectedReceiptForView,
    isCreateReceiptModalOpen,
    setIsCreateReceiptModalOpen,
    generateCustomerReceipt,
    currentTenant,
    currentUser,
    activeSlabVersion,
  } = useApp();

  // Create Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [depositAmount, setDepositAmount] = useState<number>(100000);
  const [selectedTierId, setSelectedTierId] = useState(activeSlabVersion.tiers[1]?.id || activeSlabVersion.tiers[0]?.id || 'tier-2');
  const [paymentMode, setPaymentMode] = useState<'Bank Wire / RTGS' | 'Escrow Deposit' | 'Online Banking' | 'Cheque'>('Bank Wire / RTGS');
  const [transactionRef, setTransactionRef] = useState(`TXN-${Date.now().toString().slice(-8)}`);
  const [paymentStatus, setPaymentStatus] = useState<'Confirmed' | 'Escrow_Verified' | 'Under_Clearance'>('Confirmed');

  const selectedTier = activeSlabVersion.tiers.find((t) => t.id === selectedTierId) || activeSlabVersion.tiers[0];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const annualYield = selectedTier?.annualYieldPercent || 15.5;
    const lockInMonths = selectedTier?.lockInMonths || 12;
    const projectedReturn = Math.round(depositAmount * (1 + (annualYield / 100) * (lockInMonths / 12)));

    const created = generateCustomerReceipt({
      tenantId: currentTenant.id,
      customerName,
      customerEmail,
      customerPhone,
      depositAmount: Number(depositAmount),
      currency: 'USD ($)',
      slabTierName: selectedTier.name,
      annualYieldPercent: annualYield,
      lockInMonths,
      projectedReturnAmount: projectedReturn,
      paymentMode,
      transactionRef,
      issuedDate: new Date().toISOString().substring(0, 10),
      maturityDate: new Date(Date.now() + lockInMonths * 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      advisingStaffName: currentUser.name,
      advisingStaffCode: currentUser.employeeCode,
      status: paymentStatus,
    });

    setIsCreateReceiptModalOpen(false);
    setSelectedReceiptForView(created);
  };

  const handlePrint = () => {
    window.print();
  };

  // If neither view nor create modal is open, return null
  if (!selectedReceiptForView && !isCreateReceiptModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white">
      
      {/* View / Print Official Customer Deposit Certificate Slip */}
      {selectedReceiptForView && (
        <div className="relative w-full max-w-3xl bg-[#09081E] border border-white/20 rounded-2xl shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:my-0 print:bg-white print:text-black">
          
          {/* Action Bar (Hidden on print) */}
          <div className="px-6 py-3.5 border-b border-white/10 flex items-center justify-between bg-black/40 print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Official Customer Deposit Slip & Investment Certificate
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                {selectedReceiptForView.receiptNumber}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
              <button
                onClick={() => setSelectedReceiptForView(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Certificate Body */}
          <div className="p-8 sm:p-10 space-y-6 relative overflow-hidden bg-gradient-to-b from-[#0e0c2b] to-[#080718] print:from-white print:to-white print:p-8">
            
            {/* Watermark Crest */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none print:opacity-[0.06]">
              <EstusciaLogo size="lg" />
            </div>

            {/* Header / Brand */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 print:border-slate-300">
              <div className="flex items-center gap-3.5">
                <EstusciaLogo size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-white print:text-black">
                      ESTUSCIA CAPITAL
                    </h2>
                    <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-[#5C3FE0]/30 text-purple-300 border border-[#5C3FE0]/40 print:text-purple-700 print:border-purple-300">
                      OFFICIAL PAYMENT RECEIPT
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 print:text-gray-600">
                    Sovereign Wealth & Private Investment Custody
                  </p>
                </div>
              </div>

              <div className="text-right text-xs space-y-0.5 print:text-gray-700">
                <p className="font-mono text-purple-300 font-bold print:text-purple-900">
                  {selectedReceiptForView.receiptNumber}
                </p>
                <p className="text-gray-400 print:text-gray-600">Date: {selectedReceiptForView.issuedDate}</p>
                <p className="text-emerald-400 font-semibold print:text-emerald-700">
                  Status: {selectedReceiptForView.status.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Investor & Deposit Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Customer Box */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 print:bg-slate-50 print:border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 print:text-purple-700 block">
                  Depositor / Investor Information
                </span>
                <p className="text-base font-bold text-white print:text-black">
                  {selectedReceiptForView.customerName}
                </p>
                <p className="text-xs text-gray-400 print:text-gray-600">
                  Email: {selectedReceiptForView.customerEmail}
                </p>
                <p className="text-xs text-gray-400 print:text-gray-600">
                  Phone: {selectedReceiptForView.customerPhone}
                </p>
                <p className="text-xs text-gray-400 print:text-gray-600">
                  Advising Executive: {selectedReceiptForView.advisingStaffName} ({selectedReceiptForView.advisingStaffCode})
                </p>
              </div>

              {/* Transaction Box */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 print:bg-slate-50 print:border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 print:text-emerald-700 block">
                  Deposit & Custody Breakdown
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-gray-400 print:text-gray-600">Principal Deposit:</span>
                  <span className="text-lg font-bold text-white print:text-black">
                    ${selectedReceiptForView.depositAmount.toLocaleString()} USD
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-gray-400 print:text-gray-600">Selected Slab Tier:</span>
                  <span className="text-purple-300 font-semibold print:text-purple-900">
                    {selectedReceiptForView.slabTierName}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-gray-400 print:text-gray-600">Annual Return (Yield):</span>
                  <span className="text-emerald-400 font-bold print:text-emerald-700">
                    {selectedReceiptForView.annualYieldPercent}% p.a.
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-gray-400 print:text-gray-600">Lock-in Period:</span>
                  <span className="text-white font-medium print:text-black">
                    {selectedReceiptForView.lockInMonths} Months (Maturity: {selectedReceiptForView.maturityDate})
                  </span>
                </div>
              </div>

            </div>

            {/* Projected Return Highlight */}
            <div className="p-4 rounded-xl bg-[#5C3FE0]/15 border border-[#5C3FE0]/30 flex flex-col sm:flex-row items-center justify-between gap-3 print:bg-purple-50 print:border-purple-200">
              <div>
                <span className="text-xs font-semibold text-purple-300 print:text-purple-800">
                  Projected Maturity Payout (Principal + Accrued Yield)
                </span>
                <p className="text-xs text-gray-400 print:text-gray-600">
                  Payment Mode: {selectedReceiptForView.paymentMode} • Ref: {selectedReceiptForView.transactionRef}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-white print:text-purple-950">
                  ${selectedReceiptForView.projectedReturnAmount.toLocaleString()} USD
                </span>
              </div>
            </div>

            {/* Signatures and Cryptographic Seal */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 print:border-slate-300">
              <div className="flex items-center gap-3 text-xs text-gray-400 print:text-gray-600">
                <div className="p-2 rounded-lg bg-black/40 border border-white/10 print:bg-white print:border-slate-300">
                  <QrCode className="w-10 h-10 text-white print:text-black" />
                </div>
                <div>
                  <p className="font-semibold text-white print:text-black">Cryptographically Verified</p>
                  <p className="text-[11px] font-mono text-gray-500">Hash: 0x8F9a...4B2c</p>
                  <p className="text-[10px] text-gray-500">Estuscia Ledger Certified</p>
                </div>
              </div>

              <div className="text-center sm:text-right space-y-1">
                <div className="h-8 flex items-center justify-center sm:justify-end">
                  <span className="font-serif italic text-lg text-purple-300 print:text-purple-900">
                    Alexander Sterling
                  </span>
                </div>
                <div className="w-48 h-[1px] bg-white/20 mx-auto sm:ml-auto print:bg-slate-300" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 print:text-gray-600">
                  Authorized Investment Registrar
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Create New Customer Receipt Form */}
      {isCreateReceiptModalOpen && !selectedReceiptForView && (
        <div className="relative w-full max-w-xl bg-[#09081E] border border-white/15 rounded-2xl shadow-2xl overflow-hidden my-8">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Issue Customer Payment Slip & Investment Certificate
                </h2>
                <p className="text-xs text-gray-400">
                  Generate an official deposit certificate and receipt for your investor client.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateReceiptModalOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
            
            {/* Customer Information */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-purple-300 block">Investor / Customer Details</span>
              
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                  Customer / Investor Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Sheikh Faisal Al-Nuaimi"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Customer Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="faisal@emiratesholdings.ae"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Phone / Contact *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+971 50 888 7766"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                  />
                </div>
              </div>
            </div>

            {/* Deposit & Investment Slab */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <span className="text-xs font-bold text-emerald-400 block">Deposit Amount & Investment Slab</span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Deposit Amount ($ USD) *
                  </label>
                  <input
                    type="number"
                    min="5000"
                    step="1000"
                    required
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-sm font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Select Investment Slab Tier *
                  </label>
                  <select
                    value={selectedTierId}
                    onChange={(e) => setSelectedTierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                  >
                    {activeSlabVersion.tiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.annualYieldPercent}% p.a. • {t.lockInMonths} Mo)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Yield Preview */}
              <div className="p-3 rounded-xl bg-[#5C3FE0]/10 border border-[#5C3FE0]/25 text-xs flex items-center justify-between">
                <div>
                  <span className="text-gray-400 block text-[11px]">Calculated Annual Yield:</span>
                  <span className="font-bold text-emerald-400">{selectedTier?.annualYieldPercent}% p.a.</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 block text-[11px]">Estimated Maturity Value:</span>
                  <span className="font-bold text-white">
                    ${Math.round(depositAmount * (1 + ((selectedTier?.annualYieldPercent || 15) / 100) * ((selectedTier?.lockInMonths || 12) / 12))).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Mode & Settlement */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <span className="text-xs font-bold text-cyan-300 block">Payment & Settlement Confirmation</span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                  >
                    <option value="Bank Wire / RTGS">Bank Wire / RTGS</option>
                    <option value="Escrow Deposit">Escrow Deposit</option>
                    <option value="Online Banking">Online Banking</option>
                    <option value="Cheque">Bank Demand Draft / Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                  >
                    <option value="Confirmed">Confirmed & Received</option>
                    <option value="Escrow_Verified">Escrow Verified</option>
                    <option value="Under_Clearance">Under Clearance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                  Bank Reference / Transaction Hash
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. TXN-99887766 or SWIFT Ref"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#5C3FE0]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateReceiptModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Official Payment Slip</span>
              </button>
            </div>
          </form>

        </div>
      )}

    </div>
  );
};
