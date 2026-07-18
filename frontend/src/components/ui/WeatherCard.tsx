import React from 'react';
import { Cloud, Droplets, Wind, Thermometer, Sun, CloudRain } from 'lucide-react';
import type { Weather } from '../../types';

interface WeatherCardProps {
  weather: Weather;
  compact?: boolean;
}

/** Displays weather conditions for a race weekend. */
const WeatherCard: React.FC<WeatherCardProps> = ({ weather, compact = false }) => {
  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes('rain') || lower.includes('storm')) return <CloudRain className="w-8 h-8 text-blue-400" />;
    if (lower.includes('cloud')) return <Cloud className="w-8 h-8 text-gray-400" />;
    return <Sun className="w-8 h-8 text-yellow-400" />;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {getWeatherIcon(weather.condition)}
        <div>
          <span className="font-bold text-lg">{weather.temperature}°C</span>
          <span className="text-f1-silver text-sm ml-2">{weather.condition}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-f1-silver uppercase tracking-wider">Weather</h3>
        {getWeatherIcon(weather.condition)}
      </div>
      <p className="text-2xl font-bold font-display mb-1">{weather.temperature}°C</p>
      <p className="text-f1-silver text-sm mb-4">{weather.condition}</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 bg-f1-mid-gray/50 rounded-xl p-2.5">
          <Droplets className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-f1-silver">Rain</span>
          <span className="text-sm font-semibold">{weather.rainProbability}%</span>
        </div>
        <div className="flex flex-col items-center gap-1 bg-f1-mid-gray/50 rounded-xl p-2.5">
          <Wind className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-f1-silver">Wind</span>
          <span className="text-sm font-semibold">{weather.windSpeed} km/h</span>
        </div>
        <div className="flex flex-col items-center gap-1 bg-f1-mid-gray/50 rounded-xl p-2.5">
          <Thermometer className="w-4 h-4 text-orange-400" />
          <span className="text-xs text-f1-silver">Humidity</span>
          <span className="text-sm font-semibold">{weather.humidity}%</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
