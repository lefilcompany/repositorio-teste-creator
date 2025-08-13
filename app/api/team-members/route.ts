import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }
  try {
    const members = await prisma.user.findMany({
      where: { teamId },
      select: { email: true, name: true },
    });
    return NextResponse.json(members);
  } catch (error) {
    console.error('Failed to fetch team members', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}
