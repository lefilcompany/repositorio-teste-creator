// Script para inicializar contadores das equipes
// Execute este arquivo apenas uma vez após a migração

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeCounters() {
  console.log('🚀 Iniciando inicialização dos contadores...');
  
  try {
    // Buscar todas as equipes
    const teams = await prisma.team.findMany({
      select: { id: true, name: true }
    });

    console.log(`📊 Encontradas ${teams.length} equipes para processar`);

    const results = [];
    for (const team of teams) {
      console.log(`⚙️  Processando equipe: ${team.name} (${team.id})`);
      
      // Contar conteúdos aprovados
      const totalContents = await prisma.action.count({
        where: {
          teamId: team.id,
          approved: true
        }
      });

      // Contar marcas ativas
      const totalBrands = await prisma.brand.count({
        where: {
          teamId: team.id
        }
      });

      // Atualizar contadores usando raw SQL
      await prisma.$executeRaw`
        UPDATE "Team" 
        SET "totalContents" = ${totalContents}, "totalBrands" = ${totalBrands}
        WHERE id = ${team.id}
      `;

      results.push({ 
        teamId: team.id, 
        teamName: team.name,
        totalContents, 
        totalBrands 
      });

      console.log(`✅ ${team.name}: ${totalContents} conteúdos, ${totalBrands} marcas`);
    }

    console.log('\n📈 Resumo da inicialização:');
    console.table(results);

    console.log('\n🎉 Inicialização concluída com sucesso!');
    
    // Verificar se os dados foram realmente salvos
    console.log('\n🔍 Verificando dados salvos...');
    const verification = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        totalContents: true,
        totalBrands: true
      }
    });
    
    console.table(verification);

  } catch (error) {
    console.error('❌ Erro durante a inicialização:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar automaticamente
initializeCounters();

export { initializeCounters };
