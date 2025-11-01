import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, User, Clock, AlertCircle, CheckCircle2, Package, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Patient, Test } from '@/types/api.types';
import { usePatients } from '@/api/hooks/usePatients';
import { useCreateOrder } from '@/api/hooks/useOrders';
import { useAvailableTests, usePopularPanels } from '@/api/hooks/useTests';

type OrderStep = 'patient' | 'tests' | 'details' | 'summary';

interface SelectedTest {
  testId: string;
  testName: string;
  testCode: string;
  price: number;
  category: string;
}

interface OrderData {
  patient: Patient | null;
  tests: SelectedTest[];
  priority: 'routine' | 'urgent' | 'stat' | 'critical';
  clinicalNotes: string;
  doctorName?: string;
  department?: string;
}

export const OrderCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OrderStep>('patient');
  const [orderData, setOrderData] = useState<OrderData>({
    patient: null,
    tests: [],
    priority: 'routine',
    clinicalNotes: '',
    doctorName: '',
    department: ''
  });

  // Patient search
  const [patientSearch, setPatientSearch] = useState('');
  const { data: patientsData, isLoading: patientsLoading, error: patientsError, status: patientsStatus } = usePatients({
    search: patientSearch,
    limit: 10
  });

  
  // Debug logging for patient search
  React.useEffect(() => {
    console.log('🔍 [PATIENT SEARCH] Search term:', patientSearch);
    console.log('🔍 [PATIENT SEARCH] Loading:', patientsLoading);
    console.log('🔍 [PATIENT SEARCH] Status:', patientsStatus);
    console.log('🔍 [PATIENT SEARCH] Error:', patientsError);
    console.log('🔍 [PATIENT SEARCH] Data:', patientsData);
  }, [patientSearch, patientsLoading, patientsStatus, patientsError, patientsData]);

  
  // Test selection
  const [testSearch, setTestSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { data: availableTests } = useAvailableTests({
    search: testSearch,
    category: selectedCategory
  });
  const { data: popularPanels } = usePopularPanels(5);

  // Order creation mutation
  const createOrderMutation = useCreateOrder();

  const categories = [
    'hematology', 'biochemistry', 'microbiology', 'immunology',
    'pathology', 'radiology', 'cardiology', 'other'
  ];

  const totalAmount = orderData.tests.reduce((sum, test) => sum + test.price, 0);

  const handlePatientSelect = (patient: Patient) => {
    setOrderData(prev => ({ ...prev, patient }));
  };

  
  const handleTestSelect = (test: any) => {
    const isAlreadySelected = orderData.tests.some(t => t.testId === test._id);
    if (!isAlreadySelected) {
      setOrderData(prev => ({
        ...prev,
        tests: [...prev.tests, {
          testId: test._id,
          testName: test.testName,
          testCode: test.testCode,
          price: test.price,
          category: test.category
        }]
      }));
    }
  };

  const handleTestRemove = (testId: string) => {
    setOrderData(prev => ({
      ...prev,
      tests: prev.tests.filter(t => t.testId !== testId)
    }));
  };

  const handlePanelSelect = (panel: any) => {
    // Add all tests from panel to order
    const newTests = panel.tests.filter((test: any) =>
      !orderData.tests.some(t => t.testId === test._id)
    ).map((test: any) => ({
      testId: test._id,
      testName: test.testName,
      testCode: test.testCode,
      price: test.price,
      category: test.category
    }));

    setOrderData(prev => ({
      ...prev,
      tests: [...prev.tests, ...newTests]
    }));
  };

  const handleNextStep = () => {
    const steps: OrderStep[] = ['patient', 'tests', 'details', 'summary'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePreviousStep = () => {
    const steps: OrderStep[] = ['patient', 'tests', 'details', 'summary'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmitOrder = async () => {
    if (!orderData.patient || orderData.tests.length === 0) {
      return;
    }

    try {
      await createOrderMutation.mutateAsync({
        patient: orderData.patient._id,
        tests: orderData.tests.map(t => t.testId),
        priority: orderData.priority,
        clinicalInformation: orderData.clinicalNotes,
        doctorName: orderData.doctorName,
        department: orderData.department,
        totalAmount,
        orderedBy: 'current-user-id' // This should come from auth context
      });

      // Generate barcode and print functionality would go here
      navigate('/orders');
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  const getStepIcon = (step: OrderStep) => {
    switch (step) {
      case 'patient': return <User className="h-4 w-4" />;
      case 'tests': return <Package className="h-4 w-4" />;
      case 'details': return <Filter className="h-4 w-4" />;
      case 'summary': return <CheckCircle2 className="h-4 w-4" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'stat': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => navigate('/orders')} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
                <p className="text-gray-600">Follow the steps to create a test order</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {(['patient', 'tests', 'details', 'summary'] as OrderStep[]).map((step, index) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2
                    ${currentStep === step
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : currentStep === 'summary' || ['patient', 'tests', 'details'].indexOf(currentStep) > index
                      ? 'bg-teal-100 border-teal-600 text-teal-600'
                      : 'bg-gray-100 border-gray-300 text-gray-500'
                    }
                  `}>
                    {getStepIcon(step)}
                  </div>
                  <span className={`
                    mt-1 text-sm font-medium capitalize
                    ${currentStep === step ? 'text-gray-900' : 'text-gray-600'}
                  `}>
                    {step}
                  </span>
                </div>
                {index < 3 && (
                  <div className={`
                    mx-8 h-0.5 w-24 self-center
                    ${currentStep === 'summary' || ['patient', 'tests', 'details'].indexOf(currentStep) > index
                      ? 'bg-teal-600'
                      : 'bg-gray-300'
                    }
                  `} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Patient Selection */}
            {currentStep === 'patient' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Select Patient
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Patient Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search patients by name, MRN, or phone..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Quick Registration Note */}
                    <div className="text-center py-4 border border-gray-200 rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-600">
                        Can't find the patient? Use the
                        <span className="font-medium text-teal-600"> Quick Registration</span> button
                        <br />in the bottom right corner to add a new patient
                      </p>
                    </div>

                    {/* Patient Results */}
                    {/* Loading State */}
                    {patientsLoading && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Searching patients...</p>
                        <div className="animate-pulse space-y-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 border rounded-lg bg-gray-50">
                              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error State */}
                    {patientsError && !patientsData && (
                      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-center text-red-800">
                          <AlertCircle className="h-5 w-5 mr-2" />
                          <div>
                            <p className="font-medium">Search failed</p>
                            <p className="text-sm text-red-600">{patientsError.message || 'Failed to search patients'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Success State - Patients Found */}
                    {!patientsLoading && patientsData?.data && patientsData.data.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">
                            {patientSearch ? `Found ${patientsData.data.length} patient(s)` : 'Select a patient:'}
                          </p>
                        </div>
                        {patientsData.data.map((patient: Patient) => (
                          <div
                            key={patient._id}
                            onClick={() => handlePatientSelect(patient)}
                            className={`
                              p-4 border rounded-lg cursor-pointer transition-colors
                              ${orderData.patient?._id === patient._id
                                ? 'border-teal-500 bg-teal-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {patient.firstName} {patient.lastName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  MRN: {patient.patientId}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {patient.email}
                                </p>
                              </div>
                              {orderData.patient?._id === patient._id && (
                                <CheckCircle2 className="h-5 w-5 text-teal-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No Results State */}
                    {!patientsLoading && patientSearch && patientsData?.data?.length === 0 && (
                      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-center">
                        <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No patients found for "{patientSearch}"</p>
                        <p className="text-sm text-gray-500 mt-1">Try different search terms or register a new patient</p>
                      </div>
                    )}

                    {/* Debug Info (only in development) */}
                    {import.meta.env.DEV && (
                      <div className="mt-4 p-2 bg-gray-100 rounded text-xs font-mono">
                        <p>🔍 Debug Info:</p>
                        <p>Search: "{patientSearch}"</p>
                        <p>Loading: {patientsLoading ? 'Yes' : 'No'}</p>
                        <p>Status: {patientsStatus}</p>
                        <p>Results: {patientsData?.data?.length || 0}</p>
                        <p>Error: {patientsError ? 'Yes' : 'No'}</p>
                        {patientsError && <p className="text-red-600">Error: {patientsError.message}</p>}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={handleNextStep}
                      disabled={!orderData.patient}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      Next: Select Tests
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Test Selection */}
            {currentStep === 'tests' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Select Tests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Popular Panels */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Popular Test Panels</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {popularPanels?.map((panel: any) => (
                          <div
                            key={panel.id}
                            onClick={() => handlePanelSelect(panel)}
                            className="p-4 border border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{panel.name}</h4>
                              <Badge variant="secondary">{panel.tests.length} tests</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{panel.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-teal-600">${panel.totalPrice}</span>
                              <span className="text-xs text-gray-500">{panel.category}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filter by Category
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={selectedCategory === '' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedCategory('')}
                          className={selectedCategory === '' ? 'bg-teal-600 hover:bg-teal-700' : ''}
                        >
                          All
                        </Button>
                        {categories.map((category) => (
                          <Button
                            key={category}
                            variant={selectedCategory === category ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(category)}
                            className={selectedCategory === category ? 'bg-teal-600 hover:bg-teal-700' : ''}
                          >
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Test Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search tests by name or code..."
                        value={testSearch}
                        onChange={(e) => setTestSearch(e.target.value)}
                        className="pl-10 text-center"
                      />
                    </div>

                    {/* Available Tests */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Available Tests</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {availableTests?.map((test: any) => {
                          const isSelected = orderData.tests.some(t => t.testId === test.id);
                          return (
                            <div
                              key={test.id}
                              onClick={() => handleTestSelect(test)}
                              className={`
                                p-3 border rounded-lg cursor-pointer transition-colors
                                ${isSelected
                                  ? 'border-teal-500 bg-teal-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }
                              `}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{test.testName}</p>
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="text-sm text-gray-600">{test.testCode}</span>
                                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">{test.category}</span>
                                    {test.specimenType && (
                                      <span className="text-xs text-gray-500">{test.specimenType}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-teal-600">${test.price}</p>
                                  {isSelected && (
                                    <CheckCircle2 className="h-4 w-4 text-teal-600 ml-auto mt-1" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={handlePreviousStep}>
                      Previous: Patient
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      disabled={orderData.tests.length === 0}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      Next: Order Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Order Details */}
            {currentStep === 'details' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Filter className="h-5 w-5 mr-2" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Priority Selection */}
                    <div className="text-center">
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                        Order Priority
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {(['routine', 'urgent', 'stat', 'critical'] as const).map((priority) => (
                          <Button
                            key={priority}
                            variant={orderData.priority === priority ? 'default' : 'outline'}
                            onClick={() => setOrderData(prev => ({ ...prev, priority }))}
                            className={`
                              ${orderData.priority === priority ? getPriorityColor(priority) : ''}
                              ${priority === 'critical' && orderData.priority === priority ? 'animate-pulse' : ''}
                              justify-center
                            `}
                          >
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            {priority === 'urgent' && <AlertCircle className="h-4 w-4 ml-1" />}
                            {priority === 'critical' && <AlertCircle className="h-4 w-4 ml-1" />}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Clinical Information */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                        Clinical Information / Notes
                      </label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-center"
                        placeholder="Enter any relevant clinical information, symptoms, or special instructions..."
                        value={orderData.clinicalNotes}
                        onChange={(e) => setOrderData(prev => ({ ...prev, clinicalNotes: e.target.value }))}
                      />
                    </div>

                    {/* Doctor Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                          Doctor Name
                        </label>
                        <Input
                          type="text"
                          placeholder="Dr. Smith"
                          value={orderData.doctorName}
                          onChange={(e) => setOrderData(prev => ({ ...prev, doctorName: e.target.value }))}
                          className="text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                          Department
                        </label>
                        <Input
                          type="text"
                          placeholder="Emergency"
                          value={orderData.department}
                          onChange={(e) => setOrderData(prev => ({ ...prev, department: e.target.value }))}
                          className="text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={handlePreviousStep}>
                      Previous: Tests
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      Next: Review Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Order Summary */}
            {currentStep === 'summary' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Patient Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Patient Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Name:</span>
                          <p className="font-medium">{orderData.patient?.firstName} {orderData.patient?.lastName}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">MRN:</span>
                          <p className="font-medium">{orderData.patient?.patientId}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Email:</span>
                          <p className="font-medium">{orderData.patient?.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Phone:</span>
                          <p className="font-medium">{orderData.patient?.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Tests Summary */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Selected Tests ({orderData.tests.length})</h3>
                      <div className="space-y-2">
                        {orderData.tests.map((test) => (
                          <div key={test.testId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium text-sm">{test.testName}</p>
                              <p className="text-xs text-gray-600">{test.testCode} • {test.category}</p>
                            </div>
                            <p className="font-medium text-teal-600">${test.price}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Details Summary */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Order Details</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Priority:</span>
                          <p className="font-medium capitalize">{orderData.priority}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Tests:</span>
                          <p className="font-medium">{orderData.tests.length}</p>
                        </div>
                        {orderData.doctorName && (
                          <div>
                            <span className="text-gray-600">Doctor:</span>
                            <p className="font-medium">{orderData.doctorName}</p>
                          </div>
                        )}
                        {orderData.department && (
                          <div>
                            <span className="text-gray-600">Department:</span>
                            <p className="font-medium">{orderData.department}</p>
                          </div>
                        )}
                      </div>
                      {orderData.clinicalNotes && (
                        <div className="mt-2">
                          <span className="text-gray-600 text-sm">Clinical Notes:</span>
                          <p className="text-sm mt-1">{orderData.clinicalNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* Total Amount */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-medium text-gray-900">Total Amount:</span>
                        <span className="text-2xl font-bold text-teal-600">${totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={handlePreviousStep}>
                      Previous: Details
                    </Button>
                    <Button
                      onClick={handleSubmitOrder}
                      disabled={createOrderMutation.isPending}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      {createOrderMutation.isPending ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Creating Order...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Create Order
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Patient Info */}
                  {orderData.patient && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Patient</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <p className="font-medium">{orderData.patient.firstName} {orderData.patient.lastName}</p>
                        <p className="text-gray-600">MRN: {orderData.patient.patientId}</p>
                      </div>
                    </div>
                  )}

                  {/* Selected Tests */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Tests</h4>
                      <Badge variant="secondary">{orderData.tests.length}</Badge>
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {orderData.tests.map((test) => (
                        <div key={test.testId} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{test.testName}</span>
                          <span className="font-medium">${test.price}</span>
                        </div>
                      ))}
                      {orderData.tests.length === 0 && (
                        <p className="text-gray-500 text-sm italic">No tests selected</p>
                      )}
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Priority</h4>
                    <Badge className={getPriorityColor(orderData.priority)}>
                      {orderData.priority.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Total */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-teal-600">${totalAmount}</span>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="pt-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${(orderData.patient ? 25 : 0) +
                                   (orderData.tests.length > 0 ? 25 : 0) +
                                   (orderData.priority !== 'routine' || orderData.clinicalNotes ? 25 : 0) +
                                   (currentStep === 'summary' ? 25 : 0)}%`
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {currentStep === 'patient' && 'Select a patient'}
                      {currentStep === 'tests' && 'Choose tests'}
                      {currentStep === 'details' && 'Add order details'}
                      {currentStep === 'summary' && 'Review and submit'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

          </div>
  );
};