// hooks/useUsageTracking.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

export function useUsageTracking() {
  const { user, isAuthenticated } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const startUsageTracking = async () => {
    if (!isAuthenticated || !user) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/usage-session/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        sessionIdRef.current = data.sessionId;
        console.log('✅ Sessão de uso iniciada:', data.sessionId);
        
        // Iniciar heartbeat a cada 30 segundos
        startHeartbeat();
      }
    } catch (error) {
      console.error('Erro ao iniciar tracking de uso:', error);
    }
  };

  const endUsageTracking = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      // Parar heartbeat
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const response = await fetch('/api/usage-session/end', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sessão de uso finalizada:', data.duration, 'segundos');
        sessionIdRef.current = null;
      }
    } catch (error) {
      console.error('Erro ao finalizar tracking de uso:', error);
    }
  };

  const startHeartbeat = () => {
    // Limpar intervalo existente se houver
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Enviar heartbeat a cada 30 segundos
    intervalRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token || !isAuthenticated) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        await fetch('/api/usage-session/heartbeat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Erro no heartbeat:', error);
      }
    }, 30000); // 30 segundos
  };

  // Efeito para iniciar/parar tracking baseado na autenticação
  useEffect(() => {
    if (isAuthenticated && user) {
      startUsageTracking();
    } else {
      endUsageTracking();
    }

    // Cleanup na desmontagem
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, user]);

  // Detectar quando a aba fica inativa/ativa
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Aba ficou inativa - pausar heartbeat mas não finalizar sessão
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Aba ficou ativa - retomar heartbeat se autenticado
        if (isAuthenticated && user && !intervalRef.current) {
          startHeartbeat();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, user]);

  // Detectar fechamento da janela/aba
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Tentar finalizar sessão sincronamente
      if (sessionIdRef.current) {
        const token = localStorage.getItem('authToken');
        if (token) {
          // Usar sendBeacon para envio garantido ao fechar
          const data = JSON.stringify({});
          navigator.sendBeacon('/api/usage-session/end', data);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return {
    sessionId: sessionIdRef.current,
    startUsageTracking,
    endUsageTracking,
  };
}
