import React from 'react';
import { FileText, Download, Calendar, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Generate and view laboratory reports
          </p>
        </div>
        <button className="btn btn-primary">
          <Download className="h-4 w-4 mr-2" />
          Generate Report
        </button>
      </div>

      {/* Date Range and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="input flex-1"
                />
                <input
                  type="date"
                  className="input flex-1"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button className="btn btn-outline">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Daily Summary', desc: 'Overview of daily test activities' },
          { title: 'Patient Reports', desc: 'Individual patient test reports' },
          { title: 'Test Statistics', desc: 'Statistical analysis of test results' },
          { title: 'Inventory Report', desc: 'Current inventory and supplies' },
          { title: 'Billing Report', desc: 'Financial and billing information' },
          { title: 'Quality Control', desc: 'Quality control and compliance' }
        ].map((report, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {report.title}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {report.desc}
              </p>
              <button className="btn btn-outline w-full">
                Generate
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};