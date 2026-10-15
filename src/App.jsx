import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import AppLayout from './layout/AppLayout.jsx';
import { useApp } from './store/AppContext.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const EventsPage = lazy(() => import('./pages/events/EventsPage.jsx'));
const EventDetailPage = lazy(() => import('./pages/events/EventDetailPage.jsx'));
const EventFormPage = lazy(() => import('./pages/events/EventFormPage.jsx'));
const CalendarPage = lazy(() => import('./pages/CalendarPage.jsx'));
const TasksPage = lazy(() => import('./pages/TasksPage.jsx'));
const PipelinePage = lazy(() => import('./pages/PipelinePage.jsx'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage.jsx'));
const ClientsPage = lazy(() => import('./pages/clients/ClientsPage.jsx'));
const ClientDetailPage = lazy(() => import('./pages/clients/ClientDetailPage.jsx'));
const VenuesPage = lazy(() => import('./pages/venues/VenuesPage.jsx'));
const VenueDetailPage = lazy(() => import('./pages/venues/VenueDetailPage.jsx'));
const VendorsPage = lazy(() => import('./pages/VendorsPage.jsx'));
const TeamPage = lazy(() => import('./pages/team/TeamPage.jsx'));
const TeamMemberPage = lazy(() => import('./pages/team/TeamMemberPage.jsx'));
const FinancePage = lazy(() => import('./pages/FinancePage.jsx'));
const InventoryPage = lazy(() => import('./pages/InventoryPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
// const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

function Loader() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <CircularProgress />
    </Box>
  );
}

function RequireAuth({ children }) {
  const { state } = useApp();
  const location = useLocation();
  if (!state.auth.isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* <Route path="/login" element={<LoginPage />} /> */}
        <Route
          path="/"
          element={
            // <RequireAuth>
              <AppLayout />
            // </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/new" element={<EventFormPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
          <Route path="events/:id/edit" element={<EventFormPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:id" element={<ClientDetailPage />} />
          <Route path="venues" element={<VenuesPage />} />
          <Route path="venues/:id" element={<VenueDetailPage />} />
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="team/:id" element={<TeamMemberPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
