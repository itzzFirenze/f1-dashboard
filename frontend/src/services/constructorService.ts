import api from './api';
import type { ApiResponse, Constructor, ConstructorDetail } from '../types';

export const constructorService = {
   getAll: async (season?: number) => {
      const params: Record<string, number> = {};
      if (season) params.season = season;
      const { data } = await api.get<ApiResponse<Constructor[]>>('/constructors', { params });
      return data.data;
   },

   getById: async (id: number) => {
      const { data } = await api.get<ApiResponse<ConstructorDetail>>(`/constructors/${id}`);
      return data.data;
   },
};