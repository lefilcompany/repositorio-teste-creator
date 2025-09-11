import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyJWT(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Buscar sessão ativa do usuário
    const activeSession = await prisma.usageSession.findFirst({
      where: {
        userId: payload.userId,
        active: true,
        logoutTime: null
      }
    });

    if (!activeSession) {
      return NextResponse.json({ 
        message: 'Nenhuma sessão ativa encontrada'
      });
    }

    const logoutTime = new Date();
    const currentSegmentDuration = Math.floor((logoutTime.getTime() - activeSession.loginTime.getTime()) / 1000);
    const totalSessionTime = (activeSession.totalTime || 0) + currentSegmentDuration;

    // Atualizar sessão atual com logout
    const updatedSession = await prisma.usageSession.update({
      where: {
        id: activeSession.id
      },
      data: {
        logoutTime,
        duration: currentSegmentDuration,
        totalTime: totalSessionTime,
        active: false,
        sessionType: 'ended'
      }
    });

    // Se esta sessão tem um parentId (foi retomada), atualizar todas as sessões relacionadas
    if (activeSession.parentId) {
      // Buscar todas as sessões do mesmo dia/usuário que fazem parte desta sessão completa
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const relatedSessions = await prisma.usageSession.findMany({
        where: {
          userId: payload.userId,
          date: {
            gte: today
          },
          OR: [
            { id: activeSession.parentId },
            { parentId: activeSession.parentId },
            { parentId: activeSession.id }
          ]
        }
      });

      // Atualizar todas as sessões relacionadas com o tempo total final
      for (const session of relatedSessions) {
        await prisma.usageSession.update({
          where: { id: session.id },
          data: { totalTime: totalSessionTime }
        });
      }
    }

    return NextResponse.json({
      sessionId: updatedSession.id,
      duration: currentSegmentDuration,
      totalTime: totalSessionTime,
      message: 'Sessão de uso finalizada'
    });

  } catch (error) {
    console.error('Erro ao finalizar sessão de uso:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
