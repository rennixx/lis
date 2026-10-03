import React from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
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

    // Log all path segments for debugging
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    console.log('🔍 [AppRoutes] Path segments:', pathSegments);
    console.log('🔍 [AppRoutes] First segment:', pathSegments[0]);
    console.log('🔍 [AppRoutes] Second segment:', pathSegments[1]);
    console.log('🔍 [AppRoutes] Third segment:', pathSegments[2]);
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
      {/* Test order routes outside ProtectedRoute */}
      <Route
        path="/orders-simple/:id"
        element={
          <div style={{ padding: '50px', background: 'magenta', color: 'white', minHeight: '100vh' }}>
            <h1>SIMPLE ORDER DETAIL ROUTE!</h1>
            <p>Order ID: {typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : 'N/A'}</p>
            <p>This route is OUTSIDE ProtectedRoute wrapper</p>
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

        {/* Test route at same level to verify nested routing works */}
        <Route
          path="test-route"
          element={
            <div style={{ padding: '20px', background: 'purple', color: 'white', position: 'fixed', top: '10px', right: '10px', zIndex: 9999 }}>
              <h1>TEST ROUTE WORKING!</h1>
              <p>If you can see this, basic routing is functional</p>
            </div>
          }
        />

        {/* Orders routes - test with different approach */}
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/test" element={
          <div style={{ padding: '50px', background: 'cyan', color: 'white', minHeight: '100vh' }}>
            <h1>ORDERS/TEST ROUTE!</h1>
            <p>Simple test for orders route structure</p>
          </div>
        } />
        <Route path="orders/new" element={<OrderDetailPage />} />

        {/* Try without ProtectedRoute to see if it's an auth issue */}
        <Route path="orders/public/:id" element={
          <div style={{ padding: '50px', background: 'orange', color: 'white', minHeight: '100vh' }}>
            <h1>PUBLIC ORDER DETAIL!</h1>
            <p>Order ID: {typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : 'N/A'}</p>
            <p>Current path: {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</p>
          </div>
        } />

        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="orders/:id/edit" element={<OrderDetailPage />} />

        {/* Debug route for testing order detail - with absolute path */}
        <Route
          path="/orders/debug/:id"
          element={
            <div style={{ padding: '50px', background: 'red', color: 'white', minHeight: '100vh' }}>
              <h1>ABSOLUTE DEBUG ROUTE WORKING!</h1>
              <p>Order ID: {typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : 'N/A'}</p>
              <p>Full Path: {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</p>
              <button onClick={() => alert('Route clicked!')}>Click Me</button>
            </div>
          }
        />

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

              {/* Catch all route - redirect to 404 page */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};