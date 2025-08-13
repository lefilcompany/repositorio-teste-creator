import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { userId, code } = await req.json();
  try {
    const team = await prisma.team.findUnique({ where: { code } });
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    await prisma.joinRequest.create({ data: { teamId: team.id, userId } });
    await prisma.user.update({
      where: { id: userId },
      data: { teamId: team.id, role: 'MEMBER', status: 'PENDING' },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Join team error', error);
    return NextResponse.json({ error: 'Join team failed' }, { status: 500 });
  }
}
