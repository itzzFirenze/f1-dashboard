import React, { useId, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Info, Users, Compass } from 'lucide-react';
import { useReplay } from '../../context/ReplayContext';
import { CircuitData } from '../../data/circuits';
import CornerMarker from './CornerMarker';
import ActiveAeroZone from './ActiveAeroZone';
import SectorPath from './SectorPath';

interface InteractiveReplayMapProps {
  circuit: CircuitData;
}

export const InteractiveReplayMap: React.FC<InteractiveReplayMapProps> = ({ circuit }) => {
  const mapId = useId();
  const pathId = useMemo(() => `replay-track-${mapId.replace(/:/g, '')}`, [mapId]);
  const { driverLocations, drivers, selectedDrivers, toggleDriverSelection, currentTime } = useReplay();

  const [hoveredDriver, setHoveredDriver] = useState<number | null>(null);

  // Compute bounding box of active location samples to calibrate the projection matrix
  const projection = useMemo(() => {
    const locations = Object.values(driverLocations);
    if (locations.length === 0) {
      return { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0, invertX: false, invertY: false };
    }

    // Default circuit boundaries or computed dynamically
    // OpenF1 coordinate bounds typically span thousands of meters. Let's calculate the bounding box.
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    locations.forEach((loc) => {
      if (loc.x < minX) minX = loc.x;
      if (loc.x > maxX) maxX = loc.x;
      if (loc.y < minY) minY = loc.y;
      if (loc.y > maxY) maxY = loc.y;
    });

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    // We want to map into SVG bounds (typically 40 to 460 in a 500x500 box to leave padding)
    const padding = 60;
    const targetMinX = padding;
    const targetMaxX = 500 - padding;
    const targetMinY = padding;
    const targetMaxY = 500 - padding;
    const targetWidth = targetMaxX - targetMinX;
    const targetHeight = targetMaxY - targetMinY;

    // Fit aspect ratio
    const scale = Math.min(targetWidth / rangeX, targetHeight / rangeY);

    return {
      scaleX: scale,
      scaleY: -scale, // Invert Y as F1 telemetry coordinates typically have Y pointing up, SVGs have Y pointing down
      offsetX: 250 - ((minX + maxX) / 2) * scale,
      offsetY: 250 + ((minY + maxY) / 2) * scale,
    };
  }, [driverLocations]);

  // Project telemetry coordinates to SVG space
  const project = (x: number, y: number) => {
    return {
      x: x * projection.scaleX + projection.offsetX,
      y: y * projection.scaleY + projection.offsetY,
    };
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-f1-dark-gray/60 p-4 shadow-2xl backdrop-blur-md">
      {/* HUD Info */}
      <div className="absolute left-4 top-4 z-10 space-y-1">
        <h3 className="font-display text-lg font-bold text-f1-white">{circuit.name}</h3>
        <p className="flex items-center gap-1.5 text-xs text-f1-silver">
          <MapPin className="h-3.5 w-3.5 text-f1-red" />
          {circuit.location}, {circuit.country}
        </p>
      </div>

      <div className="absolute right-4 top-4 z-10 flex gap-2">
        <span className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-medium text-f1-silver flex items-center gap-1">
          <Compass className="h-3 w-3" /> Telemetry Sync
        </span>
      </div>

      {/* SVG Circuit Visualizer */}
      <svg viewBox="0 0 500 500" className="h-[480px] w-full sm:h-[580px]">
        {/* Glow & Track Shadows */}
        <defs>
          <filter id="track-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track outline */}
        <path
          d={circuit.trackPath}
          fill="none"
          stroke="#020617"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={circuit.trackPath}
          fill="none"
          stroke="#f8fafc"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#track-glow)"
          opacity="0.2"
        />
        <path
          d={circuit.trackPath}
          fill="none"
          stroke="#1e293b"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Render Circuit DRS Zones */}
        {circuit.drsZonesData.map((zone) => (
          <ActiveAeroZone key={zone.id} path={circuit.trackPath} zone={zone} active={false} onHover={() => {}} />
        ))}

        {/* Render Driver Markers */}
        {drivers.map((driver) => {
          const loc = driverLocations[driver.driver_number];
          if (!loc) return null;

          const pos = project(loc.x, loc.y);
          const isSelected = selectedDrivers.includes(driver.driver_number);
          const teamColor = `#${driver.team_colour || 'ffffff'}`;

          return (
            <g
              key={driver.driver_number}
              onClick={() => toggleDriverSelection(driver.driver_number)}
              onMouseEnter={() => setHoveredDriver(driver.driver_number)}
              onMouseLeave={() => setHoveredDriver(null)}
              className="cursor-pointer group"
            >
              {/* Dynamic pulse / selection glow */}
              {isSelected && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="14"
                  fill="transparent"
                  stroke={teamColor}
                  strokeWidth="2"
                  className="animate-ping opacity-75"
                />
              )}

              {/* Driver Dot Marker */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="8"
                fill={teamColor}
                stroke="#0f172a"
                strokeWidth="2"
                className="transition-all duration-300 group-hover:scale-125"
              />

              {/* Mini Driver Label Text */}
              <text
                x={pos.x}
                y={pos.y - 12}
                textAnchor="middle"
                fontSize="9"
                fontWeight="800"
                fill="#f8fafc"
                className="select-none bg-black/80 px-1 font-mono filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
              >
                {driver.name_acronym}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Interactive Tooltip Panel */}
      <AnimatePresence>
        {hoveredDriver && (() => {
          const driver = drivers.find((d) => d.driver_number === hoveredDriver);
          const loc = driverLocations[hoveredDriver];
          if (!driver || !loc) return null;

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute bottom-4 left-4 z-20 w-64 rounded-xl border border-white/10 bg-f1-black/95 p-3 shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: `#${driver.team_colour}` }}
                />
                <div>
                  <h4 className="text-xs font-bold text-f1-white">{driver.full_name}</h4>
                  <p className="text-[10px] text-f1-silver">{driver.team_name}</p>
                </div>
              </div>
              <div className="mt-2 space-y-1 text-[11px] text-f1-silver">
                <div className="flex justify-between">
                  <span>Acronym</span>
                  <span className="font-mono text-f1-white font-semibold">{driver.name_acronym}</span>
                </div>
                <div className="flex justify-between">
                  <span>Number</span>
                  <span className="font-mono text-f1-white">{driver.driver_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>X Coordinate</span>
                  <span className="font-mono text-f1-white">{loc.x.toFixed(1)} m</span>
                </div>
                <div className="flex justify-between">
                  <span>Y Coordinate</span>
                  <span className="font-mono text-f1-white">{loc.y.toFixed(1)} m</span>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
