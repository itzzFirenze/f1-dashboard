import React, { useEffect, useState, useMemo } from 'react';
import { Award, Trophy, Medal, TrendingUp, Users, Percent } from 'lucide-react';
import { ResponsiveBar } from '@nivo/bar';
import { recordsService } from '../services/recordsService';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import type { RecordsData, DriverRecord, ConstructorRecord } from '../types';

type RecordCategory = 'driver-wins' | 'driver-podiums' | 'driver-points' | 'driver-winrate' | 'constructor-wins' | 'constructor-podiums' | 'constructor-points';

const CATEGORIES: { key: RecordCategory; label: string; icon: React.ElementType; group: 'driver' | 'constructor' }[] = [
   { key: 'driver-wins', label: 'Most Wins', icon: Trophy, group: 'driver' },
   { key: 'driver-podiums', label: 'Most Podiums', icon: Medal, group: 'driver' },
   { key: 'driver-points', label: 'Most Points', icon: TrendingUp, group: 'driver' },
   { key: 'driver-winrate', label: 'Win Rate', icon: Percent, group: 'driver' },
   { key: 'constructor-wins', label: 'Most Wins', icon: Trophy, group: 'constructor' },
   { key: 'constructor-podiums', label: 'Most Podiums', icon: Medal, group: 'constructor' },
   { key: 'constructor-points', label: 'Most Points', icon: TrendingUp, group: 'constructor' },
];

