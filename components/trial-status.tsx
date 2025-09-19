// components/trial-status.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Crown, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface SubscriptionStatus {
  canAccess: boolean;
  isExpired: boolean;
  isTrial: boolean;
  daysRemaining?: number;
  plan?: any;
}

export default function TrialStatus() {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/teams/subscription-status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSubscriptionStatus(data);
        }
      } catch (error) {
        console.error('Erro ao verificar status da assinatura:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscriptionStatus();
    
    // Verificar a cada 30 segundos
    const interval = setInterval(checkSubscriptionStatus, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user || isLoading || !subscriptionStatus) {
    return null;
  }

  // Trial expirado
  if (subscriptionStatus.isTrial && subscriptionStatus.isExpired) {
    return (
      <Button
        variant="destructive"
        size="sm"
        onClick={() => router.push('/planos?expired=true')}
        className="h-10 px-3 rounded-xl text-xs font-medium animate-pulse"
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Trial Expirado
      </Button>
    );
  }

  // Trial ativo (últimos 2 dias)
  if (subscriptionStatus.isTrial && !subscriptionStatus.isExpired) {
    const daysLeft = subscriptionStatus.daysRemaining || 0;
    
    if (daysLeft <= 2) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/planos')}
          className="h-10 px-3 rounded-xl text-xs font-medium border-orange-300 text-orange-700 hover:bg-orange-50"
        >
          <Clock className="h-4 w-4 mr-2" />
          {daysLeft === 0 ? 'Expira hoje' : `${daysLeft} dias restantes`}
        </Button>
      );
    }
  }

  return null;
}