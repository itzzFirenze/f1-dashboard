import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { FavoritesProvider } from './context/FavoritesContext';
import { ReplayProvider } from './context/ReplayContext';
import { TimezoneProvider } from './context/TimezoneContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import Layout from './components/layout/Layout';

// ── Lazy-loaded pages (each becomes a separate Vite chunk) ───────────────────
const DashboardPage           = React.lazy(() => import('./pages/DashboardPage'));
const DriversPage             = React.lazy(() => import('./pages/DriversPage'));
const DriverDetailPage        = React.lazy(() => import('./pages/DriverDetailPage'));
const ConstructorsPage        = React.lazy(() => import('./pages/ConstructorsPage'));
const ConstructorDetailPage   = React.lazy(() => import('./pages/ConstructorDetailPage'));
const RaceSchedulePage        = React.lazy(() => import('./pages/RaceSchedulePage'));
const RaceDetailPage          = React.lazy(() => import('./pages/RaceDetailPage'));
const CircuitExplorerPage     = React.lazy(() => import('./pages/CircuitExplorerPage'));
const StatisticsPage          = React.lazy(() => import('./pages/StatisticsPage'));
const DriverComparisonPage    = React.lazy(() => import('./pages/DriverComparisonPage'));
const MomentumTrackerPage     = React.lazy(() => import('./pages/MomentumTrackerPage'));
const ConsistencyPage         = React.lazy(() => import('./pages/ConsistencyPage'));
const ConstructorComparisonPage = React.lazy(() => import('./pages/ConstructorComparisonPage'));
const ChampionshipPredictorPage = React.lazy(() => import('./pages/ChampionshipPredictorPage'));
const SeasonTimelinePage      = React.lazy(() => import('./pages/SeasonTimelinePage'));
const RecordsPage             = React.lazy(() => import('./pages/RecordsPage'));
const WeatherForecastPage     = React.lazy(() => import('./pages/WeatherForecastPage'));
const RaceReplayCenterPage    = React.lazy(() => import('./pages/RaceReplayCenterPage'));
const TriviaPage              = React.lazy(() => import('./pages/TriviaPage'));
const TelemetryGhostPage      = React.lazy(() => import('./pages/TelemetryGhostPage'));
const TeammateBattlesPage     = React.lazy(() => import('./pages/TeammateBattlesPage'));
const PowerRankingsPage       = React.lazy(() => import('./pages/PowerRankingsPage'));
const CornerPositionPicker    = React.lazy(() => import('./pages/admin/CornerPositionPicker'));

/** Minimal full-screen spinner shown while a lazy page chunk loads */
const PageSkeleton: React.FC = () => (
   <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0a0a0f',
   }}>
      <div style={{
         width: 40, height: 40, border: '3px solid rgba(225,6,0,0.2)',
         borderTop: '3px solid #E10600', borderRadius: '50%',
         animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
   </div>
);

const App: React.FC = () => {
   return (
      <ErrorBoundary>
         <TimezoneProvider>
            <FavoritesProvider>
               <ReplayProvider>
                  <Suspense fallback={<PageSkeleton />}>
                     <Routes>
                        <Route element={<Layout />}>
                           <Route path="/" element={<DashboardPage />} />
                           <Route path="/drivers" element={<DriversPage />} />
                           <Route path="/drivers/:id" element={<DriverDetailPage />} />
                           <Route path="/constructors" element={<ConstructorsPage />} />
                           <Route path="/constructors/:id" element={<ConstructorDetailPage />} />
                           <Route path="/races" element={<RaceSchedulePage />} />
                           <Route path="/races/:id" element={<RaceDetailPage />} />
                           <Route path="/circuits" element={<CircuitExplorerPage />} />
                           <Route path="/trivia" element={<TriviaPage />} />
                           <Route path="/statistics" element={<StatisticsPage />} />
                           <Route path="/compare/drivers" element={<DriverComparisonPage />} />
                           <Route path="/compare/teammates" element={<TeammateBattlesPage />} />
                           <Route path="/compare/constructors" element={<ConstructorComparisonPage />} />
                           <Route path="/telemetry/ghost" element={<TelemetryGhostPage />} />
                           <Route path="/momentum" element={<MomentumTrackerPage />} />
                           <Route path="/analytics/consistency" element={<ConsistencyPage />} />
                           <Route path="/analytics/power-rankings" element={<PowerRankingsPage />} />
                           <Route path="/predictor" element={<ChampionshipPredictorPage />} />
                           <Route path="/timeline" element={<SeasonTimelinePage />} />
                           <Route path="/records" element={<RecordsPage />} />
                           <Route path="/weather" element={<WeatherForecastPage />} />
                           <Route path="/replay" element={<RaceReplayCenterPage />} />
                           <Route path="/admin/corner-picker" element={<CornerPositionPicker />} />
                        </Route>
                     </Routes>
                  </Suspense>
               </ReplayProvider>
            </FavoritesProvider>
         </TimezoneProvider>
      </ErrorBoundary>
   );
};

export default App;