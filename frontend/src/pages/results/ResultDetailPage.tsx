import React from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, FileText, TestTube } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ResultDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <button className="btn btn-ghost mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Results
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Test Result Details
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Result ID: {id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Result Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Result Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Result Not Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No test result data available.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Test Details */}
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Test Information
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No test details available.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};