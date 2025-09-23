import Stripe from 'stripe';

const apiVersion: Stripe.LatestApiVersion = '2024-06-20';

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY não está configurada.');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, { apiVersion });
  }

  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET não está configurada.');
  }

  return secret;
}
