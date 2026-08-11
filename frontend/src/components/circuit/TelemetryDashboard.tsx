import React from 'react';
import { useReplay } from '../../context/ReplayContext';
import { AlertCircle } from 'lucide-react';

export const TelemetryDashboard: React.FC = () => {
   const { telemetryData, selectedDrivers, drivers } = useReplay();

   if (selectedDrivers.length === 0) {
      return (
         <div className="rounded-2xl border border-white/5 bg-f1-dark-gray/40 p-8 text-center backdrop-blur-md">
            <AlertCircle className="h-8 w-8 text-f1-silver/50 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-f1-white">No Driver Selected</h4>
            <p className="text-xs text-f1-silver mt-1">
               Click driver markers on the circuit map or search them in the timing table to compare live telemetry.
            </p>
         </div>
      );
   }

   return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {/* Team accent border */}
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: teamColor }} />

                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                     <div>
                        <h3 className="text-sm font-bold text-f1-white">{driver.full_name}</h3>
                        <p className="text-[10px] text-f1-silver uppercase tracking-wider">{driver.team_name}</p>
                     </div>
                     <span className="text-2xl font-black text-f1-white/20 font-mono">#{driver.driver_number}</span>
                  </div>

                  {/* Gauges & Telemetry Readout */}
                  {!data ? (
                     <p className="text-xs text-f1-silver/40 text-center py-8">Awaiting telemetry frames...</p>
                  ) : (
                     <div className="mt-4 space-y-4">
                        {/* Gear & Speed */}
                        <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-lg border border-white/5">
                           <div className="text-center w-1/3">
                              <span className="block text-[10px] text-f1-silver uppercase">Gear</span>
                              <span className="text-3xl font-black text-f1-white font-mono">{data.n_gear === 0 ? 'N' : data.n_gear}</span>
                           </div>
                           <div className="text-center w-1/3 border-l border-white/5">
                              <span className="block text-[10px] text-f1-silver uppercase">Speed</span>
                              <span className="text-3xl font-black text-f1-white font-mono">{data.speed} <span className="text-xs">km/h</span></span>
                           </div>
                           <div className="text-center w-1/3 border-l border-white/5">
                              <span className="block text-[10px] text-f1-silver uppercase">RPM</span>
                              <span className="text-lg font-bold text-f1-white font-mono">{data.rpm}</span>
                           </div>
                        </div>

                        {/* Bars for Throttle and Brake */}
                        <div className="space-y-3">
                           {/* Throttle */}
                           <div>
                              <div className="flex justify-between text-xs text-f1-silver mb-1">
                                 <span>Throttle</span>
                                 <span className="font-mono text-emerald-400 font-bold">{data.throttle}%</span>
                              </div>
                              <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden">
                                 <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-150"
                                    style={{ width: `${data.throttle}%` }}
                                 />
                              </div>
                           </div>

                           {/* Brake */}
                           <div>
                              <div className="flex justify-between text-xs text-f1-silver mb-1">
                                 <span>Braking Force</span>
                                 <span className="font-mono text-red-400 font-bold">{data.brake}%</span>
                              </div>
                              <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden">
                                 <div
                                    className="h-full bg-red-500 rounded-full transition-all duration-150"
                                    style={{ width: `${data.brake}%` }}
                                 />
                              </div>
                           </div>
                        </div>

                        {/* DRS Badge */}
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-f1-silver">DRS Status</span>
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${data.drs >= 10 ? 'bg-f1-red text-white' : 'bg-white/10 text-f1-silver'
                              }`}>
                              {data.drs >= 10 ? 'ENABLED' : 'DISABLED'}
                           </span>
                        </div>
                     </div>
                  )}
               </div>
            );
         })}
      </div>
   );
};
