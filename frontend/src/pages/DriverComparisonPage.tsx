import React, { useEffect, useState, useMemo } from 'react';
import { GitCompare, ArrowLeftRight, Users } from 'lucide-react';
import { ResponsiveRadar } from '@nivo/radar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBump } from '@nivo/bump';
import { driverService } from '../services/driverService';
import { analyticsService } from '../services/analyticsService';
import DriverSelector from '../components/ui/DriverSelector';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import type { Driver, DriverComparisonData } from '../types';

const DriverComparisonPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverA, setDriverA] = useState<Driver | null>(null);
  const [driverB, setDriverB] = useState<Driver | null>(null);
  const [data, setData] = useState<DriverComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [driversLoading, setDriversLoading] = useState(true);

  useEffect(() => {
    driverService.getAll()
      .then(setDrivers)
      .catch(console.error)
      .finally(() => setDriversLoading(false));
  }, []);

  useEffect(() => {
    if (driverA && driverB) {
      setLoading(true);
      analyticsService.compareDrivers(driverA.id, driverB.id)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [driverA, driverB]);

  const swapDrivers = () => {
    const temp = driverA;
    setDriverA(driverB);
    setDriverB(temp);
  };

  const radarData = useMemo(() => {
    if (!data) return [];
    const maxPts = Math.max(data.statsA.points, data.statsB.points, 1);
    const maxWins = Math.max(data.statsA.wins, data.statsB.wins, 1);
    const maxPods = Math.max(data.statsA.podiums, data.statsB.podiums, 1);
    return [
      { stat: 'Points', [data.driverA.code]: (data.statsA.points / maxPts) * 100, [data.driverB.code]: (data.statsB.points / maxPts) * 100 },
      { stat: 'Wins', [data.driverA.code]: (data.statsA.wins / maxWins) * 100, [data.driverB.code]: (data.statsB.wins / maxWins) * 100 },
      { stat: 'Podiums', [data.driverA.code]: (data.statsA.podiums / maxPods) * 100, [data.driverB.code]: (data.statsB.podiums / maxPods) * 100 },
      { stat: 'Avg Grid', [data.driverA.code]: Math.max(0, 100 - (data.statsA.avgGrid * 5)), [data.driverB.code]: Math.max(0, 100 - (data.statsB.avgGrid * 5)) },
      { stat: 'Avg Finish', [data.driverA.code]: Math.max(0, 100 - (data.statsA.avgFinish * 5)), [data.driverB.code]: Math.max(0, 100 - (data.statsB.avgFinish * 5)) },
      { stat: 'Reliability', [data.driverA.code]: Math.max(0, 100 - data.statsA.dnfs * 20), [data.driverB.code]: Math.max(0, 100 - data.statsB.dnfs * 20) },
    ];
  }, [data]);

  const cumulativeLineData = useMemo(() => {
    if (!data) return [];
    const completedRaces = data.races.filter(r => r.posA !== null || r.posB !== null);
    return [
      {
        id: data.driverA.code,
        color: data.driverA.constructorColor,
        data: completedRaces.map(r => ({ x: `R${r.round}`, y: r.cumulativePointsA })),
      },
      {
        id: data.driverB.code,
        color: data.driverB.constructorColor,
        data: completedRaces.map(r => ({ x: `R${r.round}`, y: r.cumulativePointsB })),
      },
    ];
  }, [data]);

  const bumpData = useMemo(() => {
    if (!data) return [];
    const completedRaces = data.races.filter(r => r.posA !== null && r.posB !== null);
    if (completedRaces.length === 0) return [];
    return [
      {
        id: data.driverA.code,
        data: completedRaces.map(r => ({ x: `R${r.round}`, y: r.posA })),
      },
      {
        id: data.driverB.code,
        data: completedRaces.map(r => ({ x: `R${r.round}`, y: r.posB })),
      },
    ];
  }, [data]);

  if (driversLoading) return <PageSkeleton />;

  const StatBar = ({ label, valueA, valueB, colorA, colorB }: {
    label: string; valueA: number; valueB: number; colorA: string; colorB: string;
  }) => {
    const total = valueA + valueB || 1;
    const pctA = (valueA / total) * 100;
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold" style={{ color: colorA }}>{valueA}</span>
          <span className="text-xs text-f1-silver uppercase tracking-wider">{label}</span>
          <span className="text-sm font-semibold" style={{ color: colorB }}>{valueB}</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-f1-mid-gray overflow-hidden flex">
          <div className="h-full rounded-l-full transition-all duration-700" style={{ width: `${pctA}%`, backgroundColor: colorA }} />
          <div className="h-full rounded-r-full transition-all duration-700 ml-0.5" style={{ width: `${100 - pctA}%`, backgroundColor: colorB }} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <GitCompare className="w-8 h-8 text-f1-red" />
          Driver Comparison Center
        </h1>
        <p className="text-f1-silver mt-1">Compare any two drivers head-to-head</p>
      </div>

      {/* Driver Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
        <DriverSelector
          drivers={drivers}
          selected={driverA}
          onSelect={setDriverA}
          label="Driver A"
          accentColor={driverA?.constructorColor}
        />
        <button
          onClick={swapDrivers}
          className="hidden md:flex w-12 h-12 rounded-xl bg-f1-mid-gray items-center justify-center hover:bg-f1-red/20 transition-colors self-end mb-1"
          title="Swap drivers"
        >
          <ArrowLeftRight className="w-5 h-5 text-f1-silver" />
        </button>
        <DriverSelector
          drivers={drivers}
          selected={driverB}
          onSelect={setDriverB}
          label="Driver B"
          accentColor={driverB?.constructorColor}
        />
      </div>

      {/* Loading */}
      {loading && <PageSkeleton />}

      {/* Comparison Data */}
      {data && !loading && (
        <div className="space-y-6">

          {/* Head-to-Head Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-f1-silver uppercase tracking-wider mb-4">Performance Profile</h3>
              <div className="h-80">
                <ResponsiveRadar
                  data={radarData}
                  keys={[data.driverA.code, data.driverB.code]}
                  indexBy="stat"
                  maxValue={100}
                  margin={{ top: 40, right: 60, bottom: 40, left: 60 }}
                  curve="linearClosed"
                  borderWidth={2}
                  borderColor={{ from: 'color' }}
                  gridLevels={4}
                  gridShape="circular"
                  gridLabelOffset={16}
                  dotSize={8}
                  dotColor={{ theme: 'background' }}
                  dotBorderWidth={2}
                  dotBorderColor={{ from: 'color' }}
                  colors={[data.driverA.constructorColor, data.driverB.constructorColor]}
                  fillOpacity={0.15}
                  blendMode="normal"
                  animate={true}
                  theme={{
                    text: { fill: '#9ca3af' },
                    grid: { line: { stroke: '#333' } },
                    tooltip: { container: { background: '#1a1a2e', color: '#fff', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' } },
                  }}
                  legends={[
                    {
                      anchor: 'top-left',
                      direction: 'column',
                      translateX: -40,
                      translateY: -20,
                      itemWidth: 80,
                      itemHeight: 20,
                      symbolSize: 12,
                      symbolShape: 'circle',
                      itemTextColor: '#9ca3af',
                    },
                  ]}
                />
              </div>
            </div>

            {/* Stats Bars */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-f1-silver uppercase tracking-wider mb-6">Head-to-Head</h3>
              <StatBar label="Points" valueA={data.statsA.points} valueB={data.statsB.points} colorA={data.driverA.constructorColor} colorB={data.driverB.constructorColor} />
              <StatBar label="Wins" valueA={data.statsA.wins} valueB={data.statsB.wins} colorA={data.driverA.constructorColor} colorB={data.driverB.constructorColor} />
              <StatBar label="Podiums" valueA={data.statsA.podiums} valueB={data.statsB.podiums} colorA={data.driverA.constructorColor} colorB={data.driverB.constructorColor} />
              <StatBar label="Race H2H" valueA={data.headToHeadRaceA} valueB={data.headToHeadRaceB} colorA={data.driverA.constructorColor} colorB={data.driverB.constructorColor} />
              <StatBar label="DNFs" valueA={data.statsA.dnfs} valueB={data.statsB.dnfs} colorA={data.driverA.constructorColor} colorB={data.driverB.constructorColor} />

              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/5">
                <div className="text-center">
                  <p className="text-xs text-f1-silver mb-1">Avg Grid</p>
                  <p className="text-xl font-display font-bold" style={{ color: data.driverA.constructorColor }}>
                    P{data.statsA.avgGrid.toFixed(1)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-f1-silver mb-1">Avg Grid</p>
                  <p className="text-xl font-display font-bold" style={{ color: data.driverB.constructorColor }}>
                    P{data.statsB.avgGrid.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cumulative Points Line Chart */}
          {cumulativeLineData.length > 0 && cumulativeLineData[0].data.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-f1-silver uppercase tracking-wider mb-4">Points Progression</h3>
              <div className="h-72">
                <ResponsiveLine
                  data={cumulativeLineData}
                  margin={{ top: 20, right: 30, bottom: 50, left: 50 }}
                  xScale={{ type: 'point' }}
                  yScale={{ type: 'linear', min: 0, max: 'auto' }}
                  curve="monotoneX"
                  lineWidth={3}
                  colors={[data.driverA.constructorColor, data.driverB.constructorColor]}
                  pointSize={8}
                  pointColor={{ theme: 'background' }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: 'serieColor' }}
                  enableArea={true}
                  areaOpacity={0.08}
                  useMesh={true}
                  animate={true}
                  axisBottom={{ tickRotation: -45 }}
                  theme={{
                    text: { fill: '#9ca3af' },
                    axis: { ticks: { text: { fill: '#9ca3af' } }, legend: { text: { fill: '#9ca3af' } } },
                    grid: { line: { stroke: '#333' } },
                    crosshair: { line: { stroke: '#e10600' } },
                    tooltip: { container: { background: '#1a1a2e', color: '#fff', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' } },
                  }}
                  legends={[
                    {
                      anchor: 'top-right',
                      direction: 'row',
                      translateY: -10,
                      itemWidth: 80,
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

          {/* Position Bump Chart */}
          {bumpData.length > 0 && bumpData[0].data.length > 1 && (
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-f1-silver uppercase tracking-wider mb-4">Position History</h3>
              <div className="h-72">
                <ResponsiveBump
                  data={bumpData}
                  margin={{ top: 20, right: 60, bottom: 50, left: 60 }}
                  colors={[data.driverA.constructorColor, data.driverB.constructorColor]}
                  lineWidth={3}
                  activeLineWidth={5}
                  inactiveLineWidth={2}
                  pointSize={10}
                  activePointSize={14}
                  inactivePointSize={6}
                  pointColor={{ theme: 'background' }}
                  pointBorderWidth={3}
                  activePointBorderWidth={3}
                  pointBorderColor={{ from: 'serie.color' }}
                  axisTop={null}
                  axisBottom={{ tickRotation: -45 }}
                  axisLeft={{ tickSize: 5, tickPadding: 5 }}
                  theme={{
                    text: { fill: '#9ca3af' },
                    axis: { ticks: { text: { fill: '#9ca3af' } } },
                    tooltip: { container: { background: '#1a1a2e', color: '#fff', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' } },
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!data && !loading && (
        <div className="glass-card p-12 text-center">
          <Users className="w-16 h-16 text-f1-silver/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-f1-silver mb-2">Select Two Drivers</h3>
          <p className="text-sm text-f1-silver/60">Choose drivers above to see their head-to-head comparison</p>
        </div>
      )}
    </div>
  );
};

export default DriverComparisonPage;
