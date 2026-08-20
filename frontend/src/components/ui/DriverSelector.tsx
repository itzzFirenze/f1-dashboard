import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import type { Driver } from '../../types';

interface DriverSelectorProps {
   drivers: Driver[];
   selected: Driver | null;
   onSelect: (driver: Driver | null) => void;
   label: string;
   accentColor?: string;
}

const DriverSelector: React.FC<DriverSelectorProps> = ({
   drivers, selected, onSelect, label, accentColor = '#e10600'
}) => {
   const [open, setOpen] = useState(false);
   const [search, setSearch] = useState('');
   const ref = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const handler = (e: MouseEvent) => {
         if (ref.current && !ref.current.contains(e.target as Node)) {
            setOpen(false);
            setSearch('');
         }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
   }, []);

   const filtered = drivers.filter(d =>
      `${d.firstName} ${d.lastName} ${d.code}`.toLowerCase().includes(search.toLowerCase())
   );

   return (
      <div ref={ref} className="relative w-full">
         <label className="text-[10px] font-mono font-semibold text-f1-silver/60 uppercase tracking-[0.2em] mb-2 block">
            {label}
         </label>
         <button
            onClick={() => setOpen(!open)}
            className="telemetry-card w-full p-4 flex items-center gap-3 text-left transition-all relative overflow-hidden group"
            style={{ borderColor: selected ? `${selected.constructorColor}55` : undefined }}
         >
            <div
               className="absolute top-0 inset-x-0 h-[2px] opacity-75 transition-opacity group-hover:opacity-100"
               style={{
                  background: `linear-gradient(90deg, transparent, ${selected ? selected.constructorColor : accentColor}, transparent)`,
               }}
            />

            {selected ? (
               <>
                  <div
                     className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-black text-white text-sm shrink-0 border border-white/[0.08] shadow-lg"
                     style={{ backgroundColor: selected.constructorColor }}
                  >
                     {selected.code}
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="font-display font-bold text-f1-white text-sm sm:text-base truncate">
                        {selected.firstName} {selected.lastName}
                     </p>
                     <p
                        className="text-[11px] font-mono truncate mt-0.5"
                        style={{ color: selected.constructorColor }}
                     >
                        {selected.constructorName}
                     </p>
                  </div>
                  <X
                     className="w-4 h-4 text-f1-silver/50 hover:text-f1-white cursor-pointer shrink-0 transition-colors"
                     onClick={(e) => { e.stopPropagation(); onSelect(null); }}
                  />
               </>
            ) : (
               <>
                  <div
                     className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/[0.06]"
                     style={{ backgroundColor: `${accentColor}15` }}
                  >
                     <Search className="w-4 h-4" style={{ color: accentColor }} />
                  </div>
                  <span className="text-sm font-mono text-f1-silver/50 tracking-wide">
                     Select a driver...
                  </span>
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
                        placeholder="Search drivers..."
                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 pl-10 text-sm font-mono text-f1-white placeholder-f1-silver/40 focus:outline-none focus:border-f1-red/50 transition-colors"
                     />
                  </div>
               </div>
               <div className="overflow-y-auto max-h-60 relative z-10">
                  {filtered.map((d) => (
                     <button
                        key={d.id}
                        onClick={() => { onSelect(d); setOpen(false); setSearch(''); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/[0.04] border-l-2 ${selected?.id === d.id ? 'bg-white/[0.04]' : 'border-transparent'
                           }`}
                        style={selected?.id === d.id ? { borderColor: d.constructorColor } : undefined}
                     >
                        <div
                           className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-white text-xs shrink-0 border border-white/[0.06]"
                           style={{ backgroundColor: d.constructorColor }}
                        >
                           {d.code}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-sm font-medium text-f1-white truncate">{d.firstName} {d.lastName}</p>
                           <p className="text-[11px] font-mono text-f1-silver/50 truncate">
                              {d.constructorName} · P{d.championshipPosition}
                           </p>
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-f1-silver/60 shrink-0">{d.points} pts</span>
                     </button>
                  ))}
                  {filtered.length === 0 && (
                     <p className="px-4 py-6 text-center text-sm font-mono text-f1-silver/50">No drivers found</p>
                  )}
               </div>
            </div>
         )}
      </div>
   );
};

export default DriverSelector;