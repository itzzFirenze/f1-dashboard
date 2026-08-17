import React from 'react';
import { Cloud, Droplets, Wind, Thermometer, Sun, CloudRain, Gauge } from 'lucide-react';
import type { Weather } from '../../types';

interface WeatherCardProps {
   weather: Weather;
   compact?: boolean;
}

/** Displays telemetry-grade atmospheric weather conditions for race engineering. */
const WeatherCard: React.FC<WeatherCardProps> = ({ weather, compact = false }) => {
   const getWeatherIcon = (condition: string) => {
      const lower = condition.toLowerCase();
      if (lower.includes('rain') || lower.includes('storm')) {
         return <CloudRain className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />;
      }
      if (lower.includes('cloud')) {
         return <Cloud className="w-7 h-7 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.3)]" />;
      }
      return <Sun className="w-7 h-7 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" />;
   };

   if (compact) {
      return (
         <div className="flex items-center gap-3">
            {getWeatherIcon(weather.condition)}
            <div>
               <span className="font-mono font-bold text-lg text-f1-white">{weather.temperature}°C</span>
               <span className="text-f1-silver text-xs ml-2 tracking-wide uppercase">{weather.condition}</span>
            </div>
         </div>
      );
   }

   return (
      <div className="telemetry-card p-5 sm:p-6 flex flex-col justify-between relative group">
         <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
               <h3 className="text-xs font-semibold text-f1-silver/80 uppercase tracking-[0.2em] font-mono">
                  Track Meteorology
               </h3>
            </div>
            {getWeatherIcon(weather.condition)}
         </div>

         <div className="my-4 flex items-baseline justify-between">
            <div>
               <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black font-display tracking-tight text-f1-white">
                     {weather.temperature}
                  </span>
                  <span className="text-xl font-mono text-f1-red">°C</span>
               </div>
               <p className="text-f1-silver/70 text-xs uppercase tracking-wider mt-0.5 font-medium">
                  {weather.condition} Conditions
               </p>
            </div>
            <div className="text-right">
               <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/[0.04] text-f1-silver/60 border border-white/[0.06]">
                  Track Sensor #04
               </span>
            </div>
         </div>

         {/* Sensor Readouts Grid */}
         <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
            <div className="flex flex-col items-center justify-center bg-f1-abyss/60 border border-white/[0.04] rounded-xl p-2.5 hover:border-cyan-500/20 transition-all">
               <Droplets className="w-4 h-4 text-cyan-400 mb-1" />
               <span className="text-[10px] text-f1-silver/60 uppercase font-mono tracking-wider">Precip</span>
               <span className="text-sm font-bold font-mono text-f1-white mt-0.5">{weather.rainProbability}%</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-f1-abyss/60 border border-white/[0.04] rounded-xl p-2.5 hover:border-emerald-500/20 transition-all">
               <Wind className="w-4 h-4 text-emerald-400 mb-1" />
               <span className="text-[10px] text-f1-silver/60 uppercase font-mono tracking-wider">Wind</span>
               <span className="text-sm font-bold font-mono text-f1-white mt-0.5">{weather.windSpeed} <span className="text-[10px] font-normal text-f1-silver/50">km/h</span></span>
            </div>
            <div className="flex flex-col items-center justify-center bg-f1-abyss/60 border border-white/[0.04] rounded-xl p-2.5 hover:border-amber-500/20 transition-all">
               <Thermometer className="w-4 h-4 text-amber-400 mb-1" />
               <span className="text-[10px] text-f1-silver/60 uppercase font-mono tracking-wider">Humidity</span>
               <span className="text-sm font-bold font-mono text-f1-white mt-0.5">{weather.humidity}%</span>
            </div>
         </div>
      </div>
   );
};

export default WeatherCard;