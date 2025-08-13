import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const team = await prisma.team.findUnique({ where: { id: params.id } });
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    return NextResponse.json(team);
  } catch (error) {
    console.error('Fetch team error', error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}
