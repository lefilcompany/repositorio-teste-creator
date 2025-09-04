import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId, teamId } = await req.json();
    const notificationId = params.id;

    console.log('Mark as read request:', { notificationId, userId, teamId });

    if (!userId || !teamId) {
      return NextResponse.json({ 
        error: 'userId e teamId são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se a notificação pertence ao usuário
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
        teamId
      }
    });

    if (!notification) {
      console.error('Notification not found:', { notificationId, userId, teamId });
      return NextResponse.json({ 
        error: 'Notificação não encontrada' 
      }, { status: 404 });
    }

    // Marcar como lida apenas se ainda não foi lida
    if (!notification.read) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true }
      });
      console.log('Notification marked as read:', notificationId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor ao marcar notificação como lida' 
    }, { status: 500 });
  }
}
