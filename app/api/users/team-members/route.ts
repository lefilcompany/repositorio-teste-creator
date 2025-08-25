import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const excludeUserId = searchParams.get('excludeUserId');
  
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }
  
  try {
    const members = await prisma.user.findMany({
      where: {
        teamId,
        status: 'ACTIVE',
        ...(excludeUserId && { id: { not: excludeUserId } })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get team members' }, { status: 500 });
  }
}

