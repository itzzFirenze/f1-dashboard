import api from './api';
import type { ApiResponse, Driver, DriverDetail } from '../types';

export const driverService = {
  getAll: async (search?: string) => {
    const params = search ? { search } : {};
    const { data } = await api.get<ApiResponse<Driver[]>>('/drivers', { params });
    return data.data;
  },

  getById: async (id: number) => {
    const { data } = await api.get<ApiResponse<DriverDetail>>(`/drivers/${id}`);
    return data.data;
  },
};
