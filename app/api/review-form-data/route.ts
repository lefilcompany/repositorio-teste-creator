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
    const [team, brands, themes] = await Promise.all([
      prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true },
      }),
      prisma.brand.findMany({
        where: { teamId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.strategicTheme.findMany({
        where: { teamId },
        select: { id: true, title: true, brandId: true },
        orderBy: { title: 'asc' },
      }),
    ]);

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({ team, brands, themes });
  } catch (error) {
    console.error('Failed to fetch review form data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review form data' },
      { status: 500 }
    );
  }
}