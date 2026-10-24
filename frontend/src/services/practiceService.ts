import api from './api';
import { raceService } from './raceService';
import type { RaceDetail, RaceResult } from '../types';

interface OpenF1SessionItem {
   session_key: number;
   session_name: string;
   session_type: string;
   date_start: string;
   date_end: string;
   meeting_key: number;
   circuit_key: number;
   circuit_short_name: string;
   country_name: string;
   location: string;
   year: number;
}

interface OpenF1DriverItem {
   driver_number: number;
   broadcast_name: string;
   full_name: string;
   name_acronym: string;
   team_name: string;
   team_colour: string;
   first_name: string;
   last_name: string;
   headshot_url: string | null;
}

interface OpenF1LapItem {
   driver_number: number;
   lap_number: number;
   lap_duration: number | null;
   duration_sector_1: number | null;
   duration_sector_2: number | null;
   duration_sector_3: number | null;
}

const practiceCache = new Map<string, RaceResult[]>();

function getStorageKey(raceId: number, sessionType: string): string {
   return `f1_practice_v2_${raceId}_${sessionType}`;
}

function formatLapTime(seconds: number): string {
   if (!Number.isFinite(seconds) || seconds <= 0) return '—';
   const minutes = Math.floor(seconds / 60);
   const remSeconds = (seconds % 60).toFixed(3);
   const paddedSeconds = Number(remSeconds) < 10 ? `0${remSeconds}` : remSeconds;
   return `${minutes}:${paddedSeconds}`;
}

export function hasValidPracticeResults(results: RaceResult[] | null | undefined): boolean {
   if (!results || results.length === 0) return false;
   return results.some((r) => {
      const hasTime = !!(r.lapTime || r.q1 || (r.status && r.status !== 'NO TIME' && r.status !== 'DNS' && r.status !== 'DNQ'));
      const hasLaps = typeof r.lapsCompleted === 'number' ? r.lapsCompleted > 0 : true;
      return hasTime && hasLaps;
   });
}

