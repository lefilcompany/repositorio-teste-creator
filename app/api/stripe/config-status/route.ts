import { NextResponse } from 'next/server';
import { checkStripeConfiguration, getStripeConfigurationMessage } from '@/lib/stripe-config';

export async function GET() {
  try {
    const status = checkStripeConfiguration();
    const message = getStripeConfigurationMessage(status);

    return NextResponse.json({
      ...status,
      message
    });
  } catch (error) {
    console.error('Erro ao verificar configuração do Stripe:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}