import api from './api';
import type { ApiResponse, Driver, DriverDetail, DriverHistoryData } from '../types';

export const driverService = {
   getAll: async (search?: string, season?: number) => {
      const params: Record<string, string | number> = {};
      if (search) params.search = search;
      if (season) params.season = season;
      const { data } = await api.get<ApiResponse<Driver[]>>('/drivers', { params });
      return data.data;
   },

   getById: async (id: number) => {
      const { data } = await api.get<ApiResponse<DriverDetail>>(`/drivers/${id}`);
      return data.data;
   },

   getHistory: async (id: number, season: number = 2026) => {
      const { data } = await api.get<ApiResponse<DriverHistoryData>>(`/drivers/${id}/history`, {
         params: { season }
      });
      return data.data;
   },
};