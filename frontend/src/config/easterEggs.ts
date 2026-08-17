export interface EasterEggTrack {
   trigger: string;
   title: string;
   subtitle: string;
   badge: string;
   audioUrl: string;
   primaryColor: string;
   accentColor: string;
   emoji: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public`;

export const EASTER_EGGS: Record<string, EasterEggTrack> = {
   max: {
      trigger: 'max',
      title: 'Max Verstappen!',
      subtitle: 'Max Verstappen Theme',
      badge: '🦁 TU TU DU DU, MAX VERSTAPPEN!',
      audioUrl: `${SUPABASE_STORAGE_BASE}/Audios/max.mp3`,
      primaryColor: '#FF6F00',
      accentColor: '#3671C6',
      emoji: '🦁',
   },
   water: {
      trigger: 'water',
      title: 'Word of Wisdom',
      subtitle: 'F1 Hydration Radio Special',
      badge: '💧 "Must be the Water!"',
      audioUrl: `${SUPABASE_STORAGE_BASE}/Audios/water.mp3`,
      primaryColor: '#00D2BE',
      accentColor: '#0284C7',
      emoji: '💧',
   },
};
