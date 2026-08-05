import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Flag, Ruler, Search, ShieldCheck, Timer, Zap } from 'lucide-react';
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
      <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
         <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>

               <h1 className="text-3xl font-display font-bold">Interactive Circuit Explorer</h1>
               <p className="mt-1 max-w-3xl text-f1-silver">
                  Corner inspection, Active Aero &amp; Overtake Mode zones, sector highlighting, speed traps, and engineering-style circuit statistics.
               </p>
            </div>
            {!selectedCircuit && (
               <label className="relative block w-full lg:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-f1-silver" />
                  <input
                     value={search}
                     onChange={(event) => setSearch(event.target.value)}
                     placeholder="Search circuits..."
                     className="search-input"
                  />
               </label>
            )}
         </div>

         <AnimatePresence mode="wait">
            {selectedCircuit ? (
               <motion.div key="detail" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <button
                     onClick={() => setSelectedId(null)}
                     className="mb-4 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-f1-silver transition-colors hover:border-white/20 hover:text-f1-white"
                  >
                     <ArrowLeft className="h-4 w-4" />
                     Back to circuits
                  </button>
                  <InteractiveCircuitMap circuit={selectedCircuit} />
               </motion.div>
            ) : (
               <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
               >
                  {filteredCircuits.map((circuit) => (
                     <motion.button
                        key={circuit.id}
                        onClick={() => setSelectedId(circuit.id)}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.985 }}
                        className="group flex flex-col rounded-xl border border-white/10 bg-white/[0.03] p-5 text-left shadow-lg transition-colors hover:border-f1-red/40 hover:bg-white/[0.05]"
                     >
                        <div className="mb-3 flex items-start justify-between">
                           <div>
                              <h3 className="font-display text-lg font-semibold text-f1-white group-hover:text-f1-red-light">{circuit.name}</h3>
                              <p className="mt-0.5 text-sm text-f1-silver">{circuit.location}, {circuit.country}</p>
                           </div>
                        </div>
                        <div className="mt-auto grid grid-cols-3 gap-2 text-center text-xs text-f1-silver">
                           <div className="rounded-md bg-white/[0.03] py-2">
                              <Ruler className="mx-auto mb-1 h-3.5 w-3.5 text-f1-red" />
                              {circuit.lengthKm} km
                           </div>
                           <div className="rounded-md bg-white/[0.03] py-2">
                              <Flag className="mx-auto mb-1 h-3.5 w-3.5 text-emerald-300" />
                              {circuit.laps} laps
                           </div>
                           <div className="rounded-md bg-white/[0.03] py-2">
                              <Zap className="mx-auto mb-1 h-3.5 w-3.5 text-yellow-200" />
                              {circuit.corners} turns
                           </div>
                        </div>
                        <p className="mt-3 flex items-center gap-1.5 text-xs text-f1-silver">
                           <Timer className="h-3.5 w-3.5 text-purple-300" />
                           {circuit.lapRecord} — {circuit.lapRecordHolder}
                        </p>
                     </motion.button>
                  ))}
               </motion.div>
            )}
         </AnimatePresence>
      </motion.div>
   );
};

export default CircuitExplorerPage;