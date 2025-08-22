import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';

// Marcar como rota dinâmica devido ao uso de request.headers
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Verificar autenticação via JWT
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult; // Retorna erro de autenticação
    }
    
    const { user } = authResult;

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    
    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    // Verificar se o usuário pertence à equipe solicitada
    if (user.teamId !== teamId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const members = await prisma.user.findMany({
      where: { 
        teamId,
        status: 'ACTIVE' // Apenas usuários ativos fazem parte da equipe
      },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        phone: true, 
        state: true, 
        city: true,
        role: true,
        status: true
      },
    });
    
    return NextResponse.json(members);
  } catch (error) {
    console.error('Failed to fetch team members', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}
