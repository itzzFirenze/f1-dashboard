import React, { useEffect, useState, useMemo } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, ThermometerSun, AlertTriangle, CloudLightning, CalendarDays } from 'lucide-react';
import { ResponsiveLine } from '@nivo/line';
import { weatherService, WeekendWeatherDto } from '../services/weatherService';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { Link } from 'react-router-dom';

const WeatherForecastPage: React.FC = () => {
  const [forecasts, setForecasts] = useState<WeekendWeatherDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    weatherService.getUpcomingForecasts()
      .then(setForecasts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  if (forecasts.length === 0) {
    return <EmptyState title="No upcoming races" message="Weather forecasts are only available for upcoming race weekends." />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <CloudRain className="w-8 h-8 text-blue-400" />
          Weekend Weather Forecasts
        </h1>
        <p className="text-f1-silver mt-1">Detailed session-by-session weather projections for upcoming races</p>
      </div>

      <div className="space-y-12">
        {forecasts.map(forecast => (
          <WeekendForecast key={forecast.raceId} forecast={forecast} />
        ))}
      </div>
    </div>
  );
};

const WeekendForecast: React.FC<{ forecast: WeekendWeatherDto }> = ({ forecast }) => {
  const rainData = useMemo(() => [
    {
      id: 'Rain Probability',
      data: forecast.sessions.map(s => ({
        x: s.sessionName,
        y: s.rainProbability
      }))
    }
  ], [forecast]);

  const tempData = useMemo(() => [
    {
      id: 'Track Temp',
      data: forecast.sessions.map(s => ({
        x: s.sessionName,
        y: s.trackTemperature
      }))
    },
    {
      id: 'Air Temp',
      data: forecast.sessions.map(s => ({
        x: s.sessionName,
        y: s.temperature
      }))
    }
  ], [forecast]);

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-f1-red/20 to-transparent p-6 border-b border-f1-red/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link to={`/races/${forecast.raceId}`} className="hover:text-f1-red transition-colors">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              {forecast.raceName}
            </h2>
          </Link>
          <div className="flex items-center gap-4 mt-2 text-sm text-f1-silver">
            <span className="flex items-center gap-1">
              <CalendarDays className="w-4 h-4" />
              {new Date(forecast.raceDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span>{forecast.country}</span>
          </div>
        </div>
        
        {/* Highest Rain Warning */}
        {forecast.sessions.some(s => s.rainProbability > 60) && (
          <div className="bg-blue-500/20 border border-blue-500/30 text-blue-300 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            High Risk of Rain
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Sessions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {forecast.sessions.map(session => (
            <div key={session.sessionName} className="bg-f1-mid-gray/30 rounded-xl p-4 flex flex-col items-center text-center">
              <div className="text-xs font-semibold text-f1-silver uppercase tracking-wider mb-3">
                {session.sessionName}
              </div>
              <WeatherIcon condition={session.condition} />
              <div className="font-bold mt-2">{session.temperature}°C</div>
              <div className="text-xs text-f1-silver mb-3">{session.condition}</div>
              
              <div className="w-full space-y-2 pt-3 border-t border-f1-mid-gray/50 text-xs">
                <div className="flex justify-between items-center text-blue-400">
                  <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> Rain</span>
                  <span>{session.rainProbability}%</span>
                </div>
                <div className="flex justify-between items-center text-emerald-400">
                  <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> Wind</span>
                  <span>{session.windSpeed} km/h</span>
                </div>
                <div className="flex justify-between items-center text-f1-silver">
                  <span className="flex items-center gap-1"><ThermometerSun className="w-3 h-3" /> Track</span>
                  <span>{session.trackTemperature}°C</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Temperature Chart */}
          <div>
            <h3 className="text-sm font-semibold text-f1-silver uppercase tracking-wider mb-4 text-center">
              Temperature Evolution
            </h3>
            <div style={{ height: 200 }}>
              <ResponsiveLine
                data={tempData}
                margin={{ top: 10, right: 20, bottom: 40, left: 40 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
                axisTop={null}
                axisRight={null}
                axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
                axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
                colors={['#f59e0b', '#e11d48']}
                pointSize={8}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
                enableArea={true}
                areaOpacity={0.1}
                curve="monotoneX"
                theme={{
                  text: { fill: '#9ca3af' },
                  grid: { line: { stroke: '#333' } },
                  tooltip: { container: { background: '#1a1a2e', color: '#fff', border: '1px solid #333' } },
                }}
                legends={[
                  {
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 40,
                    itemWidth: 100,
                    itemHeight: 20,
                    itemTextColor: '#9ca3af',
                    symbolSize: 12,
                    symbolShape: 'circle',
                  }
                ]}
              />
            </div>
          </div>

          {/* Rain Probability Chart */}
          <div>
            <h3 className="text-sm font-semibold text-f1-silver uppercase tracking-wider mb-4 text-center">
              Rain Probability
            </h3>
            <div style={{ height: 200 }}>
              <ResponsiveLine
                data={rainData}
                margin={{ top: 10, right: 20, bottom: 40, left: 40 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 0, max: 100, stacked: false, reverse: false }}
                axisTop={null}
                axisRight={null}
                axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
                axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0, legend: '%', legendOffset: -30, legendPosition: 'middle' }}
                colors={['#3b82f6']}
                pointSize={8}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                enableArea={true}
                areaOpacity={0.3}
                curve="monotoneX"
                theme={{
                  text: { fill: '#9ca3af' },
                  grid: { line: { stroke: '#333' } },
                  tooltip: { container: { background: '#1a1a2e', color: '#fff', border: '1px solid #333' } },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WeatherIcon: React.FC<{ condition: string }> = ({ condition }) => {
  const cond = condition.toLowerCase();
  
  if (cond.includes('thunder') || cond.includes('storm')) {
    return <CloudLightning className="w-10 h-10 text-yellow-500 animate-pulse" />;
  }
  if (cond.includes('rain') || cond.includes('shower') || cond.includes('drizzle')) {
    return <CloudRain className="w-10 h-10 text-blue-400" />;
  }
  if (cond.includes('cloud') || cond.includes('overcast')) {
    if (cond.includes('partly')) {
      return (
        <div className="relative w-10 h-10">
          <Sun className="w-8 h-8 text-yellow-400 absolute top-0 right-0" />
          <Cloud className="w-8 h-8 text-gray-300 absolute bottom-0 left-0" fill="currentColor" />
        </div>
      );
    }
    return <Cloud className="w-10 h-10 text-gray-400" fill="currentColor" />;
  }
  
  return <Sun className="w-10 h-10 text-yellow-400" />;
};

export default WeatherForecastPage;
