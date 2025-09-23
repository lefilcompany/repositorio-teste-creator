import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';
import { getTeamUsageStats } from '@/lib/simple-usage-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyJWT(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Buscar usuário e seu team
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { team: true }
    });

    if (!user || !user.teamId) {
      return NextResponse.json({ error: 'Usuário não encontrado ou sem equipe' }, { status: 404 });
    }

    // Buscar estatísticas simplificadas
    const stats = await getTeamUsageStats(user.teamId);

    return NextResponse.json({
      teamId: user.teamId,
      teamName: user.team?.name,
      dailyUsage: stats.dailyUsage,
      monthlyUsage: stats.monthlyUsage,
      lastActivity: stats.lastActivity,
      simplified: true // Flag para indicar que é o sistema simplificado
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas de uso:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
