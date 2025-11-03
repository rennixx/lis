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
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';

// Not found page
import { NotFoundPage } from '@/pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
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

        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};