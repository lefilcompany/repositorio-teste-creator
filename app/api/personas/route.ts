import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }
  try {
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

    // Verificar limite de personas do plano
    if (typeof user.team.plan === 'object' && user.team.plan && !Array.isArray(user.team.plan)) {
      const teamPlan = user.team.plan as any;
      if (teamPlan.limits) {
        const currentPersonasCount = await prisma.persona.count({
          where: { teamId: teamId }
        });

        if (currentPersonasCount >= teamPlan.limits.personas) {
          return NextResponse.json({ 
            error: `Limite de personas do plano ${teamPlan.name} atingido. Você pode criar até ${teamPlan.limits.personas} persona(s).` 
          }, { status: 400 });
        }
      }
    }

    // Criar a persona
    const persona = await prisma.persona.create({ 
      data: {
        ...personaData,
        teamId,
        userId
      } 
    });
    return NextResponse.json(persona);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create persona' }, { status: 500 });
  }
}

