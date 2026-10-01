import React from 'react';
import { PayrollAdjustment } from '../types/payrollCycle';

const AdjustmentHistory: React.FC<{
  title: string;
  adjustments: PayrollAdjustment[];
  type:
    | 'Bonus'
    | 'Deduction';
}> = ({
  title,
  adjustments,
  type,
}) => (
  <div>

    <div className="text-xs font-semibold text-slate-300 mb-2">
      {title}
    </div>

    <div className="space-y-2 max-h-32 overflow-y-auto">

      {adjustments.map(
        adjustment => (
          <div
            key={
              adjustment.id
            }
            className="flex items-center justify-between p-3 rounded-lg bg-[#120e38] border border-[#231e54]"
          >

            <div>

              <div className="text-xs text-white font-semibold">
                {adjustment.reason}
              </div>

              <div className="text-[10px] text-slate-500">
                {adjustment.type}
              </div>

            </div>

            <div
              className={`text-xs font-bold ${
                type ===
                'Bonus'
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >

              {type ===
              'Bonus'
                ? '+'
                : '-'}

              ₹
              {Number(
                adjustment.amount ??
                  0
              ).toLocaleString()}

            </div>

          </div>
        )
      )}

    </div>

  </div>
);

export default AdjustmentHistory;
