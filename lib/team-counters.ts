import { prisma } from '@/lib/prisma';

/**
 * Incrementa o contador de conteúdos de uma equipe
 * @param teamId ID da equipe
 * @param increment Valor para incrementar (padrão: 1)
 */
export async function incrementTeamContentCounter(teamId: string, increment: number = 1) {
  try {
    await prisma.$executeRaw`
      UPDATE "Team" 
      SET "totalContents" = COALESCE("totalContents", 0) + ${increment}
      WHERE id = ${teamId}
    `;
  } catch (error) {
    console.error('Erro ao incrementar contador de conteúdos:', error);
    // Não lançar erro para não quebrar o fluxo principal
  }
}

/**
 * Incrementa o contador de marcas de uma equipe
 * @param teamId ID da equipe
 * @param increment Valor para incrementar (padrão: 1)
 */
export async function incrementTeamBrandCounter(teamId: string, increment: number = 1) {
  try {
    await prisma.$executeRaw`
      UPDATE "Team" 
      SET "totalBrands" = COALESCE("totalBrands", 0) + ${increment}
      WHERE id = ${teamId}
    `;
  } catch (error) {
    console.error('Erro ao incrementar contador de marcas:', error);
    // Não lançar erro para não quebrar o fluxo principal
  }
}

/**
 * Decrementa o contador de conteúdos de uma equipe
 * @param teamId ID da equipe
 * @param decrement Valor para decrementar (padrão: 1)
 */
export async function decrementTeamContentCounter(teamId: string, decrement: number = 1) {
  try {
    await prisma.$executeRaw`
      UPDATE "Team" 
      SET "totalContents" = GREATEST(COALESCE("totalContents", 0) - ${decrement}, 0)
      WHERE id = ${teamId}
    `;
  } catch (error) {
    console.error('Erro ao decrementar contador de conteúdos:', error);
    // Não lançar erro para não quebrar o fluxo principal
  }
}

/**
 * Decrementa o contador de marcas de uma equipe
 * @param teamId ID da equipe
 * @param decrement Valor para decrementar (padrão: 1)
 */
export async function decrementTeamBrandCounter(teamId: string, decrement: number = 1) {
  try {
    await prisma.$executeRaw`
      UPDATE "Team" 
      SET "totalBrands" = GREATEST(COALESCE("totalBrands", 0) - ${decrement}, 0)
      WHERE id = ${teamId}
    `;
  } catch (error) {
    console.error('Erro ao decrementar contador de marcas:', error);
    // Não lançar erro para não quebrar o fluxo principal
  }
}

/**
 * Recalcula os contadores baseado nos dados existentes
 * Útil para inicializar os contadores ou corrigir inconsistências
 * @param teamId ID da equipe
 */
export async function recalculateTeamCounters(teamId: string) {
  try {
    // Contar conteúdos aprovados
    const totalContents = await prisma.action.count({
      where: {
        teamId: teamId,
        approved: true
      }
    });

    // Contar marcas ativas
    const totalBrands = await prisma.brand.count({
      where: {
        teamId: teamId
      }
    });

    // Atualizar os contadores usando raw SQL
    await prisma.$executeRaw`
      UPDATE "Team" 
      SET "totalContents" = ${totalContents}, "totalBrands" = ${totalBrands}
      WHERE id = ${teamId}
    `;

    return { totalContents, totalBrands };
  } catch (error) {
    console.error('Erro ao recalcular contadores:', error);
    throw error;
  }
}

/**
 * Inicializa contadores para todas as equipes
 * Executa apenas uma vez para migrar dados existentes
 */
export async function initializeAllTeamCounters() {
  try {
    const teams = await prisma.team.findMany({
      select: { id: true }
    });

    const results = [];
    for (const team of teams) {
      const counters = await recalculateTeamCounters(team.id);
      results.push({ teamId: team.id, ...counters });
    }

    return results;
  } catch (error) {
    console.error('Erro ao inicializar contadores de todas as equipes:', error);
    throw error;
  }
}
