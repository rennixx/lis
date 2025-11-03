import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Edit,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Download,
  Printer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useResults, useCriticalResults, useAbnormalResults } from '../../api/hooks/index';
import { resultService } from '@/api/services/ResultService';
import { useQueryClient } from '@tanstack/react-query';

export const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // *next phase, please go through carefully because it might have errors. what you gonna do based on the created backend you gonna add it, if not we will run into errors. make sure the endpoints are correct.
  // State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [loadingResultIds, setLoadingResultIds] = React.useState<Set<string>>(new Set());

  // API hooks
  const { data: resultsData, isLoading } = useResults({
    search: searchQuery,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    limit: 20
  });

  const { data: criticalResults } = useCriticalResults();
  const { data: abnormalResults } = useAbnormalResults(10);

  // Navigation functions
  const navigateToResultEntry = () => {
    navigate('/results/entry');
  };

  const navigateToResultDetail = (resultId: string) => {
    navigate(`/results/${resultId}`);
  };

  // PDF generation functions
  const handleDownloadResultPDF = async (resultId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click navigation

    setLoadingResultIds(prev => new Set(prev).add(resultId));
    try {
      const blob = await resultService.downloadResultPDF(resultId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Result_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Result PDF downloaded successfully');
    } catch (error) {
      console.error('❌ Error downloading result PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setLoadingResultIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(resultId);
        return newSet;
      });
    }
  };

  const handlePrintResultPDF = async (resultId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click navigation

    try {
      const pdfUrl = await resultService.viewResultPDF(resultId);

      // Open PDF in new window for printing
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        alert('Failed to open print window. Please check your popup settings.');
      }
    } catch (error) {
      console.error('❌ Error printing result PDF:', error);
      alert('Failed to prepare PDF for printing. Please try again.');
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle2 className="h-4 w-4" />;
      case 'completed': return <Activity className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Test Results
          </h1>
          <p className="text-gray-600 mt-2">
            Review and manage test results
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => navigate('/results/verify')}
            variant="outline"
            className="text-teal-600 border-teal-300 hover:bg-teal-50"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Verify Results
          </Button>
          <Button
            onClick={navigateToResultEntry}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Enter Results
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Results</p>
                <p className="text-2xl font-bold text-gray-900">
                  {resultsData?.pagination?.total || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {criticalResults?.length || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Abnormal</p>
                <p className="text-2xl font-bold text-orange-600">
                  {abnormalResults?.length || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {resultsData?.data?.filter((r: any) => r.status === 'pending').length || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search results by patient name or test..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
              <Button
                onClick={navigateToResultEntry}
                variant="outline"
                className="text-teal-600 border-teal-300 hover:bg-teal-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Enter New Results
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Recent Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 border rounded-lg bg-gray-50 animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : !resultsData?.data || resultsData.data.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No results found
              </h3>
              <p className="text-gray-600 mb-4">
                Start by entering test results for pending orders.
              </p>
              <Button
                onClick={navigateToResultEntry}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Enter Test Results
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {resultsData.data.map((result: any) => (
                <div
                  key={result._id}
                  className="p-4 border rounded-lg hover:border-teal-500 hover:bg-teal-50 cursor-pointer transition-colors"
                  onClick={() => navigateToResultDetail(result._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">
                          {result.testName || 'Test Result'}
                        </h3>
                        <Badge className={getStatusColor(result.status)}>
                          <span className="flex items-center">
                            {getStatusIcon(result.status)}
                            <span className="ml-1 capitalize">{result.status}</span>
                          </span>
                        </Badge>
                        {result.isAbnormal && (
                          <Badge variant="destructive" className="text-xs">
                            Abnormal
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {result.patientName || 'Patient'}
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">Value:</span>
                          <span className="ml-1">{result.value || 'N/A'}</span>
                          {result.unit && <span className="ml-1">{result.unit}</span>}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(result.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {result.notes && (
                        <p className="text-sm text-gray-500 mt-1">{result.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleDownloadResultPDF(result._id, e)}
                        disabled={loadingResultIds.has(result._id)}
                        className="text-teal-600 border-teal-300 hover:bg-teal-50"
                      >
                        {loadingResultIds.has(result._id) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handlePrintResultPDF(result._id, e)}
                        className="text-teal-600 border-teal-300 hover:bg-teal-50"
                      >
                        <Printer className="h-4 w-4" />
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
  );
};