import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Filter,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
  TrendingUp,
  Activity,
  Calendar,
  Tag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePendingTests, useOrders, useBulkCreateResults, useResultsForReview } from '../../api/hooks/index';
import { ResultEntryForm } from '@/components/results/ResultEntryForm';

interface PendingOrder {
  _id: string;
  orderNumber: string;
  priority: 'routine' | 'urgent' | 'stat' | 'critical';
  createdAt: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    patientId: string;
  };
  pendingTests: Array<{
    test: {
      _id: string;
      name: string;
      code: string;
      category: string;
      normalRange?: any;
      unit?: string;
    };
    price: number;
  }>;
}

export const ResultEntryPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'urgent' | 'critical' | 'stat'>('all');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get pending orders that need result entry
  const { data: ordersData, isLoading: ordersLoading } = useOrders({
    status: 'sample_collected',
    search: searchQuery,
    limit: 50
  });

  // Get results for review queue
  const { data: reviewData, isLoading: reviewLoading } = useResultsForReview(20);

  // Bulk create results mutation
  const createResultsMutation = useBulkCreateResults();

  // Process orders to get pending tests
  const pendingOrders = React.useMemo(() => {
    if (!ordersData?.orders) return [];

    return ordersData.orders
      .filter((order: any) => order.status === 'sample_collected')
      .map((order: any) => ({
        _id: order._id,
        orderNumber: order.orderNumber || `ORD-${order._id.slice(-6)}`,
        priority: order.priority || 'routine',
        createdAt: order.createdAt,
        patient: order.patient || {
          _id: 'unknown',
          firstName: 'Unknown',
          lastName: 'Patient',
          patientId: 'N/A'
        }
      }));
  }, [ordersData]);

  // Filter orders based on priority
  const filteredOrders = React.useMemo(() => {
    if (selectedFilter === 'all') return pendingOrders;
    return pendingOrders.filter((order: any) => order.priority === selectedFilter);
  }, [pendingOrders, selectedFilter]);

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'stat': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertCircle className="h-4 w-4" />;
      case 'urgent': return <AlertTriangle className="h-4 w-4" />;
      case 'stat': return <Activity className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrder(orderId);
    setShowEntryForm(true);
  };

  const handleResultsSubmit = async (results: any[]) => {
    try {
      await createResultsMutation.mutateAsync(results);
      setShowEntryForm(false);
      setSelectedOrder(null);
      setRefreshKey(prev => prev + 1); // Refresh data
    } catch (error) {
      console.error('Failed to save results:', error);
    }
  };

  const handleBack = () => {
    if (showEntryForm) {
      setShowEntryForm(false);
      setSelectedOrder(null);
    } else {
      navigate('/results');
    }
  };

  // Show entry form if an order is selected
  if (showEntryForm && selectedOrder) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Button variant="ghost" onClick={handleBack} className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Work Queue
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Enter Test Results</h1>
                  <p className="text-gray-600">Enter results for selected tests</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ResultEntryForm
          orderId={selectedOrder}
          onSubmit={handleResultsSubmit}
          onCancel={handleBack}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => navigate('/results')} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Results
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Result Entry Work Queue</h1>
                <p className="text-gray-600">Enter test results for pending orders</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-sm">
                {filteredOrders.length} Pending Orders
              </Badge>
              {(reviewData && reviewData.length > 0) && (
                <Badge variant="secondary" className="text-sm">
                  {reviewData.length} for Review
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search by order number or patient..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={selectedFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFilter('all')}
                      className={selectedFilter === 'all' ? 'bg-teal-600 hover:bg-teal-700' : ''}
                    >
                      All
                    </Button>
                    <Button
                      variant={selectedFilter === 'urgent' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFilter('urgent')}
                      className={selectedFilter === 'urgent' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                    >
                      Urgent
                    </Button>
                    <Button
                      variant={selectedFilter === 'stat' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFilter('stat')}
                      className={selectedFilter === 'stat' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                    >
                      STAT
                    </Button>
                    <Button
                      variant={selectedFilter === 'critical' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFilter('critical')}
                      className={selectedFilter === 'critical' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      Critical
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Orders List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Pending Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 border rounded-lg bg-gray-50 animate-pulse">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No pending orders found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Try adjusting your filters or search terms
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((order: any) => (
                      <div
                        key={order._id}
                        className="p-4 border rounded-lg hover:border-teal-500 hover:bg-teal-50 cursor-pointer transition-colors"
                        onClick={() => handleOrderSelect(order._id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-medium text-gray-900">
                                {order.orderNumber}
                              </h3>
                              <Badge className={getPriorityColor(order.priority)}>
                                <span className="flex items-center">
                                  {getPriorityIcon(order.priority)}
                                  <span className="ml-1 capitalize">{order.priority}</span>
                                </span>
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {order.patient.firstName} {order.patient.lastName}
                              </div>
                              <div className="flex items-center">
                                <Tag className="h-4 w-4 mr-1" />
                                {order.patient.patientId}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(order.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-teal-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Review Queue */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Review Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviewLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded animate-pulse">
                        <div className="h-3 bg-gray-300 rounded w-3/4 mb-1"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : !reviewData || reviewData.length === 0 ? (
                  <p className="text-sm text-gray-600 text-center py-4">
                    No results pending review
                  </p>
                ) : (
                  <div className="space-y-2">
                    {reviewData.slice(0, 5).map((result: any) => (
                      <div key={result._id} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {result.testName || 'Test Result'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {result.patientName || 'Patient'}
                            </p>
                          </div>
                          <Activity className="h-4 w-4 text-yellow-600" />
                        </div>
                      </div>
                    ))}
                    {reviewData.length > 5 && (
                      <p className="text-xs text-gray-500 text-center mt-2">
                        +{reviewData.length - 5} more results
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Pending</span>
                    <span className="font-medium">{filteredOrders.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Critical/Urgent</span>
                    <span className="font-medium text-orange-600">
                      {filteredOrders.filter((o: any) => o.priority === 'critical' || o.priority === 'urgent').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Need Review</span>
                    <span className="font-medium text-yellow-600">
                      {reviewData?.length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};