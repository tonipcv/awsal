'use client';

import React, { useState, useEffect } from 'react';
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

// Translation system
const translations = {
  pt: {
    // Page title and description
    pageTitle: 'Programa de Indicações',
    pageDescription: 'Indique amigos e ganhe recompensas incríveis',
    
    // Action buttons
    shareLink: 'Compartilhar Link',
    startReferring: 'Começar a Indicar',
    
    // Stats
    availableCredits: 'Créditos Disponíveis',
    totalReferrals: 'Total de Indicações',
    converted: 'Convertidas',
    conversionRate: 'Taxa de Conversão',
    
    // Rewards section
    rewards: 'Recompensas',
    rewardsDescription: 'Use seus créditos para resgatar recompensas',
    credits: 'créditos',
    remaining: 'Restam',
    redemptions: 'resgates',
    redeem: 'Resgatar',
    redeeming: 'Resgatando...',
    insufficientCredits: 'Créditos insuficientes',
    soldOut: 'Esgotado',
    noRewardsAvailable: 'Nenhuma recompensa disponível',
    waitForRewards: 'Aguarde novas recompensas do seu médico',
    
    // Referrals section
    yourReferrals: 'Suas Indicações',
    referralsDescription: 'Pessoas que você indicou',
    noReferralsYet: 'Nenhuma indicação ainda',
    startReferringDescription: 'Comece a indicar pessoas para ganhar créditos',
    creditsEarned: 'créditos ganhos',
    
    // Redemption history
    redemptionHistory: 'Histórico de Resgates',
    redemptionDescription: 'Recompensas que você já resgatou',
    creditsUsed: 'créditos usados',
    
    // Status labels
    status: {
      PENDING: 'Pendente',
      CONTACTED: 'Contatado',
      CONVERTED: 'Convertido',
      REJECTED: 'Rejeitado',
      APPROVED: 'Aprovado',
      FULFILLED: 'Entregue'
    },
    
    // Toast messages
    toastMessages: {
      linkCopied: 'Link copiado para a área de transferência!',
      codeCopied: 'Código copiado para a área de transferência!',
      rewardRedeemed: 'Recompensa resgatada com sucesso!',
      errorRedeeming: 'Erro ao resgatar recompensa',
      errorGeneratingLink: 'Não foi possível gerar o link de indicação',
      errorCopyingLink: 'Erro ao copiar link. Tente novamente.',
      errorCopyingCode: 'Erro ao copiar código. Tente novamente.',
      codeNotAvailable: 'Código de indicação não disponível',
      connectionError: 'Erro de conexão. Tente novamente.',
      copyManually: 'Erro ao copiar link. Tente copiar manualmente: '
    }
  },
  en: {
    // Page title and description
    pageTitle: 'Referral Program',
    pageDescription: 'Refer friends and earn amazing rewards',
    
    // Action buttons
    shareLink: 'Share Link',
    startReferring: 'Start Referring',
    
    // Stats
    availableCredits: 'Available Credits',
    totalReferrals: 'Total Referrals',
    converted: 'Converted',
    conversionRate: 'Conversion Rate',
    
    // Rewards section
    rewards: 'Rewards',
    rewardsDescription: 'Use your credits to redeem rewards',
    credits: 'credits',
    remaining: 'Remaining',
    redemptions: 'redemptions',
    redeem: 'Redeem',
    redeeming: 'Redeeming...',
    insufficientCredits: 'Insufficient credits',
    soldOut: 'Sold out',
    noRewardsAvailable: 'No rewards available',
    waitForRewards: 'Wait for new rewards from your doctor',
    
    // Referrals section
    yourReferrals: 'Your Referrals',
    referralsDescription: 'People you have referred',
    noReferralsYet: 'No referrals yet',
    startReferringDescription: 'Start referring people to earn credits',
    creditsEarned: 'credits earned',
    
    // Redemption history
    redemptionHistory: 'Redemption History',
    redemptionDescription: 'Rewards you have already redeemed',
    creditsUsed: 'credits used',
    
    // Status labels
    status: {
      PENDING: 'Pending',
      CONTACTED: 'Contacted',
      CONVERTED: 'Converted',
      REJECTED: 'Rejected',
      APPROVED: 'Approved',
      FULFILLED: 'Fulfilled'
    },
    
    // Toast messages
    toastMessages: {
      linkCopied: 'Link copied to clipboard!',
      codeCopied: 'Code copied to clipboard!',
      rewardRedeemed: 'Reward redeemed successfully!',
      errorRedeeming: 'Error redeeming reward',
      errorGeneratingLink: 'Could not generate referral link',
      errorCopyingLink: 'Error copying link. Please try again.',
      errorCopyingCode: 'Error copying code. Please try again.',
      codeNotAvailable: 'Referral code not available',
      connectionError: 'Connection error. Please try again.',
      copyManually: 'Error copying link. Please copy manually: '
    }
  }
};

