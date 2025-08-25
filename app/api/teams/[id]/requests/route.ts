import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';

// Marcar como rota dinâmica devido ao uso de request.headers
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação via JWT
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult; // Retorna erro de autenticação
    }
    
    const { user } = authResult;
    const teamId = params.id;

    // Verificar se o usuário pertence à equipe solicitada
    if (user.teamId !== teamId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Verificar se o usuário é admin da equipe
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { adminId: true }
    });

    if (!team || team.adminId !== user.userId) {
      return NextResponse.json({ error: 'Apenas administradores podem ver solicitações' }, { status: 403 });
    }
    
    const joinRequests = await prisma.joinRequest.findMany({
      where: { 
        teamId,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(joinRequests);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch join requests' }, { status: 500 });
  }
}
