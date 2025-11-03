import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Search,
  Eye,
  Printer,
  Mail,
  Trash2,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Archive,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { reportService } from '@/api/services/ReportService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Report, ReportStatistics, ReportQueryParams } from '@/types/api.types';

const ReportStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    draft: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Draft' },
    pending_review: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Pending Review' },
    approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' },
    delivered: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Delivered' },
    rejected: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Rejected' },
    archived: { color: 'bg-gray-100 text-gray-600', icon: Archive, label: 'Archived' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

const ReportTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const typeConfig = {
    preliminary: { color: 'bg-purple-100 text-purple-800', label: 'Preliminary' },
    final: { color: 'bg-green-100 text-green-800', label: 'Final' },
    amended: { color: 'bg-orange-100 text-orange-800', label: 'Amended' },
    corrected: { color: 'bg-red-100 text-red-800', label: 'Corrected' },
  };

  const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.final;

  return (
    <Badge className={config.color}>
      {config.label}
    </Badge>
  );
};

// Error Boundary Component
class ReportsErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ReportsPage Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="space-y-6 p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Something went wrong</h3>
                <div className="mt-2 text-sm text-red-700">
                  {this.state.error?.message || 'An unexpected error occurred while loading the reports page.'}
                </div>
                <div className="mt-4">
                  <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ReportsPageContent: React.FC = () => {
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [filters, setFilters] = useState<ReportQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [bulkGenerateDialog, setBulkGenerateDialog] = useState(false);
  const [bulkGenerateOptions, setBulkGenerateOptions] = useState({
    template: 'standard',
    includeBarcode: false,
    includeQR: false,
  });
  const [loadingReportIds, setLoadingReportIds] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();

  // Fetch reports with filters
  const { data: reportsData, isLoading: reportsLoading, error: reportsError } = useQuery({
    queryKey: ['reports', filters],
    queryFn: () => reportService.getReports(filters),
    placeholderData: { success: true, message: '', data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }
  });

  // Fetch statistics
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['report-statistics'],
    queryFn: () => reportService.getReportStatistics(),
    placeholderData: {
      total: 0,
      draft: 0,
      pendingReview: 0,
      approved: 0,
      delivered: 0,
      rejected: 0,
      archived: 0,
      byType: { preliminary: 0, final: 0, amended: 0, corrected: 0 },
      generatedToday: 0,
      pdfGenerated: 0
    }
  });

  // Debug: Log statistics data
  console.log('📊 [REPORTS PAGE] statistics data:', statistics);
  console.log('📊 [REPORTS PAGE] statsLoading:', statsLoading);

  const reports = Array.isArray(reportsData?.data) ? reportsData.data : [];
  const pagination = reportsData?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  };

  // Debug: Log the actual data structure
  console.log('📊 [REPORTS PAGE] reportsData:', reportsData);
  console.log('📊 [REPORTS PAGE] reports:', reports);
  console.log('📊 [REPORTS PAGE] pagination:', pagination);

  // Add error boundary to catch any runtime errors
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Runtime error in ReportsPage:', event.error);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const handleSearch = () => {
    setFilters({
      ...filters,
      search: searchQuery,
      dateFrom: dateRange.from || undefined,
      dateTo: dateRange.to || undefined,
      page: 1
    });
  };

  const handleSelectReport = (reportId: string, checked: boolean) => {
    if (checked) {
      setSelectedReports([...selectedReports, reportId]);
    } else {
      setSelectedReports(selectedReports.filter(id => id !== reportId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReports(reports.map(report => report._id));
    } else {
      setSelectedReports([]);
    }
  };

  const downloadPDFMutation = useMutation({
    mutationFn: ({ reportId }: { reportId: string }) =>
      reportService.downloadPDF(reportId),
    onSuccess: (data, variables) => {
      const url = window.URL.createObjectURL(data.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  });

  const handleViewPDF = async (reportId: string) => {
    try {
      const pdfUrl = await reportService.viewPDF(reportId);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error viewing PDF:', error);
    }
  };

  const handleDownloadPDF = async (reportId: string, filename?: string) => {
    downloadPDFMutation.mutate({ reportId });
  };

  const handlePrintPDF = async (reportId: string) => {
    try {
      await reportService.printReport(reportId);
    } catch (error) {
      console.error('Error printing report:', error);
    }
  };

  const handleGeneratePDF = async (reportId: string) => {
    try {
      // Add to loading set
      setLoadingReportIds(prev => new Set(prev).add(reportId));

      // Generate PDF for this specific report
      await reportService.generatePDF(reportId);

      // Show success message and refresh data
      queryClient.invalidateQueries({ queryKey: ['reports'] });

      // Show success toast or alert
      alert('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      // Remove from loading set
      setLoadingReportIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const handlePageChange = (page: number) => {
    setFilters({
      ...filters,
      page
    });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['reports'] });
    queryClient.invalidateQueries({ queryKey: ['report-statistics'] });
  };

  if (reportsError) {
    return (
      <div className="space-y-6 p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading reports</h3>
              <div className="mt-2 text-sm text-red-700">{reportsError instanceof Error ? reportsError.message : 'Unknown error'}</div>
              <div className="mt-4">
                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage and generate laboratory reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {selectedReports.length > 0 && (
            <Button
              onClick={() => setBulkGenerateDialog(true)}
              variant="outline"
              className="bg-teal-600 text-white hover:bg-teal-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate PDFs ({selectedReports.length})
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics?.approved || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics?.pendingReview || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Download className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">PDFs Generated</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics?.pdfGenerated || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by report number, patient name, MRN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearch} className="bg-teal-600 hover:bg-teal-700">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Date Range */}
            <div className="flex-1">
              <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                />
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-48">
              <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters(prev => ({
                  ...prev,
                  status: value === 'all' ? undefined : value,
                  page: 1
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="w-full lg:w-48">
              <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </Label>
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) => setFilters(prev => ({
                  ...prev,
                  type: value === 'all' ? undefined : value,
                  page: 1
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="preliminary">Preliminary</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="amended">Amended</SelectItem>
                  <SelectItem value="corrected">Corrected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No reports found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedReports.length === reports.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Report Number</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>PDF</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedReports.includes(report._id)}
                          onCheckedChange={(checked) => handleSelectReport(report._id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{report.reportNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{report.patientName}</div>
                          <div className="text-sm text-gray-500">{report.patientMRN}</div>
                        </div>
                      </TableCell>
                      <TableCell>{report.doctorName}</TableCell>
                      <TableCell>
                        <ReportTypeBadge type={report.type} />
                      </TableCell>
                      <TableCell>
                        <ReportStatusBadge status={report.status} />
                      </TableCell>
                      <TableCell>
                        {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {report.pdfFileId ? (
                          <Badge className="bg-green-100 text-green-800">Available</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600">Not Generated</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {report.pdfFileId ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewPDF(report._id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownloadPDF(report._id, report.pdfFileName || undefined)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlePrintPDF(report._id)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGeneratePDF(report._id)}
                              disabled={loadingReportIds.has(report._id)}
                            >
                              {loadingReportIds.has(report._id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                              Generate PDF
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} reports
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <span className="px-3 py-1 text-sm">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bulk Generate Dialog */}
      <Dialog open={bulkGenerateDialog} onOpenChange={setBulkGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate PDF Reports</DialogTitle>
            <DialogDescription>
              Generate PDF reports for {selectedReports.length} selected reports.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template</Label>
              <Select
                value={bulkGenerateOptions.template}
                onValueChange={(value) => setBulkGenerateOptions(prev => ({ ...prev, template: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Checkbox
                id="includeBarcode"
                checked={bulkGenerateOptions.includeBarcode}
                onCheckedChange={(checked) => setBulkGenerateOptions(prev => ({ ...prev, includeBarcode: checked as boolean }))}
              />
              <Label htmlFor="includeBarcode">Include Barcode</Label>
            </div>
            <div className="space-y-2">
              <Checkbox
                id="includeQR"
                checked={bulkGenerateOptions.includeQR}
                onCheckedChange={(checked) => setBulkGenerateOptions(prev => ({ ...prev, includeQR: checked as boolean }))}
              />
              <Label htmlFor="includeQR">Include QR Code</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBulkGenerateDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => {
                console.log('Bulk generate:', selectedReports, bulkGenerateOptions);
                alert('Bulk PDF generation will be implemented when backend is connected');
                setBulkGenerateDialog(false);
              }}
            >
              Generate PDFs
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Main export wrapped with error boundary
export const ReportsPage: React.FC = () => (
  <ReportsErrorBoundary>
    <ReportsPageContent />
  </ReportsErrorBoundary>
);