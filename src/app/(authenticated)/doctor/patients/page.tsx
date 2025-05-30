'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  PlusIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  XMarkIcon,
  TrashIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Patient {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalHistory?: string;
  allergies?: string;
  medications?: string;
  notes?: string;
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

interface NewPatientForm {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  medicalHistory: string;
  allergies: string;
  medications: string;
  notes: string;
  sendCredentials: boolean;
}

export default function PatientsPage() {
  const { data: session } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null);
  
  const [newPatient, setNewPatient] = useState<NewPatientForm>({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalHistory: '',
    allergies: '',
    medications: '',
    notes: '',
    sendCredentials: true
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/patients');
      if (response.ok) {
        const data = await response.json();
        console.log('Patients loaded:', data);
        setPatients(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json();
        console.error('API Error:', response.status, errorData);
        alert(`Erro ao carregar pacientes: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      alert('Erro de conexão ao carregar pacientes');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewPatient({
      name: '',
      email: '',
      phone: '',
      birthDate: '',
      gender: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      medicalHistory: '',
      allergies: '',
      medications: '',
      notes: '',
      sendCredentials: true
    });
  };

  const addPatient = async () => {
    if (!newPatient.name.trim() || !newPatient.email.trim()) {
      alert('Nome e email são obrigatórios');
      return;
    }

    try {
      setIsAddingPatient(true);
      
      // Preparar dados para envio (remover campos vazios)
      const patientData: any = {
        name: newPatient.name.trim(),
        email: newPatient.email.trim(),
        sendCredentials: newPatient.sendCredentials
      };

      // Adicionar campos opcionais apenas se preenchidos
      if (newPatient.phone.trim()) patientData.phone = newPatient.phone.trim();
      if (newPatient.birthDate) patientData.birthDate = newPatient.birthDate;
      if (newPatient.gender) patientData.gender = newPatient.gender;
      if (newPatient.address.trim()) patientData.address = newPatient.address.trim();
      if (newPatient.emergencyContact.trim()) patientData.emergencyContact = newPatient.emergencyContact.trim();
      if (newPatient.emergencyPhone.trim()) patientData.emergencyPhone = newPatient.emergencyPhone.trim();
      if (newPatient.medicalHistory.trim()) patientData.medicalHistory = newPatient.medicalHistory.trim();
      if (newPatient.allergies.trim()) patientData.allergies = newPatient.allergies.trim();
      if (newPatient.medications.trim()) patientData.medications = newPatient.medications.trim();
      if (newPatient.notes.trim()) patientData.notes = newPatient.notes.trim();

      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patientData)
      });

      if (response.ok) {
        const result = await response.json();
        // Recarregar a lista de pacientes
        await loadPatients();
        resetForm();
        setShowAddPatient(false);
        
        if (result.temporaryPassword) {
          setGeneratedCredentials({ email: result.email, password: result.temporaryPassword });
          setShowCredentials(true);
        } else {
          alert('Paciente criado com sucesso!');
        }
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

  const deletePatient = async (patientId: string, patientName: string) => {
    try {
      setDeletingPatientId(patientId);
      
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Recarregar a lista de pacientes
        await loadPatients();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao excluir paciente');
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert('Erro ao excluir paciente');
    } finally {
      setDeletingPatientId(null);
      setShowDeleteConfirm(false);
      setPatientToDelete(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (patientToDelete) {
      deletePatient(patientToDelete.id, patientToDelete.name);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setPatientToDelete(null);
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
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8">
        
        {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-light text-gray-900">
              Pacientes
            </h1>
              <p className="text-gray-500">
              Gerencie seus pacientes e protocolos atribuídos
            </p>
          </div>
          
          <Button 
            onClick={() => setShowAddPatient(true)}
              className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl px-6 shadow-md"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Adicionar Paciente
          </Button>
        </div>

        {/* Add Patient Modal */}
        {showAddPatient && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Adicionar Novo Paciente</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddPatient(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">Informações Básicas *</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                          Nome Completo *
                        </Label>
                        <Input
                          id="name"
                          value={newPatient.name}
                          onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                          placeholder="Nome completo do paciente"
                          className="mt-1 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7]"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={newPatient.email}
                          onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                          placeholder="email@exemplo.com"
                          className="mt-1 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Informações de Contato */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">Informações de Contato</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          Telefone
                        </Label>
                        <Input
                          id="phone"
                          value={newPatient.phone}
                          onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                          placeholder="(11) 99999-9999"
                          className="mt-1 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7]"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="birthDate" className="text-sm font-medium text-gray-700">
                          Data de Nascimento
                        </Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={newPatient.birthDate}
                          onChange={(e) => setNewPatient({...newPatient, birthDate: e.target.value})}
                          className="mt-1 bg-white text-gray-900 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7]"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                          Gênero
                        </Label>
                        <Select value={newPatient.gender} onValueChange={(value) => setNewPatient({...newPatient, gender: value})}>
                          <SelectTrigger className="mt-1 bg-white text-gray-900 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7]">
                            <SelectValue placeholder="Selecione o gênero" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-200 shadow-lg">
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Feminino</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                          Endereço
                        </Label>
                        <Input
                          id="address"
                          value={newPatient.address}
                          onChange={(e) => setNewPatient({...newPatient, address: e.target.value})}
                          placeholder="Endereço completo"
                          className="mt-1 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contato de Emergência */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">Contato de Emergência</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emergencyContact" className="text-sm font-medium text-gray-700">
                          Nome do Contato
                        </Label>
                        <Input
                          id="emergencyContact"
                          value={newPatient.emergencyContact}
                          onChange={(e) => setNewPatient({...newPatient, emergencyContact: e.target.value})}
                          placeholder="Nome do contato de emergência"
                          className="mt-1 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7]"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="emergencyPhone" className="text-sm font-medium text-gray-700">
                          Telefone de Emergência
                        </Label>
                  <Input
                          id="emergencyPhone"
                          value={newPatient.emergencyPhone}
                          onChange={(e) => setNewPatient({...newPatient, emergencyPhone: e.target.value})}
                          placeholder="(11) 99999-9999"
                          className="mt-1 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Informações Médicas */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">Informações Médicas</h3>
                    
                    <div>
                      <Label htmlFor="medicalHistory" className="text-sm font-medium text-gray-700">
                        Histórico Médico
                      </Label>
                      <Textarea
                        id="medicalHistory"
                        value={newPatient.medicalHistory}
                        onChange={(e) => setNewPatient({...newPatient, medicalHistory: e.target.value})}
                        placeholder="Histórico médico relevante, cirurgias anteriores, etc."
                        className="mt-1 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7]"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="allergies" className="text-sm font-medium text-gray-700">
                        Alergias
                      </Label>
                      <Textarea
                        id="allergies"
                        value={newPatient.allergies}
                        onChange={(e) => setNewPatient({...newPatient, allergies: e.target.value})}
                        placeholder="Alergias conhecidas a medicamentos, alimentos, etc."
                        className="mt-1 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7]"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="medications" className="text-sm font-medium text-gray-700">
                        Medicações Atuais
                      </Label>
                      <Textarea
                        id="medications"
                        value={newPatient.medications}
                        onChange={(e) => setNewPatient({...newPatient, medications: e.target.value})}
                        placeholder="Medicamentos em uso atualmente"
                        className="mt-1 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7]"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">Observações</h3>
                    
                    <div>
                      <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                        Notas Gerais
                      </Label>
                      <Textarea
                        id="notes"
                        value={newPatient.notes}
                        onChange={(e) => setNewPatient({...newPatient, notes: e.target.value})}
                        placeholder="Observações gerais sobre o paciente"
                        className="mt-1 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7]"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Configurações */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">Configurações</h3>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="sendCredentials"
                        checked={newPatient.sendCredentials}
                        onChange={(e) => setNewPatient({...newPatient, sendCredentials: e.target.checked})}
                        className="rounded border-gray-300 text-[#5154e7] focus:ring-[#5154e7]"
                      />
                      <Label htmlFor="sendCredentials" className="text-sm text-gray-700">
                        Gerar senha temporária e mostrar após criação
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowAddPatient(false);
                      resetForm();
                    }}
                    disabled={isAddingPatient}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={addPatient}
                    disabled={isAddingPatient}
                    className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl shadow-md"
                  >
                    {isAddingPatient ? 'Criando...' : 'Criar Paciente'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && patientToDelete && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                      <TrashIcon className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">Excluir Paciente</h3>
                      <p className="text-sm text-gray-500">Esta ação não pode ser desfeita</p>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <p className="text-gray-700 leading-relaxed">
                      Tem certeza que deseja excluir o paciente{' '}
                      <span className="font-semibold text-gray-900">"{patientToDelete.name}"</span>?
                    </p>
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        ⚠️ Todos os dados relacionados, incluindo protocolos e histórico, serão perdidos permanentemente.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      onClick={handleDeleteCancel}
                      disabled={deletingPatientId === patientToDelete.id}
                      className="flex-1 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 rounded-xl"
                >
                  Cancelar
                </Button>
                    <Button
                      onClick={handleDeleteConfirm}
                      disabled={deletingPatientId === patientToDelete.id}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-md rounded-xl"
                    >
                      {deletingPatientId === patientToDelete.id ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></span>
                          Excluindo...
                        </>
                      ) : (
                        'Excluir'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generated Credentials Modal */}
          {showCredentials && generatedCredentials && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircleIcon className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">Paciente Criado com Sucesso!</h3>
                      <p className="text-sm text-gray-500">Credenciais temporárias geradas</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                          <p className="text-sm font-mono text-gray-900 bg-white p-2 rounded border border-gray-200 mt-1">
                            {generatedCredentials.email}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Senha Temporária</label>
                          <p className="text-sm font-mono text-gray-900 bg-white p-2 rounded border border-gray-200 mt-1">
                            {generatedCredentials.password}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 Compartilhe essas credenciais com o paciente. Ele deverá alterar a senha no primeiro acesso.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`Email: ${generatedCredentials.email}\nSenha: ${generatedCredentials.password}`);
                      }}
                      className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl"
                    >
                      Copiar Credenciais
                    </Button>
                    <Button
                      onClick={() => {
                        setShowCredentials(false);
                        setGeneratedCredentials(null);
                      }}
                      className="flex-1 bg-[#5154e7] hover:bg-[#4145d1] text-white shadow-md rounded-xl"
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Search */}
          <Card className="mb-6 bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardContent className="p-6">
            <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar pacientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 bg-white text-gray-700 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Patients List */}
        {filteredPatients.length === 0 ? (
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardContent className="p-8">
              <div className="text-center">
                  <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-gray-900">
                  {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
                </h3>
                  <p className="text-sm text-gray-500 mb-4">
                  {searchTerm 
                    ? 'Tente ajustar o termo de busca'
                    : 'Comece adicionando seu primeiro paciente'
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setShowAddPatient(true)}
                      className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl shadow-md"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Paciente
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
            <div className="grid gap-6">
            {filteredPatients.map((patient) => {
              const activeProtocol = getActiveProtocol(patient);
              const totalProtocols = patient.assignedProtocols.length;
              
              return (
                  <Card key={patient.id} className="bg-white border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                          <div className="h-12 w-12 rounded-xl bg-[#5154e7] flex items-center justify-center text-sm font-medium text-white">
                          {getPatientInitials(patient.name)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-medium text-gray-900">
                              {patient.name || 'Nome não informado'}
                            </h3>
                            {activeProtocol && (
                                <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-green-100 text-green-700 border border-green-200">
                                Protocolo Ativo
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 mb-3">
                              <EnvelopeIcon className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-500">{patient.email}</span>
                              {patient.phone && (
                                <>
                                  <span className="text-gray-300 mx-2">•</span>
                                  <span className="text-sm text-gray-500">{patient.phone}</span>
                                </>
                              )}
                          </div>
                          
                          {activeProtocol ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                  <DocumentTextIcon className="h-3 w-3 text-gray-400" />
                                  <span className="text-sm font-medium text-gray-700">{activeProtocol.protocol.name}</span>
                              </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
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
                              <div className="text-sm text-gray-500">
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
                            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
                        >
                          <Link href={`/doctor/patients/${patient.id}`}>
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                            className="border-gray-300 bg-white text-gray-700 hover:bg-[#5154e7] hover:text-[#4145d1] hover:border-[#5154e7] rounded-xl"
                        >
                          <Link href={`/doctor/patients/${patient.id}/assign`}>
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            Protocolo
                          </Link>
                        </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPatientToDelete({ id: patient.id, name: patient.name || 'Paciente' });
                              setShowDeleteConfirm(true);
                            }}
                            disabled={deletingPatientId === patient.id}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                          >
                            {deletingPatientId === patient.id ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></span>
                            ) : (
                              <TrashIcon className="h-4 w-4" />
                            )}
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
    </div>
  );
} 