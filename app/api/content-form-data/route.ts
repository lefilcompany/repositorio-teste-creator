// app/api/content-form-data/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const userId = searchParams.get('userId');

  if (!teamId || !userId) {
    return NextResponse.json(
      { error: 'teamId and userId are required' },
      { status: 400 }
    );
  }

  try {
    // 🚀 Executa todas as buscas no banco de dados em paralelo!
    const [team, brands, themes, personas] = await Promise.all([
      // Busca dados da equipe (para os créditos)
      prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true, credits: true },
      }),
      // Busca apenas o essencial das marcas
      prisma.brand.findMany({
        where: { teamId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      // Busca apenas o essencial dos temas
      prisma.strategicTheme.findMany({
        where: { teamId },
        select: { id: true, title: true, brandId: true },
        orderBy: { title: 'asc' },
      }),
      // Busca apenas o essencial das personas
      prisma.persona.findMany({
        where: { teamId },
        select: { id: true, name: true, brandId: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({
      team,
      brands,
      themes,
      personas,
    });
  } catch (error) {
    console.error('Failed to fetch form data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form data' },
      { status: 500 }
    );
  }
}