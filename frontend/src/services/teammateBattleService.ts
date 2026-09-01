import { constructorService } from './constructorService';
import { driverService } from './driverService';
import { raceService } from './raceService';
import { analyticsService } from './analyticsService';
import type { Driver, RaceDetail } from '../types';

export interface RoundDuel {
   round: number;
   raceName: string;
   qualiPos1: number | null;
   qualiPos2: number | null;
   racePos1: number | null;
   racePos2: number | null;
   points1: number;
   points2: number;
   qualiWinner: 1 | 2 | null;
   raceWinner: 1 | 2 | null;
   gapMs?: number;
}

export interface TeammateBattle {
   constructor: {
      id: number;
      name: string;
      color: string;
      logoUrl: string | null;
      nationality: string;
   };
   driver1: Driver;
   driver2: Driver;
   qualiH2H1: number;
   qualiH2H2: number;
   avgQualiGapMs: number; // negative means driver 1 faster on average
   raceH2H1: number;
   raceH2H2: number;
   points1: number;
   points2: number;
   pointsShare1: number; // percentage
   pointsShare2: number; // percentage
   avgFinish1: number;
   avgFinish2: number;
   avgGrid1: number;
   avgGrid2: number;
   podiums1: number;
   podiums2: number;
   wins1: number;
   wins2: number;
   dnfs1: number;
   dnfs2: number;
   duels: RoundDuel[];
}

export interface SeasonBattlesResult {
   season: number;
   battles: TeammateBattle[];
}

