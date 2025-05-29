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
  Users
} from 'lucide-react';

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
  PENDING: { label: 'Pendente', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  CONTACTED: { label: 'Contatado', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  CONVERTED: { label: 'Convertido', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  REJECTED: { label: 'Rejeitado', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  APPROVED: { label: 'Aprovado', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  FULFILLED: { label: 'Entregue', color: 'bg-green-500/20 text-green-300 border-green-500/30' }
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
        alert(data.message);
        await loadDashboard(); // Recarregar dados
      } else {
        alert(data.error || 'Erro ao resgatar recompensa');
      }
    } catch (error) {
      console.error('Erro ao resgatar recompensa:', error);
      alert('Erro de conexão. Tente novamente.');
    } finally {
      setRedeeming(null);
    }
  };

  const generateReferralLink = () => {
    if (!doctorId || !referralCode) return '';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    return `${baseUrl}/referral/${doctorId}?code=${referralCode}`;
  };

  const copyReferralLink = () => {
    const link = generateReferralLink();
    if (link) {
      navigator.clipboard.writeText(link);
      alert('Link copiado para a área de transferência!');
    }
  };

  const copyReferralCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      alert('Código copiado para a área de transferência!');
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
    <div className="min-h-screen bg-zinc-950 pt-20 pb-24 px-4 sm:px-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Indicações</h1>
          <p className="text-zinc-400 mt-1 text-sm sm:text-base">Acompanhe seus créditos e recompensas</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {referralCode && (
            <Button 
              variant="outline" 
              onClick={copyReferralCode} 
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 text-sm"
            >
              <Copy className="h-4 w-4 mr-2" />
              Código: {referralCode}
            </Button>
          )}
          {doctorId && referralCode && (
            <Button 
              onClick={copyReferralLink} 
              className="bg-blue-600 text-white hover:bg-blue-700 text-sm"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar Link
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center">
                <div className="text-xl sm:text-3xl font-bold text-white">{creditsBalance}</div>
                <div className="text-zinc-400 text-xs sm:text-sm mt-1">Créditos Disponíveis</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center">
                <div className="text-xl sm:text-3xl font-bold text-white">{stats.totalReferrals}</div>
                <div className="text-zinc-400 text-xs sm:text-sm mt-1">Total de Indicações</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center">
                <div className="text-xl sm:text-3xl font-bold text-white">{stats.convertedReferrals}</div>
                <div className="text-zinc-400 text-xs sm:text-sm mt-1">Convertidas</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center">
                <div className="text-xl sm:text-3xl font-bold text-white">
                  {stats.totalReferrals > 0 ? Math.round((stats.convertedReferrals / stats.totalReferrals) * 100) : 0}%
                </div>
                <div className="text-zinc-400 text-xs sm:text-sm mt-1">Taxa de Conversão</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Recompensas Disponíveis */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-white text-lg sm:text-xl">Recompensas</CardTitle>
            <CardDescription className="text-zinc-400 text-sm">
              Use seus créditos para resgatar recompensas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            {availableRewards.map((reward) => (
              <div key={reward.id} className="bg-zinc-800 rounded-lg p-3 sm:p-4 border border-zinc-700">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-base sm:text-lg">{reward.title}</h3>
                    <p className="text-zinc-400 text-sm mt-1">{reward.description}</p>
                  </div>
                  <div className="text-left sm:text-right sm:ml-4">
                    <div className="text-white font-bold text-sm sm:text-base">{reward.creditsRequired}</div>
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
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-sm"
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
              <div className="text-center py-8 sm:py-12">
                <div className="text-zinc-500 text-base sm:text-lg mb-2">Nenhuma recompensa disponível</div>
                <div className="text-zinc-400 text-sm">Aguarde novas recompensas do seu médico</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico de Indicações */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-white text-lg sm:text-xl">Suas Indicações</CardTitle>
            <CardDescription className="text-zinc-400 text-sm">
              Pessoas que você indicou
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            {referralsMade.map((referral) => (
              <div key={referral.id} className="bg-zinc-800 rounded-lg p-3 sm:p-4 border border-zinc-700">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-sm sm:text-base">{referral.name}</h3>
                    <p className="text-zinc-400 text-xs sm:text-sm">{referral.email}</p>
                  </div>
                  <Badge className={`${statusConfig[referral.status as keyof typeof statusConfig]?.color || 'bg-zinc-700 text-zinc-300'} border text-xs self-start`}>
                    {statusConfig[referral.status as keyof typeof statusConfig]?.label || referral.status}
                  </Badge>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm text-zinc-400 mb-2 gap-1">
                  <span>Dr(a). {referral.doctor.name}</span>
                  <span>{new Date(referral.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>

                {referral.credits.length > 0 && (
                  <div className="text-blue-400 text-xs sm:text-sm font-medium">
                    +{referral.credits.reduce((sum, credit) => sum + credit.amount, 0)} créditos ganhos
                  </div>
                )}
              </div>
            ))}

            {referralsMade.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <div className="text-zinc-500 text-base sm:text-lg mb-2">Nenhuma indicação ainda</div>
                <div className="text-zinc-400 text-sm mb-4">Comece a indicar pessoas para ganhar créditos</div>
                {doctorId && (
                  <Button 
                    onClick={copyReferralLink} 
                    className="bg-blue-600 text-white hover:bg-blue-700 text-sm"
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
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-white text-lg sm:text-xl">Histórico de Resgates</CardTitle>
            <CardDescription className="text-zinc-400 text-sm">
              Recompensas que você já resgatou
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            {redemptionsHistory.map((redemption) => (
              <div key={redemption.id} className="bg-zinc-800 rounded-lg p-3 sm:p-4 border border-zinc-700">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-sm sm:text-base">{redemption.reward.title}</h3>
                    <p className="text-zinc-400 text-xs sm:text-sm">{redemption.reward.description}</p>
                  </div>
                  <Badge className={`${statusConfig[redemption.status as keyof typeof statusConfig]?.color || 'bg-zinc-700 text-zinc-300'} border text-xs self-start`}>
                    {statusConfig[redemption.status as keyof typeof statusConfig]?.label || redemption.status}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm text-zinc-400 gap-1">
                  <span>{redemption.creditsUsed} créditos usados</span>
                  <span>{new Date(redemption.redeemedAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}