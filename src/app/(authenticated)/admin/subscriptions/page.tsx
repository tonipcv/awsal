import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Calendar, DollarSign, Users, AlertTriangle, CheckCircle, Clock, Edit } from 'lucide-react';
import Link from 'next/link';

async function getSubscriptionsData() {
  const subscriptions = await prisma.doctorSubscription.findMany({
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      plan: {
        select: {
          name: true,
          price: true,
          maxPatients: true,
          maxProtocols: true,
          maxCourses: true,
          maxProducts: true
        }
      }
    },
    orderBy: { startDate: 'desc' }
  });

  return subscriptions;
}

async function getPlans() {
  return await prisma.subscriptionPlan.findMany({
    orderBy: { price: 'asc' }
  });
}

export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions);
  const subscriptions = await getSubscriptionsData();
  const plans = await getPlans();

  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email! },
    select: { role: true }
  });

  if (user?.role !== 'SUPER_ADMIN') {
    return <div>Acesso negado</div>;
  }

  // Estatísticas
  const activeCount = subscriptions.filter(s => s.status === 'ACTIVE').length;
  const trialCount = subscriptions.filter(s => s.status === 'TRIAL').length;
  const expiredCount = subscriptions.filter(s => s.status === 'EXPIRED').length;
  const expiringSoon = subscriptions.filter(s => {
    if (s.status !== 'TRIAL' || !s.trialEndDate) return false;
    const daysLeft = Math.ceil((new Date(s.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3;
  }).length;

  const totalRevenue = subscriptions
    .filter(s => s.status === 'ACTIVE')
    .reduce((sum, s) => sum + (s.plan?.price || 0), 0);

  return (
    <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-light text-slate-800">Gerenciar Subscriptions</h1>
          <p className="text-sm text-slate-600">Visualize e gerencie todas as subscriptions</p>
        </div>
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

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Crown className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Total</p>
                <p className="text-xl font-light text-slate-800">{subscriptions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Ativas</p>
                <p className="text-xl font-light text-green-600">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Trial</p>
                <p className="text-xl font-light text-yellow-600">{trialCount}</p>
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

        <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Receita/Mês</p>
                <p className="text-xl font-light text-purple-600">R$ {totalRevenue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {expiringSoon > 0 && (
        <Card className="mb-6 bg-red-50/80 border-red-200/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Atenção: Trials Expirando</p>
                <p className="text-xs text-red-700">
                  {expiringSoon} subscriptions em trial estão expirando nos próximos 3 dias.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Subscriptions */}
      <Card className="mb-6 bg-white/80 border-slate-200/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-normal text-slate-800">Todas as Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {subscriptions.map((subscription) => {
              const isExpiringSoon = subscription.status === 'TRIAL' && subscription.trialEndDate && 
                Math.ceil((new Date(subscription.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 3;

              const daysLeft = subscription.trialEndDate 
                ? Math.ceil((new Date(subscription.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <div key={subscription.id} className={`p-4 rounded-lg border ${
                  isExpiringSoon 
                    ? 'border-red-200/50 bg-red-50/80' 
                    : 'border-slate-200/50 bg-slate-50/80'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Crown className="h-5 w-5 text-purple-600" />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-slate-800">
                          {subscription.doctor?.name || 'Médico sem nome'}
                        </h3>
                        <p className="text-xs text-slate-500">{subscription.doctor?.email}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-slate-500">
                            Plano: {subscription.plan?.name || 'Básico'}
                          </span>
                          {subscription.plan?.price && (
                            <span className="text-xs text-slate-500">
                              R$ {subscription.plan.price}/mês
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Status */}
                      <div className="text-right">
                        <Badge 
                          variant={
                            subscription.status === 'ACTIVE' ? 'default' :
                            subscription.status === 'TRIAL' ? 'secondary' :
                            'destructive'
                          }
                          className={
                            subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' :
                            subscription.status === 'TRIAL' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                            'bg-red-100 text-red-700 border-red-200'
                          }
                        >
                          {subscription.status === 'ACTIVE' ? 'Ativo' :
                           subscription.status === 'TRIAL' ? 'Trial' :
                           subscription.status === 'SUSPENDED' ? 'Suspenso' :
                           subscription.status === 'CANCELLED' ? 'Cancelado' :
                           'Expirado'}
                        </Badge>
                        
                        {subscription.status === 'TRIAL' && daysLeft !== null && (
                          <p className={`text-xs mt-1 ${isExpiringSoon ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                            {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Expirado'}
                          </p>
                        )}
                        
                        {subscription.status === 'ACTIVE' && subscription.endDate && (
                          <p className="text-xs text-slate-500 mt-1">
                            Renova em {new Date(subscription.endDate).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>

                      {/* Limites do Plano */}
                      {subscription.plan && (
                        <div className="text-xs text-slate-500 text-right">
                          <div>Máx: {subscription.plan.maxPatients === 999999 ? '∞' : subscription.plan.maxPatients} pacientes</div>
                          <div>{subscription.plan.maxProtocols === 999999 ? '∞' : subscription.plan.maxProtocols} protocolos</div>
                          <div>{subscription.plan.maxCourses === 999999 ? '∞' : subscription.plan.maxCourses} cursos</div>
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex gap-2">
                        <Link href={`/admin/subscriptions/${subscription.id}/edit`}>
                          <Button 
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                        </Link>
                        <Link href={`/admin/doctors/${subscription.doctor?.id}`}>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            Ver Médico
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

            {subscriptions.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Crown className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-sm">Nenhuma subscription encontrada.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Planos Disponíveis */}
      <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-normal text-slate-800">Planos Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="p-4 border border-slate-200/50 rounded-lg bg-slate-50/80">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-800">{plan.name}</h3>
                  <Badge 
                    variant={plan.isDefault ? 'default' : 'outline'}
                    className={plan.isDefault 
                      ? 'bg-blue-100 text-blue-700 border-blue-200' 
                      : 'border-slate-300 text-slate-600'
                    }
                  >
                    {plan.isDefault ? 'Padrão' : 'Premium'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mb-3">{plan.description}</p>
                <div className="text-lg font-light text-blue-600 mb-3">
                  R$ {plan.price}/mês
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div>• {plan.maxPatients === 999999 ? 'Pacientes ilimitados' : `${plan.maxPatients} pacientes`}</div>
                  <div>• {plan.maxProtocols === 999999 ? 'Protocolos ilimitados' : `${plan.maxProtocols} protocolos`}</div>
                  <div>• {plan.maxCourses === 999999 ? 'Cursos ilimitados' : `${plan.maxCourses} cursos`}</div>
                  <div>• {plan.maxProducts === 999999 ? 'Produtos ilimitados' : `${plan.maxProducts} produtos`}</div>
                </div>
                {plan.trialDays > 0 && (
                  <div className="mt-2 text-xs text-green-600">
                    {plan.trialDays} dias de trial grátis
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 