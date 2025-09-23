const { PrismaClient } = require('@prisma/client');

async function clearCreditsColumn() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧹 Limpando coluna credits antes de remover...');
    
    // Definir credits como null para todos os teams
    const result = await prisma.team.updateMany({
      data: {
        credits: null
      }
    });
    
    console.log(`✅ ${result.count} teams atualizados - credits definidos como null`);
    
  } catch (error) {
    console.error('❌ Erro ao limpar credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearCreditsColumn();