// app/api/teams/[id]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const isSummary = searchParams.get('summary') === 'true';

    if (isSummary) {
      const team = await prisma.team.findUnique({
        where: { id: params.id },
        include: {
          subscriptions: {
            where: { isActive: true },
            include: { plan: true },
            take: 1
          },
          currentPlan: true,
          _count: {
            select: {
              brands: true,
              actions: true,
            },
          },
        },
      });

      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }

      // Buscar plano através da subscription ativa
      const activeSubscription = team.subscriptions[0];
      const planLimits = activeSubscription?.plan || team.currentPlan;

      // Calcular créditos usados baseado nas actions
      const usedCredits = await prisma.action.groupBy({
        by: ['type'],
        where: {
          teamId: team.id,
          approved: true
        },
        _count: {
          id: true
        }
      });

      // Mapear types para créditos
      const creditUsage = {
        quickContentCreations: usedCredits.find(u => u.type === 'CRIAR_CONTEUDO')?._count.id || 0,
        contentSuggestions: 0, // Implementar quando houver type específico
        contentReviews: usedCredits.find(u => u.type === 'REVISAR_CONTEUDO')?._count.id || 0,
        contentPlans: usedCredits.find(u => u.type === 'PLANEJAR_CONTEUDO')?._count.id || 0
      };

      // Calcular créditos restantes
      const remainingCredits = planLimits ? {
        quickContentCreations: Math.max(0, planLimits.quickContentCreations - creditUsage.quickContentCreations),
        contentSuggestions: Math.max(0, planLimits.customContentSuggestions - creditUsage.contentSuggestions),
        contentReviews: Math.max(0, planLimits.contentReviews - creditUsage.contentReviews),
        contentPlans: Math.max(0, planLimits.contentPlans - creditUsage.contentPlans)
      } : {
        quickContentCreations: 5,
        contentSuggestions: 15,
        contentReviews: 10,
        contentPlans: 5
      };

      const transformedTeam = {
        id: team.id,
        name: team.name,
        code: team.displayCode,
        admin: '', 
        members: [], 
        pending: [], 
        plan: planLimits ? {
          quickContentCreations: planLimits.quickContentCreations,
          customContentSuggestions: planLimits.customContentSuggestions,
          contentReviews: planLimits.contentReviews,
          contentPlans: planLimits.contentPlans
        } : null,
        credits: remainingCredits,
        totalBrands: team._count.brands,
        totalContents: team._count.actions,
      };

      return NextResponse.json(transformedTeam);
    }
    
    const [teamData, members, pendingRequests] = await Promise.all([
      prisma.team.findUnique({
        where: { id: params.id },
        include: {
          subscriptions: {
            where: { isActive: true },
            include: { plan: true },
            take: 1
          },
          currentPlan: true,
          admin: { select: { email: true } },
          _count: {
            select: { brands: true, actions: true },
          },
        },
      }),
      prisma.user.findMany({
        where: { teamId: params.id },
        select: { email: true },
      }),
      prisma.joinRequest.findMany({
        where: { teamId: params.id, status: 'PENDING' },
        select: {
          user: { select: { email: true } },
        },
      }),
    ]);

    if (!teamData) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Buscar plano através da subscription ativa
    const activeSubscription = teamData.subscriptions[0];
    const planLimits = activeSubscription?.plan || teamData.currentPlan;

    // Calcular créditos usados baseado nas actions
    const usedCredits = await prisma.action.groupBy({
      by: ['type'],
      where: {
        teamId: teamData.id,
        approved: true
      },
      _count: {
        id: true
      }
    });

    // Mapear types para créditos
    const creditUsage = {
      quickContentCreations: usedCredits.find(u => u.type === 'CRIAR_CONTEUDO')?._count.id || 0,
      contentSuggestions: 0, // Implementar quando houver type específico
      contentReviews: usedCredits.find(u => u.type === 'REVISAR_CONTEUDO')?._count.id || 0,
      contentPlans: usedCredits.find(u => u.type === 'PLANEJAR_CONTEUDO')?._count.id || 0
    };

    // Calcular créditos restantes
    const remainingCredits = planLimits ? {
      quickContentCreations: Math.max(0, planLimits.quickContentCreations - creditUsage.quickContentCreations),
      contentSuggestions: Math.max(0, planLimits.customContentSuggestions - creditUsage.contentSuggestions),
      contentReviews: Math.max(0, planLimits.contentReviews - creditUsage.contentReviews),
      contentPlans: Math.max(0, planLimits.contentPlans - creditUsage.contentPlans)
    } : {
      quickContentCreations: 5,
      contentSuggestions: 15,
      contentReviews: 10,
      contentPlans: 5
    };

    const transformedTeam = {
      id: teamData.id,
      name: teamData.name,
      code: teamData.displayCode,
      admin: teamData.admin.email,
      members: members.map(member => member.email),
      pending: pendingRequests.map(request => request.user.email),
      plan: planLimits ? {
        quickContentCreations: planLimits.quickContentCreations,
        customContentSuggestions: planLimits.customContentSuggestions,
        contentReviews: planLimits.contentReviews,
        contentPlans: planLimits.contentPlans
      } : null,
      credits: remainingCredits,
      totalBrands: teamData._count.brands,
      totalContents: teamData._count.actions,
    };

    return NextResponse.json(transformedTeam);
  } catch (error) {
    console.error("Erro ao buscar equipe:", error);
    return NextResponse.json({ error: 'Erro ao buscar equipe' }, { status: 500 });
  }
}