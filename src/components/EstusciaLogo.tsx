import React from 'react';

interface EstusciaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  variant?: 'full' | 'icon-only' | 'light';
}

export const EstusciaLogo: React.FC<EstusciaLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  variant = 'full',
}) => {
  const iconBoxSize = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }[size];

  const titleSize = {
    sm: 'text-xs font-bold tracking-tight',
    md: 'text-sm font-bold tracking-tight',
    lg: 'text-base font-bold tracking-tight',
    xl: 'text-xl font-bold tracking-tight',
  }[size];

  const subtitleSize = {
    sm: 'text-[9px] tracking-wider',
    md: 'text-[10px] tracking-wider',
    lg: 'text-[11px] tracking-wider',
    xl: 'text-xs tracking-wider',
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`} id="estuscia-brand-logo">
      {/* Brand Icon Box with Glow */}
      <div
        className={`${iconBoxSize} bg-[#5C3FE0] rounded-lg flex items-center justify-center shadow-lg shadow-[#5C3FE0]/30 shrink-0`}
      >
        <span className="text-white font-bold text-xl leading-none">E</span>
      </div>

      {/* Brand Name & BLMP Platform Tag */}
      {variant !== 'icon-only' && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`${titleSize} text-white font-bold uppercase tracking-tight`}>
              ESTUSCIA
            </span>
          </div>
          {showSubtitle && (
            <span
              className={`${subtitleSize} text-[#5C3FE0] font-semibold uppercase tracking-wider mt-0.5`}
            >
              BLMP Platform
            </span>
          )}
        </div>
      )}
    </div>
  );
};

