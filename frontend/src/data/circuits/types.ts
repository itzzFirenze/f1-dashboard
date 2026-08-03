export type OvertakingDifficulty = 'Low' | 'Medium' | 'High' | 'Extreme';

export interface Sector {
  id: 1 | 2 | 3;
  name: string;
  startPercent: number;
  endPercent: number;
  lengthKm: number;
  averageSpeedKmh: number;
  fastestSectorHolder: string;
}

export interface CircuitCornerMarker {
  number: number;
  name: string;
  type: 'Hairpin' | 'Chicane' | 'Esses' | 'Kink' | 'Medium-speed' | 'High-speed' | 'Low-speed';
  positionPercent: number;
  overtakingDifficulty: OvertakingDifficulty;
  description: string;
  racingLine: string;
  brakingDifficulty: OvertakingDifficulty;
  averageSpeedKmh: number;
  overtakingRating: number;
}

export interface DetectionPoint {
  id: string;
  label: string;
  positionPercent: number;
}

export interface CircuitDRSZone {
  id: string;
  label: string;
  startPercent: number;
  endPercent: number;
  detectionPointId: string;
  notes: string;
}

export interface SpeedTrap {
  location: string;
  positionPercent: number;
  historicalTopSpeedKmh: number;
  fastestRecordedSpeedKmh: number;
  fastestRecordedBy: string;
}

export interface CircuitData {
  id: string;
  name: string;
  country: string;
  location: string;
  lengthKm: number;
  laps: number;
  corners: number;
  drsZones: number;
  lapRecord: string;
  lapRecordHolder: string;
  raceDistanceKm: number;
  viewBox: string;
  trackPath: string;
  sectors: Sector[];
  cornerMarkers: CircuitCornerMarker[];
  drsDetectionPoints: DetectionPoint[];
  drsZonesData: CircuitDRSZone[];
  speedTrap: SpeedTrap;
  source: string;
}
