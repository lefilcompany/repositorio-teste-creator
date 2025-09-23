/**
 * Utilitário para verificar se o Stripe está configurado corretamente
 */

export interface StripeConfigStatus {
  isConfigured: boolean;
  missingConfigs: string[];
  hasValidKeys: boolean;
  hasValidPriceIds: boolean;
}

export function checkStripeConfiguration(): StripeConfigStatus {
  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_BASIC',
    'STRIPE_PRICE_PRO', 
    // 'STRIPE_PRICE_ENTERPRISE' // Enterprise terá lógica diferente
  ];

  const missingConfigs: string[] = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingConfigs.push(envVar);
    }
  }

  const hasValidKeys = !!(
    process.env.STRIPE_SECRET_KEY?.startsWith('sk_') &&
    process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')
  );

  const hasValidPriceIds = !!(
    process.env.STRIPE_PRICE_BASIC?.startsWith('price_') &&
    process.env.STRIPE_PRICE_PRO?.startsWith('price_')
    // && process.env.STRIPE_PRICE_ENTERPRISE?.startsWith('price_') // Enterprise terá lógica diferente
  );

  const isConfigured = missingConfigs.length === 0 && hasValidKeys && hasValidPriceIds;

  return {
    isConfigured,
    missingConfigs,
    hasValidKeys,
    hasValidPriceIds
  };
}

export function getStripeConfigurationMessage(status: StripeConfigStatus): string {
  if (status.isConfigured) {
    return 'Stripe configurado corretamente';
  }

  const messages: string[] = [];
  
  if (status.missingConfigs.length > 0) {
    messages.push(`Variáveis ausentes: ${status.missingConfigs.join(', ')}`);
  }

  if (!status.hasValidKeys) {
    messages.push('Chaves do Stripe inválidas (devem começar com sk_ e whsec_)');
  }

  if (!status.hasValidPriceIds) {
    messages.push('Price IDs inválidos (devem começar com price_)');
  }

  return messages.join('. ');
}