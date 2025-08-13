import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { userId, name, code, plan, credits } = await req.json();
  try {
    const existing = await prisma.team.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'Code already in use' }, { status: 400 });
    }
    const team = await prisma.team.create({
      data: {
        name,
        code,
        adminId: userId,
        plan: plan ?? {},
        credits: credits ?? {},
        members: {
          connect: { id: userId },
        },
      },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { teamId: team.id, role: 'ADMIN', status: 'ACTIVE' },
    });
    return NextResponse.json(team);
  } catch (error) {
    console.error('Create team error', error);
    return NextResponse.json({ error: 'Team creation failed' }, { status: 500 });
  }
}
