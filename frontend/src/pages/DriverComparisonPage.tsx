import React, { useEffect, useState, useMemo } from 'react';
import { GitCompare, ArrowLeftRight, Users } from 'lucide-react';
import { ResponsiveRadar } from '@nivo/radar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBump } from '@nivo/bump';
import { driverService } from '../services/driverService';
import { analyticsService } from '../services/analyticsService';
import DriverSelector from '../components/ui/DriverSelector';
import SeasonSelector from '../components/ui/SeasonSelector';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import type { Driver, DriverComparisonData } from '../types';

const DriverComparisonPage: React.FC = () => {
   const [season, setSeason] = useState<number>(2026);
   const [drivers, setDrivers] = useState<Driver[]>([]);
   const [driverA, setDriverA] = useState<Driver | null>(null);
   const [driverB, setDriverB] = useState<Driver | null>(null);
   const [data, setData] = useState<DriverComparisonData | null>(null);
   const [loading, setLoading] = useState(false);
   const [driversLoading, setDriversLoading] = useState(true);

   useEffect(() => {
      setDriversLoading(true);
      driverService.getAll(undefined, season)
         .then((dList) => {
            setDrivers(dList);
            setDriverA((prev) => (prev ? dList.find(d => d.id === prev.id) ?? null : null));
            setDriverB((prev) => (prev ? dList.find(d => d.id === prev.id) ?? null : null));
         })
         .catch(console.error)
         .finally(() => setDriversLoading(false));
   }, [season]);

   useEffect(() => {
      if (driverA && driverB) {
         setLoading(true);
         analyticsService.compareDrivers(driverA.id, driverB.id, season)
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
      }
   }, [driverA, driverB, season]);

   const swapDrivers = () => {
      const temp = driverA;
      setDriverA(driverB);
      setDriverB(temp);
   };

   const radarData = useMemo(() => {
      if (!data) return [];
      const maxPts = Math.max(data.statsA.points, data.statsB.points, 1);
      const maxWins = Math.max(data.statsA.wins, data.statsB.wins, 1);
      const maxPods = Math.max(data.statsA.podiums, data.statsB.podiums, 1);
      return [
         { stat: 'Points', [data.driverA.code]: (data.statsA.points / maxPts) * 100, [data.driverB.code]: (data.statsB.points / maxPts) * 100 },
         { stat: 'Wins', [data.driverA.code]: (data.statsA.wins / maxWins) * 100, [data.driverB.code]: (data.statsB.wins / maxWins) * 100 },
         { stat: 'Podiums', [data.driverA.code]: (data.statsA.podiums / maxPods) * 100, [data.driverB.code]: (data.statsB.podiums / maxPods) * 100 },
         { stat: 'Avg Grid', [data.driverA.code]: Math.max(0, 100 - (data.statsA.avgGrid * 5)), [data.driverB.code]: Math.max(0, 100 - (data.statsB.avgGrid * 5)) },
         { stat: 'Avg Finish', [data.driverA.code]: Math.max(0, 100 - (data.statsA.avgFinish * 5)), [data.driverB.code]: Math.max(0, 100 - (data.statsB.avgFinish * 5)) },
         { stat: 'Reliability', [data.driverA.code]: Math.max(0, 100 - data.statsA.dnfs * 20), [data.driverB.code]: Math.max(0, 100 - data.statsB.dnfs * 20) },
      ];
   }, [data]);

   const cumulativeLineData = useMemo(() => {
      if (!data) return [];
      const completedRaces = data.races.filter(r => r.posA !== null || r.posB !== null);
      return [
         {
            id: data.driverA.code,
            color: data.driverA.constructorColor,
            data: completedRaces.map(r => ({ x: `R${r.round}`, y: r.cumulativePointsA })),
         },
         {
            id: data.driverB.code,
            color: data.driverB.constructorColor,
            data: completedRaces.map(r => ({ x: `R${r.round}`, y: r.cumulativePointsB })),
         },
      ];
   }, [data]);

   const bumpData = useMemo(() => {
      if (!data) return [];
      const completedRaces = data.races.filter(r => r.posA !== null && r.posB !== null);
      if (completedRaces.length === 0) return [];
      return [
         {
            id: data.driverA.code,
            data: completedRaces.map(r => ({ x: `R${r.round}`, y: r.posA })),
         },
         {
            id: data.driverB.code,
            data: completedRaces.map(r => ({ x: `R${r.round}`, y: r.posB })),
         },
      ];
   }, [data]);

   if (driversLoading) return <PageSkeleton />;

   const StatBar = ({ label, valueA, valueB, colorA, colorB }: {
      label: string; valueA: number; valueB: number; colorA: string; colorB: string;
   }) => {
      const total = valueA + valueB || 1;
      const pctA = (valueA / total) * 100;
      return (
         <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
               <span className="text-sm font-mono font-bold" style={{ color: colorA }}>{valueA}</span>
               <span className="text-[10px] font-mono text-f1-silver/50 uppercase tracking-[0.2em]">{label}</span>
               <span className="text-sm font-mono font-bold" style={{ color: colorB }}>{valueB}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden flex border border-white/[0.04]">
               <div className="h-full rounded-l-full transition-all duration-700" style={{ width: `${pctA}%`, backgroundColor: colorA }} />
               <div className="h-full rounded-r-full transition-all duration-700 ml-0.5" style={{ width: `${100 - pctA}%`, backgroundColor: colorB }} />
            </div>
         </div>
      );
   };

   return (
      <div className="space-y-7 animate-fade-in">
         {/* ─── Hero Section: Mission Control HUD (mirrors Dashboard) ─── */}
         <div className="relative overflow-hidden rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-5 sm:p-8 shadow-2xl dot-grid">
            <div className="scanline-overlay" />
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-f1-red/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
               <div className="space-y-2">
                  <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-f1-red/10 border border-f1-red/25 backdrop-blur-md">
                     <span className="text-f1-red-light text-xs font-mono font-bold tracking-[0.2em] uppercase">
                        Head-to-Head Telemetry
                     </span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-f1-white uppercase flex items-center gap-3">
                     <GitCompare className="w-8 h-8 text-f1-red shrink-0" />
                     Driver <span className="gradient-text">Comparison</span>
                  </h1>

                  <p className="text-f1-silver text-sm sm:text-base max-w-xl font-medium leading-relaxed">
                     Compare any two drivers head-to-head across points, pace and race craft for the {season} season.
                  </p>
               </div>

               <SeasonSelector
                  selectedSeason={season}
                  onSelectSeason={(yr) => setSeason(yr || 2026)}
                  label="Select Season"
               />
            </div>
         </div>

         {/* ─── Driver Selectors ─── */}
         <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
            <DriverSelector
               drivers={drivers}
               selected={driverA}
               onSelect={setDriverA}
               label="Driver A"
               accentColor={driverA?.constructorColor}
            />
            <button
               onClick={swapDrivers}
               className="hidden md:flex w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] items-center justify-center hover:bg-f1-red/10 hover:border-f1-red/30 transition-colors self-end mb-1 group"
               title="Swap drivers"
            >
               <ArrowLeftRight className="w-5 h-5 text-f1-silver/60 group-hover:text-f1-red-light transition-colors" />
            </button>
            <DriverSelector
               drivers={drivers}
               selected={driverB}
               onSelect={setDriverB}
               label="Driver B"
               accentColor={driverB?.constructorColor}
            />
         </div>

         {/* Loading */}
         {loading && <PageSkeleton />}

         {/* Comparison Data */}
         {data && !loading && (
            <div className="space-y-6">

               {/* Head-to-Head Stats */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Radar Chart */}
                  <div className="telemetry-card p-6 relative overflow-hidden">
                     <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-f1-red to-transparent" />
                     <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06] bg-sky-400/10">
                           <Users className="w-4 h-4 text-sky-400" />
                        </div>
                        <h3 className="text-xs font-mono font-medium text-f1-silver/70 tracking-wider uppercase">Performance Profile</h3>
                     </div>
                     <div className="h-80">
                        <ResponsiveRadar
                           data={radarData}
                           keys={[data.driverA.code, data.driverB.code]}
                           indexBy="stat"
                           maxValue={100}
                           margin={{ top: 40, right: 60, bottom: 40, left: 60 }}
                           curve="linearClosed"
                           borderWidth={2}
                           borderColor={{ from: 'color' }}
                           gridLevels={4}
                           gridShape="circular"
                           gridLabelOffset={16}
                           dotSize={8}
                           dotColor={{ theme: 'background' }}
                           dotBorderWidth={2}
                           dotBorderColor={{ from: 'color' }}
                           colors={[data.driverA.constructorColor, data.driverB.constructorColor]}
                           fillOpacity={0.15}
                           blendMode="normal"
                           animate={true}
                           theme={{
                              text: { fill: '#9ca3af' },
                              grid: { line: { stroke: '#333' } },
                              tooltip: { container: { background: '#1a1a2e', color: '#fff', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' } },
                           }}
                           legends={[
                              {
                                 anchor: 'top-left',
                                 direction: 'column',
                                 translateX: -40,
                                 translateY: -20,
                                 itemWidth: 80,
                                 itemHeight: 20,
                                 symbolSize: 12,
                                 symbolShape: 'circle',
                                 itemTextColor: '#9ca3af',
                              },
                           ]}
                        />
                     </div>
                  </div>

                  {/* Stats Bars */}
                  <div className="telemetry-card p-6 relative overflow-hidden">
                     <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                     <div className="flex items-center gap-2.5 mb-6">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06] bg-amber-400/10">
                           <GitCompare className="w-4 h-4 text-amber-400" />
                        </div>
                        <h3 className="text-xs font-mono font-medium text-f1-silver/70 tracking-wider uppercase">Head-to-Head</h3>
                     </div>
                     <StatBar label="Points" valueA={data.statsA.points} valueB={data.statsB.points} colorA={data.driverA.constructorColor} colorB={data.driverB.constructorColor} />
                     <StatBar label="Wins" valueA={data.statsA.wins} valueB={data.statsB.wins} colorA={data.driverA.constructorColor} colorB={data.driverB.constructorColor} />
                     <StatBar label="Podiums" valueA={data.statsA.podiums} valueB={data.statsB.podiums} colorA={data.driverA.constructorColor} colorB={data.driverB.constructorColor} />
                     <StatBar label="Race H2H" valueA={data.headToHeadRaceA} valueB={data.headToHeadRaceB} colorA={data.driverA.constructorColor} colorB={data.driverB.constructorColor} />
                     <StatBar label="DNFs" valueA={data.statsA.dnfs} valueB={data.statsB.dnfs} colorA={data.driverA.constructorColor} colorB={data.driverB.constructorColor} />

                     <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/[0.06]">
                        <div className="text-center">
                           <p className="text-[10px] font-mono text-f1-silver/50 uppercase tracking-widest mb-1">Avg Grid</p>
                           <p className="text-xl font-display font-black" style={{ color: data.driverA.constructorColor }}>
                              P{data.statsA.avgGrid.toFixed(1)}
                           </p>
                        </div>
                        <div className="text-center">
                           <p className="text-[10px] font-mono text-f1-silver/50 uppercase tracking-widest mb-1">Avg Grid</p>
                           <p className="text-xl font-display font-black" style={{ color: data.driverB.constructorColor }}>
                              P{data.statsB.avgGrid.toFixed(1)}
                           </p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Cumulative Points Line Chart */}
               {cumulativeLineData.length > 0 && cumulativeLineData[0].data.length > 0 && (
                  <div className="telemetry-card p-6 relative overflow-hidden">
                     <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
                     <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06] bg-emerald-400/10">
                           <ArrowLeftRight className="w-4 h-4 text-emerald-400 rotate-90" />
                        </div>
                        <h3 className="text-xs font-mono font-medium text-f1-silver/70 tracking-wider uppercase">Points Progression</h3>
                     </div>
                     <div className="h-72">
                        <ResponsiveLine
                           data={cumulativeLineData}
                           margin={{ top: 20, right: 30, bottom: 50, left: 50 }}
                           xScale={{ type: 'point' }}
                           yScale={{ type: 'linear', min: 0, max: 'auto' }}
                           curve="monotoneX"
                           lineWidth={3}
                           colors={[data.driverA.constructorColor, data.driverB.constructorColor]}
                           pointSize={8}
                           pointColor={{ theme: 'background' }}
                           pointBorderWidth={2}
                           pointBorderColor={{ from: 'serieColor' }}
                           enableArea={true}
                           areaOpacity={0.08}
                           useMesh={true}
                           animate={true}
                           axisBottom={{ tickRotation: -45 }}
                           theme={{
                              text: { fill: '#9ca3af' },
                              axis: { ticks: { text: { fill: '#9ca3af' } }, legend: { text: { fill: '#9ca3af' } } },
                              grid: { line: { stroke: '#333' } },
                              crosshair: { line: { stroke: '#e10600' } },
                              tooltip: { container: { background: '#1a1a2e', color: '#fff', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' } },
                           }}
                           legends={[
                              {
                                 anchor: 'top-right',
                                 direction: 'row',
                                 translateY: -10,
                                 itemWidth: 80,
                                 itemHeight: 20,
                                 symbolSize: 12,
                                 symbolShape: 'circle',
                                 itemTextColor: '#9ca3af',
                              },
                           ]}
                        />
                     </div>
                  </div>
               )}

               {/* Position Bump Chart */}
               {bumpData.length > 0 && bumpData[0].data.length > 1 && (
                  <div className="telemetry-card p-6 relative overflow-hidden">
                     <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-f1-red to-transparent" />
                     <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06] bg-f1-red/10">
                           <GitCompare className="w-4 h-4 text-f1-red-light" />
                        </div>
                        <h3 className="text-xs font-mono font-medium text-f1-silver/70 tracking-wider uppercase">Position History</h3>
                     </div>
                     <div className="h-72">
                        <ResponsiveBump
                           data={bumpData}
                           margin={{ top: 20, right: 60, bottom: 50, left: 60 }}
                           colors={[data.driverA.constructorColor, data.driverB.constructorColor]}
                           lineWidth={3}
                           activeLineWidth={5}
                           inactiveLineWidth={2}
                           pointSize={10}
                           activePointSize={14}
                           inactivePointSize={6}
                           pointColor={{ theme: 'background' }}
                           pointBorderWidth={3}
                           activePointBorderWidth={3}
                           pointBorderColor={{ from: 'serie.color' }}
                           axisTop={null}
                           axisBottom={{ tickRotation: -45 }}
                           axisLeft={{ tickSize: 5, tickPadding: 5 }}
                           theme={{
                              text: { fill: '#9ca3af' },
                              axis: { ticks: { text: { fill: '#9ca3af' } } },
                              tooltip: { container: { background: '#1a1a2e', color: '#fff', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' } },
                           }}
                        />
                     </div>
                  </div>
               )}
            </div>
         )}

         {/* Empty State */}
         {!data && !loading && (
            <div className="telemetry-card p-12 text-center dot-grid relative overflow-hidden">
               <div className="absolute -top-16 -right-16 w-64 h-64 bg-f1-red/10 rounded-full blur-3xl pointer-events-none" />
               <Users className="w-16 h-16 text-f1-silver/30 mx-auto mb-4 relative z-10" />
               <h3 className="text-xl font-display font-bold text-f1-white mb-2 relative z-10">Select Two Drivers</h3>
               <p className="text-sm font-mono text-f1-silver/50 relative z-10">Choose drivers above to see their head-to-head comparison</p>
            </div>
         )}
      </div>
   );
};

export default DriverComparisonPage;