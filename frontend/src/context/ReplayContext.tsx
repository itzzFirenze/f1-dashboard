import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
   telemetryService,
   OpenF1Session,
   OpenF1Driver,
   OpenF1Lap,
   OpenF1Stint,
   OpenF1Pit,
   OpenF1RaceControl,
   OpenF1TeamRadio,
   OpenF1Location,
   OpenF1CarData,
} from '../services/telemetryService';

interface ReplayContextProps {
   activeSession: OpenF1Session | null;
   sessions: OpenF1Session[];
   loadSessions: (year: number) => Promise<void>;
   selectSession: (session: OpenF1Session) => void;
   isLoading: boolean;

   drivers: OpenF1Driver[];
   laps: OpenF1Lap[];
   stints: OpenF1Stint[];
   pits: OpenF1Pit[];
   raceControl: OpenF1RaceControl[];
   teamRadios: OpenF1TeamRadio[];

   isPlaying: boolean;
   playbackSpeed: 1 | 2 | 4 | 8;
   currentTime: Date | null;
   durationMs: number;
   progressPercent: number;

   driverLocations: Record<number, OpenF1Location>;
   selectedDrivers: number[];
   telemetryData: Record<number, OpenF1CarData>;

   play: () => void;
   pause: () => void;
   stop: () => void;
   skip: (seconds: number) => void;
   setSpeed: (speed: 1 | 2 | 4 | 8) => void;
   scrubToPercent: (percent: number) => void;
   jumpToLap: (lapNumber: number) => void;
   toggleDriverSelection: (driverNumber: number) => void;
}

const ReplayContext = createContext<ReplayContextProps | undefined>(undefined);

