import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { FavoritesProvider } from './context/FavoritesContext';
import { ReplayProvider } from './context/ReplayContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import DriversPage from './pages/DriversPage';
import DriverDetailPage from './pages/DriverDetailPage';
import ConstructorsPage from './pages/ConstructorsPage';
import ConstructorDetailPage from './pages/ConstructorDetailPage';
import RaceSchedulePage from './pages/RaceSchedulePage';
import RaceDetailPage from './pages/RaceDetailPage';
import CircuitExplorerPage from './pages/CircuitExplorerPage';
import StatisticsPage from './pages/StatisticsPage';
import DriverComparisonPage from './pages/DriverComparisonPage';
import MomentumTrackerPage from './pages/MomentumTrackerPage';
import ConsistencyPage from './pages/ConsistencyPage';
import ConstructorComparisonPage from './pages/ConstructorComparisonPage';
import ChampionshipPredictorPage from './pages/ChampionshipPredictorPage';
import SeasonTimelinePage from './pages/SeasonTimelinePage';
import RecordsPage from './pages/RecordsPage';
import WeatherForecastPage from './pages/WeatherForecastPage';
import RaceReplayCenterPage from './pages/RaceReplayCenterPage';
import CornerPositionPicker from './pages/admin/CornerPositionPicker';

const App: React.FC = () => {
   return (
      <ErrorBoundary>
         <FavoritesProvider>
            <ReplayProvider>
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
                     <Route path="/statistics" element={<StatisticsPage />} />
                     <Route path="/compare/drivers" element={<DriverComparisonPage />} />
                     <Route path="/momentum" element={<MomentumTrackerPage />} />
                     <Route path="/analytics/consistency" element={<ConsistencyPage />} />
                     <Route path="/compare/constructors" element={<ConstructorComparisonPage />} />
                     <Route path="/predictor" element={<ChampionshipPredictorPage />} />
                     <Route path="/timeline" element={<SeasonTimelinePage />} />
                     <Route path="/records" element={<RecordsPage />} />
                     <Route path="/weather" element={<WeatherForecastPage />} />
                     <Route path="/replay" element={<RaceReplayCenterPage />} />
                     <Route path="/admin/corner-picker" element={<CornerPositionPicker />} />
                  </Route>
               </Routes>
            </ReplayProvider>
         </FavoritesProvider>
      </ErrorBoundary>
   );
};

export default App;
