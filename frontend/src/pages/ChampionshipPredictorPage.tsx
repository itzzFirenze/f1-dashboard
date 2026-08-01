import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Trophy, RotateCcw, Zap, TrendingUp } from 'lucide-react';
import { ResponsiveBar } from '@nivo/bar';
import { driverService } from '../services/driverService';
import { raceService } from '../services/raceService';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import type { Driver, Race } from '../types';

// F1 points system
const POINTS_SYSTEM: Record<number, number> = {
  1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1,
};
const SPRINT_POINTS: Record<number, number> = {
  1: 8, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1,
};
const FASTEST_LAP_BONUS = 1;

interface Prediction {
  raceId: number;
  positions: Record<number, number>; // driverId -> position (1-20)
  fastestLap?: number; // driverId
  hasSprint: boolean;
  sprintPositions: Record<number, number>;
}

const ChampionshipPredictorPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [predictions, setPredictions] = useState<Map<number, Prediction>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedRace, setExpandedRace] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([driverService.getAll(), raceService.getAll()])
      .then(([d, r]) => {
        setDrivers(d);
        setRaces(r);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const upcomingRaces = useMemo(() => races.filter(r => r.status === 'UPCOMING'), [races]);
  const completedRaces = useMemo(() => races.filter(r => r.status !== 'UPCOMING'), [races]);

  const sortedDrivers = useMemo(() => [...drivers].sort((a, b) => (a.championshipPosition || 99) - (b.championshipPosition || 99)), [drivers]);

  const maxTheoreticalPoints = useMemo(() => {
    const remainingRaces = upcomingRaces.length;
    const maxPerRace = 25 + FASTEST_LAP_BONUS; // race win + fastest lap
    return remainingRaces * maxPerRace;
  }, [upcomingRaces]);

  const projectedStandings = useMemo(() => {
    const projected = sortedDrivers.map(d => ({
      driver: d,
      currentPoints: d.points || 0,
      predictedPoints: 0,
      totalPoints: d.points || 0,
      change: 0,
    }));

    // Calculate predicted points from predictions
    predictions.forEach((pred) => {
      Object.entries(pred.positions).forEach(([driverId, position]) => {
        const id = Number(driverId);
        const entry = projected.find(p => p.driver.id === id);
        if (entry && POINTS_SYSTEM[position]) {
          entry.predictedPoints += POINTS_SYSTEM[position];
        }
        // Fastest lap bonus
        if (entry && pred.fastestLap === id && position <= 10) {
          entry.predictedPoints += FASTEST_LAP_BONUS;
        }
      });
      // Sprint points
      Object.entries(pred.sprintPositions).forEach(([driverId, position]) => {
        const id = Number(driverId);
        const entry = projected.find(p => p.driver.id === id);
        if (entry && SPRINT_POINTS[position]) {
          entry.predictedPoints += SPRINT_POINTS[position];
        }
      });
    });

    projected.forEach(p => { p.totalPoints = p.currentPoints + p.predictedPoints; });

    // Sort by projected total
    const sorted = [...projected].sort((a, b) => b.totalPoints - a.totalPoints);

    // Calculate position changes
    sorted.forEach((entry, newPos) => {
      const oldPos = sortedDrivers.findIndex(d => d.id === entry.driver.id);
      entry.change = oldPos - newPos; // positive = moved up
    });

    return sorted;
  }, [sortedDrivers, predictions]);

  const updatePrediction = useCallback((raceId: number, driverId: number, position: number) => {
    setPredictions(prev => {
      const next = new Map(prev);
      const pred = next.get(raceId) || { raceId, positions: {}, fastestLap: undefined, hasSprint: false, sprintPositions: {} };

      // Remove this driver from any existing position
      const existingDriver = Object.entries(pred.positions).find(([, pos]) => pos === position);
      if (existingDriver) {
        delete pred.positions[Number(existingDriver[0])];
      }

      // Remove this driver's old position
      delete pred.positions[driverId];

      // Assign new position
      if (position > 0) {
        pred.positions[driverId] = position;
      }

      next.set(raceId, pred);
      return next;
    });
  }, []);

  const setFastestLap = useCallback((raceId: number, driverId: number) => {
    setPredictions(prev => {
      const next = new Map(prev);
      const pred = next.get(raceId) || { raceId, positions: {}, fastestLap: undefined, hasSprint: false, sprintPositions: {} };
      pred.fastestLap = pred.fastestLap === driverId ? undefined : driverId;
      next.set(raceId, pred);
      return next;
    });
  }, []);

  const autoFill = useCallback(() => {
    const next = new Map<number, Prediction>();
    upcomingRaces.forEach(race => {
      const pred: Prediction = { raceId: race.id, positions: {}, fastestLap: sortedDrivers[0]?.id, hasSprint: false, sprintPositions: {} };
      sortedDrivers.slice(0, 20).forEach((d, i) => {
        pred.positions[d.id] = i + 1;
      });
      next.set(race.id, pred);
    });
    setPredictions(next);
  }, [upcomingRaces, sortedDrivers]);

  const resetAll = useCallback(() => {
    setPredictions(new Map());
  }, []);

  // Bar chart data for projected standings
  const barChartData = useMemo(() => {
    return projectedStandings.slice(0, 15).map(entry => ({
      driver: entry.driver.code,
      'Current Points': entry.currentPoints,
      'Predicted Points': entry.predictedPoints,
    })).reverse(); // reverse for horizontal bars
  }, [projectedStandings]);

  const eliminatedDrivers = useMemo(() => {
    if (projectedStandings.length === 0) return new Set<number>();
    const leaderMax = projectedStandings[0].currentPoints + maxTheoreticalPoints;
    const eliminated = new Set<number>();
    sortedDrivers.forEach(d => {
      const driverMax = (d.points || 0) + maxTheoreticalPoints;
      if (driverMax < (projectedStandings[0]?.currentPoints || 0)) {
        eliminated.add(d.id);
      }
    });
    return eliminated;
  }, [sortedDrivers, projectedStandings, maxTheoreticalPoints]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-400" />
          Championship Predictor
        </h1>
        <p className="text-f1-silver mt-1">Simulate remaining races and project championship outcomes</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={autoFill}
          className="glass-card px-4 py-2.5 flex items-center gap-2 hover:bg-f1-red/20 transition-colors text-sm font-semibold"
        >
          <Zap className="w-4 h-4 text-yellow-400" />
          Auto-fill (Current Form)
        </button>
        <button
          onClick={resetAll}
          className="glass-card px-4 py-2.5 flex items-center gap-2 hover:bg-white/10 transition-colors text-sm font-semibold text-f1-silver"
        >
          <RotateCcw className="w-4 h-4" />
          Reset All
        </button>
        <div className="ml-auto glass-card px-4 py-2.5 text-sm text-f1-silver">
          {upcomingRaces.length} races remaining · Max {maxTheoreticalPoints} pts available
        </div>
      </div>

      {/* Current vs Projected Standings Bar Chart */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-display font-semibold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-f1-red" />
          Projected Standings
        </h2>
        <div style={{ height: Math.max(400, barChartData.length * 35) }}>
          <ResponsiveBar
            data={barChartData}
            keys={['Current Points', 'Predicted Points']}
            indexBy="driver"
            layout="horizontal"
            margin={{ top: 10, right: 20, bottom: 40, left: 60 }}
            padding={0.3}
            colors={['#e11d48', '#34D399']}
            theme={{
              text: { fill: '#9ca3af' },
              axis: { ticks: { text: { fill: '#9ca3af', fontSize: 12 } }, legend: { text: { fill: '#9ca3af' } } },
              grid: { line: { stroke: '#333' } },
              tooltip: { container: { background: '#1a1a2e', color: '#fff', border: '1px solid #333' } },
            }}
            axisBottom={{ legend: 'Points', legendPosition: 'middle', legendOffset: 32 }}
            animate={true}
            motionConfig="gentle"
            legends={[
              {
                dataFrom: 'keys',
                anchor: 'top-right',
                direction: 'row',
                translateY: -5,
                itemWidth: 130,
                itemHeight: 20,
                itemTextColor: '#9ca3af',
                symbolShape: 'circle',
                symbolSize: 10,
              },
            ]}
          />
        </div>
      </div>

      {/* Projected Leaderboard */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-display font-semibold mb-4">Projected Championship Order</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-f1-mid-gray text-f1-silver text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-2">Pos</th>
                <th className="text-left py-3 px-2">Driver</th>
                <th className="text-center py-3 px-2">Current</th>
                <th className="text-center py-3 px-2">Predicted</th>
                <th className="text-center py-3 px-2">Total</th>
                <th className="text-center py-3 px-2">Change</th>
                <th className="text-center py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {projectedStandings.slice(0, 20).map((entry, idx) => (
                <tr
                  key={entry.driver.id}
                  className={`border-b border-f1-dark-gray/50 transition-colors ${eliminatedDrivers.has(entry.driver.id) ? 'opacity-50' : 'hover:bg-white/5'}`}
                >
                  <td className="py-2.5 px-2 font-bold">{idx + 1}</td>
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 rounded-full" style={{ backgroundColor: entry.driver.constructorColor || '#666' }} />
                      <span className="font-semibold">{entry.driver.code}</span>
                      <span className="text-f1-silver text-xs">{entry.driver.constructorName}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center text-f1-silver">{entry.currentPoints}</td>
                  <td className="py-2.5 px-2 text-center text-emerald-400 font-semibold">
                    {entry.predictedPoints > 0 ? `+${entry.predictedPoints}` : '-'}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-white">{entry.totalPoints}</td>
                  <td className="py-2.5 px-2 text-center">
                    {entry.change !== 0 && (
                      <span className={`font-semibold ${entry.change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {entry.change > 0 ? `▲${entry.change}` : `▼${Math.abs(entry.change)}`}
                      </span>
                    )}
                    {entry.change === 0 && <span className="text-f1-silver">-</span>}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {eliminatedDrivers.has(entry.driver.id) ? (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Eliminated</span>
                    ) : idx === 0 ? (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Leader</span>
                    ) : (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">In Contention</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Race-by-Race Simulator */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-display font-semibold mb-4">Race Simulator</h2>
        <p className="text-f1-silver text-sm mb-6">Click a race to expand and set predicted finishing positions for the top 10</p>
        <div className="space-y-3">
          {upcomingRaces.map(race => {
            const isExpanded = expandedRace === race.id;
            const pred = predictions.get(race.id);
            const filledPositions = pred ? Object.keys(pred.positions).length : 0;
            return (
              <div key={race.id} className="glass-card overflow-hidden">
                <button
                  onClick={() => setExpandedRace(isExpanded ? null : race.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-f1-silver text-sm font-mono">R{race.round}</span>
                    <span className="font-display font-semibold">{race.name}</span>
                    <span className="text-f1-silver text-xs">{race.country}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {filledPositions > 0 && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                        {filledPositions}/10 set
                      </span>
                    )}
                    <span className="text-f1-silver text-sm">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-f1-mid-gray/30 p-4 space-y-3 animate-fade-in">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(pos => {
                      const selectedDriverId = pred ? Object.entries(pred.positions).find(([, p]) => p === pos)?.[0] : undefined;
                      return (
                        <div key={pos} className="flex items-center gap-3">
                          <span className={`text-sm font-bold w-8 text-right ${pos <= 3 ? 'text-yellow-400' : 'text-f1-silver'}`}>
                            P{pos}
                          </span>
                          <span className="text-f1-silver text-xs w-12 text-right">
                            +{POINTS_SYSTEM[pos] || 0} pts
                          </span>
                          <select
                            className="flex-1 bg-f1-dark-gray border border-f1-mid-gray/50 rounded-lg px-3 py-1.5 text-sm text-white focus:border-f1-red focus:outline-none transition-colors"
                            value={selectedDriverId || ''}
                            onChange={e => {
                              const dId = Number(e.target.value);
                              if (dId) updatePrediction(race.id, dId, pos);
                            }}
                          >
                            <option value="">-- Select --</option>
                            {sortedDrivers.map(d => (
                              <option key={d.id} value={d.id}>{d.code} — {d.lastName}</option>
                            ))}
                          </select>
                          {pos <= 10 && selectedDriverId && (
                            <button
                              onClick={() => setFastestLap(race.id, Number(selectedDriverId))}
                              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                                pred?.fastestLap === Number(selectedDriverId)
                                  ? 'bg-purple-500/30 border-purple-500 text-purple-300'
                                  : 'border-f1-mid-gray text-f1-silver hover:border-purple-500'
                              }`}
                              title="Toggle fastest lap"
                            >
                              FL
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {upcomingRaces.length === 0 && (
            <div className="text-center py-8 text-f1-silver">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-f1-mid-gray" />
              <p>No upcoming races to predict. The season may be complete!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChampionshipPredictorPage;
