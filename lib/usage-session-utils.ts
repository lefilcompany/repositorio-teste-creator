// lib/usage-session-utils.ts
import { prisma } from '@/lib/prisma';

export async function endSessionOnTokenExpiry(userId: string) {
  try {
    // Buscar todas as sessões ativas do usuário
    const activeSessions = await prisma.usageSession.findMany({
      where: {
        userId,
        active: true,
        logoutTime: null
      }
    });

    if (activeSessions.length === 0) {
      return { message: 'Nenhuma sessão ativa encontrada', sessionsEnded: 0 };
    }

    const logoutTime = new Date();
    let sessionsEnded = 0;

    // Finalizar todas as sessões ativas
    for (const session of activeSessions) {
      const duration = Math.floor((logoutTime.getTime() - session.loginTime.getTime()) / 1000);
      
      await prisma.usageSession.update({
        where: { id: session.id },
        data: {
          logoutTime,
          duration,
          active: false,
          sessionType: 'expired' // Marcamos como expirada
        }
      });
      
      sessionsEnded++;
    }

    console.log(`🔐 Token expirado - ${sessionsEnded} sessão(ões) finalizada(s) para usuário ${userId}`);
    
    return { 
      message: 'Sessões finalizadas devido à expiração do token',
      sessionsEnded,
      logoutTime 
    };

  } catch (error) {
    console.error('Erro ao finalizar sessões por expiração de token:', error);
    throw error;
  }
}