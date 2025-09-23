// scripts/list-users.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
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
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log('📋 Usuários encontrados:');
    console.log('='.repeat(50));

    users.forEach((user, index) => {
      const subscription = user.team?.subscriptions[0];
      
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Nome: ${user.name || 'N/A'}`);
      console.log(`   Time: ${user.team?.name || 'Sem time'}`);
      
      if (subscription) {
        console.log(`   Status: ${subscription.status}`);
        console.log(`   Trial termina: ${subscription.trialEndDate}`);
      } else {
        console.log(`   Sem assinatura ativa`);
      }
      
      console.log('-'.repeat(30));
    });

  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();