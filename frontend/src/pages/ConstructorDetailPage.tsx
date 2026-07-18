import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Users, Medal } from 'lucide-react';
import { constructorService } from '../services/constructorService';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
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

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/constructors" className="inline-flex items-center gap-2 text-f1-silver hover:text-f1-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to Standings</span>
      </Link>

      {/* Team Header */}
      <div className="glass-card overflow-hidden">
        <div className="h-2 w-full" style={{ backgroundColor: team.color }} />
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: team.color }}>
              <Users className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-display font-black">{team.name}</h1>
              <p className="text-f1-silver mt-1">{team.nationality}</p>
            </div>
          </div>
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
          {team.drivers.map((driver) => (
            <Link key={driver.id} to={`/drivers/${driver.id}`}>
              <div className="glass-card p-5 group cursor-pointer hover:border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-lg text-white" style={{ backgroundColor: team.color }}>
                    {driver.number}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{driver.firstName} {driver.lastName}</p>
                    <p className="text-f1-silver text-sm">{driver.nationality}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-xl">{driver.points}</p>
                    <p className="text-xs text-f1-silver">PTS</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConstructorDetailPage;
