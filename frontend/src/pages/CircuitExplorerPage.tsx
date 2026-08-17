import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Flag, Ruler, Search, Timer, Zap } from 'lucide-react';
import InteractiveCircuitMap from '../components/circuit/InteractiveCircuitMap';
import { circuits } from '../data/circuits';

const CircuitExplorerPage: React.FC = () => {
   const [search, setSearch] = useState('');
   const [selectedId, setSelectedId] = useState<string | null>(null);

   const filteredCircuits = useMemo(() => {
      const query = search.trim().toLowerCase();
      if (!query) return circuits;
      return circuits.filter((circuit) =>
         [circuit.name, circuit.country, circuit.location].some((value) => value.toLowerCase().includes(query))
      );
   }, [search]);

   const selectedCircuit = circuits.find((circuit) => circuit.id === selectedId) ?? null;

   return (
      <div className="w-full">
         <AnimatePresence mode="wait">
            {selectedCircuit ? (
               <motion.div
                  key="detail"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="w-full flex flex-col h-[calc(100vh-6.5rem)] max-h-[calc(100vh-6.5rem)] overflow-hidden"
               >
                  {/* Slim Top Action Bar */}
                  <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-white/5 flex-shrink-0">
                     <button
                        onClick={() => setSelectedId(null)}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:border-f1-red/40 hover:bg-white/10"
                     >
                        <ArrowLeft className="h-4 w-4 text-f1-red" />
                        <span>Back to all circuits</span>
                     </button>

                     <span className="text-xs font-mono text-white/40">
                        {selectedCircuit.name} • {selectedCircuit.country}
                     </span>
                  </div>

                  {/* Interactive Map & Telemetry Stage */}
                  <div className="flex-1 w-full min-h-0 overflow-hidden">
                     <InteractiveCircuitMap circuit={selectedCircuit} />
                  </div>
               </motion.div>
            ) : (
               <motion.div
                  key="grid"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
               >
                  {/* Top Header & Search */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
                     <div>
                        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
                           Interactive <span className="text-f1-red">Circuit Explorer</span>
                        </h1>
                        <p className="text-xs text-white/50 mt-1">
                           Explore track layouts, active aero zones, DRS points, and apex telemetry for all 24 Grand Prix circuits.
                        </p>
                     </div>

                     <label className="relative block w-full sm:w-80">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                        <input
                           value={search}
                           onChange={(event) => setSearch(event.target.value)}
                           placeholder="Search circuits, countries..."
                           className="w-full bg-white/5 text-white placeholder-white/40 text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-f1-red transition-all"
                        />
                     </label>
                  </div>

                  {/* Circuits Grid Cards */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                     {filteredCircuits.map((circuit) => (
                        <motion.button
                           key={circuit.id}
                           onClick={() => setSelectedId(circuit.id)}
                           whileHover={{ y: -3 }}
                           whileTap={{ scale: 0.985 }}
                           className="group flex flex-col rounded-2xl border border-white/10 bg-[#1e1e2e]/70 p-5 text-left shadow-lg backdrop-blur-sm transition-all hover:border-f1-red/50 hover:bg-[#1e1e2e] hover:shadow-xl hover:shadow-f1-red/10"
                        >
                           <div className="mb-3 flex items-start justify-between">
                              <div>
                                 <h3 className="font-display text-base sm:text-lg font-bold text-white group-hover:text-f1-red transition-colors">
                                    {circuit.name}
                                 </h3>
                                 <p className="mt-0.5 text-xs text-white/50">
                                    {circuit.location}, {circuit.country}
                                 </p>
                              </div>
                           </div>

                           <div className="mt-auto grid grid-cols-3 gap-2 text-center text-xs text-white/60">
                              <div className="rounded-xl bg-white/[0.04] py-2 border border-white/5">
                                 <Ruler className="mx-auto mb-1 h-3.5 w-3.5 text-f1-red" />
                                 <span className="font-mono font-bold text-white text-[11px]">{circuit.lengthKm} km</span>
                              </div>
                              <div className="rounded-xl bg-white/[0.04] py-2 border border-white/5">
                                 <Flag className="mx-auto mb-1 h-3.5 w-3.5 text-emerald-400" />
                                 <span className="font-mono font-bold text-white text-[11px]">{circuit.laps} laps</span>
                              </div>
                              <div className="rounded-xl bg-white/[0.04] py-2 border border-white/5">
                                 <Zap className="mx-auto mb-1 h-3.5 w-3.5 text-yellow-300" />
                                 <span className="font-mono font-bold text-white text-[11px]">{circuit.corners} turns</span>
                              </div>
                           </div>

                           <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/50 pt-2.5 border-t border-white/5">
                              <Timer className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                              <span className="truncate">
                                 <strong className="text-white/80 font-mono">{circuit.lapRecord}</strong> — {circuit.lapRecordHolder}
                              </span>
                           </p>
                        </motion.button>
                     ))}
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
};

export default CircuitExplorerPage;