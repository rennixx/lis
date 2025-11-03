import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { ProtectedRoute } from '@/components/common/protected-route' // commented to expose UI without auth
import { Layout } from '@/components/layout/layout'
import { LoginPage } from '@/pages/auth/login'
import { RegisterPage } from '@/pages/auth/register'
import { DashboardPage } from '@/pages/dashboard/dashboard'
import { PatientsPage } from '@/pages/patients/patients'
import { TestsPage } from '@/pages/tests/tests'
import { ResultsPage } from '@/pages/results/ResultsPage'
import { ResultEntryPage } from '@/pages/results/ResultEntryPage'
import { ResultVerificationPage } from '@/pages/results/ResultVerificationPage'
import { ReportsPage } from '@/pages/reports/ReportsPage'
import { SamplesPage } from '@/pages/samples/samples'
import { SampleCollectionPage } from '@/pages/samples/SampleCollectionPage'
import { AppointmentsPage } from '@/pages/appointments/appointments'
import { UsersPage } from '@/pages/users/users'
import { OrdersPage } from '@/pages/orders/orders'
import { OrderCreationPage } from '@/pages/orders/OrderCreationPage'
import { NotFoundPage } from '@/pages/not-found'
import { AuthProvider } from '@/providers/auth-provider' // commented to expose UI without auth
import { ThemeProvider } from '@/providers/theme-provider'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
})

// Wrapper for authenticated routes
const AuthenticatedLayout = () => (
  <Layout />
)

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/",
    element: (
      <ThemeProvider defaultTheme="light" storageKey="lis-ui-theme">
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <ProtectedRoute>
              <AuthenticatedLayout />
            </ProtectedRoute>
            <Toaster />
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    ),
    children: [
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "patients",
        element: <PatientsPage />,
      },
      {
        path: "orders",
        element: <OrdersPage />,
      },
      {
        path: "orders/create",
        element: <OrderCreationPage />,
      },
      {
        path: "tests",
        element: <TestsPage />,
      },
      {
        path: "results",
        element: <ResultsPage />,
      },
      {
        path: "results/entry",
        element: <ResultEntryPage />,
      },
      {
        path: "results/verify",
        element: <ResultVerificationPage />,
      },
      {
        path: "reports",
        element: <ReportsPage />,
      },
      {
        path: "samples",
        element: <SamplesPage />,
      },
      {
        path: "samples/collection",
        element: <SampleCollectionPage />,
      },
      {
        path: "appointments",
        element: <AppointmentsPage />,
      },
      {
        path: "users",
        element: (
          // If you need to view the users page without role check, comment ProtectedRoute here as well
          // <ProtectedRoute requiredRole="admin">
            <UsersPage />
          // </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/login",
    element: (
      <ThemeProvider defaultTheme="light" storageKey="lis-ui-theme">
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <LoginPage />
            <Toaster />
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    ),
  },
  {
    path: "/register",
    element: (
      <ThemeProvider defaultTheme="light" storageKey="lis-ui-theme">
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <RegisterPage />
            <Toaster />
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    ),
  },
  {
    path: "*",
    element: (
      <ThemeProvider defaultTheme="light" storageKey="lis-ui-theme">
        {/* <AuthProvider> */}
          <QueryClientProvider client={queryClient}>
            <NotFoundPage />
            <Toaster />
          </QueryClientProvider>
        {/* </AuthProvider> */}
      </ThemeProvider>
    ),
  },
])

export function AppRoutes() {
  return <RouterProvider router={router} />
}