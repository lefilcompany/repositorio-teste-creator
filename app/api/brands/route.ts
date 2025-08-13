import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }
  try {
    const brands = await prisma.brand.findMany({ where: { teamId } });
    return NextResponse.json(brands);
  } catch (error) {
    console.error('Fetch brands error', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const data = await req.json();
  try {
    const brand = await prisma.brand.create({ data });
    return NextResponse.json(brand);
  } catch (error) {
    console.error('Create brand error', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}
