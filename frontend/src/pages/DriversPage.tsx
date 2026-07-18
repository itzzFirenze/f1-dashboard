import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Trophy, Medal } from 'lucide-react';
import { driverService } from '../services/driverService';
import { useFavorites } from '../context/FavoritesContext';
import SearchInput from '../components/ui/SearchInput';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import type { Driver } from '../types';

const DriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toggleFavoriteDriver, isDriverFavorite } = useFavorites();

  useEffect(() => {
    const timer = setTimeout(() => {
      driverService.getAll(search || undefined)
        .then(setDrivers)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Driver Standings</h1>
          <p className="text-f1-silver mt-1">2026 FIA Formula One World Championship</p>
        </div>
        <div className="w-full sm:w-72">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search drivers..."
          />
        </div>
      </div>

      {drivers.length === 0 ? (
        <EmptyState title="No drivers found" message="Try adjusting your search." />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs text-f1-silver uppercase tracking-wider px-4 py-3 w-12">Pos</th>
                  <th className="text-left text-xs text-f1-silver uppercase tracking-wider px-4 py-3">Driver</th>
                  <th className="text-left text-xs text-f1-silver uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Team</th>
                  <th className="text-left text-xs text-f1-silver uppercase tracking-wider px-4 py-3 hidden md:table-cell">Nationality</th>
                  <th className="text-right text-xs text-f1-silver uppercase tracking-wider px-4 py-3">Points</th>
                  <th className="text-right text-xs text-f1-silver uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Wins</th>
                  <th className="w-12 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver, i) => (
                  <tr
                    key={driver.id}
                    className="border-b border-white/5 hover:bg-f1-mid-gray/30 transition-colors group"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td className="px-4 py-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        driver.championshipPosition === 1
                          ? 'bg-amber-500/20 text-amber-400'
                          : driver.championshipPosition === 2
                          ? 'bg-gray-400/20 text-gray-300'
                          : driver.championshipPosition === 3
                          ? 'bg-orange-700/20 text-orange-400'
                          : 'bg-f1-mid-gray text-f1-silver'
                      }`}>
                        {driver.championshipPosition}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        to={`/drivers/${driver.id}`}
                        className="flex items-center gap-3 group-hover:text-f1-white"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white"
                          style={{ backgroundColor: driver.constructorColor }}
                        >
                          {driver.code}
                        </div>
                        <div>
                          <p className="font-semibold">{driver.firstName} <span className="font-bold">{driver.lastName}</span></p>
                          <p className="text-xs text-f1-silver sm:hidden">{driver.constructorName}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 rounded-full" style={{ backgroundColor: driver.constructorColor }} />
                        <span className="text-f1-silver text-sm">{driver.constructorName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-f1-silver text-sm hidden md:table-cell">
                      {driver.nationality}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-display font-bold text-lg">{driver.points}</span>
                    </td>
                    <td className="px-4 py-4 text-right hidden sm:table-cell">
                      {driver.wins > 0 && (
                        <div className="flex items-center justify-end gap-1">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-semibold text-amber-400">{driver.wins}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={(e) => { e.preventDefault(); toggleFavoriteDriver(driver.id); }}
                        className="p-1 rounded-lg hover:bg-f1-mid-gray transition-colors"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            isDriverFavorite(driver.id) ? 'fill-amber-400 text-amber-400' : 'text-f1-silver/30'
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriversPage;
