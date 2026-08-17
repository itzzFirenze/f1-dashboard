import api from './api';
import type { ApiResponse, Circuit } from '../types';

export interface CircuitPositionsPayload {
   circuitId: string;
   cornerPositions: number[] | null;
   sector1StartPercent: number | null;
   sector2StartPercent: number | null;
   sector3StartPercent: number | null;
   activeAeroRanges: [number, number][] | null;
   overtakeDetectionPercent: number | null;
   overtakeActivationPercent: number | null;
   speedTrapPercent: number | null;
   pitLaneEntryPercent: number | null;
   pitLaneExitPercent: number | null;
   pitLaneSpeedLimitKmh?: number | null;
}

export const circuitService = {
   getAll: async (search?: string) => {
      const params = search ? { search } : {};
      const { data } = await api.get<ApiResponse<Circuit[]>>('/circuits', { params });
      return data.data;
   },

   getById: async (id: number) => {
      const { data } = await api.get<ApiResponse<Circuit>>(`/circuits/${id}`);
      return data.data;
   },

   saveCircuitPositions: async (payload: CircuitPositionsPayload) => {
      const { data } = await api.post<ApiResponse<CircuitPositionsPayload>>(
         '/dev/circuits/corner-positions',
         payload
      );
      return data.data;
   },
};