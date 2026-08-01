import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import type { Driver } from '../../types';

interface DriverSelectorProps {
  drivers: Driver[];
  selected: Driver | null;
  onSelect: (driver: Driver) => void;
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
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = drivers.filter(d =>
    `${d.firstName} ${d.lastName} ${d.code}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative w-full">
      <label className="text-xs font-semibold text-f1-silver uppercase tracking-wider mb-2 block">
        {label}
      </label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full glass-card p-4 flex items-center gap-3 text-left transition-all"
        style={{ borderColor: selected ? selected.constructorColor : 'rgba(255,255,255,0.05)' }}
      >
        {selected ? (
          <>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-white text-sm"
              style={{ backgroundColor: selected.constructorColor }}
            >
              {selected.code}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{selected.firstName} {selected.lastName}</p>
              <p className="text-xs text-f1-silver">{selected.constructorName}</p>
            </div>
            <X
              className="w-4 h-4 text-f1-silver hover:text-white cursor-pointer"
              onClick={(e) => { e.stopPropagation(); }}
            />
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-f1-mid-gray flex items-center justify-center">
              <Search className="w-4 h-4 text-f1-silver" />
            </div>
            <span className="text-f1-silver">Select a driver...</span>
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
                placeholder="Search drivers..."
                className="w-full bg-f1-mid-gray/50 border border-white/5 rounded-xl px-4 py-2.5 pl-10 text-sm text-f1-white placeholder-f1-silver/50 focus:outline-none focus:border-f1-red/50"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-60">
            {filtered.map((d) => (
              <button
                key={d.id}
                onClick={() => { onSelect(d); setOpen(false); setSearch(''); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/5 ${
                  selected?.id === d.id ? 'bg-white/5' : ''
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-white text-xs"
                  style={{ backgroundColor: d.constructorColor }}
                >
                  {d.code}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{d.firstName} {d.lastName}</p>
                  <p className="text-xs text-f1-silver">{d.constructorName} · P{d.championshipPosition}</p>
                </div>
                <span className="text-xs text-f1-silver">{d.points} pts</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-f1-silver">No drivers found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverSelector;
