'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Loader2, 
  Share2,
  Copy,
  Gift,
  Users,
  CheckCircle,
  Clock,
  Star,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';

interface PatientStats {
  totalReferrals: number;
  convertedReferrals: number;
  totalCreditsEarned: number;
  totalCreditsUsed: number;
  currentBalance: number;
}

interface Credit {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
  lead?: {
    name: string;
    email: string;
    status: string;
  };
}

interface Referral {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  doctor: {
    id: string;
    name: string;
  };
  credits: Array<{
    id: string;
    amount: number;
    status: string;
  }>;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  creditsRequired: number;
  maxRedemptions?: number;
  currentRedemptions: number;
  isActive: boolean;
}

interface Redemption {
  id: string;
  creditsUsed: number;
  status: string;
  redeemedAt: string;
  reward: {
    title: string;
    description: string;
    creditsRequired: number;
  };
}

const statusConfig = {
  PENDING: { label: 'Pendente', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: Clock },
  CONTACTED: { label: 'Contatado', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: Users },
  CONVERTED: { label: 'Convertido', color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: CheckCircle },
  REJECTED: { label: 'Rejeitado', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: Clock },
  APPROVED: { label: 'Aprovado', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: CheckCircle },
  FULFILLED: { label: 'Entregue', color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: CheckCircle }
};

