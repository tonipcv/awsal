'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Building2, 
  CreditCard, 
  UserPlus, 
  Settings, 
  BarChart3,
  FileText,
  Crown,
  Trash2,
  Plus
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
    plan: {
      name: string;
      maxPatients: number;
      maxProtocols: number;
      maxCourses: number;
    };
  } | null;
}

interface ClinicStats {
  totalDoctors: number;
  totalProtocols: number;
  totalPatients: number;
  totalCourses: number;
}

export default function ClinicDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [stats, setStats] = useState<ClinicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('DOCTOR');
  const [addingMember, setAddingMember] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingClinicName, setEditingClinicName] = useState('');
  const [editingClinicDescription, setEditingClinicDescription] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) {
      router.push('/auth/signin');
      return;
    }

    fetchClinicData();
  }, [session, router]);

  const fetchClinicData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/clinic');
      if (response.ok) {
        const data = await response.json();
        setClinic(data.clinic);
        
        // Verificar se é admin
        const userIsAdmin = data.clinic.ownerId === session?.user?.id || 
          data.clinic.members.some((m: any) => m.user.id === session?.user?.id && m.role === 'ADMIN');
        setIsAdmin(userIsAdmin);

        // Inicializar valores de edição
        setEditingClinicName(data.clinic.name);
        setEditingClinicDescription(data.clinic.description || '');

        // Buscar estatísticas
        const statsResponse = await fetch(`/api/clinic/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.stats);
        }
      } else {
        console.error('Erro ao buscar dados da clínica');
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async () => {
    if (!newMemberEmail.trim()) return;

    try {
      setAddingMember(true);
      
      const response = await fetch('/api/clinic/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newMemberEmail,
          role: newMemberRole
        }),
      });

      if (response.ok) {
        setNewMemberEmail('');
        setNewMemberRole('DOCTOR');
        fetchClinicData(); // Recarregar dados
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao adicionar membro');
      }
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      alert('Erro interno do servidor');
    } finally {
      setAddingMember(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSavingSettings(true);
      
      // Aqui você implementaria a API para salvar as configurações
      // const response = await fetch('/api/clinic/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     name: editingClinicName,
      //     description: editingClinicDescription
      //   })
      // });

      // Simulação de sucesso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowSettingsModal(false);
      fetchClinicData(); // Recarregar dados
      alert('Configurações salvas com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5154e7] mb-4"></div>
          <p className="text-xs text-gray-600">Carregando clínica...</p>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md bg-white border-gray-200 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-gray-900 font-bold">Clínica não encontrada</CardTitle>
            <CardDescription className="text-gray-600">
              Você não está associado a nenhuma clínica.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/doctor/dashboard')} className="w-full bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{clinic.name}</h1>
              <p className="text-gray-600 mt-2 font-medium">{clinic.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={clinic.subscription?.status === 'ACTIVE' ? 'default' : 'secondary'}
                className={clinic.subscription?.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 font-semibold px-3 py-1 rounded-xl' : 'font-semibold px-3 py-1 rounded-xl'}
              >
                {clinic.subscription?.status || 'Sem Plano'}
              </Badge>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-4 font-semibold"
                  onClick={() => setShowSettingsModal(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6">
                <CardTitle className="text-sm font-semibold text-gray-700">Médicos</CardTitle>
                <div className="p-3 bg-[#5154e7] rounded-xl">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-2xl font-bold text-gray-900">{stats?.totalDoctors || 0}</div>
                <p className="text-sm text-gray-600 font-medium">
                  de {clinic.subscription?.maxDoctors || 1} permitidos
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6">
                <CardTitle className="text-sm font-semibold text-gray-700">Pacientes</CardTitle>
                <div className="p-3 bg-emerald-500 rounded-xl">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-2xl font-bold text-gray-900">{stats?.totalPatients || 0}</div>
                <p className="text-sm text-gray-600 font-medium">
                  de {clinic.subscription?.plan.maxPatients || 0} permitidos
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6">
                <CardTitle className="text-sm font-semibold text-gray-700">Protocolos</CardTitle>
                <div className="p-3 bg-teal-500 rounded-xl">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-2xl font-bold text-gray-900">{stats?.totalProtocols || 0}</div>
                <p className="text-sm text-gray-600 font-medium">
                  de {clinic.subscription?.plan.maxProtocols || 0} permitidos
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6">
                <CardTitle className="text-sm font-semibold text-gray-700">Cursos</CardTitle>
                <div className="p-3 bg-orange-500 rounded-xl">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-2xl font-bold text-gray-900">{stats?.totalCourses || 0}</div>
                <p className="text-sm text-gray-600 font-medium">
                  de {clinic.subscription?.plan.maxCourses || 0} permitidos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Team Section - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Team Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Equipe</h2>
                  <p className="text-gray-600 mt-1 font-medium">
                    {clinic.members.length} {clinic.members.length === 1 ? 'membro' : 'membros'} • 
                    {clinic.subscription?.maxDoctors ? ` ${clinic.subscription.maxDoctors - clinic.members.length} vagas disponíveis` : ' Sem limite'}
                  </p>
                </div>
                {isAdmin && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-10 px-4 font-semibold">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Convidar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white border-gray-200 rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-gray-900 font-bold">Convidar Médico</DialogTitle>
                        <DialogDescription className="text-gray-600 font-medium">
                          Adicione um médico existente à sua equipe. O médico deve já estar cadastrado no sistema.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email" className="text-gray-700 font-semibold">Email do Médico</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="medico@exemplo.com"
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="role" className="text-gray-700 font-semibold">Função</Label>
                          <select
                            id="role"
                            value={newMemberRole}
                            onChange={(e) => setNewMemberRole(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:border-[#5154e7] focus:outline-none focus:ring-1 focus:ring-[#5154e7] mt-2 h-12"
                          >
                            <option value="DOCTOR">Médico</option>
                            <option value="ADMIN">Administrador</option>
                            <option value="VIEWER">Visualizador</option>
                          </select>
                        </div>
                        <Button 
                          onClick={addMember} 
                          disabled={addingMember || !newMemberEmail.trim()}
                          className="w-full bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 font-semibold"
                        >
                          {addingMember ? 'Enviando convite...' : 'Enviar Convite'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {/* Team Members */}
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {clinic.members.map((member, index) => (
                      <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Avatar */}
                            <div className="w-12 h-12 bg-gradient-to-br from-[#5154e7] to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                              {member.user.name ? member.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : member.user.email?.[0].toUpperCase()}
                            </div>
                            
                            {/* User Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900">
                                  {member.user.name || member.user.email?.split('@')[0]}
                                </h3>
                                {member.user.id === clinic.ownerId && (
                                  <Crown className="h-4 w-4 text-yellow-600" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600 font-medium">{member.user.email}</p>
                            </div>
                          </div>

                          {/* Role and Actions */}
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <Badge 
                                variant="outline"
                                className={
                                  member.role === 'ADMIN' ? 'bg-[#5154e7] text-white border-[#5154e7] font-semibold rounded-xl' :
                                  member.role === 'DOCTOR' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 font-semibold rounded-xl' :
                                  'bg-gray-100 text-gray-700 border-gray-200 font-semibold rounded-xl'
                                }
                              >
                                {member.role === 'ADMIN' ? 'Admin' : 
                                 member.role === 'DOCTOR' ? 'Médico' : 'Viewer'}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1 font-medium">
                                Desde {new Date(member.joinedAt).toLocaleDateString('pt-BR', { 
                                  day: '2-digit', 
                                  month: 'short' 
                                })}
                              </p>
                            </div>
                            
                            {isAdmin && member.user.id !== clinic.ownerId && (
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Takes 1 column */}
            <div className="space-y-6">
              
              {/* Subscription Card */}
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="pb-4 p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-900">Plano Atual</CardTitle>
                    <Badge 
                      variant={clinic.subscription?.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className={clinic.subscription?.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 font-semibold rounded-xl' : 'font-semibold rounded-xl'}
                    >
                      {clinic.subscription?.status || 'Inativo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 px-6 pb-6">
                  {clinic.subscription ? (
                    <>
                      {/* Plan Name and Price */}
                      <div className="text-center py-6 bg-gradient-to-br from-[#5154e7]/10 to-purple-50 rounded-2xl border border-[#5154e7]/20">
                        <h3 className="text-2xl font-bold text-gray-900">{clinic.subscription.plan.name}</h3>
                        <p className="text-sm text-gray-600 mt-2 font-medium">
                          Renovação em {clinic.subscription.endDate 
                            ? new Date(clinic.subscription.endDate).toLocaleDateString('pt-BR', { 
                                day: '2-digit', 
                                month: 'long' 
                              })
                            : 'Sem vencimento'
                          }
                        </p>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <div className="text-xl font-bold text-gray-900">{clinic.subscription.maxDoctors}</div>
                          <div className="text-xs text-gray-600 font-semibold">Médicos</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <div className="text-xl font-bold text-gray-900">{clinic.subscription.plan.maxPatients}</div>
                          <div className="text-xs text-gray-600 font-semibold">Pacientes</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <div className="text-xl font-bold text-gray-900">{clinic.subscription.plan.maxProtocols}</div>
                          <div className="text-xs text-gray-600 font-semibold">Protocolos</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <div className="text-xl font-bold text-gray-900">{clinic.subscription.plan.maxCourses}</div>
                          <div className="text-xs text-gray-600 font-semibold">Cursos</div>
                        </div>
                      </div>

                      {isAdmin && (
                        <Button className="w-full bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 font-semibold" asChild>
                          <Link href="/clinic/subscription">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Gerenciar Plano
                          </Link>
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 mb-6 font-medium">Nenhum plano ativo</p>
                      {isAdmin && (
                        <Button className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 font-semibold" asChild>
                          <Link href="/clinic/subscription">
                            <Plus className="h-4 w-4 mr-2" />
                            Escolher Plano
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="pb-4 p-6">
                  <CardTitle className="text-xl font-bold text-gray-900">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-6 pb-6">
                  <Button variant="outline" className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50 bg-white rounded-xl h-12 font-semibold" asChild>
                    <Link href="/doctor/dashboard">
                      <BarChart3 className="h-4 w-4 mr-3" />
                      Ver Dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50 bg-white rounded-xl h-12 font-semibold" asChild>
                    <Link href="/protocols">
                      <FileText className="h-4 w-4 mr-3" />
                      Gerenciar Protocolos
                    </Link>
                  </Button>
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50 bg-white rounded-xl h-12 font-semibold"
                      onClick={() => setShowSettingsModal(true)}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Configurações
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Settings Modal */}
          <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
            <DialogContent className="bg-white border-gray-200 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-gray-900 font-bold">Configurações da Clínica</DialogTitle>
                <DialogDescription className="text-gray-600 font-medium">
                  Gerencie as informações da sua clínica
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="clinic-name-edit" className="text-gray-700 font-semibold">Nome da Clínica</Label>
                  <Input 
                    id="clinic-name-edit" 
                    value={editingClinicName} 
                    onChange={(e) => setEditingClinicName(e.target.value)}
                    disabled={!isAdmin}
                    className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="clinic-description-edit" className="text-gray-700 font-semibold">Descrição</Label>
                  <Input 
                    id="clinic-description-edit" 
                    value={editingClinicDescription} 
                    onChange={(e) => setEditingClinicDescription(e.target.value)}
                    disabled={!isAdmin}
                    className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-semibold">Proprietário</Label>
                  <p className="font-bold text-gray-900 mt-1">{clinic.owner.name} ({clinic.owner.email})</p>
                </div>
                <div>
                  <Label className="text-gray-700 font-semibold">Criada em</Label>
                  <p className="font-bold text-gray-900 mt-1">{new Date(clinic.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                {isAdmin && (
                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={saveSettings}
                      disabled={savingSettings}
                      className="flex-1 bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 font-semibold"
                    >
                      {savingSettings ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowSettingsModal(false)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white rounded-xl h-12 font-semibold"
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
} 