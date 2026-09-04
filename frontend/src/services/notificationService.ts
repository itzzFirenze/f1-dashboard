import api from './api';
import type { ApiResponse, SubscriptionRequest, SubscriptionResponse } from '../types';

export const notificationService = {
   subscribe: async (payload: SubscriptionRequest): Promise<SubscriptionResponse> => {
      const { data } = await api.post<ApiResponse<SubscriptionResponse>>(
         '/notifications/subscribe',
         payload
      );
      return data.data;
   },

   getStatus: async (email: string, raceId: number): Promise<SubscriptionResponse> => {
      const { data } = await api.get<ApiResponse<SubscriptionResponse>>(
         '/notifications/status',
         { params: { email, raceId } }
      );
      return data.data;
   },

   unsubscribe: async (token: string, all: boolean = false): Promise<void> => {
      await api.delete(`/notifications/unsubscribe/${token}`, {
         params: { all },
      });
   },

   unsubscribeAll: async (email: string): Promise<void> => {
      await api.delete('/notifications/unsubscribe-all', {
         params: { email },
      });
   },
};
