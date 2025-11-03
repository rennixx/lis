import { useState, useEffect, useCallback } from 'react';
import { reportService } from '../services/ReportService';
import {
  Report,
  ReportQueryParams,
  ReportStatistics,
  PaginatedResponse,
  CreateReportRequest,
  GeneratePDFRequest,
  BulkGenerateRequest
} from '@/types/api.types';

// Hook for fetching reports with pagination and filtering
export const useReports = (initialParams: ReportQueryParams = {}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState<ReportQueryParams>(initialParams);

  const fetchReports = useCallback(async (params: ReportQueryParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await reportService.getReports({ ...filters, ...params });
      setReports(result.data);
      setPagination(result.pagination);
      setFilters(prev => ({ ...prev, ...params }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReports();
  }, []);

  const refresh = useCallback(() => {
    fetchReports();
  }, [fetchReports]);

  const updateFilters = useCallback((newFilters: Partial<ReportQueryParams>) => {
    fetchReports(newFilters);
  }, [fetchReports]);

  const clearFilters = useCallback(() => {
    setFilters(initialParams);
    fetchReports(initialParams);
  }, [fetchReports, initialParams]);

  return {
    reports,
    loading,
    error,
    pagination,
    filters,
    refresh,
    updateFilters,
    clearFilters,
    fetchReports,
  };
};

// Hook for a single report
export const useReport = (reportId?: string) => {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (id: string) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await reportService.getReport(id);
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch report');
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (reportId) {
      fetchReport(reportId);
    }
  }, [reportId, fetchReport]);

  return {
    report,
    loading,
    error,
    refresh: () => reportId && fetchReport(reportId),
  };
};

// Hook for report statistics
export const useReportStatistics = (startDate?: string, endDate?: string) => {
  const [statistics, setStatistics] = useState<ReportStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await reportService.getReportStatistics(startDate, endDate);
      setStatistics(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refresh: fetchStatistics,
  };
};

// Hook for report generation
export const useReportGeneration = () => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateFromOrder = useCallback(async (
    orderId: string,
    options?: CreateReportRequest
  ): Promise<Report | null> => {
    setGenerating(true);
    setError(null);

    try {
      const result = await reportService.generateReportFromOrder(orderId, options);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      console.error('Error generating report:', err);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const generatePDF = useCallback(async (
    reportId: string,
    options?: GeneratePDFRequest
  ): Promise<any> => {
    setGenerating(true);
    setError(null);

    try {
      const result = await reportService.generatePDF(reportId, options);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
      console.error('Error generating PDF:', err);
      throw err;
    } finally {
      setGenerating(false);
    }
  }, []);

  const bulkGenerate = useCallback(async (
    request: BulkGenerateRequest
  ): Promise<any[]> => {
    setGenerating(true);
    setError(null);

    try {
      const result = await reportService.bulkGenerateReports(request);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk generate reports');
      console.error('Error bulk generating reports:', err);
      throw err;
    } finally {
      setGenerating(false);
    }
  }, []);

  return {
    generating,
    error,
    generateFromOrder,
    generatePDF,
    bulkGenerate,
    clearError: () => setError(null),
  };
};

// Hook for PDF operations
export const usePDFOperations = () => {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  const downloadPDF = useCallback(async (reportId: string): Promise<void> => {
    setLoading(prev => ({ ...prev, [reportId]: true }));
    setError(null);

    try {
      const { blob, filename } = await reportService.downloadPDF(reportId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
      console.error('Error downloading PDF:', err);
    } finally {
      setLoading(prev => ({ ...prev, [reportId]: false }));
    }
  }, []);

  const viewPDF = useCallback(async (reportId: string): Promise<string | null> => {
    setLoading(prev => ({ ...prev, [reportId]: true }));
    setError(null);

    try {
      const url = await reportService.viewPDF(reportId);
      return url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to view PDF');
      console.error('Error viewing PDF:', err);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, [reportId]: false }));
    }
  }, []);

  const printPDF = useCallback(async (reportId: string): Promise<void> => {
    setLoading(prev => ({ ...prev, [reportId]: true }));
    setError(null);

    try {
      await reportService.printReport(reportId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to print PDF');
      console.error('Error printing PDF:', err);
    } finally {
      setLoading(prev => ({ ...prev, [reportId]: false }));
    }
  }, []);

  return {
    loading,
    error,
    downloadPDF,
    viewPDF,
    printPDF,
    clearError: () => setError(null),
    isLoading: (reportId: string) => loading[reportId] || false,
  };
};

// Hook for report status management
export const useReportStatus = () => {
  const [updating, setUpdating] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(async (
    reportId: string,
    status: string,
    notes?: string
  ): Promise<Report | null> => {
    setUpdating(prev => ({ ...prev, [reportId]: true }));
    setError(null);

    try {
      const result = await reportService.updateReportStatus(reportId, status, notes);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report status');
      console.error('Error updating report status:', err);
      return null;
    } finally {
      setUpdating(prev => ({ ...prev, [reportId]: false }));
    }
  }, []);

  return {
    updating,
    error,
    updateStatus,
    clearError: () => setError(null),
    isUpdating: (reportId: string) => updating[reportId] || false,
  };
};