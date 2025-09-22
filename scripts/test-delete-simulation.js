const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simulateDeleteAccount(userId) {
  try {
    console.log('\n🗑️ Simulando deleção da conta...');
    
    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        adminTeams: true,
        team: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    console.log('👤 Usuário encontrado:', user.email);
    console.log('👥 Admin de teams:', user.adminTeams.length);
    console.log('🏠 Team ID:', user.teamId);

    // Se o usuário é admin de uma equipe e não há outros membros
    if (user.adminTeams.length > 0) {
      const otherActiveMembers = await prisma.user.count({
        where: {
          teamId: user.adminTeams[0].id,
          status: 'ACTIVE',
          id: { not: userId }
        }
      });

      console.log('👥 Outros membros ativos:', otherActiveMembers);

      if (otherActiveMembers === 0) {
        console.log('🗑️ Deletando team e todas suas dependências...');
        const teamId = user.adminTeams[0].id;
        
        await prisma.$transaction(async (tx) => {
          // Deletar em ordem de dependências (foreign keys)
          
          console.log('  🗑️ Deletando personas...');
          const deletedPersonas = await tx.persona.deleteMany({
            where: { teamId }
          });
          console.log(`    ✅ ${deletedPersonas.count} personas deletadas`);
          
          console.log('  🗑️ Deletando themes...');
          const deletedThemes = await tx.strategicTheme.deleteMany({
            where: { teamId }
          });
          console.log(`    ✅ ${deletedThemes.count} themes deletados`);
          
          console.log('  🗑️ Deletando actions...');
          const deletedActions = await tx.action.deleteMany({
            where: { teamId: teamId }
          });
          console.log(`    ✅ ${deletedActions.count} actions deletadas`);
          
          console.log('  🗑️ Deletando brands...');
          const deletedBrands = await tx.brand.deleteMany({
            where: { teamId }
          });
          console.log(`    ✅ ${deletedBrands.count} brands deletadas`);
          
          console.log('  🗑️ Deletando notificações...');
          const deletedNotifications = await tx.notification.deleteMany({
            where: { teamId: teamId }
          });
          console.log(`    ✅ ${deletedNotifications.count} notificações deletadas`);
          
          console.log('  🗑️ Deletando join requests...');
          const deletedJoinRequests = await tx.joinRequest.deleteMany({
            where: { teamId }
          });
          console.log(`    ✅ ${deletedJoinRequests.count} join requests deletados`);
          
          console.log('  🗑️ Deletando subscriptions...');
          const deletedSubscriptions = await tx.subscription.deleteMany({
            where: { teamId }
          });
          console.log(`    ✅ ${deletedSubscriptions.count} subscriptions deletadas`);
          
          console.log('  🗑️ Deletando team...');
          await tx.team.delete({
            where: { id: teamId }
          });
          console.log(`    ✅ Team deletado`);
        }, {
          maxWait: 30000,
          timeout: 30000,
        });
        
        console.log('✅ Team e dependências deletados com sucesso!');
      }
    }

    // Finalmente, deletar o usuário
    console.log('🗑️ Deletando usuário...');
    await prisma.user.delete({
      where: { id: userId }
    });
    console.log('✅ Usuário deletado com sucesso!');

    return true;

  } catch (error) {
    console.error('❌ Erro ao deletar conta:', error.message);
    console.error('📋 Stack:', error.stack);
    return false;
  }
}

