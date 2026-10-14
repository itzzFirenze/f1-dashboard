import api from './api';
import type { ApiResponse, DashboardData, Race, RaceDetail, RecentSessionResult } from '../types';

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
                  };
               }

               // If the sprint has finished for nextRace, but Grand Prix has not yet:
               // This sprint is the most recent completed event in the championship!
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
                  };
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
         };
      }

      return null;
   },
};