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
  Plus,
  CheckCircle,
  Mail,
  X
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
  
  // Notification states
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successTitle, setSuccessTitle] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);

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
        
        // Check if user is admin
        const userIsAdmin = data.clinic.ownerId === session?.user?.id || 
          data.clinic.members.some((m: any) => m.user.id === session?.user?.id && m.role === 'ADMIN');
        setIsAdmin(userIsAdmin);

        // Initialize editing values
        setEditingClinicName(data.clinic.name);
        setEditingClinicDescription(data.clinic.description || '');

        // Fetch statistics
        const statsResponse = await fetch(`/api/clinic/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.stats);
        }
      } else {
        console.error('Error loading clinic data');
      }
    } catch (error) {
      console.error('Error:', error);
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
        setShowInviteDialog(false); // Close invite dialog
        fetchClinicData(); // Reload data
        
        // Show beautiful success dialog
        setSuccessTitle('Convite Enviado!');
        setSuccessMessage(`O convite foi enviado com sucesso para ${newMemberEmail}. O médico receberá um email para se juntar à equipe.`);
        setShowSuccessDialog(true);
      } else {
        const error = await response.json();
        // Show error dialog
        setSuccessTitle('Erro ao Enviar Convite');
        setSuccessMessage(error.error || 'Erro ao adicionar membro à equipe');
        setShowSuccessDialog(true);
      }
    } catch (error) {
      console.error('Error adding member:', error);
      setSuccessTitle('Erro ao Enviar Convite');
      setSuccessMessage('Erro interno do servidor');
      setShowSuccessDialog(true);
    } finally {
      setAddingMember(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSavingSettings(true);
      
      const response = await fetch('/api/clinic/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingClinicName,
          description: editingClinicDescription
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowSettingsModal(false);
        fetchClinicData(); // Reload data
        
        // Show beautiful success dialog
        setSuccessTitle('Configurações Salvas!');
        setSuccessMessage('As configurações da clínica foram atualizadas com sucesso.');
        setShowSuccessDialog(true);
      } else {
        // Show error dialog
        setSuccessTitle('Erro ao Salvar');
        setSuccessMessage(data.error || 'Erro ao salvar configurações');
        setShowSuccessDialog(true);
      }
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setSuccessTitle('Erro ao Salvar');
      setSuccessMessage('Erro ao salvar configurações');
      setShowSuccessDialog(true);
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
                <div className="h-5 bg-gray-100 rounded-lg w-64 animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 bg-gray-200 rounded-xl w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-100 rounded-xl w-32 animate-pulse"></div>
              </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    <div className="h-8 w-8 bg-gray-100 rounded-xl animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-7 bg-gray-200 rounded w-8 animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Content Skeleton */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Team Section Skeleton - 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded w-48 animate-pulse"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded-xl w-24 animate-pulse"></div>
                </div>
                
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                  <div className="divide-y divide-gray-100">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                              <div className="h-3 bg-gray-100 rounded w-40 animate-pulse"></div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="space-y-2">
                              <div className="h-6 bg-gray-100 rounded-xl w-16 animate-pulse"></div>
                              <div className="h-3 bg-gray-100 rounded w-12 animate-pulse"></div>
                            </div>
                            <div className="h-8 w-8 bg-gray-100 rounded-xl animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Skeleton - 1 column */}
              <div className="space-y-6">
                {/* Subscription Card Skeleton */}
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-6 bg-gray-100 rounded-xl w-16 animate-pulse"></div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-6 bg-gray-50 rounded-2xl">
                      <div className="h-6 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
                      <div className="h-4 bg-gray-100 rounded w-40 mx-auto mt-2 animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-xl text-center">
                          <div className="h-5 bg-gray-200 rounded w-8 mx-auto animate-pulse"></div>
                          <div className="h-3 bg-gray-100 rounded w-12 mx-auto mt-1 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                    <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                  </div>
                </div>

                {/* Quick Actions Skeleton */}
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                  <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-gray-50 border border-gray-200 rounded-xl animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24 flex items-center justify-center min-h-[calc(100vh-88px)]">
            <Card className="w-full max-w-md bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="text-center p-6">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Clinic not found</CardTitle>
                <CardDescription className="text-gray-600 font-medium">
                  You are not associated with any clinic.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <Button onClick={() => router.push('/doctor/dashboard')} className="w-full bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 font-semibold">
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">{clinic.name}</h1>
              <p className="text-gray-600 font-medium">{clinic.description || 'No description available'}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={clinic.subscription?.status === 'ACTIVE' ? 'default' : 'secondary'}
                className={clinic.subscription?.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 font-semibold px-3 py-1 rounded-xl' : 'font-semibold px-3 py-1 rounded-xl'}
              >
                {clinic.subscription?.status || 'No Plan'}
              </Badge>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-4 font-semibold"
                  onClick={() => setShowSettingsModal(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#5154e7]/10 rounded-xl">
                    <Users className="h-6 w-6 text-[#5154e7]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 font-semibold">Doctors</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalDoctors || 0}</p>
                    <p className="text-xs text-gray-500 font-medium">
                      of {clinic.subscription?.maxDoctors || 1} allowed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 font-semibold">Clients</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalPatients || 0}</p>
                    <p className="text-xs text-gray-500 font-medium">
                      of {clinic.subscription?.plan.maxPatients || 0} allowed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal-100 rounded-xl">
                    <FileText className="h-6 w-6 text-teal-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 font-semibold">Protocols</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalProtocols || 0}</p>
                    <p className="text-xs text-gray-500 font-medium">
                      of {clinic.subscription?.plan.maxProtocols || 0} allowed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 font-semibold">Courses</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalCourses || 0}</p>
                    <p className="text-xs text-gray-500 font-medium">
                      of {clinic.subscription?.plan.maxCourses || 0} allowed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Team Section - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Team Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Team</h2>
                  <p className="text-gray-600 mt-1 font-medium">
                    {clinic.members.length} {clinic.members.length === 1 ? 'member' : 'members'} • 
                    {clinic.subscription?.maxDoctors ? ` ${clinic.subscription.maxDoctors - clinic.members.length} spots available` : ' No limit'}
                  </p>
                </div>
                {isAdmin && (
                  <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-10 px-4 font-semibold">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white border-gray-200 rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-gray-900 font-bold">Invite Doctor</DialogTitle>
                        <DialogDescription className="text-gray-600 font-medium">
                          Add an existing doctor to your team. The doctor must already be registered in the system.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email" className="text-gray-700 font-semibold">Doctor's Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="doctor@example.com"
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="role" className="text-gray-700 font-semibold">Role</Label>
                          <select
                            id="role"
                            value={newMemberRole}
                            onChange={(e) => setNewMemberRole(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:border-[#5154e7] focus:outline-none focus:ring-1 focus:ring-[#5154e7] mt-2 h-12"
                          >
                            <option value="DOCTOR">Doctor</option>
                            <option value="ADMIN">Administrator</option>
                            <option value="VIEWER">Viewer</option>
                          </select>
                        </div>
                        <div className="flex gap-3 pt-4">
                          <Button 
                            onClick={addMember} 
                            disabled={addingMember || !newMemberEmail.trim()}
                            className="flex-1 bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 font-semibold"
                          >
                            {addingMember ? 'Sending invite...' : 'Send Invite'}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setShowInviteDialog(false)}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white rounded-xl h-12 font-semibold"
                          >
                            Cancel
                          </Button>
                        </div>
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
                                 member.role === 'DOCTOR' ? 'Doctor' : 'Viewer'}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1 font-medium">
                                Since {new Date(member.joinedAt).toLocaleDateString('en-US', { 
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
                    <CardTitle className="text-xl font-bold text-gray-900">Current Plan</CardTitle>
                    <Badge 
                      variant={clinic.subscription?.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className={clinic.subscription?.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 font-semibold rounded-xl' : 'font-semibold rounded-xl'}
                    >
                      {clinic.subscription?.status || 'Inactive'}
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
                          Renews on {clinic.subscription.endDate 
                            ? new Date(clinic.subscription.endDate).toLocaleDateString('en-US', { 
                                day: '2-digit', 
                                month: 'long' 
                              })
                            : 'No expiration'
                          }
                        </p>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <div className="text-xl font-bold text-gray-900">{clinic.subscription.maxDoctors}</div>
                          <div className="text-xs text-gray-600 font-semibold">Doctors</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <div className="text-xl font-bold text-gray-900">{clinic.subscription.plan.maxPatients}</div>
                          <div className="text-xs text-gray-600 font-semibold">Clients</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <div className="text-xl font-bold text-gray-900">{clinic.subscription.plan.maxProtocols}</div>
                          <div className="text-xs text-gray-600 font-semibold">Protocols</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <div className="text-xl font-bold text-gray-900">{clinic.subscription.plan.maxCourses}</div>
                          <div className="text-xs text-gray-600 font-semibold">Courses</div>
                        </div>
                      </div>

                      {isAdmin && (
                        <Button className="w-full bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 font-semibold" asChild>
                          <Link href="/clinic/subscription">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Manage Plan
                          </Link>
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 mb-6 font-medium">No active plan</p>
                      {isAdmin && (
                        <Button className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 font-semibold" asChild>
                          <Link href="/clinic/subscription">
                            <Plus className="h-4 w-4 mr-2" />
                            Choose Plan
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
                  <CardTitle className="text-xl font-bold text-gray-900">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-6 pb-6">
                  <Button variant="outline" className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50 bg-white rounded-xl h-12 font-semibold" asChild>
                    <Link href="/doctor/dashboard">
                      <BarChart3 className="h-4 w-4 mr-3" />
                      View Dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50 bg-white rounded-xl h-12 font-semibold" asChild>
                    <Link href="/patient/protocols">
                      <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Ver Protocolos
                      </Button>
                    </Link>
                  </Button>
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50 bg-white rounded-xl h-12 font-semibold"
                      onClick={() => setShowSettingsModal(true)}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
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
                <DialogTitle className="text-gray-900 font-bold">Clinic Settings</DialogTitle>
                <DialogDescription className="text-gray-600 font-medium">
                  Manage your clinic information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="clinic-name-edit" className="text-gray-700 font-semibold">Clinic Name</Label>
                  <Input 
                    id="clinic-name-edit" 
                    value={editingClinicName} 
                    onChange={(e) => setEditingClinicName(e.target.value)}
                    disabled={!isAdmin}
                    className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="clinic-description-edit" className="text-gray-700 font-semibold">Description</Label>
                  <Input 
                    id="clinic-description-edit" 
                    value={editingClinicDescription} 
                    onChange={(e) => setEditingClinicDescription(e.target.value)}
                    disabled={!isAdmin}
                    className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-semibold">Owner</Label>
                  <p className="font-bold text-gray-900 mt-1">{clinic.owner.name} ({clinic.owner.email})</p>
                </div>
                <div>
                  <Label className="text-gray-700 font-semibold">Created on</Label>
                  <p className="font-bold text-gray-900 mt-1">{new Date(clinic.createdAt).toLocaleDateString('en-US')}</p>
                </div>
                {isAdmin && (
                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={saveSettings}
                      disabled={savingSettings}
                      className="flex-1 bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 font-semibold"
                    >
                      {savingSettings ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowSettingsModal(false)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white rounded-xl h-12 font-semibold"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Beautiful Success/Error Dialog */}
          <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
            <DialogContent className="bg-white border-gray-200 rounded-2xl max-w-md">
              <div className="text-center p-6">
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
                  onClick={() => setShowSuccessDialog(false)}
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center">
                  {successTitle.includes('Erro') ? (
                    <X className="h-8 w-8 text-red-600" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {successTitle}
                </h3>

                {/* Message */}
                <p className="text-gray-600 font-medium mb-6 leading-relaxed">
                  {successMessage}
                </p>

                {/* Action Button */}
                <Button 
                  onClick={() => setShowSuccessDialog(false)}
                  className={`w-full h-12 rounded-xl font-semibold ${
                    successTitle.includes('Erro') 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {successTitle.includes('Erro') ? 'Tentar Novamente' : 'Perfeito!'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
} 