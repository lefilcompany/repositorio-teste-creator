import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload, isTokenExpired } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { createTeamSubscription } from '@/lib/subscription-utils';
import { getStripeClient } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_URL || 'http://localhost:3000';
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || isTokenExpired(token)) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
    }

    const payload = getTokenPayload(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        team: true,
        adminTeams: true
      }
    });

    if (!user || !user.teamId) {
      return NextResponse.json({ error: 'Usuário não encontrado ou sem equipe' }, { status: 404 });
    }

    const isAdmin = user.role === 'ADMIN' || user.adminTeams.some(team => team.id === user.teamId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Apenas administradores podem gerenciar assinaturas' }, { status: 403 });
    }

    const { planId } = await request.json();
    if (!planId) {
      return NextResponse.json({ error: 'planId é obrigatório' }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Plano não encontrado ou inativo' }, { status: 404 });
    }

    if (plan.price <= 0) {
      const subscription = await createTeamSubscription(user.teamId, plan.name);

      if (!subscription) {
        return NextResponse.json({ error: 'Não foi possível ativar o plano gratuito' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Plano gratuito ativado com sucesso',
        subscriptionId: subscription.id
      });
    }

    if (!plan.stripePriceId) {
      return NextResponse.json({ error: 'Plano não está configurado para cobrança via Stripe' }, { status: 409 });
    }

    let stripe;
    try {
      stripe = getStripeClient();
    } catch (stripeError) {
      console.error('Stripe configuration error:', stripeError);
      return NextResponse.json({ error: 'Configuração da Stripe ausente' }, { status: 500 });
    }

    const baseUrl = getBaseUrl();
    const successUrlTemplate = process.env.STRIPE_SUCCESS_URL || `${baseUrl}/planos?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = process.env.STRIPE_CANCEL_URL || `${baseUrl}/planos?canceled=true`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1
        }
      ],
      success_url: successUrlTemplate,
      cancel_url: cancelUrl,
      metadata: {
        teamId: user.teamId,
        planId: plan.id,
        planName: plan.name,
        userId: user.id
      },
      subscription_data: {
        metadata: {
          teamId: user.teamId,
          planId: plan.id,
          planName: plan.name
        }
      }
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Não foi possível criar sessão de checkout' }, { status: 500 });
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Erro ao iniciar checkout da Stripe:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
