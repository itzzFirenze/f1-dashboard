import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronDown, Check } from 'lucide-react';

interface SeasonSelectorProps {
   selectedSeason: number | null;
   onSelectSeason: (season: number | null) => void;
   availableSeasons?: number[];
   allowAll?: boolean;
   allLabel?: string;
   label?: string;
   className?: string;
}

const DEFAULT_SEASONS = [2026, 2025, 2024, 2023];

export const SeasonSelector: React.FC<SeasonSelectorProps> = ({
   selectedSeason,
   onSelectSeason,
   availableSeasons = DEFAULT_SEASONS,
   allowAll = false,
   allLabel = 'All Seasons',
   label = 'Season',
   className = '',
}) => {
   const [open, setOpen] = useState(false);
   const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
   const wrapperRef = useRef<HTMLDivElement>(null);
   const buttonRef = useRef<HTMLButtonElement>(null);
   const menuRef = useRef<HTMLDivElement>(null);

   // Close on outside click (checks both the trigger and the portaled menu)
   useEffect(() => {
      const handler = (e: MouseEvent) => {
         const target = e.target as Node;
         if (
            wrapperRef.current &&
            !wrapperRef.current.contains(target) &&
            menuRef.current &&
            !menuRef.current.contains(target)
         ) {
            setOpen(false);
         }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
   }, []);

   // Compute position of the menu relative to viewport whenever it opens
   useLayoutEffect(() => {
      if (open && buttonRef.current) {
         const rect = buttonRef.current.getBoundingClientRect();
         setMenuPos({
            top: rect.bottom + 6,
            left: rect.right - 170, // right-align to button, matches min-w-[170px]
            width: Math.max(rect.width, 170),
         });
      }
   }, [open]);

   // Reposition on scroll/resize while open
   useEffect(() => {
      if (!open) return;
      const reposition = () => {
         if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPos({
               top: rect.bottom + 6,
               left: rect.right - 170,
               width: Math.max(rect.width, 170),
            });
         }
      };
      window.addEventListener('scroll', reposition, true);
      window.addEventListener('resize', reposition);
      return () => {
         window.removeEventListener('scroll', reposition, true);
         window.removeEventListener('resize', reposition);
      };
   }, [open]);

   const displayText = selectedSeason ? `${selectedSeason} Season` : allLabel;

   return (
      <div ref={wrapperRef} className={`relative shrink-0 ${className}`}>
         {label && (
            <label className="text-[10px] font-mono font-semibold text-f1-silver/60 uppercase tracking-[0.2em] mb-1.5 block">
               {label}
            </label>
         )}
         <button
            ref={buttonRef}
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-f1-white border border-white/[0.08] hover:border-f1-red/40 transition-all font-mono text-xs font-semibold relative overflow-hidden group shadow-lg"
         >
            <div
               className="absolute top-0 inset-x-0 h-[2px] opacity-75 group-hover:opacity-100 transition-opacity"
               style={{ background: 'linear-gradient(90deg, transparent, #E10600, transparent)' }}
            />

            <Calendar className="w-3.5 h-3.5 text-f1-red-light shrink-0" />
            <span className="tracking-wider">{displayText}</span>
            <ChevronDown
               className={`w-3.5 h-3.5 text-f1-silver/50 ml-1 transition-transform duration-200 ${open ? 'rotate-180 text-f1-white' : 'group-hover:translate-y-0.5'
                  }`}
            />
         </button>

         {open && menuPos && createPortal(
            <div
               ref={menuRef}
               className="fixed z-[9999] min-w-[170px] bg-f1-carbon/95 backdrop-blur-2xl border border-white/[0.1] rounded-xl shadow-2xl p-1.5 space-y-0.5 animate-fade-in dot-grid"
               style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
            >
               <div className="scanline-overlay pointer-events-none" />

               {allowAll && (
                  <button
                     type="button"
                     onClick={() => {
                        onSelectSeason(null);
                        setOpen(false);
                     }}
                     className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono tracking-wider transition-all text-left ${selectedSeason === null
                           ? 'bg-f1-red/15 text-f1-red-light font-bold border border-f1-red/30'
                           : 'text-f1-silver hover:text-f1-white hover:bg-white/[0.04]'
                        }`}
                  >
                     <span>{allLabel}</span>
                     {selectedSeason === null && <Check className="w-3.5 h-3.5 text-f1-red-light" />}
                  </button>
               )}

               {availableSeasons.map((year) => {
                  const isSelected = selectedSeason === year;
                  return (
                     <button
                        key={year}
                        type="button"
                        onClick={() => {
                           onSelectSeason(year);
                           setOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono tracking-wider transition-all text-left ${isSelected
                              ? 'bg-f1-red/15 text-f1-red-light font-bold border border-f1-red/30'
                              : 'text-f1-silver hover:text-f1-white hover:bg-white/[0.04]'
                           }`}
                     >
                        <span>{year} Season</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-f1-red-light" />}
                     </button>
                  );
               })}
            </div>,
            document.body
         )}
      </div>
   );
};

export default SeasonSelector;