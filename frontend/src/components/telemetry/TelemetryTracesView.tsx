import React from 'react';
import { Gauge, Timer } from 'lucide-react';
import { ResponsiveLine } from '@nivo/line';
import { useTooltip } from '@nivo/tooltip';
import type { TelemetryComparisonResult } from '../../services/telemetryAnalysisService';

// ─── Custom Tooltips ────────────────────────────────────────────────────────

const TooltipRow = ({ color, label, value }: { color?: string; label: string; value: string }) => (
   <div className="flex items-center justify-between gap-4 text-[11px] font-mono">
      <span className="flex items-center gap-1.5 text-white/60">
         {color && <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />}
         {label}
      </span>
      <span className="font-bold text-white">{value}</span>
   </div>
);

const SpeedSliceTooltip: React.FC<{ slice: any; comparison: TelemetryComparisonResult }> = ({ slice, comparison }) => {
   const xVal = Number(slice.points[0]?.data?.x ?? 0);
   const dp = comparison.points.reduce((prev, curr) =>
      Math.abs(curr.distancePct - xVal) < Math.abs(prev.distancePct - xVal) ? curr : prev
   );

   return (
      <div
         className="p-2.5 rounded-xl border border-white/10 shadow-2xl backdrop-blur-md"
         style={{ background: 'rgba(17, 19, 23, 0.96)', minWidth: 175 }}
      >
         <div className="text-[10px] font-mono text-white/40 mb-1.5 uppercase tracking-wider">
            Lap distance: {Math.round(dp.distancePct)}%
         </div>
         <TooltipRow
            color={comparison.driverA.displayColor}
            label={`${comparison.driverA.code} Speed`}
            value={`${dp.speedA} km/h`}
         />
         <TooltipRow
            color={comparison.driverB.displayColor}
            label={`${comparison.driverB.code} Speed`}
            value={`${dp.speedB} km/h`}
         />
      </div>
   );
};

const DeltaSliceTooltip: React.FC<{ slice: any; comparison: TelemetryComparisonResult }> = ({ slice, comparison }) => {
   const xVal = Number(slice.points[0]?.data?.x ?? 0);
   const dp = comparison.points.reduce((prev, curr) =>
      Math.abs(curr.distancePct - xVal) < Math.abs(prev.distancePct - xVal) ? curr : prev
   );
   const ahead = dp.deltaTime < 0 ? comparison.driverA.code : comparison.driverB.code;

   return (
      <div
         className="p-2.5 rounded-xl border border-white/10 shadow-2xl backdrop-blur-md"
         style={{ background: 'rgba(17, 19, 23, 0.96)', minWidth: 175 }}
      >
         <div className="text-[10px] font-mono text-white/40 mb-1.5 uppercase tracking-wider">
            Lap distance: {Math.round(dp.distancePct)}%
         </div>
         <div className="flex items-center justify-between gap-4 text-[11px] font-mono">
            <span className="text-white/60">Time gap</span>
            <span className={`font-bold ${dp.deltaTime < 0 ? 'text-emerald-400' : 'text-sky-400'}`}>
               {dp.deltaTime < 0
                  ? `${dp.deltaTime.toFixed(3)}s (${ahead} ahead)`
                  : `+${dp.deltaTime.toFixed(3)}s (${ahead} ahead)`}
            </span>
         </div>
      </div>
   );
};

const ChannelSliceTooltip: React.FC<{
   slice: any;
   channel: 'Throttle' | 'Brake';
   unit: string;
   comparison: TelemetryComparisonResult;
}> = ({ slice, channel, unit, comparison }) => {
   const xVal = Number(slice.points[0]?.data?.x ?? 0);
   const dp = comparison.points.reduce((prev, curr) =>
      Math.abs(curr.distancePct - xVal) < Math.abs(prev.distancePct - xVal) ? curr : prev
   );
   const valA = channel === 'Throttle' ? dp.throttleA : dp.brakeA;
   const valB = channel === 'Throttle' ? dp.throttleB : dp.brakeB;

   return (
      <div
         className="p-2.5 rounded-xl border border-white/10 shadow-2xl backdrop-blur-md"
         style={{ background: 'rgba(17, 19, 23, 0.96)', minWidth: 175 }}
      >
         <div className="text-[10px] font-mono text-white/40 mb-1.5 uppercase tracking-wider">
            Lap distance: {Math.round(dp.distancePct)}%
         </div>
         <TooltipRow
            color={comparison.driverA.displayColor}
            label={`${comparison.driverA.code} ${channel}`}
            value={`${valA}${unit}`}
         />
         <TooltipRow
            color={comparison.driverB.displayColor}
            label={`${comparison.driverB.code} ${channel}`}
            value={`${valB}${unit}`}
         />
      </div>
   );
};

