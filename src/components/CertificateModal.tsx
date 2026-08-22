import React, { useEffect } from 'react';
import { X, Download, Printer, Share2, Award, ShieldCheck, CheckCircle2, QrCode } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { EstusciaLogo } from './EstusciaLogo';

export const CertificateModal: React.FC = () => {
  const { selectedCertificateForView, setSelectedCertificateForView } = useApp();

  useEffect(() => {
    if (selectedCertificateForView) {
      // Trigger subtle celebratory confetti burst
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#5C3FE0', '#A78BFA', '#10B981', '#F59E0B'],
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [selectedCertificateForView]);

  if (!selectedCertificateForView) return null;

  const cert = selectedCertificateForView;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#08061c] border border-[#2d2770] rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#0e0b2e] border-b border-[#231e54]">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-white">Verified LMS Certificate</span>
            <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
              GRADE: {cert.grade.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a144b] hover:bg-[#251d68] border border-[#2d2770] text-xs font-medium text-slate-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={() => setSelectedCertificateForView(null)}
              className="p-1.5 rounded-lg hover:bg-[#1f1857] text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Canvas Frame (High Quality Vector Stylized Certificate) */}
        <div className="p-6 md:p-10 bg-gradient-to-br from-[#0c0926] via-[#070517] to-[#040312]">
          <div className="relative border-4 border-[#2d2770] rounded-xl p-8 md:p-12 bg-[#09071e]/90 text-center shadow-inner overflow-hidden">
            {/* Elegant Corner Decorative Accents */}
            <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-[#5C3FE0]" />
            <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-[#5C3FE0]" />
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-[#5C3FE0]" />
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-[#5C3FE0]" />

            {/* Subtle Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <EstusciaLogo size="xl" showSubtitle={false} />
            </div>

            {/* Certificate Header */}
            <div className="flex justify-center mb-4">
              <EstusciaLogo size="lg" showSubtitle={true} />
            </div>

            <div className="text-[11px] uppercase tracking-[0.3em] text-[#A78BFA] font-bold mt-2">
              Executive Academy & Governance Accreditation
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-4 font-serif tracking-wide">
              Certificate of Professional Completion
            </h1>

            <p className="text-xs text-slate-400 mt-2 italic">
              This credential is authenticated and awarded under the Estuscia Learning Management System
            </p>

            {/* Recipient Name */}
            <div className="my-6">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Presented to</span>
              <div className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#C4B5FD] font-serif py-1">
                {cert.userName}
              </div>
              <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-[#5C3FE0] to-transparent mx-auto mt-1" />
            </div>

            {/* Course Title */}
            <p className="text-xs md:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              for successfully completing all rigorous course modules, case examinations, and passing with a final score of{' '}
              <span className="text-emerald-400 font-bold font-mono">{cert.score}%</span> in:
            </p>

            <div className="my-4 px-6 py-2.5 bg-[#140f3d]/70 border border-[#5C3FE0]/40 rounded-xl inline-block max-w-2xl text-sm md:text-base font-bold text-white shadow-lg">
              {cert.courseTitle}
            </div>

            {/* Signatures, QR and Date Footers */}
            <div className="mt-8 pt-6 border-t border-[#231e54]/80 grid grid-cols-1 md:grid-cols-3 gap-6 items-end text-left">
              {/* Left: Issue Date & Serial */}
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Date of Issue</div>
                <div className="text-xs font-semibold text-white mt-0.5">{cert.issuedDate}</div>
                <div className="text-[10px] font-mono text-[#A78BFA] mt-1.5">
                  ID: {cert.certificateNumber}
                </div>
              </div>

              {/* Center: Gold Security Seal & QR Code */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 mb-1">
                  <div className="w-full h-full rounded-full bg-[#0d0b26] flex items-center justify-center text-amber-400">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                </div>
                <span className="text-[9px] text-amber-300 uppercase tracking-widest font-mono">
                  AUTHENTICATED
                </span>
              </div>

              {/* Right: Instructor Signature */}
              <div className="text-left md:text-right">
                <div className="font-serif italic text-base text-slate-200 tracking-wider">
                  {cert.instructorName}
                </div>
                <div className="w-32 h-0.5 bg-slate-600 ml-auto my-1" />
                <div className="text-[10px] font-semibold text-white">{cert.instructorName}</div>
                <div className="text-[9px] text-slate-400">{cert.instructorTitle}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Link Bar */}
        <div className="px-6 py-3 bg-[#0a0720] border-t border-[#231e54] flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Digital Signature Verified on Estuscia Sovereign Blockchain & HR Registry</span>
          </div>
          <span className="font-mono text-[11px] text-[#A78BFA]">
            {cert.verificationQrCode}
          </span>
        </div>
      </div>
    </div>
  );
};
