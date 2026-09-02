import api from './api';
import type { ApiResponse } from '../types';

export interface CurrentTrackWeather {
   temperature: number;
   humidity: number;
   windSpeed: number;
   rainProbability: number;
   condition: string;
   trackTemperature: number;
   surfacePressure?: number;
   lastUpdated?: string;
}

export interface SessionWeather {
   sessionName: string;
   temperature: number;
   rainProbability: number;
   windSpeed: number;
   humidity: number;
   condition: string;
   trackTemperature: number;
   sessionDate?: string;
}

export interface WeekendWeatherDto {
   raceId: number;
   raceName: string;
   country: string;
   raceDate: string;
   circuitName?: string;
   locality?: string;
   latitude?: number;
   longitude?: number;
   isRealData?: boolean;
   source?: string;
   currentWeather?: CurrentTrackWeather;
   sessions: SessionWeather[];
}

export const weatherService = {
   getUpcomingForecasts: async (season?: number): Promise<WeekendWeatherDto[]> => {
      const { data } = await api.get<ApiResponse<WeekendWeatherDto[]>>('/weather/forecasts', {
         params: season ? { season } : undefined,
      });
      return data.data;
   },
};