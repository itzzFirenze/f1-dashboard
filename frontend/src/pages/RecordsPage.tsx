import React, { useEffect, useState, useMemo } from 'react';
import { Award, Trophy, Medal, TrendingUp, Users, Percent, Shield } from 'lucide-react';
import { ResponsiveBar } from '@nivo/bar';
import { recordsService } from '../services/recordsService';
import SeasonSelector from '../components/ui/SeasonSelector';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import PageHeroTitle from '@/components/ui/PageHeroTitle';
import { resolveTheme, getDriverImage } from '../config/teamThemes';
import type { RecordsData, DriverRecord, ConstructorRecord } from '../types';

type RecordCategory = 'driver-wins' | 'driver-podiums' | 'driver-points' | 'driver-winrate' | 'constructor-wins' | 'constructor-podiums' | 'constructor-points';

const CATEGORIES: { key: RecordCategory; label: string; icon: React.ElementType; group: 'driver' | 'constructor'; accent: string }[] = [
   { key: 'driver-wins', label: 'Most Wins', icon: Trophy, group: 'driver', accent: '#f59e0b' },
   { key: 'driver-podiums', label: 'Most Podiums', icon: Medal, group: 'driver', accent: '#38bdf8' },
   { key: 'driver-points', label: 'Most Points', icon: TrendingUp, group: 'driver', accent: '#10b981' },
   { key: 'driver-winrate', label: 'Win Rate', icon: Percent, group: 'driver', accent: '#a855f7' },
   { key: 'constructor-wins', label: 'Most Wins', icon: Trophy, group: 'constructor', accent: '#f59e0b' },
   { key: 'constructor-podiums', label: 'Most Podiums', icon: Medal, group: 'constructor', accent: '#38bdf8' },
   { key: 'constructor-points', label: 'Most Points', icon: TrendingUp, group: 'constructor', accent: '#10b981' },
];

/**
 * Resolves the correct image to show for a record row:
 * - Driver records -> driver headshot via getDriverImage(theme, firstName, lastName)
 * - Constructor records -> team logo via theme.teamLogoUrl
 */
const getRecordImage = (record: DriverRecord | ConstructorRecord): string | undefined => {
   const isDriver = 'driverCode' in record;
   const constructorName = isDriver
      ? (record as DriverRecord).constructorName
      : (record as ConstructorRecord).constructorName;
   const theme = resolveTheme(constructorName);

   if (isDriver) {
      const dr = record as DriverRecord;
      const [firstName, ...rest] = dr.driverName.split(' ');
      const lastName = rest.join(' ');
      return getDriverImage(theme, firstName, lastName) ?? undefined;
   }
   return theme.teamLogoUrl ?? undefined;
};

/** Small avatar/logo component with graceful fallback to initials/code on error or missing image */
const RecordAvatar: React.FC<{
   record: DriverRecord | ConstructorRecord;
   fallbackText: string;
   color: string;
   size?: 'sm' | 'lg';
}> = ({ record, fallbackText, color, size = 'sm' }) => {
   const [imgError, setImgError] = useState(false);
   const isDriver = 'driverCode' in record;
   const imgUrl = getRecordImage(record);
   const showImg = imgUrl && !imgError;

   const dims = size === 'lg' ? 'w-14 h-14 rounded-2xl' : 'w-7 h-7 rounded-lg';

   return (
      <div
         className={`${dims} overflow-hidden flex items-center justify-center font-display font-black shrink-0 border border-white/[0.08] shadow-lg`}
         style={{ backgroundColor: `${color}30` }}
      >
         {showImg ? (
            <img
               src={imgUrl}
               alt={fallbackText}
               className={isDriver ? 'w-full h-full object-cover object-top' : 'w-2/3 h-2/3 object-contain'}
               onError={() => setImgError(true)}
            />
         ) : (
            <span className={`font-mono text-white ${size === 'lg' ? 'text-lg' : 'text-[10px]'}`}>
               {fallbackText}
            </span>
         )}
      </div>
   );
};

