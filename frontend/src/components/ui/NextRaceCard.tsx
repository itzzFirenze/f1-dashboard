import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Compass, ArrowUpRight } from 'lucide-react';
import CountdownTimer from '../ui/CountdownTimer';
import WeatherCard from '../ui/WeatherCard';
import type { Weather } from '../../types';

interface NextRaceCardProps {
   nextRaceId: string | number | null;
   nextRaceName: string;
   nextRaceCircuit: string | null;
   nextRaceCountry: string | null;
   nextSessionName?: string | null;
   nextSessionDate?: string | null;
   nextSessionTime?: string | null;
   nextRaceWeather?: Weather | null;
   onNotifyClick: () => void;
}

const NextRaceCard: React.FC<NextRaceCardProps> = ({
   nextRaceId,
   nextRaceName,
   nextRaceCircuit,
   nextRaceCountry,
   nextSessionName,
   nextSessionDate,
   nextSessionTime,
   nextRaceWeather,
   onNotifyClick,
}) => {
   return (
      <div>
         {/* Cinematic Next Race Banner */}
         <Link to={`/races/${nextRaceId}`} className="lg:col-span-2 group block outline-none">
            <div className="telemetry-card h-full p-5 sm:p-8 flex flex-col justify-between border border-f1-red/20 group-hover:border-f1-red/40 transition-all duration-300 relative overflow-hidden">
               {/* Background circuit ambient glow */}
               <div className="absolute -right-16 -top-16 w-64 h-64 bg-f1-red/10 rounded-full blur-3xl pointer-events-none group-hover:bg-f1-red/20 transition-all" />

               {/* Top banner tag */}
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-4 relative z-10">
                  <div className="flex items-center gap-2 min-w-0">
                     <div className="w-2.5 h-2.5 rounded-full bg-f1-red animate-ping shrink-0" />
                     <span className="text-xs font-mono font-bold text-f1-red-light tracking-[0.2em] uppercase truncate">
                        Upcoming: {nextSessionName || 'Grand Prix Weekend'}
                     </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                     <button
                        type="button"
                        onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           onNotifyClick();
                        }}
                        className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-f1-white bg-f1-red hover:bg-f1-red-dark transition-all px-3 py-1.5 sm:py-1 rounded-lg border border-f1-red/60 shadow-[0_0_12px_rgba(225,6,0,0.35)] hover:shadow-[0_0_18px_rgba(225,6,0,0.6)] cursor-pointer w-full sm:w-auto"
                     >
                        <Bell className="w-3.5 h-3.5 shrink-0" />
                        <span>NOTIFY ME</span>
                     </button>
                     <div className="flex items-center justify-center gap-1 text-xs font-mono text-f1-silver/70 group-hover:text-f1-white transition-colors bg-white/[0.04] px-2.5 py-1.5 sm:py-1 rounded-lg border border-white/[0.06] w-full sm:w-auto">
                        <span>TELEMETRY DECK</span>
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                     </div>
                  </div>
               </div>

               {/* Race Name & Circuit Info */}
               <div className="my-3 relative z-10">
                  <h2 className="text-2xl sm:text-4xl font-display font-black text-f1-white tracking-tight uppercase group-hover:text-f1-red-light transition-colors truncate">
                     {nextRaceName}
                  </h2>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1.5">
                     <p className="text-f1-silver/90 text-xs sm:text-base font-mono flex items-center gap-2 min-w-0">
                        <Compass className="w-4 h-4 text-f1-red shrink-0" />
                        <span className="truncate">{nextRaceCircuit ?? '—'}</span>
                        <span className="text-f1-silver/40 shrink-0">|</span>
                        <span className="text-f1-white font-semibold truncate">{nextRaceCountry ?? '—'}</span>
                     </p>

                     <CountdownTimer
                        targetDate={
                           nextSessionTime && nextSessionDate
                              ? `${nextSessionDate}T${nextSessionTime}Z`
                              : nextSessionDate || ''
                        }
                     />
                  </div>
               </div>
            </div>
         </Link>

         {/* Atmospheric Weather Card */}
         {nextRaceWeather && (
            <div className="h-full mt-4">
               <WeatherCard weather={nextRaceWeather} />
            </div>
         )}
      </div>
   );
};

export default NextRaceCard;