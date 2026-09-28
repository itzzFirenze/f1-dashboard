import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface TabItem {
   key: string;
   label: string;
   count?: number;
   icon?: LucideIcon;
   activeColor?: string;
   iconColor?: string;
}

interface TabBarProps {
   tabs: TabItem[];
   activeTab: string;
   onChange: (key: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onChange }) => (
   <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
      {tabs.map((tab) => {
         const isActive = activeTab === tab.key;
         const activeColor = tab.activeColor ?? 'border-f1-red';
         const iconColor = tab.iconColor ?? 'text-f1-red';
         const Icon = tab.icon;

         return (
            <button
               key={tab.key}
               onClick={() => onChange(tab.key)}
               className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${isActive
                     ? `${activeColor} text-white bg-white/[0.04] font-bold`
                     : 'border-transparent text-f1-silver/60 hover:text-f1-silver hover:bg-white/[0.02]'
                  }`}
            >
               {Icon && <Icon className={`w-3.5 h-3.5 ${iconColor}`} />}
               {tab.label}
               {tab.count !== undefined && ` (${tab.count})`}
            </button>
         );
      })}
   </div>
);

export default TabBar;
