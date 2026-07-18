import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
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
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-4">Podiums per Driver</h3>
        <p className="text-f1-silver text-center py-12">No podium finishes recorded yet</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold mb-6">Podiums per Driver</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" stroke="#9B9BAD" fontSize={12} />
          <YAxis stroke="#9B9BAD" fontSize={12} allowDecimals={false} />
          <Tooltip
            itemStyle={{ color: '#F5F5F5' }}
            contentStyle={{
              backgroundColor: '#1E1E2E',
              border: '1px solid rgba(255,255,255,0.1)',
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
