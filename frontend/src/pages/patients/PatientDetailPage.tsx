import React from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <button className="btn btn-ghost mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patients
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Patient Details
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            ID: {id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  Patient Not Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No patient data available
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Medical Records
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No medical information available for this patient.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};