'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeftIcon,
  UserIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format, addDays } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface Protocol {
  id: string;
  name: string;
  duration: number;
  description?: string;
  isTemplate: boolean;
  days: Array<{
    id: string;
    dayNumber: number;
    tasks: Array<{
      id: string;
      title: string;
    }>;
  }>;
}

interface PatientProtocolAssignment {
  id: string;
  protocolId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'UNAVAILABLE';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  protocol: {
    id: string;
    name: string;
    duration: number;
    description?: string;
  };
}

interface Patient {
  id: string;
  name?: string;
  email?: string;
  assignedProtocols: PatientProtocolAssignment[];
}

// Assigned Protocol Card Component
const AssignedProtocolCard = ({ 
  protocol, 
  assignment, 
  onStatusUpdate, 
  onRemove, 
  isUpdating, 
  isRemoving 
}: {
  protocol: Protocol;
  assignment: PatientProtocolAssignment;
  onStatusUpdate: (assignmentId: string, status: string) => void;
  onRemove: (assignmentId: string) => void;
  isUpdating: boolean;
  isRemoving: boolean;
}) => {
  const totalTasks = protocol.days.reduce((acc, day) => acc + day.tasks.length, 0);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-50 text-green-700 border-green-200';
      case 'INACTIVE': return 'bg-red-50 text-red-700 border-red-200';
      case 'UNAVAILABLE': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <EyeIcon className="h-4 w-4" />;
      case 'INACTIVE': return <EyeSlashIcon className="h-4 w-4" />;
      case 'UNAVAILABLE': return <ExclamationTriangleIcon className="h-4 w-4" />;
      default: return <EyeIcon className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Active';
      case 'INACTIVE': return 'Inactive';
      case 'UNAVAILABLE': return 'Unavailable';
      default: return status;
    }
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h4 className="text-lg font-semibold text-gray-900 truncate">{protocol.name}</h4>
              <Badge className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
                {getStatusIcon(assignment.status)}
                <span>{getStatusText(assignment.status)}</span>
              </Badge>
            </div>
            
            {protocol.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{protocol.description}</p>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                {protocol.duration} days
              </span>
              <span className="flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4" />
                {totalTasks} tasks
              </span>
              <span className="flex items-center gap-2">
                <CalendarDaysIcon className="h-4 w-4" />
                {format(new Date(assignment.startDate), 'MMM dd', { locale: enUS })} - {format(new Date(assignment.endDate), 'MMM dd', { locale: enUS })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-6">
            <select
              value={assignment.status}
              onChange={(e) => onStatusUpdate(assignment.id, e.target.value)}
              disabled={isUpdating || isRemoving}
              className="text-sm bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 disabled:opacity-50 min-w-[120px]"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </select>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(assignment.id)}
              disabled={isUpdating || isRemoving}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 w-10 p-0 rounded-xl"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Available Protocol Card Component
const AvailableProtocolCard = ({ 
  protocol, 
  onAssign, 
  isAssigning, 
  startDate,
  onStartDateChange,
  wasInactive 
}: {
  protocol: Protocol;
  onAssign: (protocolId: string) => void;
  isAssigning: boolean;
  startDate: string;
  onStartDateChange: (date: string) => void;
  wasInactive: boolean;
}) => {
  const totalTasks = protocol.days.reduce((acc, day) => acc + day.tasks.length, 0);
  const endDate = addDays(new Date(startDate), protocol.duration - 1);

  return (
    <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h4 className="text-lg font-semibold text-gray-900 truncate">{protocol.name}</h4>
              {wasInactive && (
                <Badge className="bg-orange-50 text-orange-700 border-orange-200 px-3 py-1 rounded-full text-sm font-medium">
                  Reactivate
                </Badge>
              )}
            </div>
            
            {protocol.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{protocol.description}</p>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                {protocol.duration} days
              </span>
              <span className="flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4" />
                {totalTasks} tasks
              </span>
              <span className="flex items-center gap-2">
                <CalendarDaysIcon className="h-4 w-4" />
                Until {format(endDate, 'MMM dd, yyyy', { locale: enUS })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-6">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="text-sm bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 min-w-[140px]"
            />
            
            <Button
              onClick={() => onAssign(protocol.id)}
              disabled={isAssigning}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isAssigning ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Assigning...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  <span>{wasInactive ? 'Reactivate' : 'Assign'}</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AssignProtocolPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [removingAssignment, setRemovingAssignment] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [assignStartDate, setAssignStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (params.id) {
      loadData(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadData = async (patientId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [patientResponse, protocolsResponse] = await Promise.all([
        fetch(`/api/patients/${patientId}`),
        fetch('/api/protocols')
      ]);

      if (!patientResponse.ok) {
        if (patientResponse.status === 404) {
          setError('Client not found or you do not have permission to access it');
        } else if (patientResponse.status === 401) {
          setError('Session expired. Please log in again');
          setTimeout(() => router.push('/auth/signin'), 2000);
          return;
        } else {
          setError('Error loading client data');
        }
        return;
      }

      const patientData = await patientResponse.json();
      setPatient(patientData);

      if (protocolsResponse.ok) {
        const protocolsData = await protocolsResponse.json();
        const nonTemplateProtocols = Array.isArray(protocolsData) 
          ? protocolsData.filter(p => !p.isTemplate)
          : [];
        setProtocols(nonTemplateProtocols);
      } else {
        setError('Error loading available protocols');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Connection error. Please check your internet and try again');
    } finally {
      setIsLoading(false);
    }
  };

  const assignProtocol = async (protocolId: string) => {
    try {
      setIsAssigning(protocolId);
      setError(null);
      
      const response = await fetch('/api/protocols/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocolId,
          patientId: params.id,
          startDate: new Date(assignStartDate).toISOString()
        })
      });

      if (response.ok) {
        setSuccessMessage('Protocol assigned successfully!');
        setAssignStartDate(format(new Date(), 'yyyy-MM-dd'));
        await loadData(params.id as string);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error assigning protocol');
      }
    } catch (error) {
      console.error('Error assigning protocol:', error);
      setError('Connection error. Please try again');
    } finally {
      setIsAssigning(null);
    }
  };

  const updateProtocolStatus = async (assignmentId: string, newStatus: string) => {
    try {
      setUpdatingStatus(assignmentId);
      setError(null);
      
      const response = await fetch(`/api/protocols/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setSuccessMessage('Status updated successfully');
        await loadData(params.id as string);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error updating protocol status');
      }
    } catch (error) {
      console.error('Error updating protocol status:', error);
      setError('Connection error. Please try again');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this protocol from the client?')) return;
    
    try {
      setRemovingAssignment(assignmentId);
      setError(null);
      
      await updateProtocolStatus(assignmentId, 'INACTIVE');
      setSuccessMessage('Protocol removed successfully');
    } catch (error) {
      console.error('Error removing assignment:', error);
      setError('Error removing protocol');
    } finally {
      setRemovingAssignment(null);
    }
  };

  // Process data
  const protocolsWithStatus = protocols.map(protocol => {
    const assignment = patient?.assignedProtocols.find(a => a.protocolId === protocol.id);
    return { ...protocol, assignment, isAssigned: !!assignment };
  });

  const filteredProtocols = protocolsWithStatus.filter(protocol => 
    protocol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    protocol.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const assignedProtocols = filteredProtocols.filter(p => p.isAssigned && p.assignment?.status !== 'INACTIVE');
  const availableProtocols = filteredProtocols.filter(p => !p.isAssigned || p.assignment?.status === 'INACTIVE');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            
            {/* Header Skeleton */}
            <div className="flex items-center gap-6 mb-8">
              <div className="h-10 bg-gray-200 rounded-xl w-24 animate-pulse"></div>
              <div className="flex-1">
                <div className="h-8 bg-gray-200 rounded-lg w-64 mb-2 animate-pulse"></div>
                <div className="h-5 bg-gray-100 rounded-lg w-96 animate-pulse"></div>
              </div>
            </div>

            {/* Search Skeleton */}
            <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6 mb-8">
              <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
            </div>

            {/* Content Skeleton */}
            <div className="grid lg:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                  <div className="p-6 border-b border-gray-200">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded w-64 animate-pulse"></div>
                  </div>
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-32 bg-gray-50 rounded-xl animate-pulse"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <XMarkIcon className="h-16 w-16 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">{error}</h2>
                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={() => loadData(params.id as string)} 
                    className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg"
                  >
                    Try Again
                  </Button>
                  <Button 
                    variant="outline" 
                    asChild 
                    className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-semibold px-6 py-3 rounded-xl"
                  >
                    <Link href="/doctor/patients">Back to Clients</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalTasks = assignedProtocols.reduce((acc, protocol) => {
    return acc + protocol.days.reduce((dayAcc, day) => dayAcc + day.tasks.length, 0);
  }, 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
          
          {/* Header */}
          <div className="flex items-center gap-6 mb-8">
            <Button 
              variant="outline" 
              asChild 
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-semibold px-4 py-2 rounded-xl"
            >
              <Link href={`/doctor/patients/${patient?.id}`}>
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Client Protocols
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  {patient?.name || patient?.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4" />
                  {assignedProtocols.length} active
                </span>
                <span>•</span>
                <span className="flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  {totalTasks} tasks
                </span>
                <span>•</span>
                <span className="flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  {availableProtocols.length} available
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <Card className="bg-red-50 border-red-200 shadow-lg rounded-2xl mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <XMarkIcon className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-red-700 font-medium">{error}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setError(null)} 
                    className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-100 h-8 w-8 p-0 rounded-lg"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {successMessage && (
            <Card className="bg-green-50 border-green-200 shadow-lg rounded-2xl mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">{successMessage}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSuccessMessage(null)} 
                    className="ml-auto text-green-600 hover:text-green-700 hover:bg-green-100 h-8 w-8 p-0 rounded-lg"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search */}
          <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl mb-8">
            <CardContent className="p-6">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search protocols..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 bg-white border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-gray-700 placeholder:text-gray-500 text-base rounded-xl"
                />
                {searchTerm && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Assigned Protocols */}
            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="p-6 border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <CheckIcon className="h-6 w-6 text-green-600" />
                  Assigned Protocols
                  <Badge className="bg-green-50 text-green-700 border-green-200 px-3 py-1 rounded-full text-sm font-semibold">
                    {assignedProtocols.length}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">Active protocols for this client</p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {assignedProtocols.length === 0 ? (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600 mb-2">No protocols assigned</p>
                    <p className="text-sm text-gray-500">
                      Assign protocols so the client can follow the treatment
                    </p>
                  </div>
                ) : (
                  assignedProtocols.map((protocol) => (
                    <AssignedProtocolCard
                      key={protocol.id}
                      protocol={protocol}
                      assignment={protocol.assignment!}
                      onStatusUpdate={updateProtocolStatus}
                      onRemove={removeAssignment}
                      isUpdating={updatingStatus === protocol.assignment!.id}
                      isRemoving={removingAssignment === protocol.assignment!.id}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Available Protocols */}
            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="p-6 border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <PlusIcon className="h-6 w-6 text-teal-600" />
                  Available Protocols
                  <Badge className="bg-teal-50 text-teal-700 border-teal-200 px-3 py-1 rounded-full text-sm font-semibold">
                    {availableProtocols.length}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">Protocols that can be assigned</p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {availableProtocols.length === 0 ? (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600 mb-2">
                      {searchTerm 
                        ? `No protocols found for "${searchTerm}"` 
                        : protocols.length === 0
                          ? 'No protocols created yet'
                          : 'All protocols have been assigned'}
                    </p>
                    {protocols.length === 0 ? (
                      <Button 
                        asChild 
                        className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg"
                      >
                        <Link href="/doctor/protocols">Create Protocols</Link>
                      </Button>
                    ) : searchTerm ? (
                      <Button 
                        variant="outline" 
                        onClick={() => setSearchTerm('')} 
                        className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-semibold px-6 py-3 rounded-xl"
                      >
                        Clear search
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  availableProtocols.map((protocol) => (
                    <AvailableProtocolCard
                      key={protocol.id} 
                      protocol={protocol}
                      onAssign={assignProtocol}
                      isAssigning={isAssigning === protocol.id}
                      startDate={assignStartDate}
                      onStartDateChange={setAssignStartDate}
                      wasInactive={protocol.assignment?.status === 'INACTIVE'}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 