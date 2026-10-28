import React from 'react';
import type { OpenF1Stint } from '../../services/telemetryService';

export interface TyreCompoundConfig {
   letter: string;
   name: string;
   bgClass: string;
   borderClass: string;
   textClass: string;
   badgeBg: string;
   badgeText: string;
}

export const getTyreConfig = (compound: string | null | undefined): TyreCompoundConfig => {
   const comp = (compound || '').trim().toUpperCase();

   if (comp === 'SOFT' || comp === 'S') {
      return {
         letter: 'S',
         name: 'Soft',
         bgClass: 'bg-rose-500/15',
         borderClass: 'border-rose-500/35',
         textClass: 'text-rose-400',
         badgeBg: 'bg-rose-500',
         badgeText: 'text-white',
      };
   }
   if (comp === 'MEDIUM' || comp === 'M') {
      return {
         letter: 'M',
         name: 'Medium',
         bgClass: 'bg-amber-400/15',
         borderClass: 'border-amber-400/35',
         textClass: 'text-amber-300',
         badgeBg: 'bg-amber-400',
         badgeText: 'text-black',
      };
   }
   if (comp === 'HARD' || comp === 'H') {
      return {
         letter: 'H',
         name: 'Hard',
         bgClass: 'bg-white/10',
         borderClass: 'border-white/30',
         textClass: 'text-slate-100',
         badgeBg: 'bg-slate-200',
         badgeText: 'text-black',
      };
   }
   if (comp === 'INTERMEDIATE' || comp === 'I' || comp === 'INTER') {
      return {
         letter: 'I',
         name: 'Intermediate',
         bgClass: 'bg-emerald-500/15',
         borderClass: 'border-emerald-500/35',
         textClass: 'text-emerald-300',
         badgeBg: 'bg-emerald-500',
         badgeText: 'text-white',
      };
   }
   if (comp === 'WET' || comp === 'W') {
      return {
         letter: 'W',
         name: 'Wet',
         bgClass: 'bg-blue-500/15',
         borderClass: 'border-blue-500/35',
         textClass: 'text-blue-300',
         badgeBg: 'bg-blue-500',
         badgeText: 'text-white',
      };
   }

   return {
      letter: comp ? comp[0] : '?',
      name: comp || 'Unknown',
      bgClass: 'bg-white/5',
      borderClass: 'border-white/15',
      textClass: 'text-f1-silver',
      badgeBg: 'bg-zinc-600',
      badgeText: 'text-white',
   };
};

interface TyreStintBadgeProps {
   stints: OpenF1Stint[];
   compact?: boolean;
}

export const TyreStintBadge: React.FC<TyreStintBadgeProps> = ({ stints, compact = false }) => {
   if (!stints || stints.length === 0) return null;

   return (
      <div className="inline-flex items-center gap-1 sm:gap-1.5 flex-wrap">
         {stints.map((stint, idx) => {
            const cfg = getTyreConfig(stint.compound);
            const laps =
               stint.lap_end != null && stint.lap_start != null && stint.lap_end >= stint.lap_start
                  ? stint.lap_end - stint.lap_start + 1
                  : null;

            const lapRange =
               stint.lap_start != null && stint.lap_end != null
                  ? `L${stint.lap_start}–L${stint.lap_end}`
                  : stint.lap_start != null
                  ? `From L${stint.lap_start}`
                  : '';

            const tyreAgeText =
               stint.tyre_age_at_start != null && stint.tyre_age_at_start > 0
                  ? ` · Started used (${stint.tyre_age_at_start} laps old)`
                  : ' · Started New';

            const tooltip = `Stint ${stint.stint_number || idx + 1}: ${cfg.name}${
               laps ? ` (${laps} laps${lapRange ? `, ${lapRange}` : ''})` : lapRange ? ` (${lapRange})` : ''
            }${tyreAgeText}`;

            return (
               <React.Fragment key={stint.stint_number != null ? `${stint.stint_number}-${idx}` : idx}>
                  {idx > 0 && (
                     <span className="text-f1-silver/30 text-[10px] select-none font-mono">›</span>
                  )}
                  <div
                     className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border font-mono text-[10px] font-bold ${cfg.bgClass} ${cfg.borderClass} ${cfg.textClass} transition-transform hover:scale-105 cursor-help shrink-0`}
                     title={tooltip}
                  >
                     <span
                        className={`w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-[9px] font-black leading-none shrink-0 ${cfg.badgeBg} ${cfg.badgeText}`}
                     >
                        {cfg.letter}
                     </span>
                     {!compact && laps != null && (
                        <span className="text-[10px] opacity-90 hidden sm:inline">{laps}L</span>
                     )}
                     {compact && laps != null && (
                        <span className="text-[9px] opacity-90">{laps}L</span>
                     )}
                  </div>
               </React.Fragment>
            );
         })}
      </div>
   );
};

export default TyreStintBadge;
