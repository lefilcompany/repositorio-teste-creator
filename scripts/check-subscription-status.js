// scripts/check-subscription-status.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSubscriptionStatus(userId) {
  try {
    // Buscar o usuário e seu time
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: {
          include: {
            currentPlan: true,
            subscriptions: {
              include: {
                plan: true
              },
              where: {
                OR: [
                  { isActive: true },
                  { status: 'TRIAL' },
                  { status: 'EXPIRED' }
                ]
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        }
      }
    });

    if (!user || !user.team) {
      console.log('❌ Usuário ou time não encontrado');
      return;
    }

    console.log('📊 ESTADO ATUAL DA ASSINATURA');
    console.log('='.repeat(50));
    console.log('👤 Usuário:', user.email);
    console.log('👥 Time:', user.team.name);
    console.log('🎯 Plano Atual:', user.team.currentPlan?.displayName || 'Nenhum');
    
    const activeSubscription = user.team.subscriptions[0];
    
    if (activeSubscription) {
      console.log('📋 Assinatura Ativa:');
      console.log('   Status:', activeSubscription.status);
      console.log('   Plano:', activeSubscription.plan.displayName);
      console.log('   Trial End Date:', activeSubscription.trialEndDate);
      console.log('   É Trial?', activeSubscription.status === 'TRIAL');
      
      const now = new Date();
      const isExpired = activeSubscription.trialEndDate && now > activeSubscription.trialEndDate;
      console.log('   Expirou?', isExpired);
      
      if (isExpired) {
        console.log('🚨 TRIAL EXPIRADO! Modal deve aparecer.');
      } else {
        console.log('✅ Trial ainda ativo.');
      }
    } else {
      console.log('❌ Nenhuma assinatura ativa');
    }

    // Simular a lógica do modal
    console.log('');
    console.log('🎯 LÓGICA DO MODAL:');
    console.log('='.repeat(30));
    
    const isTrial = activeSubscription?.status === 'TRIAL' || activeSubscription?.status === 'EXPIRED';
    const isExpired = activeSubscription?.trialEndDate && new Date() > activeSubscription.trialEndDate;
    const canAccess = !(isTrial && isExpired);
    
    console.log('isTrial:', isTrial);
    console.log('isExpired:', isExpired);
    console.log('canAccess:', canAccess);
    console.log('Deve mostrar modal?', isTrial && isExpired && !canAccess);

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se foi chamado diretamente
if (require.main === module) {
  const userId = process.argv[2];
  if (!userId) {
    console.log('❌ Uso: node check-subscription-status.js <USER_ID>');
    process.exit(1);
  }
  
  checkSubscriptionStatus(userId);
}

module.exports = { checkSubscriptionStatus };