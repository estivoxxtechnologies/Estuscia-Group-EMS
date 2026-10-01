import React from 'react';
import { Loader2, XCircle } from 'lucide-react';
import { PayrollAdjustment } from '../types/payrollCycle';
import DetailRow from './DetailRow';

const AdjustmentRejectModal: React.FC<{
  adjustment: PayrollAdjustment;
  employeeName: string;
  reason: string;
  loading: boolean;
  onReasonChange: (
    value: string
  ) => void;
  onClose: () => void;
  onReject: () => void;
}> = ({
  adjustment,
  employeeName,
  reason,
  loading,
  onReasonChange,
  onClose,
  onReject,
}) => (
  <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">

    <div className="w-full max-w-lg rounded-2xl bg-[#0b0824] border border-rose-500/30 shadow-2xl">

      <div className="p-5 border-b border-[#231e54] flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">

            <XCircle className="w-5 h-5 text-rose-400" />

          </div>

          <div>

            <h2 className="text-white font-bold">
              Reject Adjustment
            </h2>

            <p className="text-[11px] text-slate-400 mt-1">
              {employeeName}
              {' • '}
              {adjustment.type}
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

        <div className="rounded-xl bg-[#120e38] border border-[#231e54] overflow-hidden">

          <DetailRow
            label="Employee"
            value={
              employeeName
            }
          />

          <DetailRow
            label="Type"
            value={
              adjustment.type
            }
          />

          <DetailRow
            label="Amount"
            value={
              `${adjustment.type === 'Bonus' ? '+' : '-'}₹${Number(
                adjustment.amount ??
                  0
              ).toLocaleString()}`
            }
          />

          <DetailRow
            label="Original Reason"
            value={
              adjustment.reason ||
              '-'
            }
          />

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
            autoFocus
            placeholder="Enter why this bonus/deduction is being rejected..."
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
          Back
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

          Reject Adjustment

        </button>

      </div>

    </div>

  </div>
);

export default AdjustmentRejectModal;
