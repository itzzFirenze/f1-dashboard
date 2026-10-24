import api from './api';
import { practiceService, hasValidPracticeResults } from './practiceService';
import type { ApiResponse, DashboardData, Race, RaceDetail, RaceResult, RecentSessionResult } from '../types';

export const dashboardService = {
   getData: async () => {
      const { data } = await api.get<ApiResponse<DashboardData>>('/dashboard');
      return data.data;
   },

   /**
    * Returns the most recent session results (Race or Sprint) for the dashboard.
    * If a Grand Prix race has finished, its results are shown.
    * If a sprint has completed more recently (e.g., Saturday of a sprint weekend before Sunday's race),
    * sprint results are shown.
    */
   getLastRaceResults: async (season: number = 2026): Promise<RecentSessionResult | null> => {
      const { data: racesRes } = await api.get<ApiResponse<Race[]>>('/races', {
         params: { season },
      });
      const allRaces = racesRes.data;
      if (!allRaces || allRaces.length === 0) return null;

      // Sort races chronologically by round
      const sortedRaces = [...allRaces].sort((a, b) => a.round - b.round);

      // Identify last completed race
      const completedRaces = sortedRaces.filter((r) => r.status === 'COMPLETED');
      const lastCompletedRace = completedRaces.length > 0 ? completedRaces[completedRaces.length - 1] : null;

      // Identify the immediate next or in-progress race (candidate for a recent sprint or race)
      const nextRaces = sortedRaces.filter((r) => !lastCompletedRace || r.round > lastCompletedRace.round);
      const nextRace = nextRaces.length > 0 ? nextRaces[0] : null;

      // Check nextRace first (it is in a higher round than lastCompletedRace)
const extractSessionDates = (detail: RaceDetail) => {
   const sprintSession = detail.sessions?.find(
      (s) => s.sessionType?.toUpperCase() === 'SPRINT'
   );
   const raceSession = detail.sessions?.find(
      (s) => s.sessionType?.toUpperCase() === 'RACE'
   );

   const raceDate = raceSession?.sessionDate || detail.raceDate;
   const raceTime = raceSession?.sessionTime || detail.raceTime;

   let sprintDate = sprintSession?.sessionDate;
   const sprintTime = sprintSession?.sessionTime;

   // If sprintDate is not explicitly present in sessions, but sprint results exist
   // and raceDate is known, derive sprint date as 1 day prior to the main race
   if (!sprintDate && (detail.sprintResults?.length || detail.sprintWeekend) && raceDate) {
      try {
         const [y, m, d] = raceDate.split('-').map(Number);
         if (y && m && d) {
            const date = new Date(Date.UTC(y, m - 1, d));
            date.setUTCDate(date.getUTCDate() - 1);
            sprintDate = date.toISOString().split('T')[0];
         }
      } catch {
         // ignore
      }
   }

   return { sprintDate, sprintTime, raceDate, raceTime };
};

      if (nextRace) {
         try {
            const { data: nextRes } = await api.get<ApiResponse<RaceDetail>>(`/races/${nextRace.id}`);
            const nextDetail = nextRes.data;
            if (nextDetail) {
               const hasRaceResults = nextDetail.results && nextDetail.results.length > 0;
               const hasSprintResults = nextDetail.sprintResults && nextDetail.sprintResults.length > 0;
               const { sprintDate, sprintTime, raceDate, raceTime } = extractSessionDates(nextDetail);

               const hasQualifyingResults = nextDetail.qualifyingResults && nextDetail.qualifyingResults.length > 0;
               const hasSprintQualiResults = nextDetail.sprintQualifyingResults && nextDetail.sprintQualifyingResults.length > 0;

               // If the Grand Prix race has finished for nextRace:
               if (hasRaceResults) {
                  return {
                     id: nextDetail.id,
                     raceId: nextDetail.id,
                     round: nextDetail.round,
                     season: nextDetail.season,
                     name: nextDetail.name,
                     circuitName: nextDetail.circuit?.name,
                     country: nextDetail.circuit?.country,
                     sessionType: 'RACE',
                     sessionDate: raceDate,
                     sessionTime: raceTime,
                     sprintDate,
                     sprintTime,
                     raceDate,
                     raceTime,
                     results: nextDetail.results,
                     sprintResults: nextDetail.sprintResults || [],
                     raceResults: nextDetail.results,
                     qualifyingResults: nextDetail.qualifyingResults || [],
                     sprintQualifyingResults: nextDetail.sprintQualifyingResults || [],
                  };
               }

               // If Qualifying has finished (e.g. Saturday afternoon), but Grand Prix has not yet:
               if (hasQualifyingResults) {
                  return {
                     id: nextDetail.id,
                     raceId: nextDetail.id,
                     round: nextDetail.round,
                     season: nextDetail.season,
                     name: nextDetail.name,
                     circuitName: nextDetail.circuit?.name,
                     country: nextDetail.circuit?.country,
                     sessionType: 'QUALIFYING',
                     sessionDate: raceDate,
                     sessionTime: raceTime,
                     sprintDate,
                     sprintTime,
                     raceDate,
                     raceTime,
                     results: nextDetail.qualifyingResults!,
                     sprintResults: nextDetail.sprintResults || [],
                     raceResults: nextDetail.results || [],
                     qualifyingResults: nextDetail.qualifyingResults,
                     sprintQualifyingResults: nextDetail.sprintQualifyingResults || [],
                  };
               }

               // If the sprint has finished for nextRace, but Grand Prix / Quali has not yet:
               if (hasSprintResults) {
                  return {
                     id: nextDetail.id,
                     raceId: nextDetail.id,
                     round: nextDetail.round,
                     season: nextDetail.season,
                     name: nextDetail.name,
                     circuitName: nextDetail.circuit?.name,
                     country: nextDetail.circuit?.country,
                     sessionType: 'SPRINT',
                     sessionDate: sprintDate || raceDate,
                     sessionTime: sprintTime || raceTime,
                     sprintDate,
                     sprintTime,
                     raceDate,
                     raceTime,
                     results: nextDetail.sprintResults,
                     sprintResults: nextDetail.sprintResults,
                     raceResults: nextDetail.results || [],
                     qualifyingResults: nextDetail.qualifyingResults || [],
                     sprintQualifyingResults: nextDetail.sprintQualifyingResults || [],
                  };
               }

               // If Sprint Qualifying has finished:
               if (hasSprintQualiResults) {
                  return {
                     id: nextDetail.id,
                     raceId: nextDetail.id,
                     round: nextDetail.round,
                     season: nextDetail.season,
                     name: nextDetail.name,
                     circuitName: nextDetail.circuit?.name,
                     country: nextDetail.circuit?.country,
                     sessionType: 'SPRINT_QUALIFYING',
                     sessionDate: sprintDate || raceDate,
                     sessionTime: sprintTime || raceTime,
                     sprintDate,
                     sprintTime,
                     raceDate,
                     raceTime,
                     results: nextDetail.sprintQualifyingResults!,
                     sprintResults: nextDetail.sprintResults || [],
                     raceResults: nextDetail.results || [],
                     qualifyingResults: nextDetail.qualifyingResults || [],
                     sprintQualifyingResults: nextDetail.sprintQualifyingResults,
                  };
               }

               // If nextRace has practice results (e.g., race weekend in progress: Friday / Saturday practice)
               const nextFp3 = hasValidPracticeResults(nextDetail.fp3Results)
                  ? nextDetail.fp3Results
                  : practiceService.getCachedPracticeResults(nextDetail.id, 'fp3');
               const nextFp2 = hasValidPracticeResults(nextDetail.fp2Results)
                  ? nextDetail.fp2Results
                  : practiceService.getCachedPracticeResults(nextDetail.id, 'fp2');
               const nextFp1 = hasValidPracticeResults(nextDetail.fp1Results)
                  ? nextDetail.fp1Results
                  : practiceService.getCachedPracticeResults(nextDetail.id, 'fp1');

               const validNextFp3 = hasValidPracticeResults(nextFp3) ? nextFp3 : null;
               const validNextFp2 = hasValidPracticeResults(nextFp2) ? nextFp2 : null;
               const validNextFp1 = hasValidPracticeResults(nextFp1) ? nextFp1 : null;

               const nextPracticeOptions: Array<{ type: 'FP1' | 'FP2' | 'FP3'; results: RaceResult[] | null | undefined }> = [
                  { type: 'FP3', results: validNextFp3 },
                  { type: 'FP2', results: validNextFp2 },
                  { type: 'FP1', results: validNextFp1 },
               ];
               for (const { type, results: fpRes } of nextPracticeOptions) {
                  if (fpRes && fpRes.length > 0) {
                     return {
                        id: nextDetail.id,
                        raceId: nextDetail.id,
                        round: nextDetail.round,
                        season: nextDetail.season,
                        name: nextDetail.name,
                        circuitName: nextDetail.circuit?.name,
                        country: nextDetail.circuit?.country,
                        sessionType: type,
                        sessionDate: raceDate,
                        sessionTime: raceTime,
                        raceDate,
                        raceTime,
                        results: fpRes,
                        sprintResults: nextDetail.sprintResults || [],
                        raceResults: nextDetail.results || [],
                        qualifyingResults: nextDetail.qualifyingResults || [],
                        sprintQualifyingResults: nextDetail.sprintQualifyingResults || [],
                        fp1Results: validNextFp1 || undefined,
                        fp2Results: validNextFp2 || undefined,
                        fp3Results: validNextFp3 || undefined,
                     };
                  }
               }
            }
         } catch (e) {
            console.error('Failed to fetch next race detail for latest results:', e);
         }
      }

      // If nextRace had no results, fall back to last completed race
      if (!lastCompletedRace) return null;

      const { data: detailRes } = await api.get<ApiResponse<RaceDetail>>(`/races/${lastCompletedRace.id}`);
      const lastCompletedDetail = detailRes.data;
      if (!lastCompletedDetail) return null;

      const hasRaceResults = lastCompletedDetail.results && lastCompletedDetail.results.length > 0;
      const hasSprintResults = lastCompletedDetail.sprintResults && lastCompletedDetail.sprintResults.length > 0;
      const { sprintDate, sprintTime, raceDate, raceTime } = extractSessionDates(lastCompletedDetail);

      const hasQualifyingResults = lastCompletedDetail.qualifyingResults && lastCompletedDetail.qualifyingResults.length > 0;
      const hasSprintQualiResults = lastCompletedDetail.sprintQualifyingResults && lastCompletedDetail.sprintQualifyingResults.length > 0;

      // In a completed race weekend, Race (Sunday) is newer than Sprint (Saturday)
      if (hasRaceResults) {
         return {
            id: lastCompletedDetail.id,
            raceId: lastCompletedDetail.id,
            round: lastCompletedDetail.round,
            season: lastCompletedDetail.season,
            name: lastCompletedDetail.name,
            circuitName: lastCompletedDetail.circuit?.name,
            country: lastCompletedDetail.circuit?.country,
            sessionType: 'RACE',
            sessionDate: raceDate,
            sessionTime: raceTime,
            sprintDate,
            sprintTime,
            raceDate,
            raceTime,
            results: lastCompletedDetail.results,
            sprintResults: lastCompletedDetail.sprintResults || [],
            raceResults: lastCompletedDetail.results,
            qualifyingResults: lastCompletedDetail.qualifyingResults || [],
            sprintQualifyingResults: lastCompletedDetail.sprintQualifyingResults || [],
         };
      } else if (hasQualifyingResults) {
         return {
            id: lastCompletedDetail.id,
            raceId: lastCompletedDetail.id,
            round: lastCompletedDetail.round,
            season: lastCompletedDetail.season,
            name: lastCompletedDetail.name,
            circuitName: lastCompletedDetail.circuit?.name,
            country: lastCompletedDetail.circuit?.country,
            sessionType: 'QUALIFYING',
            sessionDate: raceDate,
            sessionTime: raceTime,
            sprintDate,
            sprintTime,
            raceDate,
            raceTime,
            results: lastCompletedDetail.qualifyingResults!,
            sprintResults: lastCompletedDetail.sprintResults || [],
            raceResults: lastCompletedDetail.results || [],
            qualifyingResults: lastCompletedDetail.qualifyingResults,
            sprintQualifyingResults: lastCompletedDetail.sprintQualifyingResults || [],
         };
      } else if (hasSprintResults) {
         return {
            id: lastCompletedDetail.id,
            raceId: lastCompletedDetail.id,
            round: lastCompletedDetail.round,
            season: lastCompletedDetail.season,
            name: lastCompletedDetail.name,
            circuitName: lastCompletedDetail.circuit?.name,
            country: lastCompletedDetail.circuit?.country,
            sessionType: 'SPRINT',
            sessionDate: sprintDate || raceDate,
            sessionTime: sprintTime || raceTime,
            sprintDate,
            sprintTime,
            raceDate,
            raceTime,
            results: lastCompletedDetail.sprintResults,
            sprintResults: lastCompletedDetail.sprintResults,
            raceResults: [],
            qualifyingResults: lastCompletedDetail.qualifyingResults || [],
            sprintQualifyingResults: lastCompletedDetail.sprintQualifyingResults || [],
         };
      } else if (hasSprintQualiResults) {
         return {
            id: lastCompletedDetail.id,
            raceId: lastCompletedDetail.id,
            round: lastCompletedDetail.round,
            season: lastCompletedDetail.season,
            name: lastCompletedDetail.name,
            circuitName: lastCompletedDetail.circuit?.name,
            country: lastCompletedDetail.circuit?.country,
            sessionType: 'SPRINT_QUALIFYING',
            sessionDate: sprintDate || raceDate,
            sessionTime: sprintTime || raceTime,
            sprintDate,
            sprintTime,
            raceDate,
            raceTime,
            results: lastCompletedDetail.sprintQualifyingResults!,
            sprintResults: lastCompletedDetail.sprintResults || [],
            raceResults: [],
            qualifyingResults: lastCompletedDetail.qualifyingResults || [],
            sprintQualifyingResults: lastCompletedDetail.sprintQualifyingResults,
         };
      }

      // Fallback to the most recent practice session with results
      const compFp3 = hasValidPracticeResults(lastCompletedDetail.fp3Results)
         ? lastCompletedDetail.fp3Results
         : practiceService.getCachedPracticeResults(lastCompletedDetail.id, 'fp3');
      const compFp2 = hasValidPracticeResults(lastCompletedDetail.fp2Results)
         ? lastCompletedDetail.fp2Results
         : practiceService.getCachedPracticeResults(lastCompletedDetail.id, 'fp2');
      const compFp1 = hasValidPracticeResults(lastCompletedDetail.fp1Results)
         ? lastCompletedDetail.fp1Results
         : practiceService.getCachedPracticeResults(lastCompletedDetail.id, 'fp1');

      const validCompFp3 = hasValidPracticeResults(compFp3) ? compFp3 : null;
      const validCompFp2 = hasValidPracticeResults(compFp2) ? compFp2 : null;
      const validCompFp1 = hasValidPracticeResults(compFp1) ? compFp1 : null;

      const practiceOptions: Array<{ type: 'FP1' | 'FP2' | 'FP3'; results: RaceResult[] | null | undefined }> = [
         { type: 'FP3', results: validCompFp3 },
         { type: 'FP2', results: validCompFp2 },
         { type: 'FP1', results: validCompFp1 },
      ];
      for (const { type, results: fpResults } of practiceOptions) {
         if (fpResults && fpResults.length > 0) {
            return {
               id: lastCompletedDetail.id,
               raceId: lastCompletedDetail.id,
               round: lastCompletedDetail.round,
               season: lastCompletedDetail.season,
               name: lastCompletedDetail.name,
               circuitName: lastCompletedDetail.circuit?.name,
               country: lastCompletedDetail.circuit?.country,
               sessionType: type,
               sessionDate: raceDate,
               sessionTime: raceTime,
               raceDate,
               raceTime,
               results: fpResults,
               sprintResults: lastCompletedDetail.sprintResults || [],
               raceResults: lastCompletedDetail.results || [],
               qualifyingResults: lastCompletedDetail.qualifyingResults || [],
               sprintQualifyingResults: lastCompletedDetail.sprintQualifyingResults || [],
               fp1Results: validCompFp1 || undefined,
               fp2Results: validCompFp2 || undefined,
               fp3Results: validCompFp3 || undefined,
            };
         }
      }

      return null;
   },
};