const RecordsPage: React.FC = () => {
   const [data, setData] = useState<RecordsData | null>(null);
   const [loading, setLoading] = useState(true);
   const [activeCategory, setActiveCategory] = useState<RecordCategory>('driver-wins');

   useEffect(() => {
      recordsService.getAll()
         .then(setData)
         .catch(console.error)
         .finally(() => setLoading(false));
   }, []);

   const activeRecords = useMemo(() => {
      if (!data) return [];
      const map: Record<RecordCategory, DriverRecord[] | ConstructorRecord[]> = {
         'driver-wins': data.mostWinsDriver,
         'driver-podiums': data.mostPodiumsDriver,
         'driver-points': data.mostPointsDriver,
         'driver-winrate': data.highestWinRateDriver,
         'constructor-wins': data.mostWinsConstructor,
         'constructor-podiums': data.mostPodiumsConstructor,
         'constructor-points': data.mostPointsConstructor,
      };
      return map[activeCategory] || [];
   }, [data, activeCategory]);

   const isDriverCategory = activeCategory.startsWith('driver');

   const barChartData = useMemo(() => {
      return activeRecords.map((r) => {
         if ('driverCode' in r) {
            return { id: (r as DriverRecord).driverCode, value: r.value, color: (r as DriverRecord).constructorColor || '#e11d48' };
         }
         return { id: (r as ConstructorRecord).constructorName, value: r.value, color: (r as ConstructorRecord).constructorColor || '#e11d48' };
      }).reverse();
   }, [activeRecords]);

   // Top 3 podium cards
   const top3 = useMemo(() => activeRecords.slice(0, 3), [activeRecords]);

   if (loading) return <PageSkeleton />;

   return (
      <div className="space-y-8 animate-fade-in">
         {/* Header */}
         <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-3">
               <Award className="w-8 h-8 text-yellow-400" />
               Historical Records Vault
            </h1>
            <p className="text-f1-silver mt-1">Grand Prix race records from the seasons currently synced in the database</p>
         </div>

         {/* Group Tabs: Drivers / Constructors */}
         <div className="flex gap-4 border-b border-f1-mid-gray/30 pb-0">
            {(['driver', 'constructor'] as const).map(group => (
               <button
                  key={group}
                  onClick={() => setActiveCategory(group === 'driver' ? 'driver-wins' : 'constructor-wins')}
                  className={`pb-3 px-1 text-sm font-semibold uppercase tracking-wider transition-colors border-b-2 ${activeCategory.startsWith(group)
                     ? 'text-f1-red border-f1-red'
                     : 'text-f1-silver border-transparent hover:text-white'
                     }`}
               >
                  <div className="flex items-center gap-2">
                     {group === 'driver' ? <Users className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
                     {group === 'driver' ? 'Drivers' : 'Constructors'}
                  </div>
               </button>
            ))}
         </div>

         {/* Category Pills */}
         <div className="flex gap-2 flex-wrap">
            {CATEGORIES.filter(c => c.group === (activeCategory.startsWith('driver') ? 'driver' : 'constructor')).map(cat => {
               const Icon = cat.icon;
               return (
                  <button
                     key={cat.key}
                     onClick={() => setActiveCategory(cat.key)}
                     className={`glass-card px-4 py-2 flex items-center gap-2 text-sm font-semibold transition-all ${activeCategory === cat.key
                        ? 'bg-f1-red/20 text-white border-f1-red/50'
                        : 'text-f1-silver hover:text-white hover:bg-white/5'
                        }`}
                  >
                     <Icon className="w-4 h-4" />
                     {cat.label}
                  </button>
               );
            })}
         </div>

         {/* Top 3 Podium Cards */}
         {top3.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {[1, 0, 2].map((podiumIdx, visualIdx) => {
                  const record = top3[podiumIdx];
                  if (!record) return null;
                  const isGold = podiumIdx === 0;
                  const isSilver = podiumIdx === 1;
                  const isBronze = podiumIdx === 2;
                  const medalColor = isGold ? '#FFD700' : isSilver ? '#C0C0C0' : '#CD7F32';
                  const name = 'driverCode' in record ? (record as DriverRecord).driverName : (record as ConstructorRecord).constructorName;
                  const code = 'driverCode' in record ? (record as DriverRecord).driverCode : (record as ConstructorRecord).constructorName;
                  const sub = 'driverCode' in record ? (record as DriverRecord).constructorName : '';
                  const color = 'constructorColor' in record ? record.constructorColor : '#666';

                  return (
                     <div
                        key={podiumIdx}
                        className={`glass-card p-6 text-center relative overflow-hidden transition-all ${isGold ? 'md:order-2 md:-mt-4 ring-1 ring-yellow-500/30' : isSilver ? 'md:order-1' : 'md:order-3'
                           }`}
                     >
                        {/* Glow */}
                        <div
                           className="absolute inset-0 opacity-10"
                           style={{ background: `radial-gradient(circle at center, ${medalColor}, transparent 70%)` }}
                        />

                        {/* Medal icon */}
                        <div className="relative z-10">
                           <div
                              className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold border-2"
                              style={{ borderColor: medalColor, color: medalColor }}
                           >
                              {podiumIdx + 1}
                           </div>
                           <div className="text-lg font-display font-bold">{code}</div>
                           <div className="text-sm text-f1-silver">{name}</div>
                           {sub && <div className="text-xs mt-1" style={{ color }}>{sub}</div>}
                           <div className="text-2xl font-bold mt-3" style={{ color: medalColor }}>
                              {record.displayValue}
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         )}

         {/* Bar Chart */}
         <div className="glass-card p-6">
            <h2 className="text-xl font-display font-semibold mb-6">
               {CATEGORIES.find(c => c.key === activeCategory)?.label} — Top {activeRecords.length}
            </h2>
            <div style={{ height: Math.max(350, barChartData.length * 40) }}>
               {barChartData.length > 0 ? (
                  <ResponsiveBar
                     data={barChartData}
                     keys={['value']}
                     indexBy="id"
                     layout="horizontal"
                     margin={{ top: 10, right: 30, bottom: 40, left: 80 }}
                     padding={0.3}
                     colors={({ data }) => (data as { color?: string }).color || '#e11d48'}
                     theme={{
                        text: { fill: '#9ca3af' },
                        axis: { ticks: { text: { fill: '#9ca3af', fontSize: 12, fontWeight: 600 } } },
                        grid: { line: { stroke: '#333' } },
                        tooltip: { container: { background: '#1a1a2e', color: '#fff', border: '1px solid #333' } },
                     }}
                     axisBottom={{ legend: 'Value', legendPosition: 'middle', legendOffset: 32 }}
                     enableLabel={true}
                     label={d => {
                        const record = activeRecords.find(r => {
                           if ('driverCode' in r) return (r as DriverRecord).driverCode === d.indexValue;
                           return (r as ConstructorRecord).constructorName === d.indexValue;
                        });
                        return record?.displayValue || String(d.value);
                     }}
                     labelTextColor="#fff"
                     animate={true}
                     motionConfig="gentle"
                  />
               ) : (
                  <div className="flex items-center justify-center h-full text-f1-silver">No records available</div>
               )}
            </div>
         </div>

         {/* Full Table */}
         <div className="glass-card p-6">
            <h2 className="text-xl font-display font-semibold mb-4">Full Leaderboard</h2>
            <div className="overflow-x-auto">
               <table className="w-full text-sm">
                  <thead>
                     <tr className="border-b border-f1-mid-gray text-f1-silver text-xs uppercase tracking-wider">
                        <th className="text-left py-3 px-2">Rank</th>
                        <th className="text-left py-3 px-2">{isDriverCategory ? 'Driver' : 'Constructor'}</th>
                        {isDriverCategory && <th className="text-left py-3 px-2">Team</th>}
                        <th className="text-right py-3 px-2">Record</th>
                     </tr>
                  </thead>
                  <tbody>
                     {activeRecords.map((record, idx) => {
                        const isDriver = 'driverCode' in record;
                        const dr = isDriver ? record as DriverRecord : null;
                        const cr = !isDriver ? record as ConstructorRecord : null;
                        const color = dr?.constructorColor || cr?.constructorColor || '#666';

                        return (
                           <tr key={idx} className="border-b border-f1-dark-gray/50 hover:bg-white/5 transition-colors">
                              <td className="py-2.5 px-2">
                                 <span className={`font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-600' : 'text-f1-silver'}`}>
                                    {idx + 1}
                                 </span>
                              </td>
                              <td className="py-2.5 px-2">
                                 <div className="flex items-center gap-2">
                                    <div className="w-1 h-6 rounded-full" style={{ backgroundColor: color }} />
                                    <span className="font-semibold">{dr ? dr.driverName : cr?.constructorName}</span>
                                    {dr && <span className="text-xs text-f1-silver font-mono">{dr.driverCode}</span>}
                                 </div>
                              </td>
                              {isDriverCategory && (
                                 <td className="py-2.5 px-2 text-f1-silver text-xs">{dr?.constructorName || ''}</td>
                              )}
                              <td className="py-2.5 px-2 text-right font-bold">{record.displayValue}</td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
};

export default RecordsPage;