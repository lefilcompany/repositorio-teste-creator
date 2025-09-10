import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { notifyTeamJoinApproved, notifyTeamJoinRejected } from '@/lib/notifications';

export async function PATCH(
  req: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const { action, userId, teamId } = await req.json();
    const requestId = params.requestId;
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // First, get the join request to ensure it exists and is pending
    const joinRequest = await prisma.joinRequest.findFirst({
      where: {
        id: requestId,
        status: 'PENDING'
      }
    });

    if (!joinRequest) {
      return NextResponse.json({ error: 'Join request not found or already processed' }, { status: 404 });
    }

    if (action === 'approve') {
      // Buscar informações da equipe para a notificação
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { name: true }
      });

      // Update the join request status
      await prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' }
      });

      // Update the user's status to ACTIVE
      await prisma.user.update({
        where: { id: userId },
        data: { 
          status: 'ACTIVE',
          teamId: teamId,
          role: UserRole.MEMBER
        }
      });

      // Criar notificação para o usuário aprovado
      if (team) {
        await notifyTeamJoinApproved(userId, teamId, team.name);
      }

      return NextResponse.json({ 
        message: 'User approved and added to team',
        action: 'approved'
      });
    } else {
      // Buscar informações da equipe para a notificação
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { name: true }
      });

      // Reject the request
      await prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' }
      });

      // Remove user from team
      await prisma.user.update({
        where: { id: userId },
        data: { 
          teamId: null,
          status: 'NO_TEAM' // Usuário rejeitado volta ao status NO_TEAM
        }
      });

      // Criar notificação para o usuário rejeitado
      if (team) {
        await notifyTeamJoinRejected(userId, teamId, team.name);
      }

      return NextResponse.json({ 
        message: 'User request rejected',
        action: 'rejected'
      });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process join request' }, { status: 500 });
  }
}
