import api from './api';
import type { ApiResponse, DashboardData, Race, RaceDetail } from '../types';

export const dashboardService = {
   getData: async () => {
      const { data } = await api.get<ApiResponse<DashboardData>>('/dashboard');
      return data.data;
   },

   getLastRaceResults: async (season: number = 2026): Promise<RaceDetail | null> => {
      const { data: racesRes } = await api.get<ApiResponse<Race[]>>('/races', {
         params: { season, status: 'COMPLETED' },
      });
      const completed = racesRes.data;
      if (!completed || completed.length === 0) return null;

      // Pick the race with the highest round number
      const lastRace = completed.reduce((prev, cur) => (cur.round > prev.round ? cur : prev));

      const { data: detailRes } = await api.get<ApiResponse<RaceDetail>>(`/races/${lastRace.id}`);
      return detailRes.data;
   },
};