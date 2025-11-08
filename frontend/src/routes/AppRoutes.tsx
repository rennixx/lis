import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage';

// Main pages
import { DashboardPage } from '@/pages/DashboardPage';
import { PatientsPage } from '@/pages/patients/PatientsPage';
import { PatientDetailPage } from '@/pages/patients/PatientDetailPage';
import { TestsPage } from '@/pages/tests/TestsPage';
import { OrdersPage } from '@/pages/orders/OrdersPage';
import { OrderDetailPage } from '@/pages/orders/OrderDetailPage';
import { ResultsPage } from '@/pages/results/ResultsPage';
import { ResultDetailPage } from '@/pages/results/ResultDetailPage';
import { ResultEntryPage } from '@/pages/results/ResultEntryPage';
import { ResultVerificationPage } from '@/pages/results/ResultVerificationPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';

// Not found page
import { NotFoundPage } from '@/pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  // Debug: Log when AppRoutes renders
  React.useEffect(() => {
    console.log('🔍 [AppRoutes] AppRoutes component rendered');
    console.log('🔍 [AppRoutes] Current URL:', window.location.href);
    console.log('🔍 [AppRoutes] Current path:', window.location.pathname);
  }, []);

  return (
    <Routes>
      {/* Add a very basic route for testing */}
      <Route
        path="/test"
        element={
          <div style={{ padding: '20px', background: 'green', color: 'white', fontSize: '24px' }}>
            TEST ROUTE IS WORKING!
          </div>
        }
      />
      {/* Debug route - always visible */}
      <Route
        path="/debug"
        element={
          <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'purple',
            color: 'white',
            padding: '10px',
            zIndex: 9999,
            borderRadius: '5px'
          }}>
            <h1>DEBUG: AppRoutes is working!</h1>
            <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
            <p>Current path: {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</p>
          </div>
        }
      />
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Patients routes */}
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/:id" element={<PatientDetailPage />} />
        <Route path="patients/:id/edit" element={<PatientDetailPage />} />

        {/* Tests routes */}
        <Route
          path="tests"
          element={
            <ProtectedRoute roles={['admin', 'lab_technician']}>
              <TestsPage />
            </ProtectedRoute>
          }
        />

        {/* Orders routes */}
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/new" element={<OrderDetailPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="orders/:id/edit" element={<OrderDetailPage />} />

        {/* Results routes */}
        <Route
          path="results"
          element={
            <ProtectedRoute roles={['admin', 'lab_technician', 'doctor']}>
              <ResultsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="results/entry"
          element={
            <ProtectedRoute roles={['admin', 'lab_technician']}>
              <ResultEntryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="results/verify"
          element={
            <ProtectedRoute roles={['admin', 'lab_technician', 'doctor']}>
              <ResultVerificationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="results/:id"
          element={
            <ProtectedRoute roles={['admin', 'lab_technician', 'doctor']}>
              <ResultDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="results/:id/edit"
          element={
            <ProtectedRoute roles={['admin', 'lab_technician']}>
              <ResultDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="reports"
          element={
            <ProtectedRoute roles={['admin', 'lab_technician', 'doctor']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Settings routes */}
        <Route
          path="settings"
          element={
            <ProtectedRoute roles={['admin']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Debug fallback route - show what path is being requested */}
        <Route
          path="*"
          element={
            <div style={{
              padding: '20px',
              background: 'red',
              color: 'white',
              fontSize: '20px',
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              zIndex: 9999
            }}>
              DEBUG: UNMATCHED ROUTE!
              <br />
              Path: {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}
              <br />
              URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}
              <br />
              This should show you what route is not matching
            </div>
          }
        />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};