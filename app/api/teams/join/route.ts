import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { userId, code } = await req.json();
  
  if (!userId || !code) {
    return NextResponse.json({ error: 'userId and code are required' }, { status: 400 });
  }

  try {
    const team = await prisma.team.findUnique({ where: { code } });
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user already has a pending or approved request
    const existingRequest = await prisma.joinRequest.findFirst({
      where: { 
        teamId: team.id, 
        userId,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return NextResponse.json({ error: 'You already have a pending request for this team' }, { status: 400 });
      } else {
        return NextResponse.json({ error: 'You are already a member of this team' }, { status: 400 });
      }
    }

    // Create join request
    await prisma.joinRequest.create({ 
      data: { teamId: team.id, userId } 
    });

    // Update user to pending status and associate with team
    await prisma.user.update({
      where: { id: userId },
      data: { teamId: team.id, status: 'PENDING' },
    });

    return NextResponse.json({ 
      message: 'Join request sent successfully',
      teamName: team.name 
    });
  } catch (error) {
    console.error('Join team error', error);
    return NextResponse.json({ error: 'Join team failed' }, { status: 500 });
  }
}