const createAdaptiveSliceLayer = (renderContent: (slice: any) => React.ReactElement): React.FC<any> => {
   return function AdaptiveSlices({ slices, innerHeight, innerWidth, margin, setCurrentSlice }) {
      const { showTooltipAt, hideTooltip } = useTooltip();

      const positionAndShow = (slice: any, event: React.MouseEvent<SVGRectElement>) => {
         const rect = event.currentTarget.getBoundingClientRect();
         const y = event.clientY - rect.top;
         const anchor = slice.x > innerWidth * 0.5 ? 'left' : 'right';
         showTooltipAt(renderContent(slice), [margin.left + slice.x, margin.top + y], anchor);
      };

      return (
         <g>
            {slices.map((slice: any) => (
               <rect
                  key={slice.id}
                  x={slice.x0}
                  y={0}
                  width={slice.width}
                  height={innerHeight}
                  fill="transparent"
                  onMouseEnter={(e) => {
                     if (setCurrentSlice) setCurrentSlice(slice);
                     positionAndShow(slice, e);
                  }}
                  onMouseMove={(e) => positionAndShow(slice, e)}
                  onMouseLeave={() => {
                     if (setCurrentSlice) setCurrentSlice(null);
                     hideTooltip();
                  }}
               />
            ))}
         </g>
      );
   };
};

const nivoTheme = {
   text: { fill: '#9ca3af', fontFamily: 'monospace', fontSize: 10 },
   axis: { ticks: { text: { fill: '#9ca3af' } }, domain: { line: { stroke: 'rgba(255,255,255,0.08)' } } },
   grid: { line: { stroke: 'rgba(255,255,255,0.05)' } },
   crosshair: { line: { stroke: '#E10600', strokeWidth: 1 } },
   tooltip: {
      container: {
         background: '#111317',
         color: '#fff',
         borderRadius: '8px',
         border: '1px solid rgba(255,255,255,0.1)',
         fontSize: '11px',
      },
   },
};

interface TelemetryTracesViewProps {
   comparison: TelemetryComparisonResult;
   speedLineData: any[];
   deltaLineData: any[];
   throttleLineData: any[];
   brakeLineData: any[];
}

