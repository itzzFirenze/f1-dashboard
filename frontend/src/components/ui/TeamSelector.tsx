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
         <label className="text-xs font-semibold text-f1-silver uppercase tracking-wider mb-2 block">
            {label}
         </label>
         <button
            onClick={() => setOpen(!open)}
            className="w-full glass-card p-4 flex items-center gap-3 text-left transition-all"
            style={{ borderColor: selected ? (selected.color || '#666') : 'rgba(255,255,255,0.05)' }}
         >
            {selected ? (
               <>
                  <div
                     className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-f1-mid-gray"
                     style={{ borderColor: selected.color || '#666' }}
                  >
                     <img
                        src={resolveTheme(selected.name).teamLogoUrl}
                        alt={selected.name}
                        className="w-7 h-7 object-contain"
                     />
                  </div>
                  <div className="flex-1">
                     <p className="font-semibold">{selected.name}</p>
                     <p className="text-xs text-f1-silver">{selected.points} pts</p>
                  </div>
                  <X
                     className="w-4 h-4 text-f1-silver hover:text-white cursor-pointer"
                     onClick={(e) => { e.stopPropagation(); onSelect(null); }}
                  />
               </>
            ) : (
               <>
                  <div className="w-10 h-10 rounded-xl bg-f1-mid-gray flex items-center justify-center">
                     <Search className="w-4 h-4 text-f1-silver" />
                  </div>
                  <span className="text-f1-silver">Select a team...</span>
                  <ChevronDown className="w-4 h-4 text-f1-silver ml-auto" />
               </>
            )}
         </button>

         {open && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-f1-dark-gray/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-80">
               <div className="p-3 border-b border-white/5">
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-f1-silver" />
                     <input
                        autoFocus
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search teams..."
                        className="w-full bg-f1-mid-gray/50 border border-white/5 rounded-xl px-4 py-2.5 pl-10 text-sm text-f1-white placeholder-f1-silver/50 focus:outline-none focus:border-f1-red/50"
                     />
                  </div>
               </div>
               <div className="overflow-y-auto max-h-60">
                  {filtered.map((t) => (
                     <button
                        key={t.id}
                        onClick={() => { onSelect(t); setOpen(false); setSearch(''); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/5 ${selected?.id === t.id ? 'bg-white/5' : ''
                           }`}
                     >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-f1-mid-gray">
                           <img
                              src={resolveTheme(t.name).teamLogoUrl}
                              alt={t.name}
                              className="w-6 h-6 object-contain"
                           />
                        </div>
                        <div className="flex-1">
                           <p className="text-sm font-medium">{t.name}</p>
                        </div>
                        <span className="text-xs text-f1-silver">{t.points} pts</span>
                     </button>
                  ))}
                  {filtered.length === 0 && (
                     <p className="px-4 py-6 text-center text-sm text-f1-silver">No teams found</p>
                  )}
               </div>
            </div>
         )}
      </div>
   );
};

export default TeamSelector;