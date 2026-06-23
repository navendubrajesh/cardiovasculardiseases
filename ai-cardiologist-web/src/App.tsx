import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './components/Auth/RequireAuth';
import { RequirePermission } from './components/Auth/RequirePermission';
import { AppLayout } from './layouts/AppLayout';
import { AuthProvider } from './state/AuthProvider';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { PredictPage } from './pages/PredictPage';
import { BatchPredictPage } from './pages/BatchPredictPage';
import { ModelsPage } from './pages/ModelsPage';
import { ReferencesPage } from './pages/ReferencesPage';
import { GovernancePage } from './pages/GovernancePage';
import { ResearchPage } from './pages/ResearchPage';
import { DashboardPage } from './pages/DashboardPage';
import './style.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="governance" element={<GovernancePage />} />
            <Route path="research" element={<ResearchPage />} />
            <Route
              path="references"
              element={
                <RequireAuth>
                  <RequirePermission permission="research.read">
                    <ReferencesPage />
                  </RequirePermission>
                </RequireAuth>
              }
            />
            <Route
              path="dashboard"
              element={
                <RequireAuth>
                  <DashboardPage />
                </RequireAuth>
              }
            />
            <Route
              path="predict"
              element={
                <RequireAuth>
                  <RequirePermission permission="predict.run">
                    <PredictPage />
                  </RequirePermission>
                </RequireAuth>
              }
            />
            <Route
              path="batch"
              element={
                <RequireAuth>
                  <RequirePermission permission="predict.batch">
                    <BatchPredictPage />
                  </RequirePermission>
                </RequireAuth>
              }
            />
            <Route
              path="models"
              element={
                <RequireAuth>
                  <RequirePermission permission="model.read">
                    <ModelsPage />
                  </RequirePermission>
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
