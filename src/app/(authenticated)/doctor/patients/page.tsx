'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  CheckCircleIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

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
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  
  // Notification states
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  
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
    sendCredentials: false
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
        console.log('🔍 DEBUG: Patients loaded from API:', data);
        
        // Debug each patient's email
        data.forEach((patient: Patient, index: number) => {
          console.log(`Patient ${index + 1}:`, {
            id: patient.id,
            name: patient.name,
            email: patient.email,
            emailType: typeof patient.email,
            emailValue: patient.email === null ? 'NULL' : patient.email === undefined ? 'UNDEFINED' : patient.email
          });
        });
        
        setPatients(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json();
        console.error('API Error:', response.status, errorData);
        showNotification('Erro ao Carregar', `Erro ao carregar clientes: ${errorData.error || 'Erro desconhecido'}`, 'error');
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      showNotification('Erro de Conexão', 'Erro de conexão ao carregar clientes', 'error');
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
      sendCredentials: false
    });
  };

  const addPatient = async () => {
    if (!newPatient.name.trim() || !newPatient.email.trim()) {
      showNotification('Campos Obrigatórios', 'Nome e email são obrigatórios', 'error');
      return;
    }

    try {
      setIsAddingPatient(true);
      
      // Prepare data for sending (remove empty fields)
      const patientData: any = {
        name: newPatient.name.trim(),
        email: newPatient.email.trim(),
        sendCredentials: newPatient.sendCredentials
      };

      // Add optional fields only if filled
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
        console.log('🔍 DEBUG: Patient creation result:', result);
        console.log('🔍 DEBUG: Result email:', result.email);
        console.log('🔍 DEBUG: Result patient:', result.patient);
        console.log('🔍 DEBUG: Result patient email:', result.patient?.email);
        
        // Reload clients list
        await loadPatients();
        resetForm();
        setShowAddPatient(false);
        
        // Automatically send password reset email instead of showing credentials
        if (newPatient.sendCredentials && result.patient?.id) {
          await sendPasswordResetEmail(result.patient.id, result.patient.email || newPatient.email);
        } else {
          showNotification('Cliente Criado!', 'Cliente criado com sucesso!', 'success');
        }
      } else {
        const error = await response.json();
        showNotification('Erro ao Criar Cliente', error.error || 'Erro ao adicionar cliente', 'error');
      }
    } catch (error) {
      console.error('Error adding client:', error);
      showNotification('Erro ao Criar Cliente', 'Erro ao adicionar cliente', 'error');
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
        // Reload clients list
        await loadPatients();
        showNotification('Cliente Removido', `Cliente ${patientName} foi removido com sucesso`, 'success');
      } else {
        const error = await response.json();
        showNotification('Erro ao Remover', error.error || 'Erro ao deletar cliente', 'error');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      showNotification('Erro ao Remover', 'Erro ao deletar cliente', 'error');
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

  const sendPasswordResetEmail = async (patientId: string, patientEmail: string) => {
    try {
      setSendingEmailId(patientId);
      
      const response = await fetch(`/api/patients/${patientId}/send-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        showNotification('Email Enviado!', `Email de redefinição de senha enviado para ${patientEmail} com sucesso!`, 'success');
        console.log('Reset URL (for testing):', result.resetUrl);
      } else {
        const error = await response.json();
        showNotification('Erro ao Enviar Email', error.error || 'Erro ao enviar email de redefinição de senha', 'error');
      }
    } catch (error) {
      console.error('Error sending password reset email:', error);
      showNotification('Erro ao Enviar Email', 'Erro ao enviar email de redefinição de senha', 'error');
    } finally {
      setSendingEmailId(null);
    }
  };

  const filteredPatients = patients.filter(patient => 
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPatientInitials = (name?: string) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getActiveProtocol = (patient: Patient) => {
    return patient.assignedProtocols.find(p => p.isActive);
  };

  // Helper function to show notifications
  const showNotification = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setNotificationTitle(title);
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotificationDialog(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                <div className="h-5 bg-gray-100 rounded-lg w-64 animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded-xl w-36 animate-pulse"></div>
            </div>

            {/* Search Skeleton */}
            <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6 mb-6">
              <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
            </div>

            {/* Clients List Skeleton */}
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse"></div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                          <div className="h-5 bg-gray-100 rounded-xl w-24 animate-pulse"></div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="h-4 bg-gray-100 rounded w-40 animate-pulse"></div>
                          <div className="h-4 bg-gray-100 rounded w-24 animate-pulse"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-100 rounded w-48 animate-pulse"></div>
                          <div className="h-3 bg-gray-100 rounded w-36 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-gray-100 rounded-xl animate-pulse"></div>
                      <div className="h-8 w-20 bg-gray-100 rounded-xl animate-pulse"></div>
                      <div className="h-8 w-8 bg-gray-100 rounded-xl animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
        
        {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Clients
            </h1>
              <p className="text-gray-600 font-medium">
              Manage your clients and assigned protocols
            </p>
          </div>
          
          <Button 
            onClick={() => setShowAddPatient(true)}
              className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl px-6 shadow-md font-semibold"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>

        {/* Add Patient Modal */}
        {showAddPatient && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Add New Client</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddPatient(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600 rounded-xl"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Basic Information *</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          value={newPatient.name}
                          onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                          placeholder="Client's full name"
                          className="mt-2 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl h-12"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                          Email *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={newPatient.email}
                          onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                          placeholder="email@example.com"
                          className="mt-2 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl h-12"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Contact Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                          Phone
                        </Label>
                        <Input
                          id="phone"
                          value={newPatient.phone}
                          onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                          placeholder="(11) 99999-9999"
                          className="mt-2 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl h-12"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="birthDate" className="text-sm font-semibold text-gray-700">
                          Birth Date
                        </Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={newPatient.birthDate}
                          onChange={(e) => setNewPatient({...newPatient, birthDate: e.target.value})}
                          className="mt-2 bg-white text-gray-900 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl h-12"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="gender" className="text-sm font-semibold text-gray-700">
                          Gender
                        </Label>
                        <Select value={newPatient.gender} onValueChange={(value) => setNewPatient({...newPatient, gender: value})}>
                          <SelectTrigger className="mt-2 bg-white text-gray-900 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl h-12">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-200 shadow-lg rounded-xl">
                            <SelectItem value="M">Male</SelectItem>
                            <SelectItem value="F">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
                          Address
                        </Label>
                        <Input
                          id="address"
                          value={newPatient.address}
                          onChange={(e) => setNewPatient({...newPatient, address: e.target.value})}
                          placeholder="Full address"
                          className="mt-2 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl h-12"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Emergency Contact</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emergencyContact" className="text-sm font-semibold text-gray-700">
                          Contact Name
                        </Label>
                        <Input
                          id="emergencyContact"
                          value={newPatient.emergencyContact}
                          onChange={(e) => setNewPatient({...newPatient, emergencyContact: e.target.value})}
                          placeholder="Emergency contact name"
                          className="mt-2 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl h-12"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="emergencyPhone" className="text-sm font-semibold text-gray-700">
                          Emergency Phone
                        </Label>
                  <Input
                          id="emergencyPhone"
                          value={newPatient.emergencyPhone}
                          onChange={(e) => setNewPatient({...newPatient, emergencyPhone: e.target.value})}
                          placeholder="(11) 99999-9999"
                          className="mt-2 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl h-12"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Medical Information</h3>
                    
                    <div>
                      <Label htmlFor="medicalHistory" className="text-sm font-semibold text-gray-700">
                        Medical History
                      </Label>
                      <Textarea
                        id="medicalHistory"
                        value={newPatient.medicalHistory}
                        onChange={(e) => setNewPatient({...newPatient, medicalHistory: e.target.value})}
                        placeholder="Relevant medical history, previous surgeries, etc."
                        className="mt-2 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="allergies" className="text-sm font-semibold text-gray-700">
                        Allergies
                      </Label>
                      <Textarea
                        id="allergies"
                        value={newPatient.allergies}
                        onChange={(e) => setNewPatient({...newPatient, allergies: e.target.value})}
                        placeholder="Known allergies to medications, foods, etc."
                        className="mt-2 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="medications" className="text-sm font-semibold text-gray-700">
                        Current Medications
                      </Label>
                      <Textarea
                        id="medications"
                        value={newPatient.medications}
                        onChange={(e) => setNewPatient({...newPatient, medications: e.target.value})}
                        placeholder="Medications currently in use"
                        className="mt-2 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Notes</h3>
                    
                    <div>
                      <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                        General Notes
                      </Label>
                      <Textarea
                        id="notes"
                        value={newPatient.notes}
                        onChange={(e) => setNewPatient({...newPatient, notes: e.target.value})}
                        placeholder="General observations about the client"
                        className="mt-2 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Settings</h3>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="sendCredentials"
                        checked={newPatient.sendCredentials}
                        onChange={(e) => setNewPatient({...newPatient, sendCredentials: e.target.checked})}
                        className="rounded border-gray-300 text-[#5154e7] focus:ring-[#5154e7]"
                      />
                      <Label htmlFor="sendCredentials" className="text-sm text-gray-700 font-medium">
                        Send password setup email to client after creation
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowAddPatient(false);
                      resetForm();
                    }}
                    disabled={isAddingPatient}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addPatient}
                    disabled={isAddingPatient}
                    className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl shadow-md font-semibold"
                  >
                    {isAddingPatient ? 'Creating...' : 'Create Client'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && patientToDelete && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                      <TrashIcon className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Delete Client</h3>
                      <p className="text-sm text-gray-500 font-medium">This action cannot be undone</p>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <p className="text-gray-700 leading-relaxed font-medium">
                      Are you sure you want to delete the client{' '}
                      <span className="font-bold text-gray-900">"{patientToDelete.name}"</span>?
                    </p>
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-800 font-medium">
                        ⚠️ All related data, including protocols and history, will be permanently lost.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      onClick={handleDeleteCancel}
                      disabled={deletingPatientId === patientToDelete.id}
                      className="flex-1 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 rounded-xl font-semibold"
                >
                  Cancel
                </Button>
                    <Button
                      onClick={handleDeleteConfirm}
                      disabled={deletingPatientId === patientToDelete.id}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-md rounded-xl font-semibold"
                    >
                      {deletingPatientId === patientToDelete.id ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></span>
                          Deleting...
                        </>
                      ) : (
                        'Delete'
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
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircleIcon className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Client Created Successfully!</h3>
                      <p className="text-sm text-gray-500 font-medium">Temporary credentials generated</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                          <p className="text-sm font-mono text-gray-900 bg-white p-2 rounded-xl border border-gray-200 mt-1">
                            {generatedCredentials.email}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Temporary Password</label>
                          <p className="text-sm font-mono text-gray-900 bg-white p-2 rounded-xl border border-gray-200 mt-1">
                            {generatedCredentials.password}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-sm text-blue-800 font-medium">
                        💡 Share these credentials with the client. They should change the password on first login.
              </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`Email: ${generatedCredentials.email}\nPassword: ${generatedCredentials.password}`);
                      }}
                      className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl font-semibold"
                    >
                      Copy Credentials
                    </Button>
                    <Button
                      onClick={() => {
                        setShowCredentials(false);
                        setGeneratedCredentials(null);
                      }}
                      className="flex-1 bg-[#5154e7] hover:bg-[#4145d1] text-white shadow-md rounded-xl font-semibold"
                    >
                      Close
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
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 bg-white text-gray-700 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl h-12"
              />
            </div>
          </CardContent>
        </Card>

        {/* Clients List */}
        {filteredPatients.length === 0 ? (
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardContent className="p-8">
              <div className="text-center">
                  <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2 text-gray-900">
                  {searchTerm ? 'No clients found' : 'No clients registered'}
                </h3>
                  <p className="text-sm text-gray-500 mb-4 font-medium">
                  {searchTerm 
                    ? 'Try adjusting your search term'
                    : 'Start by adding your first client'
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setShowAddPatient(true)}
                      className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl shadow-md font-semibold"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add First Client
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
            <div className="space-y-6">
            {filteredPatients.map((patient) => {
              const activeProtocol = getActiveProtocol(patient);
              const totalProtocols = patient.assignedProtocols.length;
              
              return (
                  <Card key={patient.id} className="bg-white border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                          <div className="h-12 w-12 rounded-xl bg-teal-100 flex items-center justify-center text-sm font-bold text-teal-600">
                          {getPatientInitials(patient.name)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-gray-900">
                              {patient.name || 'Name not provided'}
                            </h3>
                            {activeProtocol && (
                                <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs bg-teal-100 text-teal-700 border border-teal-200 font-semibold">
                                Active Protocol
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 mb-3">
                              <EnvelopeIcon className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-500 font-medium">{patient.email}</span>
                              {patient.phone && (
                                <>
                                  <span className="text-gray-300 mx-2">•</span>
                                  <span className="text-sm text-gray-500 font-medium">{patient.phone}</span>
                                </>
                              )}
                          </div>
                          
                          {activeProtocol ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                  <DocumentTextIcon className="h-3 w-3 text-gray-400" />
                                  <span className="text-sm font-semibold text-gray-700">{activeProtocol.protocol.name}</span>
                              </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                                <div className="flex items-center gap-1">
                                  <CalendarDaysIcon className="h-3 w-3" />
                                  <span>{activeProtocol.protocol.duration} days</span>
                                </div>
                                <span>
                                  Started on {format(new Date(activeProtocol.startDate), 'MM/dd/yyyy', { locale: enUS })}
                                </span>
                              </div>
                            </div>
                          ) : (
                              <div className="text-sm text-gray-500 font-medium">
                              {totalProtocols > 0 
                                ? `${totalProtocols} protocol${totalProtocols > 1 ? 's' : ''} completed`
                                : 'No protocols assigned'
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
                          onClick={() => sendPasswordResetEmail(patient.id, patient.email || '')}
                          disabled={sendingEmailId === patient.id}
                          className="border-blue-300 bg-white text-blue-700 hover:bg-blue-50 hover:border-blue-400 rounded-xl font-semibold"
                          title="Send password setup email"
                        >
                          {sendingEmailId === patient.id ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></span>
                          ) : (
                            <PaperAirplaneIcon className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                            className="border-gray-300 bg-white text-gray-700 hover:bg-[#5154e7] hover:text-white hover:border-[#5154e7] rounded-xl font-semibold"
                        >
                          <Link href={`/doctor/patients/${patient.id}/assign`}>
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            Protocol
                          </Link>
                        </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPatientToDelete({ id: patient.id, name: patient.name || 'Client' });
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

      {/* Beautiful Notification Dialog */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="bg-white border-gray-200 rounded-2xl max-w-md">
          <div className="text-center p-6">
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
              onClick={() => setShowNotificationDialog(false)}
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>

            {/* Icon */}
            <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
              notificationType === 'success' 
                ? 'bg-gradient-to-br from-emerald-100 to-emerald-50' 
                : 'bg-gradient-to-br from-red-100 to-red-50'
            }`}>
              {notificationType === 'success' ? (
                <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
              ) : (
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {notificationTitle}
            </h3>

            {/* Message */}
            <p className="text-gray-600 font-medium mb-6 leading-relaxed">
              {notificationMessage}
            </p>

            {/* Action Button */}
            <Button 
              onClick={() => setShowNotificationDialog(false)}
              className={`w-full h-12 rounded-xl font-semibold ${
                notificationType === 'success'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {notificationType === 'success' ? 'Perfeito!' : 'Entendi'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 