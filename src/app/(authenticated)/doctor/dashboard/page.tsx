'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UsersIcon, 
  DocumentTextIcon, 
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  UserPlusIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Patient {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  assignedProtocols: Array<{
    id: string;
    protocol: {
      id: string;
      name: string;
      duration: number;
    };
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  }>;
}

interface Protocol {
  id: string;
  name: string;
  duration: number;
  description?: string;
  isTemplate: boolean;
  assignments: Array<{
    id: string;
    user: {
      id: string;
      name?: string;
      email?: string;
    };
    isActive: boolean;
  }>;
}

interface DashboardStats {
  totalPatients: number;
  activeProtocols: number;
  totalProtocols: number;
  completedToday: number;
}

export default function DoctorDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activeProtocols: 0,
    totalProtocols: 0,
    completedToday: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);

        // Carregar pacientes
        const patientsResponse = await fetch('/api/patients');
        if (!patientsResponse.ok) {
          console.error('Error loading patients:', patientsResponse.status);
          return;
        }
        const patientsData = await patientsResponse.json();
        
        // Carregar protocolos
        const protocolsResponse = await fetch('/api/protocols');
        const protocolsData = await protocolsResponse.json();

        setPatients(Array.isArray(patientsData) ? patientsData : []);
        setProtocols(Array.isArray(protocolsData) ? protocolsData : []);

        // Calcular estatísticas
        const totalPatients = patientsData.length || 0;
        const activeProtocols = patientsData.reduce((acc: number, patient: Patient) => {
          return acc + patient.assignedProtocols.filter(p => p.isActive).length;
        }, 0);
        const totalProtocols = protocolsData.length || 0;

        setStats({
          totalPatients,
          activeProtocols,
          totalProtocols,
          completedToday: 0 // TODO: Implementar estatística de conclusões diárias
        });

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      loadDashboardData();
    }
  }, [session]);

  const getPatientInitials = (name?: string) => {
    if (!name) return 'P';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getActiveProtocolForPatient = (patient: Patient) => {
    return patient.assignedProtocols.find(p => p.isActive);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="text-xs text-slate-600">Carregando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-light text-slate-800">
              Dashboard Médico
            </h1>
            <p className="text-sm text-slate-600">
              Bem-vindo, Dr. {session?.user?.name}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link href="/doctor/patients">
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Novo Paciente
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline"
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            >
              <Link href="/doctor/protocols">
                <PlusIcon className="h-4 w-4 mr-2" />
                Novo Protocolo
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UsersIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600">Pacientes</p>
                  <p className="text-xl font-light text-slate-800">{stats.totalPatients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ClockIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600">Protocolos Ativos</p>
                  <p className="text-xl font-light text-slate-800">{stats.activeProtocols}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DocumentTextIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600">Total Protocolos</p>
                  <p className="text-xl font-light text-slate-800">{stats.totalProtocols}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CheckCircleIcon className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600">Concluídos Hoje</p>
                  <p className="text-xl font-light text-slate-800">{stats.completedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Pacientes Recentes */}
          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-normal text-slate-800">Pacientes Ativos</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-slate-800 hover:bg-slate-100">
                <Link href="/doctor/patients">Ver todos</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {patients.length === 0 ? (
                <div className="text-center py-8">
                  <UsersIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Nenhum paciente cadastrado</p>
                  <Button className="mt-3 bg-blue-600 hover:bg-blue-700 text-white" size="sm" asChild>
                    <Link href="/doctor/patients">Adicionar primeiro paciente</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {patients.slice(0, 5).map((patient) => {
                    const activeProtocol = getActiveProtocolForPatient(patient);
                    
                    return (
                      <div key={patient.id} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-lg border border-slate-200/50">
                        <div className="flex items-center gap-3">
                          {/* Simple Avatar */}
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                            {getPatientInitials(patient.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{patient.name || 'Sem nome'}</p>
                            <p className="text-xs text-slate-600">{patient.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {activeProtocol ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-700 border border-blue-200">
                              {activeProtocol.protocol.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-slate-100 text-slate-600 border border-slate-200">
                              Sem protocolo
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Protocolos Recentes */}
          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-normal text-slate-800">Protocolos Criados</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-slate-800 hover:bg-slate-100">
                <Link href="/doctor/protocols">Ver todos</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {protocols.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Nenhum protocolo criado</p>
                  <Button className="mt-3 bg-blue-600 hover:bg-blue-700 text-white" size="sm" asChild>
                    <Link href="/doctor/protocols">Criar primeiro protocolo</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {protocols.slice(0, 5).map((protocol) => {
                    const activeAssignments = protocol.assignments.filter(a => a.isActive).length;
                    
                    return (
                      <div key={protocol.id} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-lg border border-slate-200/50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-800">{protocol.name}</p>
                            {protocol.isTemplate && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700 border border-purple-200">
                                Template
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <CalendarDaysIcon className="h-3 w-3 text-slate-500" />
                            <span className="text-xs text-slate-600">
                              {protocol.duration} dias
                            </span>
                            {activeAssignments > 0 && (
                              <>
                                <span className="text-xs text-slate-500">•</span>
                                <span className="text-xs text-blue-600">
                                  {activeAssignments} ativo{activeAssignments > 1 ? 's' : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6 bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-normal text-slate-800">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                asChild
              >
                <Link href="/doctor/patients">
                  <UserPlusIcon className="h-6 w-6" />
                  <span className="text-xs">Adicionar Paciente</span>
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                asChild
              >
                <Link href="/doctor/protocols">
                  <PlusIcon className="h-6 w-6" />
                  <span className="text-xs">Criar Protocolo</span>
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                asChild
              >
                <Link href="/doctor/templates">
                  <DocumentTextIcon className="h-6 w-6" />
                  <span className="text-xs">Templates</span>
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                asChild
              >
                <Link href="/doctor/patients">
                  <UsersIcon className="h-6 w-6" />
                  <span className="text-xs">Ver Pacientes</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 