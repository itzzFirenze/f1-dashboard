import React from 'react';
import {
   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Award } from 'lucide-react';
import type { Driver } from '../../types';

interface PodiumsChartProps {
   drivers: Driver[];
}

/** Bar chart showing podiums per driver. */
const PodiumsChart: React.FC<PodiumsChartProps> = ({ drivers }) => {
   const data = drivers
      .filter((d) => d.podiums > 0)
      .sort((a, b) => b.podiums - a.podiums)
      .map((d) => ({
         name: d.code,
         podiums: d.podiums,
         color: d.constructorColor || '#E10600',
      }));

   if (data.length === 0) {
      return (
         <div className="telemetry-card p-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            <div className="flex items-center gap-2.5 mb-4">
               <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06] bg-amber-400/10">
                  <Award className="w-4 h-4 text-amber-400" />
               </div>
               <h3 className="text-xs font-mono font-medium text-f1-silver/70 tracking-wider uppercase">Podiums per Driver</h3>
            </div>
            <p className="text-sm font-mono text-f1-silver/50 text-center py-12">No podium finishes recorded yet</p>
         </div>
      );
   }

   return (
      <div className="telemetry-card p-6 relative overflow-hidden">
         <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
         <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06] bg-amber-400/10">
               <Award className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-xs font-mono font-medium text-f1-silver/70 tracking-wider uppercase">Podiums per Driver</h3>
         </div>
         <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
               <XAxis dataKey="name" stroke="#9B9BAD" fontSize={11} fontFamily="monospace" />
               <YAxis stroke="#9B9BAD" fontSize={11} fontFamily="monospace" allowDecimals={false} />
               <Tooltip
                  itemStyle={{ color: '#F5F5F5', fontFamily: 'monospace', fontSize: 12 }}
                  labelStyle={{ fontFamily: 'monospace', fontSize: 11, color: '#9B9BAD' }}
                  contentStyle={{
                     backgroundColor: '#0d0d14',
                     border: '1px solid rgba(255,255,255,0.08)',
                     borderRadius: '12px',
                     color: '#F5F5F5',
                  }}
               />
               <Bar dataKey="podiums" radius={[6, 6, 0, 0]}>
                  {data.map((entry, index) => (
                     <Cell key={index} fill={entry.color} />
                  ))}
               </Bar>
            </BarChart>
         </ResponsiveContainer>
      </div>
   );
};

export default PodiumsChart;