import React, { useEffect, useState, useMemo } from 'react';
import { Swords, ArrowLeftRight, Zap, Trophy, Gauge } from 'lucide-react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { constructorService } from '../services/constructorService';
import { analyticsService } from '../services/analyticsService';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import type { Constructor, ConstructorComparisonData } from '../types';
import TeamSelector from '../components/ui/TeamSelector';
import SeasonSelector from '../components/ui/SeasonSelector';

const ConstructorComparisonPage: React.FC = () => {
   const [season, setSeason] = useState<number>(2026);
   const [constructors, setConstructors] = useState<Constructor[]>([]);
   const [teamA, setTeamA] = useState<Constructor | null>(null);
   const [teamB, setTeamB] = useState<Constructor | null>(null);
   const [data, setData] = useState<ConstructorComparisonData | null>(null);
   const [loading, setLoading] = useState(false);
   const [constructorsLoading, setConstructorsLoading] = useState(true);

   useEffect(() => {
      setConstructorsLoading(true);
      constructorService.getAll(season)
         .then((cList) => {
            setConstructors(cList);
            setTeamA((prev) => (prev ? cList.find(c => c.id === prev.id) ?? null : null));
            setTeamB((prev) => (prev ? cList.find(c => c.id === prev.id) ?? null : null));
         })
         .catch(console.error)
         .finally(() => setConstructorsLoading(false));
   }, [season]);

   useEffect(() => {
      if (teamA && teamB) {
         setLoading(true);
         analyticsService.compareConstructors(teamA.id, teamB.id, season)
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
      }
   }, [teamA, teamB, season]);

   const swapTeams = () => {
      const temp = teamA;
      setTeamA(teamB);
      setTeamB(temp);
   };

   const stackedBarData = useMemo(() => {
      if (!data) return [];
      return data.rounds
         .filter(r => r.pointsA > 0 || r.pointsB > 0)
         .map(r => {
            const entry: Record<string, string | number> = { round: `R${r.round}` };
            r.driverPointsA.forEach(dp => { entry[`${dp.driverCode}_A`] = dp.points; });
            r.driverPointsB.forEach(dp => { entry[`${dp.driverCode}_B`] = dp.points; });
            return entry;
         });
   }, [data]);

   const stackedBarKeys = useMemo(() => {
      if (!data) return [];
      const keysA = data.driverSplitA.map(d => `${d.driver.code}_A`);
      const keysB = data.driverSplitB.map(d => `${d.driver.code}_B`);
      return [...keysA, ...keysB];
   }, [data]);

   const stackedBarColors = useMemo(() => {
      if (!data) return {};
      const colorMap: Record<string, string> = {};
      data.driverSplitA.forEach((d, i) => { colorMap[`${d.driver.code}_A`] = i === 0 ? (data.teamA.color || '#3B82F6') : adjustBrightness(data.teamA.color || '#3B82F6', 40); });
      data.driverSplitB.forEach((d, i) => { colorMap[`${d.driver.code}_B`] = i === 0 ? (data.teamB.color || '#A855F7') : adjustBrightness(data.teamB.color || '#A855F7', 40); });
      return colorMap;
   }, [data]);

   // Gap evolution line chart
   const gapLineData = useMemo(() => {
      if (!data) return [];
      const completedRounds = data.rounds.filter(r => r.cumulativePointsA > 0 || r.cumulativePointsB > 0);
      return [
         {
            id: data.teamA.name,
            color: data.teamA.color || '#3B82F6',
            data: completedRounds.map(r => ({ x: `R${r.round}`, y: r.cumulativePointsA })),
         },
         {
            id: data.teamB.name,
            color: data.teamB.color || '#A855F7',
            data: completedRounds.map(r => ({ x: `R${r.round}`, y: r.cumulativePointsB })),
         },
      ];
   }, [data]);

   // Donut chart data for team A / team B driver splits
   const donutDataA = useMemo(() => {
      if (!data) return [];
      return data.driverSplitA.map(d => ({
         id: d.driver.code,
         label: d.driver.code,
         value: d.points,
         color: d.driver.constructorColor || data.teamA.color || '#3B82F6',
      }));
   }, [data]);

   const donutDataB = useMemo(() => {
      if (!data) return [];
      return data.driverSplitB.map(d => ({
         id: d.driver.code,
         label: d.driver.code,
         value: d.points,
         color: d.driver.constructorColor || data.teamB.color || '#A855F7',
      }));
   }, [data]);

   if (constructorsLoading) return <PageSkeleton />;

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
                        Constructor Battle Telemetry
                     </span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-f1-white uppercase flex items-center gap-3">
                     <Swords className="w-8 h-8 text-f1-red shrink-0" />
                     Constructor <span className="gradient-text">Battle</span>
                  </h1>

                  <p className="text-f1-silver text-sm sm:text-base max-w-xl font-medium leading-relaxed">
                     Team rivalries, point splits, and championship gap evolution for the {season} season.
                  </p>
               </div>

               <SeasonSelector
                  selectedSeason={season}
                  onSelectSeason={(yr) => setSeason(yr || 2026)}
                  label="Select Season"
               />
            </div>
         </div>

         {/* ─── Team Selectors ─── */}
         <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
            <TeamSelector teams={constructors} selected={teamA} onSelect={setTeamA} label="Team A" />
            <button
               onClick={swapTeams}
               className="hidden md:flex w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] items-center justify-center hover:bg-f1-red/10 hover:border-f1-red/30 transition-colors self-end mb-1 group"
               title="Swap teams"
            >
               <ArrowLeftRight className="w-5 h-5 text-f1-silver/60 group-hover:text-f1-red-light transition-colors" />
            </button>
            <TeamSelector teams={constructors} selected={teamB} onSelect={setTeamB} label="Team B" />
         </div>

         {/* Loading state */}
         {loading && (
            <div className="flex items-center justify-center py-12">
               <div className="w-8 h-8 border-2 border-f1-red border-t-transparent rounded-full animate-spin" />
            </div>
         )}

         {/* Results */}
         {data && !loading && (
            <>
               {/* Head-to-Head Summary Cards */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="telemetry-card p-6 text-center relative overflow-hidden">
                     <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                     <div className="flex items-center justify-center gap-2 mb-3">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <div className="text-[10px] font-mono text-f1-silver/50 uppercase tracking-[0.2em]">Total Points</div>
                     </div>
                     <div className="flex items-center justify-center gap-4">
                        <span className="text-2xl sm:text-3xl font-display font-black" style={{ color: data.teamA.color || '#3B82F6' }}>{data.teamA.points}</span>
                        <span className="text-f1-silver/40 text-xs font-mono uppercase">vs</span>
                        <span className="text-2xl sm:text-3xl font-display font-black" style={{ color: data.teamB.color || '#A855F7' }}>{data.teamB.points}</span>
                     </div>
                  </div>
                  <div className="telemetry-card p-6 text-center relative overflow-hidden">
                     <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
                     <div className="flex items-center justify-center gap-2 mb-3">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <div className="text-[10px] font-mono text-f1-silver/50 uppercase tracking-[0.2em]">Total Wins</div>
                     </div>
                     <div className="flex items-center justify-center gap-4">
                        <span className="text-2xl sm:text-3xl font-display font-black" style={{ color: data.teamA.color || '#3B82F6' }}>{data.teamA.wins}</span>
                        <span className="text-f1-silver/40 text-xs font-mono uppercase">vs</span>
                        <span className="text-2xl sm:text-3xl font-display font-black" style={{ color: data.teamB.color || '#A855F7' }}>{data.teamB.wins}</span>
                     </div>
                  </div>
                  <div className="telemetry-card p-6 text-center relative overflow-hidden">
                     <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-f1-red to-transparent" />
                     <div className="flex items-center justify-center gap-2 mb-3">
                        <Gauge className="w-3.5 h-3.5 text-f1-red-light" />
                        <div className="text-[10px] font-mono text-f1-silver/50 uppercase tracking-[0.2em]">Championship Gap</div>
                     </div>
                     <div className="text-2xl sm:text-3xl font-display font-black text-f1-white">
                        {Math.abs((data.teamA.points || 0) - (data.teamB.points || 0))} <span className="text-sm font-mono text-f1-silver/50 uppercase">pts</span>
                     </div>
                  </div>
               </div>

               {/* Stacked Bar Chart — Driver Point Contributions */}
               <div className="telemetry-card p-6 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-sky-400 to-transparent" />
                  <div className="flex items-center gap-2.5 mb-6">
                     <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06] bg-sky-400/10">
                        <Zap className="w-4 h-4 text-sky-400" />
                     </div>
                     <h2 className="text-xs font-mono font-medium text-f1-silver/70 tracking-wider uppercase">Points Per Round — Driver Contributions</h2>
                  </div>
                  <div style={{ height: 350 }}>
                     {stackedBarData.length > 0 ? (
                        <ResponsiveBar
                           data={stackedBarData}
                           keys={stackedBarKeys}
                           indexBy="round"
                           margin={{ top: 10, right: 130, bottom: 40, left: 50 }}
                           padding={0.3}
                           groupMode="grouped"
                           colors={({ id }) => stackedBarColors[id as string] || '#666'}
                           theme={{
                              text: { fill: '#9ca3af' },
                              axis: { ticks: { text: { fill: '#9ca3af' } }, legend: { text: { fill: '#9ca3af' } } },
                              grid: { line: { stroke: '#333' } },
                              tooltip: { container: { background: '#1a1a2e', color: '#fff', border: '1px solid #333' } },
                           }}
                           axisBottom={{ tickRotation: -45 }}
                           axisLeft={{ legend: 'Points', legendPosition: 'middle', legendOffset: -40 }}
                           legends={[
                              {
                                 dataFrom: 'keys',
                                 anchor: 'bottom-right',
                                 direction: 'column',
                                 translateX: 120,
                                 itemWidth: 100,
                                 itemHeight: 20,
                                 itemTextColor: '#9ca3af',
                              },
                           ]}
                           animate={true}
                           motionConfig="gentle"
                        />
                     ) : (
                        <div className="flex items-center justify-center h-full text-sm font-mono text-f1-silver/50">No race data available yet</div>
                     )}
                  </div>
               </div>

               {/* Gap Evolution Area/Line Chart */}
               <div className="telemetry-card p-6 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-f1-red to-transparent" />
                  <div className="flex items-center gap-2.5 mb-6">
                     <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06] bg-f1-red/10">
                        <ArrowLeftRight className="w-4 h-4 text-f1-red-light rotate-90" />
                     </div>
                     <h2 className="text-xs font-mono font-medium text-f1-silver/70 tracking-wider uppercase">Championship Gap Evolution</h2>
                  </div>
                  <div style={{ height: 350 }}>
                     {gapLineData.length > 0 && gapLineData[0].data.length > 0 ? (
                        <ResponsiveLine
                           data={gapLineData}
                           margin={{ top: 10, right: 120, bottom: 40, left: 60 }}
                           xScale={{ type: 'point' }}
                           yScale={{ type: 'linear', min: 0, max: 'auto' }}
                           curve="monotoneX"
                           colors={d => d.color || '#666'}
                           enableArea={true}
                           areaOpacity={0.1}
                           pointSize={8}
                           pointColor={{ from: 'color' }}
                           pointBorderWidth={2}
                           pointBorderColor={{ from: 'serieColor' }}
                           enableSlices="x"
                           theme={{
                              text: { fill: '#9ca3af' },
                              axis: { ticks: { text: { fill: '#9ca3af' } }, legend: { text: { fill: '#9ca3af' } } },
                              grid: { line: { stroke: '#333' } },
                              crosshair: { line: { stroke: '#e11d48' } },
                              tooltip: { container: { background: '#1a1a2e', color: '#fff', border: '1px solid #333' } },
                           }}
                           axisBottom={{ tickRotation: -45 }}
                           axisLeft={{ legend: 'Cumulative Points', legendPosition: 'middle', legendOffset: -50 }}
                           legends={[
                              {
                                 anchor: 'bottom-right',
                                 direction: 'column',
                                 translateX: 110,
                                 itemWidth: 100,
                                 itemHeight: 20,
                                 itemTextColor: '#9ca3af',
                                 symbolShape: 'circle',
                              },
                           ]}
                        />
                     ) : (
                        <div className="flex items-center justify-center h-full text-sm font-mono text-f1-silver/50">No race data available yet</div>
                     )}
                  </div>
               </div>

               {/* Driver Splits — Donut Charts */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Team A Donut */}
                  <div className="telemetry-card p-6 relative overflow-hidden">
                     <div
                        className="absolute top-0 inset-x-0 h-[2px] opacity-75"
                        style={{ background: `linear-gradient(90deg, transparent, ${data.teamA.color || '#3B82F6'}, transparent)` }}
                     />
                     <h2 className="text-xs font-mono font-medium text-f1-silver/70 tracking-wider uppercase mb-2 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.teamA.color || '#3B82F6' }} />
                        {data.teamA.name} — Driver Split
                     </h2>
                     <div style={{ height: 260 }}>
                        <ResponsivePie
                           data={donutDataA}
                           margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
                           innerRadius={0.55}
                           padAngle={2}
                           cornerRadius={4}
                           colors={{ datum: 'data.color' }}
                           enableArcLinkLabels={true}
                           arcLinkLabelsColor={{ from: 'color' }}
                           arcLinkLabelsTextColor="#9ca3af"
                           arcLabelsTextColor="#fff"
                           theme={{
                              tooltip: { container: { background: '#1a1a2e', color: '#fff', border: '1px solid #333' } },
                           }}
                        />
                     </div>
                     {/* Driver stats below */}
                     <div className="space-y-2 mt-2">
                        {data.driverSplitA.map(d => (
                           <div key={d.driver.id} className="flex items-center justify-between text-sm">
                              <span className="text-f1-silver/70 font-mono text-xs">{d.driver.code}</span>
                              <div className="flex gap-4 font-mono text-xs text-f1-silver/70">
                                 <span className="text-f1-white font-semibold">{d.points} pts ({d.percentage.toFixed(0)}%)</span>
                                 <span>Q: P{d.avgQuali.toFixed(1)}</span>
                                 <span>R: P{d.avgRace.toFixed(1)}</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Team B Donut */}
                  <div className="telemetry-card p-6 relative overflow-hidden">
                     <div
                        className="absolute top-0 inset-x-0 h-[2px] opacity-75"
                        style={{ background: `linear-gradient(90deg, transparent, ${data.teamB.color || '#A855F7'}, transparent)` }}
                     />
                     <h2 className="text-xs font-mono font-medium text-f1-silver/70 tracking-wider uppercase mb-2 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.teamB.color || '#A855F7' }} />
                        {data.teamB.name} — Driver Split
                     </h2>
                     <div style={{ height: 260 }}>
                        <ResponsivePie
                           data={donutDataB}
                           margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
                           innerRadius={0.55}
                           padAngle={2}
                           cornerRadius={4}
                           colors={{ datum: 'data.color' }}
                           enableArcLinkLabels={true}
                           arcLinkLabelsColor={{ from: 'color' }}
                           arcLinkLabelsTextColor="#9ca3af"
                           arcLabelsTextColor="#fff"
                           theme={{
                              tooltip: { container: { background: '#1a1a2e', color: '#fff', border: '1px solid #333' } },
                           }}
                        />
                     </div>
                     <div className="space-y-2 mt-2">
                        {data.driverSplitB.map(d => (
                           <div key={d.driver.id} className="flex items-center justify-between text-sm">
                              <span className="text-f1-silver/70 font-mono text-xs">{d.driver.code}</span>
                              <div className="flex gap-4 font-mono text-xs text-f1-silver/70">
                                 <span className="text-f1-white font-semibold">{d.points} pts ({d.percentage.toFixed(0)}%)</span>
                                 <span>Q: P{d.avgQuali.toFixed(1)}</span>
                                 <span>R: P{d.avgRace.toFixed(1)}</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Gap Table */}
               <div className="telemetry-card p-6 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                  <div className="flex items-center gap-2.5 mb-4">
                     <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06] bg-amber-400/10">
                        <Gauge className="w-4 h-4 text-amber-400" />
                     </div>
                     <h2 className="text-xs font-mono font-medium text-f1-silver/70 tracking-wider uppercase">Round-by-Round Breakdown</h2>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-sm">
                        <thead>
                           <tr className="border-b border-white/[0.06] text-f1-silver/50 text-[10px] font-mono uppercase tracking-[0.2em]">
                              <th className="text-left py-3 px-2">Round</th>
                              <th className="text-center py-3 px-2" style={{ color: data.teamA.color || '#3B82F6' }}>{data.teamA.name}</th>
                              <th className="text-center py-3 px-2" style={{ color: data.teamB.color || '#A855F7' }}>{data.teamB.name}</th>
                              <th className="text-center py-3 px-2">Gap</th>
                           </tr>
                        </thead>
                        <tbody>
                           {data.rounds
                              .filter(r => r.pointsA > 0 || r.pointsB > 0)
                              .map(r => (
                                 <tr key={r.round} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                                    <td className="py-2.5 px-2 text-f1-silver/70 font-mono text-xs">{r.raceName}</td>
                                    <td className="py-2.5 px-2 text-center font-mono font-semibold text-f1-white">{r.pointsA}</td>
                                    <td className="py-2.5 px-2 text-center font-mono font-semibold text-f1-white">{r.pointsB}</td>
                                    <td className={`py-2.5 px-2 text-center font-mono font-semibold ${r.gap > 0 ? 'text-emerald-400' : r.gap < 0 ? 'text-red-400' : 'text-f1-silver/50'}`}>
                                       {r.gap > 0 ? '+' : ''}{r.gap.toFixed(0)}
                                    </td>
                                 </tr>
                              ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </>
         )}

         {/* Empty state */}
         {!data && !loading && (
            <div className="telemetry-card p-12 text-center dot-grid relative overflow-hidden">
               <div className="absolute -top-16 -right-16 w-64 h-64 bg-f1-red/10 rounded-full blur-3xl pointer-events-none" />
               <Swords className="w-16 h-16 text-f1-silver/30 mx-auto mb-4 relative z-10" />
               <h3 className="text-xl font-display font-bold text-f1-white mb-2 relative z-10">Select Two Teams</h3>
               <p className="text-sm font-mono text-f1-silver/50 relative z-10">Choose two constructors above to see their head-to-head battle analysis</p>
            </div>
         )}
      </div>
   );
};

function adjustBrightness(hex: string, percent: number): string {
   const num = parseInt(hex.replace('#', ''), 16);
   const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * percent / 100));
   const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * percent / 100));
   const b = Math.min(255, (num & 0xff) + Math.round(255 * percent / 100));
   return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export default ConstructorComparisonPage;