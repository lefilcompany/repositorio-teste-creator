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

    // Buscar a sessão mais recente do usuário (pausada) do dia atual
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pausedSession = await prisma.usageSession.findFirst({
      where: {
        userId: payload.userId,
        active: false,
        logoutTime: null,
        date: {
          gte: today
        }
      },
      orderBy: {
        loginTime: 'desc'
      }
    });

    if (pausedSession) {
      // Criar nova entrada para a sessão retomada
      const resumedSession = await prisma.usageSession.create({
        data: {
          userId: payload.userId,
          loginTime: new Date(),
          active: true,
          date: new Date(),
          sessionType: 'resumed'
        }
      });

      return NextResponse.json({
        sessionId: resumedSession.id,
        message: 'Sessão retomada',
        resumed: true
      });
    } else {
      // Não há sessão pausada, criar nova
      const newSession = await prisma.usageSession.create({
        data: {
          userId: payload.userId,
          loginTime: new Date(),
          active: true,
          date: new Date(),
          sessionType: 'normal'
        }
      });

      return NextResponse.json({
        sessionId: newSession.id,
        message: 'Nova sessão iniciada',
        resumed: false
      });
    }

  } catch (error) {
    console.error('Erro ao retomar sessão de uso:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
