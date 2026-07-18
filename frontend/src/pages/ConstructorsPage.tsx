import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Trophy, ChevronRight, Users } from 'lucide-react';
import { constructorService } from '../services/constructorService';
import { useFavorites } from '../context/FavoritesContext';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import type { Constructor } from '../types';

const ConstructorsPage: React.FC = () => {
  const [constructors, setConstructors] = useState<Constructor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toggleFavoriteTeam, isTeamFavorite } = useFavorites();

  useEffect(() => {
    constructorService.getAll()
      .then(setConstructors)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">Constructor Standings</h1>
        <p className="text-f1-silver mt-1">2026 FIA Formula One World Championship</p>
      </div>

      <div className="grid gap-4">
        {constructors.map((team, i) => (
          <Link key={team.id} to={`/constructors/${team.id}`}>
            <div
              className="glass-card p-5 group cursor-pointer flex items-center gap-4 animate-slide-up"
              style={{ animationDelay: `${i * 50}ms`, borderLeftColor: team.color, borderLeftWidth: '3px' }}
            >
              {/* Position */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                i === 0 ? 'bg-amber-500/20 text-amber-400' :
                i === 1 ? 'bg-gray-400/20 text-gray-300' :
                i === 2 ? 'bg-orange-700/20 text-orange-400' :
                'bg-f1-mid-gray text-f1-silver'
              }`}>
                {team.championshipPosition}
              </div>

              {/* Team Color Badge */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: team.color }}
              >
                <Users className="w-5 h-5 text-white" />
              </div>

              {/* Team Info */}
              <div className="flex-1">
                <h3 className="text-lg font-bold group-hover:text-f1-white transition-colors">{team.name}</h3>
                <p className="text-sm text-f1-silver">{team.nationality}</p>
              </div>

              {/* Points + Wins */}
              <div className="text-right flex items-center gap-6">
                {team.wins > 0 && (
                  <div className="hidden sm:flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-amber-400">{team.wins}</span>
                  </div>
                )}
                <div>
                  <p className="font-display font-bold text-2xl">{team.points}</p>
                  <p className="text-xs text-f1-silver">PTS</p>
                </div>
              </div>

              {/* Favorite + Arrow */}
              <button
                onClick={(e) => { e.preventDefault(); toggleFavoriteTeam(team.id); }}
                className="p-1 rounded-lg hover:bg-f1-mid-gray transition-colors"
              >
                <Star className={`w-4 h-4 ${isTeamFavorite(team.id) ? 'fill-amber-400 text-amber-400' : 'text-f1-silver/30'}`} />
              </button>
              <ChevronRight className="w-5 h-5 text-f1-silver/30 group-hover:text-f1-white transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ConstructorsPage;
