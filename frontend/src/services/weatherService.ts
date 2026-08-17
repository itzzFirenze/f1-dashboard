import api from './api';
import type { ApiResponse } from '../types';

export interface SessionWeather {
   sessionName: string;
   temperature: number;
   rainProbability: number;
   windSpeed: number;
   humidity: number;
   condition: string;
   trackTemperature: number;
}

export interface WeekendWeatherDto {
   raceId: number;
   raceName: string;
   country: string;
   raceDate: string;
   sessions: SessionWeather[];
}

export const weatherService = {
   getUpcomingForecasts: async (): Promise<WeekendWeatherDto[]> => {
      const { data } = await api.get<ApiResponse<WeekendWeatherDto[]>>('/weather/forecasts');
      return data.data;
   },
};