'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { PlusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { CreatePrescriptionDialog } from './components/create-prescription-dialog';
import { EditPrescriptionDialog } from './components/edit-prescription-dialog';

interface Prescription {
  id: string;
  protocol_id: string;
  protocol_name: string;
  user_id: string;
  user_name: string;
  user_email: string;
  prescribed_by: string;
  prescribed_at: string;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  status: 'PRESCRIBED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  current_day: number;
  adherence_rate: number;
}

export default function PrescriptionsPage() {
  const { data: session } = useSession();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  const fetchPrescriptions = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/v2/doctor/prescriptions', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Não autorizado. Por favor, faça login novamente.');
          // Aqui você pode redirecionar para a página de login se necessário
          return;
        }
        throw new Error(data.message || 'Failed to fetch prescriptions');
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch prescriptions');
      }
      
      setPrescriptions(data.data || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar prescrições');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return;

    try {
      const response = await fetch(`/api/v2/doctor/prescriptions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete prescription');

      toast.success('Prescription deleted successfully');
      await fetchPrescriptions();
    } catch (error) {
      console.error('Error deleting prescription:', error);
      toast.error('Failed to delete prescription');
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-100';
      case 'PRESCRIBED':
        return 'text-blue-600 bg-blue-100';
      case 'COMPLETED':
        return 'text-gray-600 bg-gray-100';
      case 'CANCELLED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Prescriptions</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage protocol prescriptions for your patients
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusIcon className="h-5 w-5 mr-2" />
              New Prescription
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading prescriptions...</span>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border border-gray-200">
              {prescriptions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions found</h3>
                  <p className="text-gray-500 mb-4">Start by creating your first prescription</p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create First Prescription
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Protocol</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Adherence</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prescriptions.map((prescription) => (
                      <TableRow key={prescription.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{prescription.user_name}</div>
                            <div className="text-sm text-gray-500">{prescription.user_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{prescription.protocol_name}</TableCell>
                        <TableCell>
                          {prescription.planned_start_date ? format(new Date(prescription.planned_start_date), 'MMM d, yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          {prescription.planned_end_date ? format(new Date(prescription.planned_end_date), 'MMM d, yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              prescription.status
                            )}`}
                          >
                            {prescription.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ width: `${prescription.adherence_rate}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {prescription.adherence_rate}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPrescription(prescription);
                                setEditDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(prescription.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>
      </div>

      <CreatePrescriptionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchPrescriptions}
      />

      {selectedPrescription && (
        <EditPrescriptionDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          prescription={selectedPrescription}
          onSuccess={fetchPrescriptions}
        />
      )}
    </div>
  );
}