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

    // Verificar se existe uma sessão ativa para o usuário
    const activeSession = await prisma.usageSession.findFirst({
      where: {
        userId: payload.userId,
        active: true,
        logoutTime: null
      }
    });

    // Se já existe uma sessão ativa, retornar ela
    if (activeSession) {
      return NextResponse.json({ 
        sessionId: activeSession.id,
        message: 'Sessão ativa encontrada'
      });
    }

    // Criar nova sessão
    const session = await prisma.usageSession.create({
      data: {
        userId: payload.userId,
        loginTime: new Date(),
        active: true,
        date: new Date()
      }
    });

    return NextResponse.json({
      sessionId: session.id,
      message: 'Sessão de uso iniciada'
    });

  } catch (error) {
    console.error('Erro ao iniciar sessão de uso:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
