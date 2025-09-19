// app/api/teams/[id]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const isSummary = searchParams.get('summary') === 'true';

    if (isSummary) {
      const team = await prisma.team.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          name: true,
          displayCode: true,
          currentPlan: true, // Usar currentPlan em vez de plan
          credits: true,
          _count: {
            select: {
              brands: true,
              actions: true,
            },
          },
        },
      });

      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }

      const transformedTeam = {
        id: team.id,
        name: team.name,
        code: team.displayCode,
        admin: '', 
        members: [], 
        pending: [], 
        plan: team.currentPlan, // Usar currentPlan em vez de plan
        credits: team.credits,
        totalBrands: team._count.brands,
        totalContents: team._count.actions,
      };

      return NextResponse.json(transformedTeam);
    }
    
    const [teamData, members, pendingRequests] = await Promise.all([
      prisma.team.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          name: true,
          displayCode: true,
          currentPlan: true, // Usar currentPlan em vez de plan
          credits: true,
          admin: { select: { email: true } },
          _count: {
            select: { brands: true, actions: true },
          },
        },
      }),
      prisma.user.findMany({
        where: { teamId: params.id },
        select: { email: true },
      }),
      prisma.joinRequest.findMany({
        where: { teamId: params.id, status: 'PENDING' },
        select: {
          user: { select: { email: true } },
        },
      }),
    ]);

    if (!teamData) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const transformedTeam = {
      id: teamData.id,
      name: teamData.name,
      code: teamData.displayCode,
      admin: teamData.admin.email,
      members: members.map(member => member.email),
      pending: pendingRequests.map(request => request.user.email),
      plan: teamData.currentPlan, // Usar currentPlan em vez de plan
      credits: teamData.credits,
      totalBrands: teamData._count.brands,
      totalContents: teamData._count.actions,
    };

    return NextResponse.json(transformedTeam);
  } catch (error) {
    console.error("Erro ao buscar equipe:", error);
    return NextResponse.json({ error: 'Erro ao buscar equipe' }, { status: 500 });
  }
}