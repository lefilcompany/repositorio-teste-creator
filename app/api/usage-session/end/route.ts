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
    const duration = Math.floor((logoutTime.getTime() - activeSession.loginTime.getTime()) / 1000);

    // Atualizar sessão com logout time e duração
    const updatedSession = await prisma.usageSession.update({
      where: {
        id: activeSession.id
      },
      data: {
        logoutTime,
        duration,
        active: false
      }
    });

    return NextResponse.json({
      sessionId: updatedSession.id,
      duration,
      message: 'Sessão de uso finalizada'
    });

  } catch (error) {
    console.error('Erro ao finalizar sessão de uso:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
