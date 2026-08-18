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
      <div className="space-y-7 animate-fade-in">
         {/* ─── Hero Section: Mission Control HUD ─── */}
         <div className="relative overflow-hidden rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-7 sm:p-9 shadow-2xl dot-grid">
            {/* Scanline texture */}
            <div className="scanline-overlay" />

            {/* Futuristic ambient glows */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-f1-red/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Diagonal accent slash line */}
            <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-f1-red/[0.04] to-transparent transform skew-x-12 pointer-events-none" />

            <div className="relative z-10 space-y-2">
               <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-f1-red/10 border border-f1-red/25 backdrop-blur-md">
                  <BarChart3 className="w-3.5 h-3.5 text-f1-red-light" />
                  <span className="text-f1-red-light text-xs font-mono font-bold tracking-[0.2em] uppercase">
                     Performance Analytics
                  </span>
               </div>

               <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-f1-white uppercase">
                  <span className="gradient-text">Statistics</span>
               </h1>

               <p className="text-f1-silver text-sm sm:text-base max-w-xl font-medium leading-relaxed">
                  2026 season performance analysis — points, wins & podium telemetry across the grid.
               </p>
            </div>
         </div>

         {/* Driver Points */}
         <div className="telemetry-card p-6 relative overflow-hidden">
            <div
               className="absolute top-0 inset-x-0 h-[2px] opacity-75"
               style={{ background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)' }}
            />
            <PointsDistributionChart
               drivers={drivers}
               title="Driver Points Distribution"
            />
         </div>

         {/* Constructor Points */}
         <div className="telemetry-card p-6 relative overflow-hidden">
            <div
               className="absolute top-0 inset-x-0 h-[2px] opacity-75"
               style={{ background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }}
            />
            <PointsDistributionChart
               drivers={constructorChartData}
               title="Constructor Points Distribution"
            />
         </div>

         {/* Wins + Podiums side-by-side */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="telemetry-card p-6 relative overflow-hidden">
               <div
                  className="absolute top-0 inset-x-0 h-[2px] opacity-75"
                  style={{ background: 'linear-gradient(90deg, transparent, #E10600, transparent)' }}
               />
               <WinsChart drivers={drivers} />
            </div>

            <div className="telemetry-card p-6 relative overflow-hidden">
               <div
                  className="absolute top-0 inset-x-0 h-[2px] opacity-75"
                  style={{ background: 'linear-gradient(90deg, transparent, #a855f7, transparent)' }}
               />
               <PodiumsChart drivers={drivers} />
            </div>
         </div>
      </div>
   );
};

export default StatisticsPage;