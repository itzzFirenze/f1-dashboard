import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PositionDeltaProps {
   delta: number;
   sizeClass?: string;
   iconClass?: string;
}

const PositionDelta: React.FC<PositionDeltaProps> = ({
   delta,
   sizeClass = 'text-[11px]',
   iconClass = 'w-3 h-3',
}) => {
   if (delta > 0) {
      return (
         <span className={`inline-flex items-center gap-0.5 text-emerald-400 font-mono font-bold ${sizeClass}`}>
            <TrendingUp className={iconClass} />
            +{delta}
         </span>
      );
   }
   if (delta < 0) {
      return (
         <span className={`inline-flex items-center gap-0.5 text-red-400 font-mono font-bold ${sizeClass}`}>
            <TrendingDown className={iconClass} />
            {delta}
         </span>
      );
   }
   return (
      <span className={`inline-flex items-center gap-0.5 text-f1-silver/40 font-mono font-bold ${sizeClass}`}>
         <Minus className={iconClass} />
         0
      </span>
   );
};

export default PositionDelta;
