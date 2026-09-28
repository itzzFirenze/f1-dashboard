import api from './api';
import type { ApiResponse } from '../types';

export const syncService = {
   triggerSync: async (): Promise<string> => {
      const { data } = await api.post<ApiResponse<string>>('/sync');
      return data.data;
   },
};
