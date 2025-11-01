import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full">
              <Search className="w-10 h-10 text-red-600" />
            </div>
          </div>
          <h1 className="mt-6 text-6xl font-bold text-gray-900 dark:text-white">
            404
          </h1>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            Page Not Found
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Here are some helpful links:
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>
                <Link to="/dashboard" className="hover:underline">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/patients" className="hover:underline">
                  Patients
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:underline">
                  Test Orders
                </Link>
              </li>
              <li>
                <Link to="/results" className="hover:underline">
                  Test Results
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => window.history.back()}
              className="btn btn-outline flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </button>
            <Link to="/dashboard" className="btn btn-primary flex items-center justify-center">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          If you believe this is an error, please contact your system administrator.
        </div>
      </div>
    </div>
  );
};