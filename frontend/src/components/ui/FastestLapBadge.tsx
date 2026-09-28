import React from 'react';
import { Zap } from 'lucide-react';

interface FastestLapBadgeProps {
   show: boolean;
   variant?: 'full' | 'short';
}

const FastestLapBadge: React.FC<FastestLapBadgeProps> = ({ show, variant = 'full' }) => {
   if (!show) return null;

   return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px]">
         <Zap className="w-3 h-3" />
         {variant === 'full' ? 'Fastest Lap' : 'FL'}
      </span>
   );
};

export default FastestLapBadge;
