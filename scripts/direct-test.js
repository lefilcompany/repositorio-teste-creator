// scripts/direct-test.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function directTest() {
  try {
    // Buscar o usuário e seu time
    const user = await prisma.user.findUnique({
      where: { id: 'cmfv1auf30000os94quodg0kd' },
      include: {
        team: true
      }
    });

    if (!user || !user.team) {
      console.log('❌ Usuário ou time não encontrado');
      return;
    }

    console.log('👤 Testando para usuário:', user.email);
    console.log('👥 Time ID:', user.teamId);

    // Testar a mesma lógica que está na subscription-utils
    console.log('📊 Testando lógica de detecção...');
    
    // Buscar assinações (incluindo trials expirados)
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { 
        teamId: user.teamId,
        OR: [
          { isActive: true },
          { status: 'TRIAL' },
          { status: 'EXPIRED' } // Incluir trials expirados
        ]
      },
      include: {
        plan: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    });
    
    const activeSubscription = activeSubscriptions.length > 0 ? activeSubscriptions[0] : null;
    
    if (activeSubscription) {
      console.log('📋 Subscription encontrada:');
      console.log('  Status:', activeSubscription.status);
      console.log('  isActive:', activeSubscription.isActive);
      console.log('  trialEndDate:', activeSubscription.trialEndDate);
      
      const now = new Date();
      const isTrial = activeSubscription.status === 'TRIAL' || activeSubscription.status === 'EXPIRED';
      
      if (isTrial && activeSubscription.trialEndDate) {
        const isTrialExpired = now > activeSubscription.trialEndDate;
        console.log('  É trial?', isTrial);
        console.log('  Expirou?', isTrialExpired);
        console.log('  Data atual:', now);
        console.log('  Data trial end:', activeSubscription.trialEndDate);
        
        if (isTrialExpired) {
          console.log('🚨 TRIAL EXPIRADO! Modal deve aparecer.');
          console.log('🎯 Condições do modal:');
          console.log('    isTrial:', isTrial);
          console.log('    isExpired:', isTrialExpired);
          console.log('    canAccess:', false);
          console.log('    Deve mostrar modal?', isTrial && isTrialExpired && !false);
        }
      }
    } else {
      console.log('❌ Nenhuma subscription encontrada');
    }

  } catch (error) {
    console.error('❌ Erro no teste direto:', error);
  } finally {
    await prisma.$disconnect();
  }
}

directTest();