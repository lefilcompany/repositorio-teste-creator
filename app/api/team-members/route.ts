import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';

// Marcar como rota dinâmica devido ao uso de request.headers
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    console.log('🔄 [GET] /api/team-members - Início da requisição');
    
    // Verificar autenticação via JWT
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) {
      console.log('❌ [GET] /api/team-members - Falha na autenticação');
      return authResult; // Retorna erro de autenticação
    }
    
    const { user } = authResult;
    console.log('✅ [GET] /api/team-members - Usuário autenticado:', { userId: user.userId, userTeamId: user.teamId });

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    console.log('🔍 [GET] /api/team-members - TeamId solicitado:', teamId);
    
    if (!teamId) {
      console.log('❌ [GET] /api/team-members - TeamId não fornecido');
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    // Verificar se o usuário pertence à equipe solicitada
    if (user.teamId !== teamId) {
      console.log('❌ [GET] /api/team-members - Acesso negado', { userTeamId: user.teamId, requestedTeamId: teamId });
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    console.log('✅ [GET] /api/team-members - Verificação de acesso OK');

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
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}

