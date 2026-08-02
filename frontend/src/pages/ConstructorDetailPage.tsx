import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Users, Medal } from 'lucide-react';
import { constructorService } from '../services/constructorService';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import { resolveTheme, getDriverImage } from '../config/teamThemes';
import type { ConstructorDetail } from '../types';

const ConstructorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<ConstructorDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      constructorService.getById(Number(id))
        .then(setTeam)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <PageSkeleton />;
  if (!team) return null;

  const theme = resolveTheme(team.name);

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/constructors" className="inline-flex items-center gap-2 text-f1-silver hover:text-f1-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to Standings</span>
      </Link>

      {/* Team Hero Card */}
      <div className="glass-card overflow-hidden">
        {/* Two-tone gradient hero */}
        <div
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(to right, ${theme.bgFrom} 0%, ${theme.bgFrom} 35%, ${theme.bgTo} 100%)`,
            minHeight: '200px',
          }}
        >
          {/* Dot-grid texture */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle, ${theme.bgTo} 1px, transparent 1px)`,
              backgroundSize: '18px 18px',
            }}
          />
          {/* Right glow */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 85% 50%, ${theme.bgTo}55 0%, transparent 60%)`,
            }}
          />

          <div className="relative flex items-end justify-between h-full px-6 pt-6 pb-0">
            {/* Team info */}
            <div className="pb-6 z-10">
              {/* Team logo */}
              <img
                src={team.logoUrl ?? theme.teamLogoUrl}
                alt={team.name}
                className="h-10 w-auto object-contain mb-3 drop-shadow-lg"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white drop-shadow-lg">
                {team.name}
              </h1>
              <p className="text-white/50 text-sm mt-1">{team.nationality}</p>
            </div>

            {/* Car image */}
            <img
              src={theme.carImageUrl}
              alt={`${team.name} 2026 car`}
              className="h-32 sm:h-44 object-contain object-right-bottom relative z-10 drop-shadow-2xl select-none"
              style={{ maxWidth: '320px' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        </div>

        {/* Meta bar */}
        <div className="px-6 py-3 flex items-center gap-4 border-t border-white/5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primary }} />
          <span className="text-f1-silver text-sm">{team.nationality}</span>
          <span
            className="ml-auto text-xs font-bold uppercase tracking-widest"
            style={{ color: theme.primary }}
          >
            P{team.championshipPosition} · {team.points} PTS
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-5 text-center">
          <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="stat-value text-amber-400">P{team.championshipPosition}</p>
          <p className="stat-label mt-1">Championship</p>
        </div>
        <div className="glass-card p-5 text-center">
          <Medal className="w-6 h-6 text-f1-red mx-auto mb-2" />
          <p className="stat-value text-f1-red-light">{team.points}</p>
          <p className="stat-label mt-1">Points</p>
        </div>
        <div className="glass-card p-5 text-center">
          <Trophy className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="stat-value text-emerald-400">{team.wins}</p>
          <p className="stat-label mt-1">Wins</p>
        </div>
      </div>

      {/* Driver Lineup */}
      <div>
        <h2 className="text-xl font-bold mb-4">Driver Lineup</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {team.drivers.map((driver) => {
            const driverImgUrl = driver.imageUrl ?? getDriverImage(theme, driver.firstName, driver.lastName);
            return (
              <Link key={driver.id} to={`/drivers/${driver.id}`}>
                <div className="glass-card overflow-hidden group cursor-pointer hover:border-white/10">
                  {/* Mini hero gradient */}
                  <div
                    className="relative h-28 overflow-hidden"
                    style={{
                      background: `linear-gradient(to right, ${theme.bgFrom}, ${theme.bgTo})`,
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: `radial-gradient(circle, ${theme.bgTo} 1px, transparent 1px)`,
                        backgroundSize: '14px 14px',
                      }}
                    />
                    {driverImgUrl && (
                      <img
                        src={driverImgUrl}
                        alt={`${driver.firstName} ${driver.lastName}`}
                        className="absolute right-0 bottom-0 h-28 object-contain object-right-bottom drop-shadow-xl select-none"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <div className="absolute left-4 bottom-4">
                      <p className="text-2xl font-display font-black text-white">#{driver.number}</p>
                    </div>
                  </div>

                  <div className="p-4 flex items-center gap-3">
                    <div>
                      <p className="font-bold">{driver.firstName} {driver.lastName}</p>
                      <p className="text-f1-silver text-sm">{driver.nationality}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="font-display font-bold text-xl">{driver.points}</p>
                      <p className="text-xs text-f1-silver">PTS</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ConstructorDetailPage;

