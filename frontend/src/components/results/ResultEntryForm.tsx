import React, { useState, useEffect } from 'react';
import { usePendingTests } from '../../api/hooks/index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle, Save, X } from 'lucide-react';

interface TestResult {
  testId: string;
  testName: string;
  testCode: string;
  category: string;
  value: any;
  unit?: string;
  normalRange?: {
    min?: number;
    max?: number;
    text?: string;
  };
  isAbnormal: boolean;
  notes: string;
}

interface ResultEntryFormProps {
  orderId: string;
  onSubmit: (results: TestResult[]) => void;
  onCancel: () => void;
}

export const ResultEntryForm: React.FC<ResultEntryFormProps> = ({
  orderId,
  onSubmit,
  onCancel
}) => {
  // Get pending tests for the order
  const { data: pendingData, isLoading } = usePendingTests(orderId);

  // Form state
  const [results, setResults] = useState<TestResult[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize results when pending tests are loaded
  useEffect(() => {
    if (pendingData?.pendingTests) {
      const initialResults = pendingData.pendingTests.map((item: any) => ({
        testId: item.test._id,
        testName: item.test.name,
        testCode: item.test.code,
        category: item.test.category,
        value: '',
        unit: item.test.unit,
        normalRange: item.test.normalRange,
        isAbnormal: false,
        notes: ''
      }));
      setResults(initialResults);
    }
  }, [pendingData]);

  // Handle value change
  const handleValueChange = (testId: string, value: string) => {
    setResults(prev => prev.map(result => {
      if (result.testId === testId) {
        // Check if value is abnormal
        let isAbnormal = false;
        if (result.normalRange && result.normalRange.min !== undefined && result.normalRange.max !== undefined) {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            isAbnormal = numValue < result.normalRange.min || numValue > result.normalRange.max;
          }
        }

        return {
          ...result,
          value,
          isAbnormal
        };
      }
      return result;
    }));
  };

  // Handle notes change
  const handleNotesChange = (testId: string, notes: string) => {
    setResults(prev => prev.map(result =>
      result.testId === testId ? { ...result, notes } : result
    ));
  };

  // Quick normal/abnormal toggle
  const toggleAbnormal = (testId: string) => {
    setResults(prev => prev.map(result =>
      result.testId === testId ? { ...result, isAbnormal: !result.isAbnormal } : result
    ));
  };

  // Set normal range value
  const setNormalValue = (testId: string) => {
    setResults(prev => prev.map(result => {
      if (result.testId === testId && result.normalRange) {
        const normalValue = result.normalRange.text || '';
        return {
          ...result,
          value: normalValue,
          isAbnormal: false
        };
      }
      return result;
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    results.forEach((result, index) => {
      if (!result.value || result.value.trim() === '') {
        newErrors[`result_${index}`] = 'Value is required';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData = results.map(result => ({
        orderId,
        testId: result.testId,
        value: result.value,
        notes: result.notes,
        testName: result.testName,
        testCode: result.testCode,
        category: result.category,
        isAbnormal: result.isAbnormal
      }));

      await onSubmit(submissionData);
    } catch (error) {
      console.error('Failed to submit results:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get abnormal status color
  const getAbnormalColor = (isAbnormal: boolean) => {
    if (isAbnormal) return 'border-red-300 bg-red-50';
    return 'border-gray-200 bg-white';
  };

  // Get abnormal status icon
  const getAbnormalIcon = (isAbnormal: boolean) => {
    if (isAbnormal) return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Info Header */}
        {pendingData?.order && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600">Order:</span>
                  <span className="ml-2 font-medium">{pendingData.order.orderNumber}</span>
                </div>
                <Badge variant={
                  pendingData.order.priority === 'critical' ? 'destructive' :
                  pendingData.order.priority === 'urgent' ? 'default' :
                  'secondary'
                }>
                  {pendingData.order.priority.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Patient:</span>
                  <p className="font-medium">
                    {pendingData.order.patient?.firstName} {pendingData.order.patient?.lastName}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Patient ID:</span>
                  <p className="font-medium">{pendingData.order.patient?.patientId}</p>
                </div>
                <div>
                  <span className="text-gray-600">Order Date:</span>
                  <p className="font-medium">
                    {new Date(pendingData.order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Tests:</span>
                  <p className="font-medium">{results.length} pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Results */}
        <div className="space-y-4">
          {results.map((result, index) => (
            <Card key={result.testId} className={getAbnormalColor(result.isAbnormal)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">{result.testName}</h3>
                      <Badge variant="outline" className="text-xs">
                        {result.testCode}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {result.category}
                      </Badge>
                      {getAbnormalIcon(result.isAbnormal)}
                    </div>
                    {result.unit && (
                      <p className="text-sm text-gray-600">Unit: {result.unit}</p>
                    )}
                  </div>
                </div>

                {/* Normal Range Display */}
                {result.normalRange && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Reference Range:
                    </p>
                    {result.normalRange.text ? (
                      <p className="text-sm text-blue-800">{result.normalRange.text}</p>
                    ) : (
                      <p className="text-sm text-blue-800">
                        {result.normalRange.min !== undefined && result.normalRange.max !== undefined
                          ? `${result.normalRange.min} - ${result.normalRange.max}`
                          : result.normalRange.min !== undefined
                          ? `≥ ${result.normalRange.min}`
                          : result.normalRange.max !== undefined
                          ? `≤ ${result.normalRange.max}`
                          : 'Not specified'
                        }
                        {result.unit && ` ${result.unit}`}
                      </p>
                    )}
                  </div>
                )}

                {/* Value Input */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Result Value
                    </label>
                    <div className="flex space-x-2">
                      <Input
                        type="text"
                        value={result.value}
                        onChange={(e) => handleValueChange(result.testId, e.target.value)}
                        placeholder="Enter result value"
                        className={`flex-1 ${
                          errors[`result_${index}`] ? 'border-red-500' : ''
                        } ${result.isAbnormal ? 'border-red-300' : ''}`}
                      />
                      {result.normalRange?.text && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setNormalValue(result.testId)}
                          title="Set to normal value"
                        >
                          Normal
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant={result.isAbnormal ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => toggleAbnormal(result.testId)}
                        title="Mark as abnormal"
                      >
                        {result.isAbnormal ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors[`result_${index}`] && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors[`result_${index}`]}
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      rows={2}
                      value={result.notes}
                      onChange={(e) => handleNotesChange(result.testId, e.target.value)}
                      placeholder="Add any relevant notes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || results.length === 0}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Results'}
          </Button>
        </div>
      </form>
    </div>
  );
};