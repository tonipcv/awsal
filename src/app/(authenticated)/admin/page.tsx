import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, FileText, BookOpen, Package, Crown, TrendingUp, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

async function getSystemMetrics() {
  const [
    totalDoctors,
    totalPatients,
    totalProtocols,
    totalCourses,
    totalProducts,
    activeSubscriptions,
    trialSubscriptions,
    expiringSoon
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'DOCTOR' } }),
    prisma.user.count({ where: { role: 'PATIENT' } }),
    prisma.protocol.count(),
    prisma.course.count(),
    prisma.products.count(),
    prisma.doctorSubscription.count({ where: { status: 'ACTIVE' } }),
    prisma.doctorSubscription.count({ where: { status: 'TRIAL' } }),
    prisma.doctorSubscription.count({
      where: {
        status: 'TRIAL',
        trialEndDate: {
          lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 dias
        }
      }
    })
  ]);

  return {
    totalDoctors,
    totalPatients,
    totalProtocols,
    totalCourses,
    totalProducts,
    activeSubscriptions,
    trialSubscriptions,
    expiringSoon
  };
}

async function getRecentDoctors() {
  return await prisma.user.findMany({
    where: { role: 'DOCTOR' },
    select: {
      id: true,
      name: true,
      email: true
    },
    orderBy: { id: 'desc' },
    take: 5
  });
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const metrics = await getSystemMetrics();
  const recentDoctors = await getRecentDoctors();

  // Buscar subscriptions separadamente
  const doctorSubscriptions = await prisma.doctorSubscription.findMany({
    where: {
      doctorId: { in: recentDoctors.map(d => d.id) }
    },
    include: {
      plan: { select: { name: true } }
    }
  });

  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email! },
    select: { role: true, name: true }
  });

  return (
    <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-light text-slate-800">Dashboard Administrativo</h1>
          <p className="text-sm text-slate-600">Bem-vindo, {user?.name || 'Administrador'}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Link href="/admin/doctors">
              <Users className="h-4 w-4 mr-2" />
              Gerenciar Médicos
            </Link>
          </Button>
          <Button 
            asChild
            variant="outline"
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          >
            <Link href="/admin/subscriptions">
              <Crown className="h-4 w-4 mr-2" />
              Subscriptions
            </Link>
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Total de Médicos</p>
                <p className="text-xl font-light text-slate-800">{metrics.totalDoctors}</p>
                <p className="text-xs text-slate-500">
                  {metrics.activeSubscriptions} ativos, {metrics.trialSubscriptions} em trial
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Total de Pacientes</p>
                <p className="text-xl font-light text-slate-800">{metrics.totalPatients}</p>
                <p className="text-xs text-slate-500">
                  Média de {Math.round(metrics.totalPatients / Math.max(metrics.totalDoctors, 1))} por médico
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Protocolos Criados</p>
                <p className="text-xl font-light text-slate-800">{metrics.totalProtocols}</p>
                <p className="text-xs text-slate-500">
                  Média de {Math.round(metrics.totalProtocols / Math.max(metrics.totalDoctors, 1))} por médico
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Cursos Disponíveis</p>
                <p className="text-xl font-light text-slate-800">{metrics.totalCourses}</p>
                <p className="text-xs text-slate-500">
                  {metrics.totalProducts} produtos cadastrados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {metrics.expiringSoon > 0 && (
        <Card className="mb-6 bg-red-50/80 border-red-200/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Trials Expirando</p>
                <p className="text-xs text-red-700">
                  {metrics.expiringSoon} médicos têm trial expirando nos próximos 3 dias.
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Link href="/admin/subscriptions?filter=expiring">
                  Ver Detalhes
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Médicos Recentes e Status das Subscriptions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-normal text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Médicos Recentes
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-slate-800 hover:bg-slate-100">
              <Link href="/admin/doctors">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDoctors.map((doctor) => {
                const subscription = doctorSubscriptions.find(s => s.doctorId === doctor.id);
                return (
                  <div key={doctor.id} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-lg border border-slate-200/50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                        {doctor.name?.charAt(0) || 'M'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{doctor.name || 'Sem nome'}</p>
                        <p className="text-xs text-slate-600">{doctor.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs border ${
                        subscription?.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }`}>
                        {subscription?.status === 'ACTIVE' ? 'Ativo' : 'Trial'}
                      </span>
                      {subscription?.plan && (
                        <p className="text-xs text-slate-500 mt-1">
                          {subscription.plan.name}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-normal text-slate-800 flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Status das Subscriptions
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-slate-800 hover:bg-slate-100">
              <Link href="/admin/subscriptions">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50/80 rounded-lg border border-green-200/50">
                <div>
                  <p className="text-sm font-medium text-green-800">Subscriptions Ativas</p>
                  <p className="text-xs text-green-600">Médicos pagantes</p>
                </div>
                <div className="text-xl font-light text-green-800">
                  {metrics.activeSubscriptions}
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-yellow-50/80 rounded-lg border border-yellow-200/50">
                <div>
                  <p className="text-sm font-medium text-yellow-800">Trials Ativos</p>
                  <p className="text-xs text-yellow-600">Período de teste</p>
                </div>
                <div className="text-xl font-light text-yellow-800">
                  {metrics.trialSubscriptions}
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-50/80 rounded-lg border border-blue-200/50">
                <div>
                  <p className="text-sm font-medium text-blue-800">Taxa de Conversão</p>
                  <p className="text-xs text-blue-600">Trial para pago</p>
                </div>
                <div className="text-xl font-light text-blue-800">
                  {metrics.totalDoctors > 0 
                    ? Math.round((metrics.activeSubscriptions / metrics.totalDoctors) * 100)
                    : 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card className="mt-6 bg-white/80 border-slate-200/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-normal text-slate-800">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              asChild
            >
              <Link href="/admin/doctors">
                <Users className="h-6 w-6" />
                <span className="text-xs">Gerenciar Médicos</span>
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              asChild
            >
              <Link href="/admin/subscriptions">
                <Crown className="h-6 w-6" />
                <span className="text-xs">Subscriptions</span>
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              asChild
            >
              <Link href="/admin/doctors">
                <TrendingUp className="h-6 w-6" />
                <span className="text-xs">Relatórios</span>
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              asChild
            >
              <Link href="/admin/subscriptions">
                <AlertTriangle className="h-6 w-6" />
                <span className="text-xs">Alertas</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 