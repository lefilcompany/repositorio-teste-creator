// scripts/reactivate-trial.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function reactivateTrialForUser(userId) {
  try {
    // Buscar o usuário e seu time
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: {
          include: {
            subscriptions: {
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

    // Verificar se há subscription expirada
    const lastSubscription = user.team.subscriptions[0];
    
    if (!lastSubscription) {
      console.log('❌ Nenhuma subscription encontrada');
      return;
    }

    console.log('📋 Subscription encontrada:', lastSubscription.status);

    // Reativar e definir como trial expirado
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await prisma.subscription.update({
      where: { id: lastSubscription.id },
      data: {
        status: 'TRIAL',
        isActive: true,
        trialEndDate: yesterday
      }
    });

    console.log('✅ Trial reativado como expirado!');
    console.log('🕐 Data de expiração:', yesterday);
    console.log('🎯 Modal deve aparecer agora');

  } catch (error) {
    console.error('❌ Erro ao reativar trial:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se foi chamado diretamente
if (require.main === module) {
  const userId = process.argv[2];
  if (!userId) {
    console.log('❌ Uso: node reactivate-trial.js <USER_ID>');
    process.exit(1);
  }
  
  reactivateTrialForUser(userId);
}

module.exports = { reactivateTrialForUser };