/**
 * Custom bar label layer. Renders each value just outside the end of its bar
 * (rather than nivo's default centered-inside placement) so zero-value bars
 * — which have zero width — don't collapse their label onto the axis/driver
 * name column.
 */
const BarValueLabelsLayer = (activeRecords: (DriverRecord | ConstructorRecord)[]) =>
   ({ bars }: any) => (
      <g>
         {bars.map((bar: any) => {
            const { x, y, width, height, data, key } = bar;
            const record = activeRecords.find(r => {
               if ('driverCode' in r) return (r as DriverRecord).driverCode === data.indexValue;
               return (r as ConstructorRecord).constructorName === data.indexValue;
            });
            const labelText = record?.displayValue ?? String(data.value);
            return (
               <text
                  key={key}
                  x={x + width + 8}
                  y={y + height / 2}
                  textAnchor="start"
                  dominantBaseline="central"
                  style={{
                     fill: '#fff',
                     fontSize: 11,
                     fontFamily: 'ui-monospace, monospace',
                     fontWeight: 700,
                  }}
               >
                  {labelText}
               </text>
            );
         })}
      </g>
   );

const RecordsPage: React.FC = () => {
   const [season, setSeason] = useState<number | null>(2026);
   const [data, setData] = useState<RecordsData | null>(null);
   const [loading, setLoading] = useState(true);
   const [activeCategory, setActiveCategory] = useState<RecordCategory>('driver-wins');

   useEffect(() => {
      setLoading(true);
      recordsService.getAll(season || undefined)
         .then(setData)
         .catch(console.error)
         .finally(() => setLoading(false));
   }, [season]);

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
   const activeCatMeta = CATEGORIES.find(c => c.key === activeCategory)!;

   const barChartData = useMemo(() => {
      return activeRecords.map((r) => {
         if ('driverCode' in r) {
            return { id: (r as DriverRecord).driverCode, value: r.value, color: (r as DriverRecord).constructorColor || '#e11d48' };
         }
         return { id: (r as ConstructorRecord).constructorName, value: r.value, color: (r as ConstructorRecord).constructorColor || '#e11d48' };
      }).reverse();
   }, [activeRecords]);

   const top3 = useMemo(() => activeRecords.slice(0, 3), [activeRecords]);

   if (loading) return <PageSkeleton />;

   return (
      <div className="space-y-7 animate-fade-in">
         {/* ─── Hero Section: Archive HUD ─── */}
         <div className="relative overflow-hidden rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-5 sm:p-8 shadow-2xl dot-grid">
            <div className="scanline-overlay" />
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-f1-red/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
               <div className="space-y-2">
                  <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 backdrop-blur-md">
                     <span className="text-amber-300 text-xs font-mono font-bold tracking-[0.2em] uppercase">
                        FIA Archive Database
                     </span>
                  </div>

                  <PageHeroTitle icon={Award} titlePrefix="Historical" titleAccent="Records Vault" iconColorClass="text-amber-400" />

                  <p className="text-f1-silver text-sm sm:text-base max-w-xl font-medium leading-relaxed">
                     {season ? `${season} season` : 'All-time'} Grand Prix race records, wins, podiums & scoring milestones.
                  </p>
               </div>

               <SeasonSelector
                  selectedSeason={season}
                  onSelectSeason={setSeason}
                  allowAll={true}
                  allLabel="All-Time Records"
                  label="Select Archive Scope"
               />
            </div>
         </div>

         {/* ─── Group Selector ─── */}
         <div className="inline-flex p-1 rounded-xl bg-f1-abyss/60 border border-white/[0.06] gap-1">
            {(['driver', 'constructor'] as const).map(group => {
               const active = activeCategory.startsWith(group);
               const GroupIcon = group === 'driver' ? Users : Shield;
               return (
                  <button
                     key={group}
                     onClick={() => setActiveCategory(group === 'driver' ? 'driver-wins' : 'constructor-wins')}
                     className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${active
                        ? 'bg-f1-red/20 text-f1-white border border-f1-red/40'
                        : 'text-f1-silver/60 hover:text-f1-white border border-transparent'
                        }`}
                  >
                     <GroupIcon className="w-3.5 h-3.5" />
                     {group === 'driver' ? 'Drivers' : 'Constructors'}
                  </button>
               );
            })}
         </div>

         {/* ─── Category Pills ─── */}
         <div className="flex gap-2 flex-wrap">
            {CATEGORIES.filter(c => c.group === (activeCategory.startsWith('driver') ? 'driver' : 'constructor')).map(cat => {
               const Icon = cat.icon;
               const active = activeCategory === cat.key;
               return (
                  <button
                     key={cat.key}
                     onClick={() => setActiveCategory(cat.key)}
                     className={`pill-button gap-2 text-xs font-mono font-semibold uppercase tracking-wider transition-all ${active
                        ? 'border-white/[0.16] bg-white/[0.06] text-f1-white'
                        : 'text-f1-silver/60 hover:text-f1-white'
                        }`}
                  >
                     <Icon className="w-3.5 h-3.5" style={{ color: active ? cat.accent : undefined }} />
                     {cat.label}
                  </button>
               );
            })}
         </div>

         {/* ─── Top 3 Podium: Telemetry Standings ─── */}
         {top3.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {[1, 0, 2].map((podiumIdx) => {
                  const record = top3[podiumIdx];
                  if (!record) return null;
                  const isGold = podiumIdx === 0;
                  const isSilver = podiumIdx === 1;
                  const medalColor = isGold ? '#FFD700' : isSilver ? '#C0C0C0' : '#CD7F32';
                  const name = 'driverCode' in record ? (record as DriverRecord).driverName : (record as ConstructorRecord).constructorName;
                  const code = 'driverCode' in record ? (record as DriverRecord).driverCode : (record as ConstructorRecord).constructorName;
                  const sub = 'driverCode' in record ? (record as DriverRecord).constructorName : '';
                  const color = 'constructorColor' in record ? record.constructorColor : '#666';

                  return (
                     <div
                        key={podiumIdx}
                        className={`diagonal-card p-6 relative group transition-all duration-300 ${isGold ? 'md:order-2 md:-mt-4' : isSilver ? 'md:order-1' : 'md:order-3'
                           }`}
                     >
                        {/* Accent line */}
                        <div
                           className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2"
                           style={{ backgroundColor: medalColor }}
                        />
                        {/* Ambient glow */}
                        <div
                           className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
                           style={{ backgroundColor: medalColor }}
                        />

                        <div className="relative z-10">
                           <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.04]">
                              <div className="flex items-center gap-2.5">
                                 <div
                                    className="p-1.5 rounded-lg border"
                                    style={{ backgroundColor: `${medalColor}15`, borderColor: `${medalColor}30`, color: medalColor }}
                                 >
                                    <Trophy className="w-4 h-4" />
                                 </div>
                                 <span className="text-xs font-mono font-bold text-f1-silver/80 uppercase tracking-widest">
                                    Rank #{podiumIdx + 1}
                                 </span>
                              </div>
                              <span
                                 className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]"
                                 style={{ color: medalColor }}
                              >
                                 {isGold ? 'GOLD' : isSilver ? 'SILVER' : 'BRONZE'}
                              </span>
                           </div>

                           <div className="flex items-center gap-4">
                              <RecordAvatar
                                 record={record}
                                 fallbackText={code}
                                 color={color}
                                 size="lg"
                              />
                              <div className="flex-1 min-w-0">
                                 <h3 className="text-lg font-display font-black text-f1-white truncate">{name}</h3>
                                 {sub && (
                                    <p className="text-xs font-mono font-medium truncate mt-0.5" style={{ color }}>
                                       {sub}
                                    </p>
                                 )}
                              </div>
                           </div>

                           <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-baseline justify-between">
                              <span className="text-[10px] font-mono tracking-widest text-f1-silver/50 uppercase">
                                 Record Value
                              </span>
                              <span className="text-2xl font-display font-black" style={{ color: medalColor }}>
                                 {record.displayValue}
                              </span>
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         )}

         {/* ─── Bar Chart ─── */}
         <div className="telemetry-card p-6 relative overflow-hidden">
            <div
               className="absolute top-0 inset-x-0 h-[2px] opacity-75"
               style={{ background: `linear-gradient(90deg, transparent, ${activeCatMeta.accent}, transparent)` }}
            />
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-2.5">
                  <div
                     className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06]"
                     style={{ backgroundColor: `${activeCatMeta.accent}15` }}
                  >
                     <activeCatMeta.icon className="w-4 h-4" style={{ color: activeCatMeta.accent }} />
                  </div>
                  <div>
                     <h2 className="text-sm font-mono font-bold text-f1-white uppercase tracking-widest">
                        {activeCatMeta.label}
                     </h2>
                     <p className="text-[10px] font-mono text-f1-silver/50 uppercase tracking-wider">
                        Top {activeRecords.length} · {isDriverCategory ? 'Driver' : 'Constructor'} Telemetry
                     </p>
                  </div>
               </div>
            </div>
            <div style={{ height: Math.max(350, barChartData.length * 40) }}>
               {barChartData.length > 0 ? (
                  <ResponsiveBar
                     data={barChartData}
                     keys={['value']}
                     indexBy="id"
                     layout="horizontal"
                     margin={{ top: 10, right: 56, bottom: 40, left: 80 }}
                     padding={0.3}
                     colors={({ data }) => (data as { color?: string }).color || '#e11d48'}
                     theme={{
                        text: { fill: '#9ca3af' },
                        axis: { ticks: { text: { fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace', fontWeight: 600 } } },
                        grid: { line: { stroke: '#333' } },
                        tooltip: { container: { background: '#1a1a2e', color: '#fff', border: '1px solid #333' } },
                     }}
                     axisBottom={{ legend: 'Value', legendPosition: 'middle', legendOffset: 32 }}
                     enableLabel={false}
                     layers={['grid', 'axes', 'bars', BarValueLabelsLayer(activeRecords), 'markers', 'legends']}
                     animate={true}
                     motionConfig="gentle"
                  />
               ) : (
                  <div className="flex items-center justify-center h-full text-f1-silver/50 text-sm font-mono uppercase tracking-wider">
                     No records available
                  </div>
               )}
            </div>
         </div>

         {/* ─── Full Leaderboard Table ─── */}
         <div className="telemetry-card p-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] opacity-50 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="flex items-center gap-2.5 mb-5">
               <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06] bg-white/[0.04]">
                  {isDriverCategory ? <Users className="w-4 h-4 text-f1-silver/80" /> : <Shield className="w-4 h-4 text-f1-silver/80" />}
               </div>
               <h2 className="text-sm font-mono font-bold text-f1-white uppercase tracking-widest">
                  Full Leaderboard
               </h2>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-sm">
                  <thead>
                     <tr className="border-b border-white/[0.06] text-f1-silver/50 text-[10px] font-mono uppercase tracking-widest">
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
                        const name = dr ? dr.driverName : cr?.constructorName || '';
                        const fallbackText = dr ? dr.driverCode : (cr?.constructorName || '').substring(0, 3).toUpperCase();

                        return (
                           <tr key={idx} className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors">
                              <td className="py-2.5 px-2">
                                 <span className={`font-mono font-bold text-xs ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-600' : 'text-f1-silver/50'}`}>
                                    {String(idx + 1).padStart(2, '0')}
                                 </span>
                              </td>
                              <td className="py-2.5 px-2">
                                 <div className="flex items-center gap-2.5">
                                    <div className="w-1 h-6 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                    <RecordAvatar
                                       record={record}
                                       fallbackText={fallbackText}
                                       color={color}
                                       size="sm"
                                    />
                                    <span className="font-semibold text-f1-white">{name}</span>
                                    {dr && <span className="text-[10px] text-f1-silver/50 font-mono">{dr.driverCode}</span>}
                                 </div>
                              </td>
                              {isDriverCategory && (
                                 <td className="py-2.5 px-2 text-f1-silver/60 text-xs font-mono">{dr?.constructorName || ''}</td>
                              )}
                              <td className="py-2.5 px-2 text-right font-mono font-bold text-f1-white">{record.displayValue}</td>
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