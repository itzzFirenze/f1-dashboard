import React, { useEffect, useState, useMemo } from 'react';
import {
   Cloud, CloudRain, Sun, Wind, Droplets, ThermometerSun, AlertTriangle,
   CloudLightning, CalendarDays, Compass, ArrowUpRight, Radio
} from 'lucide-react';
import { ResponsiveLine } from '@nivo/line';
import { weatherService, WeekendWeatherDto } from '../services/weatherService';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import PageHeroTitle from '@/components/ui/PageHeroTitle';
import EmptyState from '../components/ui/EmptyState';
import SearchInput from '../components/ui/SearchInput';
import { Link } from 'react-router-dom';

/** Small circular HUD dial */
const HudDial: React.FC<{ percent: number; colorHex: string; size?: number }> = ({
   percent,
   colorHex,
   size = 48,
}) => {
   const radius = 20;
   const circumference = 2 * Math.PI * radius;
   const strokeDashoffset = circumference - (Math.min(Math.max(percent, 0), 100) / 100) * circumference;

   return (
      <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
         <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r={radius} className="gauge-track" />
            <circle
               cx="24"
               cy="24"
               r={radius}
               className="gauge-fill"
               style={{
                  stroke: colorHex,
                  strokeDasharray: circumference,
                  strokeDashoffset,
                  filter: `drop-shadow(0 0 4px ${colorHex}80)`,
               }}
            />
         </svg>
         <span className="absolute font-mono text-[9px] font-bold text-f1-white/90">
            {Math.round(percent)}%
         </span>
      </div>
   );
};

