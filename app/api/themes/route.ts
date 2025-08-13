import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }
  try {
    const themes = await prisma.strategicTheme.findMany({ where: { teamId } });
    return NextResponse.json(themes);
  } catch (error) {
    console.error('Fetch themes error', error);
    return NextResponse.json({ error: 'Failed to fetch themes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const data = await req.json();
  try {
    const theme = await prisma.strategicTheme.create({ data });
    return NextResponse.json(theme);
  } catch (error) {
    console.error('Create theme error', error);
    return NextResponse.json({ error: 'Failed to create theme' }, { status: 500 });
  }
}
