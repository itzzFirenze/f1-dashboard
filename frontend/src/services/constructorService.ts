import api from './api';
import type { ApiResponse, Constructor, ConstructorDetail } from '../types';

export const constructorService = {
  getAll: async () => {
    const { data } = await api.get<ApiResponse<Constructor[]>>('/constructors');
    return data.data;
  },

  getById: async (id: number) => {
    const { data } = await api.get<ApiResponse<ConstructorDetail>>(`/constructors/${id}`);
    return data.data;
  },
};
