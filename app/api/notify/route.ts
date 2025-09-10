import { NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId, title, body, type = 'SYSTEM' } = await req.json();
    
    if (!userId || !title) {
      return NextResponse.json({ 
        error: 'userId e title são obrigatórios' 
      }, { status: 400 });
    }

    // Buscar o teamId real do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true }
    });

    if (!user || !user.teamId) {
      return NextResponse.json({ 
        error: 'Usuário não encontrado ou não pertence a uma equipe' 
      }, { status: 404 });
    }

    const notification = await createNotification({
      userId,
      teamId: user.teamId,
      message: title,
      type: type as any
    });

    if (!notification) {
      return NextResponse.json({ 
        error: 'Falha ao criar notificação' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      notification 
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
