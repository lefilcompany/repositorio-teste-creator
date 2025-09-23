import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient, getStripeWebhookSecret } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { createTeamSubscription, updateTeamPlan } from '@/lib/subscription-utils';
import { SubscriptionStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'trialing':
      return 'TRIAL';
    case 'active':
      return 'ACTIVE';
    case 'canceled':
      return 'CANCELED';
    case 'incomplete':
    case 'incomplete_expired':
    case 'past_due':
    case 'unpaid':
      return 'PAYMENT_PENDING';
    default:
      return 'ACTIVE';
  }
}

async function syncSubscriptionFromStripe(
  stripeSubscription: Stripe.Subscription,
  checkoutSessionId?: string
) {
  const metadata = stripeSubscription.metadata || {};
  const teamId = metadata.teamId;
  const planId = metadata.planId;

  if (!teamId || !planId) {
    console.warn('Assinatura Stripe sem metadata de teamId/planId.');
    return;
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    console.error('Plano associado à assinatura não encontrado:', planId);
    return;
  }

  const status = mapStripeStatus(stripeSubscription.status);
  const isActive = status !== 'CANCELED' && status !== 'EXPIRED' && status !== 'PAYMENT_PENDING';
  const currentPeriodEnd = stripeSubscription.current_period_end
    ? new Date(stripeSubscription.current_period_end * 1000)
    : null;
  const trialEndDate = stripeSubscription.trial_end
    ? new Date(stripeSubscription.trial_end * 1000)
    : null;
  const stripeCustomerId = typeof stripeSubscription.customer === 'string'
    ? stripeSubscription.customer
    : stripeSubscription.customer?.id || null;
  const priceId = stripeSubscription.items.data[0]?.price?.id || plan.stripePriceId || null;

  const existing = await prisma.subscription.findFirst({
    where: {
      OR: [
        { stripeSubscriptionId: stripeSubscription.id },
        checkoutSessionId ? { stripeCheckoutSessionId: checkoutSessionId } : undefined
      ].filter(Boolean) as any
    }
  });

  if (!existing) {
    await createTeamSubscription(teamId, plan.name, {
      status,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId,
      stripeCheckoutSessionId: checkoutSessionId,
      stripePriceId: priceId,
      currentPeriodEnd,
      trialEndDate
    });
    return;
  }

  await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      status,
      endDate: currentPeriodEnd ?? existing.endDate,
      trialEndDate: trialEndDate ?? null,
      isActive,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: stripeCustomerId || existing.stripeCustomerId || undefined,
      stripeCheckoutSessionId: checkoutSessionId || existing.stripeCheckoutSessionId || undefined,
      stripePriceId: priceId || existing.stripePriceId || undefined,
      canceledAt: status === 'CANCELED' ? new Date() : existing.canceledAt
    }
  });

  await prisma.team.update({
    where: { id: teamId },
    data: {
      isTrialActive: status === 'TRIAL',
      trialEndsAt: trialEndDate ?? null
    }
  });

  if (isActive) {
    await updateTeamPlan(teamId, plan.id);
  } else if (status === 'CANCELED' || status === 'EXPIRED') {
    const freePlan = await prisma.plan.findFirst({ where: { name: 'FREE' } });
    if (freePlan) {
      await updateTeamPlan(teamId, freePlan.id);
    }
  }
}

async function handleCheckoutSessionCompleted(stripe: Stripe, session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  const teamId = metadata.teamId;
  const planId = metadata.planId;

  if (!teamId || !planId) {
    console.warn('Checkout concluído sem metadata de teamId/planId.');
    return;
  }

  const existing = await prisma.subscription.findFirst({
    where: {
      OR: [
        { stripeCheckoutSessionId: session.id },
        typeof session.subscription === 'string'
          ? { stripeSubscriptionId: session.subscription }
          : undefined
      ].filter(Boolean) as any
    }
  });

  if (existing) {
    return;
  }

  if (session.subscription) {
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription.id;

    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    await syncSubscriptionFromStripe(stripeSubscription, session.id);
    return;
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    console.error('Plano associado ao checkout não encontrado:', planId);
    return;
  }

  await createTeamSubscription(teamId, plan.name, {
    status: 'ACTIVE',
    stripeCheckoutSessionId: session.id,
    stripeCustomerId: typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id || null,
    stripePriceId: plan.stripePriceId || null
  });
}

export async function POST(request: NextRequest) {
  let stripe: Stripe;
  try {
    stripe = getStripeClient();
  } catch (error) {
    console.error('Stripe client error:', error);
    return NextResponse.json({ error: 'Stripe não configurado' }, { status: 500 });
  }

  let webhookSecret: string;
  try {
    webhookSecret = getStripeWebhookSecret();
  } catch (error) {
    console.error('Stripe webhook secret error:', error);
    return NextResponse.json({ error: 'Webhook secret não configurado' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 400 });
  }

  let event: Stripe.Event;
  const payload = await request.text();

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Erro ao validar webhook Stripe:', err);
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(stripe, event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscriptionFromStripe(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscriptionId = typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription.id;
          const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscriptionFromStripe(stripeSubscription);
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error('Erro ao processar webhook Stripe:', error);
    return NextResponse.json({ error: 'Erro ao processar evento' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
