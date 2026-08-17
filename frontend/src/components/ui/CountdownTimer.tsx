import React from 'react';
import { useCountdown } from '../../hooks/useCountdown';

interface CountdownTimerProps {
   targetDate: string;
}

/** Live countdown timer with futuristic LED segment readout. */
const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
   const { days, hours, minutes, seconds, total } = useCountdown(targetDate);

   if (total <= 0) {
      return (
         <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-f1-red/10 border border-f1-red/30 shadow-[0_0_15px_rgba(225,6,0,0.2)]">
            <div className="w-2.5 h-2.5 bg-f1-red rounded-full animate-ping" />
            <span className="text-f1-red-light font-display font-black tracking-widest text-sm uppercase">
               TRACK SESSION LIVE
            </span>
         </div>
      );
   }

   const units = [
      { value: days, label: 'DAYS' },
      { value: hours, label: 'HOURS' },
      { value: minutes, label: 'MIN' },
      { value: seconds, label: 'SEC' },
   ];

   return (
      <div className="flex items-center gap-2 sm:gap-3">
         {units.map(({ value, label }, i) => (
            <React.Fragment key={label}>
               <div className="flex flex-col items-center">
                  <div className="led-digit-box px-2.5 py-1.5 sm:px-3 sm:py-2 min-w-[50px] sm:min-w-[62px] text-center border border-white/[0.08] relative group">
                     <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-f1-red/40 to-transparent" />
                     <span className="led-digit text-2xl sm:text-3xl lg:text-4xl text-f1-white font-mono block leading-none">
                        {String(value).padStart(2, '0')}
                     </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-f1-silver/60 tracking-[0.2em] font-semibold mt-1.5 uppercase">
                     {label}
                  </span>
               </div>
               {i < units.length - 1 && (
                  <div className="flex flex-col gap-1.5 pb-5 text-f1-red/70 animate-blink">
                     <span className="w-1.5 h-1.5 rounded-full bg-f1-red shadow-[0_0_8px_#E10600]" />
                     <span className="w-1.5 h-1.5 rounded-full bg-f1-red shadow-[0_0_8px_#E10600]" />
                  </div>
               )}
            </React.Fragment>
         ))}
      </div>
   );
};

export default CountdownTimer;