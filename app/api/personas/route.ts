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
    console.error('Fetch personas error', error);
    return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const data = await req.json();
  try {
    const persona = await prisma.persona.create({ data });
    return NextResponse.json(persona);
  } catch (error) {
    console.error('Create persona error', error);
    return NextResponse.json({ error: 'Failed to create persona' }, { status: 500 });
  }
}
