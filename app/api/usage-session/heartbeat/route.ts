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
        error: 'Nenhuma sessão ativa encontrada'
      }, { status: 404 });
    }

    // Atualizar a data da sessão para manter viva
    await prisma.usageSession.update({
      where: {
        id: activeSession.id
      },
      data: {
        date: new Date()
      }
    });

    return NextResponse.json({
      message: 'Sessão atualizada',
      sessionId: activeSession.id
    });

  } catch (error) {
    console.error('Erro ao atualizar sessão de uso:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
