import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Compass, Flag, Radio, Ruler, Search, Timer, Zap } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import InteractiveCircuitMap from '../components/circuit/InteractiveCircuitMap';
import CircuitTrackThumbnail from '../components/circuit/CircuitTrackThumbnail';
import PageHeroTitle from '@/components/ui/PageHeroTitle';
import { circuits } from '../data/circuits';

const CircuitExplorerPage: React.FC = () => {
   const navigate = useNavigate();
   const [searchParams, setSearchParams] = useSearchParams();

   // Derive selected circuit directly from URL param — no component state needed
   const circuitParam = searchParams.get('circuit');
   const fromParam = searchParams.get('from'); // 'race-details' when linked from a race page
   const search = searchParams.get('q') ?? '';

   const setSearch = (val: string) => {
      setSearchParams((prev) => {
         const next = new URLSearchParams(prev);
         if (val) next.set('q', val); else next.delete('q');
         return next;
      }, { replace: true });
   };

   const selectCircuit = (id: string) => {
      setSearchParams((prev) => {
         const next = new URLSearchParams(prev);
         next.set('circuit', id);
         next.delete('q');
         return next;
      });
   };

   const clearCircuit = () => {
      setSearchParams((prev) => {
         const next = new URLSearchParams(prev);
         next.delete('circuit');
         next.delete('q');
         return next;
      });
   };

   const filteredCircuits = useMemo(() => {
      const query = search.trim().toLowerCase();
      if (!query) return circuits;
      return circuits.filter((circuit) =>
         [circuit.name, circuit.location, circuit.country].some((value) => value.toLowerCase().includes(query))
      );
   }, [search]);

   // Try exact id match first, then fall back to name match (handles links that pass circuit name)
   const selectedCircuit = useMemo(() => {
      if (!circuitParam) return null;
      const byId = circuits.find((c) => c.id === circuitParam);
      if (byId) return byId;
      const decoded = decodeURIComponent(circuitParam).toLowerCase();
      return circuits.find((c) => c.name.toLowerCase() === decoded) ?? null;
   }, [circuitParam]);

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
                  className="w-full flex flex-col min-h-0 lg:h-[calc(100vh-6.5rem)] lg:max-h-[calc(100vh-6.5rem)] lg:overflow-hidden"
               >
                  {/* Slim Top Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 mb-2 border-b border-white/[0.06] flex-shrink-0">
                     <button
                        onClick={() => fromParam === 'race-details' ? navigate(-1) : clearCircuit()}
                        className="pill-button gap-2 px-3.5 py-1.5 hover:border-f1-red/40 transition-colors self-start"
                     >
                        <ArrowLeft className="h-4 w-4 text-f1-red" />
                        <span className="text-xs font-mono font-semibold text-f1-white">
                           {fromParam === 'race-details' ? 'Back to Race Details' : 'Back to all circuits'}
                        </span>
                     </button>

                     <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono text-f1-silver/50 uppercase tracking-widest bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06] self-start sm:self-auto">
                        <Radio className="w-3.5 h-3.5 text-f1-red-light shrink-0" />
                        <span className="truncate">{selectedCircuit.name} • {selectedCircuit.country}</span>
                     </div>
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
                  className="space-y-7"
               >
                  {/* ─── Hero Section: Mission Control HUD ─── */}
                  <div className="relative overflow-hidden rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-5 sm:p-8 shadow-2xl dot-grid">
                     <div className="scanline-overlay" />

                     <div className="absolute -top-24 -right-24 w-80 h-80 bg-f1-red/15 rounded-full blur-3xl pointer-events-none" />
                     <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                     <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                        <div className="space-y-2">
                           <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-f1-red/10 border border-f1-red/25 backdrop-blur-md">
                              <Compass className="w-3.5 h-3.5 text-f1-red-light" />
                              <span className="text-f1-red-light text-xs font-mono font-bold tracking-[0.2em] uppercase">
                                 CIRCUIT INTELLIGENCE UNIT
                              </span>
                           </div>

                           <PageHeroTitle titlePrefix="CIRCUIT" titleAccent="EXPLORER" />

                           <p className="text-f1-silver text-sm sm:text-base max-w-xl font-medium leading-relaxed">
                              Track layouts, active aero zones, DRS points &amp; apex telemetry for all {circuits.length} Grand Prix circuits.
                           </p>
                        </div>

                        {/* Search Console */}
                        <label className="relative block w-full lg:w-80 shrink-0">
                           <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-f1-silver/40" />
                           <input
                              value={search}
                              onChange={(event) => setSearch(event.target.value)}
                              placeholder="Search circuits, countries..."
                              className="w-full bg-white/[0.04] text-f1-white placeholder-f1-silver/40 text-xs font-mono pl-10 pr-3.5 py-3 rounded-xl border border-white/[0.08] focus:outline-none focus:border-f1-red/50 transition-all"
                           />
                        </label>
                     </div>
                  </div>

                  {/* Circuits Telemetry Grid */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                     {filteredCircuits.map((circuit) => (
                        <motion.button
                           key={circuit.id}
                           onClick={() => selectCircuit(circuit.id)}
                           whileHover={{ y: -3, transition: { duration: 0 } }}
                           whileTap={{ scale: 0.985 }}
                           className="telemetry-card group flex flex-col p-5 text-left relative overflow-hidden"
                        >
                           {/* Top indicator bar */}
                           <div
                              className="absolute top-0 inset-x-0 h-[2px] opacity-75 transition-opacity duration-0 group-hover:opacity-100"
                              style={{ background: 'linear-gradient(90deg, transparent, #E10600, transparent)' }}
                           />

                           <div className="mb-4 flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                 <h3 className="font-display text-base sm:text-lg font-black text-f1-white uppercase tracking-tight group-hover:text-f1-red-light transition-colors duration-0 truncate">
                                    {circuit.name}
                                 </h3>
                                 <p className="mt-0.5 text-xs font-mono text-f1-silver/50 truncate">
                                    {circuit.location}, {circuit.country}
                                 </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                 <CircuitTrackThumbnail trackPath={circuit.trackPath} name={circuit.name} />
                                 <ArrowUpRight className="w-4 h-4 text-f1-silver/30 shrink-0 group-hover:text-f1-red-light group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-0" />
                              </div>
                           </div>

                           <div className="mt-auto grid grid-cols-3 gap-2 text-center">
                              <div className="rounded-lg py-1.5 border border-white/[0.06]" style={{ backgroundColor: '#E1060015' }}>
                                 <Ruler className="mx-auto mb-0.5 h-3 w-3 text-f1-red" />
                                 <span className="font-mono font-bold text-f1-white text-[10px]">{circuit.lengthKm} km</span>
                              </div>
                              <div className="rounded-lg py-1.5 border border-white/[0.06]" style={{ backgroundColor: '#10b98115' }}>
                                 <Flag className="mx-auto mb-0.5 h-3 w-3 text-emerald-400" />
                                 <span className="font-mono font-bold text-f1-white text-[10px]">{circuit.laps} laps</span>
                              </div>
                              <div className="rounded-lg py-1.5 border border-white/[0.06]" style={{ backgroundColor: '#f59e0b15' }}>
                                 <Zap className="mx-auto mb-0.5 h-3 w-3 text-amber-300" />
                                 <span className="font-mono font-bold text-f1-white text-[10px]">{circuit.corners} turns</span>
                              </div>
                           </div>

                           <p className="mt-3.5 flex items-center gap-1.5 text-[11px] font-mono text-f1-silver/50 pt-3 border-t border-white/[0.06]">
                              <Timer className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                              <span className="truncate">
                                 <strong className="text-f1-white/90">{circuit.lapRecord}</strong> — {circuit.lapRecordHolder}
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