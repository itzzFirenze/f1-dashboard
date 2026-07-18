// ============================================
// F1 Dashboard — TypeScript Type Definitions
// ============================================

/** Standardized API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  timestamp: string;
}

/** Driver summary for standings */
export interface Driver {
  id: number;
  code: string;
  firstName: string;
  lastName: string;
  number: number;
  nationality: string;
  imageUrl: string | null;
  points: number;
  wins: number;
  podiums: number;
  championshipPosition: number;
  constructorName: string;
  constructorColor: string;
}

/** Detailed driver profile */
export interface DriverDetail extends Driver {
  dateOfBirth: string;
  constructorId: number;
}

/** Constructor summary for standings */
export interface Constructor {
  id: number;
  name: string;
  nationality: string;
  logoUrl: string | null;
  color: string;
  points: number;
  wins: number;
  championshipPosition: number;
}

/** Detailed constructor with driver lineup */
export interface ConstructorDetail extends Constructor {
  drivers: Driver[];
}

/** Race summary for calendar */
export interface Race {
  id: number;
  season: number;
  round: number;
  name: string;
  circuitName: string;
  country: string;
  location: string;
  raceDate: string;
  raceTime: string;
  status: 'COMPLETED' | 'UPCOMING' | 'IN_PROGRESS' | 'CANCELLED';
  sprintWeekend: boolean;
}

/** Detailed race with sessions, results, weather */
export interface RaceDetail {
  id: number;
  season: number;
  round: number;
  name: string;
  circuit: Circuit;
  raceDate: string;
  raceTime: string;
  status: string;
  sprintWeekend: boolean;
  sessions: RaceSession[];
  results: RaceResult[];
  sprintResults: RaceResult[];
  qualifyingResults: RaceResult[];
  weather: Weather | null;
}

/** Circuit information */
export interface Circuit {
  id: number;
  name: string;
  country: string;
  location: string;
  lengthKm: number;
  corners: number;
  lapRecord: string;
  lapRecordHolder: string;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
}

/** Race session (FP1, Quali, Race, etc.) */
export interface RaceSession {
  id: number;
  sessionType: string;
  sessionDisplayName: string;
  sessionDate: string;
  sessionTime: string;
  status: string;
}

/** Race result for a single driver */
export interface RaceResult {
  id: number;
  position: number;
  driverCode: string;
  driverFirstName: string;
  driverLastName: string;
  constructorName: string;
  constructorColor: string;
  points: number;
  status: string;
  fastestLap: boolean;
  gridPosition: number;
}

/** Weather data */
export interface Weather {
  temperature: number;
  rainProbability: number;
  windSpeed: number;
  condition: string;
  humidity: number;
  lastUpdated: string;
}

/** Dashboard aggregated data */
export interface DashboardData {
  currentSeason: number;
  totalRaces: number;
  racesCompleted: number;
  racesRemaining: number;
  nextRaceId: number | null;
  nextRaceName: string | null;
  nextRaceCountry: string | null;
  nextRaceCircuit: string | null;
  nextRaceDate: string | null;
  nextRaceTime: string | null;
  driverChampionshipLeader: Driver | null;
  constructorChampionshipLeader: Constructor | null;
  nextRaceWeather: Weather | null;
}

/** Countdown time remaining */
export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}
