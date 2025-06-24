'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ExclamationTriangleIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { toast } from 'react-hot-toast';

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
}

interface ImportResults {
  message: string;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
}

export default function PatientsPage() {
  const { data: session } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [showEditPatient, setShowEditPatient] = useState(false);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [isImprovingNotes, setIsImprovingNotes] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  
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
    notes: ''
  });

  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        alert(`Erro ao carregar clientes: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      alert('Erro de Conexão ao carregar clientes');
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
      notes: ''
    });
    setShowOptionalFields(false);
  };

  const openEditModal = (patient: Patient) => {
    setPatientToEdit(patient);
    setNewPatient({
      name: patient.name || '',
      email: patient.email || '',
      phone: patient.phone || '',
      birthDate: patient.birthDate || '',
      gender: patient.gender || '',
      address: patient.address || '',
      emergencyContact: patient.emergencyContact || '',
      emergencyPhone: patient.emergencyPhone || '',
      medicalHistory: patient.medicalHistory || '',
      allergies: patient.allergies || '',
      medications: patient.medications || '',
      notes: patient.notes || ''
    });
    setShowEditPatient(true);
  };

  const updatePatient = async () => {
    if (!newPatient.name.trim() || !newPatient.email.trim() || !patientToEdit) {
      alert('Nome e email são obrigatórios');
      return;
    }

    try {
      setIsEditingPatient(true);
      
      // Prepare data for sending (remove empty fields)
      const patientData: any = {
        name: newPatient.name.trim(),
        email: newPatient.email.trim()
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

      const response = await fetch(`/api/patients/${patientToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patientData)
      });

      if (response.ok) {
        // Reload clients list
        await loadPatients();
        resetForm();
        setShowEditPatient(false);
        setPatientToEdit(null);
        alert('Cliente atualizado com sucesso!');
      } else {
        const error = await response.json();
        alert(`Erro ao atualizar cliente: ${error.error || 'Erro ao atualizar cliente'}`);
      }
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Erro ao atualizar cliente');
    } finally {
      setIsEditingPatient(false);
    }
  };

  const addPatient = async () => {
    if (!newPatient.name.trim() || !newPatient.email.trim()) {
      alert('Nome e email são obrigatórios');
      return;
    }

    try {
      setIsAddingPatient(true);
      
      // Prepare data for sending (remove empty fields)
      const patientData: any = {
        name: newPatient.name.trim(),
        email: newPatient.email.trim()
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar paciente');
      }

      // Automatically send password reset email
      if (result.id) {
        await sendPasswordResetEmail(result.id, result.email || newPatient.email);
      }

      toast.success('Cliente criado com sucesso!');
      loadPatients();
      setShowAddPatient(false);
      resetForm();
    } catch (err) {
      console.error('Error creating patient:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao criar paciente');
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
        alert(`Cliente ${patientName} foi removido com sucesso`);
      } else {
        const error = await response.json();
        alert(`Erro ao remover: ${error.error || 'Erro ao deletar cliente'}`);
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Erro ao deletar cliente');
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
        alert(`Email de redefinição de senha enviado para ${patientEmail} com sucesso!`);
        console.log('Reset URL (for testing):', result.resetUrl);
      } else {
        const error = await response.json();
        alert(`Erro ao enviar email de redefinição de senha: ${error.error || 'Erro ao enviar email de redefinição de senha'}`);
      }
    } catch (error) {
      console.error('Error sending password reset email:', error);
      alert('Erro ao enviar email de redefinição de senha');
    } finally {
      setSendingEmailId(null);
    }
  };

  const filteredPatients = patients.filter(patient => 
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPatients = filteredPatients.length;
  const totalPages = Math.ceil(totalPatients / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, endIndex);

  // Handle page change with smooth scroll
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Smooth scroll to top of patients section
    const patientsSection = document.querySelector('[data-patients-section]');
    if (patientsSection) {
      patientsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getPatientInitials = (name?: string) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getActiveProtocol = (patient: Patient) => {
    return patient.assignedProtocols.find(p => p.isActive);
  };

  const improveNotesWithAI = async () => {
    if (!newPatient.notes.trim()) {
      alert('Please write something in the notes before using AI to improve it.');
      return;
    }

    try {
      setIsImprovingNotes(true);
      
      const response = await fetch('/api/ai/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: newPatient.notes,
          context: 'medical_notes'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNewPatient({...newPatient, notes: data.improvedText});
        alert('Text improved successfully with AI!');
      } else {
        const errorData = await response.json();
        alert(`Error improving text: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error improving notes:', error);
      alert('Connection error while trying to improve text with AI.');
    } finally {
      setIsImprovingNotes(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    try {
      setIsImporting(true);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/patients/import', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error importing patients');
      }

      setImportResults(data);
      
      // Reload patients list
      loadPatients();
      
      // Show success message
      toast.success(data.message);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error importing patients:', error);
      toast.error('Error importing patients');
    } finally {
      setIsImporting(false);
    }
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
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowImportModal(true)}
              variant="outline"
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-xl px-6 shadow-md font-semibold"
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button 
              onClick={() => setShowAddPatient(true)}
              className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl px-6 shadow-md font-semibold"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Import Clients</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportResults(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 rounded-xl"
                >
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="p-6">
                {!importResults ? (
                  <div className="space-y-4">
                                          <div className="text-sm text-gray-600">
                        <p className="mb-2">Upload a CSV file with the following columns:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li><strong>Required:</strong> name, email</li>
                          <li>
                            <strong>Optional:</strong> phone, birthDate (YYYY-MM-DD), gender, address, 
                            emergencyContact, emergencyPhone, medicalHistory, allergies, medications, notes
                          </li>
                        </ul>
                        <div className="mt-2">
                          <a 
                            href="/example-patients.csv" 
                            download
                            className="text-[#5154e7] hover:text-[#4145d1] font-medium flex items-center gap-1"
                          >
                            <ArrowUpTrayIcon className="h-4 w-4" />
                            Download example CSV
                          </a>
                        </div>
                      </div>
                    
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ArrowUpTrayIcon className="w-8 h-8 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">.CSV file only</p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={isImporting}
                        />
                      </label>
                    </div>

                    {isImporting && (
                      <div className="text-center text-sm text-gray-600">
                        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#5154e7] border-r-transparent"></div>
                        <span className="ml-2">Importing clients...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 text-green-700 rounded-xl">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5" />
                        <p className="font-medium">{importResults.message}</p>
                      </div>
                    </div>

                    {importResults.errors.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Errors:</h3>
                        <div className="bg-red-50 rounded-xl p-4">
                          <ul className="space-y-2 text-sm text-red-700">
                            {importResults.errors.map((error, index) => (
                              <li key={index}>
                                Row {error.row} ({error.email}): {error.error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          setShowImportModal(false);
                          setImportResults(null);
                        }}
                        className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl px-6 shadow-md font-semibold"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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

                    <div className="flex items-center justify-center pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowOptionalFields(!showOptionalFields)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {showOptionalFields ? 'Hide Optional Fields' : 'Show Optional Fields'}
                        <ChevronRightIcon className={cn("h-4 w-4 ml-2 transition-transform", showOptionalFields ? "rotate-90" : "")} />
                      </Button>
                    </div>
                  </div>

                  {showOptionalFields && (
                    <>
                      {/* Contact Information */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Contact Information (Optional)</h3>
                        
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
                        <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Emergency Contact (Optional)</h3>
                        
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
                        <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Medical Information (Optional)</h3>
                        
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
                        <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Notes (Optional)</h3>
                        
                        <div>
                          <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                            General Notes
                          </Label>
                          <div className="relative">
                            <Textarea
                              id="notes"
                              value={newPatient.notes}
                              onChange={(e) => setNewPatient({...newPatient, notes: e.target.value})}
                              placeholder="General observations about the client"
                              className="mt-2 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl pr-12"
                              rows={3}
                            />
                            {newPatient.notes.trim() && (
                              <button
                                type="button"
                                onClick={improveNotesWithAI}
                                disabled={isImprovingNotes}
                                className="absolute right-3 top-4 p-1.5 text-gray-400 hover:text-[#5154e7] hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Improve text with AI"
                              >
                                {isImprovingNotes ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5154e7] border-t-transparent"></div>
                                ) : (
                                  <SparklesIcon className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
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

        {/* Edit Patient Modal */}
        {showEditPatient && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Edit Client</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowEditPatient(false);
                      setPatientToEdit(null);
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
                        <Label htmlFor="edit-name" className="text-sm font-semibold text-gray-700">
                          Full Name *
                        </Label>
                        <Input
                          id="edit-name"
                          value={newPatient.name}
                          onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                          placeholder="Client's full name"
                          className="mt-2 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl h-12"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-email" className="text-sm font-semibold text-gray-700">
                          Email *
                        </Label>
                        <Input
                          id="edit-email"
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
                        <Label htmlFor="edit-phone" className="text-sm font-semibold text-gray-700">
                          Phone
                        </Label>
                        <Input
                          id="edit-phone"
                          value={newPatient.phone}
                          onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                          placeholder="(11) 99999-9999"
                          className="mt-2 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl h-12"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-birthDate" className="text-sm font-semibold text-gray-700">
                          Birth Date
                        </Label>
                        <Input
                          id="edit-birthDate"
                          type="date"
                          value={newPatient.birthDate}
                          onChange={(e) => setNewPatient({...newPatient, birthDate: e.target.value})}
                          className="mt-2 bg-white text-gray-900 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl h-12"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-gender" className="text-sm font-semibold text-gray-700">
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
                        <Label htmlFor="edit-address" className="text-sm font-semibold text-gray-700">
                          Address
                        </Label>
                        <Input
                          id="edit-address"
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
                        <Label htmlFor="edit-emergencyContact" className="text-sm font-semibold text-gray-700">
                          Contact Name
                        </Label>
                        <Input
                          id="edit-emergencyContact"
                          value={newPatient.emergencyContact}
                          onChange={(e) => setNewPatient({...newPatient, emergencyContact: e.target.value})}
                          placeholder="Emergency contact name"
                          className="mt-2 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl h-12"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-emergencyPhone" className="text-sm font-semibold text-gray-700">
                          Emergency Phone
                        </Label>
                  <Input
                          id="edit-emergencyPhone"
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
                      <Label htmlFor="edit-medicalHistory" className="text-sm font-semibold text-gray-700">
                        Medical History
                      </Label>
                      <Textarea
                        id="edit-medicalHistory"
                        value={newPatient.medicalHistory}
                        onChange={(e) => setNewPatient({...newPatient, medicalHistory: e.target.value})}
                        placeholder="Relevant medical history, previous surgeries, etc."
                        className="mt-2 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-allergies" className="text-sm font-semibold text-gray-700">
                        Allergies
                      </Label>
                      <Textarea
                        id="edit-allergies"
                        value={newPatient.allergies}
                        onChange={(e) => setNewPatient({...newPatient, allergies: e.target.value})}
                        placeholder="Known allergies to medications, foods, etc."
                        className="mt-2 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-medications" className="text-sm font-semibold text-gray-700">
                        Current Medications
                      </Label>
                      <Textarea
                        id="edit-medications"
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
                      <Label htmlFor="edit-notes" className="text-sm font-semibold text-gray-700">
                        General Notes
                      </Label>
                      <div className="relative">
                        <Textarea
                          id="edit-notes"
                          value={newPatient.notes}
                          onChange={(e) => setNewPatient({...newPatient, notes: e.target.value})}
                          placeholder="General observations about the client"
                          className="mt-2 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl pr-12"
                          rows={3}
                        />
                        {newPatient.notes.trim() && (
                          <button
                            type="button"
                            onClick={improveNotesWithAI}
                            disabled={isImprovingNotes}
                            className="absolute right-3 top-4 p-1.5 text-gray-400 hover:text-[#5154e7] hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Improve text with AI"
                          >
                            {isImprovingNotes ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5154e7] border-t-transparent"></div>
                            ) : (
                              <SparklesIcon className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowEditPatient(false);
                    setPatientToEdit(null);
                      resetForm();
                    }}
                    disabled={isEditingPatient}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={updatePatient}
                    disabled={isEditingPatient}
                    className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl shadow-md font-semibold"
                  >
                    {isEditingPatient ? 'Updating...' : 'Update Client'}
                  </Button>
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

        {/* Main Content */}
        <div data-patients-section>
          {/* Pagination Info */}
          {totalPatients > 0 && (
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500 font-medium">
                Showing {startIndex + 1}-{Math.min(endIndex, totalPatients)} of {totalPatients} clients
              </p>
            </div>
          )}

          {/* Clients Grid */}
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
            <div className="space-y-4">
            {currentPatients.map((patient) => {
              const activeProtocol = getActiveProtocol(patient);
              const totalProtocols = patient.assignedProtocols.length;
              
              return (
                  <Card key={patient.id} className="bg-white border-gray-200 shadow-sm rounded-xl hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                              <h3 className="text-base font-semibold text-gray-900">
                              {patient.name || 'Name not provided'}
                            </h3>
                            <span className="text-sm text-gray-500">• {patient.email}</span>
                            {activeProtocol && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs bg-teal-100 text-teal-700 font-medium">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg h-8 w-8 p-0"
                        >
                          <Link href={`/doctor/patients/${patient.id}`}>
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(patient)}
                          className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg h-8 w-8 p-0"
                        >
                          <PencilIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendPasswordResetEmail(patient.id, patient.email || '')}
                          disabled={sendingEmailId === patient.id}
                          className="border-blue-300 bg-white text-blue-700 hover:bg-blue-50 hover:border-blue-400 rounded-lg font-medium h-8 px-2"
                          title="Send password setup email"
                        >
                          {sendingEmailId === patient.id ? (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></span>
                          ) : (
                            <PaperAirplaneIcon className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                            className="border-gray-300 bg-white text-gray-700 hover:bg-[#5154e7] hover:text-white hover:border-[#5154e7] rounded-lg font-medium h-8 px-2"
                        >
                          <Link href={`/doctor/patients/${patient.id}/assign`}>
                            <DocumentTextIcon className="h-3 w-3 mr-1" />
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
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg h-8 w-8 p-0"
                          >
                            {deletingPatientId === patient.id ? (
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></span>
                            ) : (
                              <TrashIcon className="h-3 w-3" />
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Previous
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                      className={cn(
                        "w-8 h-8 p-0 rounded-xl",
                        currentPage === pageNumber
                          ? "bg-[#5154e7] text-white hover:bg-[#4145d1]"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-gray-400 px-1">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      className="w-8 h-8 p-0 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              {/* Next Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
              >
                Next
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
} 