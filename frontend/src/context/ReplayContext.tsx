import React, {
   createContext,
   useContext,
   useState,
   useEffect,
   useRef,
   useMemo,
   useCallback,
} from 'react';

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
   isDriverOutAt: (driverNumber: number, time: Date | null) => boolean;

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

   const driversRef = useRef<OpenF1Driver[]>([]);
   const selectedDriversRef = useRef<number[]>([]);
   const currentTimeRef = useRef<Date | null>(null);
   const driverLocationsRef = useRef<Record<number, OpenF1Location>>({});
   const telemetryDataRef = useRef<Record<number, OpenF1CarData>>({});

   const [driverLocations, setDriverLocations] = useState<Record<number, OpenF1Location>>({});
   const [telemetryData, setTelemetryData] = useState<Record<number, OpenF1CarData>>({});

   const locationCache = useRef<Record<number, OpenF1Location[]>>({});
   const carDataCache = useRef<Record<string, OpenF1CarData[]>>({});
   const locationChunkPromises = useRef<Record<number, Promise<void>>>({});
   const carChunkPromises = useRef<Record<string, Promise<void>>>({});
   const locationChunkFailedAt = useRef<Record<number, number>>({});
   const prefetchedChunkRef = useRef<number>(-1);
   const carChunkFailedAt = useRef<Record<string, number>>({});
   const RETRY_COOLDOWN_MS = 4000;

   const timerRef = useRef<number | null>(null);
   const lastTickRef = useRef(0);
   const lastSyncRef = useRef(0);
   const SYNC_INTERVAL_MS = 500;
   const syncRequestIdRef = useRef(0);

   const sessionStart = useMemo(() => {
      if (!activeSession) return null;
      return new Date(activeSession.date_start);
   }, [activeSession]);

   const sessionEnd = useMemo(() => {
      if (!activeSession) return null;
      return new Date(activeSession.date_end);
   }, [activeSession]);

   const durationMs = useMemo(() => {
      if (!sessionStart || !sessionEnd) return 0;
      return sessionEnd.getTime() - sessionStart.getTime();
   }, [sessionStart, sessionEnd]);

   const progressPercent = useMemo(() => {
      if (!sessionStart || !currentTime || durationMs <= 0) return 0;
      const elapsed = currentTime.getTime() - sessionStart.getTime();
      return Math.min(100, Math.max(0, (elapsed / durationMs) * 100));
   }, [sessionStart, currentTime, durationMs]);

   const retiredAtByDriver = useMemo(() => {
      const map: Record<number, number> = {};
      const RETIRE_PATTERN =
         /\b(RETIRED|RETIRES|RETIREMENT|WILL NOT CONTINUE|DID NOT START|DOES NOT START|STOPPED ON TRACK|OUT OF THE RACE|PARKED|DNF|DNS)\b/i;
      const CAR_NUMBER_PATTERN = /CAR\s+(\d+)/i;

      for (const rc of raceControl) {
         if (!rc.message || !RETIRE_PATTERN.test(rc.message)) continue;

         // Use the API's own driver_number when present; only fall back to
         // parsing it out of the message text if it's missing.
         const driverNumber = rc.driver_number ?? Number(rc.message.match(CAR_NUMBER_PATTERN)?.[1]);
         if (!driverNumber || Number.isNaN(driverNumber)) continue;

         const timestamp = new Date(rc.date).getTime();
         if (!Number.isFinite(timestamp)) continue;

         if (map[driverNumber] === undefined || timestamp < map[driverNumber]) {
            map[driverNumber] = timestamp;
         }
      }
      return map;
   }, [raceControl]);

   // Last completed lap (and its estimated end time) per driver, and how far
   // the session's data actually progresses overall — used as a fallback
   // retirement signal when race control never sends an explicit message.
   const lastLapInfoByDriver = useMemo(() => {
      const map: Record<number, { lapNumber: number; endMs: number }> = {};

      for (const lap of laps) {
         if (!lap.date_start) continue;
         const startMs = new Date(lap.date_start).getTime();
         if (!Number.isFinite(startMs)) continue;

         const durationMs = (lap.lap_duration && lap.lap_duration > 0 ? lap.lap_duration : 100) * 1000;
         const endMs = startMs + durationMs;

         const existing = map[lap.driver_number];
         if (!existing || lap.lap_number > existing.lapNumber) {
            map[lap.driver_number] = { lapNumber: lap.lap_number, endMs };
         }
      }

      return map;
   }, [laps]);

   const latestLapEndAcrossField = useMemo(() => {
      let max = 0;
      for (const info of Object.values(lastLapInfoByDriver)) {
         if (info.endMs > max) max = info.endMs;
      }
      return max;
   }, [lastLapInfoByDriver]);

   const isDriverOutAt = useCallback(
      (driverNumber: number, time: Date | null): boolean => {
         const hasAnyLap = laps.some((l) => l.driver_number === driverNumber);
         if (!hasAnyLap) return true;

         const retiredAt = retiredAtByDriver[driverNumber];
         if (retiredAt !== undefined && (time?.getTime() ?? 0) >= retiredAt) return true;

         // Fallback: no race-control retirement message exists for this driver,
         // but the field has clearly kept racing well beyond when this driver's
         // last lap ended — infer a retirement.
         const lastLap = lastLapInfoByDriver[driverNumber];
         const timeMs = time?.getTime() ?? 0;
         const GRACE_MS = 150_000; // 2.5 min beyond own last lap's expected end

         if (
            lastLap &&
            latestLapEndAcrossField - lastLap.endMs > GRACE_MS &&
            timeMs >= lastLap.endMs + GRACE_MS
         ) {
            return true;
         }

         return false;
      },
      [laps, retiredAtByDriver, lastLapInfoByDriver, latestLapEndAcrossField]
   );

   useEffect(() => {
      driversRef.current = drivers;
   }, [drivers]);

   useEffect(() => {
      currentTimeRef.current = currentTime;
   }, [currentTime]);

   const loadSessions = useCallback(async (year: number) => {
      try {
         setIsLoading(true);
         const data = await telemetryService.getSessions(year);
         setSessions(data);
      } catch (error) {
         console.error('[Replay] Failed to load sessions:', error);
      } finally {
         setIsLoading(false);
      }
   }, []);

   const selectSession = useCallback(async (session: OpenF1Session) => {
      setActiveSession(session);
      setIsPlaying(false);

      const initialTime = new Date(session.date_start);
      setCurrentTime(initialTime);
      currentTimeRef.current = initialTime;

      setSelectedDrivers([]);
      selectedDriversRef.current = [];

      setDriverLocations({});
      setTelemetryData({});

      driverLocationsRef.current = {};
      telemetryDataRef.current = {};

      locationCache.current = {};
      carDataCache.current = {};

      locationChunkPromises.current = {};
      carChunkPromises.current = {};

      locationChunkFailedAt.current = {};
      carChunkFailedAt.current = {};

      prefetchedChunkRef.current = -1;

      syncRequestIdRef.current += 1;

      try {
         setIsLoading(true);

         const loadedDrivers = await telemetryService.getDrivers(session.session_key);
         setDrivers(loadedDrivers);
         driversRef.current = loadedDrivers;

         const loadedLaps = await telemetryService.getLaps(session.session_key);
         setLaps(loadedLaps);

         const loadedStints = await telemetryService.getStints(session.session_key);
         setStints(loadedStints);

         const loadedPits = await telemetryService.getPits(session.session_key);
         setPits(loadedPits);

         const loadedRaceControl = await telemetryService.getRaceControl(session.session_key);
         setRaceControl(loadedRaceControl);

         const loadedTeamRadio = await telemetryService.getTeamRadio(session.session_key);
         setTeamRadios(loadedTeamRadio);

         const validLaps = loadedLaps.filter((lap) => Boolean(lap.date_start));

         if (validLaps.length > 0) {
            const firstLap = validLaps.reduce((earliest, lap) => {
               if (new Date(lap.date_start!).getTime() < new Date(earliest.date_start!).getTime()) {
                  return lap;
               }
               return earliest;
            });

            if (firstLap.date_start) {
               const firstLapTime = new Date(firstLap.date_start);
               setCurrentTime(firstLapTime);
               currentTimeRef.current = firstLapTime;
            }
         }
      } catch (error) {
         console.error('[Replay] Failed to load session data:', error);
      } finally {
         setIsLoading(false);
      }
   }, []);

   const fetchLocationChunk = useCallback(
      (chunkIndex: number, session: OpenF1Session, start: Date): Promise<void> => {
         if (locationCache.current[chunkIndex]) return Promise.resolve();

         const existingPromise = locationChunkPromises.current[chunkIndex];
         if (existingPromise) return existingPromise;

         const failedAt = locationChunkFailedAt.current[chunkIndex];
         if (failedAt && Date.now() - failedAt < RETRY_COOLDOWN_MS) return Promise.resolve();

         const chunkStart = new Date(start.getTime() + chunkIndex * 60_000);
         const chunkEnd = new Date(chunkStart.getTime() + 60_000);

         const request = telemetryService
            .getLocations(session.session_key, chunkStart.toISOString(), chunkEnd.toISOString())
            .then((data) => {
               locationCache.current[chunkIndex] = data;
               delete locationChunkFailedAt.current[chunkIndex];
            })
            .catch((error) => {
               console.error('[Replay] Failed to load location chunk', {
                  chunkIndex,
                  start: chunkStart.toISOString(),
                  end: chunkEnd.toISOString(),
                  error,
               });
               locationChunkFailedAt.current[chunkIndex] = Date.now();
            })
            .finally(() => {
               delete locationChunkPromises.current[chunkIndex];
            });

         locationChunkPromises.current[chunkIndex] = request;
         return request;
      },
      []
   );

   const fetchCarChunk = useCallback(
      (driverNumber: number, chunkIndex: number, session: OpenF1Session, start: Date): Promise<void> => {
         const key = `${driverNumber}-${chunkIndex}`;

         if (carDataCache.current[key] !== undefined) return Promise.resolve();

         const existingPromise = carChunkPromises.current[key];
         if (existingPromise) return existingPromise;

         const failedAt = carChunkFailedAt.current[key];
         if (failedAt && Date.now() - failedAt < RETRY_COOLDOWN_MS) return Promise.resolve();

         const chunkStart = new Date(start.getTime() + chunkIndex * 60_000);
         const chunkEnd = new Date(chunkStart.getTime() + 60_000);

         console.log('[Replay] Requesting telemetry', {
            sessionKey: session.session_key,
            driverNumber,
            chunkIndex,
            start: chunkStart.toISOString(),
            end: chunkEnd.toISOString(),
         });

         const request = telemetryService
            .getCarData(session.session_key, driverNumber, chunkStart.toISOString(), chunkEnd.toISOString())
            .then((data) => {
               console.log(
                  `[Replay] Driver ${driverNumber}: ${data.length} telemetry frames`,
                  data.length > 0 ? data[0] : null
               );
               carDataCache.current[key] = data;
               delete carChunkFailedAt.current[key];
            })
            .catch((error) => {
               console.error('[Replay] Failed to fetch car telemetry', {
                  sessionKey: session.session_key,
                  driverNumber,
                  chunkIndex,
                  start: chunkStart.toISOString(),
                  end: chunkEnd.toISOString(),
                  error,
               });
               carChunkFailedAt.current[key] = Date.now();
            })
            .finally(() => {
               delete carChunkPromises.current[key];
            });

         carChunkPromises.current[key] = request;
         return request;
      },
      []
   );

   /* Find closest location frame at/before replay time */
   const findClosestLocation = (
      locations: OpenF1Location[],
      driverNumber: number,
      timeMs: number
   ): OpenF1Location | undefined => {
      let best: OpenF1Location | undefined;
      let bestTime = -Infinity;

      for (const location of locations) {
         if (location.driver_number !== driverNumber) continue;

         const locationTime = new Date(location.date).getTime();
         if (locationTime <= timeMs && locationTime > bestTime) {
            bestTime = locationTime;
            best = location;
         }
      }

      return best;
   };

   /* Find closest car telemetry frame at/before replay time */
   const findClosestTelemetry = (
      frames: OpenF1CarData[],
      timeMs: number
   ): OpenF1CarData | undefined => {
      let best: OpenF1CarData | undefined;
      let bestTime = -Infinity;

      for (const frame of frames) {
         const frameTime = new Date(frame.date).getTime();
         if (frameTime <= timeMs && frameTime > bestTime) {
            bestTime = frameTime;
            best = frame;
         }
      }

      return best;
   };

   /* Synchronize locations + selected driver telemetry */
   const syncLocations = useCallback(
      async (time: Date) => {
         if (!sessionStart || !activeSession) return;

         const currentChunk = Math.floor((time.getTime() - sessionStart.getTime()) / 60_000);
         if (currentChunk < 0) return;

         const timeMs = time.getTime();

         // Capture which drivers this sync belongs to, so state changes during
         // the network request don't affect this particular operation.
         const driversForTelemetry = [...selectedDriversRef.current];

         // Prevent stale async calls from overwriting newer sync results.
         const requestId = ++syncRequestIdRef.current;

         // Prefetch the NEXT chunk once we're most of the way through this one,
         // so it's already cached (near-instant) by the time playback crosses
         // the minute boundary, instead of blocking on a fresh fetch there.
         // Fire-and-forget — we don't need to wait on this.
         const msIntoChunk = time.getTime() - sessionStart.getTime() - currentChunk * 60_000;
         if (msIntoChunk > 45_000 && prefetchedChunkRef.current !== currentChunk) {
            prefetchedChunkRef.current = currentChunk;
            void fetchLocationChunk(currentChunk + 1, activeSession, sessionStart);
            for (const driverNumber of driversForTelemetry) {
               void fetchCarChunk(driverNumber, currentChunk + 1, activeSession, sessionStart);
            }
         }

         await Promise.all([
            fetchLocationChunk(currentChunk, activeSession, sessionStart),
            ...driversForTelemetry.map((driverNumber) =>
               fetchCarChunk(driverNumber, currentChunk, activeSession, sessionStart)
            ),
         ]);

         // If a newer sync started while the requests were running, don't let
         // this older request overwrite it.
         if (requestId !== syncRequestIdRef.current) return;

         // --- Driver locations ---
         const locations = locationCache.current[currentChunk] ?? [];
         const nextLocations: Record<number, OpenF1Location> = {};

         for (const driver of driversRef.current) {
            const location = findClosestLocation(locations, driver.driver_number, timeMs);

            if (location) {
               nextLocations[driver.driver_number] = location;
               continue;
            }

            // Keep the previous known position when no frame exists inside
            // this exact chunk yet.
            const previousLocation = driverLocationsRef.current[driver.driver_number];
            if (previousLocation) {
               nextLocations[driver.driver_number] = previousLocation;
            }
         }

         driverLocationsRef.current = nextLocations;
         setDriverLocations(nextLocations);

         // --- Selected driver telemetry ---
         const nextTelemetry: Record<number, OpenF1CarData> = {};

         for (const driverNumber of driversForTelemetry) {
            const cacheKey = `${driverNumber}-${currentChunk}`;
            const frames = carDataCache.current[cacheKey] ?? [];
            const telemetryFrame = findClosestTelemetry(frames, timeMs);

            if (telemetryFrame) {
               nextTelemetry[driverNumber] = telemetryFrame;
               continue;
            }

            // If the API response exists but the earliest frame in this minute
            // is slightly after replay time, preserve the previous valid
            // telemetry instead of flashing back to "Awaiting telemetry frames...".
            const previousTelemetry = telemetryDataRef.current[driverNumber];
            if (previousTelemetry) {
               nextTelemetry[driverNumber] = previousTelemetry;
            }
         }

         telemetryDataRef.current = nextTelemetry;
         setTelemetryData(nextTelemetry);
      },
      [sessionStart, activeSession, fetchLocationChunk, fetchCarChunk]
   );

   /* Playback animation loop */
   const tick = useCallback(
      (now: number) => {
         const delta = now - lastTickRef.current;
         lastTickRef.current = now;

         setCurrentTime((previous) => {
            if (!previous || !sessionEnd) return previous;

            const nextTime = new Date(previous.getTime() + delta * playbackSpeed);

            if (nextTime >= sessionEnd) {
               setIsPlaying(false);
               currentTimeRef.current = sessionEnd;
               return sessionEnd;
            }

            currentTimeRef.current = nextTime;
            return nextTime;
         });

         timerRef.current = requestAnimationFrame(tick);
      },
      [playbackSpeed, sessionEnd]
   );

   // Start/stop RAF.
   useEffect(() => {
      if (!isPlaying || !sessionEnd) {
         if (timerRef.current !== null) {
            cancelAnimationFrame(timerRef.current);
            timerRef.current = null;
         }
         return;
      }

      lastTickRef.current = performance.now();
      timerRef.current = requestAnimationFrame(tick);

      return () => {
         if (timerRef.current !== null) {
            cancelAnimationFrame(timerRef.current);
            timerRef.current = null;
         }
      };
   }, [isPlaying, sessionEnd, tick]);

   // Sync while playing.
   useEffect(() => {
      if (!isPlaying || !currentTime) return;

      const now = performance.now();
      if (now - lastSyncRef.current < SYNC_INTERVAL_MS) return;

      lastSyncRef.current = now;
      void syncLocations(currentTime);
   }, [currentTime, isPlaying, syncLocations]);

   // Sync when paused and user scrubs / skips / jumps laps.
   useEffect(() => {
      if (isPlaying || !currentTime || !sessionStart) return;
      void syncLocations(currentTime);
   }, [currentTime, isPlaying, sessionStart, syncLocations]);

   // IMPORTANT: immediately fetch telemetry when driver selection changes.
   useEffect(() => {
      // Update the ref FIRST. syncLocations reads selectedDriversRef.current,
      // so this guarantees the clicked driver exists before telemetry fetching
      // begins.
      selectedDriversRef.current = selectedDrivers;

      // Remove telemetry entries for deselected drivers immediately.
      const retainedTelemetry: Record<number, OpenF1CarData> = {};

      for (const driverNumber of selectedDrivers) {
         const existing = telemetryDataRef.current[driverNumber];
         if (existing) {
            retainedTelemetry[driverNumber] = existing;
         }
      }

      telemetryDataRef.current = retainedTelemetry;
      setTelemetryData(retainedTelemetry);

      if (selectedDrivers.length === 0) return;

      const replayTime = currentTimeRef.current;

      if (replayTime && sessionStart) {
         // This is the request that should populate TelemetryDashboard
         // immediately after clicking a driver marker.
         void syncLocations(replayTime);
      }
   }, [selectedDrivers, sessionStart, syncLocations]);

   // Auto-select first session — also re-fires when the active session
   // isn't part of the current list anymore (e.g. after switching years).
   useEffect(() => {
      if (sessions.length === 0) return;

      const stillValid = activeSession
         ? sessions.some((s) => s.session_key === activeSession.session_key)
         : false;

      if (!stillValid) {
         selectSession(sessions[0]);
      }
   }, [sessions, activeSession, selectSession]);

   /* Player controls */
   const play = useCallback(() => setIsPlaying(true), []);
   const pause = useCallback(() => setIsPlaying(false), []);

   const stop = useCallback(() => {
      setIsPlaying(false);

      if (sessionStart) {
         setCurrentTime(sessionStart);
         currentTimeRef.current = sessionStart;
      }
   }, [sessionStart]);

   const skip = useCallback(
      (seconds: number) => {
         setCurrentTime((previous) => {
            if (!previous || !sessionStart || !sessionEnd) return previous;

            const target = new Date(previous.getTime() + seconds * 1000);
            let result: Date;

            if (target < sessionStart) {
               result = sessionStart;
            } else if (target > sessionEnd) {
               result = sessionEnd;
            } else {
               result = target;
            }

            currentTimeRef.current = result;
            return result;
         });
      },
      [sessionStart, sessionEnd]
   );

   const setSpeed = useCallback((speed: 1 | 2 | 4 | 8) => {
      setPlaybackSpeed(speed);
   }, []);

   const scrubToPercent = useCallback(
      (percent: number) => {
         if (!sessionStart || durationMs <= 0) return;

         const safePercent = Math.min(100, Math.max(0, percent));
         const targetMs = (safePercent / 100) * durationMs;
         const target = new Date(sessionStart.getTime() + targetMs);

         currentTimeRef.current = target;
         setCurrentTime(target);
      },
      [sessionStart, durationMs]
   );

   const jumpToLap = useCallback(
      (lapNumber: number) => {
         // Multiple drivers share the same lap number; we only need one
         // lap-start timestamp for the replay clock.
         const lap = laps.find(
            (candidate) => candidate.lap_number === lapNumber && candidate.date_start
         );

         if (!lap || !lap.date_start) return;

         const target = new Date(lap.date_start);
         currentTimeRef.current = target;
         setCurrentTime(target);
      },
      [laps]
   );

   /* Driver selection */
   const toggleDriverSelection = useCallback((driverNumber: number) => {
      setSelectedDrivers((previous) => {
         let next: number[];

         if (previous.includes(driverNumber)) {
            // Clicking an already-selected driver deselects it.
            next = previous.filter((number) => number !== driverNumber);
         } else if (previous.length >= 2) {
            // Battle mode supports max 2 drivers. When two are already selected,
            // drop the oldest selection and add the newly clicked driver.
            next = [previous[previous.length - 1], driverNumber];
         } else {
            // Add first/second driver.
            next = [...previous, driverNumber];
         }

         // Update synchronously instead of waiting for useEffect.
         selectedDriversRef.current = next;
         return next;
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
            isDriverOutAt,

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

   if (!context) {
      throw new Error('useReplay must be used within a ReplayProvider');
   }

   return context;
};