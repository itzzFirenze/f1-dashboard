import React from 'react';
import { useReplay } from '../../context/ReplayContext';
import { AlertCircle } from 'lucide-react';

export const TelemetryDashboard: React.FC = () => {
   const { telemetryData, selectedDrivers, drivers } = useReplay();

   if (selectedDrivers.length === 0) {
      return (
         <div className="rounded-xl border border-white/5 bg-f1-dark-gray/40 p-8 text-center backdrop-blur-md">
            <AlertCircle className="h-10 w-10 text-f1-silver/50 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-f1-white">No Driver Selected</h4>
            <p className="text-xs text-f1-silver mt-1.5 leading-relaxed">
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
                  className="rounded-2xl border border-white/10 bg-f1-black/50 p-4 shadow-xl relative overflow-hidden"
               >
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: teamColor }} />

                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                     <div>
                        <h3 className="text-base font-bold text-f1-white leading-tight">{driver.full_name}</h3>
                        <p className="text-[11px] text-f1-silver uppercase tracking-wider mt-0.5">{driver.team_name}</p>
                     </div>
                     <span className="text-3xl font-black text-f1-white/20 font-mono">#{driver.driver_number}</span>
                  </div>

                  {!data ? (
                     <p className="text-sm text-f1-silver/40 text-center py-10">Awaiting telemetry frames...</p>
                  ) : (
                     <div className="mt-4 flex items-stretch gap-5">
                        {/* Vertical throttle / brake gauges */}
                        <div className="flex items-end gap-4">
                           <div className="flex flex-col items-center gap-1.5">
                              <span className="text-xs font-mono text-emerald-400 font-bold">{data.throttle}%</span>
                              <div className="h-28 w-4 bg-white/[0.06] rounded-full overflow-hidden flex items-end">
                                 <div
                                    className="w-full bg-emerald-500 rounded-full transition-all duration-150"
                                    style={{ height: `${data.throttle}%` }}
                                 />
                              </div>
                              <span className="text-[9px] text-f1-silver uppercase tracking-wide font-semibold">Throttle</span>
                           </div>
                           <div className="flex flex-col items-center gap-1.5">
                              <span className="text-xs font-mono text-red-400 font-bold">{data.brake}%</span>
                              <div className="h-28 w-4 bg-white/[0.06] rounded-full overflow-hidden flex items-end">
                                 <div
                                    className="w-full bg-red-500 rounded-full transition-all duration-150"
                                    style={{ height: `${data.brake}%` }}
                                 />
                              </div>
                              <span className="text-[9px] text-f1-silver uppercase tracking-wide font-semibold">Brake</span>
                           </div>
                        </div>

                        {/* Gear / speed / rpm + DRS */}
                        <div className="flex-1 flex flex-col gap-3 justify-between">
                           <div className="grid grid-cols-3 gap-2">
                              <div className="rounded-lg bg-white/[0.03] border border-white/5 py-2.5 text-center">
                                 <p className="text-[9px] text-f1-silver uppercase tracking-wide">Gear</p>
                                 <p className="text-2xl font-black text-f1-white font-mono mt-0.5">{data.n_gear === 0 ? 'N' : data.n_gear}</p>
                              </div>
                              <div className="rounded-lg bg-white/[0.03] border border-white/5 py-2.5 text-center">
                                 <p className="text-[9px] text-f1-silver uppercase tracking-wide">Speed</p>
                                 <p className="text-2xl font-black text-f1-white font-mono mt-0.5">{data.speed}<span className="text-xs font-bold"> km/h</span></p>
                              </div>
                              <div className="rounded-lg bg-white/[0.03] border border-white/5 py-2.5 text-center">
                                 <p className="text-[9px] text-f1-silver uppercase tracking-wide">RPM</p>
                                 <p className="text-lg font-bold text-f1-white font-mono mt-0.5">{data.rpm}</p>
                              </div>
                           </div>

                           <div className="flex justify-between items-center text-sm rounded-lg bg-white/[0.02] border border-white/5 px-3 py-2">
                              <span className="text-f1-silver text-xs uppercase tracking-wide font-semibold">DRS Status</span>
                              <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${data.drs >= 10 ? 'bg-f1-red text-white' : 'bg-white/10 text-f1-silver'}`}>
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