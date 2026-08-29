import { circuits } from '../data/circuits';
import type { CircuitData, CircuitCornerMarker } from '../data/circuits/types';

export interface LapTelemetryMeta {
   code: string;
   name: string;
   team: string;
   color: string;
   displayColor: string;
   lineStyle: 'solid' | 'dashed';
   lapNumber: number;
   lapType: 'Fastest Lap' | 'Pole / Q3 Lap' | 'Race Stint Lap';
   lapTime: string;
   lapTimeSeconds: number;
   s1Time: string;
   s2Time: string;
   s3Time: string;
   compound: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTER' | 'WET';
   tyreAge: number;
   topSpeedKmh: number;
}

export interface TelemetryDataPoint {
   distancePct: number; // 0 to 100%
   distanceMeters: number;
   speedA: number; // km/h
   speedB: number; // km/h
   throttleA: number; // 0 to 100%
   throttleB: number; // 0 to 100%
   brakeA: number; // 0 to 100%
   brakeB: number; // 0 to 100%
   gearA: number; // 1 to 8
   gearB: number; // 1 to 8
   drsA: number; // 0 or 1
   drsB: number; // 0 or 1
   timeA: number; // seconds
   timeB: number; // seconds
   deltaTime: number; // timeA - timeB (negative = A is ahead/faster, positive = B is ahead)
   positionPctA: number; // track % position of car A at this time
   positionPctB: number; // track % position of car B at this time
   x: number; // 0 to 1000 SVG coordinate
   y: number; // 0 to 1000 SVG coordinate
}

export interface CornerApexAnalysis {
   cornerNumber: number;
   cornerName: string;
   cornerType: string;
   trackPositionPct: number;
   entrySpeedA: number;
   entrySpeedB: number;
   apexSpeedA: number;
   apexSpeedB: number;
   exitSpeedA: number;
   exitSpeedB: number;
   apexGearA: number;
   apexGearB: number;
   deltaApexSpeed: number; // speedA - speedB
   timeDelta: number; // seconds (+ = B faster, - = A faster)
   fasterDriver: 'A' | 'B' | 'TIE';
}

export interface SectorInsight {
   sectorNumber: 1 | 2 | 3;
   title: string;
   timeDelta: number; // negative = A faster, positive = B faster
   fasterDriver: 'A' | 'B';
   analysisText: string;
}

export interface TelemetryComparisonResult {
   circuit: CircuitData;
   driverA: LapTelemetryMeta;
   driverB: LapTelemetryMeta;
   points: TelemetryDataPoint[];
   corners: CornerApexAnalysis[];
   sectorInsights: SectorInsight[];
   summary: {
      maxSpeedA: number;
      maxSpeedB: number;
      minSpeedA: number;
      minSpeedB: number;
      avgSpeedA: number;
      avgSpeedB: number;
      timeGapSeconds: number;
      fasterDriver: 'A' | 'B';
      sectorsFasterA: number;
      sectorsFasterB: number;
      overallVerdict: string;
   };
}

const TEAM_ALTERNATE_COLORS: Record<string, string> = {
   ferrari: '#FACC15', // Giallo Modena Gold
   red_bull: '#FB923C', // Bright Orange
   mclaren: '#38BDF8', // Cyan Blue
   mercedes: '#FDE047', // Neon Yellow
   aston_martin: '#A7F3D0', // Mint Green
   alpine: '#F472B6', // Hot Pink
   williams: '#60A5FA', // Sky Blue
   rb: '#C084FC', // Violet
   sauber: '#4ADE80', // Bright Lime
   haas: '#CBD5E1', // Platinum
};

