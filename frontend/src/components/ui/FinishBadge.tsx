import React from 'react';

export function getFinishBadgeStyle(pos: number, status: string): string {
   const isDnf = status === 'Retired' || status === 'DNF';
   if (isDnf) return 'bg-red-500/15 text-red-400 border-red-500/30';
   if (pos === 1)
      return 'bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.25)]';
   if (pos === 2) return 'bg-slate-300/20 text-slate-200 border-slate-300/30';
   if (pos === 3) return 'bg-amber-700/20 text-amber-500 border-amber-700/30';
   if (pos <= 10) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
   return 'bg-white/[0.04] text-f1-silver border-white/[0.08]';
}

interface FinishBadgeProps {
   position: number;
   status: string;
   className?: string;
}

const FinishBadge: React.FC<FinishBadgeProps> = ({ position, status, className = '' }) => {
   const isDnf = status === 'Retired' || status === 'DNF';
   return (
      <span
         className={`inline-block px-2.5 py-0.5 rounded-full font-bold border text-[10px] ${getFinishBadgeStyle(
            position,
            status
         )} ${className}`}
      >
         {isDnf ? 'DNF' : `P${position}`}
      </span>
   );
};

export default FinishBadge;
