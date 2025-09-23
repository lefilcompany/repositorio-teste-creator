// scripts/debug-database.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugDatabase() {
  try {
    console.log('🔍 INVESTIGAÇÃO COMPLETA DO BANCO');
    console.log('='.repeat(50));

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: 'cmfv1auf30000os94quodg0kd' }
    });

    console.log('👤 Usuário:', user?.email);
    console.log('👥 Time ID:', user?.teamId);

    if (!user?.teamId) {
      console.log('❌ Usuário sem team');
      return;
    }

    // Buscar TODAS as subscriptions do time (ativas e inativas)
    console.log('\n📋 TODAS AS SUBSCRIPTIONS DO TIME:');
    const allSubscriptions = await prisma.subscription.findMany({
      where: { teamId: user.teamId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' }
    });

    if (allSubscriptions.length === 0) {
      console.log('❌ Nenhuma subscription encontrada no time');
    } else {
      allSubscriptions.forEach((sub, index) => {
        console.log(`${index + 1}. Subscription ${sub.id}:`);
        console.log(`   Status: ${sub.status}`);
        console.log(`   isActive: ${sub.isActive}`);
        console.log(`   Plano: ${sub.plan.displayName}`);
        console.log(`   Trial End: ${sub.trialEndDate}`);
        console.log(`   Criado em: ${sub.createdAt}`);
        console.log(`   Atualizado em: ${sub.updatedAt}`);
        console.log('   ---');
      });
    }

    // Verificar team
    console.log('\n🏢 DADOS DO TEAM:');
    const team = await prisma.team.findUnique({
      where: { id: user.teamId },
      include: { currentPlan: true }
    });

    console.log('Nome:', team?.name);
    console.log('Plano Atual:', team?.currentPlan?.displayName);
    console.log('Trial Ativo:', team?.isTrialActive);

    // Buscar usando a query modificada
    console.log('\n🔍 QUERY MODIFICADA (OR):');
    const modifiedQuery = await prisma.subscription.findMany({
      where: { 
        teamId: user.teamId,
        OR: [
          { isActive: true },
          { status: 'TRIAL' }
        ]
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    if (modifiedQuery.length > 0) {
      const sub = modifiedQuery[0];
      console.log('✅ Encontrou subscription:');
      console.log(`   Status: ${sub.status}`);
      console.log(`   isActive: ${sub.isActive}`);
      console.log(`   Trial End: ${sub.trialEndDate}`);
      
      const now = new Date();
      const isExpired = sub.trialEndDate && now > sub.trialEndDate;
      console.log(`   Expirou? ${isExpired}`);
    } else {
      console.log('❌ Query modificada não encontrou nada');
    }

  } catch (error) {
    console.error('❌ Erro ao investigar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDatabase();