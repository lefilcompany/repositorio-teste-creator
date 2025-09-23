// app/api/teams/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload, isTokenExpired } from '@/lib/jwt';
import { createTeamSubscription } from '@/lib/subscription-utils';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || isTokenExpired(token)) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
    }

    const payload = getTokenPayload(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Buscar usuário e verificar se é admin do time
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        adminTeams: true,
        team: true
      }
    });

    if (!user || !user.teamId) {
      return NextResponse.json({ error: 'Usuário não encontrado ou sem equipe' }, { status: 404 });
    }

    // Verificar se o usuário é admin do time
    const isAdmin = user.role === 'ADMIN' || user.adminTeams.some(t => t.id === user.teamId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Apenas administradores podem gerenciar assinaturas' }, { status: 403 });
    }

    // Obter dados da requisição
    const { planName } = await request.json();

    if (!planName) {
      return NextResponse.json({ error: 'Nome do plano é obrigatório' }, { status: 400 });
    }

    // Verificar se o plano existe
    const plan = await prisma.plan.findUnique({
      where: { name: planName }
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Plano não encontrado ou inativo' }, { status: 404 });
    }

    // Criar nova assinatura
    const subscription = await createTeamSubscription(user.teamId, planName);

    if (!subscription) {
      return NextResponse.json({ error: 'Erro ao criar assinatura' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Assinatura criada com sucesso',
      planName: plan.displayName,
      subscriptionId: subscription.id
    });

  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}