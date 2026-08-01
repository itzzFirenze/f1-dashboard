import React, { useEffect, useState } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, Flame, Snowflake } from 'lucide-react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { driverService } from '../services/driverService';
import { analyticsService } from '../services/analyticsService';
import DriverSelector from '../components/ui/DriverSelector';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import type { Driver, MomentumData } from '../types';

const MomentumTrackerPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [window, setWindow] = useState(5);
  const [data, setData] = useState<MomentumData | null>(null);
  const [loading, setLoading] = useState(false);
  const [driversLoading, setDriversLoading] = useState(true);

  useEffect(() => {
    driverService.getAll()
      .then(setDrivers)
      .catch(console.error)
      .finally(() => setDriversLoading(false));
  }, []);

  useEffect(() => {
    if (selected) {
      setLoading(true);
      analyticsService.getMomentum(selected.id, window)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selected, window]);

  if (driversLoading) return <PageSkeleton />;

  const trendIcon = (trend: string) => {
    if (trend === 'HOT') return <Flame className="w-6 h-6 text-orange-400" />;
    if (trend === 'COLD') return <Snowflake className="w-6 h-6 text-blue-400" />;
    return <Minus className="w-6 h-6 text-amber-400" />;
  };

  const trendColor = (trend: string) => {
    if (trend === 'HOT') return '#fb923c';
    if (trend === 'COLD') return '#60a5fa';
    return '#fbbf24';
  };

  const waterfallData = data?.recentRaces.map(r => ({
    race: `R${r.round}`,
    delta: r.positionDelta,
    deltaColor: r.positionDelta > 0 ? '#34d399' : r.positionDelta < 0 ? '#ef4444' : '#fbbf24',
  })) || [];

  const rollingLineData = data ? [
    {
      id: 'Avg Finish',
      color: '#3b82f6',
      data: data.recentRaces.map(r => ({ x: `R${r.round}`, y: r.rollingAvgFinish })),
    },
    {
      id: 'Avg Points',
      color: '#10b981',
      data: data.recentRaces.map(r => ({ x: `R${r.round}`, y: r.rollingAvgPoints })),
    },
  ] : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <Activity className="w-8 h-8 text-f1-red" />
          Momentum Tracker
        </h1>
        <p className="text-f1-silver mt-1">Track driver form and trajectory</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
        <DriverSelector drivers={drivers} selected={selected} onSelect={setSelected} label="Select Driver" />
        <div>
          <label className="text-xs font-semibold text-f1-silver uppercase tracking-wider mb-2 block">Window</label>
          <div className="flex gap-2">
            {[3, 5, 10].map(w => (
              <button
                key={w}
                onClick={() => setWindow(w)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  window === w
                    ? 'bg-f1-red/20 text-f1-red-light border border-f1-red/30'
                    : 'bg-f1-mid-gray/50 text-f1-silver border border-white/5 hover:border-white/10'
                }`}
              >
                Last {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <PageSkeleton />}

      {data && !loading && (
        <div className="space-y-6">
          {/* Momentum Score Gauge */}
          <div className="glass-card p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Circular gauge */}
              <div className="relative w-44 h-44">
                <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="70" fill="none" stroke="#333" strokeWidth="10" />
                  <circle
                    cx="80" cy="80" r="70" fill="none"
                    stroke={trendColor(data.formTrend)}
                    strokeWidth="10"
                    strokeDasharray={`${(data.score / 100) * 440} 440`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-display font-black" style={{ color: trendColor(data.formTrend) }}>
                    {data.score}
                  </span>
                  <span className="text-xs text-f1-silver">/ 100</span>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                  {trendIcon(data.formTrend)}
                  <span className="text-2xl font-display font-bold" style={{ color: trendColor(data.formTrend) }}>
                    {data.formTrend === 'HOT' ? 'On Fire' : data.formTrend === 'COLD' ? 'Cold Streak' : 'Neutral Form'}
                  </span>
                </div>
                <p className="text-f1-silver">
                  {data.driver.firstName} {data.driver.lastName} has scored an average of{' '}
                  <span className="font-semibold text-white">
                    {(data.recentRaces.reduce((s, r) => s + r.points, 0) / data.recentRaces.length).toFixed(1)} points
                  </span>{' '}
                  per race over the last {data.recentRaces.length} races.
                </p>
              </div>
            </div>
          </div>

          {/* Waterfall Chart — Position Deltas */}
          {waterfallData.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-f1-silver uppercase tracking-wider mb-4">
                Position Gains / Losses (Grid → Finish)
              </h3>
              <div className="h-64">
                <ResponsiveBar
                  data={waterfallData}
                  keys={['delta']}
                  indexBy="race"
                  margin={{ top: 10, right: 20, bottom: 40, left: 40 }}
                  padding={0.3}
                  colors={({ data }) => (data as any).deltaColor}
                  borderRadius={4}
                  axisBottom={{ tickRotation: 0 }}
                  axisLeft={{ tickSize: 5, format: (v: number) => v > 0 ? `+${v}` : `${v}` }}
                  enableLabel={true}
                  label={d => d.value !== null && d.value !== undefined ? (d.value > 0 ? `+${d.value}` : `${d.value}`) : ''}
                  labelTextColor="#fff"
                  animate={true}
                  theme={{
                    text: { fill: '#9ca3af' },
                    axis: { ticks: { text: { fill: '#9ca3af' } } },
                    grid: { line: { stroke: '#333' } },
                    tooltip: { container: { background: '#1a1a2e', color: '#fff', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' } },
                  }}
                />
              </div>
            </div>
          )}

          {/* Rolling Average Line Chart */}
          {rollingLineData.length > 0 && rollingLineData[0].data.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-f1-silver uppercase tracking-wider mb-4">
                Rolling Averages
              </h3>
              <div className="h-64">
                <ResponsiveLine
                  data={rollingLineData}
                  margin={{ top: 20, right: 30, bottom: 50, left: 50 }}
                  xScale={{ type: 'point' }}
                  yScale={{ type: 'linear', min: 0, max: 'auto' }}
                  curve="monotoneX"
                  lineWidth={3}
                  colors={['#3b82f6', '#10b981']}
                  pointSize={8}
                  pointColor={{ theme: 'background' }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: 'serieColor' }}
                  useMesh={true}
                  animate={true}
                  theme={{
                    text: { fill: '#9ca3af' },
                    axis: { ticks: { text: { fill: '#9ca3af' } } },
                    grid: { line: { stroke: '#333' } },
                    tooltip: { container: { background: '#1a1a2e', color: '#fff', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' } },
                  }}
                  legends={[
                    {
                      anchor: 'top-right',
                      direction: 'row',
                      translateY: -10,
                      itemWidth: 100,
                      itemHeight: 20,
                      symbolSize: 12,
                      symbolShape: 'circle',
                      itemTextColor: '#9ca3af',
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {/* Recent Form Table */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-f1-silver uppercase tracking-wider mb-4">Recent Form</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-f1-silver border-b border-white/5">
                    <th className="text-left py-3 px-4">Race</th>
                    <th className="text-center py-3 px-4">Grid</th>
                    <th className="text-center py-3 px-4">Finish</th>
                    <th className="text-center py-3 px-4">Delta</th>
                    <th className="text-center py-3 px-4">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentRaces.map((r) => (
                    <tr key={r.round} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-medium">{r.raceName}</td>
                      <td className="py-3 px-4 text-center text-f1-silver">P{r.gridPosition}</td>
                      <td className="py-3 px-4 text-center font-semibold">P{r.finishPosition}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          r.positionDelta > 0 ? 'bg-emerald-500/20 text-emerald-400' :
                          r.positionDelta < 0 ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {r.positionDelta > 0 ? <TrendingUp className="w-3 h-3" /> : r.positionDelta < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                          {r.positionDelta > 0 ? `+${r.positionDelta}` : r.positionDelta}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-amber-400">{r.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!data && !loading && (
        <div className="glass-card p-12 text-center">
          <Activity className="w-16 h-16 text-f1-silver/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-f1-silver mb-2">Select a Driver</h3>
          <p className="text-sm text-f1-silver/60">Choose a driver above to track their form and momentum</p>
        </div>
      )}
    </div>
  );
};

export default MomentumTrackerPage;
