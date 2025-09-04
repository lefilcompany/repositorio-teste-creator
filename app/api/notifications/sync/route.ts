import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Verificar autenticação via JWT
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    const { notificationId } = await req.json();

    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId is required' }, { status: 400 });
    }

    // Buscar notificação do Prisma
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: user.userId,
        teamId: user.teamId
      },
      include: {
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Notificação encontrada e validada
    return NextResponse.json({ 
      success: true, 
      notification: {
        id: notification.id,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        createdAt: notification.createdAt,
        teamName: notification.team.name
      }
    });
  } catch (error) {
    console.error('Error syncing notification:', error);
    return NextResponse.json({ error: 'Failed to sync notification' }, { status: 500 });
  }
}
