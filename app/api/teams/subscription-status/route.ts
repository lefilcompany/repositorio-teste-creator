// app/api/teams/subscription-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload, isTokenExpired } from '@/lib/jwt';
import { getTeamSubscriptionStatus, updateExpiredSubscriptions } from '@/lib/subscription-utils';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Buscar usuário e seu time
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        team: true
      }
    });

    if (!user || !user.teamId) {
      return NextResponse.json({ 
        error: 'Usuário não encontrado ou sem equipe',
        canAccess: false,
        isExpired: true
      }, { status: 404 });
    }

    // Força atualização de assinaturas expiradas primeiro
    await updateExpiredSubscriptions();

    // Verificar status da assinatura
    const subscriptionStatus = await getTeamSubscriptionStatus(user.teamId);

    return NextResponse.json({
      ...subscriptionStatus,
      teamId: user.teamId,
      teamName: user.team?.name
    });

  } catch (error: any) {
    console.error('Erro ao verificar status da assinatura:', error);
    
    // Verificar se é erro de conexão para retornar status diferente
    const isConnectionError = 
      error.message?.includes("Can't reach database server") ||
      error.message?.includes("Connection timeout");
    
    return NextResponse.json({ 
      error: isConnectionError ? 'Problema temporário de conexão' : 'Erro interno do servidor',
      canAccess: false,
      isExpired: true,
      retryAfter: isConnectionError ? 30 : undefined // Sugerir retry em 30s para erros de conexão
    }, { 
      status: isConnectionError ? 503 : 500 // Service Unavailable para problemas de conexão
    });
  }
}