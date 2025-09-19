import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  
  try {
    // Buscar team onde o usuário é membro ou admin
    const userWithTeam = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: {
          include: {
            admin: {
              select: {
                id: true,
                email: true,
                name: true,
              }
            },
            members: {
              select: {
                id: true,
                email: true,
                name: true,
              }
            },
            joinRequests: {
              where: {
                status: 'PENDING'
              },
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  }
                }
              }
            }
          }
        },
        adminTeams: {
          include: {
            admin: {
              select: {
                id: true,
                email: true,
                name: true,
              }
            },
            members: {
              select: {
                id: true,
                email: true,
                name: true,
              }
            },
            joinRequests: {
              where: {
                status: 'PENDING'
              },
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!userWithTeam) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Retornar o team onde o usuário é membro ou admin
    const team = userWithTeam.team || userWithTeam.adminTeams[0];
    
    if (!team) {
      return NextResponse.json({ teams: [] });
    }
    
    // Transform the data to match the expected Team interface
    const transformedTeam = {
      id: team.id,
      name: team.name,
      code: team.displayCode,
      admin: team.admin.email,
      members: team.members.map(member => member.email),
      pending: team.joinRequests.map(request => request.user.email),
      plan: team.plan,
      planKey: team.planKey,
      subscriptionStatus: team.subscriptionStatus,
      trialEndsAt: team.trialEndsAt,
      credits: team.credits
    };

    return NextResponse.json([transformedTeam]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const data = await req.json();
    const { id, credits, plan, planKey, subscriptionStatus, trialEndsAt, ...otherData } = data;

    if (!id) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const updateData: Record<string, any> = {
      ...otherData,
    };

    if (typeof credits !== 'undefined') updateData.credits = credits;
    if (typeof plan !== 'undefined') updateData.plan = plan;
    if (typeof planKey !== 'undefined') updateData.planKey = planKey;
    if (typeof subscriptionStatus !== 'undefined') updateData.subscriptionStatus = subscriptionStatus;
    if (typeof trialEndsAt !== 'undefined') {
      updateData.trialEndsAt = trialEndsAt ? new Date(trialEndsAt) : null;
    }

    // Atualizar o team
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        },
        members: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        },
        joinRequests: {
          where: {
            status: 'PENDING'
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              }
            }
          }
        }
      }
    });
    
    // Transform the data to match the expected Team interface
    const transformedTeam = {
      id: updatedTeam.id,
      name: updatedTeam.name,
      code: updatedTeam.displayCode,
      admin: updatedTeam.admin.email,
      members: updatedTeam.members.map(member => member.email),
      pending: updatedTeam.joinRequests.map(request => request.user.email),
      plan: updatedTeam.plan,
      planKey: updatedTeam.planKey,
      subscriptionStatus: updatedTeam.subscriptionStatus,
      trialEndsAt: updatedTeam.trialEndsAt,
      credits: updatedTeam.credits
    };

    return NextResponse.json(transformedTeam);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

