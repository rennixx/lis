import React from 'react';
import { TestTube, Plus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const TestsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Laboratory Tests
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage available tests and test categories
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Test
        </button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tests..."
              className="input w-full pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Blood Test', 'Urine Test', 'X-Ray', 'ECG', 'MRI', 'CT Scan'].map((test, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <TestTube className="h-8 w-8 text-purple-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {test}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Laboratory test for {test.toLowerCase()} analysis and diagnosis.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};