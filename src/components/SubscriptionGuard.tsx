'use client';

import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Crown } from 'lucide-react';

interface SubscriptionGuardProps {
  type: 'patients' | 'protocols' | 'courses' | 'products';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onUpgrade?: () => void;
}

export function SubscriptionGuard({ 
  type, 
  children, 
  fallback,
  onUpgrade 
}: SubscriptionGuardProps) {
  const { checkLimit, isActive, isTrial, daysRemaining, limits } = useSubscription();
  const [checking, setChecking] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string>('');

  const handleClick = async () => {
    setChecking(true);
    
    const result = await checkLimit(type);
    
    if (!result.allowed) {
      setLimitReached(true);
      setLimitMessage(result.message || 'Limite atingido');
    } else {
      setLimitReached(false);
      // Se permitido, renderizar o children
    }
    
    setChecking(false);
  };

  // Se não está ativo, mostrar aviso
  if (!isActive) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center gap-2 text-red-700 mb-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">Subscription Inativa</span>
        </div>
        <p className="text-red-600 text-sm mb-3">
          Sua subscription está inativa. Ative para continuar usando esta funcionalidade.
        </p>
        {onUpgrade && (
          <Button onClick={onUpgrade} size="sm" className="bg-red-600 hover:bg-red-700">
            <Crown className="h-4 w-4 mr-2" />
            Ativar Subscription
          </Button>
        )}
      </div>
    );
  }

  // Se é trial, mostrar aviso
  if (isTrial && daysRemaining <= 3) {
    return (
      <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50 mb-4">
        <div className="flex items-center gap-2 text-yellow-700 mb-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">Trial Expirando</span>
        </div>
        <p className="text-yellow-600 text-sm mb-3">
          Seu trial expira em {daysRemaining} dias. Faça upgrade para continuar.
        </p>
        {onUpgrade && (
          <Button onClick={onUpgrade} size="sm" className="bg-yellow-600 hover:bg-yellow-700">
            <Crown className="h-4 w-4 mr-2" />
            Fazer Upgrade
          </Button>
        )}
        <div className="mt-3">
          {children}
        </div>
      </div>
    );
  }

  // Se limite foi atingido, mostrar fallback ou mensagem
  if (limitReached) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
        <div className="flex items-center gap-2 text-orange-700 mb-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">Limite Atingido</span>
        </div>
        <p className="text-orange-600 text-sm mb-3">
          {limitMessage}
        </p>
        <div className="text-xs text-orange-500 mb-3">
          Limite atual: {limits[`max${type.charAt(0).toUpperCase() + type.slice(1, -1)}s` as keyof typeof limits]}
        </div>
        {onUpgrade && (
          <Button onClick={onUpgrade} size="sm" className="bg-orange-600 hover:bg-orange-700">
            <Crown className="h-4 w-4 mr-2" />
            Fazer Upgrade
          </Button>
        )}
      </div>
    );
  }

  // Se está verificando, mostrar loading
  if (checking) {
    return (
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
    );
  }

  // Renderizar children normalmente, mas interceptar cliques
  return (
    <div onClick={handleClick}>
      {children}
    </div>
  );
}

// Componente para mostrar status da subscription
export function SubscriptionStatus() {
  const { subscriptionStatus, loading, isActive, isTrial, daysRemaining, limits } = useSubscription();

  if (loading) {
    return <div className="text-sm text-gray-500">Carregando...</div>;
  }

  if (!subscriptionStatus) {
    return <div className="text-sm text-red-500">Subscription não encontrada</div>;
  }

  return (
    <div className="p-3 border rounded-lg bg-gray-50">
      <div className="flex items-center gap-2 mb-2">
        <Crown className="h-4 w-4" />
        <span className="font-medium text-sm">
          {isTrial ? 'Trial' : 'Plano Ativo'}
        </span>
        {isTrial && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
            {daysRemaining} dias restantes
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div>Pacientes: {limits.maxPatients}</div>
        <div>Protocolos: {limits.maxProtocols}</div>
        <div>Cursos: {limits.maxCourses}</div>
        <div>Produtos: {limits.maxProducts}</div>
      </div>
    </div>
  );
} 