import api from './api';
import type { ApiResponse, DriverComparisonData, MomentumData, ConsistencyData, ConstructorComparisonData, TimelineData } from '../types';

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

  compareConstructors: async (teamA: number, teamB: number, season: number = 2026): Promise<ConstructorComparisonData> => {
    const { data } = await api.get<ApiResponse<ConstructorComparisonData>>('/analytics/compare/constructors', {
      params: { teamA, teamB, season }
    });
    return data.data;
  },

  getTimeline: async (season: number = 2026): Promise<TimelineData> => {
    const { data } = await api.get<ApiResponse<TimelineData>>('/analytics/timeline', {
      params: { season }
    });
    return data.data;
  },
};
