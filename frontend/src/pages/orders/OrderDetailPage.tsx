import React from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, FileText, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button className="btn btn-ghost mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Order Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Order ID: {id || 'NEW'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardList className="h-5 w-5 mr-2" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {id ? 'Order Not Found' : 'Create New Order'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {id ? 'No order data available' : 'Fill in the form to create a new test order'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Tests Ordered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Tests Added
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Add tests to this order to continue.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Patient Selected
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Select a patient to create an order.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};