// Hook to detect browser language
const useLanguage = () => {
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');
  
  useEffect(() => {
    // Detect browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('en')) {
      setLanguage('en');
    } else {
      setLanguage('pt'); // Default to Portuguese
    }
  }, []);
  
  return language;
};

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

export default function PatientReferralsPage() {
  const { data: session } = useSession();
  const language = useLanguage();
  const t = translations[language];
  
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [stats, setStats] = useState<PatientStats>({
    totalReferrals: 0,
    convertedReferrals: 0,
    totalCreditsEarned: 0,
    totalCreditsUsed: 0,
    currentBalance: 0
  });
  const [creditsHistory, setCreditsHistory] = useState<Credit[]>([]);
  const [referralsMade, setReferralsMade] = useState<Referral[]>([]);
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
  const [redemptionsHistory, setRedemptionsHistory] = useState<Redemption[]>([]);
  const [creditsBalance, setCreditsBalance] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [doctorId, setDoctorId] = useState('');

  // Status configuration with translations
  const statusConfig = {
    PENDING: { label: t.status.PENDING, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: Clock },
    CONTACTED: { label: t.status.CONTACTED, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: Users },
    CONVERTED: { label: t.status.CONVERTED, color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: CheckCircle },
    REJECTED: { label: t.status.REJECTED, color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: Clock },
    APPROVED: { label: t.status.APPROVED, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: CheckCircle },
    FULFILLED: { label: t.status.FULFILLED, color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: CheckCircle }
  };

  // Carregar dados do dashboard quando o componente montar
  useEffect(() => {
    if (session?.user?.id) {
      loadDashboard();
    }
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
        
        // Debug logging
        console.log('Dashboard data loaded:', {
          doctorId: data.doctorId,
          referralCode: data.referralCode,
          hasReferrals: data.referralsMade?.length > 0
        });
      } else {
        if (response.status === 403) {
          console.error('Access denied to referrals');
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
        toast.success(data.message || t.toastMessages.rewardRedeemed);
        await loadDashboard(); // Recarregar dados
      } else {
        toast.error(data.error || t.toastMessages.errorRedeeming);
      }
    } catch (error) {
      console.error('Erro ao resgatar recompensa:', error);
      toast.error(t.toastMessages.connectionError);
    } finally {
      setRedeeming(null);
    }
  };

  const generateReferralLink = (style = 'default') => {
    if (!doctorId || !referralCode) {
      console.log('Missing data for link generation:', { doctorId, referralCode });
      return '';
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const link = `${baseUrl}/referral/${doctorId}?code=${referralCode}&style=${style}`;
    console.log('Generated referral link:', link);
    return link;
  };

  const copyReferralLink = async () => {
    const link = generateReferralLink('default');
    console.log('Attempting to copy link:', link);
    
    if (!link) {
      toast.error(t.toastMessages.errorGeneratingLink);
      return;
    }

    try {
      // Verificar se o navegador suporta clipboard API
      if (!navigator.clipboard) {
        console.log('Using fallback method (no clipboard API)');
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const success = document.execCommand('copy');
          console.log('Fallback copy result:', success);
          if (success) {
            toast.success(t.toastMessages.linkCopied);
          } else {
            toast.error(t.toastMessages.errorCopyingLink);
          }
        } catch (err) {
          console.error('Fallback copy failed:', err);
          toast.error(t.toastMessages.errorCopyingLink);
        } finally {
          document.body.removeChild(textArea);
        }
        return;
      }

      // Verificar permissões do clipboard
      try {
        const permission = await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
        console.log('Clipboard permission:', permission.state);
      } catch (permError) {
        console.log('Could not check clipboard permissions:', permError);
      }

      // Usar clipboard API moderna
      console.log('Using modern clipboard API');
        await navigator.clipboard.writeText(link);
        toast.success(t.toastMessages.linkCopied);
      console.log('Link copied successfully');
      } catch (error) {
      console.error('Error copying link:', error);
      
      // Tentar fallback se clipboard API falhar
      try {
        console.log('Trying fallback after clipboard API failed');
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (success) {
          toast.success(t.toastMessages.linkCopied);
        } else {
          toast.error(t.toastMessages.copyManually + link);
        }
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError);
        toast.error(t.toastMessages.copyManually + link);
      }
    }
  };

  const copyReferralCode = async () => {
    if (!referralCode) {
      toast.error(t.toastMessages.codeNotAvailable);
      return;
    }

    try {
      // Verificar se o navegador suporta clipboard API
      if (!navigator.clipboard) {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = referralCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          toast.success(t.toastMessages.codeCopied);
        } catch (err) {
          console.error('Fallback copy failed:', err);
          toast.error(t.toastMessages.errorCopyingCode);
        } finally {
          document.body.removeChild(textArea);
        }
        return;
      }

        await navigator.clipboard.writeText(referralCode);
      toast.success(t.toastMessages.codeCopied);
    } catch (error) {
      console.error('Error copying code:', error);
      
      // Tentar fallback se clipboard API falhar
      try {
        const textArea = document.createElement('textarea');
        textArea.value = referralCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success(t.toastMessages.codeCopied);
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError);
        toast.error(t.toastMessages.errorCopyingCode + ': ' + referralCode);
      }
    }
  };

  // Format date based on language
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return language === 'en' 
      ? date.toLocaleDateString('en-US')
      : date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        {/* Padding para menu lateral no desktop e header no mobile */}
        <div className="pt-[88px] pb-24 lg:pt-6 lg:pb-4 lg:ml-64">
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

  return (
    <div className="min-h-screen bg-black">
      {/* Padding para menu lateral no desktop e header no mobile */}
      <div className="pt-[88px] pb-24 lg:pt-6 lg:pb-4 lg:ml-64">
        
        {/* Hero Section Compacto */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-gray-800/10 to-gray-900/20" />
          <div className="relative py-6 lg:py-8">
            <div className="max-w-6xl mx-auto px-3 lg:px-6">
              <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-2xl lg:text-4xl font-light text-white mb-2 lg:mb-3 tracking-tight">
                  {t.pageTitle}
                </h1>
                <p className="text-sm lg:text-lg text-gray-300 mb-4 lg:mb-6 font-light leading-relaxed">
                  {t.pageDescription}
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
                      {language === 'en' ? 'Code' : 'Código'}: {referralCode}
                    </Button>
                  )}
                  {doctorId && referralCode && (
                    <Button 
                      onClick={copyReferralLink} 
                      className="bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-black font-medium text-xs lg:text-sm h-8 lg:h-9 px-3 lg:px-4 shadow-md shadow-teal-400/25"
                    >
                      <Share2 className="h-3 w-3 lg:h-4 lg:w-4 mr-1.5 lg:mr-2" />
                      {t.shareLink}
                    </Button>
                  )}
                </div>

                {/* Stats Cards Compactas */}
                {stats && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
                    <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl p-3 lg:p-4 backdrop-blur-sm">
                      <div className="text-xl lg:text-2xl font-light text-teal-400 mb-1">{creditsBalance}</div>
                      <div className="text-gray-400 text-xs lg:text-sm">{t.availableCredits}</div>
                    </div>

                    <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl p-3 lg:p-4 backdrop-blur-sm">
                      <div className="text-xl lg:text-2xl font-light text-white mb-1">{stats.totalReferrals}</div>
                      <div className="text-gray-400 text-xs lg:text-sm">{t.totalReferrals}</div>
                    </div>

                    <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl p-3 lg:p-4 backdrop-blur-sm">
                      <div className="text-xl lg:text-2xl font-light text-green-400 mb-1">{stats.convertedReferrals}</div>
                      <div className="text-gray-400 text-xs lg:text-sm">{t.converted}</div>
                    </div>

                    <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl p-3 lg:p-4 backdrop-blur-sm">
                      <div className="text-xl lg:text-2xl font-light text-purple-400 mb-1">
                        {stats.totalReferrals > 0 ? Math.round((stats.convertedReferrals / stats.totalReferrals) * 100) : 0}%
                      </div>
                      <div className="text-gray-400 text-xs lg:text-sm">{t.conversionRate}</div>
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
                    <CardTitle className="text-white text-base lg:text-xl font-light">{t.rewards}</CardTitle>
                    <CardDescription className="text-gray-400 text-xs lg:text-sm">
                      {t.rewardsDescription}
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
                        <div className="text-gray-400 text-xs">{t.credits}</div>
                      </div>
                    </div>
                    
                    {reward.maxRedemptions && (
                      <p className="text-gray-500 text-xs mb-2 lg:mb-3">
                        {t.remaining}: {reward.maxRedemptions - reward.currentRedemptions} {t.redemptions}
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
                          {t.redeeming}
                        </>
                      ) : creditsBalance < reward.creditsRequired ? (
                        t.insufficientCredits
                      ) : (reward.maxRedemptions && reward.currentRedemptions >= reward.maxRedemptions) ? (
                        t.soldOut
                      ) : (
                        t.redeem
                      )}
                    </Button>
                  </div>
                ))}

                {availableRewards.length === 0 && (
                  <div className="text-center py-8 lg:py-12">
                    <div className="p-2 lg:p-3 bg-gray-800/50 rounded-full w-fit mx-auto mb-3 lg:mb-4">
                      <Gift className="h-6 w-6 lg:h-8 lg:w-8 text-gray-500" />
                    </div>
                    <div className="text-gray-500 text-sm lg:text-base mb-1 lg:mb-2">{t.noRewardsAvailable}</div>
                    <div className="text-gray-400 text-xs lg:text-sm">{t.waitForRewards}</div>
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
                    <CardTitle className="text-white text-base lg:text-xl font-light">{t.yourReferrals}</CardTitle>
                    <CardDescription className="text-gray-400 text-xs lg:text-sm">
                      {t.referralsDescription}
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
                        <span>
                          {referral.doctor.name.toLowerCase().startsWith('dr') 
                            ? referral.doctor.name 
                            : `Dr(a). ${referral.doctor.name}`
                          }
                        </span>
                        <span>{formatDate(referral.createdAt)}</span>
                      </div>

                      {referral.credits.length > 0 && (
                        <div className="text-teal-400 text-xs lg:text-sm font-medium flex items-center gap-1">
                          <Star className="h-3 w-3 lg:h-4 lg:w-4" />
                          +{referral.credits.reduce((sum, credit) => sum + credit.amount, 0)} {t.creditsEarned}
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
                    <div className="text-gray-500 text-sm lg:text-base mb-1 lg:mb-2">{t.noReferralsYet}</div>
                    <div className="text-gray-400 text-xs lg:text-sm mb-3 lg:mb-4">{t.startReferringDescription}</div>
                    {doctorId && (
                      <Button 
                        onClick={copyReferralLink} 
                        className="bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-black font-medium text-xs lg:text-sm h-7 lg:h-8 px-3 lg:px-4"
                      >
                        <Share2 className="h-3 w-3 lg:h-4 lg:w-4 mr-1.5 lg:mr-2" />
                        {t.startReferring}
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
                    <CardTitle className="text-white text-base lg:text-xl font-light">{t.redemptionHistory}</CardTitle>
                    <CardDescription className="text-gray-400 text-xs lg:text-sm">
                      {t.redemptionDescription}
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
                        <span>{redemption.creditsUsed} {t.creditsUsed}</span>
                        <span>{formatDate(redemption.redeemedAt)}</span>
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