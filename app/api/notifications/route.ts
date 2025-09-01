import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Verificar autenticação via JWT
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') || '5';
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (!user.teamId) {
      return NextResponse.json({ notifications: [] });
    }

    const whereClause: any = {
      userId: user.userId,
      teamId: user.teamId
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

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    // Verificar autenticação via JWT
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    const { notificationId, markAsRead } = await req.json();

    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId is required' }, { status: 400 });
    }

    // Verificar se a notificação pertence ao usuário
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: user.userId,
        teamId: user.teamId
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
