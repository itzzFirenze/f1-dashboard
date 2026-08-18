import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import type { Constructor } from '../../types';
import { resolveTheme } from '../../config/teamThemes';

interface TeamSelectorProps {
   teams: Constructor[];
   selected: Constructor | null;
   onSelect: (team: Constructor | null) => void;
   label: string;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ teams, selected, onSelect, label }) => {
   const [open, setOpen] = useState(false);
   const [search, setSearch] = useState('');
   const ref = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const handler = (e: MouseEvent) => {
         if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
   }, []);

   const filtered = teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

   return (
      <div ref={ref} className="relative w-full">
         <label className="text-[10px] font-mono font-semibold text-f1-silver/60 uppercase tracking-[0.2em] mb-2 block">
            {label}
         </label>
         <button
            onClick={() => setOpen(!open)}
            className="telemetry-card w-full p-4 flex items-center gap-3 text-left transition-all relative overflow-hidden group"
            style={{ borderColor: selected ? `${selected.color || '#666'}55` : undefined }}
         >
            {/* Top accent bar, mirrors StatGaugeCard treatment */}
            <div
               className="absolute top-0 inset-x-0 h-[2px] opacity-75 transition-opacity group-hover:opacity-100"
               style={{
                  background: `linear-gradient(90deg, transparent, ${selected ? (selected.color || '#666') : '#E10600'}, transparent)`,
               }}
            />

            {selected ? (
               <>
                  <div
                     className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-f1-abyss/80 border border-white/[0.08] shadow-lg shrink-0 p-1.5"
                  >
                     <img
                        src={resolveTheme(selected.name).teamLogoUrl}
                        alt={selected.name}
                        className="w-full h-full object-contain"
                     />
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="font-display font-bold text-f1-white text-sm sm:text-base truncate">{selected.name}</p>
                     <p className="text-[11px] font-mono text-f1-silver/50 mt-0.5">{selected.points} pts</p>
                  </div>
                  <X
                     className="w-4 h-4 text-f1-silver/50 hover:text-f1-white cursor-pointer shrink-0 transition-colors"
                     onClick={(e) => { e.stopPropagation(); onSelect(null); }}
                  />
               </>
            ) : (
               <>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/[0.06] bg-f1-red/10">
                     <Search className="w-4 h-4 text-f1-red-light" />
                  </div>
                  <span className="text-sm font-mono text-f1-silver/50 tracking-wide">Select a team...</span>
                  <ChevronDown className="w-4 h-4 text-f1-silver/40 ml-auto group-hover:translate-y-0.5 transition-transform" />
               </>
            )}
         </button>

         {open && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-f1-carbon/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden max-h-80 dot-grid">
               <div className="p-3 border-b border-white/[0.06] bg-f1-abyss/40">
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-f1-silver/50" />
                     <input
                        autoFocus
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search teams..."
                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 pl-10 text-sm font-mono text-f1-white placeholder-f1-silver/40 focus:outline-none focus:border-f1-red/50 transition-colors"
                     />
                  </div>
               </div>
               <div className="overflow-y-auto max-h-60 relative z-10">
                  {filtered.map((t) => (
                     <button
                        key={t.id}
                        onClick={() => { onSelect(t); setOpen(false); setSearch(''); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/[0.04] border-l-2 ${selected?.id === t.id ? 'bg-white/[0.04]' : 'border-transparent'
                           }`}
                        style={selected?.id === t.id ? { borderColor: t.color || '#666' } : undefined}
                     >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-f1-abyss/80 border border-white/[0.06] p-1">
                           <img
                              src={resolveTheme(t.name).teamLogoUrl}
                              alt={t.name}
                              className="w-full h-full object-contain"
                           />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-sm font-medium text-f1-white truncate">{t.name}</p>
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-f1-silver/60 shrink-0">{t.points} pts</span>
                     </button>
                  ))}
                  {filtered.length === 0 && (
                     <p className="px-4 py-6 text-center text-sm font-mono text-f1-silver/50">No teams found</p>
                  )}
               </div>
            </div>
         )}
      </div>
   );
};

export default TeamSelector;