async function createTestUser() {
  try {
    console.log('🔧 Criando usuário de teste...');
    
    // Criar plano FREE se não existir
    let freePlan = await prisma.plan.findFirst({ where: { name: 'FREE' } });
    if (!freePlan) {
      freePlan = await prisma.plan.create({
        data: {
          name: 'FREE',
          displayName: 'Plano Free',
          price: 0.0,
          trialDays: 7,
          maxMembers: 5,
          maxBrands: 2,
          maxStrategicThemes: 5,
          maxPersonas: 5,
          quickContentCreations: 10,
          customContentSuggestions: 5,
          contentPlans: 3,
          contentReviews: 3,
          isActive: true
        }
      });
      console.log('✅ Plano FREE criado');
    }

    // Primeiro criar usuário sem team
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test_delete_' + Date.now() + '@test.com',
        password: 'hashedpassword',
        role: 'WITHOUT_TEAM',
        status: 'NO_TEAM'
      }
    });

    // Criar team de teste com o usuário como admin
    const testTeam = await prisma.team.create({
      data: {
        name: 'Test Team',
        code: 'TEST_' + Date.now(),
        displayCode: 'TEST',
        adminId: testUser.id,
        credits: { amount: 0 },
        currentPlanId: freePlan.id,
        isTrialActive: true,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Atualizar o usuário para fazer parte do team
    await prisma.user.update({
      where: { id: testUser.id },
      data: { 
        teamId: testTeam.id,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    // Criar subscription de teste
    await prisma.subscription.create({
      data: {
        teamId: testTeam.id,
        planId: freePlan.id,
        status: 'TRIAL',
        startDate: new Date(),
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    });

    // Criar algumas entidades relacionadas para testar a deleção
    const brand = await prisma.brand.create({
      data: {
        teamId: testTeam.id,
        userId: testUser.id,
        name: 'Test Brand',
        responsible: 'Test User',
        segment: 'Test',
        values: 'Test values',
        keywords: 'test, keywords',
        goals: 'Test goals',
        inspirations: 'Test inspirations',
        successMetrics: 'Test metrics',
        references: 'Test references',
        specialDates: 'Test dates',
        promise: 'Test promise',
        crisisInfo: 'Test crisis',
        milestones: 'Test milestones',
        collaborations: 'Test collaborations',
        restrictions: 'Test restrictions'
      }
    });

    // Criar persona
    await prisma.persona.create({
      data: {
        teamId: testTeam.id,
        userId: testUser.id,
        brandId: brand.id,
        name: 'Test Persona',
        gender: 'Test',
        age: '25-35',
        location: 'Test City',
        professionalContext: 'Test role',
        beliefsAndInterests: 'Test hobbies',
        contentConsumptionRoutine: 'Test habits',
        mainGoal: 'Test goals',
        challenges: 'Test challenges'
      }
    });

    // Criar tema estratégico
    await prisma.strategicTheme.create({
      data: {
        teamId: testTeam.id,
        userId: testUser.id,
        brandId: brand.id,
        title: 'Test Theme',
        description: 'Test description',
        colorPalette: 'Test colors',
        toneOfVoice: 'Test tone',
        targetAudience: 'Test audience',
        hashtags: 'Test hashtags',
        objectives: 'Test objectives',
        contentFormat: 'Test format',
        macroThemes: 'Test macro themes',
        bestFormats: 'Test formats',
        platforms: 'Test platforms',
        expectedAction: 'Test action',
        additionalInfo: 'Test info'
      }
    });

    // Criar notificação
    await prisma.notification.create({
      data: {
        message: 'Test notification',
        type: 'INFO',
        userId: testUser.id,
        teamId: testTeam.id,
        read: false
      }
    });

    console.log('✅ Usuário de teste criado:');
    console.log('📧 Email:', testUser.email);
    console.log('🆔 User ID:', testUser.id);
    console.log('👥 Team ID:', testTeam.id);

    return { ...testUser, teamId: testTeam.id };

  } catch (error) {
    console.error('❌ Erro ao criar usuário de teste:', error);
    throw error;
  }
}

async function verifyDeletion(userId, teamId) {
  try {
    console.log('\n🔍 Verificando se a deleção foi completa...');
    
    // Verificar se o usuário foi deletado
    const user = await prisma.user.findUnique({ where: { id: userId } });
    console.log('👤 Usuário existe?', user ? '❌ SIM' : '✅ NÃO');
    
    // Verificar se o team foi deletado
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    console.log('👥 Team existe?', team ? '❌ SIM' : '✅ NÃO');
    
    // Verificar se as subscriptions foram deletadas
    const subscriptions = await prisma.subscription.findMany({ where: { teamId } });
    console.log('📋 Subscriptions existem?', subscriptions.length > 0 ? '❌ SIM' : '✅ NÃO');
    
    // Verificar se as brands foram deletadas
    const brands = await prisma.brand.findMany({ where: { teamId } });
    console.log('🏢 Brands existem?', brands.length > 0 ? '❌ SIM' : '✅ NÃO');
    
    // Verificar se as personas foram deletadas
    const personas = await prisma.persona.findMany({ where: { teamId } });
    console.log('👤 Personas existem?', personas.length > 0 ? '❌ SIM' : '✅ NÃO');
    
    // Verificar se os themes foram deletados
    const themes = await prisma.strategicTheme.findMany({ where: { teamId } });
    console.log('🎯 Themes existem?', themes.length > 0 ? '❌ SIM' : '✅ NÃO');
    
    // Verificar se as notificações foram deletadas
    const notifications = await prisma.notification.findMany({ where: { teamId } });
    console.log('🔔 Notifications existem?', notifications.length > 0 ? '❌ SIM' : '✅ NÃO');
    
    const allDeleted = !user && !team && subscriptions.length === 0 && 
                      brands.length === 0 && personas.length === 0 && 
                      themes.length === 0 && notifications.length === 0;
    
    console.log('\n🎯 RESULTADO FINAL:', allDeleted ? '✅ SUCESSO TOTAL' : '❌ FALHOU');
    
    return allDeleted;

  } catch (error) {
    console.error('❌ Erro ao verificar deleção:', error);
    return false;
  }
}

async function main() {
  try {
    const testUser = await createTestUser();
    
    const success = await simulateDeleteAccount(testUser.id);
    
    if (success) {
      await verifyDeletion(testUser.id, testUser.teamId);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();