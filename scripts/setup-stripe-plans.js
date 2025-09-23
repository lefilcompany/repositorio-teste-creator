/**
 * Script para atualizar os planos com os Price IDs do Stripe
 * Execute após configurar as variáveis de ambiente do Stripe
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updatePlansWithStripeIds() {
  console.log('🔄 Atualizando planos com Price IDs do Stripe...');
  
  const {
    STRIPE_PRICE_BASIC,
    STRIPE_PRICE_PRO,
    // STRIPE_PRICE_ENTERPRISE, // Enterprise terá lógica diferente
  } = process.env;

  // Validar se as variáveis existem
  if (!STRIPE_PRICE_BASIC || !STRIPE_PRICE_PRO) {
    console.error('❌ Variáveis de ambiente do Stripe não configuradas!');
    console.log('Configure as seguintes variáveis no .env:');
    console.log('- STRIPE_PRICE_BASIC');
    console.log('- STRIPE_PRICE_PRO');
    // console.log('- STRIPE_PRICE_ENTERPRISE (será implementado posteriormente)');
    return;
  }

  try {
    // Atualizar plano BASIC
    const basicPlan = await prisma.plan.update({
      where: { name: 'BASIC' },
      data: { stripePriceId: STRIPE_PRICE_BASIC }
    });
    console.log(`✅ Plano BASIC atualizado: ${basicPlan.displayName}`);

    // Atualizar plano PRO
    const proPlan = await prisma.plan.update({
      where: { name: 'PRO' },
      data: { stripePriceId: STRIPE_PRICE_PRO }
    });
    console.log(`✅ Plano PRO atualizado: ${proPlan.displayName}`);

    // Enterprise terá lógica diferente - não atualizar por enquanto
    console.log('ℹ️  Plano ENTERPRISE não atualizado - terá lógica diferente');

    console.log('🎉 Planos BASIC e PRO foram atualizados com sucesso!');
    
    // Mostrar status final
    const allPlans = await prisma.plan.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log('📋 Status dos planos:');
    allPlans.forEach(plan => {
      console.log(`- ${plan.name}: ${plan.stripePriceId || 'SEM PRICE ID'}`);
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar planos:', error);
  }
}

async function main() {
  await updatePlansWithStripeIds();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });