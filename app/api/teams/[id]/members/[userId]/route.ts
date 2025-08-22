import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const teamId = params.id;
    const userId = params.userId;

    // Verify that the user is actually a member of this team
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        teamId: teamId,
        status: 'ACTIVE'
      }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found or not an active member of this team' 
      }, { status: 404 });
    }

    // Get team info to check if user is admin
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { adminId: true }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Prevent removing the admin
    if (user.id === team.adminId) {
      return NextResponse.json({ 
        error: 'Cannot remove team administrator' 
      }, { status: 400 });
    }

    // Remove user from team and clean up old join requests
    await prisma.$transaction(async (tx) => {
      // Update user status
      await tx.user.update({
        where: { id: userId },
        data: {
          teamId: null,
          status: 'NO_TEAM',
          role: UserRole.WITHOUT_TEAM // Role específica para usuários sem equipe
        }
      });

      // Remove any existing join requests for this user and team to allow re-entry
      await tx.joinRequest.deleteMany({
        where: {
          userId: userId,
          teamId: teamId
        }
      });
    }, {
      maxWait: 10000, // 10 segundos para aguardar conexão
      timeout: 10000, // 10 segundos para executar a transação
    });

    return NextResponse.json({ 
      message: 'User removed from team successfully',
      userId: userId
    });

  } catch (error) {
    console.error('Remove team member error', error);
    return NextResponse.json({ 
      error: 'Failed to remove team member' 
    }, { status: 500 });
  }
}
