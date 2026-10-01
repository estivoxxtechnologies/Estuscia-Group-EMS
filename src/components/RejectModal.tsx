import React from 'react';
import { AlertTriangle, Loader2, XCircle } from 'lucide-react';

const RejectModal: React.FC<{
  payrollName: string;
  reason: string;
  loading: boolean;
  onReasonChange: (
    value: string
  ) => void;
  onClose: () => void;
  onReject: () => void;
}> = ({
  payrollName,
  reason,
  loading,
  onReasonChange,
  onClose,
  onReject,
}) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">

    <div className="w-full max-w-lg rounded-2xl bg-[#0b0824] border border-rose-500/30 shadow-2xl">

      <div className="p-5 border-b border-[#231e54] flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <XCircle className="w-5 h-5 text-rose-400" />
          </div>

          <div>

            <h2 className="text-white font-bold">
              Reject Payroll
            </h2>

            <p className="text-[11px] text-slate-400 mt-1">
              {payrollName}
            </p>

          </div>

        </div>

        <button
          onClick={
            onClose
          }
          disabled={
            loading
          }
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
        </button>

      </div>

      <div className="p-5 space-y-4">

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">

          <div className="flex items-start gap-2">

            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />

            <div className="text-[11px] text-amber-300 leading-5">
              The payroll will return to Rejected status.
              HR can correct the payroll and submit it again.
            </div>

          </div>

        </div>

        <div>

          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Rejection Reason
          </label>

          <textarea
            value={
              reason
            }
            onChange={event =>
              onReasonChange(
                event.target.value
              )
            }
            rows={4}
            placeholder="Enter the reason for rejecting this payroll..."
            autoFocus
            className="w-full px-3 py-3 rounded-xl bg-[#09071e] border border-[#2d2770] text-white placeholder:text-slate-600 outline-none focus:border-rose-500 resize-none"
          />

        </div>

      </div>

      <div className="p-5 border-t border-[#231e54] flex justify-end gap-2">

        <button
          onClick={
            onClose
          }
          disabled={
            loading
          }
          className="px-4 py-2 rounded-lg bg-[#17123d] border border-[#2d2770] text-slate-300 text-xs font-semibold disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          onClick={
            onReject
          }
          disabled={
            loading
          }
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2"
        >

          {loading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}

          Reject Payroll

        </button>

      </div>

    </div>

  </div>
);

/* =========================================================
   BONUS MODAL
========================================================= */

export default RejectModal;
