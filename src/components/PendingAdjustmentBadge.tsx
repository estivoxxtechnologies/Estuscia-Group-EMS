import React from 'react';
import { Clock3 } from 'lucide-react';
import { PayrollAdjustment } from '../types/payrollCycle';

const PendingAdjustmentBadge: React.FC<{
  adjustment: PayrollAdjustment;
  canApprove: boolean;
  onClick: () => void;
}> = ({
  adjustment,
  canApprove,
  onClick,
}) => {
  const isBonus =
    adjustment.type ===
    'Bonus';

  const content = (
    <div
      className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border ${
        isBonus
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-rose-500/5 border-rose-500/20'
      }`}
    >

      <div className="flex items-center gap-1.5 min-w-0">

        <Clock3
          className={`w-3 h-3 shrink-0 ${
            isBonus
              ? 'text-emerald-400'
              : 'text-rose-400'
          }`}
        />

        <span className="text-[9px] font-bold text-amber-300 whitespace-nowrap">
          Pending Approval
        </span>

      </div>

      <span
        className={`text-[9px] font-mono font-bold ${
          isBonus
            ? 'text-emerald-300'
            : 'text-rose-300'
        }`}
      >
        {isBonus
          ? '+'
          : '-'}
        ₹
        {Number(
          adjustment.amount ??
            0
        ).toLocaleString()}
      </span>

    </div>
  );

  if (
    !canApprove
  ) {
    return (
      <div>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="w-full text-left hover:opacity-80 transition-opacity"
      title="Click to review this adjustment"
    >
      {content}
    </button>
  );
};

export default PendingAdjustmentBadge;
