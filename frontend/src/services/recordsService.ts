import api from './api';
import type { ApiResponse, RecordsData } from '../types';

export const recordsService = {
   getAll: async (season?: number): Promise<RecordsData> => {
      const params = season ? { season } : {};
      const { data } = await api.get<ApiResponse<RecordsData>>('/records', { params });
      return data.data;
   },
};