// Generate realistic, physics-grounded telemetry traces for two drivers on a circuit
export const generateTelemetryComparison = (
   circuitId: string,
   driverAData: { code: string; name: string; team: string; color: string; lapOffsetSec?: number; styleVariance?: number; lapNumber?: number; compound?: 'SOFT' | 'MEDIUM' | 'HARD' },
   driverBData: { code: string; name: string; team: string; color: string; lapOffsetSec?: number; styleVariance?: number; lapNumber?: number; compound?: 'SOFT' | 'MEDIUM' | 'HARD' }
): TelemetryComparisonResult => {
   const circuit = circuits.find((c) => c.id === circuitId) || circuits[0];
   const trackLengthMeters = (circuit.lengthKm || 5.4) * 1000;

   // Base lap time in seconds
   const baseLapSec = parseLapTime(circuit.lapRecord) || 85.5;
   const lapTimeA = Number((baseLapSec + (driverAData.lapOffsetSec ?? 0.12)).toFixed(3));
   const lapTimeB = Number((baseLapSec + (driverBData.lapOffsetSec ?? 0.38)).toFixed(3));

   // Handle same team distinct coloring & dashed line style
   const isSameTeam = driverAData.team && driverBData.team && driverAData.team.trim().toLowerCase() === driverBData.team.trim().toLowerCase();
   const teamKey = driverAData.team?.toLowerCase().replace(/\s+/g, '_') || '';
   const altColor = TEAM_ALTERNATE_COLORS[teamKey] || '#38BDF8';

   const displayColorA = driverAData.color || '#E10600';
   const displayColorB = isSameTeam ? altColor : (driverBData.color || '#38BDF8');
   const lineStyleB: 'solid' | 'dashed' = isSameTeam ? 'dashed' : 'solid';

   const numPoints = 250;
   const points: TelemetryDataPoint[] = [];

   // Corner markers
   const cornerMarkers = circuit.cornerMarkers && circuit.cornerMarkers.length > 0
      ? circuit.cornerMarkers
      : Array.from({ length: circuit.corners || 15 }, (_, i) => ({
           number: i + 1,
           name: `Turn ${i + 1}`,
           type: 'Medium-speed' as const,
           positionPercent: ((i + 1) / ((circuit.corners || 15) + 1)) * 100,
           overtakingDifficulty: 'Medium' as const,
           description: '',
           racingLine: '',
           brakingDifficulty: 'Medium' as const,
           averageSpeedKmh: 140,
           overtakingRating: 5,
        }));

   const sortedCorners = [...cornerMarkers].sort((a, b) => a.positionPercent - b.positionPercent);

   let cumTimeA = 0;
   let cumTimeB = 0;

   const varA = driverAData.styleVariance ?? 0.05;
   const varB = driverBData.styleVariance ?? -0.05;

   for (let i = 0; i <= numPoints; i++) {
      const pct = (i / numPoints) * 100;
      const distMeters = (pct / 100) * trackLengthMeters;

      // Find nearest corner
      let minDistToCorner = 100;
      let nearestCorner = sortedCorners[0];
      for (const corner of sortedCorners) {
         const diff = Math.min(
            Math.abs(pct - corner.positionPercent),
            Math.abs(pct - corner.positionPercent + 100),
            Math.abs(pct - corner.positionPercent - 100)
         );
         if (diff < minDistToCorner) {
            minDistToCorner = diff;
            nearestCorner = corner;
         }
      }

      // Check if in active aero / straight zone
      const isInAeroZone = circuit.activeAeroZones?.some((zone) => {
         const start = zone.startPercent;
         const end = zone.endPercent;
         if (start <= end) return pct >= start && pct <= end;
         return pct >= start || pct <= end;
      }) ?? (minDistToCorner > 6);

      // Speed profile modeling
      const cornerInfluence = Math.exp(-Math.pow(minDistToCorner / 2.8, 2));
      const cornerTypeFactor =
         nearestCorner?.type === 'Hairpin' ? 75 :
         nearestCorner?.type === 'Low-speed' ? 95 :
         nearestCorner?.type === 'Chicane' ? 110 :
         nearestCorner?.type === 'Esses' ? 165 :
         nearestCorner?.type === 'Medium-speed' ? 145 : 210;

      const straightTopSpeed = circuit.speedTrap?.historicalTopSpeedKmh || 335;
      const baseSpeed = (1 - cornerInfluence) * straightTopSpeed + cornerInfluence * cornerTypeFactor;
      
      const isBrakingPhase = (pct < nearestCorner.positionPercent && minDistToCorner < 5);
      const isExitPhase = (pct >= nearestCorner.positionPercent && minDistToCorner < 5);

      const driverASpeedMod = isBrakingPhase ? (1 + varA * 0.4) : isExitPhase ? (1 + varA * 0.2) : (1 + varA * 0.1);
      const driverBSpeedMod = isBrakingPhase ? (1 + varB * 0.3) : isExitPhase ? (1 + varB * 0.5) : (1 + varB * 0.1);

      const noiseA = Math.sin(i * 0.4) * 1.5 + Math.cos(i * 0.8) * 1.0;
      const noiseB = Math.sin(i * 0.45 + 0.5) * 1.5 + Math.cos(i * 0.85 + 0.2) * 1.0;

      const speedA = Math.round(Math.min(355, Math.max(60, baseSpeed * driverASpeedMod + noiseA)));
      const speedB = Math.round(Math.min(355, Math.max(60, baseSpeed * driverBSpeedMod + noiseB)));

      const throttleA = isBrakingPhase ? Math.max(0, Math.min(20, Math.round((1 - cornerInfluence) * 40))) : Math.min(100, Math.max(0, Math.round(100 - cornerInfluence * 90)));
      const throttleB = isBrakingPhase ? Math.max(0, Math.min(20, Math.round((1 - cornerInfluence) * 35))) : Math.min(100, Math.max(0, Math.round(100 - cornerInfluence * 85)));

      const brakeA = isBrakingPhase ? Math.min(100, Math.max(0, Math.round(cornerInfluence * 100))) : 0;
      const brakeB = isBrakingPhase ? Math.min(100, Math.max(0, Math.round(cornerInfluence * 95))) : 0;

      const gearA = speedA < 90 ? 2 : speedA < 130 ? 3 : speedA < 180 ? 4 : speedA < 230 ? 5 : speedA < 275 ? 6 : speedA < 310 ? 7 : 8;
      const gearB = speedB < 90 ? 2 : speedB < 130 ? 3 : speedB < 180 ? 4 : speedB < 230 ? 5 : speedB < 275 ? 6 : speedB < 310 ? 7 : 8;

      const drsA = isInAeroZone && speedA > 240 && throttleA > 95 ? 1 : 0;
      const drsB = isInAeroZone && speedB > 240 && throttleB > 95 ? 1 : 0;

      const stepDistanceMeters = trackLengthMeters / numPoints;
      const dtA = stepDistanceMeters / ((speedA * 1000) / 3600);
      const dtB = stepDistanceMeters / ((speedB * 1000) / 3600);

      cumTimeA += dtA;
      cumTimeB += dtB;

      // SVG track coordinate
      const x = Math.round(500 + Math.sin((pct / 100) * Math.PI * 2) * 380);
      const y = Math.round(500 - Math.cos((pct / 100) * Math.PI * 2) * 320);

      points.push({
         distancePct: Number(pct.toFixed(1)),
         distanceMeters: Math.round(distMeters),
         speedA,
         speedB,
         throttleA,
         throttleB,
         brakeA,
         brakeB,
         gearA,
         gearB,
         drsA,
         drsB,
         timeA: Number(cumTimeA.toFixed(3)),
         timeB: Number(cumTimeB.toFixed(3)),
         deltaTime: Number((cumTimeA - cumTimeB).toFixed(3)),
         positionPctA: pct,
         positionPctB: pct,
         x,
         y,
      });
   }

   // Normalize cumTime to target lap times
   const timeScaleA = lapTimeA / cumTimeA;
   const timeScaleB = lapTimeB / cumTimeB;
   points.forEach((p) => {
      p.timeA = Number((p.timeA * timeScaleA).toFixed(3));
      p.timeB = Number((p.timeB * timeScaleB).toFixed(3));
      p.deltaTime = Number((p.timeA - p.timeB).toFixed(3));
      
      // Calculate ghost track position separation (the faster driver is physically slightly ahead on track)
      const gapSec = p.timeB - p.timeA; // positive if A is faster/ahead
      const ghostOffsetPct = (gapSec * 220) / (trackLengthMeters) * 100;
      p.positionPctA = p.distancePct;
      p.positionPctB = Math.max(0, Math.min(100, p.distancePct - ghostOffsetPct));
   });

   // Build Corner-by-Corner Apex Analysis
   const corners: CornerApexAnalysis[] = sortedCorners.map((corner) => {
      const apexPoint = points.reduce((prev, curr) =>
         Math.abs(curr.distancePct - corner.positionPercent) < Math.abs(prev.distancePct - corner.positionPercent) ? curr : prev
      );

      const entryPct = (corner.positionPercent - 2.5 + 100) % 100;
      const entryPoint = points.reduce((prev, curr) =>
         Math.abs(curr.distancePct - entryPct) < Math.abs(prev.distancePct - entryPct) ? curr : prev
      );

      const exitPct = (corner.positionPercent + 2.5) % 100;
      const exitPoint = points.reduce((prev, curr) =>
         Math.abs(curr.distancePct - exitPct) < Math.abs(prev.distancePct - exitPct) ? curr : prev
      );

      const deltaSpeed = apexPoint.speedA - apexPoint.speedB;
      const cornerTimeDelta = (exitPoint.timeA - entryPoint.timeA) - (exitPoint.timeB - entryPoint.timeB);

      let fasterDriver: 'A' | 'B' | 'TIE' = 'TIE';
      if (cornerTimeDelta < -0.015 || deltaSpeed > 2) fasterDriver = 'A';
      else if (cornerTimeDelta > 0.015 || deltaSpeed < -2) fasterDriver = 'B';

      return {
         cornerNumber: corner.number,
         cornerName: corner.name || `Turn ${corner.number}`,
         cornerType: corner.type || 'Medium-speed',
         trackPositionPct: corner.positionPercent,
         entrySpeedA: entryPoint.speedA,
         entrySpeedB: entryPoint.speedB,
         apexSpeedA: apexPoint.speedA,
         apexSpeedB: apexPoint.speedB,
         exitSpeedA: exitPoint.speedA,
         exitSpeedB: exitPoint.speedB,
         apexGearA: apexPoint.gearA,
         apexGearB: apexPoint.gearB,
         deltaApexSpeed: deltaSpeed,
         timeDelta: Number(cornerTimeDelta.toFixed(3)),
         fasterDriver,
      };
   });

   const speedsA = points.map((p) => p.speedA);
   const speedsB = points.map((p) => p.speedB);

   const fasterA = corners.filter((c) => c.fasterDriver === 'A').length;
   const fasterB = corners.filter((c) => c.fasterDriver === 'B').length;

   // Build sector breakdown times
   const s1Split = Math.floor(points.length * 0.33);
   const s2Split = Math.floor(points.length * 0.67);

   const s1TimeA = points[s1Split].timeA;
   const s1TimeB = points[s1Split].timeB;
   const s2TimeA = points[s2Split].timeA - s1TimeA;
   const s2TimeB = points[s2Split].timeB - s1TimeB;
   const s3TimeA = lapTimeA - points[s2Split].timeA;
   const s3TimeB = lapTimeB - points[s2Split].timeB;

   const s1Delta = Number((s1TimeA - s1TimeB).toFixed(3));
   const s2Delta = Number((s2TimeA - s2TimeB).toFixed(3));
   const s3Delta = Number((s3TimeA - s3TimeB).toFixed(3));

   const sectorInsights: SectorInsight[] = [
      {
         sectorNumber: 1,
         title: 'Sector 1 (Opening Complex & Braking Zones)',
         timeDelta: s1Delta,
         fasterDriver: s1Delta <= 0 ? 'A' : 'B',
         analysisText: s1Delta <= 0
            ? `${driverAData.code} gained ${Math.abs(s1Delta)}s with deeper braking entries and earlier throttle application out of Turn 1.`
            : `${driverBData.code} gained ${Math.abs(s1Delta)}s through superior entry straight line velocity and stable braking deceleration.`,
      },
      {
         sectorNumber: 2,
         title: 'Sector 2 (High-Downforce Esses & Technical Infield)',
         timeDelta: s2Delta,
         fasterDriver: s2Delta <= 0 ? 'A' : 'B',
         analysisText: s2Delta <= 0
            ? `${driverAData.code} carried higher minimum apex speeds through mid-corner transitions (+${Math.abs(s2Delta)}s advantage).`
            : `${driverBData.code} maintained higher momentum through sweeping chicanes, minimizing mid-corner scrubbing (+${Math.abs(s2Delta)}s advantage).`,
      },
      {
         sectorNumber: 3,
         title: 'Sector 3 (Final Drag & Main Straight Drag Reduction)',
         timeDelta: s3Delta,
         fasterDriver: s3Delta <= 0 ? 'A' : 'B',
         analysisText: s3Delta <= 0
            ? `${driverAData.code} achieved superior traction out of the final corner with optimal DRS deployment.`
            : `${driverBData.code} had better exit drive onto the start/finish straight gaining +${Math.abs(s3Delta)}s across the line.`,
      },
   ];

   const timeGapSeconds = Number(Math.abs(lapTimeA - lapTimeB).toFixed(3));
   const fasterDriver = lapTimeA <= lapTimeB ? 'A' : 'B';
   const winnerCode = fasterDriver === 'A' ? driverAData.code : driverBData.code;

   const overallVerdict = `${winnerCode} was faster by ${timeGapSeconds}s overall, dominating ${fasterDriver === 'A' ? fasterA : fasterB} out of ${corners.length} corners on this lap.`;

   return {
      circuit,
      driverA: {
         code: driverAData.code,
         name: driverAData.name,
         team: driverAData.team,
         color: displayColorA,
         displayColor: displayColorA,
         lineStyle: 'solid',
         lapNumber: driverAData.lapNumber || 42,
         lapType: 'Fastest Lap',
         lapTime: formatLapTime(lapTimeA),
         lapTimeSeconds: lapTimeA,
         s1Time: s1TimeA.toFixed(3),
         s2Time: s2TimeA.toFixed(3),
         s3Time: s3TimeA.toFixed(3),
         compound: driverAData.compound || 'SOFT',
         tyreAge: 4,
         topSpeedKmh: Math.max(...speedsA),
      },
      driverB: {
         code: driverBData.code,
         name: driverBData.name,
         team: driverBData.team,
         color: displayColorB,
         displayColor: displayColorB,
         lineStyle: lineStyleB,
         lapNumber: driverBData.lapNumber || 45,
         lapType: 'Fastest Lap',
         lapTime: formatLapTime(lapTimeB),
         lapTimeSeconds: lapTimeB,
         s1Time: s1TimeB.toFixed(3),
         s2Time: s2TimeB.toFixed(3),
         s3Time: s3TimeB.toFixed(3),
         compound: driverBData.compound || 'SOFT',
         tyreAge: 6,
         topSpeedKmh: Math.max(...speedsB),
      },
      points,
      corners,
      sectorInsights,
      summary: {
         maxSpeedA: Math.max(...speedsA),
         maxSpeedB: Math.max(...speedsB),
         minSpeedA: Math.min(...speedsA),
         minSpeedB: Math.min(...speedsB),
         avgSpeedA: Math.round(speedsA.reduce((a, b) => a + b, 0) / speedsA.length),
         avgSpeedB: Math.round(speedsB.reduce((a, b) => a + b, 0) / speedsB.length),
         timeGapSeconds,
         fasterDriver,
         sectorsFasterA: fasterA,
         sectorsFasterB: fasterB,
         overallVerdict,
      },
   };
};

function parseLapTime(timeStr?: string): number | null {
   if (!timeStr) return null;
   const parts = timeStr.split(':');
   if (parts.length === 2) {
      const mins = parseFloat(parts[0]);
      const secs = parseFloat(parts[1]);
      return mins * 60 + secs;
   }
   const s = parseFloat(timeStr);
   return isNaN(s) ? null : s;
}

function formatLapTime(seconds: number): string {
   const mins = Math.floor(seconds / 60);
   const secs = (seconds % 60).toFixed(3);
   return `${mins}:${parseFloat(secs) < 10 ? '0' : ''}${secs}`;
}
