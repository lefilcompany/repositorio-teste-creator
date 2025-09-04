import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request) {
  try {
    const { userId, teamId } = await req.json();

    console.log('Mark all as read request:', { userId, teamId });

    if (!userId || !teamId) {
      return NextResponse.json({ 
        error: 'userId e teamId são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se o usuário existe e pertence à equipe
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        teamId: teamId
      }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'Usuário não encontrado ou não pertence à equipe' 
      }, { status: 404 });
    }

    // Marcar todas as notificações não lidas do usuário como lidas
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        teamId,
        read: false
      },
      data: { read: true }
    });

    console.log(`Marked ${result.count} notifications as read for user ${userId}`);

    return NextResponse.json({ 
      success: true,
      count: result.count
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor ao marcar todas as notificações como lidas' 
    }, { status: 500 });
  }
}
