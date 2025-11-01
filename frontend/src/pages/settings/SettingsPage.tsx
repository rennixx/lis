import React from 'react';
import { Settings, Users, Shield, Database, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage system configuration and preferences
        </p>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  User Management
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Manage users, roles, and permissions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Security
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Configure security settings and policies
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-purple-600 mr-4" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Database
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Database configuration and maintenance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-orange-600 mr-4" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Notifications
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Configure notification preferences
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Application
              </h4>
              <dl className="space-y-1">
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-600 dark:text-gray-400">Version:</dt>
                  <dd className="text-gray-900 dark:text-white">1.0.0</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-600 dark:text-gray-400">Environment:</dt>
                  <dd className="text-gray-900 dark:text-white">Development</dd>
                </div>
              </dl>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Database
              </h4>
              <dl className="space-y-1">
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-600 dark:text-gray-400">Type:</dt>
                  <dd className="text-gray-900 dark:text-white">PostgreSQL</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-600 dark:text-gray-400">Status:</dt>
                  <dd className="text-green-600">Connected</dd>
                </div>
              </dl>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Last Updated
              </h4>
              <dl className="space-y-1">
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-600 dark:text-gray-400">Date:</dt>
                  <dd className="text-gray-900 dark:text-white">2024-01-20</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-600 dark:text-gray-400">Time:</dt>
                  <dd className="text-gray-900 dark:text-white">14:30:00</dd>
                </div>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};