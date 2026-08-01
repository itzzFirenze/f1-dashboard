import React, { useEffect, useState, useMemo } from 'react';
import { Swords, ArrowLeftRight } from 'lucide-react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { constructorService } from '../services/constructorService';
import { analyticsService } from '../services/analyticsService';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import type { Constructor, ConstructorComparisonData } from '../types';

const ConstructorComparisonPage: React.FC = () => {
  const [constructors, setConstructors] = useState<Constructor[]>([]);
  const [teamA, setTeamA] = useState<Constructor | null>(null);
  const [teamB, setTeamB] = useState<Constructor | null>(null);
  const [data, setData] = useState<ConstructorComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [constructorsLoading, setConstructorsLoading] = useState(true);

  useEffect(() => {
    constructorService.getAll()
      .then(setConstructors)
      .catch(console.error)
      .finally(() => setConstructorsLoading(false));
  }, []);

  useEffect(() => {
    if (teamA && teamB) {
      setLoading(true);
      analyticsService.compareConstructors(teamA.id, teamB.id)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [teamA, teamB]);

  const swapTeams = () => {
    const temp = teamA;
    setTeamA(teamB);
    setTeamB(temp);
  };

  // Stacked bar chart data: per-round driver contributions
  const stackedBarData = useMemo(() => {
    if (!data) return [];
    return data.rounds
      .filter(r => r.pointsA > 0 || r.pointsB > 0)
      .map(r => {
        const entry: Record<string, string | number> = { round: `R${r.round}` };
        r.driverPointsA.forEach(dp => { entry[`${dp.driverCode}_A`] = dp.points; });
        r.driverPointsB.forEach(dp => { entry[`${dp.driverCode}_B`] = dp.points; });
        return entry;
      });
  }, [data]);

  const stackedBarKeys = useMemo(() => {
    if (!data) return [];
    const keysA = data.driverSplitA.map(d => `${d.driver.code}_A`);
    const keysB = data.driverSplitB.map(d => `${d.driver.code}_B`);
    return [...keysA, ...keysB];
  }, [data]);

  const stackedBarColors = useMemo(() => {
    if (!data) return {};
    const colorMap: Record<string, string> = {};
    data.driverSplitA.forEach((d, i) => { colorMap[`${d.driver.code}_A`] = i === 0 ? (data.teamA.color || '#3B82F6') : adjustBrightness(data.teamA.color || '#3B82F6', 40); });
    data.driverSplitB.forEach((d, i) => { colorMap[`${d.driver.code}_B`] = i === 0 ? (data.teamB.color || '#A855F7') : adjustBrightness(data.teamB.color || '#A855F7', 40); });
    return colorMap;
  }, [data]);

  // Gap evolution line chart
  const gapLineData = useMemo(() => {
    if (!data) return [];
    const completedRounds = data.rounds.filter(r => r.cumulativePointsA > 0 || r.cumulativePointsB > 0);
    return [
      {
        id: data.teamA.name,
        color: data.teamA.color || '#3B82F6',
        data: completedRounds.map(r => ({ x: `R${r.round}`, y: r.cumulativePointsA })),
      },
      {
        id: data.teamB.name,
        color: data.teamB.color || '#A855F7',
        data: completedRounds.map(r => ({ x: `R${r.round}`, y: r.cumulativePointsB })),
      },
    ];
  }, [data]);

  // Donut chart data for team A / team B driver splits
  const donutDataA = useMemo(() => {
    if (!data) return [];
    return data.driverSplitA.map(d => ({
      id: d.driver.code,
      label: d.driver.code,
      value: d.points,
      color: d.driver.constructorColor || data.teamA.color || '#3B82F6',
    }));
  }, [data]);

  const donutDataB = useMemo(() => {
    if (!data) return [];
    return data.driverSplitB.map(d => ({
      id: d.driver.code,
      label: d.driver.code,
      value: d.points,
      color: d.driver.constructorColor || data.teamB.color || '#A855F7',
    }));
  }, [data]);

  if (constructorsLoading) return <PageSkeleton />;

  const TeamSelector = ({ selected, onSelect, label }: { selected: Constructor | null; onSelect: (c: Constructor) => void; label: string }) => (
    <div className="glass-card p-4">
      <label className="block text-xs text-f1-silver uppercase tracking-wider mb-2">{label}</label>
      <select
        className="w-full bg-f1-dark-gray border border-f1-mid-gray rounded-lg px-3 py-2.5 text-white focus:border-f1-red focus:outline-none transition-colors"
        value={selected?.id || ''}
        onChange={e => {
          const c = constructors.find(c => c.id === Number(e.target.value));
          if (c) onSelect(c);
        }}
      >
        <option value="">Select a team...</option>
        {constructors.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      {selected && (
        <div className="mt-3 flex items-center gap-3">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selected.color || '#666' }} />
          <span className="font-display font-semibold">{selected.name}</span>
          <span className="text-f1-silver text-sm ml-auto">{selected.points} pts</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <Swords className="w-8 h-8 text-f1-red" />
          Constructor Battle Center
        </h1>
        <p className="text-f1-silver mt-1">Team rivalries, point splits, and championship gap evolution</p>
      </div>

      {/* Team Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
        <TeamSelector selected={teamA} onSelect={setTeamA} label="Team A" />
        <button
          onClick={swapTeams}
          className="glass-card p-3 hover:bg-f1-red/20 transition-colors self-center"
          title="Swap teams"
        >
          <ArrowLeftRight className="w-5 h-5 text-f1-silver" />
        </button>
        <TeamSelector selected={teamB} onSelect={setTeamB} label="Team B" />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-f1-red border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <>
          {/* Head-to-Head Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 text-center">
              <div className="text-xs text-f1-silver uppercase tracking-wider mb-2">Total Points</div>
              <div className="flex items-center justify-center gap-4">
                <span className="text-2xl font-bold" style={{ color: data.teamA.color || '#3B82F6' }}>{data.teamA.points}</span>
                <span className="text-f1-silver text-sm">vs</span>
                <span className="text-2xl font-bold" style={{ color: data.teamB.color || '#A855F7' }}>{data.teamB.points}</span>
              </div>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-xs text-f1-silver uppercase tracking-wider mb-2">Total Wins</div>
              <div className="flex items-center justify-center gap-4">
                <span className="text-2xl font-bold" style={{ color: data.teamA.color || '#3B82F6' }}>{data.teamA.wins}</span>
                <span className="text-f1-silver text-sm">vs</span>
                <span className="text-2xl font-bold" style={{ color: data.teamB.color || '#A855F7' }}>{data.teamB.wins}</span>
              </div>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-xs text-f1-silver uppercase tracking-wider mb-2">Championship Gap</div>
              <div className="text-2xl font-bold text-white">
                {Math.abs((data.teamA.points || 0) - (data.teamB.points || 0))} pts
              </div>
            </div>
          </div>

          {/* Stacked Bar Chart — Driver Point Contributions */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-display font-semibold mb-6">Points Per Round — Driver Contributions</h2>
            <div style={{ height: 350 }}>
              {stackedBarData.length > 0 ? (
                <ResponsiveBar
                  data={stackedBarData}
                  keys={stackedBarKeys}
                  indexBy="round"
                  margin={{ top: 10, right: 130, bottom: 40, left: 50 }}
                  padding={0.3}
                  groupMode="grouped"
                  colors={({ id }) => stackedBarColors[id as string] || '#666'}
                  theme={{
                    text: { fill: '#9ca3af' },
                    axis: { ticks: { text: { fill: '#9ca3af' } }, legend: { text: { fill: '#9ca3af' } } },
                    grid: { line: { stroke: '#333' } },
                    tooltip: { container: { background: '#1a1a2e', color: '#fff', border: '1px solid #333' } },
                  }}
                  axisBottom={{ tickRotation: -45 }}
                  axisLeft={{ legend: 'Points', legendPosition: 'middle', legendOffset: -40 }}
                  legends={[
                    {
                      dataFrom: 'keys',
                      anchor: 'bottom-right',
                      direction: 'column',
                      translateX: 120,
                      itemWidth: 100,
                      itemHeight: 20,
                      itemTextColor: '#9ca3af',
                    },
                  ]}
                  animate={true}
                  motionConfig="gentle"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-f1-silver">No race data available yet</div>
              )}
            </div>
          </div>

          {/* Gap Evolution Area/Line Chart */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-display font-semibold mb-6">Championship Gap Evolution</h2>
            <div style={{ height: 350 }}>
              {gapLineData.length > 0 && gapLineData[0].data.length > 0 ? (
                <ResponsiveLine
                  data={gapLineData}
                  margin={{ top: 10, right: 120, bottom: 40, left: 60 }}
                  xScale={{ type: 'point' }}
                  yScale={{ type: 'linear', min: 0, max: 'auto' }}
                  curve="monotoneX"
                  colors={d => d.color || '#666'}
                  enableArea={true}
                  areaOpacity={0.1}
                  pointSize={8}
                  pointColor={{ from: 'color' }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: 'serieColor' }}
                  enableSlices="x"
                  theme={{
                    text: { fill: '#9ca3af' },
                    axis: { ticks: { text: { fill: '#9ca3af' } }, legend: { text: { fill: '#9ca3af' } } },
                    grid: { line: { stroke: '#333' } },
                    crosshair: { line: { stroke: '#e11d48' } },
                    tooltip: { container: { background: '#1a1a2e', color: '#fff', border: '1px solid #333' } },
                  }}
                  axisBottom={{ tickRotation: -45 }}
                  axisLeft={{ legend: 'Cumulative Points', legendPosition: 'middle', legendOffset: -50 }}
                  legends={[
                    {
                      anchor: 'bottom-right',
                      direction: 'column',
                      translateX: 110,
                      itemWidth: 100,
                      itemHeight: 20,
                      itemTextColor: '#9ca3af',
                      symbolShape: 'circle',
                    },
                  ]}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-f1-silver">No race data available yet</div>
              )}
            </div>
          </div>

          {/* Driver Splits — Donut Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team A Donut */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-display font-semibold mb-2 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.teamA.color || '#3B82F6' }} />
                {data.teamA.name} — Driver Split
              </h2>
              <div style={{ height: 260 }}>
                <ResponsivePie
                  data={donutDataA}
                  margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
                  innerRadius={0.55}
                  padAngle={2}
                  cornerRadius={4}
                  colors={{ datum: 'data.color' }}
                  enableArcLinkLabels={true}
                  arcLinkLabelsColor={{ from: 'color' }}
                  arcLinkLabelsTextColor="#9ca3af"
                  arcLabelsTextColor="#fff"
                  theme={{
                    tooltip: { container: { background: '#1a1a2e', color: '#fff', border: '1px solid #333' } },
                  }}
                />
              </div>
              {/* Driver stats below */}
              <div className="space-y-2 mt-2">
                {data.driverSplitA.map(d => (
                  <div key={d.driver.id} className="flex items-center justify-between text-sm">
                    <span className="text-f1-silver">{d.driver.code}</span>
                    <div className="flex gap-4">
                      <span>{d.points} pts ({d.percentage.toFixed(0)}%)</span>
                      <span className="text-f1-silver">Q: P{d.avgQuali.toFixed(1)}</span>
                      <span className="text-f1-silver">R: P{d.avgRace.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team B Donut */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-display font-semibold mb-2 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.teamB.color || '#A855F7' }} />
                {data.teamB.name} — Driver Split
              </h2>
              <div style={{ height: 260 }}>
                <ResponsivePie
                  data={donutDataB}
                  margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
                  innerRadius={0.55}
                  padAngle={2}
                  cornerRadius={4}
                  colors={{ datum: 'data.color' }}
                  enableArcLinkLabels={true}
                  arcLinkLabelsColor={{ from: 'color' }}
                  arcLinkLabelsTextColor="#9ca3af"
                  arcLabelsTextColor="#fff"
                  theme={{
                    tooltip: { container: { background: '#1a1a2e', color: '#fff', border: '1px solid #333' } },
                  }}
                />
              </div>
              <div className="space-y-2 mt-2">
                {data.driverSplitB.map(d => (
                  <div key={d.driver.id} className="flex items-center justify-between text-sm">
                    <span className="text-f1-silver">{d.driver.code}</span>
                    <div className="flex gap-4">
                      <span>{d.points} pts ({d.percentage.toFixed(0)}%)</span>
                      <span className="text-f1-silver">Q: P{d.avgQuali.toFixed(1)}</span>
                      <span className="text-f1-silver">R: P{d.avgRace.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gap Table */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-display font-semibold mb-4">Round-by-Round Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-f1-mid-gray text-f1-silver text-xs uppercase tracking-wider">
                    <th className="text-left py-3 px-2">Round</th>
                    <th className="text-center py-3 px-2" style={{ color: data.teamA.color || '#3B82F6' }}>{data.teamA.name}</th>
                    <th className="text-center py-3 px-2" style={{ color: data.teamB.color || '#A855F7' }}>{data.teamB.name}</th>
                    <th className="text-center py-3 px-2">Gap</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rounds
                    .filter(r => r.pointsA > 0 || r.pointsB > 0)
                    .map(r => (
                      <tr key={r.round} className="border-b border-f1-dark-gray/50 hover:bg-white/5 transition-colors">
                        <td className="py-2.5 px-2 text-f1-silver">{r.raceName}</td>
                        <td className="py-2.5 px-2 text-center font-semibold">{r.pointsA}</td>
                        <td className="py-2.5 px-2 text-center font-semibold">{r.pointsB}</td>
                        <td className={`py-2.5 px-2 text-center font-semibold ${r.gap > 0 ? 'text-emerald-400' : r.gap < 0 ? 'text-red-400' : 'text-f1-silver'}`}>
                          {r.gap > 0 ? '+' : ''}{r.gap.toFixed(0)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!data && !loading && (
        <div className="glass-card p-12 text-center">
          <Swords className="w-16 h-16 text-f1-mid-gray mx-auto mb-4" />
          <h3 className="text-xl font-display font-semibold mb-2">Select Two Teams</h3>
          <p className="text-f1-silver">Choose two constructors above to see their head-to-head battle analysis</p>
        </div>
      )}
    </div>
  );
};

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * percent / 100));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * percent / 100));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * percent / 100));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export default ConstructorComparisonPage;
