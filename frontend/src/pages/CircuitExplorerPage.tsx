import React, { useEffect, useState, useMemo } from 'react';
import { MapPin, Ruler, CornerDownRight, Timer, Gauge, Shield, Zap, Wind } from 'lucide-react';
import { ResponsiveRadar } from '@nivo/radar';
import { circuitService } from '../services/circuitService';
import SearchInput from '../components/ui/SearchInput';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import type { Circuit, CircuitCharacteristics } from '../types';

// Circuit characteristics data — derived from real-world track analysis
const CIRCUIT_CHARACTERISTICS: Record<string, CircuitCharacteristics> = {
  'Bahrain International Circuit': { downforceLevel: 60, brakeWear: 75, tyreWear: 80, topSpeed: 70, overtakingDifficulty: 30, streetCircuit: false },
  'Jeddah Corniche Circuit': { downforceLevel: 45, brakeWear: 65, tyreWear: 60, topSpeed: 90, overtakingDifficulty: 40, streetCircuit: true },
  'Albert Park Circuit': { downforceLevel: 55, brakeWear: 50, tyreWear: 55, topSpeed: 75, overtakingDifficulty: 55, streetCircuit: false },
  'Suzuka International Racing Course': { downforceLevel: 80, brakeWear: 60, tyreWear: 70, topSpeed: 60, overtakingDifficulty: 65, streetCircuit: false },
  'Shanghai International Circuit': { downforceLevel: 55, brakeWear: 70, tyreWear: 65, topSpeed: 75, overtakingDifficulty: 35, streetCircuit: false },
  'Miami International Autodrome': { downforceLevel: 50, brakeWear: 55, tyreWear: 50, topSpeed: 80, overtakingDifficulty: 45, streetCircuit: true },
  'Autodromo Enzo e Dino Ferrari': { downforceLevel: 65, brakeWear: 55, tyreWear: 50, topSpeed: 65, overtakingDifficulty: 70, streetCircuit: false },
  'Circuit de Monaco': { downforceLevel: 95, brakeWear: 40, tyreWear: 30, topSpeed: 20, overtakingDifficulty: 95, streetCircuit: true },
  'Circuit Gilles Villeneuve': { downforceLevel: 35, brakeWear: 90, tyreWear: 45, topSpeed: 85, overtakingDifficulty: 30, streetCircuit: false },
  'Circuit de Barcelona-Catalunya': { downforceLevel: 70, brakeWear: 60, tyreWear: 75, topSpeed: 60, overtakingDifficulty: 60, streetCircuit: false },
  'Red Bull Ring': { downforceLevel: 40, brakeWear: 50, tyreWear: 40, topSpeed: 80, overtakingDifficulty: 35, streetCircuit: false },
  'Silverstone Circuit': { downforceLevel: 75, brakeWear: 55, tyreWear: 70, topSpeed: 70, overtakingDifficulty: 40, streetCircuit: false },
  'Hungaroring': { downforceLevel: 85, brakeWear: 55, tyreWear: 65, topSpeed: 40, overtakingDifficulty: 80, streetCircuit: false },
  'Circuit de Spa-Francorchamps': { downforceLevel: 50, brakeWear: 50, tyreWear: 55, topSpeed: 90, overtakingDifficulty: 30, streetCircuit: false },
  'Circuit Zandvoort': { downforceLevel: 80, brakeWear: 45, tyreWear: 55, topSpeed: 45, overtakingDifficulty: 75, streetCircuit: false },
  'Autodromo Nazionale Monza': { downforceLevel: 20, brakeWear: 90, tyreWear: 35, topSpeed: 95, overtakingDifficulty: 25, streetCircuit: false },
  'Baku City Circuit': { downforceLevel: 45, brakeWear: 80, tyreWear: 45, topSpeed: 90, overtakingDifficulty: 35, streetCircuit: true },
  'Marina Bay Street Circuit': { downforceLevel: 85, brakeWear: 70, tyreWear: 50, topSpeed: 35, overtakingDifficulty: 80, streetCircuit: true },
  'Circuit of the Americas': { downforceLevel: 65, brakeWear: 65, tyreWear: 70, topSpeed: 70, overtakingDifficulty: 40, streetCircuit: false },
  'Autódromo Hermanos Rodríguez': { downforceLevel: 55, brakeWear: 50, tyreWear: 75, topSpeed: 70, overtakingDifficulty: 50, streetCircuit: false },
  'Autódromo José Carlos Pace': { downforceLevel: 50, brakeWear: 55, tyreWear: 50, topSpeed: 75, overtakingDifficulty: 30, streetCircuit: false },
  'Las Vegas Strip Circuit': { downforceLevel: 40, brakeWear: 70, tyreWear: 40, topSpeed: 85, overtakingDifficulty: 35, streetCircuit: true },
  'Lusail International Circuit': { downforceLevel: 60, brakeWear: 45, tyreWear: 80, topSpeed: 75, overtakingDifficulty: 45, streetCircuit: false },
  'Yas Marina Circuit': { downforceLevel: 60, brakeWear: 60, tyreWear: 55, topSpeed: 70, overtakingDifficulty: 45, streetCircuit: false },
};

