import React, { useState } from 'react';
import { Plus, User, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { QuickRegistration } from '@/components/patients/quick-registration';
import { Patient } from '@/types/api.types';

interface FloatingActionMenuProps {
  className?: string;
}

export const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickRegistration, setShowQuickRegistration] = useState(false);
  const navigate = useNavigate();

  // Debug logging
  React.useEffect(() => {
    console.log('🎯 [FAB] FloatingActionMenu rendered');
    console.log('🎯 [FAB] Is open:', isOpen);
  }, [isOpen]);

  const handleQuickRegistration = () => {
    console.log('🎯 [FAB] Quick registration clicked');
    setShowQuickRegistration(true);
    setIsOpen(false);
  };

  const handleNewOrder = () => {
    console.log('🎯 [FAB] New order clicked');
    navigate('/orders/create');
    setIsOpen(false);
  };

  const handleFabClick = () => {
    console.log('🎯 [FAB] Main FAB clicked, current state:', isOpen);
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        {/* Action Menu */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 space-y-2">
            {/* Quick Registration */}
            <div className="flex items-center justify-end">
              <span className="mr-3 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap">
                Quick Registration
              </span>
              <Button
                onClick={handleQuickRegistration}
                size="sm"
                className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
                title="Quick Registration"
              >
                <User className="h-5 w-5" />
              </Button>
            </div>

            {/* New Order */}
            <div className="flex items-center justify-end">
              <span className="mr-3 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap">
                New Order
              </span>
              <Button
                onClick={handleNewOrder}
                size="sm"
                className="h-12 w-12 rounded-full bg-teal-600 hover:bg-teal-700 shadow-lg"
                title="New Order"
              >
                <FileText className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Main FAB Button */}
        <button
          onClick={handleFabClick}
          className={`h-12 w-12 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg transition-all duration-200 flex items-center justify-center hover:shadow-xl ${
            isOpen ? 'rotate-45 bg-red-600 hover:bg-red-700' : ''
          }`}
          title={isOpen ? 'Close' : 'Actions'}
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Quick Registration Modal */}
      {showQuickRegistration && (
        <QuickRegistration
          open={showQuickRegistration}
          onOpenChange={() => setShowQuickRegistration(false)}
          onPatientCreated={(newPatient: Patient) => {
            setShowQuickRegistration(false);
            // Optionally navigate to create order with the new patient
            navigate('/orders/create', { state: { patient: newPatient } });
          }}
        />
      )}
    </>
  );
};