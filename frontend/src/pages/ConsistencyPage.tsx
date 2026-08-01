import React, { useEffect, useState, useMemo } from 'react';
import { Grid3x3, Target } from 'lucide-react';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';
import { analyticsService } from '../services/analyticsService';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import type { ConsistencyData } from '../types';

const ConsistencyPage: React.FC = () => {
  const [data, setData] = useState<ConsistencyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getConsistency()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const heatmapData = useMemo(() => {
    if (!data) return [];
    return data.drivers.slice(0, 20).map(d => ({
      id: d.driver.code,
      data: data.races.map(race => {
        const val = d.resultsByRace[race];
        const numVal = val === 'DNF' ? 21 : parseInt(val) || 0;
        return { x: race.replace(' Grand Prix', '').substring(0, 8), y: numVal };
      })
    }));
  }, [data]);

  const scatterData = useMemo(() => {
    if (!data) return [];
    const groups: Record<string, { id: string; data: { x: number; y: number; driver: string; color: string }[] }> = {};
    data.drivers.forEach(d => {
      const team = d.driver.constructorName || 'Unknown';
      if (!groups[team]) {
        groups[team] = { id: team, data: [] };
      }
      groups[team].data.push({
        x: Math.round(d.avgFinishPosition * 10) / 10,
        y: Math.round(d.stdDevPosition * 10) / 10,
        driver: d.driver.code,
        color: d.driver.constructorColor,
      });
    });
    return Object.values(groups);
  }, [data]);

  const sortedByRate = useMemo(() => {
    if (!data) return [];
    return [...data.drivers].sort((a, b) => b.pointsFinishRate - a.pointsFinishRate);
  }, [data]);

  if (loading) return <PageSkeleton />;
  if (!data) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <Grid3x3 className="w-8 h-8 text-f1-red" />
          Consistency Analysis
        </h1>
        <p className="text-f1-silver mt-1">Who delivers every single weekend?</p>
      </div>

      {/* Season Results Heatmap */}
      {heatmapData.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-f1-silver uppercase tracking-wider mb-4">Season Results Heatmap</h3>
          <div className="overflow-x-auto">
            <div style={{ height: `${heatmapData.length * 36 + 80}px`, minWidth: '700px' }}>
              <ResponsiveHeatMap
                data={heatmapData}
                margin={{ top: 40, right: 30, bottom: 20, left: 60 }}
                axisTop={{
                  tickSize: 0,
                  tickPadding: 8,
                  tickRotation: -45,
                }}
                axisLeft={{
                  tickSize: 0,
                  tickPadding: 8,
                }}
                colors={{
                  type: 'diverging',
                  scheme: 'red_yellow_green',
                  divergeAt: 0.5,
                  minValue: 1,
                  maxValue: 21,
                }}
                emptyColor="#333"
                borderWidth={1}
                borderColor="#1a1a2e"
                labelTextColor="#fff"
                label={(cell) => {
                  const v = cell.value;
                  if (v === null || v === undefined) return '';
                  return v >= 21 ? 'DNF' : `${v}`;
                }}
                hoverTarget="cell"
                animate={true}
                theme={{
                  text: { fill: '#9ca3af', fontSize: 11 },
                  axis: { ticks: { text: { fill: '#9ca3af' } } },
                  tooltip: { container: { background: '#1a1a2e', color: '#fff', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' } },
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Points Finish Rate */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-f1-silver uppercase tracking-wider mb-6">Points Finish Rate</h3>
        <div className="space-y-3">
          {sortedByRate.map((d, idx) => (
            <div key={d.driver.id} className="flex items-center gap-3">
              <span className="text-xs text-f1-silver w-6 text-right">{idx + 1}</span>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-white text-xs"
                style={{ backgroundColor: d.driver.constructorColor }}
              >
                {d.driver.code}
              </div>
              <span className="text-sm font-medium w-28 truncate">
                {d.driver.firstName} {d.driver.lastName}
              </span>
              <div className="flex-1 h-3 rounded-full bg-f1-mid-gray overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${d.pointsFinishRate}%`,
                    backgroundColor: d.driver.constructorColor,
                  }}
                />
              </div>
              <span className="text-sm font-semibold w-14 text-right" style={{ color: d.driver.constructorColor }}>
                {d.pointsFinishRate.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Consistency Scatter Plot */}
      {scatterData.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-f1-silver uppercase tracking-wider mb-2">
            Consistency vs Speed
          </h3>
          <p className="text-xs text-f1-silver/60 mb-4">
            Bottom-left = consistent & fast. Top-right = inconsistent & slow.
          </p>
          <div className="h-96">
            <ResponsiveScatterPlot
              data={scatterData}
              margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
              xScale={{ type: 'linear', min: 0, max: 'auto' }}
              yScale={{ type: 'linear', min: 0, max: 'auto' }}
              axisBottom={{
                legend: 'Average Finish Position',
                legendOffset: 46,
                legendPosition: 'middle',
              }}
              axisLeft={{
                legend: 'Std Dev (Volatility)',
                legendOffset: -46,
                legendPosition: 'middle',
              }}
              nodeSize={14}
              colors={({ serieId }) => {
                const group = scatterData.find(s => s.id === serieId);
                return group?.data[0]?.color || '#888';
              }}
              animate={true}
              useMesh={true}
              tooltip={({ node }) => {
                const d = node.data as any;
                return (
                  <div className="bg-f1-dark-gray border border-white/10 rounded-lg px-3 py-2 text-sm">
                    <strong>{d.driver}</strong>
                    <br />
                    Avg Finish: P{d.x} · StdDev: {d.y}
                  </div>
                );
              }}
              theme={{
                text: { fill: '#9ca3af' },
                axis: {
                  ticks: { text: { fill: '#9ca3af' } },
                  legend: { text: { fill: '#9ca3af' } },
                },
                grid: { line: { stroke: '#333' } },
              }}
              legends={[
                {
                  anchor: 'bottom-right',
                  direction: 'column',
                  translateX: 10,
                  itemWidth: 130,
                  itemHeight: 18,
                  symbolSize: 10,
                  symbolShape: 'circle',
                  itemTextColor: '#9ca3af',
                },
              ]}
            />
          </div>

          {/* Quadrant Labels */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="glass-card p-3 border-emerald-500/20">
              <p className="text-xs font-semibold text-emerald-400">↙ Consistent & Fast</p>
              <p className="text-xs text-f1-silver">Low avg position, low volatility</p>
            </div>
            <div className="glass-card p-3 border-red-500/20">
              <p className="text-xs font-semibold text-red-400">↗ Volatile & Slow</p>
              <p className="text-xs text-f1-silver">High avg position, high volatility</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsistencyPage;
