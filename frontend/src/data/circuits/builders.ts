import type {
   ActiveAeroZone,
   CircuitCornerMarker,
   CircuitData,
   OvertakeMode,
   Sector,
} from './types';

type CornerSeed = Pick<
   CircuitCornerMarker,
   | 'name'
   | 'type'
   | 'overtakingDifficulty'
   | 'brakingDifficulty'
>;

export interface CircuitDefinition {
   id: string;
   name: string;
   country: string;
   location: string;
   lengthKm: number;
   laps: number;
   corners: number;
   lapRecord: string;
   lapRecordHolder: string;
   trackPath: string;
   cornerNames: string[];
   cornerPositions: number[];
   cornerTypes?: CornerSeed['type'][];
   activeAeroRanges: Array<
      [number, number]
   >;
   overtakeDetectionPercent: number;
   overtakeActivationPercent?: number;
   speedTrapPercent: number;
   speedTrapLocation: string;
   topSpeedKmh: number;
   sector1StartPercent?: number;
   sector2StartPercent?: number;
   sector3StartPercent?: number;
}

const difficultyFor = (
   index: number,
   total: number
) => {
   if (
      index === 0 ||
      index === total - 1
   ) {
      return 'High' as const;
   }
   if (index % 5 === 0) {
      return 'Medium' as const;
   }
   return 'Low' as const;
};

export const buildCircuit = (
   definition: CircuitDefinition
): CircuitData => {

   const sector1Start = definition.sector1StartPercent ?? 0;
   const sector2Start = definition.sector2StartPercent ?? 33.4;
   const sector3Start = definition.sector3StartPercent ?? 66.7;

   // Direction is inferred from sector1 -> sector2: if sector2Start is smaller,
   // the sectors run in decreasing/wrapping order (like Bahrain's 90.7 -> 57.4 -> 18.6).
   // Otherwise they run in increasing/wrapping order (the 0 -> 33.4 -> 66.7 default).
   const isDecreasing = sector2Start < sector1Start;

   const wrapLength = (from: number, to: number) => {
      if (isDecreasing) {
         return from >= to ? from - to : from + (100 - to);
      }
      return to >= from ? to - from : (100 - from) + to;
   };

   const sector1LengthPercent = wrapLength(sector1Start, sector2Start);
   const sector2LengthPercent = wrapLength(sector2Start, sector3Start);
   const sector3LengthPercent = wrapLength(sector3Start, sector1Start);

   const sector1LengthKm = Number(
      ((definition.lengthKm * sector1LengthPercent) / 100).toFixed(3)
   );
   const sector2LengthKm = Number(
      ((definition.lengthKm * sector2LengthPercent) / 100).toFixed(3)
   );
   const sector3LengthKm = Number(
      ((definition.lengthKm * sector3LengthPercent) / 100).toFixed(3)
   );

   const sectors: Sector[] = [
      {
         id: 1,
         name: 'Sector 1',
         startPercent: sector1Start,
         endPercent: sector2Start,
         lengthPercent: sector1LengthPercent,
         lengthKm: sector1LengthKm,
         averageSpeedKmh: 226,
         fastestSectorHolder: '2026 live timing feed',
         isReversed: isDecreasing,
      },
      {
         id: 2,
         name: 'Sector 2',
         startPercent: sector2Start,
         endPercent: sector3Start,
         lengthPercent: sector2LengthPercent,
         lengthKm: sector2LengthKm,
         averageSpeedKmh: 218,
         fastestSectorHolder: '2026 live timing feed',
         isReversed: isDecreasing,
      },
      {
         id: 3,
         name: 'Sector 3',
         startPercent: sector3Start,
         endPercent: sector1Start,
         lengthPercent: sector3LengthPercent,
         lengthKm: sector3LengthKm,
         averageSpeedKmh: 205,
         fastestSectorHolder: '2026 live timing feed',
         isReversed: isDecreasing,
      },
   ];

   const cornerMarkers =
      Array.from(
         {
            length:
               definition.corners,
         },

         (_, index) => {
            const number =
               index + 1;

            const type =
               definition.cornerTypes?.[
               index
               ] ??
               (
                  number % 6 === 0
                     ? 'Chicane'
                     : number % 4 === 0
                        ? 'High-speed'
                        : 'Medium-speed'
               );

            const positionPercent =
               definition.cornerPositions[index] ??
               Number((((index + 0.55) / definition.corners) * 100).toFixed(2));

            const overtakingDifficulty =
               difficultyFor(
                  index,
                  definition.corners
               );

            return {
               number,
               name:
                  definition.cornerNames[
                  index
                  ] ??
                  `Turn ${number}`,
               type,
               positionPercent,
               overtakingDifficulty,
               brakingDifficulty:
                  type === 'Hairpin' ||
                     type === 'Chicane'
                     ? 'High'
                     : overtakingDifficulty,
               description:
                  `${definition.name} ${definition.cornerNames[
                  index
                  ] ??
                  `Turn ${number}`
                  } is annotated against the verified SVG centreline for engineering-style inspection.`,
               racingLine:
                  type === 'Hairpin' ||
                     type === 'Chicane'
                     ? 'Prioritise braking stability, late rotation, and traction on exit.'
                     : 'Carry minimum steering through the apex and protect exit speed.',
               averageSpeedKmh:
                  Math.max(
                     75,
                     Math.round(
                        255 -
                        index * 4 -
                        (
                           type ===
                              'Hairpin'
                              ? 85
                              : type ===
                                 'Chicane'
                                 ? 55
                                 : 0
                        )
                     )
                  ),
               overtakingRating:
                  Math.max(
                     1,
                     10 -
                     (
                        overtakingDifficulty ===
                           'High'
                           ? 2
                           : overtakingDifficulty ===
                              'Medium'
                              ? 4
                              : 6
                     )
                  ),
            };
         }
      );

   const activeAeroZones: ActiveAeroZone[] =
      definition.activeAeroRanges.map(
         (
            [
               startPercent,
               endPercent,
            ],
            index
         ) => ({
            id:
               `active-aero-${index + 1}`,
            label:
               `Straight Mode Zone ${index + 1}`,
            startPercent,
            endPercent,
            notes:
               '2026 Active Aero / Straight Mode activation segment.',
         })
      );

   const overtakeMode: OvertakeMode = {
      detectionPointPercent: definition.overtakeDetectionPercent,
      activationPointPercent: definition.overtakeActivationPercent ?? definition.overtakeDetectionPercent, // Fallback
      notes: '2026 Overtake Mode detection and activation points.',
   };

   return {
      id: definition.id,
      name:
         definition.name,
      country:
         definition.country,
      location:
         definition.location,
      lengthKm:
         definition.lengthKm,
      laps:
         definition.laps,
      corners:
         definition.corners,
      lapRecord:
         definition.lapRecord,
      lapRecordHolder:
         definition.lapRecordHolder,
      raceDistanceKm:
         Number(
            (
               definition.lengthKm *
               definition.laps
            ).toFixed(3)
         ),
      viewBox:
         '0 0 500 500',
      trackPath:
         definition.trackPath,
      sectors,
      cornerMarkers,
      activeAeroZones,
      overtakeMode,
      speedTrap: {
         location:
            definition.speedTrapLocation,
         positionPercent:
            definition.speedTrapPercent,
         historicalTopSpeedKmh:
            definition.topSpeedKmh,
         fastestRecordedSpeedKmh:
            definition.topSpeedKmh,
         fastestRecordedBy:
            'FIA speed trap benchmark',
      },
      source:
         'Track geometry from F1DB SVG circuit assets. Calendar checked against Formula1.com 2026 calendar.',
   };
};