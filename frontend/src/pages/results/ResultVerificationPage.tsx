import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  User,
  Calendar,
  Clock,
  FileText,
  Search,
  Filter,
  Eye,
  Edit,
  CheckSquare,
  XSquare,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useResultsForReview,
  useVerifyResult,
  useBulkVerifyResults,
  useRejectResult,
  useBulkRejectResults,
  useCriticalResults,
  useUpdateResult
} from '../../api/hooks/index';

interface ResultForVerification {
  _id: string;
  status: string;
  value: any;
  unit?: string;
  isAbnormal: boolean;
  criticalValue: boolean;
  analysisDate: string;
  createdAt: string;
  notes?: string;
  test: any;
  patient: any;
  order: any;
  enteredBy: any;
  verifiedBy?: any;
  verifiedByUser?: string;
  verificationDate?: string;
}

export const ResultVerificationPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [viewingResult, setViewingResult] = useState<ResultForVerification | null>(null);
  const [editingResult, setEditingResult] = useState<ResultForVerification | null>(null);
  const [editValue, setEditValue] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [rejectionResultId, setRejectionResultId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // API hooks
  const { data: reviewData, isLoading: reviewLoading, refetch: refetchReview } = useResultsForReview(50);
  const { data: criticalData } = useCriticalResults();

  const verifyMutation = useVerifyResult();
  const bulkVerifyMutation = useBulkVerifyResults();
  const rejectMutation = useRejectResult();
  const bulkRejectMutation = useBulkRejectResults();
  const updateMutation = useUpdateResult();

  // Filter results based on search and category
  const filteredResults = React.useMemo(() => {
    if (!reviewData) return [];

    return reviewData.filter((result: any) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          result.patient.firstName.toLowerCase().includes(query) ||
          result.patient.lastName.toLowerCase().includes(query) ||
          result.test.name.toLowerCase().includes(query) ||
          result.order.orderNumber.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && result.test.category !== selectedCategory) {
        return false;
      }

      // Critical only filter
      if (showCriticalOnly && !result.criticalValue) {
        return false;
      }

      return true;
    });
  }, [reviewData, searchQuery, selectedCategory, showCriticalOnly]);

  // Get unique categories
  const categories = React.useMemo(() => {
    if (!reviewData) return [];
    const cats = [...new Set(reviewData.map((r: any) => r.test?.category).filter(Boolean))];
    return ['all', ...cats];
  }, [reviewData]);

  // Selection handlers
  const handleSelectResult = (resultId: string) => {
    setSelectedResults(prev =>
      prev.includes(resultId)
        ? prev.filter(id => id !== resultId)
        : [...prev, resultId]
    );
  };

  const handleSelectAll = () => {
    if (selectedResults.length === filteredResults.length) {
      setSelectedResults([]);
    } else {
      setSelectedResults(filteredResults.map((r: any) => r._id));
    }
  };

  // Verification handlers
  const handleVerifyResult = async (resultId: string) => {
    try {
      await verifyMutation.mutateAsync(resultId);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to verify result:', error);
    }
  };

  const handleBulkVerify = async () => {
    if (selectedResults.length === 0) return;

    try {
      await bulkVerifyMutation.mutateAsync(selectedResults);
      setSelectedResults([]);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to bulk verify results:', error);
    }
  };

  // Rejection handlers
  const handleRejectResult = async (resultId: string, reason: string) => {
    try {
      await rejectMutation.mutateAsync({ id: resultId, reason });
      setShowRejectionDialog(false);
      setRejectionReason('');
      setRejectionResultId(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to reject result:', error);
    }
  };

  const handleBulkReject = async () => {
    if (selectedResults.length === 0) return;

    try {
      await bulkRejectMutation.mutateAsync({
        resultIds: selectedResults,
        reason: rejectionReason || 'Batch rejection'
      });
      setSelectedResults([]);
      setRejectionReason('');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to bulk reject results:', error);
    }
  };

  // Edit handlers
  const handleEditResult = (result: any) => {
    setEditingResult(result);
    setEditValue(result.value?.toString() || '');
  };

  const handleSaveEdit = async () => {
    if (!editingResult) return;

    try {
      await updateMutation.mutateAsync({
        id: editingResult._id,
        data: { value: editValue }
      });
      setEditingResult(null);
      setEditValue('');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to update result:', error);
    }
  };

  // Status helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'requires_review': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (result: any) => {
    if (result.criticalValue) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (result.isAbnormal) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    if (result.status === 'requires_review') return <Clock className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
  };

  const isAbnormal = (result: any) => {
    if (!result.test.normalRange || !result.value) return false;
    const numValue = parseFloat(result.value);
    if (isNaN(numValue)) return false;
    const { min, max } = result.test.normalRange;
    if (min !== undefined && numValue < min) return true;
    if (max !== undefined && numValue > max) return true;
    return false;
  };

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
                <h1 className="text-2xl font-bold text-gray-900">Result Verification</h1>
                <p className="text-gray-600">Review and verify test results</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-sm">
                {filteredResults.length} for Review
              </Badge>
              {(criticalData && criticalData.length > 0) && (
                <Badge variant="destructive" className="text-sm">
                  {criticalData.length} Critical
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by patient, test, or order number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
                <Button
                  variant={showCriticalOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowCriticalOnly(!showCriticalOnly)}
                  className={showCriticalOnly ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Critical Only
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedResults.length > 0 && (
          <Card className="mb-6 border-teal-200 bg-teal-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-teal-800">
                    {selectedResults.length} result{selectedResults.length > 1 ? 's' : ''} selected
                  </span>
                  <Button
                    size="sm"
                    onClick={handleBulkVerify}
                    disabled={bulkVerifyMutation.isPending}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Verify All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowRejectionDialog(true)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XSquare className="h-4 w-4 mr-2" />
                    Reject All
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedResults([])}
                >
                  Clear Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Results List - Left Side */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Results for Verification
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedResults.length === filteredResults.length && filteredResults.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-gray-600">Select All</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {reviewLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="p-4 border rounded-lg bg-gray-50 animate-pulse">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredResults.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No results found
                    </h3>
                    <p className="text-gray-600">
                      All results are up to date!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredResults.map((result: any) => (
                      <div
                        key={result._id}
                        className={`p-4 border rounded-lg hover:border-teal-500 transition-colors ${
                          selectedResults.includes(result._id) ? 'bg-teal-50 border-teal-500' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <Checkbox
                              checked={selectedResults.includes(result._id)}
                              onCheckedChange={() => handleSelectResult(result._id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-medium text-gray-900">
                                  {result.test.name}
                                </h3>
                                {getPriorityIcon(result)}
                                <Badge className={getStatusColor(result.status)}>
                                  {result.status}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {result.test.category}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                                <div className="flex items-center">
                                  <User className="h-4 w-4 mr-1" />
                                  {result.patient.firstName} {result.patient.lastName}
                                </div>
                                <div className="flex items-center">
                                  <FileText className="h-4 w-4 mr-1" />
                                  {result.order.orderNumber}
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {new Date(result.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {new Date(result.analysisDate).toLocaleTimeString()}
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center">
                                    <span className="font-medium">Value:</span>
                                    <span className={`ml-2 font-bold ${
                                      isAbnormal(result) ? 'text-orange-600' : 'text-gray-900'
                                    }`}>
                                      {result.value} {result.unit || result.test.unit}
                                    </span>
                                  </div>
                                  {result.test.normalRange && (
                                    <span className="text-sm text-gray-500">
                                      (Ref: {result.test.normalRange.min}-{result.test.normalRange.max})
                                    </span>
                                  )}
                                </div>

                                <div className="text-xs text-gray-500">
                                  by {result.enteredBy.firstName} {result.enteredBy.lastName}
                                </div>
                              </div>

                              {result.notes && (
                                <p className="text-sm text-gray-500 mt-2">{result.notes}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setViewingResult(result)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Result Details</DialogTitle>
                                </DialogHeader>
                                {viewingResult && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Patient</label>
                                        <p className="text-gray-900">
                                          {viewingResult.patient.firstName} {viewingResult.patient.lastName}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Order</label>
                                        <p className="text-gray-900">{viewingResult.order.orderNumber}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Test</label>
                                        <p className="text-gray-900">{viewingResult.test.name}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Category</label>
                                        <p className="text-gray-900">{viewingResult.test.category}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Value</label>
                                        <p className={`font-bold ${
                                          isAbnormal(viewingResult) ? 'text-orange-600' : 'text-gray-900'
                                        }`}>
                                          {viewingResult.value} {viewingResult.unit || viewingResult.test.unit}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Status</label>
                                        <Badge className={getStatusColor(viewingResult.status)}>
                                          {viewingResult.status}
                                        </Badge>
                                      </div>
                                    </div>
                                    {viewingResult.test.normalRange && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Reference Range</label>
                                        <p className="text-gray-900">
                                          {viewingResult.test.normalRange.min} - {viewingResult.test.normalRange.max}
                                        </p>
                                      </div>
                                    )}
                                    {viewingResult.notes && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Notes</label>
                                        <p className="text-gray-900">{viewingResult.notes}</p>
                                      </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Entered by</label>
                                        <p>
                                          {viewingResult.enteredBy.firstName} {viewingResult.enteredBy.lastName}
                                          ({viewingResult.enteredBy.email})
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Analysis Date</label>
                                        <p>{new Date(viewingResult.analysisDate).toLocaleString()}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditResult(result)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => handleVerifyResult(result._id)}
                              disabled={verifyMutation.isPending}
                              className="bg-teal-600 hover:bg-teal-700"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Verify
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRejectionResultId(result._id);
                                setShowRejectionDialog(true);
                              }}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Side */}
          <div className="lg:col-span-1">
            {/* Critical Alerts */}
            {(criticalData && criticalData.length > 0) && (
              <Card className="mb-6 border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-800">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Critical Values Alert
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {criticalData.slice(0, 3).map((result: any) => (
                      <div key={result._id} className="p-3 bg-white border border-red-200 rounded">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {result.testName || 'Test Result'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {result.patientName || 'Patient'}
                            </p>
                            <p className="text-xs font-bold text-red-600">
                              {result.value} {result.unit}
                            </p>
                          </div>
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        </div>
                      </div>
                    ))}
                    {criticalData.length > 3 && (
                      <p className="text-xs text-red-600 text-center mt-2">
                        +{criticalData.length - 3} more critical results
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Verification Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending Review</span>
                    <span className="font-medium text-blue-600">{filteredResults.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Selected</span>
                    <span className="font-medium text-teal-600">{selectedResults.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Critical Values</span>
                    <span className="font-medium text-red-600">
                      {filteredResults.filter((r: any) => r.criticalValue).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Abnormal</span>
                    <span className="font-medium text-orange-600">
                      {filteredResults.filter((r: any) => isAbnormal(r)).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Verification Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2 text-gray-600">
                <p>• Review all result values against reference ranges</p>
                <p>• Pay special attention to critical values (red alerts)</p>
                <p>• Verify abnormal results carefully</p>
                <p>• Use batch verification for multiple routine results</p>
                <p>• Always provide reason for rejection</p>
                <p>• Edit results only when necessary</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Result Dialog */}
      <Dialog open={!!editingResult} onOpenChange={(open) => !open && setEditingResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Result Value</DialogTitle>
          </DialogHeader>
          {editingResult && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Test</label>
                <p className="text-gray-900">{editingResult.test.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Patient</label>
                <p className="text-gray-900">
                  {editingResult.patient.firstName} {editingResult.patient.lastName}
                </p>
              </div>
              {editingResult.test.normalRange && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Reference Range</label>
                  <p className="text-gray-900">
                    {editingResult.test.normalRange.min} - {editingResult.test.normalRange.max}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700">Current Value</label>
                <p className="font-bold text-gray-900">
                  {editingResult.value} {editingResult.unit || editingResult.test.unit}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">New Value</label>
                <Input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Enter new value"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingResult(null);
                    setEditValue('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending || !editValue}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {rejectionResultId ? 'Reject Result' : 'Bulk Reject Results'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Rejection Reason</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectionDialog(false);
                  setRejectionReason('');
                  setRejectionResultId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (rejectionResultId) {
                    handleRejectResult(rejectionResultId, rejectionReason);
                  } else {
                    handleBulkReject();
                  }
                }}
                disabled={rejectMutation.isPending || bulkRejectMutation.isPending || !rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};