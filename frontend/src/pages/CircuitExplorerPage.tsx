import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldCheck } from 'lucide-react';
import InteractiveCircuitMap from '../components/circuit/InteractiveCircuitMap';
import { circuits } from '../data/circuits';

const CircuitExplorerPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(circuits[0].id);

  const filteredCircuits = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return circuits;
    return circuits.filter((circuit) =>
      [circuit.name, circuit.country, circuit.location].some((value) => value.toLowerCase().includes(query))
    );
  }, [search]);

  const selectedCircuit = circuits.find((circuit) => circuit.id === selectedId) ?? filteredCircuits[0] ?? circuits[0];

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            SVG geometry sourced from F1DB circuit assets
          </div>
          <h1 className="text-3xl font-display font-bold">Interactive Circuit Explorer</h1>
          <p className="mt-1 max-w-3xl text-f1-silver">
            Scalable vector layouts with corner inspection, DRS overlays, sector highlighting, speed traps, and engineering-style circuit statistics.
          </p>
        </div>

        <label className="relative block w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-f1-silver" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search circuits..."
            className="search-input"
          />
        </label>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {filteredCircuits.map((circuit) => (
          <motion.button
            key={circuit.id}
            onClick={() => setSelectedId(circuit.id)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`shrink-0 rounded-lg border px-3 py-2 text-left text-sm transition-all ${
              selectedCircuit.id === circuit.id
                ? 'border-f1-red/60 bg-f1-red/15 text-f1-white shadow-lg shadow-f1-red/10'
                : 'border-white/10 bg-white/[0.03] text-f1-silver hover:border-white/20 hover:text-f1-white'
            }`}
          >
            <span className="block font-semibold">{circuit.name}</span>
            <span className="block text-xs opacity-70">{circuit.country}</span>
          </motion.button>
        ))}
      </div>

      <InteractiveCircuitMap circuit={selectedCircuit} />
    </motion.div>
  );
};

export default CircuitExplorerPage;
