import api from './api';
import type { ApiResponse, RecordsData } from '../types';

export const recordsService = {
   getAll: async (): Promise<RecordsData> => {
      const { data } = await api.get<ApiResponse<RecordsData>>('/records');
      return data.data;
   },
};