const DEFAULT_CHARS: CircuitCharacteristics = { downforceLevel: 50, brakeWear: 50, tyreWear: 50, topSpeed: 50, overtakingDifficulty: 50, streetCircuit: false };

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

  useEffect(() => {
    if (selected) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selected]);

  const selectedChars = useMemo(() => {
    if (!selected) return null;
    return CIRCUIT_CHARACTERISTICS[selected.name] || DEFAULT_CHARS;
  }, [selected]);

  const radarData = useMemo(() => {
    if (!selectedChars) return [];
    return [
      { stat: 'Downforce', value: selectedChars.downforceLevel },
      { stat: 'Brake Wear', value: selectedChars.brakeWear },
      { stat: 'Tyre Wear', value: selectedChars.tyreWear },
      { stat: 'Top Speed', value: selectedChars.topSpeed },
      { stat: 'Overtaking Difficulty', value: selectedChars.overtakingDifficulty },
    ];
  }, [selectedChars]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Circuit Explorer</h1>
          <p className="text-f1-silver mt-1">Explore every track on the calendar — characteristics, records, and demands</p>
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
          {selected && selectedChars && (
            <div className="glass-card-red p-6 animate-slide-up space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-display font-bold">{selected.name}</h2>
                  <p className="text-f1-silver flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />{selected.location}, {selected.country}
                  </p>
                  {selectedChars.streetCircuit && (
                    <span className="inline-block mt-2 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                      Street Circuit
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-f1-silver hover:text-f1-white text-sm"
                >
                  Close
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

              {/* Radar Chart + Demand Bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <div>
                  <h3 className="text-lg font-display font-semibold mb-3 flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-f1-red" />
                    Technical Demands
                  </h3>
                  <div style={{ height: 280 }}>
                    <ResponsiveRadar
                      data={radarData}
                      keys={['value']}
                      indexBy="stat"
                      maxValue={100}
                      margin={{ top: 30, right: 80, bottom: 30, left: 80 }}
                      curve="linearClosed"
                      borderWidth={2}
                      borderColor="#e11d48"
                      gridLevels={5}
                      gridShape="circular"
                      dotSize={8}
                      dotColor="#e11d48"
                      dotBorderWidth={2}
                      dotBorderColor="#fff"
                      colors={['#e11d48']}
                      fillOpacity={0.2}
                      theme={{
                        text: { fill: '#9ca3af' },
                        grid: { line: { stroke: '#333' } },
                        tooltip: { container: { background: '#1a1a2e', color: '#fff', border: '1px solid #333' } },
                      }}
                    />
                  </div>
                </div>

                {/* Demand Bars */}
                <div className="space-y-4 self-center">
                  <DemandBar label="Downforce Level" value={selectedChars.downforceLevel} icon={<Wind className="w-4 h-4" />} color="#3B82F6" />
                  <DemandBar label="Brake Wear" value={selectedChars.brakeWear} icon={<Shield className="w-4 h-4" />} color="#EF4444" />
                  <DemandBar label="Tyre Wear" value={selectedChars.tyreWear} icon={<Gauge className="w-4 h-4" />} color="#F59E0B" />
                  <DemandBar label="Top Speed Importance" value={selectedChars.topSpeed} icon={<Zap className="w-4 h-4" />} color="#10B981" />
                  <DemandBar label="Overtaking Difficulty" value={selectedChars.overtakingDifficulty} icon={<CornerDownRight className="w-4 h-4" />} color="#8B5CF6" />
                </div>
              </div>

              {/* Setup Recommendation */}
              <div className="bg-f1-mid-gray/30 rounded-xl p-4">
                <h3 className="text-sm font-display font-semibold uppercase tracking-wider text-f1-silver mb-2">
                  Setup Recommendation
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedChars.downforceLevel >= 70 && (
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full">High Downforce</span>
                  )}
                  {selectedChars.downforceLevel < 40 && (
                    <span className="text-xs bg-green-500/20 text-green-300 px-2.5 py-1 rounded-full">Low Downforce</span>
                  )}
                  {selectedChars.brakeWear >= 70 && (
                    <span className="text-xs bg-red-500/20 text-red-300 px-2.5 py-1 rounded-full">Heavy Braking</span>
                  )}
                  {selectedChars.tyreWear >= 70 && (
                    <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full">High Tyre Deg</span>
                  )}
                  {selectedChars.topSpeed >= 80 && (
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full">Power Track</span>
                  )}
                  {selectedChars.overtakingDifficulty >= 70 && (
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full">Qualifying Critical</span>
                  )}
                  {selectedChars.overtakingDifficulty < 40 && (
                    <span className="text-xs bg-teal-500/20 text-teal-300 px-2.5 py-1 rounded-full">Overtaking Friendly</span>
                  )}
                  {selectedChars.streetCircuit && (
                    <span className="text-xs bg-orange-500/20 text-orange-300 px-2.5 py-1 rounded-full">Walls Close — No Margin</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Circuit Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {circuits.map((circuit, i) => {
              const chars = CIRCUIT_CHARACTERISTICS[circuit.name] || DEFAULT_CHARS;
              return (
                <div
                  key={circuit.id}
                  onClick={() => setSelected(circuit)}
                  className={`glass-card p-5 cursor-pointer animate-slide-up ${
                    selected?.id === circuit.id ? 'border-f1-red/40 shadow-lg shadow-f1-red/10' : ''
                  }`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-f1-red" />
                      <span className="text-sm text-f1-silver">{circuit.country}</span>
                    </div>
                    {chars.streetCircuit && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">Street</span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg mb-1 line-clamp-1">{circuit.name}</h3>
                  <p className="text-f1-silver text-sm mb-3">{circuit.location}</p>
                  <div className="flex items-center gap-4 text-xs text-f1-silver mb-3">
                    <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{circuit.lengthKm} km</span>
                    <span className="flex items-center gap-1"><CornerDownRight className="w-3 h-3" />{circuit.corners} turns</span>
                  </div>
                  {/* Mini demand indicators */}
                  <div className="flex gap-1.5">
                    <MiniBar value={chars.downforceLevel} color="#3B82F6" label="DF" />
                    <MiniBar value={chars.brakeWear} color="#EF4444" label="BR" />
                    <MiniBar value={chars.tyreWear} color="#F59E0B" label="TW" />
                    <MiniBar value={chars.topSpeed} color="#10B981" label="TS" />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const DemandBar: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2 text-sm text-f1-silver">
        {icon}
        {label}
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{value}%</span>
    </div>
    <div className="w-full h-2 rounded-full bg-f1-mid-gray overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

const MiniBar: React.FC<{ value: number; color: string; label: string }> = ({ value, color, label }) => (
  <div className="flex-1">
    <div className="text-[9px] text-f1-silver text-center mb-0.5">{label}</div>
    <div className="w-full h-1 rounded-full bg-f1-mid-gray overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  </div>
);

export default CircuitExplorerPage;
