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
                  className="telemetry-card p-4 relative overflow-hidden"
               >
                  <div
                     className="absolute top-0 inset-x-0 h-[2px] opacity-90"
                     style={{ background: `linear-gradient(90deg, transparent, ${teamColor}, transparent)` }}
                  />

                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                     <div>
                        <h3 className="text-base font-display font-bold text-f1-white leading-tight">{driver.full_name}</h3>
                        <p className="text-[11px] font-mono text-f1-silver/50 uppercase tracking-wider mt-0.5">{driver.team_name}</p>
                     </div>
                     <span className="text-3xl font-black text-f1-white/15 font-mono">#{driver.driver_number}</span>
                  </div>

                  {!data ? (
                     <p className="text-sm font-mono text-f1-silver/40 text-center py-10">Awaiting telemetry frames...</p>
                  ) : (
                     <div className="mt-4 flex items-stretch gap-5">
                        {/* Vertical throttle / brake gauges */}
                        <div className="flex items-end gap-4">
                           <div className="flex flex-col items-center gap-1.5">
                              <span className="text-xs font-mono text-emerald-400 font-bold">{data.throttle}%</span>
                              <div className="h-28 w-4 bg-white/[0.06] rounded-full overflow-hidden flex items-end">
                                 <div
                                    className="w-full bg-emerald-500 rounded-full transition-all duration-150"
                                    style={{ height: `${data.throttle}%`, boxShadow: '0 0 8px rgba(16,185,129,0.6)' }}
                                 />
                              </div>
                              <span className="text-[9px] text-f1-silver/60 uppercase tracking-wide font-mono font-semibold">Throttle</span>
                           </div>
                           <div className="flex flex-col items-center gap-1.5">
                              <span className="text-xs font-mono text-red-400 font-bold">{data.brake}%</span>
                              <div className="h-28 w-4 bg-white/[0.06] rounded-full overflow-hidden flex items-end">
                                 <div
                                    className="w-full bg-red-500 rounded-full transition-all duration-150"
                                    style={{ height: `${data.brake}%`, boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}
                                 />
                              </div>
                              <span className="text-[9px] text-f1-silver/60 uppercase tracking-wide font-mono font-semibold">Brake</span>
                           </div>
                        </div>

                        {/* Gear / speed / rpm + DRS */}
                        <div className="flex-1 flex flex-col gap-3 justify-between">
                           <div className="grid grid-cols-3 gap-2">
                              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] py-2.5 text-center">
                                 <p className="text-[9px] text-f1-silver/50 uppercase tracking-wide font-mono">Gear</p>
                                 <p className="text-2xl font-black text-f1-white font-mono mt-0.5">{data.n_gear === 0 ? 'N' : data.n_gear}</p>
                              </div>
                              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] py-2.5 text-center">
                                 <p className="text-[9px] text-f1-silver/50 uppercase tracking-wide font-mono">Speed</p>
                                 <p className="text-2xl font-black text-f1-white font-mono mt-0.5">{data.speed}<span className="text-xs font-bold"> km/h</span></p>
                              </div>
                              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] py-2.5 text-center">
                                 <p className="text-[9px] text-f1-silver/50 uppercase tracking-wide font-mono">RPM</p>
                                 <p className="text-lg font-bold text-f1-white font-mono mt-0.5">{data.rpm}</p>
                              </div>
                           </div>

                           <div className="flex justify-between items-center text-sm rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                              <span className="text-f1-silver/60 text-xs uppercase tracking-wide font-mono font-semibold">DRS Status</span>
                              <span className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold ${data.drs >= 10 ? 'bg-f1-red text-white shadow-[0_0_8px_rgba(225,6,0,0.5)]' : 'bg-white/10 text-f1-silver/60'}`}>
                                 {data.drs >= 10 ? 'ENABLED' : 'DISABLED'}
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