import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { incrementTeamBrandCounter } from '@/lib/team-counters';
import { canTeamCreateBrand } from '@/lib/subscription-utils';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const summary = searchParams.get('summary') === 'true';
  
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }
  
  try {
    if (summary) {
      const brands = await prisma.brand.findMany({
        where: { teamId },
        select: {
          id: true,
          name: true,
          responsible: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return NextResponse.json(brands);
    }

    const brands = await prisma.brand.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: 50,
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
    
    // Validações de campos obrigatórios
    const requiredFields = [
      { field: 'name', label: 'Nome da marca' },
      { field: 'responsible', label: 'Responsável da marca' },
      { field: 'segment', label: 'Segmento' },
      { field: 'values', label: 'Valores' },
      { field: 'goals', label: 'Metas de negócio' },
      { field: 'successMetrics', label: 'Indicadores de sucesso' },
      { field: 'references', label: 'Conteúdos de referência' },
      { field: 'promise', label: 'Promessa única' },
      { field: 'restrictions', label: 'Restrições' },
      { field: 'moodboard', label: 'Moodboard' },
      { field: 'logo', label: 'Logo da marca' }
    ];

    const missingFields = requiredFields.filter(({ field }) => {
      if (field === 'moodboard') {
        return !brandData.moodboard;
      }
      if (field === 'logo') {
        return !brandData.logo;
      }
      return !brandData[field] || brandData[field].toString().trim() === '';
    });

    if (missingFields.length > 0) {
      const fieldsList = missingFields.map(({ label }) => label).join(', ');
      return NextResponse.json({ 
        error: `Os seguintes campos são obrigatórios: ${fieldsList}` 
      }, { status: 400 });
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

    // Verificar limite de marcas usando o novo sistema
    const currentBrandsCount = await prisma.brand.count({
      where: { teamId: teamId }
    });

    const canCreate = await canTeamCreateBrand(teamId, currentBrandsCount);
    if (!canCreate.canCreate) {
      return NextResponse.json({ 
        error: canCreate.reason || 'Limite de marcas atingido'
      }, { status: 400 });
    }
    
    // Criar a marca
    const brand = await prisma.brand.create({ 
      data: {
        ...brandData,
        teamId,
        userId,
        // Garantir que os campos obrigatórios do schema estão preenchidos
        segment: brandData.segment,
        values: brandData.values,
        keywords: brandData.keywords || '',
        goals: brandData.goals,
        inspirations: brandData.inspirations || '',
        successMetrics: brandData.successMetrics,
        references: brandData.references,
        specialDates: brandData.specialDates || '',
        promise: brandData.promise,
        crisisInfo: brandData.crisisInfo || '',
        milestones: brandData.milestones || '',
        collaborations: brandData.collaborations || '',
        restrictions: brandData.restrictions,
        moodboard: brandData.moodboard || null,
        logo: brandData.logo || null,
        referenceImage: brandData.referenceImage || null,
        colorPalette: brandData.colorPalette || null, // Adicionado campo de paleta de cores
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

