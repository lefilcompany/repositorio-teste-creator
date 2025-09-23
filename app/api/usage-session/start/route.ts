import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';
import { updateTeamUsage } from '@/lib/simple-usage-utils';

export async function POST(req: Request) {
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

    // Buscar usuário e team
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, teamId: true }
    });

    if (!user || !user.teamId) {
      return NextResponse.json({ error: 'Usuário não encontrado ou sem equipe' }, { status: 404 });
    }

    // Atualizar contadores simples do team
    await updateTeamUsage(user.teamId);

    return NextResponse.json({ 
      message: 'Uso registrado com sucesso',
      sessionId: `simplified-${Date.now()}`, // ID dummy para compatibilidade
      simplified: true 
    });

  } catch (error) {
    console.error('Erro ao registrar uso:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
