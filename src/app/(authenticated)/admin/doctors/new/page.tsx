'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, UserPlus, Loader2, Info, Mail } from 'lucide-react';
import Link from 'next/link';

export default function NewDoctorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subscriptionType: 'TRIAL' // TRIAL ou ACTIVE
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Nome e email são obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Médico criado com sucesso! Um email de convite foi enviado para definir a senha.');
        router.push('/admin/doctors');
      } else {
        setError(data.error || 'Erro ao criar médico');
      }
    } catch (error) {
      console.error('Erro ao criar médico:', error);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-light text-slate-800">Adicionar Novo Médico</h1>
            <p className="text-sm text-slate-600">Crie uma nova conta de médico com plano Starter</p>
          </div>
          <Button 
            asChild
            variant="outline"
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          >
            <Link href="/admin/doctors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        {/* Formulário */}
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm font-normal text-slate-800 flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Informações do Médico
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-50/80 border border-red-200/50 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Informação sobre o convite por email */}
              <div className="mb-6 p-3 bg-blue-50/80 border border-blue-200/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-blue-100 rounded-lg">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Convite por Email</h4>
                    <p className="text-xs text-blue-700 mb-2">
                      Um email será enviado para o médico com um link para definir a senha e acessar a plataforma.
                    </p>
                    <div className="text-xs text-green-700">
                      ✓ Processo seguro e automatizado
                    </div>
                  </div>
                </div>
              </div>

              {/* Informação sobre o plano padrão */}
              <div className="mb-6 p-3 bg-green-50/80 border border-green-200/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-green-100 rounded-lg">
                    <Info className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-green-800 mb-1">Plano Starter Incluído</h4>
                    <p className="text-xs text-green-700 mb-2">
                      Todos os novos médicos começam com o plano Starter que inclui:
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-xs text-green-700">
                      <div>• Até 100 pacientes</div>
                      <div>• 10 protocolos</div>
                      <div>• 5 cursos</div>
                      <div>• 50 produtos</div>
                    </div>
                    <div className="mt-2 text-xs text-blue-700">
                      ✓ 14 dias de trial gratuito
                    </div>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações Pessoais */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-700">Dados Pessoais</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-xs text-slate-600">Nome Completo</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Dr. João Silva"
                        required
                        className="mt-1 bg-white border-slate-300 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className="text-xs text-slate-600">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="joao@exemplo.com"
                        required
                        className="mt-1 bg-white border-slate-300 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Configuração da Subscription */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-medium text-slate-700">Configuração da Subscription</h3>
                  
                  <div>
                    <Label htmlFor="subscriptionType" className="text-xs text-slate-600">Tipo de Subscription</Label>
                    <select
                      id="subscriptionType"
                      value={formData.subscriptionType}
                      onChange={(e) => handleInputChange('subscriptionType', e.target.value)}
                      className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="TRIAL">Trial Gratuito (Recomendado)</option>
                      <option value="ACTIVE">Subscription Ativa</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      {formData.subscriptionType === 'TRIAL' 
                        ? 'O médico terá 14 dias para testar todas as funcionalidades gratuitamente.'
                        : 'O médico começará com subscription ativa e será cobrado imediatamente.'
                      }
                    </p>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando e Enviando Convite...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Criar Médico e Enviar Convite
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/doctors')}
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
    </div>
  );
} 