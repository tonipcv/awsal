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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-xs text-slate-600">Carregando clínica...</p>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Clínica não encontrada</CardTitle>
            <CardDescription className="text-slate-600">
              Você não está associado a nenhuma clínica.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/doctor/dashboard')} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-light text-slate-800">{clinic.name}</h1>
            <p className="text-sm text-slate-600 mt-1">{clinic.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={clinic.subscription?.status === 'ACTIVE' ? 'default' : 'secondary'}
              className={clinic.subscription?.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
            >
              {clinic.subscription?.status || 'Sem Plano'}
            </Badge>
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                onClick={() => setShowSettingsModal(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-normal text-slate-800">Médicos</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-light text-slate-800">{stats?.totalDoctors || 0}</div>
              <p className="text-xs text-slate-600">
                de {clinic.subscription?.maxDoctors || 1} permitidos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-normal text-slate-800">Pacientes</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-light text-slate-800">{stats?.totalPatients || 0}</div>
              <p className="text-xs text-slate-600">
                de {clinic.subscription?.plan.maxPatients || 0} permitidos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-normal text-slate-800">Protocolos</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-light text-slate-800">{stats?.totalProtocols || 0}</div>
              <p className="text-xs text-slate-600">
                de {clinic.subscription?.plan.maxProtocols || 0} permitidos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-normal text-slate-800">Cursos</CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-light text-slate-800">{stats?.totalCourses || 0}</div>
              <p className="text-xs text-slate-600">
                de {clinic.subscription?.plan.maxCourses || 0} permitidos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Team Section - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Team Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Equipe</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {clinic.members.length} {clinic.members.length === 1 ? 'membro' : 'membros'} • 
                  {clinic.subscription?.maxDoctors ? ` ${clinic.subscription.maxDoctors - clinic.members.length} vagas disponíveis` : ' Sem limite'}
                </p>
              </div>
              {isAdmin && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Convidar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-slate-200">
                    <DialogHeader>
                      <DialogTitle className="text-slate-800">Convidar Médico</DialogTitle>
                      <DialogDescription className="text-slate-600">
                        Adicione um médico existente à sua equipe. O médico deve já estar cadastrado no sistema.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email" className="text-slate-700">Email do Médico</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="medico@exemplo.com"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          className="border-slate-300 focus:border-blue-500 bg-white text-slate-900 placeholder:text-slate-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role" className="text-slate-700">Função</Label>
                        <select
                          id="role"
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="DOCTOR">Médico</option>
                          <option value="ADMIN">Administrador</option>
                          <option value="VIEWER">Visualizador</option>
                        </select>
                      </div>
                      <Button 
                        onClick={addMember} 
                        disabled={addingMember || !newMemberEmail.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {addingMember ? 'Enviando convite...' : 'Enviar Convite'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Team Members */}
            <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {clinic.members.map((member, index) => (
                    <div key={member.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {/* Avatar */}
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {member.user.name ? member.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : member.user.email?.[0].toUpperCase()}
                          </div>
                          
                          {/* User Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-slate-900">
                                {member.user.name || member.user.email?.split('@')[0]}
                              </h3>
                              {member.user.id === clinic.ownerId && (
                                <Crown className="h-4 w-4 text-yellow-600" />
                              )}
                            </div>
                            <p className="text-sm text-slate-600">{member.user.email}</p>
                          </div>
                        </div>

                        {/* Role and Actions */}
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <Badge 
                              variant="outline"
                              className={
                                member.role === 'ADMIN' ? 'bg-blue-50 text-blue-700 border-blue-200 !bg-blue-50 !text-blue-700' :
                                member.role === 'DOCTOR' ? 'bg-green-50 text-green-700 border-green-200' :
                                'bg-slate-50 text-slate-700 border-slate-200'
                              }
                            >
                              {member.role === 'ADMIN' ? 'Admin' : 
                               member.role === 'DOCTOR' ? 'Médico' : 'Viewer'}
                            </Badge>
                            <p className="text-xs text-slate-500 mt-1">
                              Desde {new Date(member.joinedAt).toLocaleDateString('pt-BR', { 
                                day: '2-digit', 
                                month: 'short' 
                              })}
                            </p>
                          </div>
                          
                          {isAdmin && member.user.id !== clinic.ownerId && (
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600 hover:bg-red-50">
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
            <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-slate-900">Plano Atual</CardTitle>
                  <Badge 
                    variant={clinic.subscription?.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className={clinic.subscription?.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                  >
                    {clinic.subscription?.status || 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {clinic.subscription ? (
                  <>
                    {/* Plan Name and Price */}
                    <div className="text-center py-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                      <h3 className="text-2xl font-bold text-slate-900">{clinic.subscription.plan.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">
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
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="text-lg font-semibold text-slate-900">{clinic.subscription.maxDoctors}</div>
                        <div className="text-xs text-slate-600">Médicos</div>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="text-lg font-semibold text-slate-900">{clinic.subscription.plan.maxPatients}</div>
                        <div className="text-xs text-slate-600">Pacientes</div>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="text-lg font-semibold text-slate-900">{clinic.subscription.plan.maxProtocols}</div>
                        <div className="text-xs text-slate-600">Protocolos</div>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="text-lg font-semibold text-slate-900">{clinic.subscription.plan.maxCourses}</div>
                        <div className="text-xs text-slate-600">Cursos</div>
                      </div>
                    </div>

                    {isAdmin && (
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" asChild>
                        <Link href="/clinic/subscription">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Gerenciar Plano
                        </Link>
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-slate-600 mb-4">Nenhum plano ativo</p>
                    {isAdmin && (
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
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
            <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-900">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start border-slate-200 text-slate-700 hover:bg-slate-50 bg-white" asChild>
                  <Link href="/doctor/dashboard">
                    <BarChart3 className="h-4 w-4 mr-3" />
                    Ver Dashboard
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start border-slate-200 text-slate-700 hover:bg-slate-50 bg-white" asChild>
                  <Link href="/protocols">
                    <FileText className="h-4 w-4 mr-3" />
                    Gerenciar Protocolos
                  </Link>
                </Button>
                {isAdmin && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-slate-200 text-slate-700 hover:bg-slate-50 bg-white"
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
          <DialogContent className="bg-white border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-slate-800">Configurações da Clínica</DialogTitle>
              <DialogDescription className="text-slate-600">
                Gerencie as informações da sua clínica
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="clinic-name-edit" className="text-slate-700">Nome da Clínica</Label>
                <Input 
                  id="clinic-name-edit" 
                  value={editingClinicName} 
                  onChange={(e) => setEditingClinicName(e.target.value)}
                  disabled={!isAdmin}
                  className="border-slate-300 focus:border-blue-500 bg-white text-slate-900 placeholder:text-slate-500"
                />
              </div>
              <div>
                <Label htmlFor="clinic-description-edit" className="text-slate-700">Descrição</Label>
                <Input 
                  id="clinic-description-edit" 
                  value={editingClinicDescription} 
                  onChange={(e) => setEditingClinicDescription(e.target.value)}
                  disabled={!isAdmin}
                  className="border-slate-300 focus:border-blue-500 bg-white text-slate-900 placeholder:text-slate-500"
                />
              </div>
              <div>
                <Label className="text-slate-700">Proprietário</Label>
                <p className="font-medium text-slate-800">{clinic.owner.name} ({clinic.owner.email})</p>
              </div>
              <div>
                <Label className="text-slate-700">Criada em</Label>
                <p className="font-medium text-slate-800">{new Date(clinic.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              {isAdmin && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={saveSettings}
                    disabled={savingSettings}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {savingSettings ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowSettingsModal(false)}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-white"
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
  );
} 