import api from './api';
import type { ApiResponse, Circuit } from '../types';

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
};
