'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  PlusIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  EnvelopeIcon
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

export default function PatientsPage() {
  const { data: session } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [isAddingPatient, setIsAddingPatient] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/patients');
      if (response.ok) {
        const data = await response.json();
        setPatients(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addPatient = async () => {
    if (!newPatientEmail.trim()) {
      alert('Email é obrigatório');
      return;
    }

    try {
      setIsAddingPatient(true);
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newPatientEmail.trim()
        })
      });

      if (response.ok) {
        const newPatient = await response.json();
        setPatients([...patients, newPatient]);
        setNewPatientEmail('');
        setShowAddPatient(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao adicionar paciente');
      }
    } catch (error) {
      console.error('Error adding patient:', error);
      alert('Erro ao adicionar paciente');
    } finally {
      setIsAddingPatient(false);
    }
  };

  const filteredPatients = patients.filter(patient => 
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPatientInitials = (name?: string) => {
    if (!name) return 'P';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getActiveProtocol = (patient: Patient) => {
    return patient.assignedProtocols.find(p => p.isActive);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="text-xs text-slate-600">Carregando pacientes...</span>
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
              Pacientes
            </h1>
            <p className="text-sm text-slate-600">
              Gerencie seus pacientes e protocolos atribuídos
            </p>
          </div>
          
          <Button 
            onClick={() => setShowAddPatient(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Adicionar Paciente
          </Button>
        </div>

        {/* Add Patient Modal */}
        {showAddPatient && (
          <Card className="mb-6 bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm font-normal text-slate-800">Adicionar Novo Paciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Email do paciente"
                    value={newPatientEmail}
                    onChange={(e) => setNewPatientEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPatient()}
                    className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                  />
                </div>
                <Button 
                  onClick={addPatient}
                  disabled={isAddingPatient}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isAddingPatient ? 'Adicionando...' : 'Adicionar'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowAddPatient(false);
                    setNewPatientEmail('');
                  }}
                  className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  Cancelar
                </Button>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                O paciente receberá um convite por email para criar sua conta.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card className="mb-6 bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Buscar pacientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Patients List */}
        {filteredPatients.length === 0 ? (
          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center">
                <UsersIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-slate-800">
                  {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {searchTerm 
                    ? 'Tente ajustar o termo de busca'
                    : 'Comece adicionando seu primeiro paciente'
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setShowAddPatient(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Paciente
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPatients.map((patient) => {
              const activeProtocol = getActiveProtocol(patient);
              const totalProtocols = patient.assignedProtocols.length;
              
              return (
                <Card key={patient.id} className="bg-white/80 border-slate-200/50 backdrop-blur-sm hover:bg-slate-50/80 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                          {getPatientInitials(patient.name)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-medium text-slate-800">
                              {patient.name || 'Nome não informado'}
                            </h3>
                            {activeProtocol && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-700 border border-blue-200">
                                Protocolo Ativo
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 mb-3">
                            <EnvelopeIcon className="h-3 w-3 text-slate-500" />
                            <span className="text-sm text-slate-600">{patient.email}</span>
                          </div>
                          
                          {activeProtocol ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <DocumentTextIcon className="h-3 w-3 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700">{activeProtocol.protocol.name}</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-600">
                                <div className="flex items-center gap-1">
                                  <CalendarDaysIcon className="h-3 w-3" />
                                  <span>{activeProtocol.protocol.duration} dias</span>
                                </div>
                                <span>
                                  Iniciado em {format(new Date(activeProtocol.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-slate-600">
                              {totalProtocols > 0 
                                ? `${totalProtocols} protocolo${totalProtocols > 1 ? 's' : ''} concluído${totalProtocols > 1 ? 's' : ''}`
                                : 'Nenhum protocolo atribuído'
                              }
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                        >
                          <Link href={`/doctor/patients/${patient.id}`}>
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <Link href={`/doctor/patients/${patient.id}/assign`}>
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            Protocolo
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 