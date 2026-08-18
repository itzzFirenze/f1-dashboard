import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
   value: string;
   onChange: (value: string) => void;
   placeholder?: string;
   className?: string;
}

/** Styled search input with search icon, matching the telemetry HUD input style. */
const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder = 'Search...', className = '' }) => {
   return (
      <div className={`relative ${className}`}>
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-f1-silver/50 pointer-events-none" />
         <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 pl-10 text-sm font-mono text-f1-white placeholder-f1-silver/40 focus:outline-none focus:border-f1-red/50 transition-colors"
         />
      </div>
   );
};

export default SearchInput;