import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface FavoritesContextType {
  favoriteDrivers: number[];
  favoriteTeams: number[];
  toggleFavoriteDriver: (id: number) => void;
  toggleFavoriteTeam: (id: number) => void;
  isDriverFavorite: (id: number) => boolean;
  isTeamFavorite: (id: number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const STORAGE_KEYS = {
  drivers: 'f1-favorite-drivers',
  teams: 'f1-favorite-teams',
};

/**
 * Provides favourite driver/team state persisted in localStorage.
 */
export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favoriteDrivers, setFavoriteDrivers] = useState<number[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.drivers);
    return saved ? JSON.parse(saved) : [];
  });

  const [favoriteTeams, setFavoriteTeams] = useState<number[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.teams);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.drivers, JSON.stringify(favoriteDrivers));
  }, [favoriteDrivers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(favoriteTeams));
  }, [favoriteTeams]);

  const toggleFavoriteDriver = useCallback((id: number) => {
    setFavoriteDrivers((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }, []);

  const toggleFavoriteTeam = useCallback((id: number) => {
    setFavoriteTeams((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }, []);

  const isDriverFavorite = useCallback(
    (id: number) => favoriteDrivers.includes(id),
    [favoriteDrivers]
  );

  const isTeamFavorite = useCallback(
    (id: number) => favoriteTeams.includes(id),
    [favoriteTeams]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favoriteDrivers,
        favoriteTeams,
        toggleFavoriteDriver,
        toggleFavoriteTeam,
        isDriverFavorite,
        isTeamFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider');
  return context;
};
