import React from 'react';
import { Gift, Loader2, XCircle } from 'lucide-react';

import {
  PayrollRecord,
  PayrollAdjustment,
} from '../types/payrollCycle';
import AdjustmentHistory from './AdjustmentHistory';

const BonusModal: React.FC<{
  record: PayrollRecord;
  adjustments: PayrollAdjustment[];
  amount: string;
  reason: string;
  loading: boolean;
  onAmountChange: (
    value: string
  ) => void;
  onReasonChange: (
    value: string
  ) => void;
  onClose: () => void;
  onSave: () => void;
}> = ({
  record,
  adjustments,
  amount,
  reason,
  loading,
  onAmountChange,
  onReasonChange,
  onClose,
  onSave,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">

    <div className="w-full max-w-lg rounded-2xl bg-[#0b0824] border border-emerald-500/30 shadow-2xl">

      <div className="p-5 border-b border-[#231e54] flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <Gift className="w-5 h-5 text-emerald-400" />
          </div>

          <div>

            <h2 className="text-white font-bold">
              Add Bonus
            </h2>

            <p className="text-[11px] text-slate-400 mt-1">
              {record.employeeName}
              {' • '}
              {record.employeeCode}
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

      <div className="p-5 space-y-5">

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">

          <div className="text-[11px] text-amber-300 leading-5">
            This bonus will be submitted for Company Admin approval.
            It will affect the payroll total only after approval.
          </div>

        </div>

        <div>

          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Bonus Amount
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={
              amount
            }
            onChange={event =>
              onAmountChange(
                event.target.value
              )
            }
            placeholder="0.00"
            autoFocus
            className="w-full px-3 py-3 rounded-xl bg-[#09071e] border border-[#2d2770] text-white outline-none focus:border-emerald-500"
          />

        </div>

        <div>

          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Bonus Reason
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
            rows={3}
            placeholder="Example: Performance bonus"
            className="w-full px-3 py-3 rounded-xl bg-[#09071e] border border-[#2d2770] text-white placeholder:text-slate-600 outline-none focus:border-emerald-500 resize-none"
          />

        </div>

        {adjustments.filter(
          adjustment =>
            adjustment.type ===
            'Bonus'
        ).length > 0 && (
          <AdjustmentHistory
            title="Existing Bonuses"
            adjustments={
              adjustments.filter(
                adjustment =>
                  adjustment.type ===
                  'Bonus'
              )
            }
            type="Bonus"
          />
        )}

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
            onSave
          }
          disabled={
            loading
          }
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2"
        >

          {loading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}

          Add Bonus

        </button>

      </div>

    </div>

  </div>
);

export default BonusModal;
