import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { incrementTeamBrandCounter } from '@/lib/team-counters';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }
  
  try {
    // Buscar todos os campos necessários para edição
    const brands = await prisma.brand.findMany({ 
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limitar resultados
    });
    
    return NextResponse.json(brands);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { teamId, userId, ...brandData } = data;
    
    // Validações básicas
    if (!teamId || !userId) {
      return NextResponse.json({ error: 'teamId and userId are required' }, { status: 400 });
    }
    
    if (!brandData.name || !brandData.responsible) {
      return NextResponse.json({ error: 'name and responsible are required' }, { status: 400 });
    }
    
    // Verificar se o usuário pertence à equipe e buscar dados da equipe
    const user = await prisma.user.findFirst({
      where: { 
        id: userId, 
        teamId: teamId 
      },
      include: {
        team: true
      }
    });
    
    if (!user || !user.team) {
      return NextResponse.json({ error: 'User not found or not part of the team' }, { status: 403 });
    }

    // Verificar limite de marcas do plano
    if (typeof user.team.plan === 'object' && user.team.plan && !Array.isArray(user.team.plan)) {
      const teamPlan = user.team.plan as any;
      if (teamPlan.limits) {
        const currentBrandsCount = await prisma.brand.count({
          where: { teamId: teamId }
        });

        if (currentBrandsCount >= teamPlan.limits.brands) {
          return NextResponse.json({ 
            error: `Limite de marcas do plano ${teamPlan.name} atingido. Você pode criar até ${teamPlan.limits.brands} marca(s).` 
          }, { status: 400 });
        }
      }
    }
    
    // Criar a marca
    const brand = await prisma.brand.create({ 
      data: {
        ...brandData,
        teamId,
        userId,
        // Garantir que os campos obrigatórios do schema estão preenchidos
        segment: brandData.segment || '',
        values: brandData.values || '',
        keywords: brandData.keywords || '',
        goals: brandData.goals || '',
        inspirations: brandData.inspirations || '',
        successMetrics: brandData.successMetrics || '',
        references: brandData.references || '',
        specialDates: brandData.specialDates || '',
        promise: brandData.promise || '',
        crisisInfo: brandData.crisisInfo || '',
        milestones: brandData.milestones || '',
        collaborations: brandData.collaborations || '',
        restrictions: brandData.restrictions || '',
      }
    });

    // Incrementar contador de marcas da equipe
    setTimeout(async () => {
      try {
        await incrementTeamBrandCounter(teamId);
      } catch (error) {
        }
    }, 0);
    
    return NextResponse.json(brand);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}