export const practiceService = {
   getCachedPracticeResults: (
      raceId: number,
      sessionType: 'fp1' | 'fp2' | 'fp3'
   ): RaceResult[] | null => {
      const cacheKey = `${raceId}-${sessionType}`;
      if (practiceCache.has(cacheKey)) {
         const cached = practiceCache.get(cacheKey)!;
         if (hasValidPracticeResults(cached)) {
            return cached;
         }
         practiceCache.delete(cacheKey);
      }
      try {
         const storageKey = getStorageKey(raceId, sessionType);
         const raw = localStorage.getItem(storageKey);
         if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && hasValidPracticeResults(parsed)) {
               const sanitized = parsed.map((r) => ({
                  ...r,
                  q3: r.q3 && r.q3.toUpperCase().includes('LAP') ? null : r.q3,
               }));
               practiceCache.set(cacheKey, sanitized);
               return sanitized;
            } else {
               localStorage.removeItem(storageKey);
            }
         }
      } catch {}
      return null;
   },

   getPracticeResults: async (
      race: RaceDetail,
      sessionType: 'fp1' | 'fp2' | 'fp3'
   ): Promise<RaceResult[]> => {
      const cacheKey = `${race.id}-${sessionType}`;
      if (practiceCache.has(cacheKey)) {
         const cached = practiceCache.get(cacheKey)!;
         if (hasValidPracticeResults(cached)) {
            return cached;
         }
         practiceCache.delete(cacheKey);
      }

      // Check if already embedded on race object
      if (sessionType === 'fp1' && hasValidPracticeResults(race.fp1Results)) {
         practiceCache.set(cacheKey, race.fp1Results!);
         try { localStorage.setItem(getStorageKey(race.id, sessionType), JSON.stringify(race.fp1Results)); } catch {}
         return race.fp1Results!;
      }
      if (sessionType === 'fp2' && hasValidPracticeResults(race.fp2Results)) {
         practiceCache.set(cacheKey, race.fp2Results!);
         try { localStorage.setItem(getStorageKey(race.id, sessionType), JSON.stringify(race.fp2Results)); } catch {}
         return race.fp2Results!;
      }
      if (sessionType === 'fp3' && hasValidPracticeResults(race.fp3Results)) {
         practiceCache.set(cacheKey, race.fp3Results!);
         try { localStorage.setItem(getStorageKey(race.id, sessionType), JSON.stringify(race.fp3Results)); } catch {}
         return race.fp3Results!;
      }

      // Check localStorage for instant zero-wait retrieval
      try {
         const storageKey = getStorageKey(race.id, sessionType);
         const raw = localStorage.getItem(storageKey);
         if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && hasValidPracticeResults(parsed)) {
               practiceCache.set(cacheKey, parsed);
               return parsed;
            } else {
               localStorage.removeItem(storageKey);
            }
         }
      } catch {}

      // Try backend endpoint first
      try {
         const backendResults = await raceService.getPracticeResults(race.id, sessionType);
         if (hasValidPracticeResults(backendResults)) {
            practiceCache.set(cacheKey, backendResults);
            try { localStorage.setItem(getStorageKey(race.id, sessionType), JSON.stringify(backendResults)); } catch {}
            return backendResults;
         }
      } catch {
         // Fallback to client-side OpenF1 aggregator
      }

      // Fallback: direct OpenF1 via telemetry proxy
      try {
         const sessionName =
            sessionType === 'fp1'
               ? 'Practice 1'
               : sessionType === 'fp2'
               ? 'Practice 2'
               : 'Practice 3';

         const { data: sessions } = await api.get<OpenF1SessionItem[]>('/telemetry/sessions', {
            params: {
               year: race.season,
               session_name: sessionName,
            },
         });

         if (!sessions || sessions.length === 0) {
            return [];
         }

         const raceLoc = (race.circuit.location || '').toLowerCase();
         const raceCountry = (race.circuit.country || '').toLowerCase();
         const raceDate = race.raceDate ? new Date(race.raceDate).getTime() : null;

         const matchedSession = sessions.find((s) => {
            const sLoc = (s.location || '').toLowerCase();
            const sCountry = (s.country_name || '').toLowerCase();
            const sCircuit = (s.circuit_short_name || '').toLowerCase();

            const locMatch = raceLoc && (sLoc.includes(raceLoc) || raceLoc.includes(sLoc) || sCircuit.includes(raceLoc));
            const countryMatch = raceCountry && (sCountry.includes(raceCountry) || raceCountry.includes(sCountry));

            let dateMatch = true;
            if (raceDate && s.date_start) {
               const sDate = new Date(s.date_start).getTime();
               const diffDays = Math.abs(raceDate - sDate) / (1000 * 60 * 60 * 24);
               dateMatch = diffDays <= 5;
            }

            return (locMatch || countryMatch) && dateMatch;
         });

         if (!matchedSession) {
            return [];
         }

         const sessionKey = matchedSession.session_key;

         // Fetch drivers and laps in parallel
         const [driversRes, lapsRes] = await Promise.all([
            api.get<OpenF1DriverItem[]>('/telemetry/drivers', { params: { session_key: sessionKey } }),
            api.get<OpenF1LapItem[]>('/telemetry/laps', { params: { session_key: sessionKey } }),
         ]);

         const drivers = driversRes.data || [];
         const laps = lapsRes.data || [];

         if (drivers.length === 0) return [];

         // Group laps by driver
         interface DriverLapInfo {
            bestDuration: number | null;
            bestLap: OpenF1LapItem | null;
            totalLaps: number;
         }

         const driverStats = new Map<number, DriverLapInfo>();

         for (const lap of laps) {
            const num = lap.driver_number;
            const current = driverStats.get(num) || {
               bestDuration: null,
               bestLap: null,
               totalLaps: 0,
            };

            current.totalLaps += 1;

            if (lap.lap_duration && lap.lap_duration > 0) {
               if (current.bestDuration === null || lap.lap_duration < current.bestDuration) {
                  current.bestDuration = lap.lap_duration;
                  current.bestLap = lap;
               }
            }

            driverStats.set(num, current);
         }

         // Build and sort driver classifications
         const classifiedDrivers = drivers.map((d) => {
            const stats = driverStats.get(d.driver_number) || {
               bestDuration: null,
               bestLap: null,
               totalLaps: 0,
            };
            return {
               driver: d,
               stats,
            };
         });

         classifiedDrivers.sort((a, b) => {
            const aDur = a.stats.bestDuration;
            const bDur = b.stats.bestDuration;
            if (aDur !== null && bDur !== null) return aDur - bDur;
            if (aDur !== null) return -1;
            if (bDur !== null) return 1;
            return a.driver.last_name.localeCompare(b.driver.last_name);
         });

         const p1Best =
            classifiedDrivers.length > 0 && classifiedDrivers[0].stats.bestDuration !== null
               ? classifiedDrivers[0].stats.bestDuration
               : null;

         if (!p1Best) {
            return [];
         }

         const formattedResults: RaceResult[] = classifiedDrivers.map((item, idx) => {
            const pos = idx + 1;
            const duration = item.stats.bestDuration;
            const lapTime = duration ? formatLapTime(duration) : null;

            let gapStr = '-';
            if (pos === 1 && duration) {
               gapStr = 'LEADER';
            } else if (duration && p1Best) {
               const delta = duration - p1Best;
               gapStr = `+${delta.toFixed(3)}`;
            }

            const teamColor = item.driver.team_colour
               ? item.driver.team_colour.startsWith('#')
                  ? item.driver.team_colour
                  : `#${item.driver.team_colour}`
               : '#94a3b8';

            return {
               id: item.driver.driver_number,
               position: pos,
               driverCode: item.driver.name_acronym || '',
               driverFirstName: item.driver.first_name || '',
               driverLastName: item.driver.last_name || item.driver.broadcast_name || '',
               constructorName: item.driver.team_name || '',
               constructorColor: teamColor,
               points: 0,
               status: lapTime || 'NO TIME',
               fastestLap: pos === 1 && duration !== null,
               gridPosition: 0,
               q1: lapTime,
               q2: gapStr,
               q3: null,
               lapTime,
               gap: gapStr,
               lapsCompleted: item.stats.totalLaps,
               durationSector1: item.stats.bestLap?.duration_sector_1 || null,
               durationSector2: item.stats.bestLap?.duration_sector_2 || null,
               durationSector3: item.stats.bestLap?.duration_sector_3 || null,
            };
         });

         practiceCache.set(cacheKey, formattedResults);
         try {
            localStorage.setItem(getStorageKey(race.id, sessionType), JSON.stringify(formattedResults));
         } catch {}
         return formattedResults;
      } catch (err) {
         console.error(`[practiceService] Failed to fetch practice results for ${sessionType}:`, err);
         return [];
      }
   },
};
