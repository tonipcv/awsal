import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, Calendar, Mail, User, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

async function getDoctors() {
  const doctors = await prisma.user.findMany({
    where: { role: 'DOCTOR' },
    select: {
      id: true,
      name: true,
      email: true
    },
    orderBy: { id: 'desc' }
  });

  // Buscar subscriptions separadamente
  const subscriptions = await prisma.doctorSubscription.findMany({
    where: {
      doctorId: { in: doctors.map(d => d.id) }
    },
    include: {
      plan: {
        select: {
          name: true,
          maxPatients: true,
          maxProtocols: true,
          maxCourses: true,
          maxProducts: true
        }
      }
    }
  });

  // Buscar contagem de pacientes por médico
  const patientCounts = await Promise.all(
    doctors.map(async (doctor) => ({
      doctorId: doctor.id,
      count: await prisma.user.count({
        where: { 
          role: 'PATIENT',
          doctorId: doctor.id
        }
      })
    }))
  );

  return doctors.map(doctor => {
    const subscription = subscriptions.find(s => s.doctorId === doctor.id);
    const patientCount = patientCounts.find(p => p.doctorId === doctor.id)?.count || 0;
    
    return {
      ...doctor,
      subscription,
      patientCount
    };
  });
}

export default async function DoctorsPage() {
  const session = await getServerSession(authOptions);
  const doctors = await getDoctors();

  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email! },
    select: { role: true }
  });

  if (user?.role !== 'SUPER_ADMIN') {
    return <div>Acesso negado</div>;
  }

  const activeDoctors = doctors.filter(d => d.subscription?.status === 'ACTIVE').length;
  const trialDoctors = doctors.filter(d => d.subscription?.status === 'TRIAL').length;
  const expiringSoon = doctors.filter(d => {
    if (d.subscription?.status !== 'TRIAL' || !d.subscription.trialEndDate) return false;
    const daysLeft = Math.ceil((new Date(d.subscription.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3;
  }).length;

  return (
    <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-light text-slate-800">Gerenciar Médicos</h1>
          <p className="text-sm text-slate-600">Visualize e gerencie todos os médicos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Button 
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Link href="/admin/doctors/new">
              Adicionar Médico
            </Link>
          </Button>
          <Button 
            asChild
            variant="outline"
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          >
            <Link href="/admin">
              Voltar ao Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Total de Médicos</p>
                <p className="text-xl font-light text-slate-800">{doctors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Crown className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Subscriptions Ativas</p>
                <p className="text-xl font-light text-green-600">{activeDoctors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Em Trial</p>
                <p className="text-xl font-light text-yellow-600">{trialDoctors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Expirando</p>
                <p className="text-xl font-light text-red-600">{expiringSoon}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Médicos */}
      <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-normal text-slate-800">Lista de Médicos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {doctors.map((doctor) => {
              const subscription = doctor.subscription;
              const isExpiringSoon = subscription?.status === 'TRIAL' && subscription.trialEndDate && 
                Math.ceil((new Date(subscription.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 3;

              return (
                <div key={doctor.id} className={`p-4 rounded-lg border ${
                  isExpiringSoon 
                    ? 'border-red-200/50 bg-red-50/80' 
                    : 'border-slate-200/50 bg-slate-50/80'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-slate-800">
                          {doctor.name || 'Sem nome'}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <Mail className="h-3 w-3" />
                          <span>{doctor.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <Users className="h-3 w-3" />
                          <span>{doctor.patientCount} pacientes</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Status da Subscription */}
                      <div className="text-right">
                        {subscription ? (
                          <>
                            <Badge 
                              variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}
                              className={subscription.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                              }
                            >
                              {subscription.status === 'ACTIVE' ? 'Ativo' : 'Trial'}
                            </Badge>
                            <p className="text-xs text-slate-500 mt-1">
                              {subscription.plan?.name || 'Plano Básico'}
                            </p>
                            {subscription.status === 'TRIAL' && subscription.trialEndDate && (
                              <p className={`text-xs mt-1 ${isExpiringSoon ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                                Expira em {Math.ceil((new Date(subscription.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias
                              </p>
                            )}
                          </>
                        ) : (
                          <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                            Sem Subscription
                          </Badge>
                        )}
                      </div>

                      {/* Limites do Plano */}
                      {subscription?.plan && (
                        <div className="text-xs text-slate-500 text-right">
                          <div>Máx: {subscription.plan.maxPatients} pacientes</div>
                          <div>{subscription.plan.maxProtocols} protocolos</div>
                          <div>{subscription.plan.maxCourses} cursos</div>
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex gap-2">
                        <Link href={`/admin/doctors/${doctor.id}`}>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            Ver Detalhes
                          </Button>
                        </Link>
                        <Link href={`/admin/subscriptions?doctorId=${doctor.id}`}>
                          <Button 
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Crown className="h-3 w-3 mr-1" />
                            Subscription
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Alerta para trials expirando */}
                  {isExpiringSoon && (
                    <div className="mt-3 p-2 bg-red-100/80 border border-red-200/50 rounded text-xs text-red-700">
                      <div className="flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-2" />
                        Trial expirando em breve! Considere entrar em contato com o médico.
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {doctors.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-sm">Nenhum médico cadastrado ainda.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 