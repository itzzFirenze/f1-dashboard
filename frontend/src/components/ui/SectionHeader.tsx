import React from 'react';
import { Gauge } from 'lucide-react';

interface SectionHeaderProps {
   title: string;
   meta?: string;
   icon?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
   title,
   meta,
   icon,
}) => (
   <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
         {icon ?? <Gauge className="w-4 h-4 text-emerald-400" />}
         <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-f1-silver font-bold">
            {title}
         </h2>
      </div>
      {meta && (
         <span className="text-[10px] font-mono text-f1-silver/40 uppercase tracking-widest">
            {meta}
         </span>
      )}
   </div>
);

export default SectionHeader;
