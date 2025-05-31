'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, UserPlus, CheckCircle, AlertCircle, Users } from 'lucide-react';

interface DoctorInfo {
  id: string;
  name: string;
  image?: string;
}

interface DoctorStats {
  totalPatients: number;
}

export default function ReferralPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const doctorId = params.doctorId as string;
  const referrerCode = searchParams.get('code');

  const [doctor, setDoctor] = useState<DoctorInfo | null>(null);
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(5);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    referrerCode: referrerCode || ''
  });

  // Carregar informações do médico
  useEffect(() => {
    async function loadDoctorInfo() {
      try {
        const response = await fetch(`/api/referrals/doctor/${doctorId}`);
        const data = await response.json();

        if (response.ok) {
          setDoctor(data.doctor);
          setStats(data.stats);
        } else {
          setError(data.error || 'Médico não encontrado');
        }
      } catch (err) {
        setError('Erro ao carregar informações do médico');
      } finally {
        setLoading(false);
      }
    }

    if (doctorId) {
      loadDoctorInfo();
    }
  }, [doctorId]);

  // Redirecionamento automático após sucesso
  useEffect(() => {
    if (success) {
      setCountdown(5);
      
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            // Verificar se o usuário está logado como paciente
            fetch('/api/auth/session')
              .then(res => res.json())
              .then(session => {
                if (session?.user) {
                  // Se está logado, verificar se é paciente
                  fetch('/api/auth/role')
                    .then(res => res.json())
                    .then(data => {
                      if (data.role === 'PATIENT') {
                        window.location.href = '/patient/referrals';
                      } else {
                        window.location.href = '/';
                      }
                    })
                    .catch(() => {
                      window.location.href = '/';
                    });
                } else {
                  // Se não está logado, redirecionar para login
                  window.location.href = '/auth/signin';
                }
              })
              .catch(() => {
                window.location.href = '/';
              });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/referrals/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          doctorId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({ name: '', email: '', phone: '', referrerCode: referrerCode || '' });
      } else {
        setError(data.error || 'Erro ao enviar indicação');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-slate-700">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white border-slate-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-slate-900">Erro</h2>
              <p className="text-slate-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white border-slate-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-slate-900">Indicação Enviada!</h2>
              <p className="text-slate-600 mb-4">
                Sua indicação foi registrada com sucesso. Nossa equipe entrará em contato em breve.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-blue-800 text-sm">
                  Redirecionando para suas indicações em {countdown} segundo{countdown !== 1 ? 's' : ''}...
                </p>
              </div>
              
              <div className="space-y-3">
              <Button 
                onClick={() => {
                    // Verificar se o usuário está logado como paciente
                    fetch('/api/auth/session')
                      .then(res => res.json())
                      .then(session => {
                        if (session?.user) {
                          // Se está logado, verificar se é paciente
                          fetch('/api/auth/role')
                            .then(res => res.json())
                            .then(data => {
                              if (data.role === 'PATIENT') {
                                window.location.href = '/patient/referrals';
                              } else {
                                window.location.href = '/';
                              }
                            })
                            .catch(() => {
                              window.location.href = '/';
                            });
                        } else {
                          // Se não está logado, redirecionar para login
                          window.location.href = '/auth/signin';
                        }
                      })
                      .catch(() => {
                        window.location.href = '/';
                      });
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Ver Minhas Indicações Agora
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSuccess(false);
                    setCountdown(5);
                    setFormData({ name: '', email: '', phone: '', referrerCode: referrerCode || '' });
                  }}
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Fazer Nova Indicação
              </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header com informações do médico */}
          <Card className="mb-6 bg-white border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                {doctor?.image ? (
                  <img 
                    src={doctor.image} 
                    alt={doctor.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserPlus className="h-8 w-8 text-blue-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-slate-900">
                    Indicar para {doctor?.name}
                  </h1>
                  <p className="text-slate-600">
                    Indique amigos e familiares e ganhe recompensas especiais
                  </p>
                  {stats && (
                    <div className="flex items-center mt-2 text-sm text-slate-500">
                      <Users className="h-4 w-4 mr-1" />
                      {stats.totalPatients} pacientes atendidos
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulário */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-slate-900">
                <UserPlus className="h-5 w-5" />
                <span>Formulário de Indicação</span>
              </CardTitle>
              <CardDescription className="text-slate-600">
                Preencha os dados da pessoa que você gostaria de indicar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-slate-700">Nome completo *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Nome da pessoa indicada"
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-slate-700">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="email@exemplo.com"
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-slate-700">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(11) 99999-9999"
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <Label htmlFor="referrerCode" className="text-slate-700">Código de indicação</Label>
                  <Input
                    id="referrerCode"
                    name="referrerCode"
                    type="text"
                    value={formData.referrerCode}
                    onChange={handleInputChange}
                    placeholder="Ex: ABC123"
                    className={`${referrerCode ? 'bg-slate-50' : 'bg-white'} border-slate-300 text-slate-900 placeholder:text-slate-500`}
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    {referrerCode 
                      ? 'Código preenchido automaticamente pelo link de indicação'
                      : 'Digite o código de indicação do paciente que te indicou (opcional)'
                    }
                  </p>
                </div>

                {error && (
                  <div className="text-red-600 text-sm mt-2 bg-red-50 p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Enviar Indicação
                    </>
                  )}
                </Button>
              </form>

              {/* Informações sobre o programa */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Como funciona o programa de indicações?
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Você indica amigos e familiares</li>
                  <li>• Quando eles se tornam pacientes, você ganha créditos</li>
                  <li>• Use os créditos para resgatar recompensas especiais</li>
                  <li>• Quanto mais indicar, mais benefícios você recebe</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 