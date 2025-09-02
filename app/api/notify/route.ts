import { NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const { userId, title, body, type = 'TEST' } = await req.json();
    
    if (!userId || !title) {
      return NextResponse.json({ 
        error: 'userId e title são obrigatórios' 
      }, { status: 400 });
    }

    // Buscar teamId do usuário (simplificado para teste)
    const notification = await createNotification({
      userId,
      teamId: 'test-team-id', // Em produção, buscar do usuário
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
    console.error('Error creating test notification:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
