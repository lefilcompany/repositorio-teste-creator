import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit') || '10';
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    console.log('Notifications API called with params:', { teamId, userId, limit, unreadOnly });

    if (!teamId || !userId) {
      console.error('Missing required parameters:', { teamId, userId });
      return NextResponse.json({ 
        error: 'teamId e userId são obrigatórios',
        notifications: []
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
      console.error('User not found or not in team:', { userId, teamId });
      return NextResponse.json({ 
        error: 'Usuário não encontrado ou não pertence à equipe',
        notifications: []
      }, { status: 404 });
    }

    const whereClause: any = {
      userId,
      teamId
    };

    if (unreadOnly) {
      whereClause.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit, 10),
      include: {
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`Found ${notifications.length} notifications for user ${userId}`);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor ao carregar notificações',
      notifications: []
    }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { notificationId, markAsRead, userId, teamId } = await req.json();

    if (!notificationId || !userId || !teamId) {
      return NextResponse.json({ error: 'notificationId, userId and teamId are required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Marcar como lida
    if (markAsRead) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