export const teammateBattleService = {
   getSeasonBattles: async (season: number = 2026): Promise<SeasonBattlesResult> => {
      try {
         // Fetch drivers, constructors, races & consistency data in parallel
         const [allDrivers, allConstructors, allRaces, consistencyData] = await Promise.all([
            driverService.getAll(undefined, season),
            constructorService.getAll(season),
            raceService.getAll(season),
            analyticsService.getConsistency(season),
         ]);

         // Fetch real race details for all completed races in parallel
         const completedRaces = allRaces.filter(r => r.status === 'COMPLETED');
         const raceDetails: Map<number, RaceDetail> = new Map();
         if (completedRaces.length > 0) {
            const details = await Promise.all(
               completedRaces.map(r => raceService.getById(r.id).catch(() => null))
            );
            details.forEach((detail, idx) => {
               if (detail) raceDetails.set(completedRaces[idx].id, detail);
            });
         }

         const battles: TeammateBattle[] = [];

         // Pre-process drivers to normalize full-season pairings
         const adjustedDrivers = allDrivers.map((d) => {
            const code = (d.code || '').toUpperCase();
            const lastName = (d.lastName || '').toLowerCase();

            // Liam Lawson is full-season RB / Racing Bulls teammate with Arvid Lindblad
            if (code === 'LAW' || lastName.includes('lawson')) {
               const rbTeam = allConstructors.find((c) => {
                  const n = c.name.toLowerCase();
                  return n.includes('rb') || n.includes('racing bulls') || n.includes('vcarb');
               });
               if (rbTeam) {
                  return { ...d, constructorName: rbTeam.name, constructorColor: rbTeam.color || d.constructorColor };
               }
            }
            return d;
         });

         // Group drivers by constructor
         const driversByConstructor: Record<string, Driver[]> = {};
         for (const d of adjustedDrivers) {
            const teamKey = d.constructorName || 'Independent';
            if (!driversByConstructor[teamKey]) driversByConstructor[teamKey] = [];
            driversByConstructor[teamKey].push(d);
         }

         for (const team of allConstructors) {
            let teamDrivers = driversByConstructor[team.name] || [];
            if (teamDrivers.length < 2) continue;

            // Prioritize primary full-season drivers over 1-race substitute drivers
            teamDrivers = [...teamDrivers].sort((a, b) => {
               const aCode = (a.code || '').toUpperCase();
               const bCode = (b.code || '').toUpperCase();
               const aLast = (a.lastName || '').toLowerCase();
               const bLast = (b.lastName || '').toLowerCase();

               const isAPrimary = aCode === 'LIN' || aCode === 'LAW' || aLast.includes('lindblad') || aLast.includes('lawson');
               const isBPrimary = bCode === 'LIN' || bCode === 'LAW' || bLast.includes('lindblad') || bLast.includes('lawson');
               const isASub = aCode === 'TSU' || aLast.includes('tsunoda');
               const isBSub = bCode === 'TSU' || bLast.includes('tsunoda');

               if (isAPrimary && isBSub) return -1;
               if (isBPrimary && isASub) return 1;

               if ((b.points || 0) !== (a.points || 0)) {
                  return (b.points || 0) - (a.points || 0);
               }
               return (a.championshipPosition || 99) - (b.championshipPosition || 99);
            });

            const d1 = teamDrivers[0];
            const d2 = teamDrivers[1];

            const d1Code = (d1.code || '').toUpperCase();
            const d2Code = (d2.code || '').toUpperCase();

            const duels: RoundDuel[] = [];
            let q1Wins = 0;
            let q2Wins = 0;
            let r1Wins = 0;
            let r2Wins = 0;
            let totalGapMs = 0;
            let gapCount = 0;
            let dnfCount1 = 0;
            let dnfCount2 = 0;
            let totalGrid1 = 0;
            let totalGrid2 = 0;
            let gridCount1 = 0;
            let gridCount2 = 0;

            const baseP1 = d1.points || 0;
            const baseP2 = d2.points || 0;
            const totalPts = baseP1 + baseP2 || 1;

            const p1Share = Math.round((baseP1 / totalPts) * 100);
            const p2Share = 100 - p1Share;

            const consistency1 = consistencyData?.drivers?.find(d => d.driver.id === d1.id);
            const consistency2 = consistencyData?.drivers?.find(d => d.driver.id === d2.id);

            const roundsCount = completedRaces.length > 0 ? completedRaces.length : 0;

            for (let i = 0; i < roundsCount; i++) {
               const race = completedRaces[i];
               const detail = raceDetails.get(race.id);

               // ── Real qualifying positions ──────────────────────────────────────
               // Priority 1: qualifyingResults[].position looked up by driverCode
               // Priority 2: gridPosition from race results (= actual qualifying grid)
               // Priority 3: null (driver did not participate / data unavailable)
               let qPos1: number | null = null;
               let qPos2: number | null = null;

               if (detail?.qualifyingResults && detail.qualifyingResults.length > 0) {
                  const qr1 = detail.qualifyingResults.find(r => (r.driverCode || '').toUpperCase() === d1Code);
                  const qr2 = detail.qualifyingResults.find(r => (r.driverCode || '').toUpperCase() === d2Code);
                  qPos1 = qr1?.position ?? null;
                  qPos2 = qr2?.position ?? null;
               }

               // Fallback: use gridPosition from race results
               if ((qPos1 === null || qPos2 === null) && detail?.results && detail.results.length > 0) {
                  if (qPos1 === null) {
                     const rr1 = detail.results.find(r => (r.driverCode || '').toUpperCase() === d1Code);
                     if (rr1?.gridPosition) qPos1 = rr1.gridPosition;
                  }
                  if (qPos2 === null) {
                     const rr2 = detail.results.find(r => (r.driverCode || '').toUpperCase() === d2Code);
                     if (rr2?.gridPosition) qPos2 = rr2.gridPosition;
                  }
               }

               // Track average grid
               if (qPos1 !== null) { totalGrid1 += qPos1; gridCount1++; }
               if (qPos2 !== null) { totalGrid2 += qPos2; gridCount2++; }

               // Qualifying gap from Q3 times if available (best effort)
               // We track duel wins only when both positions are available
               let qWinner: 1 | 2 | null = null;
               if (qPos1 !== null && qPos2 !== null) {
                  qWinner = qPos1 < qPos2 ? 1 : qPos2 < qPos1 ? 2 : null;
                  if (qWinner === 1) q1Wins++;
                  else if (qWinner === 2) q2Wins++;
               }

               // ── Real race positions ────────────────────────────────────────────
               // Primary source: consistencyData.resultsByRace (keyed by race name)
               const resVal1 = consistency1?.resultsByRace[race.name];
               const resVal2 = consistency2?.resultsByRace[race.name];

               const isDnf1 = resVal1 === 'DNF';
               const isDnf2 = resVal2 === 'DNF';
               if (isDnf1) dnfCount1++;
               if (isDnf2) dnfCount2++;

               let rPos1: number | null = isDnf1 ? null : (resVal1 ? parseInt(resVal1) : null);
               let rPos2: number | null = isDnf2 ? null : (resVal2 ? parseInt(resVal2) : null);

               // Fallback: use race results from detail API if consistency data missing
               if (rPos1 === null && !isDnf1 && detail?.results) {
                  const rr1 = detail.results.find(r => (r.driverCode || '').toUpperCase() === d1Code);
                  if (rr1) {
                     if (rr1.status === 'Finished' || (rr1.status?.startsWith('+') ?? false)) {
                        rPos1 = rr1.position ?? null;
                     }
                     // else remains null (DNF / classified)
                  }
               }
               if (rPos2 === null && !isDnf2 && detail?.results) {
                  const rr2 = detail.results.find(r => (r.driverCode || '').toUpperCase() === d2Code);
                  if (rr2) {
                     if (rr2.status === 'Finished' || (rr2.status?.startsWith('+') ?? false)) {
                        rPos2 = rr2.position ?? null;
                     }
                  }
               }

               // Qualifying gap estimate from grid delta (ms approximation)
               const gap = (qPos1 !== null && qPos2 !== null)
                  ? (qPos1 < qPos2 ? -((Math.abs(qPos1 - qPos2)) * 80 + 25) : ((Math.abs(qPos1 - qPos2)) * 80 + 25))
                  : 0;
               if (qPos1 !== null && qPos2 !== null) {
                  totalGapMs += gap;
                  gapCount++;
               }

               const pts1 = rPos1 === 1 ? 25 : rPos1 === 2 ? 18 : rPos1 === 3 ? 15 : rPos1 && rPos1 <= 10 ? Math.max(1, 12 - rPos1) : 0;
               const pts2 = rPos2 === 1 ? 25 : rPos2 === 2 ? 18 : rPos2 === 3 ? 15 : rPos2 && rPos2 <= 10 ? Math.max(1, 12 - rPos2) : 0;

               let rWinner: 1 | 2 | null = null;
               if (rPos1 !== null && rPos2 !== null) {
                  rWinner = rPos1 < rPos2 ? 1 : 2;
                  if (rWinner === 1) r1Wins++; else r2Wins++;
               } else if (rPos1 !== null) {
                  rWinner = 1;
                  r1Wins++;
               } else if (rPos2 !== null) {
                  rWinner = 2;
                  r2Wins++;
               }

               duels.push({
                  round: race.round,
                  raceName: race.name,
                  qualiPos1: qPos1,
                  qualiPos2: qPos2,
                  racePos1: rPos1,
                  racePos2: rPos2,
                  points1: pts1,
                  points2: pts2,
                  qualiWinner: qWinner,
                  raceWinner: rWinner,
                  gapMs: gap,
               });
            }

            battles.push({
               constructor: {
                  id: team.id,
                  name: team.name,
                  color: team.color,
                  logoUrl: team.logoUrl,
                  nationality: team.nationality,
               },
               driver1: d1,
               driver2: d2,
               qualiH2H1: q1Wins,
               qualiH2H2: q2Wins,
               avgQualiGapMs: gapCount > 0 ? Math.round(totalGapMs / gapCount) : 0,
               raceH2H1: r1Wins,
               raceH2H2: r2Wins,
               points1: baseP1,
               points2: baseP2,
               pointsShare1: p1Share,
               pointsShare2: p2Share,
               avgFinish1: consistency1 ? parseFloat(consistency1.avgFinishPosition.toFixed(1)) : (d1.championshipPosition || 8),
               avgFinish2: consistency2 ? parseFloat(consistency2.avgFinishPosition.toFixed(1)) : (d2.championshipPosition || 10),
               avgGrid1: gridCount1 > 0 ? parseFloat((totalGrid1 / gridCount1).toFixed(1)) : (d1.championshipPosition || 8),
               avgGrid2: gridCount2 > 0 ? parseFloat((totalGrid2 / gridCount2).toFixed(1)) : (d2.championshipPosition || 10),
               podiums1: d1.podiums || 0,
               podiums2: d2.podiums || 0,
               wins1: d1.wins || 0,
               wins2: d2.wins || 0,
               dnfs1: dnfCount1,
               dnfs2: dnfCount2,
               duels,
            });
         }

         return { season, battles };
      } catch (err) {
         console.error('Failed to load teammate battles', err);
         return { season, battles: [] };
      }
   },
};
