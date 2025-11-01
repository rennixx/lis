import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, Clock, AlertTriangle, Package, Printer, Barcode, Filter, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Types for sample data
interface Sample {
  id: string;
  sampleId: string;
  barcode: string;
  patient: {
    name: string;
    patientId: string;
    age?: number;
    gender?: string;
  };
  order: {
    orderNumber: string;
    priority: 'routine' | 'urgent' | 'stat' | 'critical';
  };
  tests: Array<{
    name: string;
    code: string;
  }>;
  sampleType: string;
  collectionStatus: 'pending' | 'collected' | 'in_process' | 'processing' | 'completed' | 'cancelled' | 'rejected';
  scheduledCollectionTime?: string;
  actualCollectionTime?: string;
  collectedBy?: string;
  collectionNotes?: string;
  priority: 'routine' | 'urgent' | 'stat' | 'critical';
}

// Mock data for demonstration
const mockSamples: Sample[] = [
  {
    id: '1',
    sampleId: 'SPL-2024-000001',
    barcode: 'SMP-20241030-000001',
    patient: {
      name: 'John Doe',
      patientId: 'PAT-2024-000001',
      age: 45,
      gender: 'Male'
    },
    order: {
      orderNumber: 'ORD-2024-000001',
      priority: 'routine'
    },
    tests: [
      { name: 'Complete Blood Count', code: 'CBC' },
      { name: 'Comprehensive Metabolic Panel', code: 'CMP' }
    ],
    sampleType: 'blood',
    collectionStatus: 'pending',
    scheduledCollectionTime: '2024-10-30T09:00:00Z',
    priority: 'routine'
  },
  {
    id: '2',
    sampleId: 'SPL-2024-000002',
    barcode: 'SMP-20241030-000002',
    patient: {
      name: 'Jane Smith',
      patientId: 'PAT-2024-000002',
      age: 32,
      gender: 'Female'
    },
    order: {
      orderNumber: 'ORD-2024-000002',
      priority: 'urgent'
    },
    tests: [
      { name: 'Urinalysis', code: 'UA' },
      { name: 'Urine Culture', code: 'UC' }
    ],
    sampleType: 'urine',
    collectionStatus: 'pending',
    scheduledCollectionTime: '2024-10-30T08:30:00Z',
    priority: 'urgent'
  },
  {
    id: '3',
    sampleId: 'SPL-2024-000003',
    barcode: 'SMP-20241030-000003',
    patient: {
      name: 'Robert Johnson',
      patientId: 'PAT-2024-000003',
      age: 67,
      gender: 'Male'
    },
    order: {
      orderNumber: 'ORD-2024-000003',
      priority: 'stat'
    },
    tests: [
      { name: 'Cardiac Enzyme Panel', code: 'CEP' },
      { name: 'Troponin T', code: 'TROP' }
    ],
    sampleType: 'blood',
    collectionStatus: 'collected',
    actualCollectionTime: '2024-10-30T07:45:00Z',
    collectedBy: 'Nurse Williams',
    priority: 'stat'
  }
];

