import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Buscar sessões ativas há mais de 2 horas (possível problema)
    const cutoffTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 horas atrás
    
    const orphanedSessions = await prisma.usageSession.findMany({
      where: {
        active: true,
        logoutTime: null,
        loginTime: {
          lt: cutoffTime
        }
      }
    });

    let cleanedCount = 0;

    if (orphanedSessions.length > 0) {
      const logoutTime = new Date();
      
      for (const session of orphanedSessions) {
        // Calcular duração máxima de 2 horas para sessões órfãs
        const maxDuration = 2 * 60 * 60; // 2 horas em segundos
        
        await prisma.usageSession.update({
          where: { id: session.id },
          data: {
            logoutTime,
            duration: maxDuration,
            active: false
          }
        });
        
        cleanedCount++;
      }
    }

    return NextResponse.json({
      message: `Cleanup concluído: ${cleanedCount} sessões órfãs foram finalizadas`,
      cleanedSessions: cleanedCount
    });

  } catch (error) {
    console.error('Erro no cleanup de sessões:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
