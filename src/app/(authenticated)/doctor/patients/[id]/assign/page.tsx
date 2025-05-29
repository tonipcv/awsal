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
  ArrowPathIcon,
  XMarkIcon,
  TrashIcon,
  ShoppingBagIcon
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

// Componente para protocolo atribuído
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
      case 'ACTIVE': return 'bg-green-100 text-green-700 border-green-200';
      case 'INACTIVE': return 'bg-red-100 text-red-700 border-red-200';
      case 'UNAVAILABLE': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <EyeIcon className="h-3 w-3" />;
      case 'INACTIVE': return <EyeSlashIcon className="h-3 w-3" />;
      case 'UNAVAILABLE': return <ExclamationTriangleIcon className="h-3 w-3" />;
      default: return <EyeIcon className="h-3 w-3" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Ativo';
      case 'INACTIVE': return 'Inativo';
      case 'UNAVAILABLE': return 'Indisponível';
      default: return status;
    }
  };

  return (
    <Card className="bg-white border-slate-200 hover:border-blue-300 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-sm font-medium text-slate-800 truncate">{protocol.name}</h4>
              <Badge className={cn("flex items-center gap-1 text-xs", getStatusColor(assignment.status))}>
                {getStatusIcon(assignment.status)}
                <span>{getStatusText(assignment.status)}</span>
              </Badge>
            </div>
            
            {protocol.description && (
              <p className="text-xs text-slate-600 mb-3 line-clamp-2">{protocol.description}</p>
            )}
            
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                {protocol.duration} dias
              </span>
              <span className="flex items-center gap-1">
                <DocumentTextIcon className="h-3 w-3" />
                {totalTasks} tarefas
              </span>
              <span className="flex items-center gap-1">
                <CalendarDaysIcon className="h-3 w-3" />
                {format(new Date(assignment.startDate), 'dd/MM', { locale: ptBR })} - {format(new Date(assignment.endDate), 'dd/MM', { locale: ptBR })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <select
              value={assignment.status}
              onChange={(e) => onStatusUpdate(assignment.id, e.target.value)}
              disabled={isUpdating || isRemoving}
              className="text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 focus:border-blue-500 disabled:opacity-50"
            >
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="UNAVAILABLE">Indisponível</option>
            </select>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(assignment.id)}
              disabled={isUpdating || isRemoving}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
            >
              {isRemoving ? (
                <ArrowPathIcon className="h-3 w-3 animate-spin" />
              ) : (
                <TrashIcon className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para protocolo disponível
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
    <Card className="bg-white border-slate-200 hover:border-blue-300 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-sm font-medium text-slate-800 truncate">{protocol.name}</h4>
              {wasInactive && (
                <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                  Reativar
                </Badge>
              )}
            </div>
            
            {protocol.description && (
              <p className="text-xs text-slate-600 mb-3 line-clamp-2">{protocol.description}</p>
            )}
            
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                {protocol.duration} dias
              </span>
              <span className="flex items-center gap-1">
                <DocumentTextIcon className="h-3 w-3" />
                {totalTasks} tarefas
              </span>
              <span className="flex items-center gap-1">
                <CalendarDaysIcon className="h-3 w-3" />
                Até {format(endDate, 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 focus:border-blue-500 w-28"
            />
            
            <Button
              onClick={() => onAssign(protocol.id)}
              disabled={isAssigning}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3"
            >
              {isAssigning ? (
                <>
                  <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />
                  <span className="hidden sm:inline">...</span>
                </>
              ) : (
                <>
                  <PlusIcon className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">{wasInactive ? 'Reativar' : 'Atribuir'}</span>
                </>
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
          setError('Paciente não encontrado ou você não tem permissão para acessá-lo');
        } else if (patientResponse.status === 401) {
          setError('Sessão expirada. Faça login novamente');
          setTimeout(() => router.push('/auth/signin'), 2000);
          return;
        } else {
          setError('Erro ao carregar dados do paciente');
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
        setError('Erro ao carregar protocolos disponíveis');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Erro de conexão. Verifique sua internet e tente novamente');
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
        setSuccessMessage('Protocolo atribuído com sucesso!');
        setAssignStartDate(format(new Date(), 'yyyy-MM-dd'));
        await loadData(params.id as string);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao atribuir protocolo');
      }
    } catch (error) {
      console.error('Error assigning protocol:', error);
      setError('Erro de conexão. Tente novamente');
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
        setSuccessMessage(`Status atualizado com sucesso`);
        await loadData(params.id as string);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao atualizar status do protocolo');
      }
    } catch (error) {
      console.error('Error updating protocol status:', error);
      setError('Erro de conexão. Tente novamente');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    if (!confirm('Tem certeza que deseja remover este protocolo do paciente?')) return;
    
    try {
      setRemovingAssignment(assignmentId);
      setError(null);
      
      await updateProtocolStatus(assignmentId, 'INACTIVE');
      setSuccessMessage('Protocolo removido com sucesso');
    } catch (error) {
      console.error('Error removing assignment:', error);
      setError('Erro ao remover protocolo');
    } finally {
      setRemovingAssignment(null);
    }
  };

  // Processar dados
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <span className="text-sm text-slate-600">Carregando dados...</span>
        </div>
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <XMarkIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium mb-2 text-slate-800">{error}</h2>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => loadData(params.id as string)} className="bg-blue-600 hover:bg-blue-700">
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button variant="outline" asChild className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900">
              <Link href="/doctor/patients">Voltar aos Pacientes</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalTasks = assignedProtocols.reduce((acc, protocol) => {
    return acc + protocol.days.reduce((dayAcc, day) => dayAcc + day.tasks.length, 0);
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" asChild className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900">
            <Link href={`/doctor/patients/${patient?.id}`}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-light text-slate-800">
              Protocolos do Paciente
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
              <UserIcon className="h-3 w-3" />
              <span>{patient?.name || patient?.email}</span>
              <span>•</span>
              <CheckIcon className="h-3 w-3" />
              <span>{assignedProtocols.length} ativo(s)</span>
              <span>•</span>
              <DocumentTextIcon className="h-3 w-3" />
              <span>{totalTasks} tarefas</span>
              <span>•</span>
              <ShoppingBagIcon className="h-3 w-3" />
              <span>{availableProtocols.length} disponível(eis)</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Messages */}
          {error && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <XMarkIcon className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                  <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-100 h-8 w-8 p-0">
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {successMessage && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-700">{successMessage}</span>
                  <Button variant="ghost" size="sm" onClick={() => setSuccessMessage(null)} className="ml-auto text-green-600 hover:text-green-700 hover:bg-green-100 h-8 w-8 p-0">
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search */}
          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Buscar protocolos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 bg-white border-slate-300 focus:border-blue-500 text-slate-700 placeholder:text-slate-500 text-base"
                />
                {searchTerm && (
                  <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Protocolos Atribuídos */}
            <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                  <CheckIcon className="h-5 w-5 text-green-600" />
                  Protocolos Atribuídos
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                    {assignedProtocols.length}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-slate-600">Protocolos ativos para este paciente</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {assignedProtocols.length === 0 ? (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Nenhum protocolo atribuído</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Atribua protocolos para que o paciente possa seguir o tratamento
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

            {/* Protocolos Disponíveis */}
            <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                  <PlusIcon className="h-5 w-5 text-blue-600" />
                  Protocolos Disponíveis
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                    {availableProtocols.length}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-slate-600">Protocolos que podem ser atribuídos</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableProtocols.length === 0 ? (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 mb-2">
                      {searchTerm 
                        ? `Nenhum protocolo encontrado para "${searchTerm}"` 
                        : protocols.length === 0
                          ? 'Nenhum protocolo criado ainda'
                          : 'Todos os protocolos já foram atribuídos'}
                    </p>
                    {protocols.length === 0 ? (
                      <Button asChild className="bg-blue-600 hover:bg-blue-700" size="sm">
                        <Link href="/doctor/protocols">Criar Protocolos</Link>
                      </Button>
                    ) : searchTerm ? (
                      <Button variant="outline" size="sm" onClick={() => setSearchTerm('')} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                        Limpar busca
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