export default function PatientReferralsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [creditsHistory, setCreditsHistory] = useState<Credit[]>([]);
  const [referralsMade, setReferralsMade] = useState<Referral[]>([]);
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
  const [redemptionsHistory, setRedemptionsHistory] = useState<Redemption[]>([]);
  const [creditsBalance, setCreditsBalance] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [userRole, setUserRole] = useState<'DOCTOR' | 'PATIENT' | 'SUPER_ADMIN' | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Verificar role do usuário
  useEffect(() => {
    const checkUserRole = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/auth/role');
          if (response.ok) {
            const data = await response.json();
            setUserRole(data.role);
            
            // Redirecionar médicos para a página correta
            if (data.role === 'DOCTOR') {
              window.location.href = '/doctor/referrals';
              return;
            }
            
            // Redirecionar admins para a página correta
            if (data.role === 'SUPER_ADMIN') {
              window.location.href = '/admin';
              return;
            }
            
            // Se for paciente, carregar dados
            if (data.role === 'PATIENT') {
              loadDashboard();
            } else {
              setAccessDenied(true);
              setLoading(false);
            }
          } else {
            setAccessDenied(true);
            setLoading(false);
          }
        } catch (error) {
          console.error('Erro ao verificar role:', error);
          setAccessDenied(true);
          setLoading(false);
        }
      }
    };

    checkUserRole();
  }, [session]);

  // Carregar dados do dashboard
  const loadDashboard = async () => {
    try {
      const response = await fetch('/api/referrals/patient');
      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
        setCreditsHistory(data.creditsHistory);
        setReferralsMade(data.referralsMade);
        setAvailableRewards(data.availableRewards);
        setRedemptionsHistory(data.redemptionsHistory);
        setCreditsBalance(data.creditsBalance);
        setReferralCode(data.referralCode || '');
        setDoctorId(data.doctorId || '');
      } else {
        if (response.status === 403) {
          setAccessDenied(true);
        } else {
          console.error('Erro ao carregar dashboard:', data.error);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemReward = async (rewardId: string) => {
    setRedeeming(rewardId);
    try {
      const response = await fetch('/api/referrals/patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Recompensa resgatada com sucesso!');
        await loadDashboard(); // Recarregar dados
      } else {
        toast.error(data.error || 'Erro ao resgatar recompensa');
      }
    } catch (error) {
      console.error('Erro ao resgatar recompensa:', error);
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setRedeeming(null);
    }
  };

  const generateReferralLink = () => {
    if (!doctorId || !referralCode) return '';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    return `${baseUrl}/referral/${doctorId}?code=${referralCode}`;
  };

  const copyReferralLink = async () => {
    const link = generateReferralLink();
    if (link) {
      try {
        await navigator.clipboard.writeText(link);
        toast.success('Link copiado para a área de transferência!');
      } catch (error) {
        toast.error('Erro ao copiar link');
      }
    }
  };

  const copyReferralCode = async () => {
    if (referralCode) {
      try {
        await navigator.clipboard.writeText(referralCode);
        toast.success('Código copiado para a área de transferência!');
      } catch (error) {
        toast.error('Erro ao copiar código');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Acesso Negado</h1>
          <p className="text-zinc-400 mb-6">Esta página é exclusiva para pacientes.</p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/20 via-zinc-800/10 to-zinc-900/20" />
        <div className="relative pt-[88px] lg:pt-[120px] pb-12 lg:pb-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl lg:text-4xl font-light text-white mb-3">
                  Olá {session?.user?.name || 'Usuário'}
                </h1>
                <p className="text-xl lg:text-2xl text-zinc-300 font-light">
                  Indique amigos e ganhe recompensas incríveis
                </p>
        </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          {referralCode && (
            <Button 
              variant="outline" 
              onClick={copyReferralCode} 
                    className="bg-zinc-800/50 border-zinc-700 text-white hover:bg-zinc-700/50 backdrop-blur-sm"
            >
              <Copy className="h-4 w-4 mr-2" />
              Código: {referralCode}
            </Button>
          )}
          {doctorId && referralCode && (
            <Button 
              onClick={copyReferralLink} 
                    className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25"
            >
              <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar Link de Indicação
            </Button>
          )}
      </div>

      {/* Stats Cards */}
      {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-blue-400 mb-2">{creditsBalance}</div>
                      <div className="text-zinc-400 text-sm">Créditos Disponíveis</div>
            </CardContent>
          </Card>

                  <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-white mb-2">{stats.totalReferrals}</div>
                      <div className="text-zinc-400 text-sm">Total de Indicações</div>
            </CardContent>
          </Card>

                  <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-green-400 mb-2">{stats.convertedReferrals}</div>
                      <div className="text-zinc-400 text-sm">Convertidas</div>
            </CardContent>
          </Card>

                  <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-purple-400 mb-2">
                  {stats.totalReferrals > 0 ? Math.round((stats.convertedReferrals / stats.totalReferrals) * 100) : 0}%
                </div>
                      <div className="text-zinc-400 text-sm">Taxa de Conversão</div>
            </CardContent>
          </Card>
        </div>
      )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pb-24 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recompensas Disponíveis */}
          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Gift className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Recompensas</CardTitle>
                  <CardDescription className="text-zinc-400">
              Use seus créditos para resgatar recompensas
            </CardDescription>
                </div>
              </div>
          </CardHeader>
            <CardContent className="space-y-4">
            {availableRewards.map((reward) => (
                <div key={reward.id} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">{reward.title}</h3>
                    <p className="text-zinc-400 text-sm mt-1">{reward.description}</p>
                  </div>
                    <div className="text-right ml-4">
                      <div className="text-white font-bold text-lg">{reward.creditsRequired}</div>
                    <div className="text-zinc-400 text-xs">créditos</div>
                  </div>
                </div>
                
                {reward.maxRedemptions && (
                  <p className="text-zinc-500 text-xs mb-3">
                    Restam: {reward.maxRedemptions - reward.currentRedemptions} resgates
                  </p>
                )}

                <Button
                  onClick={() => handleRedeemReward(reward.id)}
                  disabled={
                    creditsBalance < reward.creditsRequired ||
                    redeeming === reward.id ||
                    (reward.maxRedemptions ? reward.currentRedemptions >= reward.maxRedemptions : false)
                  }
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500"
                >
                  {redeeming === reward.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resgatando...
                    </>
                  ) : creditsBalance < reward.creditsRequired ? (
                    'Créditos insuficientes'
                  ) : (reward.maxRedemptions && reward.currentRedemptions >= reward.maxRedemptions) ? (
                    'Esgotado'
                  ) : (
                    'Resgatar'
                  )}
                </Button>
              </div>
            ))}

            {availableRewards.length === 0 && (
                <div className="text-center py-12">
                  <div className="p-3 bg-zinc-800/50 rounded-full w-fit mx-auto mb-4">
                    <Gift className="h-8 w-8 text-zinc-500" />
                  </div>
                  <div className="text-zinc-500 text-lg mb-2">Nenhuma recompensa disponível</div>
                <div className="text-zinc-400 text-sm">Aguarde novas recompensas do seu médico</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico de Indicações */}
          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <UserPlus className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Suas Indicações</CardTitle>
                  <CardDescription className="text-zinc-400">
              Pessoas que você indicou
            </CardDescription>
                </div>
              </div>
          </CardHeader>
            <CardContent className="space-y-4">
              {referralsMade.map((referral) => {
                const StatusIcon = statusConfig[referral.status as keyof typeof statusConfig]?.icon || Clock;
                return (
                  <div key={referral.id} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                    <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                        <h3 className="font-semibold text-white">{referral.name}</h3>
                        <p className="text-zinc-400 text-sm">{referral.email}</p>
                  </div>
                      <Badge className={`${statusConfig[referral.status as keyof typeof statusConfig]?.color || 'bg-zinc-700 text-zinc-300'} border text-xs flex items-center gap-1`}>
                        <StatusIcon className="h-3 w-3" />
                    {statusConfig[referral.status as keyof typeof statusConfig]?.label || referral.status}
                  </Badge>
                </div>
                
                    <div className="flex justify-between items-center text-sm text-zinc-400 mb-2">
                  <span>Dr(a). {referral.doctor.name}</span>
                  <span>{new Date(referral.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>

                {referral.credits.length > 0 && (
                      <div className="text-blue-400 text-sm font-medium flex items-center gap-1">
                        <Star className="h-4 w-4" />
                    +{referral.credits.reduce((sum, credit) => sum + credit.amount, 0)} créditos ganhos
                  </div>
                )}
              </div>
                );
              })}

            {referralsMade.length === 0 && (
                <div className="text-center py-12">
                  <div className="p-3 bg-zinc-800/50 rounded-full w-fit mx-auto mb-4">
                    <UserPlus className="h-8 w-8 text-zinc-500" />
                  </div>
                  <div className="text-zinc-500 text-lg mb-2">Nenhuma indicação ainda</div>
                <div className="text-zinc-400 text-sm mb-4">Comece a indicar pessoas para ganhar créditos</div>
                {doctorId && (
                  <Button 
                    onClick={copyReferralLink} 
                      className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Começar a Indicar
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Resgates */}
      {redemptionsHistory.length > 0 && (
          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Histórico de Resgates</CardTitle>
                  <CardDescription className="text-zinc-400">
              Recompensas que você já resgatou
            </CardDescription>
                </div>
              </div>
          </CardHeader>
            <CardContent className="space-y-4">
              {redemptionsHistory.map((redemption) => {
                const StatusIcon = statusConfig[redemption.status as keyof typeof statusConfig]?.icon || Clock;
                return (
                  <div key={redemption.id} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                    <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                        <h3 className="font-semibold text-white">{redemption.reward.title}</h3>
                        <p className="text-zinc-400 text-sm">{redemption.reward.description}</p>
                  </div>
                      <Badge className={`${statusConfig[redemption.status as keyof typeof statusConfig]?.color || 'bg-zinc-700 text-zinc-300'} border text-xs flex items-center gap-1`}>
                        <StatusIcon className="h-3 w-3" />
                    {statusConfig[redemption.status as keyof typeof statusConfig]?.label || redemption.status}
                  </Badge>
                </div>
                    <div className="flex justify-between items-center text-sm text-zinc-400">
                  <span>{redemption.creditsUsed} créditos usados</span>
                  <span>{new Date(redemption.redeemedAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
                );
              })}
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}