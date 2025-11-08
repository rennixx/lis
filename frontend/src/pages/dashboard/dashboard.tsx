import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/providers/auth-provider'
import { useQuery } from '@tanstack/react-query'
import { STORAGE_KEYS } from '@/utils/constants'
import {
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  DollarSign,
  Clock
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'

// Analytics types
interface DashboardMetrics {
  today: {
    patients: number
    orders: number
    results: number
    revenue: number
    pendingTests: number
    urgentTests: number
    criticalResults: number
  }
  recentOrders: Array<{
    _id: string
    orderNumber: string
    patient: { firstName: string, lastName: string }
    tests: Array<{ testName: string, testCode: string }>
    status: string
    createdAt: string
  }>
  testTimeline: Array<{
    _id: string
    completed: number
    pending: number
  }>
  popularTests: Array<{
    _id: string
    count: number
    revenue: number
  }>
  monthlyRevenue: Array<{
    _id: string
    revenue: number
    orders: number
  }>
  technicianProductivity: Array<{
    name: string
    completed: number
    verified: number
    efficiency: number
  }>
}

// API service
const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  const response = await fetch('/api/v1/analytics/dashboard', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard metrics')
  }

  const result = await response.json()
  return result.data
}

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function DashboardPage() {
  const { user } = useAuth()

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: fetchDashboardMetrics,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 2,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-red-600">Failed to load analytics. Please try again.</p>
        </div>
      </div>
    )
  }

  const todayMetrics = metrics?.today || {
    patients: 0,
    orders: 0,
    results: 0,
    revenue: 0,
    pendingTests: 0,
    urgentTests: 0,
    criticalResults: 0
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.full_name}! Here's your laboratory overview.
        </p>
      </div>

      {/* Today's Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Patients</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{todayMetrics.patients || 0}</div>
            <p className="text-xs text-blue-600">
              Registered today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Orders</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{todayMetrics.orders || 0}</div>
            <p className="text-xs text-green-600">
              Test orders created
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Tests</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{todayMetrics.pendingTests || 0}</div>
            <p className="text-xs text-orange-600">
              Awaiting results
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">${(todayMetrics.revenue || 0).toFixed(2)}</div>
            <p className="text-xs text-emerald-600">
              From test orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Items */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Urgent Tests</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{todayMetrics.urgentTests || 0}</div>
            <p className="text-xs text-red-600">
              High priority tests pending
            </p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Critical Results</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{todayMetrics.criticalResults || 0}</div>
            <p className="text-xs text-orange-600">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Test Completion Timeline */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Test Completion Timeline</CardTitle>
            <CardDescription className="text-gray-600">
              Last 30 days test completion trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics?.testTimeline || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Popular Tests Pie Chart */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Popular Tests</CardTitle>
            <CardDescription className="text-gray-600">
              Most ordered tests (last 30 days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics?.popularTests?.slice(0, 6) || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(metrics?.popularTests?.slice(0, 6) || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Trend */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Monthly Revenue Trend</CardTitle>
          <CardDescription className="text-gray-600">
            Revenue performance over the last 12 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics?.monthlyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders and Technician Productivity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Orders */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Recent Orders</CardTitle>
            <CardDescription className="text-gray-600">
              Latest test orders from the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.recentOrders?.slice(0, 5).map((order) => (
                <div key={order._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-600">
                      {order.patient?.firstName} {order.patient?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.tests?.[0]?.testName} {order.tests?.length > 1 && `+${order.tests.length - 1} more`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              )) || (
                <p className="text-sm text-gray-500">No recent orders found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Technician Productivity */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Technician Productivity</CardTitle>
            <CardDescription className="text-gray-600">
              Top performers (last 30 days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.technicianProductivity?.slice(0, 5).map((tech, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{tech.name}</p>
                    <p className="text-xs text-gray-600">
                      {tech.completed} completed, {tech.verified} verified
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">{tech.efficiency.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">efficiency</p>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-gray-500">No productivity data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}