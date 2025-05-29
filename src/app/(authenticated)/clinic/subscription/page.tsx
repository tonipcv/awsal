'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  CreditCard, 
  Calendar,
  Users,
  FileText,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Crown
} from 'lucide-react';
import Link from 'next/link';

interface SubscriptionPlan {
  id: string;
  name: string;
  maxPatients: number;
  maxProtocols: number;
  maxCourses: number;
  price: number;
  description: string;
}

interface ClinicSubscription {
  id: string;
  status: string;
  maxDoctors: number;
  startDate: string;
  endDate: string | null;
  plan: SubscriptionPlan;
}

interface ClinicData {
  id: string;
  name: string;
  subscription: ClinicSubscription | null;
}

export default function SubscriptionManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      router.push('/auth/signin');
      return;
    }

    fetchData();
  }, [session, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar dados da clínica
      const clinicResponse = await fetch('/api/clinic');
      if (clinicResponse.ok) {
        const clinicData = await clinicResponse.json();
        setClinic(clinicData.clinic);
      }

      // Buscar planos disponíveis (simulado)
      setAvailablePlans([
        {
          id: '1',
          name: 'Básico',
          maxPatients: 50,
          maxProtocols: 10,
          maxCourses: 5,
          price: 99,
          description: 'Ideal para clínicas pequenas'
        },
        {
          id: '2',
          name: 'Growth',
          maxPatients: 200,
          maxProtocols: 50,
          maxCourses: 20,
          price: 199,
          description: 'Para clínicas em crescimento'
        },
        {
          id: '3',
          name: 'Pro',
          maxPatients: 500,
          maxProtocols: 100,
          maxCourses: 50,
          price: 399,
          description: 'Para clínicas estabelecidas'
        },
        {
          id: '4',
          name: 'Enterprise',
          maxPatients: 1000,
          maxProtocols: 200,
          maxCourses: 100,
          price: 699,
          description: 'Para grandes organizações'
        }
      ]);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = (planId: string) => {
    // Aqui você implementaria a lógica de mudança de plano
    alert(`Funcionalidade de mudança para o plano ${planId} será implementada em breve!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-xs text-slate-600">Carregando subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" asChild className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
            <Link href="/clinic">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-light text-slate-800">Gerenciar Subscription</h1>
            <p className="text-sm text-slate-600">{clinic?.name}</p>
          </div>
        </div>

        {/* Current Subscription */}
        {clinic?.subscription && (
          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-600" />
                    Plano Atual: {clinic.subscription.plan.name}
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    {clinic.subscription.plan.description}
                  </CardDescription>
                </div>
                <Badge 
                  variant={clinic.subscription.status === 'ACTIVE' ? 'default' : 'secondary'}
                  className={clinic.subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                >
                  {clinic.subscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Médicos</p>
                  <p className="text-lg font-medium text-slate-800">{clinic.subscription.maxDoctors}</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Pacientes</p>
                  <p className="text-lg font-medium text-slate-800">{clinic.subscription.plan.maxPatients}</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Protocolos</p>
                  <p className="text-lg font-medium text-slate-800">{clinic.subscription.plan.maxProtocols}</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <BookOpen className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Cursos</p>
                  <p className="text-lg font-medium text-slate-800">{clinic.subscription.plan.maxCourses}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Próxima cobrança</p>
                    <p className="text-xs text-slate-600">
                      {clinic.subscription.endDate 
                        ? new Date(clinic.subscription.endDate).toLocaleDateString('pt-BR')
                        : 'Sem vencimento'
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-800">R$ {availablePlans.find(p => p.name === clinic.subscription?.plan.name)?.price || 0}</p>
                  <p className="text-xs text-slate-600">por mês</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Plans */}
        <div className="mb-6">
          <h2 className="text-lg font-light text-slate-800 mb-4">Planos Disponíveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availablePlans.map((plan) => {
              const isCurrentPlan = clinic?.subscription?.plan.name === plan.name;
              
              return (
                <Card key={plan.id} className={`bg-white/80 border-slate-200/50 backdrop-blur-sm ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-800">{plan.name}</CardTitle>
                      {isCurrentPlan && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">Atual</Badge>
                      )}
                    </div>
                    <CardDescription className="text-slate-600">{plan.description}</CardDescription>
                    <div className="text-2xl font-bold text-slate-800">
                      R$ {plan.price}
                      <span className="text-sm font-normal text-slate-600">/mês</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-slate-600">{plan.maxPatients} pacientes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-slate-600">{plan.maxProtocols} protocolos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-slate-600">{plan.maxCourses} cursos</span>
                      </div>
                    </div>
                    
                    {!isCurrentPlan && (
                      <Button 
                        onClick={() => handlePlanChange(plan.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {clinic?.subscription ? 'Alterar Plano' : 'Escolher Plano'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Billing History */}
        <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-slate-800">Histórico de Cobrança</CardTitle>
            <CardDescription className="text-slate-600">Suas últimas faturas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Nenhuma fatura encontrada</p>
              <p className="text-xs text-slate-500 mt-1">O histórico de cobrança aparecerá aqui</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 