const WeatherForecastPage: React.FC = () => {
   const [forecasts, setForecasts] = useState<WeekendWeatherDto[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState('');

   useEffect(() => {
      weatherService.getUpcomingForecasts()
         .then(setForecasts)
         .catch(console.error)
         .finally(() => setLoading(false));
   }, []);

   const filteredForecasts = useMemo(() => {
      if (!search.trim()) return forecasts;
      const q = search.toLowerCase();
      return forecasts.filter(f =>
         f.raceName.toLowerCase().startsWith(q) ||
         f.country.toLowerCase().startsWith(q)
      );
   }, [forecasts, search]);

   if (loading) return <PageSkeleton />;

   if (forecasts.length === 0) {
      return <EmptyState title="No upcoming races" message="Weather forecasts are only available for upcoming race weekends." />;
   }

   return (
      <div className="space-y-7 animate-fade-in">
         {/* ─── Hero Section: Mission Control HUD ─── */}
         <div className="relative overflow-hidden rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-5 sm:p-8 shadow-2xl dot-grid">
            <div className="scanline-overlay" />

            <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-f1-red/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
               <div className="space-y-2">
                  <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-sky-400/10 border border-sky-400/25 backdrop-blur-md">
                     <Radio className="w-3.5 h-3.5 text-sky-300" />
                     <span className="text-sky-300 text-xs font-mono font-bold tracking-[0.2em] uppercase">
                        TRACKSIDE METEOROLOGY UNIT
                     </span>
                  </div>

                  <PageHeroTitle titlePrefix="WEATHER" titleAccent="TELEMETRY" />

                  <p className="text-f1-silver text-sm sm:text-base max-w-xl font-medium leading-relaxed">
                     Session-by-session atmospheric projections for every upcoming Grand Prix weekend.
                  </p>
               </div>

               <div className="w-full sm:w-64">
                  <SearchInput value={search} onChange={setSearch} placeholder="Search races or countries..." />
               </div>
            </div>
         </div>

         {/* ─── Weekend Forecast Telemetry Blocks ─── */}
         {filteredForecasts.length === 0 ? (
            <EmptyState title="No matching races" message="Try a different search term." />
         ) : (
            <div className="space-y-6">
               {filteredForecasts.map(forecast => (
                  <WeekendForecast key={forecast.raceId} forecast={forecast} />
               ))}
            </div>
         )}
      </div>
   );
};

const WeekendForecast: React.FC<{ forecast: WeekendWeatherDto }> = ({ forecast }) => {
   const highRainRisk = forecast.sessions.some(s => s.rainProbability > 60);

   const rainData = useMemo(() => [
      {
         id: 'Rain Probability',
         data: forecast.sessions.map(s => ({
            x: s.sessionName,
            y: s.rainProbability
         }))
      }
   ], [forecast]);

   const tempData = useMemo(() => [
      {
         id: 'Track Temp',
         data: forecast.sessions.map(s => ({
            x: s.sessionName,
            y: s.trackTemperature
         }))
      },
      {
         id: 'Air Temp',
         data: forecast.sessions.map(s => ({
            x: s.sessionName,
            y: s.temperature
         }))
      }
   ], [forecast]);

   const nivoTheme = {
      text: { fill: '#8a8f98', fontSize: 11, fontFamily: 'var(--font-mono, monospace)' },
      grid: { line: { stroke: 'rgba(255,255,255,0.06)' } },
      tooltip: {
         container: {
            background: '#0d0f14',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
         },
      },
   };

   return (
      <div className="diagonal-card relative overflow-hidden">
         {/* Dynamic Accent Line */}
         <div
            className="absolute left-0 top-0 bottom-0 w-1.5"
            style={{ backgroundColor: highRainRisk ? '#3b82f6' : '#E10600' }}
         />

         {/* Header */}
         <div className="p-6 sm:p-7 border-b border-white/[0.04] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
               <Link to={`/races/${forecast.raceId}`} className="group inline-flex items-center gap-2 outline-none">
                  <h2 className="text-2xl sm:text-3xl font-display font-black text-f1-white uppercase tracking-tight group-hover:text-f1-red-light transition-colors">
                     {forecast.raceName}
                  </h2>
                  <ArrowUpRight className="w-4 h-4 text-f1-silver/40 group-hover:text-f1-red-light group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
               </Link>
               <p className="text-f1-silver/90 text-sm font-mono mt-2 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-f1-red" />
                  <span>
                     {new Date(forecast.raceDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-f1-silver/40">|</span>
                  <span className="text-f1-white font-semibold">{forecast.country}</span>
               </p>
            </div>

            {highRainRisk && (
               <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  <AlertTriangle className="w-3.5 h-3.5 text-blue-300" />
                  <span className="text-blue-300 text-xs font-mono font-bold tracking-[0.15em] uppercase">
                     High Rain Risk
                  </span>
               </div>
            )}
         </div>

         <div className="p-6 sm:p-7 space-y-8">
            {/* Session Telemetry Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
               {forecast.sessions.map(session => (
                  <div key={session.sessionName} className="telemetry-card p-4 flex flex-col items-center text-center relative overflow-hidden">
                     <div
                        className="absolute top-0 inset-x-0 h-[2px] opacity-60"
                        style={{ background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)' }}
                     />
                     <div className="text-[10px] font-mono font-semibold text-f1-silver/60 uppercase tracking-widest mb-3">
                        {session.sessionName}
                     </div>

                     <WeatherIcon condition={session.condition} />

                     <div className="font-display font-black text-xl text-f1-white mt-2">{session.temperature}°C</div>
                     <div className="text-[11px] font-mono text-f1-silver/50 uppercase tracking-wider mb-3">{session.condition}</div>

                     {/* Rain Probability HUD Dial */}
                     <div className="flex items-center justify-center mb-3">
                        <HudDial percent={session.rainProbability} colorHex="#3b82f6" />
                     </div>

                     <div className="w-full space-y-1.5 pt-3 border-t border-white/[0.06] text-[11px] font-mono">
                        <div className="flex justify-between items-center text-sky-300">
                           <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> RAIN</span>
                           <span>{session.rainProbability}%</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-400">
                           <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> WIND</span>
                           <span>{session.windSpeed} km/h</span>
                        </div>
                        <div className="flex justify-between items-center text-f1-silver/70">
                           <span className="flex items-center gap-1"><ThermometerSun className="w-3 h-3" /> TRACK</span>
                           <span>{session.trackTemperature}°C</span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>

            {/* Telemetry Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               {/* Temperature Chart */}
               <div className="telemetry-card p-5 overflow-visible">
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50 mb-4 text-center">
                     Temperature Evolution
                  </h3>
                  <div style={{ height: 200, overflow: 'visible' }}>
                     <ResponsiveLine
                        data={tempData}
                        margin={{ top: 10, right: 20, bottom: 40, left: 40 }}
                        xScale={{ type: 'point' }}
                        yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
                        axisTop={null}
                        axisRight={null}
                        axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
                        axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
                        colors={['#f59e0b', '#E10600']}
                        pointSize={7}
                        pointColor={{ theme: 'background' }}
                        pointBorderWidth={2}
                        pointBorderColor={{ from: 'serieColor' }}
                        pointLabelYOffset={-12}
                        useMesh={true}
                        enableArea={false}
                        curve="monotoneX"
                        theme={nivoTheme}
                        legends={[
                           {
                              anchor: 'bottom',
                              direction: 'row',
                              justify: false,
                              translateX: 0,
                              translateY: 40,
                              itemWidth: 100,
                              itemHeight: 20,
                              itemTextColor: '#8a8f98',
                              symbolSize: 10,
                              symbolShape: 'circle',
                           }
                        ]}
                     />
                  </div>
               </div>

               {/* Rain Probability Chart */}
               <div className="telemetry-card p-5">
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50 mb-4 text-center">
                     Rain Probability
                  </h3>
                  <div style={{ height: 200 }}>
                     <ResponsiveLine
                        data={rainData}
                        margin={{ top: 10, right: 20, bottom: 40, left: 40 }}
                        xScale={{ type: 'point' }}
                        yScale={{ type: 'linear', min: 0, max: 100, stacked: false, reverse: false }}
                        axisTop={null}
                        axisRight={null}
                        axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
                        axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0, legend: '%', legendOffset: -30, legendPosition: 'middle' }}
                        colors={['#38bdf8']}
                        pointSize={7}
                        pointColor={{ theme: 'background' }}
                        pointBorderWidth={2}
                        pointBorderColor={{ from: 'serieColor' }}
                        enableArea={true}
                        areaOpacity={0.25}
                        curve="monotoneX"
                        theme={nivoTheme}
                     />
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

const WeatherIcon: React.FC<{ condition: string }> = ({ condition }) => {
   const cond = condition.toLowerCase();

   if (cond.includes('thunder') || cond.includes('storm')) {
      return <CloudLightning className="w-9 h-9 text-amber-400 animate-pulse" />;
   }
   if (cond.includes('rain') || cond.includes('shower') || cond.includes('drizzle')) {
      return <CloudRain className="w-9 h-9 text-sky-400" />;
   }
   if (cond.includes('cloud') || cond.includes('overcast')) {
      if (cond.includes('partly')) {
         return (
            <div className="relative w-9 h-9">
               <Sun className="w-7 h-7 text-amber-400 absolute top-0 right-0" />
               <Cloud className="w-7 h-7 text-f1-silver/60 absolute bottom-0 left-0" fill="currentColor" />
            </div>
         );
      }
      return <Cloud className="w-9 h-9 text-f1-silver/50" fill="currentColor" />;
   }

   return <Sun className="w-9 h-9 text-amber-400" />;
};

export default WeatherForecastPage;