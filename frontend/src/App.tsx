import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { FavoritesProvider } from './context/FavoritesContext';
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

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <FavoritesProvider>
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
          </Route>
        </Routes>
      </FavoritesProvider>
    </ErrorBoundary>
  );
};

export default App;

