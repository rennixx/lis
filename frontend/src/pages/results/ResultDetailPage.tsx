import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  FileText,
  TestTube,
  User,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Printer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { resultService } from '@/api/services/ResultService';
import { useQueryClient } from '@tanstack/react-query';

export const ResultDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDownloadingPDF, setIsDownloadingPDF] = React.useState(false);

  // Fetch result data
  const { data: result, isLoading, error } = useQuery({
    queryKey: ['result', id],
    queryFn: () => id ? resultService.getResult(id) : Promise.reject('No ID provided'),
    enabled: !!id,
  });

  const handleBack = () => {
    navigate('/results');
  };

  const handleDownloadPDF = async () => {
    if (!result) return;

    setIsDownloadingPDF(true);
    try {
      // Try to download PDF
      const blob = await resultService.downloadResultPDF(result._id);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Result_${result.testCode || result.testName}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ PDF downloaded successfully');
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handlePrint = async () => {
    if (!result) return;

    try {
      // Get PDF URL for viewing
      const pdfUrl = await resultService.viewResultPDF(result._id);

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
      console.error('❌ Error printing PDF:', error);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <button className="btn btn-ghost mr-4" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Results
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Loading Result...
            </h1>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-300 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-300 rounded w-full"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <button className="btn btn-ghost mr-4" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Results
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Test Result Details
            </h1>
            <p className="text-gray-600 mt-2">
              Result ID: {id}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Result Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Result Not Found
                </h3>
                <p className="text-gray-600">
                  {error instanceof Error ? error.message : 'No test result data available.'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TestTube className="h-5 w-5 mr-2" />
                Test Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Test Information
                </h3>
                <p className="text-gray-600">
                  No test details available.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button className="btn btn-ghost mr-4" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Results
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Test Result Details
            </h1>
            <p className="text-gray-600 mt-2">
              Result ID: {result._id}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF}
            className="text-teal-600 border-teal-300 hover:bg-teal-50"
          >
            {isDownloadingPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600 mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="text-teal-600 border-teal-300 hover:bg-teal-50"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Result Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Result Information
              </div>
              <Badge className={getStatusColor(result.status)}>
                <span className="flex items-center">
                  {getStatusIcon(result.status)}
                  <span className="ml-1 capitalize">{result.status}</span>
                </span>
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Test Name</label>
                <p className="text-lg font-semibold text-gray-900">{result.testName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Test Code</label>
                <p className="text-lg font-semibold text-gray-900">{result.testCode || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Result Value</label>
                <p className="text-2xl font-bold text-gray-900">
                  {result.value || 'N/A'} {result.unit || ''}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Reference Range</label>
                <p className="text-lg font-semibold text-gray-900">{result.referenceRange || 'N/A'}</p>
              </div>
            </div>

            {result.isAbnormal && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">Abnormal Result</span>
                </div>
              </div>
            )}

            {result.criticalValue && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-700 mr-2" />
                  <span className="text-red-900 font-bold">CRITICAL VALUE</span>
                </div>
              </div>
            )}

            {result.notes && (
              <div>
                <label className="text-sm font-medium text-gray-600">Notes</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{result.notes}</p>
              </div>
            )}

            {result.comments && (
              <div>
                <label className="text-sm font-medium text-gray-600">Comments</label>
                <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">{result.comments}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient & Test Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Patient Name</label>
                <p className="text-lg font-semibold text-gray-900">{result.patientName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">MRN</label>
                <p className="text-lg font-semibold text-gray-900">{result.patientMRN || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Order Number</label>
                <p className="text-lg font-semibold text-gray-900">{result.orderNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Specimen Type</label>
                <p className="text-lg font-semibold text-gray-900">{result.specimenType || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Collection Date</label>
                <p className="text-lg font-semibold text-gray-900">
                  {result.collectionDate ? new Date(result.collectionDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Analysis Date</label>
                <p className="text-lg font-semibold text-gray-900">
                  {result.analysisDate ? new Date(result.analysisDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Entered By</label>
                <p className="text-lg font-semibold text-gray-900">{result.enteredByUser || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Verified By</label>
                <p className="text-lg font-semibold text-gray-900">{result.verifiedByUser || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Equipment</label>
                <p className="text-lg font-semibold text-gray-900">{result.equipment || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Method</label>
                <p className="text-lg font-semibold text-gray-900">{result.method || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Timestamps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Created At</label>
                <p className="text-gray-900">{new Date(result.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Updated At</label>
                <p className="text-gray-900">{new Date(result.updatedAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Verification Date</label>
                <p className="text-gray-900">
                  {result.verificationDate ? new Date(result.verificationDate).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Turnaround Time</label>
                <p className="text-gray-900">{result.turnaroundTime ? `${result.turnaroundTime} min` : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};