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
      <div className="min-h-screen bg-black">
        {/* Padding para menu lateral no desktop e header no mobile */}
        <div className="pt-[88px] pb-24 lg:pt-[88px] lg:pb-4 lg:ml-64">
          <div className="max-w-6xl mx-auto px-3 py-2 lg:px-6 lg:py-4">
            
            {/* Hero Skeleton */}
            <div className="mb-6 lg:mb-8">
              <div className="text-center max-w-3xl mx-auto">
                <div className="h-8 lg:h-12 bg-gray-800/50 rounded-lg w-64 mx-auto mb-3 lg:mb-4 animate-pulse"></div>
                <div className="h-4 lg:h-6 bg-gray-700/50 rounded w-80 mx-auto mb-6 lg:mb-8 animate-pulse"></div>
                
                {/* Action Buttons Skeleton */}
                <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 justify-center items-center mb-4 lg:mb-6">
                  <div className="h-8 lg:h-9 bg-gray-800/50 rounded w-32 animate-pulse"></div>
                  <div className="h-8 lg:h-9 bg-gray-800/50 rounded w-40 animate-pulse"></div>
                </div>
                
                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gray-900/40 border border-gray-800/40 rounded-xl p-3 lg:p-4 backdrop-blur-sm">
                      <div className="h-6 lg:h-8 bg-gray-800/50 rounded w-8 mx-auto mb-2 animate-pulse"></div>
                      <div className="h-3 lg:h-4 bg-gray-700/50 rounded w-20 mx-auto animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Recompensas Card Skeleton */}
              <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl backdrop-blur-sm">
                <div className="p-4 lg:p-6 border-b border-gray-800/40">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-800/50 rounded-lg animate-pulse"></div>
                    <div>
                      <div className="h-5 lg:h-6 bg-gray-800/50 rounded w-24 mb-1 animate-pulse"></div>
                      <div className="h-3 lg:h-4 bg-gray-700/50 rounded w-40 animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div className="p-4 lg:p-6 space-y-3 lg:space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-gray-800/50 rounded-lg p-3 lg:p-4 border border-gray-700/50">
                      <div className="flex justify-between items-start mb-2 lg:mb-3">
                        <div className="flex-1">
                          <div className="h-4 lg:h-5 bg-gray-700/50 rounded w-32 mb-2 animate-pulse"></div>
                          <div className="h-3 lg:h-4 bg-gray-600/50 rounded w-48 animate-pulse"></div>
                        </div>
                        <div className="text-right ml-3 lg:ml-4">
                          <div className="h-4 lg:h-5 bg-gray-700/50 rounded w-8 mb-1 animate-pulse"></div>
                          <div className="h-3 bg-gray-600/50 rounded w-12 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="h-7 lg:h-8 bg-gray-700/50 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Indicações Card Skeleton */}
              <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl backdrop-blur-sm">
                <div className="p-4 lg:p-6 border-b border-gray-800/40">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-800/50 rounded-lg animate-pulse"></div>
                    <div>
                      <div className="h-5 lg:h-6 bg-gray-800/50 rounded w-32 mb-1 animate-pulse"></div>
                      <div className="h-3 lg:h-4 bg-gray-700/50 rounded w-36 animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div className="p-4 lg:p-6 space-y-3 lg:space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-800/50 rounded-lg p-3 lg:p-4 border border-gray-700/50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="h-4 lg:h-5 bg-gray-700/50 rounded w-28 mb-1 animate-pulse"></div>
                          <div className="h-3 lg:h-4 bg-gray-600/50 rounded w-40 animate-pulse"></div>
                        </div>
                        <div className="h-5 bg-gray-700/50 rounded w-20 animate-pulse"></div>
                      </div>
                      <div className="h-3 bg-gray-600/50 rounded w-24 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Cards Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mt-4 lg:mt-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-gray-900/40 border border-gray-800/40 rounded-xl backdrop-blur-sm">
                  <div className="p-4 lg:p-6 border-b border-gray-800/40">
                    <div className="flex items-center gap-2 lg:gap-3">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-800/50 rounded-lg animate-pulse"></div>
                      <div>
                        <div className="h-5 lg:h-6 bg-gray-800/50 rounded w-28 mb-1 animate-pulse"></div>
                        <div className="h-3 lg:h-4 bg-gray-700/50 rounded w-32 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 lg:p-6 space-y-3">
                    {[1, 2].map((j) => (
                      <div key={j} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                        <div className="h-4 bg-gray-700/50 rounded w-full mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-600/50 rounded w-3/4 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Acesso Negado</h1>
          <p className="text-gray-400 mb-6">Esta página é exclusiva para pacientes.</p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-turquoise hover:bg-turquoise/90 text-black"
          >
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Padding para menu lateral no desktop e header no mobile */}
      <div className="pt-[88px] pb-24 lg:pt-[88px] lg:pb-4 lg:ml-64">
        
        {/* Hero Section Compacto */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-gray-800/10 to-gray-900/20" />
          <div className="relative py-6 lg:py-8">
            <div className="max-w-6xl mx-auto px-3 lg:px-6">
              <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-2xl lg:text-4xl font-light text-white mb-2 lg:mb-3 tracking-tight">
                  Programa de Indicações
                </h1>
                <p className="text-sm lg:text-lg text-gray-300 mb-4 lg:mb-6 font-light leading-relaxed">
                  Indique amigos e ganhe recompensas incríveis
                </p>
                
                {/* Action Buttons Compactos */}
                <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 justify-center items-center mb-4 lg:mb-6">
                  {referralCode && (
                    <Button 
                      variant="outline" 
                      onClick={copyReferralCode} 
                      className="bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-700/50 backdrop-blur-sm text-xs lg:text-sm h-8 lg:h-9 px-3 lg:px-4"
                    >
                      <Copy className="h-3 w-3 lg:h-4 lg:w-4 mr-1.5 lg:mr-2" />
                      Código: {referralCode}
                    </Button>
                  )}
                  {doctorId && referralCode && (
                    <Button 
                      onClick={copyReferralLink} 
                      className="bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-black font-medium text-xs lg:text-sm h-8 lg:h-9 px-3 lg:px-4 shadow-md shadow-teal-400/25"
                    >
                      <Share2 className="h-3 w-3 lg:h-4 lg:w-4 mr-1.5 lg:mr-2" />
                      Compartilhar Link
                    </Button>
                  )}
                </div>

                {/* Stats Cards Compactas */}
                {stats && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
                    <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl p-3 lg:p-4 backdrop-blur-sm">
                      <div className="text-xl lg:text-2xl font-light text-teal-400 mb-1">{creditsBalance}</div>
                      <div className="text-gray-400 text-xs lg:text-sm">Créditos Disponíveis</div>
                    </div>

                    <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl p-3 lg:p-4 backdrop-blur-sm">
                      <div className="text-xl lg:text-2xl font-light text-white mb-1">{stats.totalReferrals}</div>
                      <div className="text-gray-400 text-xs lg:text-sm">Total de Indicações</div>
                    </div>

                    <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl p-3 lg:p-4 backdrop-blur-sm">
                      <div className="text-xl lg:text-2xl font-light text-green-400 mb-1">{stats.convertedReferrals}</div>
                      <div className="text-gray-400 text-xs lg:text-sm">Convertidas</div>
                    </div>

                    <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl p-3 lg:p-4 backdrop-blur-sm">
                      <div className="text-xl lg:text-2xl font-light text-purple-400 mb-1">
                        {stats.totalReferrals > 0 ? Math.round((stats.convertedReferrals / stats.totalReferrals) * 100) : 0}%
                      </div>
                      <div className="text-gray-400 text-xs lg:text-sm">Taxa de Conversão</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-3 lg:px-6 space-y-4 lg:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Recompensas Disponíveis */}
            <Card className="bg-gray-900/40 border border-gray-800/40 backdrop-blur-sm">
              <CardHeader className="pb-3 lg:pb-4">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="p-1.5 lg:p-2 bg-teal-400/20 rounded-lg">
                    <Gift className="h-4 w-4 lg:h-5 lg:w-5 text-teal-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-base lg:text-xl font-light">Recompensas</CardTitle>
                    <CardDescription className="text-gray-400 text-xs lg:text-sm">
                      Use seus créditos para resgatar recompensas
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 lg:space-y-4">
                {availableRewards.map((reward) => (
                  <div key={reward.id} className="bg-gray-800/50 rounded-lg p-3 lg:p-4 border border-gray-700/50">
                    <div className="flex justify-between items-start mb-2 lg:mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-white text-sm lg:text-base">{reward.title}</h3>
                        <p className="text-gray-400 text-xs lg:text-sm mt-1">{reward.description}</p>
                      </div>
                      <div className="text-right ml-3 lg:ml-4">
                        <div className="text-white font-medium text-sm lg:text-base">{reward.creditsRequired}</div>
                        <div className="text-gray-400 text-xs">créditos</div>
                      </div>
                    </div>
                    
                    {reward.maxRedemptions && (
                      <p className="text-gray-500 text-xs mb-2 lg:mb-3">
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
                      className="w-full bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-black font-medium disabled:bg-gray-700 disabled:text-gray-500 text-xs lg:text-sm h-7 lg:h-8"
                    >
                      {redeeming === reward.id ? (
                        <>
                          <Loader2 className="mr-1.5 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4 animate-spin" />
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
                  <div className="text-center py-8 lg:py-12">
                    <div className="p-2 lg:p-3 bg-gray-800/50 rounded-full w-fit mx-auto mb-3 lg:mb-4">
                      <Gift className="h-6 w-6 lg:h-8 lg:w-8 text-gray-500" />
                    </div>
                    <div className="text-gray-500 text-sm lg:text-base mb-1 lg:mb-2">Nenhuma recompensa disponível</div>
                    <div className="text-gray-400 text-xs lg:text-sm">Aguarde novas recompensas do seu médico</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Histórico de Indicações */}
            <Card className="bg-gray-900/40 border border-gray-800/40 backdrop-blur-sm">
              <CardHeader className="pb-3 lg:pb-4">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="p-1.5 lg:p-2 bg-green-400/20 rounded-lg">
                    <UserPlus className="h-4 w-4 lg:h-5 lg:w-5 text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-base lg:text-xl font-light">Suas Indicações</CardTitle>
                    <CardDescription className="text-gray-400 text-xs lg:text-sm">
                      Pessoas que você indicou
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 lg:space-y-4">
                {referralsMade.map((referral) => {
                  const StatusIcon = statusConfig[referral.status as keyof typeof statusConfig]?.icon || Clock;
                  return (
                    <div key={referral.id} className="bg-gray-800/50 rounded-lg p-3 lg:p-4 border border-gray-700/50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-white text-sm lg:text-base">{referral.name}</h3>
                          <p className="text-gray-400 text-xs lg:text-sm">{referral.email}</p>
                        </div>
                        <Badge className={`${statusConfig[referral.status as keyof typeof statusConfig]?.color || 'bg-gray-700 text-gray-300'} border text-xs flex items-center gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[referral.status as keyof typeof statusConfig]?.label || referral.status}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs lg:text-sm text-gray-400 mb-2">
                        <span>Dr(a). {referral.doctor.name}</span>
                        <span>{new Date(referral.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>

                      {referral.credits.length > 0 && (
                        <div className="text-teal-400 text-xs lg:text-sm font-medium flex items-center gap-1">
                          <Star className="h-3 w-3 lg:h-4 lg:w-4" />
                          +{referral.credits.reduce((sum, credit) => sum + credit.amount, 0)} créditos ganhos
                        </div>
                      )}
                    </div>
                  );
                })}

                {referralsMade.length === 0 && (
                  <div className="text-center py-8 lg:py-12">
                    <div className="p-2 lg:p-3 bg-gray-800/50 rounded-full w-fit mx-auto mb-3 lg:mb-4">
                      <UserPlus className="h-6 w-6 lg:h-8 lg:w-8 text-gray-500" />
                    </div>
                    <div className="text-gray-500 text-sm lg:text-base mb-1 lg:mb-2">Nenhuma indicação ainda</div>
                    <div className="text-gray-400 text-xs lg:text-sm mb-3 lg:mb-4">Comece a indicar pessoas para ganhar créditos</div>
                    {doctorId && (
                      <Button 
                        onClick={copyReferralLink} 
                        className="bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-black font-medium text-xs lg:text-sm h-7 lg:h-8 px-3 lg:px-4"
                      >
                        <Share2 className="h-3 w-3 lg:h-4 lg:w-4 mr-1.5 lg:mr-2" />
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
            <Card className="bg-gray-900/40 border border-gray-800/40 backdrop-blur-sm">
              <CardHeader className="pb-3 lg:pb-4">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="p-1.5 lg:p-2 bg-purple-400/20 rounded-lg">
                    <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-base lg:text-xl font-light">Histórico de Resgates</CardTitle>
                    <CardDescription className="text-gray-400 text-xs lg:text-sm">
                      Recompensas que você já resgatou
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 lg:space-y-4">
                {redemptionsHistory.map((redemption) => {
                  const StatusIcon = statusConfig[redemption.status as keyof typeof statusConfig]?.icon || Clock;
                  return (
                    <div key={redemption.id} className="bg-gray-800/50 rounded-lg p-3 lg:p-4 border border-gray-700/50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-white text-sm lg:text-base">{redemption.reward.title}</h3>
                          <p className="text-gray-400 text-xs lg:text-sm">{redemption.reward.description}</p>
                        </div>
                        <Badge className={`${statusConfig[redemption.status as keyof typeof statusConfig]?.color || 'bg-gray-700 text-gray-300'} border text-xs flex items-center gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[redemption.status as keyof typeof statusConfig]?.label || redemption.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-xs lg:text-sm text-gray-400">
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
    </div>
  );
}