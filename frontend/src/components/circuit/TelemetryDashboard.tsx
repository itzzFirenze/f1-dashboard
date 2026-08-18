import React from 'react';
import { useReplay } from '../../context/ReplayContext';
import { AlertCircle } from 'lucide-react';

export const TelemetryDashboard: React.FC = () => {
   const { telemetryData, selectedDrivers, drivers } = useReplay();

   if (selectedDrivers.length === 0) {
      return (
         <div className="telemetry-card p-8 text-center dot-grid relative overflow-hidden">
            <AlertCircle className="h-10 w-10 text-f1-silver/40 mx-auto mb-3 relative z-10" />
            <h4 className="text-sm font-display font-bold text-f1-white relative z-10">No Driver Selected</h4>
            <p className="text-xs font-mono text-f1-silver/50 mt-1.5 leading-relaxed relative z-10">
               Click driver markers on the circuit map to compare live telemetry.
            </p>
         </div>
      );
   }

   return (
      <div className="space-y-4">
         {selectedDrivers.map((driverNo) => {
            const driver = drivers.find((d) => d.driver_number === driverNo);
            const data = telemetryData[driverNo];
            const teamColor = driver ? `#${driver.team_colour}` : '#ffffff';

            if (!driver) return null;

            return (
                <div
                   key={driverNo}
                   className="telemetry-card p-3 sm:p-4 relative overflow-hidden"
                >
                   <div
                      className="absolute top-0 inset-x-0 h-[2px] opacity-90"
                      style={{ background: `linear-gradient(90deg, transparent, ${teamColor}, transparent)` }}
                   />

                   <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 sm:pb-3">
                      <div className="min-w-0">
                         <h3 className="text-sm sm:text-base font-display font-bold text-f1-white leading-tight truncate">{driver.full_name}</h3>
                         <p className="text-[10px] sm:text-[11px] font-mono text-f1-silver/50 uppercase tracking-wider mt-0.5 truncate">{driver.team_name}</p>
                      </div>
                      <span className="text-2xl sm:text-3xl font-black text-f1-white/15 font-mono shrink-0 ml-2">#{driver.driver_number}</span>
                   </div>

                   {!data ? (
                      <p className="text-xs sm:text-sm font-mono text-f1-silver/40 text-center py-6 sm:py-10">Awaiting telemetry frames...</p>
                   ) : (
                      <div className="mt-3 sm:mt-4 flex items-stretch gap-2.5 sm:gap-5">
                         {/* Vertical throttle / brake gauges */}
                         <div className="flex items-end gap-2 sm:gap-4 shrink-0">
                            <div className="flex flex-col items-center gap-1">
                               <span className="text-[10px] sm:text-xs font-mono text-emerald-400 font-bold">{data.throttle}%</span>
                               <div className="h-24 sm:h-28 w-3 sm:w-4 bg-white/[0.06] rounded-full overflow-hidden flex items-end">
                                  <div
                                     className="w-full bg-emerald-500 rounded-full transition-all duration-150"
                                     style={{ height: `${data.throttle}%`, boxShadow: '0 0 8px rgba(16,185,129,0.6)' }}
                                  />
                               </div>
                               <span className="text-[8px] sm:text-[9px] text-f1-silver/60 uppercase tracking-wide font-mono font-semibold">Thr</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                               <span className="text-[10px] sm:text-xs font-mono text-red-400 font-bold">{data.brake}%</span>
                               <div className="h-24 sm:h-28 w-3 sm:w-4 bg-white/[0.06] rounded-full overflow-hidden flex items-end">
                                  <div
                                     className="w-full bg-red-500 rounded-full transition-all duration-150"
                                     style={{ height: `${data.brake}%`, boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}
                                  />
                               </div>
                               <span className="text-[8px] sm:text-[9px] text-f1-silver/60 uppercase tracking-wide font-mono font-semibold">Brk</span>
                            </div>
                         </div>

                         {/* Gear / speed / rpm + DRS */}
                         <div className="flex-1 min-w-0 flex flex-col gap-2 sm:gap-3 justify-between">
                            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                               <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] py-1.5 sm:py-2.5 text-center min-w-0">
                                  <p className="text-[8px] sm:text-[9px] text-f1-silver/50 uppercase tracking-wide font-mono">Gear</p>
                                  <p className="text-lg sm:text-2xl font-black text-f1-white font-mono mt-0.5">{data.n_gear === 0 ? 'N' : data.n_gear}</p>
                               </div>
                               <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] py-1.5 sm:py-2.5 text-center min-w-0">
                                  <p className="text-[8px] sm:text-[9px] text-f1-silver/50 uppercase tracking-wide font-mono">Speed</p>
                                  <p className="text-lg sm:text-2xl font-black text-f1-white font-mono mt-0.5 truncate">{data.speed}<span className="text-[10px] sm:text-xs font-bold"> kph</span></p>
                               </div>
                               <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] py-1.5 sm:py-2.5 text-center min-w-0">
                                  <p className="text-[8px] sm:text-[9px] text-f1-silver/50 uppercase tracking-wide font-mono">RPM</p>
                                  <p className="text-sm sm:text-lg font-bold text-f1-white font-mono mt-0.5 truncate">{data.rpm}</p>
                               </div>
                            </div>

                            <div className="flex justify-between items-center text-xs sm:text-sm rounded-lg bg-white/[0.03] border border-white/[0.06] px-2.5 sm:px-3 py-1.5 sm:py-2 min-w-0">
                               <span className="text-f1-silver/60 text-[10px] sm:text-xs uppercase tracking-wide font-mono font-semibold truncate">DRS</span>
                               <span className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono font-bold shrink-0 ${data.drs >= 10 ? 'bg-f1-red text-white shadow-[0_0_8px_rgba(225,6,0,0.5)]' : 'bg-white/10 text-f1-silver/60'}`}>
                                  {data.drs >= 10 ? 'ON' : 'OFF'}
                                </span>
                            </div>
                         </div>
                      </div>
                   )}
                </div>
            );
         })}
      </div>
   );
};