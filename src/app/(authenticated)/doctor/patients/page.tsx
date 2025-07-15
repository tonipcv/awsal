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
  ArrowUpTrayIcon,
  UserPlusIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
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
      console.log('🔄 Loading patients...');
      
      const response = await fetch('/api/patients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('📥 API Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 API Response data:', data);

      if (response.ok) {
        setPatients(Array.isArray(data) ? data : []);
        console.log('✅ Patients loaded:', data.length || 0);
      } else {
        console.error('❌ Error loading patients:', data.error);
        toast.error(`Erro ao carregar pacientes: ${data.error}`);
      }
    } catch (error) {
      console.error('❌ Error in loadPatients:', error);
      toast.error('Erro ao carregar pacientes');
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
    router.push(`/doctor/patients/${patient.id}`);
  };

  const updatePatient = async () => {
    if (!newPatient.name.trim() || !newPatient.email.trim() || !patientToEdit) {
      toast.error('Nome e email são obrigatórios');
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
      if (newPatient.phone?.trim()) patientData.phone = newPatient.phone.trim();
      if (newPatient.birthDate) patientData.birthDate = newPatient.birthDate;
      if (newPatient.gender) patientData.gender = newPatient.gender;
      if (newPatient.address?.trim()) patientData.address = newPatient.address.trim();
      if (newPatient.emergencyContact?.trim()) patientData.emergencyContact = newPatient.emergencyContact.trim();
      if (newPatient.emergencyPhone?.trim()) patientData.emergencyPhone = newPatient.emergencyPhone.trim();
      if (newPatient.medicalHistory?.trim()) patientData.medicalHistory = newPatient.medicalHistory.trim();
      if (newPatient.allergies?.trim()) patientData.allergies = newPatient.allergies.trim();
      if (newPatient.medications?.trim()) patientData.medications = newPatient.medications.trim();
      if (newPatient.notes?.trim()) patientData.notes = newPatient.notes.trim();

      const response = await fetch(`/api/patients/${patientToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patientData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar cliente');
      }

      // Reload clients list
      await loadPatients();
      resetForm();
      setShowEditPatient(false);
      setPatientToEdit(null);
      toast.success('Cliente atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error updating patient:', error);
      toast.error(error.message || 'Erro ao atualizar cliente');
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your clients and their protocols
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="bg-[#5154e7] hover:bg-[#4145d1] text-white shadow-md rounded-xl font-semibold"
              >
                <Link href="/doctor/patients/smart-add">
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Add Client
                </Link>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#5154e7] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-4 text-gray-600">Loading clients...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              </div>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No clients registered</h3>
              <p className="mt-1 text-sm text-gray-500">Start by adding your first client</p>
              <div className="mt-6">
                <Button
                  asChild
                  className="bg-[#5154e7] hover:bg-[#4145d1] text-white shadow-md rounded-xl font-semibold"
                >
                  <Link href="/doctor/patients/smart-add">
                    <UserPlusIcon className="h-5 w-5 mr-2" />
                    Add First Client
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search clients..."
                      className="block w-full rounded-xl border-0 py-3 pl-10 pr-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#5154e7] sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {currentPatients.map((patient) => {
                  const activeProtocol = getActiveProtocol(patient);
                  const totalProtocols = patient.assignedProtocols?.length || 0;
                  
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
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPatientToDelete({ id: patient.id, name: patient.name || 'Unnamed Patient' });
                                setShowDeleteConfirm(true);
                              }}
                              disabled={deletingPatientId === patient.id}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg h-8 w-8 p-0"
                              title="Delete patient"
                            >
                              {deletingPatientId === patient.id ? (
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></span>
                              ) : (
                                <TrashIcon className="h-3 w-3" />
                              )}
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
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Patient Modal */}
      {showEditPatient && (
        <Dialog open={showEditPatient} onOpenChange={setShowEditPatient}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
              <DialogDescription>
                Update client information. Required fields are marked with *.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={newPatient.birthDate}
                    onChange={(e) => setNewPatient({ ...newPatient, birthDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newPatient.address}
                  onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={newPatient.emergencyContact}
                    onChange={(e) => setNewPatient({ ...newPatient, emergencyContact: e.target.value })}
                    placeholder="Contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={newPatient.emergencyPhone}
                    onChange={(e) => setNewPatient({ ...newPatient, emergencyPhone: e.target.value })}
                    placeholder="Emergency phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalHistory">Medical History</Label>
                <Textarea
                  id="medicalHistory"
                  value={newPatient.medicalHistory}
                  onChange={(e) => setNewPatient({ ...newPatient, medicalHistory: e.target.value })}
                  placeholder="Relevant medical history"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Input
                    id="allergies"
                    value={newPatient.allergies}
                    onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                    placeholder="Known allergies"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medications">Medications</Label>
                  <Input
                    id="medications"
                    value={newPatient.medications}
                    onChange={(e) => setNewPatient({ ...newPatient, medications: e.target.value })}
                    placeholder="Current medications"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newPatient.notes}
                  onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditPatient(false);
                  resetForm();
                }}
                disabled={isEditingPatient}
                className="mt-3 sm:mt-0"
              >
                Cancel
              </Button>
              <Button
                onClick={updatePatient}
                disabled={isEditingPatient}
                className="bg-[#5154e7] hover:bg-[#4145d1] text-white"
              >
                {isEditingPatient ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></span>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && patientToDelete && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-red-600">
                <ExclamationTriangleIcon className="h-6 w-6" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="text-gray-600 pt-2">
                Are you sure you want to delete the patient <strong>"{patientToDelete.name}"</strong>?
                <br />
                <br />
                This action cannot be undone and will permanently remove:
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Patient profile and personal information</li>
                  <li>All assigned protocols and progress</li>
                  <li>All medical history and notes</li>
                  <li>All associated data</li>
                </ul>
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={handleDeleteCancel}
                disabled={deletingPatientId !== null}
                className="mt-3 sm:mt-0 sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={deletingPatientId !== null}
                className="bg-red-600 hover:bg-red-700 text-white sm:w-auto"
              >
                {deletingPatientId === patientToDelete.id ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete Patient
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 