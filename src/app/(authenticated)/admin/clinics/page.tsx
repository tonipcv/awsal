'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Building2, 
  Users, 
  FileText, 
  BookOpen, 
  Crown, 
  Plus, 
  ArrowLeft,
  Loader2,
  Calendar,
  Mail,
  User
} from 'lucide-react';
import Link from 'next/link';

interface ClinicData {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string | null;
  };
  members: {
    id: string;
    role: string;
    isActive: boolean;
    joinedAt: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      role: string;
    };
  }[];
  subscription?: {
    id: string;
    status: string;
    maxDoctors: number;
    startDate: string;
    endDate: string | null;
    trialEndDate: string | null;
    plan: {
      name: string;
      maxPatients: number;
      maxProtocols: number;
      maxCourses: number;
      maxProducts: number;
      price: number;
    };
  } | null;
  stats: {
    totalDoctors: number;
    totalPatients: number;
    totalProtocols: number;
    totalCourses: number;
  };
}

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState<ClinicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  
  const [newClinic, setNewClinic] = useState({
    name: '',
    description: '',
    ownerEmail: ''
  });

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/clinics');
      
      if (response.ok) {
        const data = await response.json();
        setClinics(data.clinics);
      } else {
        setError('Erro ao carregar clínicas');
      }
    } catch (error) {
      console.error('Erro ao buscar clínicas:', error);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newClinic.name.trim() || !newClinic.ownerEmail.trim()) {
      setError('Nome e email do proprietário são obrigatórios');
      return;
    }

    setCreating(true);

    try {
      const response = await fetch('/api/admin/clinics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClinic),
      });

      const data = await response.json();

      if (response.ok) {
        setShowCreateModal(false);
        setNewClinic({ name: '', description: '', ownerEmail: '' });
        fetchClinics(); // Recarregar lista
        alert('Clínica criada com sucesso!');
      } else {
        setError(data.error || 'Erro ao criar clínica');
      }
    } catch (error) {
      console.error('Erro ao criar clínica:', error);
      setError('Erro interno do servidor');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (subscription: ClinicData['subscription']) => {
    if (!subscription) {
      return <Badge variant="secondary">Sem Plano</Badge>;
    }

    switch (subscription.status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Ativo</Badge>;
      case 'TRIAL':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Trial</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Suspenso</Badge>;
      default:
        return <Badge variant="secondary">{subscription.status}</Badge>;
    }
  };

  const getTrialDaysLeft = (subscription: ClinicData['subscription']) => {
    if (!subscription?.trialEndDate) return null;
    
    const now = new Date();
    const trialEnd = new Date(subscription.trialEndDate);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-xs text-slate-600">Carregando clínicas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-light text-slate-800">Gerenciar Clínicas</h1>
            <p className="text-sm text-slate-600">{clinics.length} clínicas cadastradas</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Clínica
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border-slate-200">
                <DialogHeader>
                  <DialogTitle className="text-slate-800">Criar Nova Clínica</DialogTitle>
                  <DialogDescription className="text-slate-600">
                    Crie uma nova clínica e associe a um médico proprietário.
                  </DialogDescription>
                </DialogHeader>
                
                {error && (
                  <div className="p-3 bg-red-50/80 border border-red-200/50 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleCreateClinic} className="space-y-4">
                  <div>
                    <Label htmlFor="clinic-name" className="text-slate-700">Nome da Clínica</Label>
                    <Input
                      id="clinic-name"
                      type="text"
                      value={newClinic.name}
                      onChange={(e) => setNewClinic(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Clínica Exemplo"
                      required
                      className="border-slate-300 focus:border-blue-500 bg-white text-slate-900 placeholder:text-slate-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="clinic-description" className="text-slate-700">Descrição (Opcional)</Label>
                    <Input
                      id="clinic-description"
                      type="text"
                      value={newClinic.description}
                      onChange={(e) => setNewClinic(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição da clínica"
                      className="border-slate-300 focus:border-blue-500 bg-white text-slate-900 placeholder:text-slate-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="owner-email" className="text-slate-700">Email do Médico Proprietário</Label>
                    <Input
                      id="owner-email"
                      type="email"
                      value={newClinic.ownerEmail}
                      onChange={(e) => setNewClinic(prev => ({ ...prev, ownerEmail: e.target.value }))}
                      placeholder="medico@exemplo.com"
                      required
                      className="border-slate-300 focus:border-blue-500 bg-white text-slate-900 placeholder:text-slate-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      O médico deve já estar cadastrado no sistema
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={creating}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Building2 className="h-4 w-4 mr-2" />
                          Criar Clínica
                        </>
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                      className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-white"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
            <Button 
              asChild
              variant="outline"
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            >
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>
        </div>

        {/* Lista de Clínicas */}
        <div className="grid gap-6">
          {clinics.map((clinic) => {
            const trialDaysLeft = getTrialDaysLeft(clinic.subscription);
            
            return (
              <Card key={clinic.id} className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-slate-900">{clinic.name}</CardTitle>
                          {clinic.description && (
                            <p className="text-sm text-slate-600 mt-1">{clinic.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{clinic.owner.name || 'Sem nome'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>{clinic.owner.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Criada em {new Date(clinic.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(clinic.subscription)}
                      {clinic.subscription?.status === 'TRIAL' && trialDaysLeft !== null && (
                        <p className="text-xs text-slate-500">
                          {trialDaysLeft > 0 ? `${trialDaysLeft} dias restantes` : 'Trial expirado'}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50/80 rounded-lg border border-blue-200/50">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Médicos</span>
                      </div>
                      <div className="text-lg font-semibold text-blue-900">{clinic.stats.totalDoctors}</div>
                      <div className="text-xs text-blue-600">
                        de {clinic.subscription?.maxDoctors || 1} permitidos
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50/80 rounded-lg border border-green-200/50">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Pacientes</span>
                      </div>
                      <div className="text-lg font-semibold text-green-900">{clinic.stats.totalPatients}</div>
                      <div className="text-xs text-green-600">
                        de {clinic.subscription?.plan.maxPatients || 0} permitidos
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-50/80 rounded-lg border border-purple-200/50">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">Protocolos</span>
                      </div>
                      <div className="text-lg font-semibold text-purple-900">{clinic.stats.totalProtocols}</div>
                      <div className="text-xs text-purple-600">
                        de {clinic.subscription?.plan.maxProtocols || 0} permitidos
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-orange-50/80 rounded-lg border border-orange-200/50">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <BookOpen className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">Cursos</span>
                      </div>
                      <div className="text-lg font-semibold text-orange-900">{clinic.stats.totalCourses}</div>
                      <div className="text-xs text-orange-600">
                        de {clinic.subscription?.plan.maxCourses || 0} permitidos
                      </div>
                    </div>
                  </div>

                  {clinic.subscription && (
                    <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-lg border border-slate-200/50">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          Plano: {clinic.subscription.plan.name}
                        </p>
                        <p className="text-xs text-slate-600">
                          R$ {clinic.subscription.plan.price.toFixed(2)}/mês
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">
                          {clinic.subscription.status === 'TRIAL' ? 'Trial até' : 'Renovação em'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {clinic.subscription.trialEndDate 
                            ? new Date(clinic.subscription.trialEndDate).toLocaleDateString('pt-BR')
                            : clinic.subscription.endDate 
                              ? new Date(clinic.subscription.endDate).toLocaleDateString('pt-BR')
                              : 'Sem vencimento'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {clinics.length === 0 && !loading && (
          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">Nenhuma clínica encontrada</h3>
              <p className="text-slate-600 mb-4">Comece criando a primeira clínica do sistema.</p>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Clínica
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 