import React from 'react';

const StatusBadge: React.FC<{
  status: string;
}> = ({
  status,
}) => {
  const styles: Record<
    string,
    string
  > = {
    Draft:
      'bg-slate-500/10 text-slate-300 border-slate-500/30',

    SubmittedByHR:
      'bg-amber-500/10 text-amber-300 border-amber-500/30',

    ApprovedByCompanyAdmin:
      'bg-blue-500/10 text-blue-300 border-blue-500/30',

    Approved:
      'bg-blue-500/10 text-blue-300 border-blue-500/30',

    Processing:
      'bg-purple-500/10 text-purple-300 border-purple-500/30',

    Paid:
      'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',

    Locked:
      'bg-slate-500/10 text-slate-300 border-slate-500/30',

    Rejected:
      'bg-rose-500/10 text-rose-300 border-rose-500/30',
  };

  return (
    <span
      className={`px-2 py-1 rounded text-[10px] font-bold border ${
        styles[status] ||
        styles.Draft
      }`}
    >
      {status}
    </span>
  );
};

/* =========================================================
   SUMMARY
========================================================= */

const Summary: React.FC<{
  label: string;
  value?: number | null;
}> = ({
  label,
  value,
}) => (
  <div>

    <span className="text-[10px] text-slate-500 block">
      {label}
    </span>

    <span className="text-xs font-mono text-slate-200">
      ₹
      {Number(
        value ??
          0
      ).toLocaleString()}
    </span>

  </div>
);

export { StatusBadge, Summary };
