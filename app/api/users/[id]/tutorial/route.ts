import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    // Obter token do header Authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de acesso não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let payload;
    
    try {
      payload = await verifyJWT(token);
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const requestUserId = payload.userId;
    const targetUserId = params.id;

    // Usuário só pode atualizar seu próprio status de tutorial
    if (requestUserId !== targetUserId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { tutorialCompleted } = await req.json();

    if (typeof tutorialCompleted !== 'boolean') {
      return NextResponse.json({ 
        error: 'tutorialCompleted deve ser um valor boolean' 
      }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: { tutorialCompleted },
      select: {
        id: true,
        tutorialCompleted: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erro ao atualizar status do tutorial:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
