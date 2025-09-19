import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canTeamCreatePersona } from '@/lib/subscription-utils';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const summary = searchParams.get('summary') === 'true';
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }
  try {
    if (summary) {
      const personas = await prisma.persona.findMany({
        where: { teamId },
        select: { id: true, brandId: true, name: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return NextResponse.json(personas);
    }
    const personas = await prisma.persona.findMany({ where: { teamId } });
    return NextResponse.json(personas);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { teamId, userId, ...personaData } = data;
    
    // Validações básicas
    if (!teamId || !userId) {
      return NextResponse.json({ error: 'teamId and userId are required' }, { status: 400 });
    }

    // Validações dos campos obrigatórios
    if (!personaData.brandId || !personaData.name || !personaData.mainGoal || !personaData.challenges) {
      return NextResponse.json({ 
        error: 'brandId, name, mainGoal and challenges are required' 
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

    // Verificar limite de personas usando o novo sistema
    const currentPersonasCount = await prisma.persona.count({
      where: { teamId: teamId }
    });

    const canCreate = await canTeamCreatePersona(teamId, currentPersonasCount);
    if (!canCreate.canCreate) {
      return NextResponse.json({ 
        error: canCreate.reason || 'Limite de personas atingido'
      }, { status: 400 });
    }

    // Preparar dados da persona com valores padrão para campos opcionais
    const personaDataWithDefaults = {
      ...personaData,
      professionalContext: personaData.professionalContext || '',
      beliefsAndInterests: personaData.beliefsAndInterests || '',
      contentConsumptionRoutine: personaData.contentConsumptionRoutine || '',
      preferredToneOfVoice: personaData.preferredToneOfVoice || '',
      purchaseJourneyStage: personaData.purchaseJourneyStage || '',
      interestTriggers: personaData.interestTriggers || '',
      teamId,
      userId
    };

    // Criar a persona
    const persona = await prisma.persona.create({ 
      data: personaDataWithDefaults
    });
    return NextResponse.json(persona);
  } catch (error) {
    console.error('Error creating persona:', error);
    return NextResponse.json({ error: 'Failed to create persona' }, { status: 500 });
  }
}

