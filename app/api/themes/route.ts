import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canTeamCreateTheme } from '@/lib/subscription-utils';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const summary = searchParams.get('summary') === 'true';
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }
  try {
    if (summary) {
      const themes = await prisma.strategicTheme.findMany({
        where: { teamId },
        select: { id: true, brandId: true, title: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return NextResponse.json(themes);
    }
    const themes = await prisma.strategicTheme.findMany({ where: { teamId } });
    return NextResponse.json(themes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch themes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { teamId, userId, ...themeData } = data;
    
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

    // Verificar limite de temas usando o novo sistema
    const currentThemesCount = await prisma.strategicTheme.count({
      where: { teamId: teamId }
    });

    const canCreate = await canTeamCreateTheme(teamId, currentThemesCount);
    if (!canCreate.canCreate) {
      return NextResponse.json({ 
        error: canCreate.reason || 'Limite de temas estratégicos atingido'
      }, { status: 400 });
    }

    // Garantir que colorPalette seja uma string JSON válida
    const colorPalette = typeof themeData.colorPalette === 'string'
      ? themeData.colorPalette
      : JSON.stringify(themeData.colorPalette || []);

    // Criar o tema com a paleta de cores validada
    const theme = await prisma.strategicTheme.create({ 
      data: {
        ...themeData,
        colorPalette,
        teamId,
        userId
      } 
    });
    return NextResponse.json(theme);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create theme' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id, ...themeData } = data;

    if (!id) {
      return NextResponse.json({ error: 'Theme ID is required' }, { status: 400 });
    }

    // Garantir que colorPalette seja uma string JSON válida
    const colorPalette = typeof themeData.colorPalette === 'string'
      ? themeData.colorPalette
      : JSON.stringify(themeData.colorPalette || []);

    // Atualizar o tema com a paleta de cores validada
    const theme = await prisma.strategicTheme.update({
      where: { id },
      data: {
        ...themeData,
        colorPalette
      }
    });

    return NextResponse.json(theme);
  } catch (error) {
    console.error('Error updating theme:', error);
    return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 });
  }
}
