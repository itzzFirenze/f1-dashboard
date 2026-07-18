import React, { useEffect, useState } from 'react';
import { MapPin, Ruler, CornerDownRight, Timer } from 'lucide-react';
import { circuitService } from '../services/circuitService';
import SearchInput from '../components/ui/SearchInput';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import type { Circuit } from '../types';

const CircuitExplorerPage: React.FC = () => {
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Circuit | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      circuitService.getAll(search || undefined)
        .then(setCircuits)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Circuit Explorer</h1>
          <p className="text-f1-silver mt-1">Explore every track on the calendar</p>
        </div>
        <div className="w-full sm:w-72">
          <SearchInput value={search} onChange={setSearch} placeholder="Search circuits..." />
        </div>
      </div>

      {circuits.length === 0 ? (
        <EmptyState title="No circuits found" message="Try adjusting your search." />
      ) : (
        <>
          {/* Selected Circuit Detail */}
          {selected && (
            <div className="glass-card-red p-6 animate-slide-up">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-display font-bold">{selected.name}</h2>
                  <p className="text-f1-silver flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />{selected.location}, {selected.country}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-f1-silver hover:text-f1-white text-sm"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <div className="bg-f1-mid-gray/50 rounded-xl p-4 text-center">
                  <Ruler className="w-5 h-5 text-f1-red mx-auto mb-2" />
                  <p className="font-bold text-lg">{selected.lengthKm} km</p>
                  <p className="text-xs text-f1-silver">Track Length</p>
                </div>
                <div className="bg-f1-mid-gray/50 rounded-xl p-4 text-center">
                  <CornerDownRight className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                  <p className="font-bold text-lg">{selected.corners}</p>
                  <p className="text-xs text-f1-silver">Corners</p>
                </div>
                <div className="bg-f1-mid-gray/50 rounded-xl p-4 text-center">
                  <Timer className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                  <p className="font-bold text-lg">{selected.lapRecord || 'N/A'}</p>
                  <p className="text-xs text-f1-silver">Lap Record</p>
                </div>
                <div className="bg-f1-mid-gray/50 rounded-xl p-4 text-center">
                  <MapPin className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  <p className="font-bold text-sm">{selected.lapRecordHolder || 'N/A'}</p>
                  <p className="text-xs text-f1-silver">Record Holder</p>
                </div>
              </div>
            </div>
          )}

          {/* Circuit Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {circuits.map((circuit, i) => (
              <div
                key={circuit.id}
                onClick={() => setSelected(circuit)}
                className={`glass-card p-5 cursor-pointer animate-slide-up ${
                  selected?.id === circuit.id ? 'border-f1-red/40 shadow-lg shadow-f1-red/10' : ''
                }`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-f1-red" />
                  <span className="text-sm text-f1-silver">{circuit.country}</span>
                </div>
                <h3 className="font-bold text-lg mb-1 line-clamp-1">{circuit.name}</h3>
                <p className="text-f1-silver text-sm mb-3">{circuit.location}</p>
                <div className="flex items-center gap-4 text-xs text-f1-silver">
                  <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{circuit.lengthKm} km</span>
                  <span className="flex items-center gap-1"><CornerDownRight className="w-3 h-3" />{circuit.corners} turns</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CircuitExplorerPage;
