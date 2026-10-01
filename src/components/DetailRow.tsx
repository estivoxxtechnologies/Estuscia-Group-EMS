import React from 'react';

const DetailRow: React.FC<{
  label: string;
  value: string;
  valueClass?: string;
}> = ({
  label,
  value,
  valueClass = 'text-white',
}) => (
  <div className="flex items-start justify-between gap-4 px-4 py-3 border-b last:border-b-0 border-[#231e54]">

    <span className="text-xs text-slate-400">
      {label}
    </span>

    <span
      className={`text-xs font-semibold text-right ${valueClass}`}
    >
      {value}
    </span>

  </div>
);

export default DetailRow;
