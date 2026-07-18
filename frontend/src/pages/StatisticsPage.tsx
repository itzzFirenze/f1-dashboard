import React, { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { driverService } from '../services/driverService';
import { constructorService } from '../services/constructorService';
import PointsDistributionChart from '../components/charts/PointsDistributionChart';
import WinsChart from '../components/charts/WinsChart';
import PodiumsChart from '../components/charts/PodiumsChart';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import type { Driver, Constructor } from '../types';

const StatisticsPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [constructors, setConstructors] = useState<Constructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([driverService.getAll(), constructorService.getAll()])
      .then(([d, c]) => { setDrivers(d); setConstructors(c); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  // Convert constructors to a "Driver-like" shape for the chart component
  const constructorChartData: Driver[] = constructors.map((c) => ({
    id: c.id,
    code: c.name.split(' ')[0].substring(0, 3).toUpperCase(),
    firstName: c.name,
    lastName: '',
    number: 0,
    nationality: c.nationality,
    imageUrl: null,
    points: c.points,
    wins: c.wins,
    podiums: 0,
    championshipPosition: c.championshipPosition,
    constructorName: c.name,
    constructorColor: c.color,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-f1-red" />
          Statistics
        </h1>
        <p className="text-f1-silver mt-1">2026 Season Performance Analysis</p>
      </div>

      {/* Driver Points */}
      <PointsDistributionChart
        drivers={drivers}
        title="Driver Points Distribution"
      />

      {/* Constructor Points */}
      <PointsDistributionChart
        drivers={constructorChartData}
        title="Constructor Points Distribution"
      />

      {/* Wins + Podiums side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WinsChart drivers={drivers} />
        <PodiumsChart drivers={drivers} />
      </div>
    </div>
  );
};

export default StatisticsPage;
