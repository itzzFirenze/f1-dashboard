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
   q1: string | null;
   q2: string | null;
   q3: string | null;
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
   nextSessionName: string | null;
   nextSessionDate: string | null;
   nextSessionTime: string | null;
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

/** Driver comparison stats */
export interface ComparisonStats {
   points: number;
   wins: number;
   podiums: number;
   avgGrid: number;
   avgFinish: number;
   dnfs: number;
}

export interface RaceComparison {
   raceName: string;
   round: number;
   posA: number | null;
   posB: number | null;
   cumulativePointsA: number;
   cumulativePointsB: number;
}

export interface DriverComparisonData {
   driverA: Driver;
   driverB: Driver;
   statsA: ComparisonStats;
   statsB: ComparisonStats;
   headToHeadQualiA: number;
   headToHeadQualiB: number;
   headToHeadRaceA: number;
   headToHeadRaceB: number;
   races: RaceComparison[];
}

/** Momentum tracker types */
export interface RaceMomentum {
   raceName: string;
   round: number;
   gridPosition: number;
   finishPosition: number;
   positionDelta: number;
   points: number;
   rollingAvgFinish: number;
   rollingAvgPoints: number;
}

export interface LeaderboardEntry {
   driver: Driver;
   score: number;
}

export interface MomentumData {
   driver: Driver;
   score: number;
   formTrend: string;
   recentRaces: RaceMomentum[];
   leaderboard: LeaderboardEntry[];
}

/** Consistency analytics types */
export interface DriverConsistency {
   driver: Driver;
   pointsFinishRate: number;
   avgFinishPosition: number;
   stdDevPosition: number;
   resultsByRace: Record<string, string>;
}

export interface ConsistencyData {
   races: string[];
   drivers: DriverConsistency[];
}

/** Constructor Comparison Types */
export interface DriverPointSplit {
   driver: Driver;
   points: number;
   percentage: number;
   avgQuali: number;
   avgRace: number;
}

export interface ConstructorDriverPoints {
   driverCode: string;
   points: number;
}

export interface ConstructorRoundComparison {
   raceName: string;
   round: number;
   pointsA: number;
   pointsB: number;
   cumulativePointsA: number;
   cumulativePointsB: number;
   gap: number;
   driverPointsA: ConstructorDriverPoints[];
   driverPointsB: ConstructorDriverPoints[];
}

export interface ConstructorComparisonData {
   teamA: Constructor;
   teamB: Constructor;
   driverSplitA: DriverPointSplit[];
   driverSplitB: DriverPointSplit[];
   rounds: ConstructorRoundComparison[];
}

/** Timeline types */
export interface TimelineEvent {
   round: number;
   raceName: string;
   country: string;
   date: string;
   status: string;
   winner: string | null;
   winnerCode: string | null;
   winnerConstructor: string | null;
   winnerConstructorColor: string | null;
   championshipLeader: string | null;
   championshipLeaderCode: string | null;
   leaderPoints: number;
   gapToSecond: number;
   leadChanged: boolean;
   keyEvents: string[];
}

export interface GapDataPoint {
   round: number;
   raceName: string;
   gap: number;
}

export interface TimelineData {
   events: TimelineEvent[];
   gapEvolution: GapDataPoint[];
}

/** Records types */
export interface DriverRecord {
   driverCode: string;
   driverName: string;
   constructorName: string;
   constructorColor: string;
   value: number;
   displayValue: string;
}

export interface ConstructorRecord {
   constructorName: string;
   constructorColor: string;
   value: number;
   displayValue: string;
}

export interface RecordsData {
   mostWinsDriver: DriverRecord[];
   mostPodiumsDriver: DriverRecord[];
   mostPointsDriver: DriverRecord[];
   highestWinRateDriver: DriverRecord[];
   mostWinsConstructor: ConstructorRecord[];
   mostPodiumsConstructor: ConstructorRecord[];
   mostPointsConstructor: ConstructorRecord[];
}

/** Circuit characteristics types */
export interface CircuitCharacteristics {
   downforceLevel: number;
   brakeWear: number;
   tyreWear: number;
   topSpeed: number;
   overtakingDifficulty: number;
   streetCircuit: boolean;
}

/** F1 Trivia types */
export interface TriviaQuestion {
   id: string;
   question: string;
   options: string[];
   correct_answer: string;
   explanation: string;
   category: string;
   difficulty: 'easy' | 'medium' | 'hard';
   season: number | null;
   source: string;
   created_at?: string;
}

export type TriviaCategory =
   | 'all'
   | 'drivers'
   | 'teams'
   | 'circuits'
   | 'race_results'
   | 'championships'
   | 'pit_stops'
   | 'tyres'
   | 'team_radio'
   | 'historical'
   | 'records'
   | 'rules';

export type TriviaGameMode = 'sprint' | 'gp' | 'survival' | 'category';