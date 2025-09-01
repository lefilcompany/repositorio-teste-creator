import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // Sincronizar com Supabase para Realtime
    const { error: supabaseError } = await supabase
      .from('notifications')
      .insert({
        id: notification.id,
        user_id: notification.userId,
        message: notification.message,
        type: notification.type,
        read_at: notification.read ? new Date().toISOString() : null,
        created_at: notification.createdAt.toISOString(),
        team_name: notification.team.name,
        metadata: {
          teamId: notification.teamId,
          teamName: notification.team.name
        }
      });

    if (supabaseError) {
      console.error('Supabase sync error:', supabaseError);
      // Não falhar se o Supabase não estiver disponível
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing notification:', error);
    return NextResponse.json({ error: 'Failed to sync notification' }, { status: 500 });
  }
}
