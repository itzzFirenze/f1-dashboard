import api from './api';

export interface OpenF1Session {
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

export interface OpenF1Driver {
   driver_number: number;
   broadcast_name: string;
   full_name: string;
   name_acronym: string;
   team_name: string;
   team_colour: string;
   first_name: string;
   last_name: string;
   headshot_url: string | null;
   country_code: string;
}

export interface OpenF1Location {
   date: string;
   driver_number: number;
   x: number;
   y: number;
   z: number;
}

export interface OpenF1CarData {
   brake: number;
   date: string;
   driver_number: number;
   drs: number;
   meeting_key: number;
   n_gear: number;
   rpm: number;
   session_key: number;
   speed: number;
   throttle: number;
}

export interface OpenF1Pit {
   date: string;
   lap_number: number;
   driver_number: number;
   pit_duration: number | null;
   lane_duration?: number | null;
   stop_duration?: number | null;
}

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

const getCarData = async (
   sessionKey: number,
   driverNumber: number,
   startDate?: string,
   endDate?: string
): Promise<OpenF1CarData[]> => {
   return enqueue(async () => {
      let url =
         `${OPENF1_BASE_URL}/car_data` +
         `?session_key=${sessionKey}` +
         `&driver_number=${driverNumber}`;

      if (startDate) {
         url += `&date>=${encodeURIComponent(startDate)}`;
      }

      if (endDate) {
         url += `&date<${encodeURIComponent(endDate)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
         const message = await response.text();

         throw new Error(
            `OpenF1 car_data failed: ${response.status} ${message}`
         );
      }

      const data: OpenF1CarData[] = await response.json();

      return data;
   });
};

export interface OpenF1Lap {
   driver_number: number;
   lap_number: number;
   date_start: string;
   lap_duration: number | null;
   duration_sector_1: number | null;
   duration_sector_2: number | null;
   duration_sector_3: number | null;
   i1_speed: number | null;
   i2_speed: number | null;
   st_speed: number | null;
}

export interface OpenF1Stint {
   driver_number: number;
   stint_number: number;
   lap_start: number;
   lap_end: number;
   compound: string;
   tyre_age_at_start: number;
}

export interface OpenF1Pit {
   date: string;
   lap_number: number;
   driver_number: number;
   pit_duration: number | null;
}

export interface OpenF1RaceControl {
   date: string;
   driver_number: number | null;
   lap_number: number;
   category: string;
   flag: string | null;
   scope: string | null;
   message: string;
}

export interface OpenF1TeamRadio {
   date: string;
   driver_number: number;
   recording_url: string;
}

let queueTail: Promise<void> = Promise.resolve();
const MIN_GAP_MS = 250;

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
   const run = queueTail.then(fn, fn);
   queueTail = run.then(
      () => new Promise<void>((res) => setTimeout(res, MIN_GAP_MS)),
      () => new Promise<void>((res) => setTimeout(res, MIN_GAP_MS))
   );
   return run;
}

export const telemetryService = {

   getSessions: async (year: number, location?: string): Promise<OpenF1Session[]> => {
      const params: Record<string, string | number> = { year, session_name: 'Race' };
      if (location) params.location = location;
      const { data } = await api.get<OpenF1Session[]>('/telemetry/sessions', { params });
      return data;
   },

   getDrivers: async (sessionKey: number): Promise<OpenF1Driver[]> => {
      const { data } = await api.get<OpenF1Driver[]>('/telemetry/drivers', {
         params: { session_key: sessionKey },
      });
      return data;
   },

   getLaps: async (sessionKey: number): Promise<OpenF1Lap[]> => {
      const { data } = await api.get<OpenF1Lap[]>('/telemetry/laps', {
         params: { session_key: sessionKey },
      });
      return data;
   },

   getStints: async (sessionKey: number): Promise<OpenF1Stint[]> => {
      const { data } = await api.get<OpenF1Stint[]>('/telemetry/stints', {
         params: { session_key: sessionKey },
      });
      return data;
   },

   getPits: async (sessionKey: number): Promise<OpenF1Pit[]> => {
      const { data } = await api.get<OpenF1Pit[]>('/telemetry/pit', {
         params: { session_key: sessionKey },
      });
      return data;
   },

   getRaceControl: async (sessionKey: number): Promise<OpenF1RaceControl[]> => {
      const { data } = await api.get<OpenF1RaceControl[]>('/telemetry/race_control', {
         params: { session_key: sessionKey },
      });
      return data;
   },

   getTeamRadio: async (sessionKey: number): Promise<OpenF1TeamRadio[]> => {
      const { data } = await api.get<OpenF1TeamRadio[]>('/telemetry/team_radio', {
         params: { session_key: sessionKey },
      });
      return data;
   },

   getLocations: async (sessionKey: number, dateStart: string, dateEnd: string): Promise<OpenF1Location[]> => {
      return enqueue(async () => {
         const { data } = await api.get<OpenF1Location[]>('/telemetry/location', {
            params: { session_key: sessionKey, 'date>=': dateStart, 'date<=': dateEnd },
         });
         return data;
      });
   },

   getCarData
};