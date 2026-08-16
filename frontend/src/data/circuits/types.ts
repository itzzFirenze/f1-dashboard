export type OvertakingDifficulty =
   | 'Low'
   | 'Medium'
   | 'High'
   | 'Extreme';

export interface Sector {
   id: 1 | 2 | 3;
   name: string;
   startPercent: number;
   endPercent: number;
   lengthPercent: number;
   lengthKm: number;
   averageSpeedKmh: number;
   fastestSectorHolder: string;
   isReversed: boolean;
}

export interface PitLane {
   entryPercent: number;
   exitPercent: number;
   speedLimitKmh: number;
   offsetPx: number;   // how far right of the racing line the pit lane sits
   notes: string;
}

export interface ActiveAeroZone {
   id: string;
   label: string;
   startPercent: number;
   endPercent: number;
   notes: string;
}

export interface OvertakeMode {
   detectionPointPercent: number;
   activationPointPercent: number;
   notes: string;
}

export interface CircuitCornerMarker {
   number: number;
   name: string;
   type:
   | 'Hairpin'
   | 'Chicane'
   | 'Esses'
   | 'Kink'
   | 'Medium-speed'
   | 'High-speed'
   | 'Low-speed';
   positionPercent: number;
   overtakingDifficulty: OvertakingDifficulty;
   description: string;
   racingLine: string;
   brakingDifficulty: OvertakingDifficulty;
   averageSpeedKmh: number;
   overtakingRating: number;
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
   lapRecord: string;
   lapRecordHolder: string;
   raceDistanceKm: number;
   isReversed: boolean;
   viewBox: string;
   trackPath: string;
   sectors: Sector[];
   cornerMarkers: CircuitCornerMarker[];
   activeAeroZones: ActiveAeroZone[];
   overtakeMode: OvertakeMode;
   speedTrap: SpeedTrap;
   pitLane: PitLane;
   source: string;
}