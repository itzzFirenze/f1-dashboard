import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
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
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold mb-6">{title}</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" stroke="#9B9BAD" fontSize={12} />
          <YAxis stroke="#9B9BAD" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E1E2E',
              border: '1px solid rgba(255,255,255,0.1)',
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
