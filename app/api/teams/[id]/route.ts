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
          select: {
            email: true
          }
        },
        members: {
          select: {
            email: true
          }
        },
        joinRequests: {
          where: {
            status: 'PENDING'
          },
          select: {
            id: true,
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    });
    
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Transform the data to match the expected Team interface
    const transformedTeam = {
      id: team.id,
      name: team.name,
      code: team.code,
      admin: team.admin.email,
      members: team.members.map(member => member.email),
      pending: team.joinRequests.map(request => request.user.email),
      plan: team.plan,
      credits: team.credits
    };

    return NextResponse.json(transformedTeam);
  } catch (error) {
    console.error('Fetch team error', error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}
