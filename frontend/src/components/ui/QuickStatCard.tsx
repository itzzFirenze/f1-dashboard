import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface QuickStatCardProps {
   label: string;
   value: string | number;
   icon: LucideIcon;
   color: string;
   accent: string;
}

const QuickStatCard: React.FC<QuickStatCardProps> = ({ label, value, icon: Icon, color, accent }) => (
   <div className="telemetry-card p-2.5 relative overflow-hidden">
      {/* Gradient accent line at the top */}
      <div
         className={`absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent ${accent} to-transparent`}
      />

      <div className="flex items-center gap-2">
         <div
            className="w-6 h-6 rounded-lg flex items-center justify-center border border-white/[0.06] shrink-0"
            style={{ backgroundColor: `${color}15` }}
         >
            <Icon className="w-3.5 h-3.5" style={{ color }} />
         </div>
         <div>
            <p className="stat-value font-mono leading-tight" style={{ color }}>
               {value}
            </p>
            <p className="stat-label text-[9px] font-mono uppercase tracking-widest text-f1-silver/50 leading-tight">
               {label}
            </p>
         </div>
      </div>
   </div>
);

export default QuickStatCard;
