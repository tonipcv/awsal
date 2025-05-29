import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { SubscriptionStatus, getDoctorSubscriptionStatus } from '@/lib/subscription';

export function useSubscription() {
  const { data: session } = useSession();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const status = await getDoctorSubscriptionStatus(session.user.id);
        setSubscriptionStatus(status);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar subscription');
        console.error('Erro ao carregar subscription:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [session?.user?.id]);

  const checkLimit = async (type: 'patients' | 'protocols' | 'courses' | 'products'): Promise<{ allowed: boolean; message?: string }> => {
    if (!session?.user?.id) {
      return { allowed: false, message: 'Usuário não autenticado' };
    }

    try {
      const response = await fetch(`/api/subscription/check-limit?type=${type}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Erro ao verificar limite');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao verificar limite:', error);
      return { allowed: false, message: 'Erro ao verificar limite' };
    }
  };

  return {
    subscriptionStatus,
    loading,
    error,
    checkLimit,
    isActive: subscriptionStatus?.isActive || false,
    isTrial: subscriptionStatus?.isTrial || false,
    daysRemaining: subscriptionStatus?.daysRemaining || 0,
    limits: subscriptionStatus?.limits || {
      maxPatients: 0,
      maxProtocols: 0,
      maxCourses: 0,
      maxProducts: 0,
      features: []
    }
  };
} 