export const ReplayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const [sessions, setSessions] = useState<OpenF1Session[]>([]);
   const [activeSession, setActiveSession] = useState<OpenF1Session | null>(null);
   const [isLoading, setIsLoading] = useState(false);

   const [drivers, setDrivers] = useState<OpenF1Driver[]>([]);
   const [laps, setLaps] = useState<OpenF1Lap[]>([]);
   const [stints, setStints] = useState<OpenF1Stint[]>([]);
   const [pits, setPits] = useState<OpenF1Pit[]>([]);
   const [raceControl, setRaceControl] = useState<OpenF1RaceControl[]>([]);
   const [teamRadios, setTeamRadios] = useState<OpenF1TeamRadio[]>([]);

   const [isPlaying, setIsPlaying] = useState(false);
   const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4 | 8>(1);
   const [currentTime, setCurrentTime] = useState<Date | null>(null);
   const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);

   // Use refs for high-frequency data to avoid re-render cascades
   const driverLocationsRef = useRef<Record<number, OpenF1Location>>({});
   const telemetryDataRef = useRef<Record<number, OpenF1CarData>>({});
   const [driverLocations, setDriverLocations] = useState<Record<number, OpenF1Location>>({});
   const [telemetryData, setTelemetryData] = useState<Record<number, OpenF1CarData>>({});

   // Chunk caches
   const locationCache = useRef<Record<number, OpenF1Location[]>>({});
   const carDataCache = useRef<Record<string, OpenF1CarData[]>>({});

   // In-flight fetch promises, keyed by chunk index / "driver-chunk" key.
   // Used both for de-duplication and so syncLocations can await freshly
   // fetched chunks instead of racing ahead of the network response.
   const chunkPromises = useRef<Record<number, Promise<void>>>({});
   const carChunkPromises = useRef<Record<string, Promise<void>>>({});

   // Timestamps of the last failed fetch per chunk, so a 429'd chunk isn't
   // hammered again on the very next 500ms sync tick. Combined with the
   // request queue in telemetryService, this keeps us well under OpenF1's
   // rate limit.
   const chunkFailedAt = useRef<Record<number, number>>({});
   const carChunkFailedAt = useRef<Record<string, number>>({});
   const RETRY_COOLDOWN_MS = 4000;

   // Throttle for location sync (update UI only every 500ms to avoid 60fps re-renders)
   const lastSyncRef = useRef<number>(0);
   const syncIntervalMs = 500;

   const sessionStart = useMemo(() => activeSession ? new Date(activeSession.date_start) : null, [activeSession]);
   const sessionEnd = useMemo(() => activeSession ? new Date(activeSession.date_end) : null, [activeSession]);
   const durationMs = useMemo(() => {
      if (!sessionStart || !sessionEnd) return 0;
      return sessionEnd.getTime() - sessionStart.getTime();
   }, [sessionStart, sessionEnd]);

   const progressPercent = useMemo(() => {
      if (!sessionStart || !currentTime || durationMs === 0) return 0;
      return ((currentTime.getTime() - sessionStart.getTime()) / durationMs) * 100;
   }, [sessionStart, currentTime, durationMs]);

   const timerRef = useRef<number | null>(null);
   const lastTickRef = useRef<number>(0);
   const driversRef = useRef<OpenF1Driver[]>([]);
   const selectedDriversRef = useRef<number[]>([]);

   // Keep refs in sync
   useEffect(() => { driversRef.current = drivers; }, [drivers]);
   useEffect(() => { selectedDriversRef.current = selectedDrivers; }, [selectedDrivers]);

   const loadSessions = useCallback(async (year: number) => {
      try {
         setIsLoading(true);
         const data = await telemetryService.getSessions(year);
         setSessions(data);
         // Don't auto-select here — let the page do it after state settles
      } catch (e) {
         console.error('Failed to load sessions:', e);
      } finally {
         setIsLoading(false);
      }
   }, []);

   const selectSession = useCallback(async (session: OpenF1Session) => {
      setActiveSession(session);
      setIsPlaying(false);
      setCurrentTime(new Date(session.date_start));
      setDriverLocations({});
      setTelemetryData({});
      driverLocationsRef.current = {};
      telemetryDataRef.current = {};
      locationCache.current = {};
      carDataCache.current = {};
      chunkPromises.current = {};
      carChunkPromises.current = {};
      chunkFailedAt.current = {};
      carChunkFailedAt.current = {};
      setSelectedDrivers([]);

      try {
         setIsLoading(true);
         // Load data sequentially to avoid triggering OpenF1 429 Too Many Requests rate limit
         const drvs = await telemetryService.getDrivers(session.session_key);
         setDrivers(drvs);

         const lps = await telemetryService.getLaps(session.session_key);
         setLaps(lps);

         const stnts = await telemetryService.getStints(session.session_key);
         setStints(stnts);

         const pts = await telemetryService.getPits(session.session_key);
         setPits(pts);

         const rc = await telemetryService.getRaceControl(session.session_key);
         setRaceControl(rc);

         const tr = await telemetryService.getTeamRadio(session.session_key);
         setTeamRadios(tr);

         // Fast-forward initial time to when the first lap starts, as OpenF1 location data
         // often doesn't start streaming until minutes after session date_start.
         if (lps.length > 0) {
            const firstLap = lps.reduce((min, lap) => {
               if (!lap.date_start) return min;
               if (!min.date_start) return lap;
               return new Date(lap.date_start) < new Date(min.date_start) ? lap : min;
            }, lps[0]);

            if (firstLap && firstLap.date_start) {
               setCurrentTime(new Date(firstLap.date_start));
            }
         }

      } catch (e) {
         console.error('Failed to load session data:', e);
      } finally {
         setIsLoading(false);
      }
   }, []);

   // Helper: Get chunk index for a given Date
   const getChunkIndex = useCallback((date: Date): number => {
      if (!sessionStart) return 0;
      return Math.floor((date.getTime() - sessionStart.getTime()) / 60000);
   }, [sessionStart]);

   // Fetch location chunk. Returns a promise that resolves once the chunk is
   // in locationCache (either just now, or already cached/in-flight). Skips
   // re-fetching a chunk that recently 429'd until RETRY_COOLDOWN_MS passes.
   const fetchChunk = useCallback((chunkIndex: number, session: OpenF1Session, start: Date): Promise<void> => {
      if (locationCache.current[chunkIndex]) return Promise.resolve();
      if (chunkPromises.current[chunkIndex] !== undefined) return chunkPromises.current[chunkIndex] as Promise<void>;

      const failedAt = chunkFailedAt.current[chunkIndex];
      if (failedAt && Date.now() - failedAt < RETRY_COOLDOWN_MS) return Promise.resolve();

      const chunkStart = new Date(start.getTime() + chunkIndex * 60000);
      const chunkEnd = new Date(chunkStart.getTime() + 60000);

      const p = telemetryService
         .getLocations(session.session_key, chunkStart.toISOString(), chunkEnd.toISOString())
         .then((data) => {
            locationCache.current[chunkIndex] = data;
            delete chunkFailedAt.current[chunkIndex];
         })
         .catch((e) => {
            console.error('Failed to load location chunk', chunkIndex, e);
            chunkFailedAt.current[chunkIndex] = Date.now();
         })
         .finally(() => {
            delete chunkPromises.current[chunkIndex];
         });

      chunkPromises.current[chunkIndex] = p;
      return p;
   }, []);

   // Fetch car telemetry chunk. Same promise-cache + cooldown pattern as fetchChunk.
   const fetchCarChunk = useCallback((driverNumber: number, chunkIndex: number, session: OpenF1Session, start: Date): Promise<void> => {
      const key = `${driverNumber}-${chunkIndex}`;
      if (carDataCache.current[key]) return Promise.resolve();
      if (carChunkPromises.current[key] !== undefined) return carChunkPromises.current[key] as Promise<void>;

      const failedAt = carChunkFailedAt.current[key];
      if (failedAt && Date.now() - failedAt < RETRY_COOLDOWN_MS) return Promise.resolve();

      const chunkStart = new Date(start.getTime() + chunkIndex * 60000);
      const chunkEnd = new Date(chunkStart.getTime() + 60000);

      const p = telemetryService
         .getCarData(session.session_key, driverNumber, chunkStart.toISOString(), chunkEnd.toISOString())
         .then((data) => {
            carDataCache.current[key] = data;
            delete carChunkFailedAt.current[key];
         })
         .catch((e) => {
            console.error('Failed to load car chunk', key, e);
            carChunkFailedAt.current[key] = Date.now();
         })
         .finally(() => {
            delete carChunkPromises.current[key];
         });

      carChunkPromises.current[key] = p;
      return p;
   }, []);

   // Sync locations from cache (called throttled from playback loop).
   // Awaits the relevant chunk fetches before reading from the cache, so the
   // very first sync after a session/scrub actually has data to render.
   // Only requests the CURRENT chunk (no +1 prefetch) to keep request volume
   // low enough to stay under OpenF1's rate limit.
   const syncLocations = useCallback(async (time: Date) => {
      if (!sessionStart || !activeSession) return;

      const currentChunk = Math.floor((time.getTime() - sessionStart.getTime()) / 60000);
      const timeMs = time.getTime();

      if (currentChunk >= 0) {
         await fetchChunk(currentChunk, activeSession, sessionStart);
         await Promise.all(
            selectedDriversRef.current.map((driverNo) =>
               fetchCarChunk(driverNo, currentChunk, activeSession, sessionStart)
            )
         );
      }

      // Update driver positions from cache
      const locations = locationCache.current[currentChunk] || [];
      const nextLocs: Record<number, OpenF1Location> = {};

      driversRef.current.forEach((drv) => {
         const drvLocs = locations.filter((l) => l.driver_number === drv.driver_number);
         let best: OpenF1Location | undefined;
         let bestTime = -Infinity;

         for (const l of drvLocs) {
            const t = new Date(l.date).getTime();
            if (t <= timeMs && t > bestTime) {
               bestTime = t;
               best = l;
            }
         }

         if (best) {
            nextLocs[drv.driver_number] = best;
         } else if (driverLocationsRef.current[drv.driver_number]) {
            // Keep previous position if no new data
            nextLocs[drv.driver_number] = driverLocationsRef.current[drv.driver_number];
         }
      });

      driverLocationsRef.current = nextLocs;
      setDriverLocations(nextLocs);

      // Update battle mode telemetry
      const nextTelemetry: Record<number, OpenF1CarData> = {};
      selectedDriversRef.current.forEach((driverNo) => {
         const key = `${driverNo}-${currentChunk}`;
         const carData = carDataCache.current[key] || [];
         let best: OpenF1CarData | undefined;
         let bestTime = -Infinity;

         for (const c of carData) {
            const t = new Date(c.date).getTime();
            if (t <= timeMs && t > bestTime) {
               bestTime = t;
               best = c;
            }
         }

         if (best) {
            nextTelemetry[driverNo] = best;
         } else if (telemetryDataRef.current[driverNo]) {
            nextTelemetry[driverNo] = telemetryDataRef.current[driverNo];
         }
      });

      telemetryDataRef.current = nextTelemetry;
      setTelemetryData(nextTelemetry);
   }, [sessionStart, activeSession, fetchChunk, fetchCarChunk]);

   // Playback Loop — uses requestAnimationFrame but throttles state updates
   useEffect(() => {
      if (!isPlaying || !currentTime || !sessionEnd) {
         if (timerRef.current) {
            cancelAnimationFrame(timerRef.current);
            timerRef.current = null;
         }
         return;
      }

      lastTickRef.current = performance.now();
      lastSyncRef.current = 0;

      const tick = (now: number) => {
         const delta = now - lastTickRef.current;
         lastTickRef.current = now;

         setCurrentTime((prev) => {
            if (!prev) return null;
            const nextTime = new Date(prev.getTime() + delta * playbackSpeed);
            if (nextTime >= sessionEnd) {
               setIsPlaying(false);
               return sessionEnd;
            }

            // Throttled location sync
            if (now - lastSyncRef.current > syncIntervalMs) {
               lastSyncRef.current = now;
               syncLocations(nextTime);
            }

            return nextTime;
         });

         timerRef.current = requestAnimationFrame(tick);
      };

      timerRef.current = requestAnimationFrame(tick);

      return () => {
         if (timerRef.current) cancelAnimationFrame(timerRef.current);
      };
   }, [isPlaying, playbackSpeed, sessionEnd, syncLocations]);

   // Also sync when scrubbing / jumping while paused
   useEffect(() => {
      if (!isPlaying && currentTime && sessionStart) {
         syncLocations(currentTime);
      }
   }, [currentTime, isPlaying, sessionStart, syncLocations]);

   // Auto-select first session after sessions load
   useEffect(() => {
      if (sessions.length > 0 && !activeSession) {
         selectSession(sessions[0]);
      }
   }, [sessions, activeSession, selectSession]);

   const play = useCallback(() => setIsPlaying(true), []);
   const pause = useCallback(() => setIsPlaying(false), []);
   const stop = useCallback(() => {
      setIsPlaying(false);
      if (sessionStart) setCurrentTime(sessionStart);
   }, [sessionStart]);

   const skip = useCallback((seconds: number) => {
      setCurrentTime((prev) => {
         if (!prev || !sessionStart || !sessionEnd) return prev;
         const target = new Date(prev.getTime() + seconds * 1000);
         return target < sessionStart ? sessionStart : target > sessionEnd ? sessionEnd : target;
      });
   }, [sessionStart, sessionEnd]);

   const setSpeed = useCallback((speed: 1 | 2 | 4 | 8) => setPlaybackSpeed(speed), []);

   const scrubToPercent = useCallback((percent: number) => {
      if (!sessionStart || durationMs === 0) return;
      const targetMs = (percent / 100) * durationMs;
      setCurrentTime(new Date(sessionStart.getTime() + targetMs));
   }, [sessionStart, durationMs]);

   const jumpToLap = useCallback((lapNumber: number) => {
      const lap = laps.find((l) => l.lap_number === lapNumber);
      if (lap && lap.date_start) {
         setCurrentTime(new Date(lap.date_start));
      }
   }, [laps]);

   const toggleDriverSelection = useCallback((driverNumber: number) => {
      setSelectedDrivers((prev) => {
         if (prev.includes(driverNumber)) {
            return prev.filter((id) => id !== driverNumber);
         }
         if (prev.length >= 2) {
            return [prev[1], driverNumber];
         }
         return [...prev, driverNumber];
      });
   }, []);

   return (
      <ReplayContext.Provider
         value={{
            activeSession,
            sessions,
            loadSessions,
            selectSession,
            isLoading,
            drivers,
            laps,
            stints,
            pits,
            raceControl,
            teamRadios,
            isPlaying,
            playbackSpeed,
            currentTime,
            durationMs,
            progressPercent,
            driverLocations,
            selectedDrivers,
            telemetryData,
            play,
            pause,
            stop,
            skip,
            setSpeed,
            scrubToPercent,
            jumpToLap,
            toggleDriverSelection,
         }}
      >
         {children}
      </ReplayContext.Provider>
   );
};

export const useReplay = () => {
   const context = useContext(ReplayContext);
   if (!context) throw new Error('useReplay must be used within a ReplayProvider');
   return context;
};