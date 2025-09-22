// app/api/plans/validate-usage/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PlanValidations } from '@/lib/plan-validations';

export async function POST(request: Request) {
  try {
    const { teamId, planId } = await request.json();

    if (!teamId || !planId) {
      return NextResponse.json(
        { error: 'teamId e planId são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar dados do plano
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    // Buscar dados do time
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        brands: true,
        themes: true,
        personas: true,
        actions: {
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Primeiro dia do mês atual
              lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1) // Primeiro dia do próximo mês
            }
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Time não encontrado' },
        { status: 404 }
      );
    }

    // Contar uso mensal por tipo de ação
    const monthlyUsage = {
      quickContent: team.actions.filter(action => 
        action.type === 'CRIAR_CONTEUDO' && action.details && 
        (action.details as any).type === 'quick'
      ).length,
      customContent: team.actions.filter(action => 
        action.type === 'CRIAR_CONTEUDO' && action.details && 
        (action.details as any).type === 'custom'
      ).length,
      plans: team.actions.filter(action => action.type === 'PLANEJAR_CONTEUDO').length,
      reviews: team.actions.filter(action => action.type === 'REVISAR_CONTEUDO').length
    };

    // Preparar dados para validação
    const teamData = {
      memberCount: team.members.length,
      brandCount: team.brands.length,
      themeCount: team.themes.length,
      personaCount: team.personas.length,
      monthlyQuickContent: monthlyUsage.quickContent,
      monthlyCustomContent: monthlyUsage.customContent,
      monthlyPlans: monthlyUsage.plans,
      monthlyReviews: monthlyUsage.reviews
    };

    const planLimits = {
      maxMembers: plan.maxMembers,
      maxBrands: plan.maxBrands,
      maxStrategicThemes: plan.maxStrategicThemes,
      maxPersonas: plan.maxPersonas,
      quickContentCreations: plan.quickContentCreations,
      customContentSuggestions: plan.customContentSuggestions,
      contentPlans: plan.contentPlans,
      contentReviews: plan.contentReviews
    };

    // Executar validação
    const validation = PlanValidations.validatePlanUsage(teamData, planLimits);

    // Calcular percentuais de uso
    const usagePercentages = {
      members: Math.round((teamData.memberCount / planLimits.maxMembers) * 100),
      brands: Math.round((teamData.brandCount / planLimits.maxBrands) * 100),
      themes: Math.round((teamData.themeCount / planLimits.maxStrategicThemes) * 100),
      personas: Math.round((teamData.personaCount / planLimits.maxPersonas) * 100),
      quickContent: Math.round((teamData.monthlyQuickContent / planLimits.quickContentCreations) * 100),
      customContent: Math.round((teamData.monthlyCustomContent / planLimits.customContentSuggestions) * 100),
      plans: Math.round((teamData.monthlyPlans / planLimits.contentPlans) * 100),
      reviews: Math.round((teamData.monthlyReviews / planLimits.contentReviews) * 100)
    };

    return NextResponse.json({
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
      usage: {
        current: teamData,
        limits: planLimits,
        percentages: usagePercentages
      },
      plan: {
        id: plan.id,
        name: plan.name,
        displayName: plan.displayName
      }
    });

  } catch (error) {
    console.error('Erro ao validar uso do plano:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}