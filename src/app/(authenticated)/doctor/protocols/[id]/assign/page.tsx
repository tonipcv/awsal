'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeftIcon,
  UserIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowPathIcon,
  XMarkIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

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

interface Patient {
  id: string;
  name?: string;
  email?: string;
  assignedProtocols: Array<{
    id: string;
    protocolId: string;
    isActive: boolean;
    protocol: {
      id: string;
      name: string;
      duration: number;
    };
  }>;
}

// Component for patient card
const PatientCard = ({ 
  patient, 
  protocol,
  onAssign, 
  isAssigning, 
  startDate,
  onStartDateChange,
  hasActiveProtocol
}: {
  patient: Patient;
  protocol: Protocol;
  onAssign: (patientId: string) => void;
  isAssigning: boolean;
  startDate: string;
  onStartDateChange: (date: string) => void;
  hasActiveProtocol: boolean;
}) => {
  const getPatientInitials = (name?: string) => {
    if (!name) return 'P';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const endDate = addDays(new Date(startDate), protocol.duration - 1);
  const activeProtocol = patient.assignedProtocols.find(ap => ap.protocolId === protocol.id && ap.isActive);

  return (
    <Card className={cn(
      "bg-background/10 border-border/20 hover:bg-background/20 transition-colors",
      activeProtocol && "border-green-500/30 bg-green-500/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-full bg-turquoise/20 flex items-center justify-center text-sm font-medium text-turquoise flex-shrink-0">
              {getPatientInitials(patient.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white truncate">
                {patient.name || 'Sem nome'}
              </h4>
              <p className="text-xs text-muted-foreground truncate">{patient.email}</p>
              {activeProtocol && (
                <div className="flex items-center gap-1 mt-1">
                  <CheckIcon className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">Already assigned</span>
                </div>
              )}
              {hasActiveProtocol && !activeProtocol && (
                <div className="flex items-center gap-1 mt-1">
                  <DocumentTextIcon className="h-3 w-3 text-orange-400" />
                  <span className="text-xs text-orange-400">
                    {patient.assignedProtocols.filter(ap => ap.isActive).length} active protocol(s)
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {!activeProtocol && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="text-xs bg-background/30 border border-border/30 rounded px-2 py-1 text-white focus:border-turquoise/50 w-28"
                />
                
                <Button
                  onClick={() => onAssign(patient.id)}
                  disabled={isAssigning}
                  size="sm"
                  className="bg-turquoise hover:bg-turquoise/90 text-background font-medium px-3"
                >
                  {isAssigning ? (
                    <>
                      <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />
                      <span className="hidden sm:inline">...</span>
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Assign</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
        
        {!activeProtocol && (
          <div className="mt-3 pt-3 border-t border-border/20">
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                {protocol.duration} days
              </span>
              <span className="flex items-center gap-1">
                <CalendarDaysIcon className="h-3 w-3" />
                Até {format(endDate, 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function AssignProtocolToPatientPage() {
  const params = useParams();
  const router = useRouter();
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
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

  const loadData = async (protocolId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [protocolResponse, patientsResponse] = await Promise.all([
        fetch(`/api/protocols/${protocolId}`),
        fetch('/api/patients')
      ]);

      if (!protocolResponse.ok) {
        if (protocolResponse.status === 404) {
          setError('Protocol not found or you do not have permission to access it');
        } else if (protocolResponse.status === 401) {
          setError('Session expired. Please log in again');
          setTimeout(() => router.push('/auth/signin'), 2000);
          return;
        } else {
          setError('Error loading protocol data');
        }
        return;
      }

      const protocolData = await protocolResponse.json();
      setProtocol(protocolData);

      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        setPatients(Array.isArray(patientsData) ? patientsData : []);
      } else {
        setError('Error loading patient list');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Erro de conexão. Verifique sua internet e tente novamente');
    } finally {
      setIsLoading(false);
    }
  };

  const assignProtocol = async (patientId: string) => {
    try {
      setIsAssigning(patientId);
      setError(null);
      
      const response = await fetch('/api/protocols/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocolId: params.id,
          patientId,
          startDate: new Date(assignStartDate).toISOString()
        })
      });

      if (response.ok) {
        setSuccessMessage('Protocol assigned successfully!');
        await loadData(params.id as string);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error assigning protocol');
      }
    } catch (error) {
      console.error('Error assigning protocol:', error);
      setError('Erro de conexão. Tente novamente');
    } finally {
      setIsAssigning(null);
    }
  };

  // Processar dados
  const filteredPatients = patients.filter(patient => 
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availablePatients = filteredPatients.filter(patient => 
    !patient.assignedProtocols.some(ap => ap.protocolId === protocol?.id && ap.isActive)
  );

  const assignedPatients = filteredPatients.filter(patient => 
    patient.assignedProtocols.some(ap => ap.protocolId === protocol?.id && ap.isActive)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 text-turquoise animate-spin mx-auto mb-4" />
          <span className="text-sm text-muted-foreground">Loading data...</span>
        </div>
      </div>
    );
  }

  if (error && !protocol) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <XMarkIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium mb-2 text-white">{error}</h2>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => loadData(params.id as string)} className="bg-turquoise hover:bg-turquoise/90">
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button variant="outline" asChild>
              <Link href="/doctor/protocols">Back to Protocols</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Card className="min-h-screen lg:min-h-[calc(100vh-4rem)] border-0 lg:border">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sticky top-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/50 z-10 pt-[72px] lg:pt-6 border-b border-border/20">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="text-white/70 hover:text-white">
              <Link href={`/doctor/protocols/${protocol?.id}`}>
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <CardTitle className="text-lg font-light text-white">Assign Protocol</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <DocumentTextIcon className="h-4 w-4" />
                <span>{protocol?.name}</span>
                <span className="text-turquoise">•</span>
                <span>{assignedPatients.length} assigned</span>
                <span className="text-turquoise">•</span>
                <span>{availablePatients.length} available</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-24 lg:pb-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Messages */}
            {error && (
              <Card className="bg-red-500/10 border-red-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <XMarkIcon className="h-5 w-5 text-red-400" />
                    <span className="text-sm text-red-300">{error}</span>
                    <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300 h-8 w-8 p-0">
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {successMessage && (
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckIcon className="h-5 w-5 text-green-400" />
                    <span className="text-sm text-green-300">{successMessage}</span>
                    <Button variant="ghost" size="sm" onClick={() => setSuccessMessage(null)} className="ml-auto text-green-400 hover:text-green-300 h-8 w-8 p-0">
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Protocol Info */}
            {protocol && (
              <Card className="bg-background/10 border-border/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-turquoise/10 rounded-lg">
                      <DocumentTextIcon className="h-6 w-6 text-turquoise" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-white mb-1">{protocol.name}</h3>
                      {protocol.description && (
                        <p className="text-sm text-muted-foreground mb-3">{protocol.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          {protocol.duration} days
                        </span>
                        <span className="flex items-center gap-1">
                          <DocumentTextIcon className="h-4 w-4" />
                          {protocol.days.reduce((acc, day) => acc + day.tasks.length, 0)} tasks
                        </span>
                        <span className="flex items-center gap-1">
                          <UsersIcon className="h-4 w-4" />
                          {assignedPatients.length} active patient(s)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search */}
            <Card className="bg-background/10 border-border/20">
              <CardContent className="p-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 bg-background/20 border-border/30 focus:border-turquoise/50 text-white placeholder:text-white/50 text-base"
                  />
                  {searchTerm && (
                    <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-white">
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Available Patients */}
              <Card className="bg-background/10 border-border/20">
                <CardHeader>
                  <CardTitle className="text-base font-normal text-white flex items-center gap-2">
                    <PlusIcon className="h-5 w-5 text-turquoise" />
                    Available Patients ({availablePatients.length})
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Patients who can receive this protocol</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {availablePatients.length === 0 ? (
                    <div className="text-center py-8">
                      <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        {searchTerm 
                          ? `No patient found for "${searchTerm}"` 
                          : patients.length === 0
                            ? 'No patients registered yet'
                            : 'All patients already have this protocol'}
                      </p>
                      {patients.length === 0 ? (
                        <Button asChild className="bg-turquoise hover:bg-turquoise/90" size="sm">
                          <Link href="/doctor/patients">Register Patients</Link>
                        </Button>
                      ) : searchTerm ? (
                        <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
                          Clear search
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    availablePatients.map((patient) => (
                      <PatientCard
                        key={patient.id}
                        patient={patient}
                        protocol={protocol!}
                        onAssign={assignProtocol}
                        isAssigning={isAssigning === patient.id}
                        startDate={assignStartDate}
                        onStartDateChange={setAssignStartDate}
                        hasActiveProtocol={patient.assignedProtocols.some(ap => ap.isActive)}
                      />
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Patients with Assigned Protocol */}
              <Card className="bg-background/10 border-border/20">
                <CardHeader>
                  <CardTitle className="text-base font-normal text-white flex items-center gap-2">
                    <CheckIcon className="h-5 w-5 text-green-400" />
                    Assigned Protocol ({assignedPatients.length})
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Patients who already have this active protocol</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assignedPatients.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No patients with this protocol yet</p>
                    </div>
                  ) : (
                    assignedPatients.map((patient) => (
                      <PatientCard
                        key={patient.id}
                        patient={patient}
                        protocol={protocol!}
                        onAssign={assignProtocol}
                        isAssigning={false}
                        startDate={assignStartDate}
                        onStartDateChange={setAssignStartDate}
                        hasActiveProtocol={patient.assignedProtocols.some(ap => ap.isActive)}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 