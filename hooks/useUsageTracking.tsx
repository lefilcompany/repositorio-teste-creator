// hooks/useUsageTracking.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

export function useUsageTracking() {
  const { user, isAuthenticated } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isTrackingRef = useRef<boolean>(false);

  const startUsageTracking = async () => {
    if (!isAuthenticated || !user || isTrackingRef.current) return;

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
        isTrackingRef.current = true;
        console.log('✅ Sessão de uso iniciada:', data.sessionId);
        
        // Iniciar heartbeat a cada 30 segundos
        startHeartbeat();
      }
    } catch (error) {
      console.error('Erro ao iniciar tracking de uso:', error);
    }
  };

  const pauseUsageTracking = async () => {
    if (!isTrackingRef.current) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      // Parar heartbeat
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const response = await fetch('/api/usage-session/pause', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('⏸️ Sessão pausada:', data.duration, 'segundos');
        isTrackingRef.current = false;
      }
    } catch (error) {
      console.error('Erro ao pausar tracking de uso:', error);
    }
  };

  const resumeUsageTracking = async () => {
    if (isTrackingRef.current || !isAuthenticated || !user) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/usage-session/resume', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        sessionIdRef.current = data.sessionId;
        isTrackingRef.current = true;
        console.log('▶️ Sessão retomada:', data.sessionId);
        
        // Reiniciar heartbeat
        startHeartbeat();
      }
    } catch (error) {
      console.error('Erro ao retomar tracking de uso:', error);
    }
  };

  const endUsageTracking = async () => {
    if (!isTrackingRef.current) return;

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
        isTrackingRef.current = false;
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
        if (!token || !isAuthenticated || !isTrackingRef.current) {
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
        // Aba ficou inativa - pausar sessão
        console.log('📴 Aba inativa - pausando tracking');
        pauseUsageTracking();
      } else {
        // Aba ficou ativa - retomar sessão
        console.log('📱 Aba ativa - retomando tracking');
        resumeUsageTracking();
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
      // Pausar sessão ao fechar
      if (isTrackingRef.current) {
        const token = localStorage.getItem('authToken');
        if (token) {
          // Usar sendBeacon para envio garantido ao fechar
          navigator.sendBeacon('/api/usage-session/pause', JSON.stringify({}));
        }
      }
    };

    const handleUnload = () => {
      // Backup para pausar sessão
      if (isTrackingRef.current) {
        const token = localStorage.getItem('authToken');
        if (token) {
          navigator.sendBeacon('/api/usage-session/pause', JSON.stringify({}));
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, []);

  // Detectar quando a página carrega/descarrega
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // Página foi carregada (incluindo volta do cache)
      if (isAuthenticated && user && !isTrackingRef.current) {
        console.log('🔄 Página carregada - iniciando/retomando tracking');
        resumeUsageTracking();
      }
    };

    const handlePageHide = () => {
      // Página vai ser descarregada
      console.log('👋 Página sendo descarregada - pausando tracking');
      pauseUsageTracking();
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);
    
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [isAuthenticated, user]);

  return {
    sessionId: sessionIdRef.current,
    isTracking: isTrackingRef.current,
    startUsageTracking,
    pauseUsageTracking,
    resumeUsageTracking,
    endUsageTracking,
  };
}
