import React, { useEffect, useState } from 'react';
import { BarChart3, Radio } from 'lucide-react';
import { driverService } from '../services/driverService';
import { constructorService } from '../services/constructorService';
import PointsDistributionChart from '../components/charts/PointsDistributionChart';
import WinsChart from '../components/charts/WinsChart';
import PodiumsChart from '../components/charts/PodiumsChart';
import SeasonSelector from '../components/ui/SeasonSelector';
import PageHeroTitle from '@/components/ui/PageHeroTitle';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import type { Driver, Constructor } from '../types';

const StatisticsPage: React.FC = () => {
   const [season, setSeason] = useState<number>(2026);
   const [drivers, setDrivers] = useState<Driver[]>([]);
   const [constructors, setConstructors] = useState<Constructor[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      setLoading(true);
      Promise.all([driverService.getAll(undefined, season), constructorService.getAll(season)])
         .then(([d, c]) => { setDrivers(d); setConstructors(c); })
         .catch(console.error)
         .finally(() => setLoading(false));
   }, [season]);

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
         <div className="relative overflow-hidden rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-5 sm:p-8 shadow-2xl dot-grid">
            {/* Scanline texture */}
            <div className="scanline-overlay" />

            {/* Futuristic ambient glows */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-f1-red/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
               <div className="space-y-2">
                  <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-f1-red/10 border border-f1-red/25 backdrop-blur-md">
                     <BarChart3 className="w-3.5 h-3.5 text-f1-red-light" />
                     <span className="text-f1-red-light text-xs font-mono font-bold tracking-[0.2em] uppercase">
                        Performance Analytics
                     </span>
                  </div>

                  <PageHeroTitle titlePrefix="Statistics" />

                  <p className="text-f1-silver text-sm sm:text-base max-w-xl font-medium leading-relaxed">
                     {season} season performance analysis — points, wins & podium telemetry across the grid.
                  </p>
               </div>

               <SeasonSelector
                  selectedSeason={season}
                  onSelectSeason={(yr) => setSeason(yr || 2026)}
                  label="Select Season"
               />
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