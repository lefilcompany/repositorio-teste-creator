// app/api/teams/[id]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        admin: {
          select: { email: true }
        },
        members: {
          select: { email: true }
        },
        joinRequests: {
          where: { status: 'PENDING' },
          select: {
            id: true,
            user: {
              select: { email: true }
            }
          }
        },
        _count: {
          select: {
            brands: true,
            actions: true 
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const transformedTeam = {
      id: team.id,
      name: team.name,
      code: team.displayCode,
      admin: team.admin.email,
      members: team.members.map(member => member.email),
      pending: team.joinRequests.map(request => request.user.email),
      plan: team.plan,
      credits: team.credits,
      totalBrands: team._count.brands,
      totalContents: team._count.actions,
    };

    return NextResponse.json(transformedTeam);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar equipe' }, { status: 500 });
  }
}