const SampleCollectionPage: React.FC = () => {
  const [samples, setSamples] = useState<Sample[]>(mockSamples);
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [collectionNotes, setCollectionNotes] = useState('');
  const [actualVolume, setActualVolume] = useState('');
  const { toast } = useToast();

  // Filter samples based on search and filters
  const filteredSamples = samples.filter(sample => {
    const matchesSearch = sample.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sample.sampleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sample.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sample.order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || sample.collectionStatus === statusFilter;
    const matchesPriority = priorityFilter === 'all' || sample.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Get status color and styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'collected':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_process':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'rejected':
        return 'bg-red-200 text-red-900 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'routine':
        return 'bg-gray-100 text-gray-700';
      case 'urgent':
        return 'bg-orange-100 text-orange-800';
      case 'stat':
        return 'bg-red-100 text-red-800';
      case 'critical':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Handle sample selection
  const handleSelectSample = (sampleId: string, checked: boolean) => {
    if (checked) {
      setSelectedSamples([...selectedSamples, sampleId]);
    } else {
      setSelectedSamples(selectedSamples.filter(id => id !== sampleId));
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSamples(filteredSamples.map(sample => sample.id));
    } else {
      setSelectedSamples([]);
    }
  };

  // Confirm collection for a single sample
  const handleConfirmCollection = (sample: Sample) => {
    setSelectedSample(sample);
    setCollectionNotes('');
    setActualVolume('');
    setCollectionDialogOpen(true);
  };

  // Process collection confirmation
  const processCollectionConfirmation = () => {
    if (!selectedSample) return;

    // Update sample status
    setSamples(samples.map(sample =>
      sample.id === selectedSample.id
        ? {
            ...sample,
            collectionStatus: 'collected' as const,
            actualCollectionTime: new Date().toISOString(),
            collectedBy: 'Current User',
            collectionNotes: collectionNotes || undefined
          }
        : sample
    ));

    toast({
      title: "Collection Confirmed",
      description: `Sample ${selectedSample.sampleId} has been marked as collected.`,
    });

    setCollectionDialogOpen(false);
    setSelectedSample(null);
    setCollectionNotes('');
    setActualVolume('');
  };

  // Bulk update sample status
  const handleBulkStatusUpdate = (newStatus: string) => {
    if (selectedSamples.length === 0) return;

    setSamples(samples.map(sample =>
      selectedSamples.includes(sample.id)
        ? { ...sample, collectionStatus: newStatus as any }
        : sample
    ));

    toast({
      title: "Bulk Update Complete",
      description: `${selectedSamples.length} samples have been updated.`,
    });

    setSelectedSamples([]);
  };

  // Handle barcode scanning
  const handleBarcodeScan = () => {
    if (!barcodeInput.trim()) return;

    const foundSample = samples.find(sample =>
      sample.barcode === barcodeInput.trim() ||
      sample.sampleId === barcodeInput.trim()
    );

    if (foundSample) {
      setSelectedSample(foundSample);
      setCollectionDialogOpen(true);
      setBarcodeInput('');
    } else {
      toast({
        title: "Sample Not Found",
        description: "No sample found with this barcode or ID.",
        variant: "destructive",
      });
    }
  };

  // Print sample labels
  const handlePrintLabels = () => {
    const samplesToPrint = selectedSamples.length > 0
      ? samples.filter(sample => selectedSamples.includes(sample.id))
      : samples;

    if (samplesToPrint.length === 0) {
      toast({
        title: "No Samples Selected",
        description: "Please select samples to print labels for.",
        variant: "destructive",
      });
      return;
    }

    // In a real application, this would trigger label printing
    toast({
      title: "Printing Labels",
      description: `Printing ${samplesToPrint.length} sample labels...`,
    });
  };

  // Status counts for dashboard
  const statusCounts = samples.reduce((acc, sample) => {
    acc[sample.collectionStatus] = (acc[sample.collectionStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sample Collection</h1>
          <p className="text-muted-foreground">
            Manage sample collection queue and tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrintLabels}>
            <Printer className="mr-2 h-4 w-4" />
            Print Labels
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gray-100 rounded-full">
                <Clock className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{statusCounts.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600">Collected</p>
                <p className="text-2xl font-bold">{statusCounts.collected || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Filter className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-600">In Process</p>
                <p className="text-2xl font-bold">{(statusCounts.in_process || 0) + (statusCounts.processing || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600">Completed</p>
                <p className="text-2xl font-bold">{statusCounts.completed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search samples..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="collected">Collected</SelectItem>
                <SelectItem value="in_process">In Process</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="stat">Stat</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                placeholder="Scan barcode..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleBarcodeScan()}
                className="flex-1"
              />
              <Button onClick={handleBarcodeScan} size="icon">
                <Barcode className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedSamples.length > 0 && (
        <Card className="border-2 border-teal-200 bg-teal-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedSamples.length} sample{selectedSamples.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('collected')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Collected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('in_process')}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Mark In Process
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('completed')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Completed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Samples Table */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Queue ({filteredSamples.length})</CardTitle>
          <CardDescription>
            Samples pending collection and in various stages of processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedSamples.length === filteredSamples.length && filteredSamples.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Sample ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSamples.map((sample) => (
                  <TableRow key={sample.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedSamples.includes(sample.id)}
                        onCheckedChange={(checked: boolean) => handleSelectSample(sample.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sample.sampleId}</div>
                        <div className="text-sm text-muted-foreground font-mono">{sample.barcode}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sample.patient.name}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {sample.patient.patientId}
                          {sample.patient.age && ` • ${sample.patient.age}y`}
                          {sample.patient.gender && ` • ${sample.patient.gender}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-48">
                        <div className="flex flex-wrap gap-1">
                          {sample.tests.map((test, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {test.code}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {sample.tests.map(test => test.name).join(', ')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {sample.sampleType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(sample.priority)}>
                        {sample.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(sample.collectionStatus)}>
                        {sample.collectionStatus.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {sample.scheduledCollectionTime && (
                          <div>{new Date(sample.scheduledCollectionTime).toLocaleString()}</div>
                        )}
                        {sample.actualCollectionTime && (
                          <div className="text-green-600">
                            Collected: {new Date(sample.actualCollectionTime).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {sample.collectionStatus === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleConfirmCollection(sample)}
                            className="bg-teal-600 hover:bg-teal-700"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Collect
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Collection Confirmation Dialog */}
      <Dialog open={collectionDialogOpen} onOpenChange={setCollectionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Sample Collection</DialogTitle>
            <DialogDescription>
              Confirm collection details for sample {selectedSample?.sampleId}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedSample && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="patient" className="text-right">
                    Patient
                  </Label>
                  <div className="col-span-3">
                    <div className="font-medium">{selectedSample.patient.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedSample.patient.patientId}</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tests" className="text-right">
                    Tests
                  </Label>
                  <div className="col-span-3">
                    <div className="flex flex-wrap gap-1">
                      {selectedSample.tests.map((test, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {test.code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="volume" className="text-right">
                    Volume
                  </Label>
                  <Input
                    id="volume"
                    placeholder="Actual volume collected"
                    value={actualVolume}
                    onChange={(e) => setActualVolume(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Collection notes..."
                    value={collectionNotes}
                    onChange={(e) => setCollectionNotes(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCollectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={processCollectionConfirmation} className="bg-teal-600 hover:bg-teal-700">
              Confirm Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { SampleCollectionPage };