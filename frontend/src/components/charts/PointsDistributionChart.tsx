import React from 'react';
import {
   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { Driver } from '../../types';

interface PointsChartProps {
   drivers: Driver[];
   title?: string;
}

const CHART_COLORS = [
   '#E10600', '#FF8000', '#3671C6', '#27F4D2', '#229971',
   '#FF87BC', '#64C4FF', '#6692FF', '#52E252', '#B6BABD',
];

/** Bar chart showing driver or constructor points distribution. */
const PointsDistributionChart: React.FC<PointsChartProps> = ({
   drivers,
   title = 'Points Distribution',
}) => {
   const data = drivers.slice(0, 10).map((d) => ({
      name: d.code || d.firstName,
      points: d.points,
      color: d.constructorColor || CHART_COLORS[0],
   }));

   return (
      <div className="telemetry-card p-6 relative overflow-hidden">
         <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-sky-400 to-transparent" />
         <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06] bg-sky-400/10">
               <BarChart3 className="w-4 h-4 text-sky-400" />
            </div>
            <h3 className="text-xs font-mono font-medium text-f1-silver/70 tracking-wider uppercase">{title}</h3>
         </div>
         <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
               <XAxis dataKey="name" stroke="#9B9BAD" fontSize={11} fontFamily="monospace" />
               <YAxis stroke="#9B9BAD" fontSize={11} fontFamily="monospace" />
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
               <Bar dataKey="points" radius={[6, 6, 0, 0]}>
                  {data.map((entry, index) => (
                     <Cell key={index} fill={entry.color} />
                  ))}
               </Bar>
            </BarChart>
         </ResponsiveContainer>
      </div>
   );
};

export default PointsDistributionChart;