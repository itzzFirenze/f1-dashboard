import api from './api';
import type { ApiResponse, Race, RaceDetail } from '../types';

export const raceService = {
  getAll: async (season: number = 2026, status?: string, search?: string) => {
    const params: Record<string, string | number> = { season };
    if (status) params.status = status;
    if (search) params.search = search;
    const { data } = await api.get<ApiResponse<Race[]>>('/races', { params });
    return data.data;
  },

  getById: async (id: number) => {
    const { data } = await api.get<ApiResponse<RaceDetail>>(`/races/${id}`);
    return data.data;
  },
};
