import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Debug: Log routing info
  React.useEffect(() => {
    console.log('🔍 [ORDER DETAIL] Component rendered');
    console.log('🔍 [ORDER DETAIL] Order ID from URL:', id);
    console.log('🔍 [ORDER DETAIL] Current URL:', window.location.pathname);
    console.log('🔍 [ORDER DETAIL] Full URL:', window.location.href);
  }, [id]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => navigate('/orders')} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Order Detail Page Working!</h1>
          <p className="text-gray-600 mt-2">
            Order ID from URL: <strong>{id || 'No ID found'}</strong>
          </p>
          <p className="text-gray-600">
            Current URL: <strong>{typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</strong>
          </p>
          <p className="text-gray-600">
            Full URL: <strong>{typeof window !== 'undefined' ? window.location.href : 'N/A'}</strong>
          </p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-green-800 mb-2">✅ Route Test Successful</h2>
        <p className="text-green-700">
          If you can see this page, the routing is working correctly and we can proceed to add the actual order fetching functionality.
        </p>
      </div>
    </div>
  );
};