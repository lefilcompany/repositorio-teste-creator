// scripts/expire-trial.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function expireTrialForUser(userId) {
  try {
    // Buscar o usuário e seu time
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: {
          include: {
            subscriptions: {
              where: { isActive: true },
              orderBy: { createdAt: 'desc' },
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

    console.log('👤 Usuário encontrado:', user.email);
    console.log('👥 Time:', user.team.name);

    // Verificar se há trial ativo
    const activeSubscription = user.team.subscriptions[0];
    
    if (!activeSubscription || activeSubscription.status !== 'TRIAL') {
      console.log('❌ Nenhum trial ativo encontrado');
      return;
    }

    console.log('🕐 Trial atual termina em:', activeSubscription.trialEndDate);

    // Expirar o trial (definir data de expiração para ontem)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await prisma.subscription.update({
      where: { id: activeSubscription.id },
      data: {
        trialEndDate: yesterday
      }
    });

    console.log('✅ Trial expirado com sucesso!');
    console.log('🕐 Nova data de expiração:', yesterday);
    console.log('🎯 O modal deve aparecer na próxima verificação');

  } catch (error) {
    console.error('❌ Erro ao expirar trial:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se foi chamado diretamente
if (require.main === module) {
  const userId = process.argv[2];
  if (!userId) {
    console.log('❌ Uso: node expire-trial.js <USER_ID>');
    process.exit(1);
  }
  
  expireTrialForUser(userId);
}

module.exports = { expireTrialForUser };