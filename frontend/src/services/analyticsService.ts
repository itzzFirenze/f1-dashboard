import api from './api';
import type { ApiResponse, DriverComparisonData, MomentumData, ConsistencyData } from '../types';

export const analyticsService = {
  compareDrivers: async (driverA: number, driverB: number, season: number = 2026): Promise<DriverComparisonData> => {
    const { data } = await api.get<ApiResponse<DriverComparisonData>>('/analytics/compare/drivers', {
      params: { driverA, driverB, season }
    });
    return data.data;
  },

  getMomentum: async (driverId: number, window: number = 5, season: number = 2026): Promise<MomentumData> => {
    const { data } = await api.get<ApiResponse<MomentumData>>('/analytics/momentum', {
      params: { driverId, window, season }
    });
    return data.data;
  },

  getConsistency: async (season: number = 2026): Promise<ConsistencyData> => {
    const { data } = await api.get<ApiResponse<ConsistencyData>>('/analytics/consistency', {
      params: { season }
    });
    return data.data;
  },
};