export const TelemetryTracesView: React.FC<TelemetryTracesViewProps> = ({
   comparison,
   speedLineData,
   deltaLineData,
   throttleLineData,
   brakeLineData,
}) => {
   return (
      <div className="space-y-6">
         {/* ── Speed Trace ── */}
         <div className="telemetry-card p-5">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-f1-red" />
                  <h3 className="text-xs font-mono font-bold text-f1-silver/80 uppercase tracking-widest">
                     Speed (km/h) vs Lap Distance %
                  </h3>
               </div>
               <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="flex items-center gap-1.5">
                     <span className="w-4 h-0.5 rounded" style={{ backgroundColor: comparison.driverA.displayColor }} />
                     {comparison.driverA.code}
                  </span>
                  <span className="flex items-center gap-1.5">
                     <span
                        className="w-4 h-0.5 rounded"
                        style={{
                           backgroundColor: comparison.driverB.displayColor,
                           borderTop:
                              comparison.driverB.lineStyle === 'dashed'
                                 ? `2px dashed ${comparison.driverB.displayColor}`
                                 : undefined,
                        }}
                     />
                     {comparison.driverB.code}
                  </span>
               </div>
            </div>
            <div className="h-60 !overflow-visible relative">
               <ResponsiveLine
                  data={speedLineData}
                  margin={{ top: 25, right: 30, bottom: 40, left: 50 }}
                  xScale={{ type: 'linear', min: 0, max: 100 }}
                  yScale={{ type: 'linear', min: 60, max: 380 }}
                  curve="monotoneX"
                  lineWidth={2}
                  colors={[comparison.driverA.displayColor, comparison.driverB.displayColor]}
                  pointSize={0}
                  enableSlices="x"
                  crosshairType="x"
                  layers={[
                     'grid',
                     'markers',
                     'axes',
                     'areas',
                     'crosshair',
                     'lines',
                     'points',
                     createAdaptiveSliceLayer((slice) => (
                        <SpeedSliceTooltip slice={slice} comparison={comparison} />
                     )),
                     'legends',
                  ]}
                  enableGridX={false}
                  enableArea={false}
                  axisBottom={{
                     tickValues: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
                     format: (v) => `${v}%`,
                  }}
                  axisLeft={{ tickValues: 5 }}
                  theme={nivoTheme}
               />
            </div>
         </div>

         {/* ── Delta Time Gap ── */}
         <div className="telemetry-card p-5">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-mono font-bold text-f1-silver/80 uppercase tracking-widest">
                     Cumulative Time Gap Δt (seconds)
                  </h3>
               </div>
               <span className="text-[11px] font-mono text-f1-silver/60">
                  Negative = <strong style={{ color: comparison.driverA.displayColor }}>{comparison.driverA.code}</strong> ahead
               </span>
            </div>
            <div className="h-48 !overflow-visible relative">
               <ResponsiveLine
                  data={deltaLineData}
                  margin={{ top: 20, right: 30, bottom: 40, left: 50 }}
                  xScale={{ type: 'linear', min: 0, max: 100 }}
                  yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                  curve="monotoneX"
                  lineWidth={2}
                  colors={['#10B981']}
                  pointSize={0}
                  enableSlices="x"
                  crosshairType="x"
                  layers={[
                     'grid',
                     'markers',
                     'axes',
                     'areas',
                     'crosshair',
                     'lines',
                     'points',
                     createAdaptiveSliceLayer((slice) => (
                        <DeltaSliceTooltip slice={slice} comparison={comparison} />
                     )),
                     'legends',
                  ]}
                  enableArea={true}
                  areaOpacity={0.1}
                  enableGridX={false}
                  axisBottom={{
                     tickValues: [0, 25, 50, 75, 100],
                     format: (v) => `${v}%`,
                  }}
                  axisLeft={{ tickValues: 5 }}
                  theme={nivoTheme}
               />
            </div>
         </div>

         {/* ── Throttle & Brake side-by-side ── */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="telemetry-card chart-card p-5 !overflow-visible relative z-10">
               <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-4">Throttle Application (%)</h4>
               <div className="h-48 !overflow-visible relative">
                  <ResponsiveLine
                     data={throttleLineData}
                     margin={{ top: 20, right: 30, bottom: 40, left: 45 }}
                     xScale={{ type: 'linear', min: 0, max: 100 }}
                     yScale={{ type: 'linear', min: 0, max: 100 }}
                     curve="monotoneX"
                     lineWidth={2}
                     colors={[comparison.driverA.displayColor, comparison.driverB.displayColor]}
                     pointSize={0}
                     enableSlices="x"
                     crosshairType="x"
                     layers={[
                        'grid',
                        'markers',
                        'axes',
                        'areas',
                        'crosshair',
                        'lines',
                        'points',
                        createAdaptiveSliceLayer((slice) => (
                           <ChannelSliceTooltip slice={slice} channel="Throttle" unit="%" comparison={comparison} />
                        )),
                        'legends',
                     ]}
                     enableGridX={false}
                     axisBottom={{
                        tickValues: [0, 25, 50, 75, 100],
                        format: (v) => `${v}%`,
                     }}
                     axisLeft={{ tickValues: 5 }}
                     theme={nivoTheme}
                  />
               </div>
            </div>

            <div className="telemetry-card chart-card p-5 !overflow-visible relative z-10">
               <h4 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider mb-4">Braking Pressure (%)</h4>
               <div className="h-48 !overflow-visible relative">
                  <ResponsiveLine
                     data={brakeLineData}
                     margin={{ top: 20, right: 30, bottom: 40, left: 45 }}
                     xScale={{ type: 'linear', min: 0, max: 100 }}
                     yScale={{ type: 'linear', min: 0, max: 100 }}
                     curve="stepAfter"
                     lineWidth={2}
                     colors={[comparison.driverA.displayColor, comparison.driverB.displayColor]}
                     enableSlices="x"
                     crosshairType="x"
                     layers={[
                        'grid',
                        'markers',
                        'axes',
                        'areas',
                        'crosshair',
                        'lines',
                        'points',
                        createAdaptiveSliceLayer((slice) => (
                           <ChannelSliceTooltip slice={slice} channel="Brake" unit="%" comparison={comparison} />
                        )),
                        'legends',
                     ]}
                     enableGridX={false}
                     axisBottom={{
                        tickValues: [0, 25, 50, 75, 100],
                        format: (v) => `${v}%`,
                     }}
                     axisLeft={{ tickValues: 5 }}
                     theme={nivoTheme}
                  />
               </div>
            </div>
         </div>
      </div>
   );
};

export default TelemetryTracesView;
