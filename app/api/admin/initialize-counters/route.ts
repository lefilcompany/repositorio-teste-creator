import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API para inicializar os contadores das equipes
 * Deve ser executada apenas uma vez para migrar dados existentes
 */
export async function POST(req: Request) {
  try {
    const { teamId } = await req.json();
    
    if (teamId) {
      // Recalcular contadores para uma equipe específica
      const totalContents = await prisma.action.count({
        where: {
          teamId: teamId,
          approved: true
        }
      });

      const totalBrands = await prisma.brand.count({
        where: {
          teamId: teamId
        }
      });

      const updatedTeam = await prisma.$executeRaw`
        UPDATE "Team" 
        SET "totalContents" = ${totalContents}, "totalBrands" = ${totalBrands}
        WHERE id = ${teamId}
      `;

      return NextResponse.json({ 
        teamId, 
        totalContents, 
        totalBrands,
        message: 'Contadores atualizados com sucesso' 
      });
    } else {
      // Inicializar contadores para todas as equipes
      const teams = await prisma.team.findMany({
        select: { id: true }
      });

      const results = [];
      for (const team of teams) {
        const totalContents = await prisma.action.count({
          where: {
            teamId: team.id,
            approved: true
          }
        });

        const totalBrands = await prisma.brand.count({
          where: {
            teamId: team.id
          }
        });

        await prisma.$executeRaw`
          UPDATE "Team" 
          SET "totalContents" = ${totalContents}, "totalBrands" = ${totalBrands}
          WHERE id = ${team.id}
        `;

        results.push({ teamId: team.id, totalContents, totalBrands });
      }

      return NextResponse.json({ 
        results,
        message: `Contadores inicializados para ${results.length} equipes` 
      });
    }
  } catch (error) {
    console.error('Erro ao inicializar contadores:', error);
    return NextResponse.json({ error: 'Falha ao inicializar contadores' }, { status: 500 });
  }
}
