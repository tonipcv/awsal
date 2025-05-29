'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, Crown, User, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  maxPatients: number;
  maxProtocols: number;
  maxCourses: number;
  maxProducts: number;
  trialDays: number;
}

interface Subscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  trialEndDate: string | null;
  autoRenew: boolean;
  doctor: {
    id: string;
    name: string;
    email: string;
  };
  plan: Plan;
}

export default function EditSubscriptionPage() {
  const router = useRouter();
  const params = useParams();
  const subscriptionId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  
  const [formData, setFormData] = useState({
    planId: '',
    status: '',
    endDate: '',
    trialEndDate: '',
    autoRenew: true
  });

  // Carregar dados da subscription
  useEffect(() => {
    if (subscriptionId) {
      loadSubscription();
      loadPlans();
    }
  }, [subscriptionId]);

  const loadSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSubscription(data.subscription);
        setFormData({
          planId: data.subscription.plan.id,
          status: data.subscription.status,
          endDate: data.subscription.endDate ? new Date(data.subscription.endDate).toISOString().split('T')[0] : '',
          trialEndDate: data.subscription.trialEndDate ? new Date(data.subscription.trialEndDate).toISOString().split('T')[0] : '',
          autoRenew: data.subscription.autoRenew
        });
      } else {
        setError(data.error || 'Erro ao carregar subscription');
      }
    } catch (error) {
      console.error('Erro ao carregar subscription:', error);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/admin/plans');
      const data = await response.json();
      if (response.ok) {
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Subscription atualizada com sucesso!');
        router.push('/admin/subscriptions');
      } else {
        setError(data.error || 'Erro ao atualizar subscription');
      }
    } catch (error) {
      console.error('Erro ao atualizar subscription:', error);
      setError('Erro interno do servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6">
        <div className="text-center py-12">
          <p className="text-slate-600">Subscription não encontrada</p>
          <Button asChild className="mt-4">
            <Link href="/admin/subscriptions">Voltar</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-light text-slate-800">Editar Subscription</h1>
          <p className="text-sm text-slate-600">
            Modificar subscription de {subscription.doctor.name}
          </p>
        </div>
        <Button 
          asChild
          variant="outline"
          className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
        >
          <Link href="/admin/subscriptions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Informações do Médico */}
        <Card className="mb-6 bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-normal text-slate-800 flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Médico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-600">Nome</Label>
                <p className="text-sm text-slate-800 mt-1">{subscription.doctor.name}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-600">Email</Label>
                <p className="text-sm text-slate-800 mt-1">{subscription.doctor.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Edição */}
        <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-normal text-slate-800 flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Configurações da Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50/80 border border-red-200/50 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Plano */}
              <div>
                <Label htmlFor="planId" className="text-xs text-slate-600">Plano</Label>
                <Select value={formData.planId} onValueChange={(value) => handleInputChange('planId', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className="flex flex-col">
                          <span>{plan.name} - R$ {plan.price}/mês</span>
                          <span className="text-xs text-slate-500">
                            {plan.maxPatients === 999999 ? 'Ilimitado' : plan.maxPatients} pacientes
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="status" className="text-xs text-slate-600">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRIAL">Trial</SelectItem>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    <SelectItem value="EXPIRED">Expirado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.status === 'TRIAL' && (
                  <div>
                    <Label htmlFor="trialEndDate" className="text-xs text-slate-600">Data de Fim do Trial</Label>
                    <Input
                      id="trialEndDate"
                      type="date"
                      value={formData.trialEndDate}
                      onChange={(e) => handleInputChange('trialEndDate', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
                
                {formData.status === 'ACTIVE' && (
                  <div>
                    <Label htmlFor="endDate" className="text-xs text-slate-600">Data de Renovação</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Auto Renovação */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoRenew"
                  checked={formData.autoRenew}
                  onChange={(e) => handleInputChange('autoRenew', e.target.checked)}
                  className="rounded border-slate-300"
                />
                <Label htmlFor="autoRenew" className="text-xs text-slate-600">
                  Renovação automática
                </Label>
              </div>

              {/* Informações do plano selecionado */}
              {formData.planId && (
                <div className="p-3 bg-blue-50/80 border border-blue-200/50 rounded-lg">
                  {(() => {
                    const selectedPlan = plans.find(p => p.id === formData.planId);
                    if (!selectedPlan) return null;
                    
                    return (
                      <div>
                        <h4 className="text-xs font-medium text-blue-800 mb-2">Limites do Plano:</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                          <div>• {selectedPlan.maxPatients === 999999 ? 'Ilimitado' : selectedPlan.maxPatients} pacientes</div>
                          <div>• {selectedPlan.maxProtocols === 999999 ? 'Ilimitado' : selectedPlan.maxProtocols} protocolos</div>
                          <div>• {selectedPlan.maxCourses === 999999 ? 'Ilimitado' : selectedPlan.maxCourses} cursos</div>
                          <div>• {selectedPlan.maxProducts === 999999 ? 'Ilimitado' : selectedPlan.maxProducts} produtos</div>
                        </div>
                        <div className="mt-2 text-xs text-green-700">
                          💰 R$ {selectedPlan.price}/mês
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/subscriptions')}
                  className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 