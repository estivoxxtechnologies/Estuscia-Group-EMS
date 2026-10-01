import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Gift,
  Loader2,
  MinusCircle,
  XCircle,
} from 'lucide-react';
import { PayrollAdjustment } from '../types/payrollCycle';
import DetailRow from './DetailRow';

const AdjustmentApprovalModal: React.FC<{
  adjustment: PayrollAdjustment;
  employeeName: string;
  loading: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}> = ({
  adjustment,
  employeeName,
  loading,
  onClose,
  onApprove,
  onReject,
}) => {
  const isBonus =
    adjustment.type ===
    'Bonus';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">

      <div className="w-full max-w-lg rounded-2xl bg-[#0b0824] border border-[#2d2770] shadow-2xl">

        <div className="p-5 border-b border-[#231e54] flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div
              className={`p-2 rounded-xl border ${
                isBonus
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              {isBonus ? (
                <Gift className="w-5 h-5 text-emerald-400" />
              ) : (
                <MinusCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>

            <div>

              <h2 className="text-white font-bold">
                Review Adjustment
              </h2>

              <p className="text-[11px] text-slate-400 mt-1">
                Company Admin approval required
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
                `${isBonus ? '+' : '-'}₹${Number(
                  adjustment.amount ??
                    0
                ).toLocaleString()}`
              }
              valueClass={
                isBonus
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }
            />

            <DetailRow
              label="Status"
              value="Pending Approval"
              valueClass="text-amber-300"
            />

            <DetailRow
              label="Reason"
              value={
                adjustment.reason ||
                '-'
              }
            />

          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">

            <div className="flex items-start gap-2">

              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />

              <div className="text-[11px] text-amber-300 leading-5">

                This adjustment is currently excluded from
                the employee's Net Salary. Approving it will
                update the payroll totals.

              </div>

            </div>

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
            className="px-4 py-2 rounded-lg bg-[#17123d] border border-[#2d2770] text-slate-300 hover:text-white text-xs font-semibold disabled:opacity-50"
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
            className="px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/15 text-xs font-bold flex items-center gap-2 disabled:opacity-50"
          >

            <XCircle className="w-3.5 h-3.5" />

            Reject

          </button>

          <button
            onClick={
              onApprove
            }
            disabled={
              loading
            }
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"
          >

            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}

            Approve

          </button>

        </div>

      </div>

    </div>
  );
};

/* =========================================================
   ADJUSTMENT REJECT MODAL
========================================================= */

export default AdjustmentApprovalModal;
